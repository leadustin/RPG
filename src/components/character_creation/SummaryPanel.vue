<template>
  <div class="summary-panel">
    <div class="summary-header">
      <h2>{{ character.name || 'Namenlos' }}</h2>
      <h3 v-if="character.race">
        {{ character.race.name }} {{ character.subrace ? `(${character.subrace.name})` : '' }}
      </h3>
      <p v-if="character.class">Stufe {{ level }} {{ character.class.name }}</p>
    </div>
    <div class="details-divider"></div>

    <div class="summary-stats-grid">
      <div class="stat-box">
        <span class="stat-value">{{ ac }}</span>
        <span class="stat-label">Rüstungsklasse</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">{{ hp }}</span>
        <span class="stat-label">Trefferpunkte</span>
      </div>
      <div class="stat-box">
        <span class="stat-value">{{
          proficiencyBonus > 0 ? `+${proficiencyBonus}` : proficiencyBonus
        }}</span>
        <span class="stat-label">Übungsbonus</span>
      </div>
    </div>
    <div class="details-divider"></div>

    <h3>Attribute</h3>
    <ul class="ability-summary-list features-list">
      <li v-for="(score, key) in finalScores" :key="key">
        <strong>{{ key.toUpperCase() }}</strong>
        <span>{{ score }} ({{ getModifier(score) }})</span>
      </li>
    </ul>
    <div class="details-divider"></div>

    <h3>Fertigkeiten</h3>
    <ul class="skill-summary-list features-list">
      <li v-for="(bonus, key) in skillBonuses" :key="key" class="skill-item">
        <div class="skill-info">
          <span
            :class="['proficiency-dot', { proficient: isProficientInSkill(character, key) }]"
          ></span>
          <span
            >{{ SKILL_NAMES_DE[key] }}
            <span class="skill-ability">({{ SKILL_MAP[key].toUpperCase() }})</span></span
          >
        </div>
        <span class="skill-bonus">{{ bonus >= 0 ? `+${bonus}` : bonus }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  getAbilityModifier,
  getProficiencyBonus,
  calculateInitialHP,
  calculateAC,
  getRacialAbilityBonus,
  calculateSkillBonus,
  isProficientInSkill,
  SKILL_MAP,
  SKILL_NAMES_DE,
} from '../../engine/characterEngine'

const props = defineProps({
  character: { type: Object, required: true },
})

const level = 1 // Vorerst fest auf 1

// Alle Berechnungen sind jetzt computed Properties
const proficiencyBonus = computed(() => getProficiencyBonus(level))
const hp = computed(() => calculateInitialHP(props.character))
const ac = computed(() => calculateAC(props.character))

const finalScores = computed(() => {
  const scores = {}
  for (const key of Object.keys(props.character.abilities)) {
    scores[key] = props.character.abilities[key] + getRacialAbilityBonus(props.character, key)
  }
  return scores
})

const skillBonuses = computed(() => {
  const bonuses = {}
  for (const key of Object.keys(SKILL_MAP)) {
    bonuses[key] = calculateSkillBonus(props.character, key)
  }
  return bonuses
})

// Helper für das Template
const getModifier = (score) => {
  const mod = getAbilityModifier(score)
  return mod >= 0 ? `+${mod}` : mod
}
</script>

<style scoped>
/* Hier den kompletten Inhalt von SummaryPanel.css einfügen */
.summary-panel {
  background-color: rgba(28, 28, 28, 0.85);
  border: 1px solid #c7a25a;
  padding: 20px;
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.summary-header {
  text-align: center;
  flex-shrink: 0;
}
.summary-header h2 {
  margin: 0 0 5px 0;
  color: #fff;
}
.summary-header p {
  margin: 5px 0 0 0;
  font-size: 0.9em;
}
.details-divider {
  border-bottom: 1px solid #4a4a4a;
  margin: 15px 0;
}
.summary-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  text-align: center;
  flex-shrink: 0;
}
.stat-box {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 1.8em;
  font-weight: bold;
  color: #fff;
}
.stat-label {
  font-size: 0.8em;
  text-transform: uppercase;
}
.ability-summary-list,
.skill-summary-list {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}
.ability-summary-list li,
.skill-item {
  display: flex;
  justify-content: space-between;
  padding: 5px;
  border-bottom: 1px solid #4a4a4a;
}
.skill-summary-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-top: 0;
  padding-right: 10px;
}
.skill-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.proficiency-dot {
  height: 8px;
  width: 8px;
  background-color: #4a4a4a;
  border-radius: 50%;
}
.proficiency-dot.proficient {
  background-color: #c7a25a;
}
.skill-ability {
  color: #aaa;
  font-size: 0.8em;
}
</style>
