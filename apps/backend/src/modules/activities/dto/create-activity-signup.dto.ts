import { Transform, type TransformFnParams } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { trimText } from '../../../util/validation';

export class CreateActivitySignupDto {
  @Transform(trimText)
  @IsString()
  @Length(1, 50, { message: '报名姓名需要 1–50 字。' })
  name!: string;

  @Transform(({ obj, key }: TransformFnParams) => {
    const value: unknown = obj[key];
    if (typeof value !== 'string') return value;
    return value.replace(/[\s-]/g, '').replace(/^\+86/, '');
  })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的 11 位手机号。' })
  phone!: string;
}
