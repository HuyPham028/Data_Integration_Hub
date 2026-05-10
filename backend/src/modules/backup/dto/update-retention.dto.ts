import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRetentionDto {
  @IsString()
  @IsNotEmpty()
  trigger: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  days: number | null;
}
