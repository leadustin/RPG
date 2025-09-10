// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import StartScreenView from '../views/StartScreenView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartScreenView,
    },
    {
      path: '/character-creation',
      name: 'character-creation',
      // Lazy loading: Diese Komponente wird erst geladen, wenn sie gebraucht wird.
      component: () => import('../views/CharacterCreationView.vue'),
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/GameView.vue'),
    },
    {
      path: '/character-sheet',
      name: 'character-sheet',
      component: () => import('../views/CharacterSheetView.vue'),
    },
  ],
})

export default router
