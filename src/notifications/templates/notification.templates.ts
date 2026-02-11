export interface NotificationTemplate {
  subject?: string;
  text?: string;
  html?: string;
  title?: string;
  message?: string;
}

export class NotificationTemplates {
  private static templates: Map<string, NotificationTemplate> = new Map([
    [
      'request-created',
      {
        subject: 'Ваша заявка создана',
        message:
          'Ваша заявка №{requestId} создана и отправлена на согласование.',
        title: 'Заявка создана',
      },
    ],
    [
      'request-submitted',
      {
        subject: 'Требуется ваше согласование',
        message: 'Требуется ваше согласование: {requestType}',
        title: 'Согласование',
      },
    ],
    [
      'request-approved',
      {
        subject: 'Заявка одобрена',
        message: 'Ваша заявка №{requestId} одобрена.',
        title: 'Заявка одобрена',
      },
    ],
    [
      'request-rejected',
      {
        subject: 'Заявка отклонена',
        message: 'Ваша заявка №{requestId} отклонена.\n\nПричина: {reason}',
        title: 'Заявка отклонена',
      },
    ],
    [
      'request-changes-requested',
      {
        subject: 'Требуется доработка заявки',
        message:
          'Ваша заявка №{requestId} возвращена на доработку.\n\nТребуемые изменения:\n{requiredChanges}',
        title: 'Требуется доработка',
      },
    ],
    [
      'request-resubmitted',
      {
        subject: 'Заявка отправлена повторно',
        message:
          'Ваша заявка №{requestId} повторно отправлена на согласование.',
        title: 'Заявка отправлена повторно',
      },
    ],
    [
      'request-cancelled',
      {
        subject: 'Заявка отменена',
        message: 'Ваша заявка №{requestId} отменена.\n\nПричина: {reason}',
        title: 'Заявка отменена',
      },
    ],
    [
      'request-stage-advanced',
      {
        subject: 'Заявка переведена на следующий этап',
        message:
          'Ваша заявка №{requestId} переведена на этап "{nextStageName}".',
        title: 'Этап изменен',
      },
    ],
    [
      'stage-timeout',
      {
        subject: 'Истекло время согласования',
        message: 'Истекло время согласования этапа "{stageName}"',
        title: 'Время истекло',
      },
    ],
    [
      'stage-timeout-initiator',
      {
        subject: 'Задержка согласования вашей заявки',
        message: 'Задержка согласования этапа "{stageName}"',
        title: 'Задержка согласования',
      },
    ],
    [
      'stage-reminder',
      {
        subject: 'Напоминание о согласовании',
        message:
          'Напоминание: до истечения времени согласования этапа "{stageName}"',
        title: 'Напоминание',
      },
    ],
    [
      'comment-added',
      {
        subject: 'Новый комментарий к заявке',
        message: '{authorName} добавил комментарий к заявке',
        title: 'Новый комментарий',
      },
    ],
    [
      'request-completed-approver',
      {
        subject: 'Согласование завершено',
        message:
          'Согласование заявки №{requestId} завершено. Результат: {result}',
        title: 'Согласование завершено',
      },
    ],
  ]);

  static getTemplate(templateName: string): NotificationTemplate | undefined {
    return this.templates.get(templateName);
  }

  static renderTemplate(
    template: NotificationTemplate,
    data: Record<string, any>,
  ): NotificationTemplate {
    const renderString = (text: string): string => {
      if (!text || !data || typeof data !== 'object') {
        return text;
      }

      let result = text;
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, String(value));
      });

      return result;
    };

    return {
      subject: template.subject ? renderString(template.subject) : undefined,
      text: template.text ? renderString(template.text) : undefined,
      html: template.html ? renderString(template.html) : undefined,
      title: template.title ? renderString(template.title) : undefined,
      message: template.message ? renderString(template.message) : undefined,
    };
  }

  static addTemplate(name: string, template: NotificationTemplate): void {
    this.templates.set(name, template);
  }

  static getAllTemplates(): Map<string, NotificationTemplate> {
    return new Map(this.templates);
  }
}
