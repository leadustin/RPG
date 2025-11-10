// src/components/game_view/SaveSlotManager.js

import React, { useState, useEffect } from "react";
import "./SaveSlotManager.css";
// KORRIGIERTER PFAD IN DIESER ZEILE:
import {
  getSaveSlots,
  loadFromSlot,
  deleteSlot,
} from "../../utils/persistence";

export const SaveSlotManager = ({
  character,
  onClose,
  onSave,
  onLoad,
  mode,
}) => {
  const [saveSlots, setSaveSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [saveName, setSaveName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadSaveSlots();
  }, []);

  useEffect(() => {
    if (character && mode === "save") {
      const now = new Date();
      const timeStr = now.toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      setSaveName(`${character.name} - ${timeStr}`);
    }
  }, [character, mode]);

  const loadSaveSlots = () => {
    const slots = getSaveSlots();
    setSaveSlots(slots);
  };

  const handleSave = () => {
    if (selectedSlot === null || !saveName.trim()) {
      alert("Bitte wählen Sie einen Slot und geben Sie einen Namen ein.");
      return;
    }
    if (
      saveSlots[selectedSlot] &&
      !window.confirm(
        `Möchten Sie den Spielstand in Slot ${
          selectedSlot + 1
        } wirklich überschreiben?`
      )
    ) {
      return;
    }
    onSave(selectedSlot, saveName);
  };

  const handleLoad = () => {
    if (selectedSlot !== null && saveSlots[selectedSlot]) {
      onLoad(loadFromSlot(selectedSlot), selectedSlot);
    }
  };

  const handleDelete = (slotId) => {
    deleteSlot(slotId);
    loadSaveSlots();
    setShowDeleteConfirm(null);
    if (selectedSlot === slotId) {
      setSelectedSlot(null);
    }
  };

  const getSlotPreview = (slotData) => {
    if (!slotData) return { name: "Leerer Slot", details: "Verfügbar" };

    const { name, timestamp, gameState } = slotData;
    const char = gameState.character;
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString("de-DE");

    return {
      name: name,
      details: `${char.name}, Level ${char.level} - ${timeStr}`,
    };
  };

  return (
    <div className="slot-manager-overlay">
      <div className="slot-manager">
        <h2>{mode === "save" ? "Spiel speichern" : "Spiel laden"}</h2>

        <div className="slot-list">
          {saveSlots.map((slotData, index) => {
            const preview = getSlotPreview(slotData);
            return (
              <div
                key={index}
                className={`slot-item ${
                  selectedSlot === index ? "selected" : ""
                } ${!slotData ? "empty" : ""}`}
                onClick={() => setSelectedSlot(index)}
              >
                <div className="slot-header">
                  <strong>
                    Slot {index + 1}: {preview.name}
                  </strong>
                </div>
                <p className="slot-details">{preview.details}</p>
                {slotData && (
                  <button
                    className="delete-slot-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(index);
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {mode === "save" && (
          <input
            type="text"
            className="save-name-input"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Namen für den Spielstand eingeben"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="slot-actions">
          {mode === "save" ? (
            <button
              className="action-button save-button"
              onClick={handleSave}
              disabled={selectedSlot === null || !saveName.trim()}
            >
              💾 In Slot {selectedSlot !== null ? selectedSlot + 1 : "?"}{" "}
              speichern
            </button>
          ) : (
            <button
              className="action-button load-button"
              onClick={handleLoad}
              disabled={selectedSlot === null || !saveSlots[selectedSlot]}
            >
              📂 Slot {selectedSlot !== null ? selectedSlot + 1 : "?"} laden
            </button>
          )}
          <button className="action-button cancel-button" onClick={onClose}>
            Abbrechen
          </button>
        </div>

        {showDeleteConfirm !== null && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-dialog">
              <h3>Spielstand löschen?</h3>
              <p>
                Möchtest du den Spielstand in Slot {showDeleteConfirm + 1}{" "}
                wirklich löschen?
              </p>
              <p>
                <strong>
                  "{getSlotPreview(saveSlots[showDeleteConfirm])?.name}"
                </strong>
              </p>
              <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="delete-confirm-actions">
                <button
                  className="delete-confirm-btn"
                  onClick={() => handleDelete(showDeleteConfirm)}
                >
                  🗑️ Löschen
                </button>
                <button
                  className="delete-cancel-btn"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
