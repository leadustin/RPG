<template>
  <div class="ancestry-container">
    <h2>Wähle eine Abstammung für {{ character.race.name }}</h2>
    <p>Deine Wahl bestimmt den Schadenstyp deiner Odemwaffe und deiner Schadensresistenz.</p>
    <div class="details-divider"></div>

    <div class="ancestry-grid">
      <button
        v-for="anc in ancestries"
        :key="anc.key"
        class="ancestry-button"
        :class="{ selected: character.ancestry?.key === anc.key }"
        @click="handleSelectAncestry(anc)"
      >
        {{ anc.name }}
      </button>
    </div>

    <div v-if="character.ancestry" class="ancestry-details panel-details">
      <div class="details-divider"></div>
      <h3>{{ character.ancestry.name }} Drache</h3>
      <ul class="features-list">
        <li><strong>Schadensresistenz:</strong> {{ character.ancestry.damage_type }}</li>
        <li><strong>Odemwaffe:</strong> {{ character.ancestry.breath_weapon }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  character: { type: Object, required: true },
})

const emit = defineEmits(['update-character'])

// computed property für einfacheren Zugriff im Template
const ancestries = computed(() => props.character.race?.ancestries || [])

const handleSelectAncestry = (ancestry) => {
  emit('update-character', { ancestry })
}
</script>

<style scoped>
/* Wir borgen uns hier die Stile von SubraceSelection.css und passen sie leicht an */
.ancestry-container h2 {
  color: #c7a25a;
}

.ancestry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.ancestry-button {
  color: #fff;
  background-color: #4a4a4a;
  border: 1px solid #3a3a3a;
  padding: 12px;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}

.ancestry-button:hover {
  background-color: #5a5a5a;
}

.ancestry-button.selected {
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
.panel-details .features-list {
  list-style: none;
  padding: 0;
}
</style>
