// src/stores/gameStore.js
import { defineStore } from 'pinia'
import router from '../router' // Wir importieren den Router, um navigieren zu können

// 'useGameStore' ist der Name unseres neuen "Hooks"
export const useGameStore = defineStore('game', {
  // state() ist wie das `useState` in React. Hier definieren wir unsere Daten.
  state: () => ({
    character: null,
  }),

  // getters sind berechnete Werte, z.B. um schnell zu prüfen, ob ein Charakter existiert.
  getters: {
    hasCharacter: (state) => !!state.character,
  },

  // actions sind die Funktionen, die den State verändern dürfen.
  // Sie entsprechen deinen `handle...`-Funktionen.
  actions: {
    /**
     * Setzt den finalisierten Charakter und wechselt zur Spielansicht.
     * @param {object} finalizedCharacter Das Charakter-Objekt aus der Erstellung.
     */
    finalizeCharacter(finalizedCharacter) {
      this.character = finalizedCharacter
      console.log('Character created:', this.character)
      // Anstatt setGameState('WORLD_MAP') nutzen wir jetzt den Router
      router.push('/game')
    },

    /**
     * Lädt einen Charakter aus dem Speicher und wechselt zur Spielansicht.
     * @param {object} loadedCharacter Der geladene Charakter.
     */
    loadCharacter(loadedCharacter) {
      this.character = loadedCharacter
      console.log('Character loaded:', this.character)
      // Und auch hier navigieren wir zur Spielansicht
      router.push('/game')
    },

    /**
     * Startet ein neues Spiel, indem es zur Charaktererstellung navigiert.
     */
    startNewGame() {
      this.character = null // Charakter zurücksetzen
      router.push('/character-creation')
    },
  },
})
