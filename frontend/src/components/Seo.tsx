import { useEffect } from "react";

export function Seo({
  title,
  description,
}: {
  title: string;
  description: string;
  path?: string;
}) {
  useEffect(() => {
    document.title = `${title} · CyberCode Lab`;
    const set = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    set("description", description);
    set("og:title", `${title} · CyberCode Lab`, "property");
    set("og:description", description, "property");
  }, [title, description]);
  return null;
}
