<template>
  <StoryCanvas width="48rem">
    <h1>Foundations</h1>
    <section>
      <h2>Цвета</h2>
      <ul>
        <li v-for="color in colors" :key="color">
          {{ color }}
        </li>
      </ul>
    </section>
    <section>
      <h2>Типографика</h2>
      <h3>Заголовок 32</h3>
      <h4>Подзаголовок 20</h4>
      <p>Основной текст 16. Читаемая строка для мобильного заказа.</p>
      <small>Вторичный текст 14</small>
    </section>
    <section>
      <h2>Отступы, радиусы и тени</h2>
      <ul>
        <li v-for="space in spaces" :key="space">
          {{ space }}
        </li>
      </ul>
    </section>
    <section>
      <h2>Иконки и сетка</h2>
      <p>
        <span v-for="icon in icons" :key="icon" aria-hidden="true"
          >{{ icon }}
        </span>
      </p>
      <p>12 колонок</p>
    </section>
  </StoryCanvas>
</template>

<script setup lang="ts">
import StoryCanvas from "./StoryCanvas.vue";

const colors = ["Brand", "Accent", "Surface", "Text", "Danger", "Success"];
const spaces = ["4 px", "8 px", "12 px", "16 px", "24 px", "32 px"];
const icons = ["←", "＋", "−", "×"];
</script>

<style scoped>
section {
  display: grid;
  gap: var(--fo-space-2);
}
h1,
h2,
h3,
h4,
p {
  margin: 0;
}
</style>
