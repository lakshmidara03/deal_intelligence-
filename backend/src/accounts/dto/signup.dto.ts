import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  title!: string;

  @IsIn(['ADMIN', 'EMPLOYEE'])
  role!: 'ADMIN' | 'EMPLOYEE';
}
