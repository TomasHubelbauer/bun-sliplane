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

// Create a cached HTMLRewriter instance with all handlers configured
const htmlRewriter = new HTMLRewriter()
  .onDocument({
    doctype(doctype) {
      doctype.remove();
    },
    comments(comment) {
      comment.remove();
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
      } else if (element.canHaveContent) {
        element.onEndTag((tag) => {
          tag.after("\n");
        });
      }

      for (const attribute of BANNED_ATTRIBUTES) {
        element.removeAttribute(attribute);
      }

      element.before("\n");
    },
    text(text) {
      if (!text.text.trim()) {
        return;
      }
    },
    comments(comment) {
      comment.remove();
    },
  });

export default async function fetchBasicHtml(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      statusText: response.statusText,
    } as const;
  }

  return {
    ok: true,
    html: htmlRewriter
      .transform(await response.text())
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line)
      .join("\n"),
  } as const;
}

if (import.meta.main) {
  console.log(await fetchBasicHtml("https://bun.sh/blog"));
}
