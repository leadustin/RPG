<template>
  <div class="background-selection-container">
    <div class="background-list">
      <button
        v-for="bg in allBackgroundData"
        :key="bg.key"
        class="background-button"
        :class="{ selected: character.background?.key === bg.key }"
        @click="handleSelectBackground(bg)"
      >
        {{ bg.name }}
      </button>
    </div>

    <div v-if="character.background" class="background-details panel-details">
      <h2>{{ character.background.name }}</h2>
      <p class="background-description">{{ character.background.description }}</p>

      <div class="details-divider"></div>

      <h3>Fertigkeiten & mehr</h3>
      <ul class="features-list">
        <li>
          <strong>Geübte Fertigkeiten:</strong>
          {{ character.background.skill_proficiencies.join(', ') }}
        </li>
        <li v-if="character.background.tool_proficiencies?.length > 0">
          <strong>Geübte Werkzeuge:</strong>
          {{ character.background.tool_proficiencies.join(', ') }}
        </li>
        <li v-if="character.background.languages?.length > 0">
          <strong>Sprachen:</strong>
          {{ character.background.languages.join(', ') }}
        </li>
      </ul>

      <div class="details-divider"></div>

      <h3>Merkmal: {{ character.background.feature.name }}</h3>
      <p class="background-description">{{ character.background.feature.description }}</p>
    </div>
  </div>
</template>

<script setup>
import allBackgroundData from '../../data/backgrounds.json'

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

const handleSelectBackground = (background) => {
  emit('update-character', { background })
}
</script>

<style scoped>
/* Hier den Inhalt von BackgroundSelection.css und relevante Teile von PanelDetails.css einfügen */
.background-selection-container {
  display: flex;
  height: 100%;
  gap: 20px;
}

.background-list {
  display: flex;
  flex-direction: column;
  flex-basis: 30%;
  gap: 5px;
}

.background-button {
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

.background-button:hover {
  background-color: #3a3a3a;
  border-color: #c7a25a;
}

.background-button.selected {
  border-left: 3px solid #c7a25a;
  background-color: rgba(168, 126, 76, 0.2);
  font-weight: bold;
}

.background-details {
  flex-basis: 70%;
  padding-left: 20px;
  border-left: 1px solid #4a4a4a;
}

/* Aus PanelDetails.css */
.panel-details h2 {
  color: #c7a25a;
}
.panel-details .details-divider {
  border-bottom: 1px solid #4a4a4a;
  margin: 15px 0;
}
.panel-details h3 {
  margin-top: 15px;
}
.panel-details .features-list {
  list-style: none;
  padding: 0;
}
.panel-details .background-description {
  font-style: italic;
  color: #ccc;
}
</style>
