// src/components/WorldMap.js
import React from 'react';
import './WorldMap.css';

const GRID_WIDTH = 32;

const images = require.context('../../assets/images/map', false, /\.webp$/);
const sortedImagePaths = images.keys().sort((a, b) => {
  const matchA = a.match(/map_(\d+)x(\d+)\.webp/);
  const matchB = b.match(/map_(\d+)x(\d+)\.webp/);
  const [, yA, xA] = matchA.map(Number);
  const [, yB, xB] = matchB.map(Number);
  if (yA < yB) return -1;
  if (yA > yB) return 1;
  if (xA < xB) return -1;
  if (xA > xB) return 1;
  return 0;
});

// Empfängt jetzt zoom und offset als Props
export const WorldMap = ({ zoom, offset }) => {
  return (
    // Dieser Container ist der "Viewport"
    <div className="world-map-container">
      {/* Dieser innere Container wird skaliert und verschoben */}
      <div 
        className="pannable-map"
        style={{
          transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
        }}
      >
        <div 
          className="world-map-grid"
          style={{ '--grid-width': GRID_WIDTH }}
        >
          {sortedImagePaths.map(path => {
            const imageUrl = images(path);
            return (
              <div key={path} className="tile">
                <img 
                  src={imageUrl} 
                  alt={`Karte Kachel ${path.substring(2)}`} 
                  className="tile-image"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

