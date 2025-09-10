<template>
  <div class="inventory-slot">
    <div v-if="item && !item.isEmpty" class="item-display">
      {{ item.name.charAt(0) }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, default: null },
})
</script>

<style scoped>
.inventory-slot {
  width: 60px;
  height: 60px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  color: #fff;
  cursor: grab;
}
.inventory-slot:active {
  cursor: grabbing;
}
.item-display {
  padding: 5px;
  text-align: center;
  font-weight: bold;
}
</style>
