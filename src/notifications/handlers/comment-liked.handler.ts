import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType, TargetType } from '../entities/notification.entity';

export interface CommentLikedEvent {
  commentId: string;
  postId: string;
  commentAuthorId: string;
  likedByUserId: string;
  likedByUserName: string;
  postTitle: string;
  commentSnippet: string;
  postUrl: string;
}

@Injectable()
export class CommentLikedHandler {
  private readonly logger = new Logger(CommentLikedHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: CommentLikedEvent): Promise<void> {
    this.logger.debug(`Handling comment.liked event: ${JSON.stringify(event)}`);

    // Don't notify if user likes their own comment
    if (event.likedByUserId === event.commentAuthorId) {
      this.logger.debug('Skipping notification - user liked their own comment');
      return;
    }

    await this.notificationsService.create({
      userId: event.commentAuthorId,
      type: NotificationType.COMMENT_LIKED,
      actorId: event.likedByUserId,
      targetId: event.commentId,
      targetType: TargetType.COMMENT,
      data: {
        actorName: event.likedByUserName,
        postTitle: event.postTitle,
        commentSnippet: event.commentSnippet,
        postUrl: event.postUrl,
        commentId: event.commentId,
      },
      idempotencyKey: `comment-like:${event.commentId}:${event.likedByUserId}`,
    });
  }
}
