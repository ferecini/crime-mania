import Link from "next/link";
import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]"'])/gi;

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Renderiza texto sanitizado com parágrafos e links http(s) seguros. */
export function CommunityBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-white/90">
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-wrap break-words">
          {linkifyParagraph(para)}
        </p>
      ))}
    </div>
  );
}

function linkifyParagraph(para: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(URL_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(para)) !== null) {
    if (m.index > last) {
      parts.push(escapeText(para.slice(last, m.index)));
    }
    const href = m[0];
    parts.push(
      <a
        key={`${m.index}-${href}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="cm-text-link font-medium"
      >
        {href.length > 60 ? `${href.slice(0, 57)}…` : href}
      </a>,
    );
    last = m.index + href.length;
  }
  if (last < para.length) parts.push(escapeText(para.slice(last)));
  return parts;
}

/** Evita import não usado do Link em builds strict — usado em navegação interna separada. */
export function CommunityInternalLink(props: { href: string; children: React.ReactNode }) {
  return (
    <Link href={props.href} className="cm-text-link font-semibold">
      {props.children}
    </Link>
  );
}
