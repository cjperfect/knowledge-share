import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

const maxActivityId = 18_446_744_073_709_551_615n;

export function isActivityId(value: unknown): value is string {
  return (
    typeof value === 'string' && /^[1-9][0-9]{0,19}$/.test(value) && BigInt(value) <= maxActivityId
  );
}

@Injectable()
export class ActivityIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!isActivityId(value)) {
      throw new BadRequestException('活动 ID 无效。');
    }
    return value;
  }
}
