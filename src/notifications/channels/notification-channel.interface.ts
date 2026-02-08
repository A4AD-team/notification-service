export interface INotificationChannel {
  send(notification: NotificationData): Promise<boolean>;
}

export interface NotificationData {
  userId: string;
  type: 'email' | 'in_app' | 'push';
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface EmailNotificationData extends NotificationData {
  type: 'email';
  to: string;
  subject?: string;
  html?: string;
  text?: string;
}

export interface InAppNotificationData extends NotificationData {
  type: 'in_app';
  title?: string;
  message: string;
  actionUrl?: string;
}

export interface PushNotificationData extends NotificationData {
  type: 'push';
  deviceToken: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}
