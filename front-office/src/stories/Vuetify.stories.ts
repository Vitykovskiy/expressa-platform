import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta = {
  title: "Foundation/Vuetify",
  parameters: {
    layout: "centered",
  },
  render: () => ({
    template: `
      <v-card width="360" title="Vuetify ready" subtitle="Customer foundation">
        <v-card-text>
          This technical story verifies Vuetify rendering inside Storybook.
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary">Continue</v-btn>
        </v-card-actions>
      </v-card>
    `,
  }),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
