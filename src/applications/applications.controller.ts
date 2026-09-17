import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.JOB_SEEKER)
  @Post('jobs/:id/apply')
  apply(@Param('id') jobId: string, @CurrentUser() user: any) {
    return this.applicationsService.apply(jobId, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.JOB_SEEKER)
  @Get('applications/me')
  getMyApplications(@CurrentUser() user: any) {
    return this.applicationsService.getMyApplications(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  @Get('jobs/:id/applicants')
  getApplicants(@Param('id') jobId: string, @CurrentUser() user: any) {
    return this.applicationsService.getApplicants(jobId, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  @Patch('applications/:id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('applications/:id/history')
  getHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.getHistory(id, user.id, user.role);
  }
}
