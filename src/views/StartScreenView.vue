<template>
  <div class="start-screen-container">
    <div class="menu-box">
      <h1>Mein RPG</h1>

      <button @click="handleNewGame">Neues Spiel</button>

      <button @click="handleLoadGame" :disabled="!saveFileExists">Spiel laden</button>

      <button :disabled="!gameStore.hasCharacter">Spiel speichern</button>

      <button @click="handleDeleteGame" :disabled="!saveFileExists" class="delete-button">
        Spielstand löschen
      </button>

      <button disabled>Optionen</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/gameStore'
import {
  loadCharacterFromFile,
  deleteCharacterFile,
  checkIfSaveFileExists,
} from '../utils/persistence'

// Holen uns eine Instanz unseres Game-Stores
const gameStore = useGameStore()

// `ref` ist Vue's Art, eine reaktive Variable zu erstellen (ähnlich wie useState)
const saveFileExists = ref(false)

// `onMounted` ist ein Lifecycle-Hook, der ausgeführt wird, sobald die Komponente "eingehängt" ist.
// Ähnlich zu `useEffect(() => {...}, [])` in React.
onMounted(() => {
  saveFileExists.value = checkIfSaveFileExists()
})

const handleNewGame = () => {
  // Ruft die 'startNewGame' Action aus unserem Store auf. Diese kümmert sich um die Navigation.
  gameStore.startNewGame()
}

const handleLoadGame = () => {
  const loadedCharacter = loadCharacterFromFile()
  if (loadedCharacter) {
    // Ruft die 'loadCharacter' Action auf, die den Charakter setzt und navigiert.
    gameStore.loadCharacter(loadedCharacter)
  }
}

const handleDeleteGame = () => {
  deleteCharacterFile()
  // Nach dem Löschen aktualisieren wir den Button-Zustand
  saveFileExists.value = false
}
</script>

<style scoped>
/* src/components/start_screen/StartScreen.css */
.start-screen-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url('https://www.wargamer.com/wp-content/sites/wargamer/2023/07/baldurs-gate-3-locations-wyrms-crossing.jpg');
  background-size: cover;
  background-position: center;
}

.menu-box {
  background-color: rgba(28, 28, 28, 0.85);
  border: 1px solid var(--color-selection);
  padding: 40px;
  backdrop-filter: blur(5px);
  text-align: center;
}

.menu-box h1 {
  font-size: 3em;
  margin-bottom: 30px;
  color: var(--color-text-light);
}

.menu-box button {
  display: block;
  width: 100%;
  padding: 15px;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.menu-box button:disabled {
  background-color: var(--color-background-light);
  cursor: not-allowed;
  opacity: 0.5;
}

.menu-box button.delete-button {
  background-color: #a71d1d; /* Rote Farbe für Gefahr */
  border-color: #8b1212;
}

.menu-box button.delete-button:hover {
  background-color: #c42d2d;
}
</style>
