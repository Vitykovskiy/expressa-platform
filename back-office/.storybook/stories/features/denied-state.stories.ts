import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DeniedState from "../../../src/pages/admin/auth/DeniedState.vue";
const meta = {
  title: "Бизнес компоненты/Вход/Нет доступа",
  id: "features-authentication-deniedstate",
  component: DeniedState,
} satisfies Meta<typeof DeniedState>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "Обычное состояние" };
