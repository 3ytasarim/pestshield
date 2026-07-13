import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Public uç: yeni bir müşteri firması + ilk kullanıcısı (owner) kaydı.
 * Firma 'pending_approval' durumunda açılır; admin onaylayana kadar
 * devices/activity-logs gibi asıl uçlara erişim LicenseGuard tarafından
 * engellenir (giriş yapabilir, ama kilitli görür).
 */
export class RegisterCompanyDto {
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsEmail()
  @MaxLength(255)
  contactEmail: string;

  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password en az bir harf ve bir rakam içermelidir',
  })
  password: string;
}
