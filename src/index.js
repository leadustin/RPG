// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Finde das 'root'-Element in der HTML-Datei
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// Rendere die Haupt-App-Komponente
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
