export interface NotificationTemplate {
  subject?: string;
  text: string;
  html?: string;
  title?: string;
  message: string;
}

export class NotificationTemplates {
  private static templates: Map<string, NotificationTemplate> = new Map([
    [
      'request-created',
      {
        subject: 'Ваша заявка создана',
        text: 'Ваша заявка №{requestId} создана и отправлена на согласование.',
        message:
          'Ваша заявка №{requestId} создана и отправлена на согласование',
        title: 'Заявка создана',
      },
    ],

    [
      'request-submitted',
      {
        subject: 'Требуется ваше согласование',
        text: 'Требуется ваше согласование заявки №{requestId} от {initiatorName}.',
        message: 'Требуется ваше согласование: {requestType}',
        title: 'Согласование',
      },
    ],

    [
      'request-submitted-confirmation',
      {
        subject: 'Заявка отправлена на согласование',
        text: 'Ваша заявка №{requestId} отправлена на согласование {approversCount} согласующим.',
        message: 'Заявка отправлена на согласование',
        title: 'Заявка отправлена',
      },
    ],

    [
      'request-approved',
      {
        subject: 'Заявка одобрена',
        text: 'Ваша заявка №{requestId} одобрена.',
        message: 'Заявка одобрена',
        title: 'Заявка одобрена',
      },
    ],

    [
      'request-rejected',
      {
        subject: 'Заявка отклонена',
        text: 'Ваша заявка №{requestId} отклонена.\n\nПричина: {reason}',
        message: 'Заявка отклонена',
        title: 'Заявка отклонена',
      },
    ],

    [
      'request-changes-requested',
      {
        subject: 'Требуется доработка заявки',
        text: 'Ваша заявка №{requestId} возвращена на доработку.\n\nТребуемые изменения:\n{requiredChanges}',
        message: 'Требуется доработка заявки',
        title: 'Требуется доработка',
      },
    ],

    [
      'request-resubmitted',
      {
        subject: 'Заявка отправлена повторно',
        text: 'Ваша заявка №{requestId} повторно отправлена на согласование.',
        message: 'Заявка отправлена повторно',
        title: 'Заявка отправлена повторно',
      },
    ],

    [
      'request-cancelled',
      {
        subject: 'Заявка отменена',
        text: 'Ваша заявка №{requestId} отменена.\n\nПричина: {reason}',
        message: 'Заявка отменена',
        title: 'Заявка отменена',
      },
    ],

    [
      'request-stage-advanced',
      {
        subject: 'Заявка переведена на следующий этап',
        text: 'Ваша заявка №{requestId} переведена на этап "{nextStageName}".',
        message: 'Заявка переведена на следующий этап',
        title: 'Этап изменен',
      },
    ],

    [
      'stage-timeout',
      {
        subject: 'Истекло время согласования',
        text: 'Истекло время согласования этапа "{stageName}" заявки №{requestId}.\n\nДедлайн был: {deadline}',
        message: 'Время согласования истекло',
        title: 'Время истекло',
      },
    ],

    [
      'stage-timeout-initiator',
      {
        subject: 'Задержка согласования вашей заявки',
        text: 'Задержка согласования этапа "{stageName}" заявки №{requestId}.\n\nДедлайн: {deadline}',
        message: 'Задержка согласования',
        title: 'Задержка согласования',
      },
    ],

    [
      'stage-reminder',
      {
        subject: 'Напоминание о согласовании',
        text: 'Напоминание: до истечения времени согласования этапа "{stageName}" заявки №{requestId} осталось {hoursRemaining} часов.\n\nДедлайн: {deadline}',
        message: 'Напоминание о согласовании',
        title: 'Напоминание',
      },
    ],

    [
      'comment-added',
      {
        subject: 'Новый комментарий к заявке',
        text: '{authorName} добавил комментарий к заявке №{requestId}:\n\n{commentText}',
        message: 'Новый комментарий',
        title: 'Новый комментарий',
      },
    ],

    [
      'request-completed-approver',
      {
        subject: 'Согласование завершено',
        text: 'Согласование заявки №{requestId} завершено. Результат: {result}',
        message: 'Согласование завершено',
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
    const render = (text: string): string => {
      return text.replace(/\{(\w+)\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
      });
    };

    return {
      subject: template.subject ? render(template.subject) : undefined,
      text: render(template.text),
      html: template.html ? render(template.html) : undefined,
      title: template.title ? render(template.title) : undefined,
      message: render(template.message),
    };
  }

  static addTemplate(name: string, template: NotificationTemplate): void {
    this.templates.set(name, template);
  }

  static getAllTemplates(): Map<string, NotificationTemplate> {
    return new Map(this.templates);
  }
}
