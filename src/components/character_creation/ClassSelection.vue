<template>
  <div class="class-selection-container">
    <div class="class-grid">
      <button
        v-for="cls in allClassData"
        :key="cls.key"
        class="class-button"
        :class="{ selected: character.class?.key === cls.key }"
        @click="handleSelectClass(cls)"
      >
        <div class="class-icon-placeholder"></div>
        <span>{{ cls.name }}</span>
      </button>
    </div>

    <div class="class-details panel-details" v-if="character.class">
      <h2>{{ character.class.name }}</h2>
      <p class="class-description">{{ character.class.description }}</p>
      <div class="details-divider"></div>

      <h3>Klassenmerkmale (Stufe 1)</h3>
      <ul class="features-list">
        <li v-for="feature in levelOneFeatures" :key="feature.name">
          <strong>{{ feature.name }}:</strong> {{ feature.description }}
        </li>
      </ul>

      <template v-if="skillChoiceData">
        <div class="details-divider"></div>
        <SkillSelection
          :options="skillOptions"
          :max-choices="skillChoiceData.choose"
          :selections="character.skill_proficiencies_choice"
          @update-selections="handleSkillChange"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import allClassData from '../../data/classes.json'
import { SKILL_NAMES_DE } from '../../engine/characterEngine'

// Platzhalter für die SkillSelection Komponente, die wir als Nächstes erstellen
import SkillSelection from './SkillSelection.vue'

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

const handleSelectClass = (cls) => {
  // Event mit der neuen Klasse und zurückgesetzten Fertigkeiten senden
  emit('update-character', { class: cls, skill_proficiencies_choice: [] })
}

const handleSkillChange = (newSelections) => {
  emit('update-character', { skill_proficiencies_choice: newSelections })
}

// Computed property, um die Merkmale für Level 1 zu filtern
const levelOneFeatures = computed(() => {
  return props.character.class?.features.filter((f) => f.level === 1) || []
})

// Computed property für die Daten zur Fertigkeiten-Auswahl
const skillChoiceData = computed(() => {
  return props.character.class?.proficiencies.skills
})

// Computed property, um die deutschen Fertigkeitsnamen in die englischen Keys umzuwandeln
const skillOptions = computed(() => {
  if (!skillChoiceData.value) return []
  // Wandelt ['Akrobatik', 'Fingerfertigkeit'] in ['acrobatics', 'sleight_of_hand'] um
  return skillChoiceData.value.from.map((skillNameDE) =>
    Object.keys(SKILL_NAMES_DE).find((key) => SKILL_NAMES_DE[key] === skillNameDE),
  )
})
</script>

<style scoped>
/* Hier den Inhalt von ClassSelection.css und relevante Teile von PanelDetails.css einfügen */
.class-selection-container {
  display: flex;
  height: 100%;
  gap: 20px;
}
.class-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: min-content;
  gap: 10px;
  flex-basis: 40%;
  align-content: start;
}
.class-button {
  background-color: transparent;
  border: 1px solid #4a4a4a;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  gap: 8px;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}
.class-button:hover {
  background-color: #3a3a3a;
  border-color: #c7a25a;
}
.class-button.selected {
  border-color: #c7a25a;
  background-color: rgba(168, 126, 76, 0.2);
}
.class-details {
  flex-basis: 60%;
  padding-left: 20px;
  border-left: 1px solid #4a4a4a;
}
/* ... (weitere Stile aus der .css-Datei) ... */
</style>
