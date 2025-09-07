// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';
import { loadCharacter } from './utils/persistence';
import { WorldMap } from './components/WorldMap';

/**
 * Die Haupt-Spielansicht, die jetzt die interaktive Karte steuert.
 */
const MainGame = ({ character }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const handleWheel = (e) => {
    // e.deltaY ist positiv beim Heranzoomen, negativ beim Herauszoomen
    const zoomDirection = e.deltaY < 0 ? 1 : -1;
    setZoom(prevZoom => {
      const newZoom = prevZoom + zoomDirection * 0.1;
      // Begrenzt den Zoom auf Min/Max-Werte
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Speichert die Startposition der Maus relativ zum aktuellen Offset
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    // Berechnet den neuen Offset basierend auf der Mausbewegung
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setOffset({ x: newX, y: newY });
  };

  return (
    // Dieser Container fängt alle Mausereignisse ab
    <div 
      className="main-game-viewport"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp} // Beendet das Ziehen, wenn die Maus das Fenster verlässt
    >
      <WorldMap zoom={zoom} offset={offset} />
    </div>
  );
}

function App() {
  const [gameState, setGameState] = useState('loading');
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    const savedCharacter = loadCharacter();
    if (savedCharacter) {
      setCharacter(savedCharacter);
      setGameState('ingame');
    } else {
      setGameState('creation');
    }
  }, []);

  const startGame = (createdCharacter) => {
    setCharacter(createdCharacter);
    setGameState('ingame');
  };

  if (gameState === 'loading') {
    return <div>Lade...</div>;
  }
  
  return (
    <div className="game-wrapper">
      {gameState === 'creation' && <CharacterCreationScreen onCharacterFinalized={startGame} />}
      {gameState === 'ingame' && <MainGame character={character} />}
    </div>
  );
}

export default App;
