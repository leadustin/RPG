// src/stores/gameStore.js
import { defineStore } from 'pinia'
import router from '../router'

export const useGameStore = defineStore('game', {
  state: () => ({
    character: null,
  }),

  getters: {
    hasCharacter: (state) => !!state.character,
  },

  actions: {
    // Aktionen aus der Charaktererstellung & Spielstart
    finalizeCharacter(finalizedCharacter) {
      this.character = finalizedCharacter
      console.log('Character created:', this.character)
      router.push('/game')
    },

    loadCharacter(loadedCharacter) {
      this.character = loadedCharacter
      console.log('Character loaded:', this.character)
      router.push('/game')
    },

    startNewGame() {
      this.character = null
      router.push('/character-creation')
    },

    // =================================================================
    // AKTIONEN FÜR DAS INVENTAR-MANAGEMENT
    // =================================================================

    /**
     * Wird aufgerufen, wenn sich ein Ausrüstungsslot ändert.
     * @param {string} slotId Der Slot, der sich geändert hat (z.B. 'head').
     * @param {object} event Das @change-Event von vuedraggable.
     */
    handleEquipmentChange(slotId, event) {
      if (!this.character) return

      // --- Fall 1: Ein Gegenstand wurde zum Slot HINZUGEFÜGT ---
      if (event.added) {
        const item = event.added.element

        // PRÜFUNG: Passt der Gegenstand in den Slot? (erlaubt auch 'ring' für 'ring1'/'ring2')
        const isValidSlot =
          item.slot === slotId || (item.slot === 'ring' && slotId.startsWith('ring'))

        if (!isValidSlot) {
          console.error(`Gegenstand ${item.name} passt nicht in Slot ${slotId}.`)

          // WICHTIG: Die UI-Änderung sofort rückgängig machen.
          // Wir fügen den Gegenstand wieder zum Inventar hinzu, von wo er kam.
          const invIndex = this.character.inventory.findIndex((i) => i.id === item.id)
          if (invIndex === -1) {
            // Nur hinzufügen, wenn nicht schon vorhanden
            this.character.inventory.push(item)
          }
          return // Aktion abbrechen
        }

        // Gegenstand ausrüsten
        const previouslyEquipped = this.character.equipment[slotId]
        if (previouslyEquipped) {
          // Alten Gegenstand ins Inventar legen
          this.character.inventory.push(previouslyEquipped)
        }
        this.character.equipment[slotId] = item
      }
      // --- Fall 2: Ein Gegenstand wurde vom Slot ENTFERNT ---
      else if (event.removed) {
        // Der Gegenstand wurde bereits von vuedraggable ins Inventar verschoben.
        // Wir müssen nur noch den Slot leeren.
        this.character.equipment[slotId] = null
      }
    },

    /**
     * Aktualisiert das gesamte Inventar-Array.
     * Wird vom vuedraggable-Setter aufgerufen, wenn Items im Inventar verschoben werden.
     * @param {Array} newInventory Das neue, sortierte Inventar-Array.
     */
    updateInventory(newInventory) {
      if (this.character) {
        this.character.inventory = newInventory
      }
    },
  },
})
