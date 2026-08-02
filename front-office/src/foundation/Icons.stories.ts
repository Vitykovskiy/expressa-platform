import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Coffee,
  History,
  House,
  Lock,
  LockKeyhole,
  LoaderCircle,
  LogIn,
  Minus,
  Phone,
  Plus,
  RefreshCw,
  ShoppingCart,
  UserRound,
  Users,
  X,
} from "lucide-vue-next";

const meta = {
  title: "Foundation/Icons",
  argTypes: {},
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Набор прямых иконок Lucide для Customer. Используйте импорт конкретной иконки рядом с управляющим элементом; не создавайте локальный реестр или обёртку. Иконка внутри icon-only кнопки скрыта от ассистивных технологий, а доступное имя задаёт сама кнопка. Размер и цвет наследуются от контейнера. Источник: lucide-vue-next и экраны src/customer/pages/.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => ({
    components: {
      ArrowLeft,
      ArrowRight,
      AlertCircle,
      Check,
      CheckCircle2,
      ChevronDown,
      ChevronRight,
      ChevronUp,
      Clock,
      Coffee,
      History,
      House,
      Lock,
      LockKeyhole,
      LoaderCircle,
      LogIn,
      Minus,
      Phone,
      Plus,
      RefreshCw,
      ShoppingCart,
      UserRound,
      Users,
      X,
    },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(5rem,1fr));gap:var(--customer-spacing-lg);width:100%;color:var(--customer-color-brand)">
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ArrowLeft aria-hidden="true" /><code>ArrowLeft</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ArrowRight aria-hidden="true" /><code>ArrowRight</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><AlertCircle aria-hidden="true" /><code>AlertCircle</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Check aria-hidden="true" /><code>Check</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><CheckCircle2 aria-hidden="true" /><code>CheckCircle2</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ChevronDown aria-hidden="true" /><code>ChevronDown</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ChevronRight aria-hidden="true" /><code>ChevronRight</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ChevronUp aria-hidden="true" /><code>ChevronUp</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Clock aria-hidden="true" /><code>Clock</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Coffee aria-hidden="true" /><code>Coffee</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><History aria-hidden="true" /><code>History</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><House aria-hidden="true" /><code>House</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Lock aria-hidden="true" /><code>Lock</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><LockKeyhole aria-hidden="true" /><code>LockKeyhole</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><LoaderCircle aria-hidden="true" /><code>LoaderCircle</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><LogIn aria-hidden="true" /><code>LogIn</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Minus aria-hidden="true" /><code>Minus</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Phone aria-hidden="true" /><code>Phone</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Plus aria-hidden="true" /><code>Plus</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><RefreshCw aria-hidden="true" /><code>RefreshCw</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><ShoppingCart aria-hidden="true" /><code>ShoppingCart</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><UserRound aria-hidden="true" /><code>UserRound</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><Users aria-hidden="true" /><code>Users</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center"><X aria-hidden="true" /><code>X</code></div>
      </div>
    `,
  }),
};
