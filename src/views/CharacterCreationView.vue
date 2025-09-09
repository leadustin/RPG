<template>
  <div class="creation-screen-container">
    <CreationSidebar
      :current-step="currentStep"
      @update:current-step="setCurrentStep"
      :character="character"
    />

    <SelectionPanel
      :current-step="currentStep"
      :character="character"
      @update-character="updateCharacter"
    />

    <SummaryPanel :character="character" />

    <div class="finalize-bar">
      <button @click="handleFinalize">Charakter abschließen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useGameStore } from '../stores/gameStore'

// Importiere die Kind-Komponenten (diese müssen wir später noch erstellen)
import CreationSidebar from '../components/character_creation/CreationSidebar.vue'
import SelectionPanel from '../components/character_creation/SelectionPanel.vue'
import SummaryPanel from '../components/character_creation/SummaryPanel.vue'

// Importiere die Charakter-Engine und die JSON-Daten
import { initializeCharacter } from '../engine/characterEngine'

// Holen uns eine Instanz unseres Game-Stores
const gameStore = useGameStore()

// `ref` für einfache Werte wie Strings oder Zahlen (ersetzt useState)
const currentStep = ref('Race')

// `reactive` für komplexe Objekte (ersetzt useState für Objekte)
// Wir initialisieren den Charakter mit einer Funktion aus unserer Engine.
const character = reactive(initializeCharacter())

// Methode, um den aktuellen Schritt zu ändern
const setCurrentStep = (step) => {
  currentStep.value = step
}

// Methode, um das Charakter-Objekt zu aktualisieren.
// Sie wird von der SelectionPanel-Komponente aufgerufen.
const updateCharacter = (newValues) => {
  Object.assign(character, newValues)
}

// Methode zum Abschließen der Charaktererstellung
const handleFinalize = () => {
  // Wir rufen die Action aus unserem Pinia-Store auf.
  // Diese kümmert sich um das Speichern und die Navigation zur GameView.
  gameStore.finalizeCharacter(character)
}
</script>

<style scoped>
/* Hier kommt der gesamte Inhalt deiner CharacterCreationScreen.css rein */
.creation-screen-container {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-columns: 300px 1fr 400px; /* Left | Center | Right */
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
  background-image: url('https://www.wargamer.com/wp-content/sites/wargamer/2023/07/baldurs-gate-3-locations-wyrms-crossing.jpg'); /* Platzhalter-Hintergrundbild */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.finalize-bar {
  /* Positioniert die Leiste über allen drei Spalten am unteren Rand */
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 10px;
}

.finalize-bar button {
  padding: 15px 40px;
  font-size: 1.5em;
  background-color: #c7a25a; /* Angepasste Farbe */
  border: 1px solid #fff; /* Angepasste Farbe */
  color: #1a1a1a; /* Angepasste Farbe */
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.finalize-bar button:hover {
  background-color: #e0b869; /* Angepasste Hover-Farbe */
}
</style>
