import React, { useRef, useEffect, useState, useCallback } from 'react';
import './WorldMap.css';

// --- Map-Konfiguration ---
const TILE_SIZE = 128;
const MAP_WIDTH_TILES = 32;
const MAP_HEIGHT_TILES = 24;
const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE;
const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE;

const CANVAS_WIDTH_TILES = 11;
const CANVAS_HEIGHT_TILES = 5.5; // 720 / 128 = 5.625
const CANVAS_WIDTH_PX = CANVAS_WIDTH_TILES * TILE_SIZE; // 1408px
const CANVAS_HEIGHT_PX = CANVAS_HEIGHT_TILES * TILE_SIZE; // 720px

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.0;

// --- Bild-Import via require.context ---
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
      images[item.replace('./', '').replace('.webp', '')] = r(item);
  });
  return images;
}
const mapImageSources = importAll(require.context('../../assets/images/map', false, /\.webp$/));


// --- Hilfsfunktion zum Laden der Bilder ---
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

  useEffect(() => {
    loadMapImages().then(() => {
      setImagesLoaded(true);
      console.log("Alle 768 Kartenkacheln erfolgreich geladen.");
    }).catch(error => {
      console.error("Fehler beim Laden der Kartenkacheln:", error);
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded) return;
    const ctx = canvas.getContext('2d');

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
        height: canvas.height / viewTransform.scale
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

    if (character && character.position) {
      const playerX = character.position.x * TILE_SIZE;
      const playerY = character.position.y * TILE_SIZE;
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(playerX + TILE_SIZE / 2, playerY + TILE_SIZE / 2, TILE_SIZE / 3, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', playerX + TILE_SIZE / 2, playerY + TILE_SIZE / 2);
    }

    ctx.restore();
  }, [imagesLoaded, viewTransform, character]);
  
  useEffect(() => {
    const animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [draw]);

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY > 0 ? 1.1 : 0.9;
    const newScale = Math.max(MIN_ZOOM, Math.min(viewTransform.scale * scaleAmount, MAX_ZOOM));

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasBounds.left;
    const mouseY = e.clientY - canvasBounds.top;

    let newOffsetX = mouseX - (mouseX - viewTransform.offsetX) * (newScale / viewTransform.scale);
    let newOffsetY = mouseY - (mouseY - viewTransform.offsetY) * (newScale / viewTransform.scale);

    newOffsetX = Math.min(0, Math.max(newOffsetX, CANVAS_WIDTH_PX - MAP_WIDTH_PX * newScale));
    newOffsetY = Math.min(0, Math.max(newOffsetY, CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * newScale));

    setViewTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
  };

  const handleMouseDown = (e) => {
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setLastMousePos({ x: e.clientX, y: e.clientY });

    setViewTransform(prev => {
        const newOffsetX = prev.offsetX + dx;
        const newOffsetY = prev.offsetY + dy;
        const clampedOffsetX = Math.min(0, Math.max(newOffsetX, CANVAS_WIDTH_PX - MAP_WIDTH_PX * prev.scale));
        const clampedOffsetY = Math.min(0, Math.max(newOffsetY, CANVAS_HEIGHT_PX - MAP_HEIGHT_PX * prev.scale));
        return { ...prev, offsetX: clampedOffsetX, offsetY: clampedOffsetY };
    });
  };

  if (!imagesLoaded) {
    return <div className="world-map-viewport" style={{width: CANVAS_WIDTH_PX, height: CANVAS_HEIGHT_PX, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white'}}>Lade Kartenkacheln (768)...</div>;
  }

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
    </div>
  );
};