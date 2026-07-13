import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Firma sahibi (isCompanyOwner) kendi firmasına yeni bir çalışan ekler. */
export class InviteEmployeeDto {
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
