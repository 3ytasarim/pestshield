import { IsString, MaxLength, MinLength } from 'class-validator';

export class ActivateLicenseDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  key: string;
}
