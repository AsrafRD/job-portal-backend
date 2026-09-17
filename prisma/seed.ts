import { PrismaClient, Role, JobType, JobStatus, ApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.applicationHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const company = await prisma.user.create({
    data: {
      name: 'Tech Corp Indonesia',
      email: 'hr@company.com',
      passwordHash: defaultPasswordHash,
      role: Role.COMPANY,
    },
  });

  const seeker1 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'seeker1@mail.com',
      passwordHash: defaultPasswordHash,
      role: Role.JOB_SEEKER,
    },
  });

  const seeker2 = await prisma.user.create({
    data: {
      name: 'Siti Rahma',
      email: 'seeker2@mail.com',
      passwordHash: defaultPasswordHash,
      role: Role.JOB_SEEKER,
    },
  });

  // 2. Create Jobs
  const jobBackend = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Senior Backend Engineer (NestJS)',
      description: 'Bertanggung jawab atas arsitektur microservices dan database PostgreSQL.',
      location: 'Jakarta / Remote',
      salary: 'Rp 18.000.000 - Rp 25.000.000',
      jobType: JobType.FULL_TIME,
      status: JobStatus.OPEN,
    },
  });

  const jobFrontend = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Frontend Developer (React + TS)',
      description: 'Mengembangkan UI dashboard dengan React, Tailwind, dan TanStack Query.',
      location: 'Bandung',
      salary: 'Rp 12.000.000 - Rp 16.000.000',
      jobType: JobType.FULL_TIME,
      status: JobStatus.OPEN,
    },
  });

  const jobClosed = await prisma.job.create({
    data: {
      companyId: company.id,
      title: 'DevOps Specialist',
      description: 'Posisi sudah terisi.',
      location: 'Jakarta',
      salary: 'Rp 15.000.000',
      jobType: JobType.CONTRACT,
      status: JobStatus.CLOSED,
    },
  });

  // 3. Create Applications & History Scenarios
  
  // Application 1: Budi -> Backend Engineer (Progressed: APPLIED -> REVIEWING -> SHORTLISTED)
  const app1 = await prisma.application.create({
    data: {
      jobId: jobBackend.id,
      applicantId: seeker1.id,
      status: ApplicationStatus.SHORTLISTED,
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app1.id,
        fromStatus: null,
        toStatus: ApplicationStatus.APPLIED,
        changedById: seeker1.id,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        applicationId: app1.id,
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.REVIEWING,
        changedById: company.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        applicationId: app1.id,
        fromStatus: ApplicationStatus.REVIEWING,
        toStatus: ApplicationStatus.SHORTLISTED,
        changedById: company.id,
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
  });

  // Application 2: Siti -> Backend Engineer (Rejected: APPLIED -> REVIEWING -> REJECTED)
  const app2 = await prisma.application.create({
    data: {
      jobId: jobBackend.id,
      applicantId: seeker2.id,
      status: ApplicationStatus.REJECTED,
    },
  });

  await prisma.applicationHistory.createMany({
    data: [
      {
        applicationId: app2.id,
        fromStatus: null,
        toStatus: ApplicationStatus.APPLIED,
        changedById: seeker2.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        applicationId: app2.id,
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.REVIEWING,
        changedById: company.id,
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        applicationId: app2.id,
        fromStatus: ApplicationStatus.REVIEWING,
        toStatus: ApplicationStatus.REJECTED,
        changedById: company.id,
        createdAt: new Date(),
      },
    ],
  });

  // Application 3: Siti -> Frontend Developer (Fresh Application)
  const app3 = await prisma.application.create({
    data: {
      jobId: jobFrontend.id,
      applicantId: seeker2.id,
      status: ApplicationStatus.APPLIED,
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: app3.id,
      fromStatus: null,
      toStatus: ApplicationStatus.APPLIED,
      changedById: seeker2.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });