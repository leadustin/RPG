import React, { useRef, useEffect, useState, useCallback } from "react";
import PlayerCharacter from "./PlayerCharacter";
import "./WorldMap.css";

// --- Map-Konfiguration ---
const TILE_SIZE = 128;
const MAP_WIDTH_TILES = 32;
const MAP_HEIGHT_TILES = 24;
const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE;
const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE;

const CANVAS_WIDTH_PX = 1280;
const CANVAS_HEIGHT_PX = 640;

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.0;

// --- Geschwindigkeit der Spielfigur ---
const PLAYER_SPEED_PIXELS_PER_SECOND = 50; // Pixel pro Sekunde

// --- Hilfsfunktion: Wert in einem Bereich begrenzen ---
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// --- Bild-Import ---
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    images[item.replace("./", "").replace(".webp", "")] = r(item);
  });
  return images;
}
const mapImageSources = importAll(
  require.context("../../assets/images/map", false, /\.webp$/)
);

// --- Lade-Funktion für Bilder ---
const imageCache = {};
const loadMapImages = () => {
  const imagePromises = [];
  for (let y = 1; y <= MAP_HEIGHT_TILES; y++) {
    for (let x = 1; x <= MAP_WIDTH_TILES; x++) {
      const imageName = `map_${y}x${x}`;
      const imageSrc = mapImageSources[imageName];
      if (imageSrc) {
        const promise = new Promise((resolve, reject) => {
          const img = new Image();
          img.src = imageSrc;
          img.onload = () => {
            imageCache[imageName] = img;
            resolve();
          };
          img.onerror = () => reject(`Fehler beim Laden von ${imageName}`);
        });
        imagePromises.push(promise);
      }
    }
  }
  return Promise.all(imagePromises);
};

export const WorldMap = () => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const animationFrameId = useRef(); // Ref, um die ID des Animation Frames zu speichern
  const lastFrameTimeRef = useRef(performance.now());

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  // Zielposition (wird per Rechtsklick gesetzt)
  const playerTargetPosition = useRef({ x: 2048, y: 1536 });
  // Aktuelle Position (wird in der Animation aktualisiert)
  const playerCurrentPosition = useRef({ x: 2048, y: 1536 });

  useEffect(() => {
    loadMapImages().then(() => setImagesLoaded(true));
  }, []);

  // Die Haupt-Animationsschleife
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || !playerRef.current) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }
    const ctx = canvas.getContext("2d");

    // DeltaTime Berechnung
    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000; // in Sekunden
    lastFrameTimeRef.current = now;

    // --- KARTEN-RENDERING ---
    canvas.width = CANVAS_WIDTH_PX;
    canvas.height = CANVAS_HEIGHT_PX;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    const view = {
      x: -viewTransform.offsetX / viewTransform.scale,
      y: -viewTransform.offsetY / viewTransform.scale,
      width: canvas.width / viewTransform.scale,
      height: canvas.height / viewTransform.scale,
    };
    const startCol = Math.max(0, Math.floor(view.x / TILE_SIZE));
    const endCol = Math.min(MAP_WIDTH_TILES, Math.ceil((view.x + view.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(view.y / TILE_SIZE));
    const endRow = Math.min(MAP_HEIGHT_TILES, Math.ceil((view.y + view.height) / TILE_SIZE));
    const OVERLAP = 0.5;
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const imageName = `map_${row + 1}x${col + 1}`;
        const image = imageCache[imageName];
        if (image) {
          ctx.drawImage(image, col * TILE_SIZE - OVERLAP, row * TILE_SIZE - OVERLAP, TILE_SIZE + OVERLAP * 2, TILE_SIZE + OVERLAP * 2);
        }
      }
    }
    ctx.restore();

    // --- SPIELER-BEWEGUNGSLOGIK ---
    const currentPos = playerCurrentPosition.current;
    const targetPos = playerTargetPosition.current;
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      const movementAmount = PLAYER_SPEED_PIXELS_PER_SECOND * deltaTime;
      if (movementAmount >= distance) {
        currentPos.x = targetPos.x;
        currentPos.y = targetPos.y;
      } else {
        currentPos.x += (dx / distance) * movementAmount;
        currentPos.y += (dy / distance) * movementAmount;
      }
    }

    // --- SPIELER-RENDERING ---
    const playerPixelX = currentPos.x * viewTransform.scale + viewTransform.offsetX;
    const playerPixelY = currentPos.y * viewTransform.scale + viewTransform.offsetY;
    playerRef.current.style.transform = `translate(${playerPixelX}px, ${playerPixelY}px) translate(-50%, -50%)`;

    // Nächsten Frame anfordern
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [imagesLoaded, viewTransform]); // Abhängig von viewTransform, um bei Zoom/Pan neu berechnet zu werden

  // Effekt zum Starten und Stoppen der Game Loop
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameLoop]);


  // --- EVENT HANDLER ---
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setViewTransform(prev => {
      const scaleAmount = -e.deltaY > 0 ? 1.1 : 0.9;
      const newScale = clamp(prev.scale * scaleAmount, MIN_ZOOM, MAX_ZOOM);
      const worldX = (mouseX - prev.offsetX) / prev.scale;
      const worldY = (mouseY - prev.offsetY) / prev.scale;
      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;
      const minOffsetX = CANVAS_WIDTH_PX - MAP_WIDTH_PX * newScale;
      const minOffsetY = CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * newScale;
      return {
        scale: newScale,
        offsetX: clamp(newOffsetX, minOffsetX, 0),
        offsetY: clamp(newOffsetY, minOffsetY, 0),
      };
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: viewTransform.offsetX,
      initialOffsetY: viewTransform.offsetY,
    };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldXForDisplay = Math.floor((mouseX - viewTransform.offsetX) / viewTransform.scale);
    const worldYForDisplay = Math.floor((mouseY - viewTransform.offsetY) / viewTransform.scale);
    setMouseCoords({ x: worldXForDisplay, y: worldYForDisplay });
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewTransform(prev => {
        const newOffsetX = panStartRef.current.initialOffsetX + dx;
        const newOffsetY = panStartRef.current.initialOffsetY + dy;
        const minOffsetX = CANVAS_WIDTH_PX - MAP_WIDTH_PX * prev.scale;
        const minOffsetY = CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * prev.scale;
        return { ...prev, offsetX: clamp(newOffsetX, minOffsetX, 0), offsetY: clamp(newOffsetY, minOffsetY, 0) };
      });
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - viewTransform.offsetX) / viewTransform.scale;
    const worldY = (mouseY - viewTransform.offsetY) / viewTransform.scale;
    
    // Setzt nur das neue Ziel in der Ref. Kein State-Update, kein Re-Render!
    playerTargetPosition.current = { x: worldX, y: worldY };
  };

  if (!imagesLoaded) return <div>Lade Kartenkacheln...</div>;
  
  return (
    <div className="world-map-viewport">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH_PX}
        height={CANVAS_HEIGHT_PX}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
      />
      <div className="mouse-coords">
        X: {mouseCoords.x}, Y: {mouseCoords.y}
      </div>
      <PlayerCharacter ref={playerRef} />
    </div>
  );
};