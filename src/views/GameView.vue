<template>
  <div v-if="character" class="game-view-container">
    <div class="portraits-area">
      <PartyPortraits :party="party" />
    </div>
    <div class="main-content-area">
      <WorldMap :character="character" />
    </div>
    <div class="action-bar-area">
      <ActionBar />
    </div>
  </div>
  <div v-else class="loading-screen">
    <p>Lade Charakter...</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { useRouter } from 'vue-router'

// Imports für die Kind-Komponenten aktivieren
import WorldMap from '../components/worldmap/WorldMap.vue'
import PartyPortraits from '../components/game_view/PartyPortraits.vue'
import ActionBar from '../components/game_view/ActionBar.vue'

const gameStore = useGameStore()
const router = useRouter()

// Holen den Charakter direkt aus dem Store
const character = computed(() => gameStore.character)

// Erstellen das Party-Array für die Porträts
const party = computed(() => (character.value ? [character.value, null, null, null] : []))

// Sicherheits-Check: Wenn die Seite neu geladen wird und kein Charakter im Store ist,
// leiten wir zurück zum Startbildschirm.
if (!character.value) {
  router.push('/')
}
</script>

<style scoped>
.game-view-container {
  display: grid;

  /* Feste Größe basierend auf dem Original-CSS */
  width: 1174px; /* 150px (Portraits) + 1024px (Map) */
  height: 928px; /* 640px (Map) + 288px (Action Bar) */

  /* Das Grid-Layout bleibt fast gleich, aber ohne flexible Einheiten */
  grid-template-columns: 150px 1024px;
  grid-template-rows: 640px 288px;

  background-color: #000;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.8); /* Optional: Ein schöner Schatten */
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-size: 1.5em;
}

.portraits-area {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: #2a2a2a;
  border-right: 2px solid #444;
}

.main-content-area {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-bar-area {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  background-color: #1e1e1e;
  border-top: 2px solid #444;
}
</style>
