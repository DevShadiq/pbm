import sanitizeHtml from "sanitize-html";

const sanitizerOptions = {
  allowedTags: ["p", "div", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "table", "thead", "tbody", "tr", "th", "td"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export const sanitizeNoticeHtml = (content) =>
  sanitizeHtml(String(content || ""), sanitizerOptions);

export const htmlToPlainText = (content) =>
  sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
