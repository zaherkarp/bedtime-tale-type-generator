/**
 * Split a generated tale into its title (the leading Markdown H1) and body.
 * Falls back gracefully while the story is still streaming in.
 */
export function parseStory(raw: string): { title: string; body: string } {
  const text = raw.replace(/\r\n/g, "\n");
  const match = text.match(/^\s*#\s+(.+?)\s*$/m);
  if (!match) {
    return { title: "", body: text.trim() };
  }
  const title = match[1].trim();
  const body = text.slice(match.index! + match[0].length).replace(/^\n+/, "");
  return { title, body };
}

/** Split a story body into blocks separated by blank lines (paragraphs/stanzas). */
export function toBlocks(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trimEnd())
    .filter((b) => b.trim().length > 0);
}
