const BANNED_TAGS = [
  "script",
  "style",
  "link",
  "meta",
  "svg",
  "img",
  "audio",
  "video",
  "iframe",
  "button",
  "select",
  "input",
  "form",
  "hr",
];

const FLATTENED_TAGS = [
  "html",
  "head",
  "body",
  "header",
  "footer",
  "div",
  "span",
  "section",
  "article",
  "aside",
  "nav",
  "ul",
  "ol",
  "main",
];

const BANNED_ATTRIBUTES = [
  "style",
  "class",
  "id",
  "aria-label",
  "aria-hidden",
  "tabindex",
  "role",
  "rel",
  "for",
  "target",
];

export default async function fetchBasicHtml(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (status: ${response.status})`);
  }

  const html = await response.text();
  return new HTMLRewriter()
    .onDocument({
      doctype(doctype) {
        doctype.remove();
      },
    })
    .on("*", {
      element(element) {
        if (BANNED_TAGS.includes(element.tagName)) {
          element.remove();
          return;
        }

        if (FLATTENED_TAGS.includes(element.tagName)) {
          element.removeAndKeepContent();
        }

        for (const attribute of BANNED_ATTRIBUTES) {
          element.removeAttribute(attribute);
        }

        element.before("\n");
        element.onEndTag((tag) => {
          tag.after("\n");
        });
      },
      text(text) {
        if (!text.text.trim()) {
          return;
        }
      },
    })
    .transform(html)
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter((line) => line)
    .join("\n");
}

if (import.meta.main) {
  console.log(await fetchBasicHtml("https://bun.sh/blog"));
}
