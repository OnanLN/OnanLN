import { parseBlocks, splitBold } from "@/lib/richTextParse";

function Inline({ text }: { text: string }) {
  const parts = splitBold(text);
  if (!parts.length) return text;
  return parts.map((part, index) =>
    part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>,
  );
}

export function RichText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="prose">
      {blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
