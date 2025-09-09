<template>
  <div class="action-bar-container">
    <div class="combat-log">
      <p>Willkommen im Spiel!</p>
    </div>
    <div class="skill-bar">
      <div class="skill-slot">1</div>
      <div class="skill-slot">2</div>
      <div class="skill-slot">3</div>
      <div class="skill-slot">4</div>
    </div>
  </div>
</template>

<script setup>
// Diese Komponente benötigt keine Logik, daher bleibt dieser Bereich leer.
</script>

<style scoped>
/* Hier den kompletten Inhalt von ActionBar.css einfügen */
.action-bar-container {
  display: flex;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  align-items: center;
}

.combat-log {
  width: 45%;
  height: 90%;
  background-color: #111;
  border-radius: 5px;
  padding: 15px;
  color: #ccc;
  overflow-y: auto;
  margin-right: 20px;
  box-sizing: border-box;
}

.skill-bar {
  flex-grow: 1;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
  padding-right: 20px;
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
</style>
