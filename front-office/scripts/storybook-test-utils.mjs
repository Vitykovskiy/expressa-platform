export function storyUrl(storyId) {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}

export async function openStory(page, storyId) {
  await page.goto(storyUrl(storyId));
  await page.locator("#storybook-root").waitFor();
  await page.evaluate(() => document.fonts.ready);
}
