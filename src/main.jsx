// src/main.jsx
import { StrictMode, Suspense } from 'react'; // Suspense importieren
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import './i18n'; // Die i18n-Konfiguration importieren

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Suspense wird für das Laden der Übersetzungen benötigt */}
    <Suspense fallback="Loading...">
      <App />
    </Suspense>
  </StrictMode>,
);