import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { JobQueryDto } from './dto/job-query.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createJobDto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        ...createJobDto,
        companyId,
      },
    });
  }

  async findAll(query: JobQueryDto) {
    const { page = 1, limit = 10, search, location, jobType, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (jobType) {
      where.jobType = jobType;
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async update(id: string, companyId: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);
    if (job.companyId !== companyId) {
      throw new ForbiddenException('You can only update your own jobs');
    }
    return this.prisma.job.update({
      where: { id },
      data: updateJobDto,
    });
  }

  async remove(id: string, companyId: string) {
    const job = await this.findOne(id);
    if (job.companyId !== companyId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }
    return this.prisma.job.delete({
      where: { id },
    });
  }
}
