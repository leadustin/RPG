<template>
  <div class="action-bar-container">
    <div class="combat-log">
      <p>Willkommen im Spiel!</p>
    </div>

    <div class="controls-area">
      <div class="skill-bar">
        <div class="skill-slot">1</div>
        <div class="skill-slot">2</div>
        <div class="skill-slot">3</div>
        <div class="skill-slot">4</div>
      </div>

      <button class="char-sheet-button" @click="goToCharacterSheet">Charakter</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCharacterSheet = () => {
  router.push('/character-sheet')
}
</script>

<style scoped>
.action-bar-container {
  display: flex;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between; /* Sorgt für Abstand zwischen Log und Controls */
}

.combat-log {
  width: 45%;
  height: 90%;
  background-color: #111;
  border-radius: 5px;
  padding: 15px;
  color: #ccc;
  overflow-y: auto;
  box-sizing: border-box;
}

.controls-area {
  display: flex;
  align-items: center;
  gap: 20px;
}

.skill-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}

.skill-slot {
  width: 60px;
  height: 60px;
  background-color: #333;
  border: 2px solid #555;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.skill-slot:hover {
  background-color: #444;
}

.char-sheet-button {
  padding: 15px 30px;
  font-size: 1.2em;
  color: white;
  background-color: #4a4a4a;
  border: 2px solid #c7a25a;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.char-sheet-button:hover {
  background-color: #5a5a5a;
}
</style>
