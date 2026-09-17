import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { ApplicationsController } from './applications.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [ApplicationsService],
  controllers: [ApplicationsController]
})
export class ApplicationsModule {}
