import { addons } from "storybook/manager-api";

addons.setConfig({
  sidebar: {
    showRoots: true,
    collapsedRoots: ["компоненты", "бизнес-компоненты", "экраны"],
  },
});
