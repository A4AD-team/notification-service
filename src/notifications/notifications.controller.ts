import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  NotificationsService,
  NotificationList,
} from './notifications.service';
import { Notification } from './entities/notification.entity';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { MarkAllAsReadDto } from './dto/mark-all-as-read.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Headers('x-user-id') userId: string,
    @Query(new ValidationPipe({ transform: true })) query: GetNotificationsDto,
  ): Promise<NotificationList> {
    // In production, this would be extracted from JWT token
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000';
    }

    return this.notificationsService.findAll(userId, {
      unreadOnly: query.unreadOnly,
      page: query.page,
      limit: query.limit,
      type: query.type,
    });
  }

  @Get('unread-count')
  async getUnreadCount(
    @Headers('x-user-id') userId: string,
  ): Promise<{ count: number }> {
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000';
    }

    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() _: MarkAsReadDto,
  ): Promise<Notification> {
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000';
    }

    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(
    @Headers('x-user-id') userId: string,
    @Body() _: MarkAllAsReadDto,
  ): Promise<void> {
    if (!userId) {
      userId = '00000000-0000-0000-0000-000000000000';
    }

    await this.notificationsService.markAllAsRead(userId);
  }
}
