import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  COMMENT_CREATED = 'comment.created',
  COMMENT_LIKED = 'comment.liked',
  POST_LIKED = 'post.liked',
  MENTION_CREATED = 'mention.created',
}

export enum TargetType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum NotificationChannel {
  IN_APP = 'in-app',
  EMAIL = 'email',
  PUSH = 'push',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['type'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('uuid')
  actorId: string;

  @Column('uuid')
  targetId: string;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  targetType: TargetType;

  @Column('jsonb', { default: {} })
  data: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Column({ nullable: true })
  sentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, unique: true })
  idempotencyKey: string;
}
