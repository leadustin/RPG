<template>
  <div class="ability-selection-container">
    <div class="points-display">
      Verbleibende Punkte: <span>{{ remainingPoints }}</span>
    </div>

    <ul class="ability-list features-list">
      <li v-for="abiKey in ABILITIES" :key="abiKey" class="ability-item">
        <strong>{{ abiKey.toUpperCase() }}</strong>

        <div class="ability-controls">
          <button @click="handleScoreChange(abiKey, -1)" :disabled="scores[abiKey] <= 8">-</button>
          <span class="base-score">{{ scores[abiKey] }}</span>
          <button @click="handleScoreChange(abiKey, 1)" :disabled="isIncreaseDisabled(abiKey)">
            +
          </button>
        </div>

        <div class="ability-modifier">
          (Bonus:
          {{ racialBonuses[abiKey] > 0 ? `+${racialBonuses[abiKey]}` : racialBonuses[abiKey] }})
        </div>

        <div class="final-score">
          Endwert: <strong>{{ finalScores[abiKey] }}</strong> ({{
            getModifier(finalScores[abiKey])
          }})
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { getRacialAbilityBonus, getAbilityModifier } from '../../engine/characterEngine'

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

// `reactive` ist ideal für unser `scores`-Objekt
const scores = reactive(props.character.abilities)

// `computed` anstatt `useState` und `useEffect` für die Punkte.
// Diese Property wird automatisch neu berechnet, wenn `scores` sich ändert.
const remainingPoints = computed(() => {
  const spentPoints = ABILITIES.reduce((total, abi) => total + POINT_COST[scores[abi]], 0)
  return 27 - spentPoints
})

// Weitere computed Properties für sauberes Template
const racialBonuses = computed(() => {
  const bonuses = {}
  for (const abi of ABILITIES) {
    bonuses[abi] = getRacialAbilityBonus(props.character, abi)
  }
  return bonuses
})

const finalScores = computed(() => {
  const final = {}
  for (const abi of ABILITIES) {
    final[abi] = scores[abi] + racialBonuses.value[abi]
  }
  return final
})

const handleScoreChange = (ability, delta) => {
  const currentScore = scores[ability]
  const newScore = currentScore + delta

  if (newScore < 8 || newScore > 15) return

  const costChange = POINT_COST[newScore] - POINT_COST[currentScore]

  if (costChange > remainingPoints.value) {
    return // Nicht genug Punkte
  }

  scores[ability] = newScore
  emit('update-character', { abilities: scores })
}

const isIncreaseDisabled = (abiKey) => {
  const nextScore = scores[abiKey] + 1
  if (nextScore > 15) return true
  const cost = POINT_COST[nextScore] - POINT_COST[scores[abiKey]]
  return remainingPoints.value < cost
}

const getModifier = (score) => {
  const mod = getAbilityModifier(score)
  return mod >= 0 ? `+${mod}` : mod
}
</script>

<style scoped>
/* Hier den Inhalt von AbilitySelection.css einfügen */
.ability-selection-container {
  padding: 10px;
}
.points-display {
  text-align: center;
  font-size: 1.5em;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #4a4a4a;
}
.points-display span {
  color: #c7a25a;
  font-weight: bold;
}
.ability-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px !important;
}
.ability-item strong {
  flex-basis: 50px;
  margin-bottom: 0 !important;
}
.ability-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ability-controls button {
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 1.2em;
}
.base-score {
  font-size: 1.2em;
  width: 30px;
  text-align: center;
}
.ability-modifier {
  font-size: 0.9em;
  color: #aaa;
  flex-basis: 80px;
}
.final-score {
  flex: 1;
  text-align: right;
}
</style>
