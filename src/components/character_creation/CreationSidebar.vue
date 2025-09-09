<template>
  <div class="sidebar-panel">
    <ul>
      <li
        v-for="step in steps"
        :key="step"
        :class="{
          active: currentStep === step,
          disabled: isSubraceStepDisabled(step),
        }"
        @click="handleStepClick(step)"
      >
        {{ getStepLabel(step) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// defineProps deklariert die Daten, die diese Komponente von außen erwartet.
const props = defineProps({
  currentStep: {
    type: String,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
})

// defineEmits deklariert die Events, die diese Komponente aussenden kann.
const emit = defineEmits(['update:currentStep'])

const steps = ['Race', 'Subrace', 'Class', 'Background', 'Abilities']

// `computed` ist wie ein `useMemo` in React. Der Wert wird nur neu berechnet,
// wenn sich eine der Abhängigkeiten (hier `props.character.race`) ändert.
const hasSubraces = computed(() => props.character.race?.subraces?.length > 0)
const hasAncestries = computed(() => props.character.race?.ancestries?.length > 0)

// Eine Methode, die prüft, ob der Subrace-Schritt deaktiviert sein soll.
const isSubraceStepDisabled = (step) => {
  return step === 'Subrace' && !hasSubraces.value && !hasAncestries.value
}

// Eine Methode, um das Label für den Schritt dynamisch zu ändern.
const getStepLabel = (step) => {
  if (step === 'Subrace' && hasAncestries.value) {
    return 'Abstammung'
  }
  return step
}

// Diese Methode wird beim Klick aufgerufen.
const handleStepClick = (step) => {
  if (isSubraceStepDisabled(step)) {
    return // Nichts tun, wenn der Schritt deaktiviert ist
  }
  // Sende das 'update:currentStep'-Event an die Eltern-Komponente.
  emit('update:currentStep', step)
}
</script>

<style scoped>
/* Hier den kompletten Inhalt aus CreationSidebar.css einfügen */
.sidebar-panel {
  background-color: rgba(28, 28, 28, 0.85);
  border: 1px solid #c7a25a; /* Angepasste Farbe */
  padding: 20px;
  backdrop-filter: blur(5px);
}

.sidebar-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-panel li {
  padding: 15px;
  font-size: 1.2em;
  cursor: pointer;
  border-bottom: 1px solid #4a4a4a; /* Angepasste Farbe */
  transition: background-color 0.2s;
  color: #fff; /* Angepasste Farbe */
}

.sidebar-panel li:hover {
  background-color: #3a3a3a; /* Angepasste Farbe */
}

.sidebar-panel li.active {
  color: #c7a25a; /* Angepasste Farbe */
  font-weight: bold;
}

.sidebar-panel li.disabled {
  color: #6a5b4c;
  cursor: not-allowed;
  background-color: transparent;
}
</style>
