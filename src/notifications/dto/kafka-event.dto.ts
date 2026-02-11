import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class BaseKafkaEvent {
  @IsString()
  event: string;

  @IsUUID()
  requestId: string;

  @IsUUID()
  initiatorId: string;

  @IsOptional()
  @IsUUID()
  currentStageId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  approvers: string[];

  @IsOptional()
  payload?: Record<string, any>;

  @IsDateString()
  timestamp: string;
}

export class RequestCreatedEvent extends BaseKafkaEvent {
  event = 'request.created';
}

export class RequestSubmittedEvent extends BaseKafkaEvent {
  event = 'request.submitted';
}

export class RequestStageAdvancedEvent extends BaseKafkaEvent {
  event = 'request.stage_advanced';

  @IsUUID()
  nextStageId: string;

  @IsString()
  nextStageName: string;
}

export class RequestCompletedEvent extends BaseKafkaEvent {
  event = 'request.completed';

  @IsString()
  result: 'approved' | 'rejected';
}

export class RequestRejectedEvent extends BaseKafkaEvent {
  event = 'request.rejected';

  @IsString()
  reason: string;
}

export class RequestChangesRequestedEvent extends BaseKafkaEvent {
  event = 'request.changes_requested';

  @IsArray()
  @IsString({ each: true })
  requiredChanges: string[];
}

export class RequestResubmittedEvent extends BaseKafkaEvent {
  event = 'request.resubmitted';
}

export class RequestCancelledEvent extends BaseKafkaEvent {
  event = 'request.cancelled';

  @IsString()
  reason: string;
}

export class StageTimeoutEvent extends BaseKafkaEvent {
  event = 'stage.timeout';

  @IsUUID()
  stageId: string;

  @IsString()
  stageName: string;

  @IsDateString()
  deadline: string;
}

export class StageReminderEvent extends BaseKafkaEvent {
  event = 'stage.reminder';

  @IsUUID()
  stageId: string;

  @IsString()
  stageName: string;

  @IsDateString()
  deadline: string;

  @IsString()
  hoursRemaining: string;
}

export class CommentAddedEvent extends BaseKafkaEvent {
  event = 'comment.added';

  @IsUUID()
  commentId: string;

  @IsString()
  commentText: string;

  @IsUUID()
  authorId: string;

  @IsString()
  authorName: string;
}

export type KafkaEvent =
  | RequestCreatedEvent
  | RequestSubmittedEvent
  | RequestStageAdvancedEvent
  | RequestCompletedEvent
  | RequestRejectedEvent
  | RequestChangesRequestedEvent
  | RequestResubmittedEvent
  | RequestCancelledEvent
  | StageTimeoutEvent
  | StageReminderEvent
  | CommentAddedEvent;
