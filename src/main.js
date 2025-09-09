// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Erstelle die Vue-App-Instanz
const app = createApp(App)

// Binde Pinia und den Router an die App
app.use(createPinia()) // State Management aktivieren
app.use(router) // Routing aktivieren

// Hänge die App an das DOM-Element mit der ID 'app' an
app.mount('#app')
