import { blocksToMarkdown } from '../../util/markdown';
import type { Activity } from './entities/activity.entity';

function baseView(activity: Activity) {
  return {
    id: activity.id,
    name: activity.name,
    sharer: activity.sharer,
    date: activity.eventDate,
    summary: activity.summary,
    price: Number(activity.price ?? 0),
    status: activity.status,
    thumbnail: activity.thumbnail ?? '',
  };
}

function contentFields(activity: Activity, includeContent: boolean) {
  return includeContent
    ? {
        content: activity.content ?? [],
        contentMarkdown: activity.contentMarkdown ?? blocksToMarkdown(activity.content ?? []),
      }
    : {};
}

/** 后台活动列表/详情：额外带内容状态与审计字段。 */
export function activityView(activity: Activity, includeContent = false) {
  return {
    ...baseView(activity),
    hasContent: Boolean(activity.content?.length),
    ...contentFields(activity, includeContent),
    createdBy: activity.createdBy,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}

/** 官网活动列表/详情：额外带报名人数，不暴露后台审计字段。 */
export function publicActivityView(activity: Activity, signupCount = 0, includeContent = false) {
  return {
    ...baseView(activity),
    signupCount,
    ...contentFields(activity, includeContent),
  };
}
