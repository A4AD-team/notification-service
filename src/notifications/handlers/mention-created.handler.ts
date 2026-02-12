import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType, TargetType } from '../entities/notification.entity';

export interface MentionCreatedEvent {
  mentionedUserId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  postId: string;
  postTitle: string;
  targetType: 'post' | 'comment';
  targetId: string;
  content: string;
  postUrl: string;
}

@Injectable()
export class MentionCreatedHandler {
  private readonly logger = new Logger(MentionCreatedHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: MentionCreatedEvent): Promise<void> {
    this.logger.debug(
      `Handling mention.created event: ${JSON.stringify(event)}`,
    );

    // Don't notify if user mentions themselves
    if (event.mentionedByUserId === event.mentionedUserId) {
      this.logger.debug('Skipping notification - user mentioned themselves');
      return;
    }

    await this.notificationsService.create({
      userId: event.mentionedUserId,
      type: NotificationType.MENTION_CREATED,
      actorId: event.mentionedByUserId,
      targetId: event.targetId,
      targetType:
        event.targetType === 'post' ? TargetType.POST : TargetType.COMMENT,
      data: {
        actorName: event.mentionedByUserName,
        postTitle: event.postTitle,
        targetType: event.targetType,
        contentSnippet: event.content.substring(0, 200),
        postUrl: event.postUrl,
        targetId: event.targetId,
        postId: event.postId,
      },
      idempotencyKey: `mention:${event.targetType}:${event.targetId}:${event.mentionedUserId}`,
    });
  }
}
