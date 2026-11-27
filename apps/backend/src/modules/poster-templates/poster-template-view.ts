import type { PosterTemplate } from './entities/poster-template.entity';

export function posterTemplateView(template: PosterTemplate) {
  return {
    id: template.id,
    name: template.name,
    image: template.image,
    enabled: template.enabled,
    updatedAt: template.updatedAt,
  };
}
