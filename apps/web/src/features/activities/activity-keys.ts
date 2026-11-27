export const activityListsKey = ['activities', 'list'] as const
export const activityDetailKey = (id: string) =>
  ['activities', 'detail', id] as const
