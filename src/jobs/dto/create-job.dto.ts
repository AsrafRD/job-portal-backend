import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { JobType } from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(JobType)
  jobType: JobType;
  
  @IsString()
  @IsNotEmpty()
  salary: string;
}
