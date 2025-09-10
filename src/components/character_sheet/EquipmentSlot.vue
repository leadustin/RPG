<template>
  <div class="equipment-slot">
    <div v-if="item" class="item-display">
      {{ item.name }}
    </div>
    <div v-else class="slot-empty">
      <span class="slot-label">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, default: null },
  label: { type: String, required: true },
  // Die slotKey-Prop wird von der Eltern-Komponente benötigt,
  // aber hier nicht direkt verwendet.
  slotKey: { type: String, required: true },
})
</script>

<style scoped>
.equipment-slot {
  width: 70px;
  height: 70px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #aaa;
  font-size: 0.8em;
  box-sizing: border-box;
  cursor: grab;
}
.equipment-slot:active {
  cursor: grabbing;
}
.item-display {
  padding: 5px;
  text-align: center;
  color: #fff;
  font-weight: bold;
}
.slot-empty {
  text-align: center;
}
.slot-label {
  opacity: 0.7;
}
</style>
