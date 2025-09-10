<template>
  <div class="inventory-container">
    <h3>Inventar</h3>
    <draggable v-model="inventoryGrid" item-key="id" class="inventory-grid" group="items">
      <template #item="{ element }">
        <InventorySlot :item="element" />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import InventorySlot from './InventorySlot.vue'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()
// Der fehlerhafte 'const character = ...' wurde entfernt.

const GRID_SIZE = 48 // 6 Spalten * 8 Reihen

const inventoryGrid = computed({
  get() {
    const grid = []
    // KORREKTUR: Greife direkt auf den reaktiven gameStore zu
    const inventoryItems = gameStore.character?.inventory || []

    for (let i = 0; i < GRID_SIZE; i++) {
      if (i < inventoryItems.length) {
        grid.push(inventoryItems[i])
      } else {
        // Erzeuge Platzhalter mit eindeutiger ID
        grid.push({ id: `empty-${i}`, isEmpty: true })
      }
    }
    return grid
  },
  set(newGridValue) {
    const newInventory = newGridValue.filter((item) => !item.isEmpty)
    gameStore.updateInventory(newInventory)
  },
})
</script>

<style scoped>
.inventory-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.inventory-container h3 {
  text-align: center;
  margin: 0;
  color: #c7a25a;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
  padding-top: 10px;
  border-top: 1px solid #555;
  height: 100%;
}
</style>
