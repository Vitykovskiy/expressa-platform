import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta = {
  title: "Foundation/Vuetify",
  parameters: {
    layout: "fullscreen",
  },
  render: () => ({
    template: `
      <v-app>
        <v-main>
          <v-container class="pa-8">
            <v-card class="mx-auto" max-width="560" rounded="lg">
              <v-card-item>
                <v-card-title>Expressa Admin</v-card-title>
                <v-card-subtitle>Vue и Vuetify подключены к Storybook</v-card-subtitle>
              </v-card-item>
              <v-card-text class="d-flex ga-3 align-center">
                <v-chip color="success" variant="tonal">Foundation ready</v-chip>
                <v-btn color="primary">Основное действие</v-btn>
              </v-card-text>
            </v-card>
          </v-container>
        </v-main>
      </v-app>
    `,
  }),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
