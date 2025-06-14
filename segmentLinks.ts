export default function* segmentLinks(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  const regex = /https?:\/\//;

  while (text.length > 0) {
    const index = text.search(regex);

    if (index === -1) {
      yield text;
      return;
    }

    if (index > 0) {
      yield text.slice(0, index);
      text = text.slice(index);
    }

    const spaceIndex = text.indexOf(" ");
    if (spaceIndex === -1) {
      yield { type: "link" as const, url: text };
      return;
    }

    yield { type: "link" as const, url: text.slice(0, spaceIndex) };
    text = text.slice(spaceIndex);
  }
}
