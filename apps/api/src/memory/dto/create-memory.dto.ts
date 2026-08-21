import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MemoryType } from '@prisma/client';

export class CreateMemoryDto {
  @IsEnum(MemoryType)
  type!: MemoryType;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  source?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
