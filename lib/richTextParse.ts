export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "ul", items: list });
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      const text = line.slice(3).trim();
      if (text) blocks.push({ type: "h2", text });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      const item = line.slice(2).trim();
      if (item) list.push(item);
      continue;
    }
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function splitBold(text: string) {
  const parts: { bold: boolean; text: string }[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ bold: false, text: text.slice(last, index) });
    parts.push({ bold: true, text: match[1] ?? "" });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ bold: false, text: text.slice(last) });
  return parts;
}
