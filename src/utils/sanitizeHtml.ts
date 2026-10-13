const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'section', 'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
  'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'small', 'br', 'hr', 'code', 'pre',
]);

const DROPPED_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);

const ALLOWED_ATTRS = new Set(['style', 'colspan', 'rowspan']);

function cleanNode(node: Element): void {
  for (const child of Array.from(node.children)) {
    const tag = child.tagName.toLowerCase();

    if (DROPPED_WITH_CONTENT.has(tag)) {
      child.remove();
      continue;
    }

    cleanNode(child);

    if (!ALLOWED_TAGS.has(tag)) {
      child.replaceWith(...Array.from(child.childNodes));
      continue;
    }

    for (const attr of Array.from(child.attributes)) {
      const unsafeStyle = attr.name === 'style' && /url\s*\(|expression\s*\(/i.test(attr.value);
      if (!ALLOWED_ATTRS.has(attr.name) || unsafeStyle) {
        child.removeAttribute(attr.name);
      }
    }
  }
}

/** Allowlist sanitizer for LLM-generated report HTML. */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  cleanNode(doc.body);
  return doc.body.innerHTML;
}
