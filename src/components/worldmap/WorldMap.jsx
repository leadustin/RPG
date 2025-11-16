// src/components/worldmap/WorldMap.jsx

import React, { useRef, useEffect, useState, useCallback } from "react";
import PlayerCharacter from "./PlayerCharacter";
import "./WorldMap.css";
import locations from "../../data/locations.json";

// --- Map Configuration ---
const TILE_SIZE = 128;
const MAP_WIDTH_TILES = 32;
const MAP_HEIGHT_TILES = 24;
const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE;
const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE;

const CANVAS_WIDTH_PX = 1240;
const CANVAS_HEIGHT_PX = 640;

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.0;
const OVERLAP = 0.5; // Pixel-Überlappung, um Lücken zu vermeiden

// --- Player Speed ---
const PLAYER_SPEED_PIXELS_PER_SECOND = 200;

// --- Helper Function ---
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// +++
// +++ VITE-ERSATZ für require.context +++
// +++

// 1. Lade alle Bildmodule aus dem 'map'-Ordner
const mapImageModules = import.meta.glob(
  '../../assets/images/map/*.webp',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
// (z.B. { 'map_1x1': '/path/to/map_1x1.webp' })
const mapImageSources = {};
for (const path in mapImageModules) {
  const iconUrl = mapImageModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "map_1x1") als Key
  const key = path
    .split('/')
    .pop() // Dateiname.ext
    .replace(/\.webp$/, ''); // Dateiname
  mapImageSources[key] = iconUrl;
}

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


// --- Image Loading ---
const imageCache = {};
const loadMapImages = () => {
  const imagePromises = [];
  for (let y = 1; y <= MAP_HEIGHT_TILES; y++) {
    for (let x = 1; x <= MAP_WIDTH_TILES; x++) {
      const imageName = `map_${y}x${x}`;
      const imageSrc = mapImageSources[imageName]; // Holt die URL aus dem verarbeiteten Objekt
      if (imageSrc) {
        const promise = new Promise((resolve, reject) => {
          const img = new Image();
          img.src = imageSrc;
          img.onload = () => {
            imageCache[imageName] = img;
            resolve();
          };
          img.onerror = () => reject(`Error loading ${imageName}`);
        });
        imagePromises.push(promise);
      }
    }
  }
  return Promise.all(imagePromises);
};

export const WorldMap = ({
  character,
  onEnterLocation,
  onUpdatePosition,
  onDiscoverLocation,
}) => {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);
  const animationFrameId = useRef();
  const lastFrameTimeRef = useRef(performance.now());

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [viewTransform, setViewTransform] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({
    x: 0,
    y: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [modal, setModal] = useState({ show: false, location: null });

  const playerCurrentPosition = useRef(character.position);
  const playerTargetPosition = useRef(character.position);

  useEffect(() => {
    playerCurrentPosition.current = character.position;
    playerTargetPosition.current = character.position;
  }, [character.position]);

  useEffect(() => {
    loadMapImages().then(() => setImagesLoaded(true));
  }, []);

  useEffect(() => {
    const centerViewOnPlayer = () => {
      const playerX = playerCurrentPosition.current.x;
      const playerY = playerCurrentPosition.current.y;
      const scale = 1.0;

      let newOffsetX = CANVAS_WIDTH_PX / 2 - playerX * scale;
      let newOffsetY = CANVAS_HEIGHT_PX / 2 - playerY * scale;

      const minOffsetX = CANVAS_WIDTH_PX - MAP_WIDTH_PX * scale;
      const minOffsetY = CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * scale;

      setViewTransform({
        scale: scale,
        offsetX: clamp(newOffsetX, minOffsetX, 0),
        offsetY: clamp(newOffsetY, minOffsetY, 0),
      });
    };

    if (imagesLoaded) {
      centerViewOnPlayer();
    }
  }, [imagesLoaded]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || !playerRef.current) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }
    const ctx = canvas.getContext("2d");

    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = now;

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
    const endCol = Math.min(
      MAP_WIDTH_TILES,
      Math.ceil((view.x + view.width) / TILE_SIZE)
    );
    const startRow = Math.max(0, Math.floor(view.y / TILE_SIZE));
    const endRow = Math.min(
      MAP_HEIGHT_TILES,
      Math.ceil((view.y + view.height) / TILE_SIZE)
    );

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

    // vvv--- LOGIK GEÄNDERT ---vvv
    locations.forEach((loc) => {
      // 1. Kreis (Marker) immer zeichnen
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle =
        loc.type === "city" ? "rgba(255, 215, 0, 0.8)" : "rgba(139, 0, 0, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Name nur zeichnen, wenn der Ort entdeckt wurde
      if (
        character.discoveredLocations &&
        character.discoveredLocations.includes(loc.id)
      ) {
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(loc.name, loc.x, loc.y - 30);
        ctx.fillText(loc.name, loc.x, loc.y - 30);
      }
    });
    // ^^^--- LOGIK GEÄNDERT ---^^^

    ctx.restore();

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
        if (onUpdatePosition) {
          onUpdatePosition(currentPos);
        }
      } else {
        currentPos.x += (dx / distance) * movementAmount;
        currentPos.y += (dy / distance) * movementAmount;
      }
    }

    if (!modal.show) {
      for (const loc of locations) {
        const dxLoc = loc.x - currentPos.x;
        const dyLoc = loc.y - currentPos.y;
        const distanceToLoc = Math.sqrt(dxLoc * dxLoc + dyLoc * dyLoc);
        if (distanceToLoc < loc.radius) {
          if (onDiscoverLocation) {
            onDiscoverLocation(loc.id);
          }

          playerTargetPosition.current = { ...currentPos };
          setModal({ show: true, location: loc });
          break;
        }
      }
    }

    const playerPixelX =
      currentPos.x * viewTransform.scale + viewTransform.offsetX;
    const playerPixelY =
      currentPos.y * viewTransform.scale + viewTransform.offsetY;
    if (playerRef.current) {
      playerRef.current.style.transform = `translate(${playerPixelX}px, ${playerPixelY}px) translate(-50%, -50%)`;
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [
    imagesLoaded,
    viewTransform,
    modal.show,
    onUpdatePosition,
    onDiscoverLocation,
    character,
  ]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameLoop]);

  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setViewTransform((prev) => {
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
    if (e.button !== 0 || modal.show) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: viewTransform.offsetX,
      initialOffsetY: viewTransform.offsetY,
    };
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldXForDisplay = Math.floor(
      (mouseX - viewTransform.offsetX) / viewTransform.scale
    );
    const worldYForDisplay = Math.floor(
      (mouseY - viewTransform.offsetY) / viewTransform.scale
    );
    setMouseCoords({ x: worldXForDisplay, y: worldYForDisplay });
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewTransform((prev) => {
        const newOffsetX = panStartRef.current.initialOffsetX + dx;
        const newOffsetY = panStartRef.current.initialOffsetY + dy;
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

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (modal.show) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - viewTransform.offsetX) / viewTransform.scale;
    const worldY = (mouseY - viewTransform.offsetY) / viewTransform.scale;
    playerTargetPosition.current = { x: worldX, y: worldY };
  };

  const handleEnter = () => {
    if (modal.location) {
      onEnterLocation(modal.location.id, playerCurrentPosition.current);
      setModal({ show: false, location: null });
    }
  };

  const handleCancel = () => {
    const loc = modal.location;
    setModal({ show: false, location: null });
    if (loc) {
      const currentPos = playerCurrentPosition.current;
      const angle = Math.atan2(currentPos.y - loc.y, currentPos.x - loc.x);
      playerTargetPosition.current = {
        x: currentPos.x + Math.cos(angle) * 20,
        y: currentPos.y + Math.sin(angle) * 20,
      };
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
        onContextMenu={handleContextMenu}
      />

      {modal.show && (
        <div className="interaction-modal">
          <p>Möchtest du {modal.location.name} betreten?</p>
          <button onClick={handleEnter}>Betreten</button>
          <button onClick={handleCancel}>Nein</button>
        </div>
      )}

      <div className="mouse-coords">
        X: {mouseCoords.x}, Y: {mouseCoords.y}
      </div>
      <PlayerCharacter ref={playerRef} />
    </div>
  );
};