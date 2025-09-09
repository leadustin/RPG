<template>
  <div class="skill-selection-container">
    <h4>Wähle {{ maxChoices }} Fertigkeiten</h4>
    <div class="skill-grid">
      <div
        v-for="skillKey in options"
        :key="skillKey"
        class="skill-choice"
        :class="{ selected: selections.includes(skillKey) }"
        @click="handleSelection(skillKey)"
      >
        {{ SKILL_NAMES_DE[skillKey] }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { SKILL_NAMES_DE } from '../../engine/characterEngine'

const props = defineProps({
  options: { type: Array, required: true },
  maxChoices: { type: Number, required: true },
  selections: { type: Array, required: true },
})

const emit = defineEmits(['update-selections'])

const handleSelection = (skillKey) => {
  // Erstelle eine Kopie des Arrays, um das Original nicht direkt zu verändern
  const newSelections = [...props.selections]
  const index = newSelections.indexOf(skillKey)

  if (index > -1) {
    // Auswahl aufheben
    newSelections.splice(index, 1)
  } else if (newSelections.length < props.maxChoices) {
    // Neue Auswahl hinzufügen, wenn das Limit nicht erreicht ist
    newSelections.push(skillKey)
  }

  // Sende das Event mit der neuen Liste an die Eltern-Komponente
  emit('update-selections', newSelections)
}
</script>

<style scoped>
/* Hier den Inhalt von SkillSelection.css einfügen */
.skill-selection-container {
  margin-top: 20px;
}

.skill-selection-container h4 {
  text-align: center;
  margin-bottom: 10px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.skill-choice {
  padding: 10px;
  border: 1px solid #4a4a4a;
  background-color: #3a3a3a;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
}

.skill-choice:hover {
  border-color: #c7a25a;
}

.skill-choice.selected {
  background-color: #c7a25a;
  color: #1a1a1a;
  font-weight: bold;
}
</style>
