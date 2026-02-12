export interface CreateNotificationDto {
  userId: string;
  type: string;
  actorId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  data: Record<string, any>;
  channels?: string[];
  idempotencyKey?: string;
}
