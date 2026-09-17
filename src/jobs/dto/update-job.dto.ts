import { IsString, IsEnum, IsOptional } from 'class-validator';
import { JobType, JobStatus } from '@prisma/client';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;
  
  @IsString()
  @IsOptional()
  salary?: string;
  
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
