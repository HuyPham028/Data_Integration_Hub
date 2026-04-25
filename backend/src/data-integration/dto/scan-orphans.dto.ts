import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ScanOrphansDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tables: string[];
}
