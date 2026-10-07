import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LoadingState from "../../../src/pages/admin/auth/LoadingState.vue";
const meta = {
  title: "Бизнес компоненты/Вход/Ожидание входа",
  id: "features-authentication-loadingstate",
  component: LoadingState,
} satisfies Meta<typeof LoadingState>;
export default meta;
export const Default: StoryObj<typeof meta> = { name: "Обычное состояние" };
