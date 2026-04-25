import { IsString, IsNotEmpty } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
