import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ApplicationsModule } from './applications/applications.module.js';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, JobsModule, ApplicationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
