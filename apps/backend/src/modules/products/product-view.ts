import { blocksToMarkdown } from '../../util/markdown';
import type { Product } from './entities/product.entity';

/** 后台与官网共用同一份产品响应结构。 */
export function productView(product: Product) {
  return {
    id: product.id,
    name: product.name,
    thumbnail: product.thumbnail,
    document: product.document,
    contentMarkdown: product.contentMarkdown ?? blocksToMarkdown(product.document),
    theme: product.theme,
    updatedAt: product.updatedAt,
  };
}
