<template>
  <div class="subrace-container">
    <div v-if="subraces && subraces.length > 0">
      <h2>Wähle ein Untervolk für {{ character.race.name }}</h2>
      <div class="subrace-options">
        <button
          v-for="sub in subraces"
          :key="sub.key"
          class="subrace-button"
          :class="{ selected: character.subrace?.key === sub.key }"
          @click="handleSelectSubrace(sub)"
        >
          {{ sub.name }}
        </button>
      </div>

      <div v-if="character.subrace" class="subrace-details panel-details">
        <div class="details-divider"></div>
        <h3>{{ character.subrace.name }}</h3>
        <p class="race-description">{{ character.subrace.description }}</p>
      </div>
    </div>

    <div v-else>
      <h2>Keine Untervölker</h2>
      <p>Das Volk '{{ character.race.name }}' hat keine verfügbaren Untervölker.</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

// Eine computed property macht den Zugriff im Template sauberer
const subraces = computed(() => props.character.race?.subraces)

const handleSelectSubrace = (subrace) => {
  // Sende das Event mit dem ausgewählten Untervolk an die Eltern-Komponente
  emit('update-character', { subrace: subrace })
}
</script>

<style scoped>
/* Hier den Inhalt von SubraceSelection.css und relevante Teile von PanelDetails.css einfügen */
.subrace-container h2 {
  color: #c7a25a;
}

.subrace-options {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.subrace-button {
  color: #fff;
  background-color: #4a4a4a;
  border: 1px solid #3a3a3a;
  padding: 8px 15px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.subrace-button:hover {
  background-color: #5a5a5a;
}

.subrace-button.selected {
  background-color: #c7a25a;
  border-color: #fff;
  color: #1a1a1a;
}

/* Aus PanelDetails.css */
.panel-details .details-divider {
  border-bottom: 1px solid #4a4a4a;
  margin: 15px 0;
}
.panel-details h3 {
  margin-top: 15px;
}
.panel-details .race-description {
  font-style: italic;
  color: #ccc;
}
</style>
