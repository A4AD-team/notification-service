export interface NotificationTemplate {
  subject: string;
  inAppMessage: string;
  emailBody: string;
  pushTitle?: string;
  pushBody?: string;
}

export const notificationTemplates: Record<string, NotificationTemplate> = {
  'comment.created': {
    subject: 'New comment on your post',
    inAppMessage: '{actorName} commented on your post "{postTitle}"',
    emailBody: `
      <h2>Hello {userName},</h2>
      <p><strong>{actorName}</strong> commented on your post "{postTitle}":</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
        {commentSnippet}
      </blockquote>
      <p><a href="{postUrl}">View comment</a></p>
    `,
    pushTitle: 'New Comment',
    pushBody: '{actorName} commented on your post',
  },
  'comment.replied': {
    subject: 'New reply to your comment',
    inAppMessage: '{actorName} replied to your comment on "{postTitle}"',
    emailBody: `
      <h2>Hello {userName},</h2>
      <p><strong>{actorName}</strong> replied to your comment on "{postTitle}":</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
        {commentSnippet}
      </blockquote>
      <p><a href="{postUrl}">View reply</a></p>
    `,
    pushTitle: 'New Reply',
    pushBody: '{actorName} replied to your comment',
  },
  'comment.liked': {
    subject: 'Someone liked your comment',
    inAppMessage: '{actorName} liked your comment on "{postTitle}"',
    emailBody: `
      <h2>Hello {userName},</h2>
      <p><strong>{actorName}</strong> liked your comment on "{postTitle}".</p>
      <p><a href="{postUrl}">View comment</a></p>
    `,
    pushTitle: 'New Like',
    pushBody: '{actorName} liked your comment',
  },
  'post.liked': {
    subject: 'Someone liked your post',
    inAppMessage: '{actorName} liked your post "{postTitle}"',
    emailBody: `
      <h2>Hello {userName},</h2>
      <p><strong>{actorName}</strong> liked your post "{postTitle}".</p>
      <p><a href="{postUrl}">View post</a></p>
    `,
    pushTitle: 'New Like',
    pushBody: '{actorName} liked your post',
  },
  'mention.created': {
    subject: 'You were mentioned in a {targetType}',
    inAppMessage:
      '{actorName} mentioned you in a {targetType} on "{postTitle}"',
    emailBody: `
      <h2>Hello {userName},</h2>
      <p><strong>{actorName}</strong> mentioned you in a {targetType} on "{postTitle}":</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 10px 0;">
        {contentSnippet}
      </blockquote>
      <p><a href="{postUrl}">View {targetType}</a></p>
    `,
    pushTitle: 'New Mention',
    pushBody: '{actorName} mentioned you',
  },
};

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (match, key) => variables[key] || match,
  );
}
