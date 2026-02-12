import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType, TargetType } from '../entities/notification.entity';

export interface PostLikedEvent {
  postId: string;
  postAuthorId: string;
  likedByUserId: string;
  likedByUserName: string;
  postTitle: string;
  postUrl: string;
}

@Injectable()
export class PostLikedHandler {
  private readonly logger = new Logger(PostLikedHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: PostLikedEvent): Promise<void> {
    this.logger.debug(`Handling post.liked event: ${JSON.stringify(event)}`);

    // Don't notify if user likes their own post
    if (event.likedByUserId === event.postAuthorId) {
      this.logger.debug('Skipping notification - user liked their own post');
      return;
    }

    await this.notificationsService.create({
      userId: event.postAuthorId,
      type: NotificationType.POST_LIKED,
      actorId: event.likedByUserId,
      targetId: event.postId,
      targetType: TargetType.POST,
      data: {
        actorName: event.likedByUserName,
        postTitle: event.postTitle,
        postUrl: event.postUrl,
        postId: event.postId,
      },
      idempotencyKey: `post-like:${event.postId}:${event.likedByUserId}`,
    });
  }
}
