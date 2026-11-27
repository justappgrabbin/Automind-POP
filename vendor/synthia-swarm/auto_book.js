// Gate 61 reads already-available sources. Data from a book is evidence,
// and remains text throughout intake.
import { readFile } from "./reading.js";
import { searchKnowledge } from "./knowledge.js";
import { pdfText, shelve, shelf, splitByGate } from "./bookshelf.js";

export const AUTO_BOOK_GATE = 61;

export function readBookPassages(swarm, passages) {
  const units = swarm.units.filter(unit => unit.address?.gate === AUTO_BOOK_GATE && !unit.broken);
  if (!units.length) return [];
  for (const passage of passages) {
    readFile({ units }, { path: [passage.title, passage.location].filter(Boolean).join(" · "), text: passage.text });
  }
  return passages;
}

export async function autoBook(swarm, file, { books = shelf, research = [] } = {}) {
  const probe = readFile(swarm, file, { study: false });
  let references = [], libraryUnavailable = false;
  if (probe.gaps.length && swarm.units.some(unit => unit.address?.gate === AUTO_BOOK_GATE && !unit.broken)) {
    const query = probe.gaps.slice(0, 4).map(gap => gap.line.slice(0, 240)).join(" ");
    let local = [];
    try { local = await books(); }
    catch { libraryUnavailable = true; }
    references = readBookPassages(swarm, searchKnowledge(query, research, local, 3));
  }
  return { ...readFile(swarm, file), references, libraryUnavailable };
}

export async function ingestBook(swarm, file, field, onPage) {
  const data = /\.pdf$/i.test(file.name) || file.type === "application/pdf"
    ? await pdfText(file, onPage)
    : { text: await file.text(), pages: 1, emptyPages: 0 };
  if (!data.text.trim()) throw Error("No readable text found");
  const { text, ...metadata } = data;
  const book = await shelve({ ...metadata, ...splitByGate(text), name: file.name, field, t: Date.now() });
  const entry = book.general || Object.values(book.sections)[0] || "";
  const excerpt = entry.trim().split(/\s+/).slice(0, 230).join(" ");
  if (excerpt) readBookPassages(swarm, [{ title: book.name, text: excerpt }]);
  return book;
}
