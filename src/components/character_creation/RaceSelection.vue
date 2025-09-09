<template>
  <div class="race-selection-container">
    <div class="race-list">
      <button
        v-for="race in allRaceData"
        :key="race.key"
        class="race-button"
        :class="{ selected: character.race.key === race.key }"
        @click="handleSelectRace(race)"
      >
        {{ race.name }}
      </button>
    </div>

    <div class="race-details panel-details">
      <div class="character-identity">
        <div class="input-group">
          <label for="char-name">Name</label>
          <input id="char-name" type="text" :value="character.name" @input="updateName" />
        </div>
        <div class="input-group">
          <label>Geschlecht</label>
          <div class="gender-buttons">
            <button
              :class="{ selected: character.gender === 'Männlich' }"
              @click="emit('update-character', { gender: 'Männlich' })"
            >
              Männlich
            </button>
            <button
              :class="{ selected: character.gender === 'Weiblich' }"
              @click="emit('update-character', { gender: 'Weiblich' })"
            >
              Weiblich
            </button>
          </div>
        </div>
      </div>
      <div class="details-divider"></div>

      <h2>{{ character.race.name }}</h2>
      <div class="details-divider"></div>

      <h3>Attributs-Boost</h3>
      <p>{{ character.race.ability_bonuses.text }}</p>

      <ul v-if="floatingBonuses.length > 0" class="ability-bonus-list">
        <li v-for="abiKey in ABILITIES" :key="abiKey">
          <span>{{ abiKey.toUpperCase() }}</span>
          <div class="bonus-buttons">
            <button
              v-for="(bonusValue, index) in floatingBonuses"
              :key="index"
              @click="handleAssignBonus(abiKey, bonusValue)"
              :class="{ selected: assignments[abiKey] === bonusValue }"
              :disabled="assignments[abiKey] && assignments[abiKey] !== bonusValue"
            >
              +{{ bonusValue }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import allRaceData from '../../data/races.json'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

// Lokaler State nur für die Bonus-Zuweisung
const assignments = ref(props.character.ability_bonus_assignments || {})
const floatingBonuses = ref(props.character.race.ability_bonuses.floating || [])

// `watch` ist das Vue-Pendant zu `useEffect` mit Abhängigkeiten.
// Dieser Code wird immer dann ausgeführt, wenn sich `props.character.race` ändert.
watch(
  () => props.character.race,
  (newRace) => {
    let initialAssignments = newRace.ability_bonuses.fixed || {}
    assignments.value = initialAssignments
    floatingBonuses.value = newRace.ability_bonuses.floating || []

    // Wichtig: Beim Rassenwechsel Subrace und Ancestry zurücksetzen
    emit('update-character', {
      race: newRace,
      ability_bonus_assignments: initialAssignments,
      subrace: null,
      ancestry: null,
    })
  },
)

const handleSelectRace = (race) => {
  // Wenn die Rasse bereits ausgewählt ist, nichts tun
  if (props.character.race.key === race.key) return

  // Die Änderung wird über den watch-Hook oben verarbeitet, der dann das Event auslöst
  // Wir können aber auch direkt hier das Event auslösen, um die race sofort zu aktualisieren
  emit('update-character', { race })
}

const handleAssignBonus = (ability, bonus) => {
  const currentAssignments = { ...assignments.value }

  // Bonus entfernen, falls er schon woanders zugewiesen war
  const oldAbilityForBonus = Object.keys(currentAssignments).find(
    (key) => currentAssignments[key] === bonus,
  )
  if (oldAbilityForBonus) {
    delete currentAssignments[oldAbilityForBonus]
  }

  // Bonus zuweisen oder entfernen (Toggle)
  if (currentAssignments[ability] === bonus) {
    delete currentAssignments[ability]
  } else {
    currentAssignments[ability] = bonus
  }

  assignments.value = currentAssignments
  emit('update-character', { ability_bonus_assignments: currentAssignments })
}

const updateName = (event) => {
  emit('update-character', { name: event.target.value })
}
</script>

<style scoped>
/* Hier den Inhalt von RaceSelection.css UND PanelDetails.css einfügen */
/* RaceSelection.css */
.race-selection-container {
  display: flex;
  height: 100%;
  gap: 20px;
}
.race-list {
  display: flex;
  flex-direction: column;
  flex-basis: 30%;
  gap: 5px;
}
.race-button {
  width: 100%;
  padding: 15px;
  background-color: transparent;
  border: 1px solid #4a4a4a;
  color: #fff;
  font-size: 1.1em;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}
.race-button:hover {
  background-color: #3a3a3a;
  border-color: #c7a25a;
}
.race-button.selected {
  border-left: 3px solid #c7a25a;
  background-color: rgba(168, 126, 76, 0.2);
  font-weight: bold;
}
.race-details {
  flex-basis: 70%;
  padding-left: 20px;
  border-left: 1px solid #4a4a4a;
}

/* PanelDetails.css (Auszug) */
.panel-details h2 {
  color: #c7a25a;
  margin-top: 0;
}
.details-divider {
  border-bottom: 1px solid #4a4a4a;
  margin: 15px 0;
}
.ability-bonus-list {
  list-style: none;
  padding: 0;
}
.ability-bonus-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #4a4a4a;
}
.bonus-buttons {
  display: flex;
  gap: 5px;
}
.bonus-buttons button {
  background-color: #4a4a4a;
  border: 1px solid #3a3a3a;
  color: #fff;
  padding: 4px 8px;
  cursor: pointer;
}
.bonus-buttons button.selected {
  background-color: #c7a25a;
  border-color: #fff;
}
.bonus-buttons button:disabled {
  background-color: #333;
  cursor: not-allowed;
  opacity: 0.5;
}
.character-identity {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.input-group {
  flex: 1;
}
.input-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9em;
}
.input-group input,
.gender-buttons {
  width: 100%;
}
.gender-buttons {
  display: flex;
}
.gender-buttons button {
  flex: 1; /* ...weitere Stile... */
}
.gender-buttons button.selected {
  background-color: #c7a25a;
}
</style>
