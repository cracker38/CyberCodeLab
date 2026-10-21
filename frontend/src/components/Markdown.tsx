import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function Markdown({ text }: { text: string }) {
  const codeBlocks: { language: string; code: string }[] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, language: string, code: string) => {
    const index = codeBlocks.push({ language: language.trim(), code: code.replace(/\n$/, "") }) - 1;
    return `\n\n@@LESSON_CODE_${index}@@\n\n`;
  });
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const codeBlock = /^@@LESSON_CODE_(\d+)@@$/.exec(block);
        if (codeBlock) {
          const snippet = codeBlocks[Number(codeBlock[1])];
          return <pre key={i} data-language={snippet.language || undefined}><code>{snippet.code}</code></pre>;
        }
        if (block.startsWith("### ")) return <h3 key={i}>{inline(block.slice(4))}</h3>;
        if (block.startsWith("## ")) return <h2 key={i}>{inline(block.slice(3))}</h2>;
        if (block.startsWith("# ")) return <h2 key={i}>{inline(block.slice(2))}</h2>;
        const lines = block.split("\n");
        if (lines.every((line) => /^[-*] /.test(line))) {
          return (
            <ul key={i}>
              {lines.map((line, index) => (
                <li key={`${i}-${index}`}>{inline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\. /.test(l))) {
          return (
            <ol key={i}>
              {lines.map((line, index) => (
                <li key={`${i}-${index}`}>{inline(line.replace(/^\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        }
        if (lines.every((line) => line.startsWith("> ") || line === ">")) {
          return <blockquote key={i}><p>{inline(lines.map((line) => line.replace(/^> ?/, "")).join(" "))}</p></blockquote>;
        }
        if (/^---+$/.test(block)) return <hr key={i} />;
        return <p key={i}>{inline(lines.join(" "))}</p>;
      })}
    </>
  );
}
