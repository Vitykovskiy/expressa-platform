import { readFile } from "node:fs/promises";

const [reference, target] = await Promise.all(
  [
    new URL("./reference-index.json", import.meta.url),
    new URL("file:///tmp/expressa-front-office-storybook/index.json"),
  ].map(async (url) => JSON.parse(await readFile(url, "utf8"))),
);

const projectEntry = ({ id, name, title, type }) => ({ id, name, title, type });
const projectIndex = (index) =>
  Object.fromEntries(
    Object.entries(index.entries)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, entry]) => [id, projectEntry(entry)]),
  );

const referenceEntries = projectIndex(reference);
const targetEntries = projectIndex(target);

if (JSON.stringify(targetEntries) !== JSON.stringify(referenceEntries)) {
  const referenceIds = new Set(Object.keys(referenceEntries));
  const targetIds = new Set(Object.keys(targetEntries));
  const missing = [...referenceIds].filter((id) => !targetIds.has(id));
  const unexpected = [...targetIds].filter((id) => !referenceIds.has(id));

  throw new Error(
    `Storybook catalog отличается от reference: missing=${missing.join(",")}; unexpected=${unexpected.join(",")}`,
  );
}

console.log(
  `Customer Storybook catalog совпадает с reference: ${Object.keys(targetEntries).length} entries.`,
);
