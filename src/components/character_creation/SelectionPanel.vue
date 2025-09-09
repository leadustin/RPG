<template>
  <div class="selection-panel">
    <component :is="activeComponent" :character="character" @update-character="onUpdateCharacter" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Importiere ALLE möglichen Unter-Komponenten, die hier angezeigt werden können.
// Wir müssen diese als Nächstes erstellen.
import RaceSelection from './RaceSelection.vue'
import SubraceSelection from './SubraceSelection.vue'
import AncestrySelection from './AncestrySelection.vue'
import ClassSelection from './ClassSelection.vue'
import BackgroundSelection from './BackgroundSelection.vue'
import AbilitySelection from './AbilitySelection.vue'

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

const emit = defineEmits(['update-character'])

// Dies ist das Herzstück: Eine computed Property, die basierend auf
// dem currentStep die richtige Komponenten-Definition zurückgibt.
// Ändert sich `props.currentStep`, wird diese Property automatisch neu ausgewertet.
const activeComponent = computed(() => {
  switch (props.currentStep) {
    case 'Race':
      return RaceSelection
    case 'Subrace':
      // Hier bilden wir die spezielle Logik für Drachenblütige nach
      return props.character.race?.key === 'dragonborn' ? AncestrySelection : SubraceSelection
    case 'Class':
      return ClassSelection
    case 'Background':
      return BackgroundSelection
    case 'Abilities':
      return AbilitySelection
    default:
      // Fallback, falls etwas schiefgeht
      return null
  }
})

// Wenn eine Kind-Komponente ein 'update-character'-Event sendet,
// fangen wir es hier ab und leiten es an die Eltern-Komponente weiter.
const onUpdateCharacter = (newValues) => {
  emit('update-character', newValues)
}
</script>

<style scoped>
/* Hier den Inhalt von SelectionPanel.css einfügen */
.selection-panel {
  background-color: rgba(28, 28, 28, 0.85);
  border: 1px solid #c7a25a; /* Angepasste Farbe */
  padding: 20px;
  backdrop-filter: blur(5px);
  color: #fff; /* Standard-Textfarbe für dieses Panel */
  overflow-y: auto; /* Sorgt für Scrollbarkeit bei viel Inhalt */
}
</style>
