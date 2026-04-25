import { IsArray, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class TriggerBackupDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tables?: string[];
}
