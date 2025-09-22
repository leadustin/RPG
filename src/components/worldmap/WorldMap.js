import React, { useRef, useEffect, useState, useCallback } from "react";
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

export const WorldMap = ({ character }) => {
  const canvasRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadMapImages().then(() => setImagesLoaded(true));
  }, []);

  // --- ZEICHENFUNKTION ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;
    const ctx = canvas.getContext("2d");

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
    
    // Kacheln berechnen (mit Puffer, um Clipping-Fehler zu vermeiden)
    const startCol = Math.max(0, Math.floor(view.x / TILE_SIZE));
    const endCol = Math.min(MAP_WIDTH_TILES, Math.floor((view.x + view.width) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(view.y / TILE_SIZE));
    const endRow = Math.min(MAP_HEIGHT_TILES, Math.floor((view.y + view.height) / TILE_SIZE) + 1);

    // Kacheln zeichnen
    const OVERLAP = 0.5;
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const imageName = `map_${row + 1}x${col + 1}`;
        const image = imageCache[imageName];
        if (image) {
          ctx.drawImage(
            image,
            col * TILE_SIZE - OVERLAP,
            row * TILE_SIZE - OVERLAP,
            TILE_SIZE + OVERLAP * 2,
            TILE_SIZE + OVERLAP * 2
          );
        }
      }
    }

    // Spieler zeichnen
    if (character && character.position) {
      const playerX = character.position.x * TILE_SIZE;
      const playerY = character.position.y * TILE_SIZE;
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.beginPath();
      ctx.arc(playerX + TILE_SIZE / 2, playerY + TILE_SIZE / 2, TILE_SIZE / 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", playerX + TILE_SIZE / 2, playerY + TILE_SIZE / 2);
    }

    ctx.restore();
  }, [imagesLoaded, viewTransform, character]);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [draw]);

  // --- EVENT HANDLER (STABILISIERT) ---
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setViewTransform(prev => {
      const scaleAmount = -e.deltaY > 0 ? 1.1 : 0.9;
      const newScale = clamp(prev.scale * scaleAmount, MIN_ZOOM, MAX_ZOOM);

      // Weltkoordinaten des Mauszeigers vor dem Zoom
      const worldX = (mouseX - prev.offsetX) / prev.scale;
      const worldY = (mouseY - prev.offsetY) / prev.scale;

      // Neuer Offset, damit der Weltpunkt unter der Maus bleibt
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
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Welt-Koordinaten für die Anzeige berechnen
    const worldX = Math.floor((mouseX - viewTransform.offsetX) / viewTransform.scale);
    const worldY = Math.floor((mouseY - viewTransform.offsetY) / viewTransform.scale);
    setMouseCoords({ x: worldX, y: worldY });

    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setLastMousePos({ x: e.clientX, y: e.clientY });

      setViewTransform(prev => {
        const newOffsetX = prev.offsetX + dx;
        const newOffsetY = prev.offsetY + dy;
        
        const minOffsetX = CANVAS_WIDTH_PX - MAP_WIDTH_PX * prev.scale;
        const minOffsetY = CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * prev.scale;

        return {
          ...prev,
          offsetX: clamp(newOffsetX, minOffsetX, 0),
          offsetY: clamp(newOffsetY, minOffsetY, 0),
        };
      });
    }
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
      />
      <div className="mouse-coords">
        X: {mouseCoords.x}, Y: {mouseCoords.y}
      </div>
    </div>
  );
};