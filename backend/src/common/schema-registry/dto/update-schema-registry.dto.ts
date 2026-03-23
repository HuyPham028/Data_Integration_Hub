import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSchemaRegistryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryKey?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  fieldsCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  recordsCount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dataFrom?: string;

  @IsOptional()
  @IsString()
  dataFromApi?: string;

  @IsOptional()
  @IsString()
  dataFromMethod?: string;

  @IsOptional()
  @IsArray()
  details?: Record<string, any>[];

  @IsOptional()
  @IsString()
  hashValue?: string;

  @IsOptional()
  @IsIn(['stable', 'changed', 'new'])
  status?: 'stable' | 'changed' | 'new';
}