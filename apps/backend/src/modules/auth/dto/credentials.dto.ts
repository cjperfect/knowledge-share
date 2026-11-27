import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

const usernamePattern = /^[\p{L}\p{N}_-]+$/u;

export class CredentialsDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 30, { message: '用户名需要 2 到 30 个字符。' })
  @Matches(usernamePattern, { message: '用户名只能包含字母、数字、下划线或短横线。' })
  username!: string;
}
