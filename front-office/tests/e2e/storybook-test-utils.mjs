import { expect } from "@playwright/test";

const storybookCompletedStoryKey = "__expressaStorybookCompletedStoryId";

export function storyUrl(storyId) {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}

export async function openStory(page, storyId) {
  await page.addInitScript((completedStoryKey) => {
    const listenForCompletion = () => {
      const channel = globalThis.__STORYBOOK_ADDONS_CHANNEL__;

      if (!channel) return;

      window.clearInterval(waitForChannel);
      channel.on("storyRenderPhaseChanged", ({ newPhase, storyId }) => {
        if (newPhase === "completed") {
          globalThis[completedStoryKey] = storyId;
        }
      });
    };
    const waitForChannel = window.setInterval(listenForCompletion, 0);

    listenForCompletion();
  }, storybookCompletedStoryKey);

  await page.goto(storyUrl(storyId));
  await page.locator("#storybook-root").waitFor();
  await expect
    .poll(() =>
      page.evaluate(
        ({ completedStoryKey, storyId: expectedStoryId }) =>
          globalThis[completedStoryKey] === expectedStoryId,
        { completedStoryKey: storybookCompletedStoryKey, storyId },
      ),
    )
    .toBe(true);
  await expect(page.locator("#error-message")).toBeEmpty();
  await page.evaluate(() => document.fonts.ready);
}
