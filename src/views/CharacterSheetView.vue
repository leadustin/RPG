<template>
  <div v-if="character" class="sheet-container">
    <div class="stats-panel panel">
      <p>Stats & Infos</p>
    </div>

    <div class="character-preview-panel panel">
      <EquipmentPanel />
    </div>

    <div class="inventory-panel panel">
      <InventoryPanel />
    </div>
  </div>
  <div v-else>
    <p style="color: white">Kein Charakter gefunden. Leite zum Hauptmenü weiter...</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useRouter } from 'vue-router'
import EquipmentPanel from '../components/character_sheet/EquipmentPanel.vue'
import InventoryPanel from '../components/character_sheet/InventoryPanel.vue'

const gameStore = useGameStore()
const router = useRouter()
const character = computed(() => gameStore.character)

if (!character.value) {
  router.push('/')
}
</script>

<style scoped>
.sheet-container {
  width: 1174px;
  height: 928px;
  background-color: #1a1a1a;
  color: #fff;
  display: grid;
  /* Angepasste Spalten für das neue Layout */
  grid-template-columns: 320px 1fr 400px; /* Stats | Vorschau/Ausrüstung | Inventar */
  grid-template-rows: 1fr;
  gap: 15px;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.8);
}

.panel {
  background-color: rgba(40, 40, 40, 0.8);
  border: 1px solid #555;
  border-radius: 5px;
  padding: 15px;
  box-sizing: border-box;
}
</style>
