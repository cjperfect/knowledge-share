import { IsString, Length, Matches } from 'class-validator';
import { CredentialsDto } from './credentials.dto';

const tokenPattern = /^[a-f0-9]{64}$/;

export class RegisterDto extends CredentialsDto {
  @IsString()
  @Length(8, 64, { message: '密码需要 8 到 64 个字符。' })
  password!: string;

  @IsString()
  @Matches(tokenPattern, { message: '邀请链接无效。' })
  token!: string;
}
