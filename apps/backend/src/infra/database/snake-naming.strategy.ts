import { DefaultNamingStrategy } from 'typeorm';

function snakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/__+/g, '_')
    .toLowerCase();
}

/**
 * 数据库统一 snake_case 命名。
 * 好处：SQL / 迁移 / 数据同步脚本里列名稳定，不受 TS 属性名风格影响。
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy {
  override columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const base = customName || propertyName;
    return [...embeddedPrefixes, base].map(snakeCase).join('_');
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    secondPropertyName: string,
  ): string {
    return snakeCase(
      `${firstTableName}_${firstPropertyName}_${secondTableName}_${secondPropertyName}`,
    );
  }

  override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ?? propertyName}`);
  }
}
