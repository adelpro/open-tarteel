import sanitizeHtml from 'sanitize-html';

export const sanitizeHTML = (input: string) =>
  sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
