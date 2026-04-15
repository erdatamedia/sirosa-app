import { IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string;

  @IsOptional()
  @IsString()
  password?: string;
}
