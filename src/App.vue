<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<script setup>
// Importiert die RouterView Komponente von vue-router
import { RouterView } from 'vue-router'

// In <script setup> ist das alles!
// Die Logik zur Zustandsverwaltung (gameState, character) wird
// in unseren Pinia-Store verschoben, was wir als Nächstes tun.
</script>

<style>
/* Globale Stile für die ganze App */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #1a1a1a; /* Hintergrund für die "Balken" links/rechts */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;

  /* Wichtig für die Zentrierung */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
