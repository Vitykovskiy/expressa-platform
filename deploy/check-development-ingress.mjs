const urls = [
  "https://dev.expressa.vitykovskiy.ru/api/v2/public/menu",
  "https://admin.dev.expressa.vitykovskiy.ru/api/v2/public/menu",
  "https://api.dev.expressa.vitykovskiy.ru/api/v2/public/menu",
];

for (const url of urls) {
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.json().catch(() => null);
  if (
    !response.ok ||
    !contentType.includes("application/json") ||
    !Array.isArray(body?.categories)
  ) {
    throw new Error(`Development ingress did not return menu JSON: ${url}`);
  }
}
