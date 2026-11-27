// The room uses the same retrieval path for shelf material and research.
import { Corpus } from "./research.js";

function passages(document, text, location = "") {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  const result = [];
  for (let start = 0; start < words.length; start += 200) {
    const end = Math.min(start + 230, words.length);
    result.push({ ...document, text: words.slice(start, end).join(" "),
      location: [location, `passage ${start / 200 + 1}`].filter(Boolean).join(" · ") });
    if (end === words.length) break;
  }
  return result;
}

export function searchKnowledge(query, research, books, limit = 8) {
  const latest = new Map(research.map(document => [document.url || document.title, document]));
  const corpus = new Corpus();
  for (const document of latest.values()) {
    for (const excerpt of passages(document, document.text)) corpus.add(excerpt);
  }
  for (const book of books) {
    const document = { title: book.name, provider: "Bookshelf", field: book.field };
    for (const excerpt of passages(document, book.general)) corpus.add(excerpt);
    for (const [gate, text] of Object.entries(book.sections ?? {})) {
      for (const excerpt of passages(document, text, `Gate ${gate}`)) corpus.add(excerpt);
    }
  }
  return corpus.search(query, limit);
}
