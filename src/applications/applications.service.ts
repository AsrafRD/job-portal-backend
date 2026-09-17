import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async apply(jobId: string, applicantId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status === 'CLOSED') throw new BadRequestException('Job is closed');

    const existing = await this.prisma.application.findUnique({
      where: { jobId_applicantId: { jobId, applicantId } },
    });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'APPLICATION_ALREADY_EXISTS',
        message: 'You have already applied to this job'
      });
    }

    return this.prisma.application.create({
      data: {
        jobId,
        applicantId,
        status: ApplicationStatus.APPLIED,
        histories: {
          create: {
            toStatus: ApplicationStatus.APPLIED,
            changedById: applicantId,
          }
        }
      },
      include: {
        job: true,
      }
    });
  }

  async getMyApplications(applicantId: string) {
    return this.prisma.application.findMany({
      where: { applicantId },
      include: {
        job: {
          include: { company: { select: { id: true, name: true } } }
        },
        histories: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getApplicants(jobId: string, companyId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.companyId !== companyId) throw new ForbiddenException('You can only view applicants for your own jobs');

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        histories: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateStatus(id: string, companyId: string, updateDto: UpdateApplicationStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });
    
    if (!application) throw new NotFoundException('Application not found');
    if (application.job.companyId !== companyId) throw new ForbiddenException('You can only update applications for your own jobs');
    
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      APPLIED: ['REVIEWING'],
      REVIEWING: ['SHORTLISTED', 'REJECTED'],
      SHORTLISTED: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: [],
      REJECTED: []
    };

    if (!validTransitions[application.status].includes(updateDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${application.status} to ${updateDto.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { status: updateDto.status }
      });

      await tx.applicationHistory.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: updateDto.status,
          changedById: companyId,
        }
      });

      return updated;
    });
  }

  async getHistory(id: string, userId: string, userRole: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) throw new NotFoundException('Application not found');
    
    if (userRole === 'JOB_SEEKER' && application.applicantId !== userId) {
      throw new ForbiddenException('Not your application');
    }
    if (userRole === 'COMPANY' && application.job.companyId !== userId) {
      throw new ForbiddenException('Not your job');
    }

    return this.prisma.applicationHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        changedBy: { select: { id: true, name: true, role: true } }
      }
    });
  }
}
