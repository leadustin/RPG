<template>
  <div class="party-portraits-container">
    <div v-for="(member, index) in party" :key="index" class="portrait-slot">
      <template v-if="member">
        <div class="portrait-image"></div>
        <div class="health-bar-placeholder"></div>
      </template>
      <template v-else>
        <div class="portrait-empty">Leerer Platz</div>
      </template>
    </div>
  </div>
</template>

<script setup>
// Definiert die Props, die die Komponente von außen erwartet.
defineProps({
  party: {
    type: Array,
    required: true,
  },
})
</script>

<style scoped>
/* Hier den kompletten Inhalt von PartyPortraits.css einfügen */
.party-portraits-container {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.portrait-slot {
  position: relative;
  width: 120px;
  height: 120px;
  background-color: #333;
  border-radius: 5px;
  border: 2px solid #555;
  color: #fff;
  box-sizing: border-box;
}

.portrait-image {
  width: 100%;
  height: 100%;
  background-color: #555;
  border-radius: 3px;
}

.health-bar-placeholder {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 16px);
  height: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid #111;
  border-radius: 3px;
}

.portrait-empty {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.9em;
  color: #888;
}
</style>
