import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType, TargetType } from '../entities/notification.entity';

export interface CommentCreatedEvent {
  commentId: string;
  postId: string;
  postAuthorId: string;
  parentCommentId?: string;
  parentCommentAuthorId?: string;
  commentAuthorId: string;
  commentAuthorName: string;
  postTitle: string;
  content: string;
  postUrl: string;
}

@Injectable()
export class CommentCreatedHandler {
  private readonly logger = new Logger(CommentCreatedHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: CommentCreatedEvent): Promise<void> {
    this.logger.debug(
      `Handling comment.created event: ${JSON.stringify(event)}`,
    );

    // Don't notify if user comments on their own post
    if (event.commentAuthorId !== event.postAuthorId) {
      await this.notificationsService.create({
        userId: event.postAuthorId,
        type: NotificationType.COMMENT_CREATED,
        actorId: event.commentAuthorId,
        targetId: event.postId,
        targetType: TargetType.POST,
        data: {
          actorName: event.commentAuthorName,
          postTitle: event.postTitle,
          commentSnippet: event.content.substring(0, 200),
          postUrl: event.postUrl,
          commentId: event.commentId,
        },
        idempotencyKey: `comment:${event.commentId}:post:${event.postAuthorId}`,
      });
    }

    // Notify parent comment author if this is a reply
    if (event.parentCommentId && event.parentCommentAuthorId) {
      // Don't notify if replying to own comment or if parent author is post author (already notified)
      if (
        event.commentAuthorId !== event.parentCommentAuthorId &&
        event.postAuthorId !== event.parentCommentAuthorId
      ) {
        await this.notificationsService.create({
          userId: event.parentCommentAuthorId,
          type: NotificationType.COMMENT_CREATED,
          actorId: event.commentAuthorId,
          targetId: event.postId,
          targetType: TargetType.COMMENT,
          data: {
            actorName: event.commentAuthorName,
            postTitle: event.postTitle,
            commentSnippet: event.content.substring(0, 200),
            postUrl: event.postUrl,
            commentId: event.commentId,
            parentCommentId: event.parentCommentId,
          },
          idempotencyKey: `comment:${event.commentId}:parent:${event.parentCommentAuthorId}`,
        });
      }
    }
  }
}
