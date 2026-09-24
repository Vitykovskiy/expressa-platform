<template>
  <header class="menu-screen-heading"><h1>Меню</h1></header>
</template>

<style scoped>
.menu-screen-heading {
  margin-top: calc(-1 * var(--expressa-space-24));
  margin-bottom: var(--expressa-space-16);
}
.menu-screen-heading h1 {
  margin: 0;
  font-size: var(--expressa-font-size-screen-title);
  font-weight: var(--expressa-font-weight-bold);
  line-height: var(--expressa-line-height-heading);
}
@media (max-width: 767px) {
  .menu-screen-heading {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    block-size: 52px;
    margin: calc(-1 * (var(--expressa-space-16) + var(--expressa-space-24)))
      calc(-1 * var(--expressa-space-16)) var(--expressa-space-16);
    padding-inline: var(--expressa-space-16);
    background: var(--expressa-color-surface);
    border-bottom: var(--expressa-border-width-default) solid
      var(--expressa-color-border);
  }
  .menu-screen-heading h1 {
    font-size: var(--expressa-font-size-body);
  }
}
</style>
