import { Result } from './result';

describe('Result', () => {
  it('ok 返回 code=200、msg=success 与业务数据', () => {
    const result = Result.ok({ total: 3 });

    expect(result).toEqual({ code: 200, msg: 'success', data: { total: 3 } });
  });

  it('ok 支持自定义提示文案', () => {
    const result = Result.ok({ id: 1 }, '已创建');

    expect(result).toEqual({ code: 200, msg: '已创建', data: { id: 1 } });
  });

  it('ok 传 undefined 时 data 规范为 null，字段不缺省', () => {
    const result = Result.ok(undefined);

    expect(result).toEqual({ code: 200, msg: 'success', data: null });
    expect(Object.keys(result)).toEqual(['code', 'msg', 'data']);
  });

  it('fail 返回业务码、中文文案与 data=null', () => {
    const result = Result.fail(40001, 'name不能为空');

    expect(result).toEqual({ code: 40001, msg: 'name不能为空', data: null });
  });
});
