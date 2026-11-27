import { IsString, Length } from 'class-validator';
import { CredentialsDto } from './credentials.dto';

export class LoginDto extends CredentialsDto {
  @IsString()
  @Length(1, 64, { message: '请输入密码，最多 64 个字符。' })
  password!: string;
}
