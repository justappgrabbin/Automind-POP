import { ingestBook } from "./auto_book.js";

export async function ingestURL(swarm, input, field, onPage) {
  const source = new URL(input);
  if (!["https:", "http:"].includes(source.protocol) || source.username || source.password) {
    throw Error("Use an HTTP or HTTPS source without credentials");
  }

  const response = await fetch(source, { credentials: "omit", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error("Source returned HTTP " + response.status);
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  const name = source.href;
  if (type === "application/pdf" || (type === "application/octet-stream" && /\.pdf$/i.test(source.pathname))) {
    return ingestBook(swarm, new File([await response.blob()], name, { type: "application/pdf" }), field, onPage);
  }
  if (!type.startsWith("text/")) throw Error("This address returned neither a PDF nor text");
  let text = await response.text();
  if (type === "text/html") {
    const template = document.createElement("template");
    template.innerHTML = text;
    const content = template.content.querySelector("main, article") ?? template.content;
    content.querySelectorAll("script, style, template, noscript, nav").forEach(node => node.remove());
    text = content.textContent;
  }
  return ingestBook(swarm, new File([text], name, { type: "text/plain" }), field, onPage);
}
