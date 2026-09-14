const urls = [
  "https://dev.expressa.vitykovskiy.ru/api/v3/public/menu",
  "https://admin.dev.expressa.vitykovskiy.ru/api/v3/public/menu",
  "https://api.dev.expressa.vitykovskiy.ru/api/v3/public/menu",
];

const sourceCategories = new Set([
  "Какао / шоколад",
  "Чай",
  "Холодные напитки",
  "Поесть",
  "Кофе классический",
  "Кофе сладкий",
  "Холодный кофе",
]);
const sourceProducts = new Set([
  "Какао",
  "Горячий шоколад",
  "Оранжет",
  "Сырный шок",
  "Фундучный какао",
  "Чай китайский",
  "Чай летний",
  "Сироп а лё",
  "Лимонад «Проспект МИРинда»",
  "Коктейль «Нежность»",
  "Молочный коктейль",
  "Антуччи",
  "Круассан",
  "Мороженое",
  "Маффин",
  "Сырники",
  "Штрудель",
  "Горячий бутерброд",
  "Эспрессо",
  "Американо",
  "Флэт уайт",
  "Капучино",
  "Латте",
  "Раф",
  "Сырный раф",
  "Раффундук",
  "Моккачино",
  "Айс-латте",
  "Гляссе",
  "Бамбл",
  "Эспрессо-тоник",
  "Кофе-шейк",
  "Аффогато",
]);
function validateMenu(body, url) {
  const categories = body.categories.filter((category) =>
    sourceCategories.has(category.name),
  );
  const products = categories
    .flatMap((category) => category.products)
    .filter((product) => sourceProducts.has(product.name));
  const priceChoices = products.reduce(
    (count, product) => count + product.priceChoices.length,
    0,
  );
  if (
    categories.length !== 7 ||
    products.length !== 33 ||
    priceChoices !== 20 ||
    products.some((product) =>
      product.priceChoices.some((choice) => !choice.portionLabel),
    )
  ) {
    throw new Error(`Development ingress customer menu is incomplete: ${url}`);
  }
}

for (const url of urls) {
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  const cacheControl = response.headers.get("cache-control") ?? "";
  const body = await response.json().catch(() => null);
  if (
    !response.ok ||
    !contentType.includes("application/json") ||
    !cacheControl.includes("no-store") ||
    !Array.isArray(body?.categories)
  ) {
    throw new Error(`Development ingress did not return menu JSON: ${url}`);
  }
  validateMenu(body, url);
}
