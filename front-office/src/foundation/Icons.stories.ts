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
    layout: "fullscreen",
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
  parameters: {
    viewport: { defaultViewport: "mobile390" },
  },
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
      <div style="box-sizing:border-box;width:100%;min-height:100dvh;padding:var(--customer-spacing-xl);background:var(--customer-color-surface);color:var(--customer-color-text-on-surface)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(5.25rem,7.5rem));justify-content:center;gap:var(--customer-spacing-lg);max-width:48rem;margin:0 auto">
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ArrowLeft aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ArrowLeft</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ArrowRight aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ArrowRight</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><AlertCircle aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">AlertCircle</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Check aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Check</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><CheckCircle2 aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">CheckCircle2</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ChevronDown aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ChevronDown</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ChevronRight aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ChevronRight</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ChevronUp aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ChevronUp</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Clock aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Clock</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Coffee aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Coffee</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><History aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">History</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><House aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">House</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Lock aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Lock</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><LockKeyhole aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">LockKeyhole</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><LoaderCircle aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">LoaderCircle</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><LogIn aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">LogIn</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Minus aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Minus</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Phone aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Phone</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Plus aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Plus</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><RefreshCw aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">RefreshCw</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><ShoppingCart aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">ShoppingCart</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><UserRound aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">UserRound</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><Users aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">Users</code></div>
        <div style="display:grid;gap:var(--customer-spacing-sm);justify-items:center;min-width:0"><X aria-hidden="true" /><code style="font-size:var(--customer-font-size-body);line-height:var(--customer-line-height-label);overflow-wrap:anywhere;text-align:center">X</code></div>
        </div>
      </div>
    `,
  }),
};
