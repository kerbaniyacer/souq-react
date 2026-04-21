import { useState, useEffect } from 'react';
import { DEFAULT_EMAIL_CONTENT, type EmailContent } from './emailTemplatesConfig';

export function useEmailContent(type: string) {
  const [content, setContent] = useState<EmailContent>(DEFAULT_EMAIL_CONTENT[type] || DEFAULT_EMAIL_CONTENT['welcome']);

  useEffect(() => {
    const saved = localStorage.getItem(`email_temp_${type}`);
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse email content', e);
      }
    }
  }, [type]);

  return content;
}
