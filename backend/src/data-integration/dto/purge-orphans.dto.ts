import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class PurgeOrphansDto {
  @IsString()
  tableName: string;

  @IsString()
  primaryKey: string;

  @IsArray()
  @ArrayMinSize(1)
  ids: unknown[];
}
