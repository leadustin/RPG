// src/hooks/useGameState.js

import { useState, useEffect, useCallback } from "react";
import {
  loadAutoSave,
  saveAutoSave,
  deleteAutoSave,
  saveToSlot,
} from "../utils/persistence";
// *** 1. IMPORT ERWEITERT (aus vorherigem Schritt, bleibt gleich) ***
import {
  calculateInitialHP,
  calculateAC,
  grantXpToCharacter,
  applyLevelUp,
} from "../engine/characterEngine";
import allRaceData from "../data/races.json";
import locationsData from "../data/locations.json";
import { rollDiceFormula } from "../utils/helpers";
// Item-Daten importieren
import armorData from "../data/items/armor.json";
import weaponsData from "../data/items/weapons.json";
import clothesData from "../data/items/clothes.json";
import itemsData from "../data/items/items.json";
import accessoriesData from "../data/items/accessories.json";
import beltsData from "../data/items/belts.json";
import bootsData from "../data/items/boots.json";
import handsData from "../data/items/hands.json";
import headsData from "../data/items/heads.json";

const allItems = [
  ...armorData,
  ...weaponsData,
  ...clothesData,
  ...itemsData,
  ...accessoriesData,
  ...beltsData,
  ...bootsData,
  ...handsData,
  ...headsData,
];

// --- NEUE HELPER-FUNKTION FÜR LOG-EINTRÄGE ---
const createLogEntry = (message, type = "general") => ({
  id: Date.now() + Math.random(), // Sorge für Einzigartigkeit
  timestamp: new Date(),
  type, // 'general', 'combat', 'xp', 'level', 'item', 'dialog'
  message,
});
// --- ENDE HELPER-FUNKTION ---

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: "start",
    character: null,
    logEntries: [], // <-- 1. LOG-ARRAY HINZUGEFÜGT
  });

  // Initiales Laden: ENTFERNT. Wir starten immer mit screen: "start".
  /*
  useEffect(() => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      setGameState(loadedState);
    }
  }, []);
  */

  // Autosave: Speichere bei JEDER Änderung, wenn im Spiel
  useEffect(() => {
    if (gameState.screen === "game" && gameState.character) {
      saveAutoSave(gameState); // Speichert jetzt auch logEntries mit
    }
  }, [gameState]);

  // NEUER Handler, um das Autosave-Spiel (Fortsetzen) zu laden
  const handleLoadAutoSaveGame = () => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      // --- LOG-ANPASSUNG ---
      // Stelle sicher, dass alte Saves auch das Log-Array bekommen
      if (!loadedState.logEntries) {
        loadedState.logEntries = [createLogEntry("Spielstand geladen.")];
      }
      // Konvertiere alte Timestamps (falls als String gespeichert) zurück in Date-Objekte
      loadedState.logEntries = loadedState.logEntries.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      // --- ENDE LOG-ANPASSUNG ---
      setGameState(loadedState);
    } else {
      // Fallback, falls Autosave gelöscht wurde
      console.warn("Konnte Autosave nicht laden.");
    }
  };

  const handleNewGame = () => {
    // --- LOG-ANPASSUNG ---
    setGameState((prevState) => ({
      ...prevState,
      screen: "character-creation",
      logEntries: [], // Logs zurücksetzen
      character: null, // Charakter zurücksetzen
    }));
    // --- ENDE LOG-ANPASSUNG ---
  };

  const handleDeleteGame = () => {
    deleteAutoSave();
    // --- LOG-ANPASSUNG ---
    setGameState({
      screen: "start",
      character: null,
      logEntries: [], // Logs zurücksetzen
    });
    // --- ENDE LOG-ANPASSUNG ---
  };

  const handleSaveToSlot = useCallback(
    (slotId, saveName) => {
      if (gameState.character) {
        saveToSlot(slotId, gameState, saveName); // Speichert automatisch den gesamten gameState inkl. Logs
      }
    },
    [gameState]
  );

  const handleLoadFromSlot = useCallback(
    (slotData) => {
      if (slotData && slotData.gameState) {
        // --- LOG-ANPASSUNG ---
        const loadedState = slotData.gameState;
        // Stelle sicher, dass auch hier Logs korrekt behandelt werden
        if (!loadedState.logEntries) {
          loadedState.logEntries = [createLogEntry("Spielstand geladen.")];
        }
        // Konvertiere Timestamps
        loadedState.logEntries = loadedState.logEntries.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        setGameState(loadedState);
        // --- ENDE LOG-ANPASSUNG ---
      }
    },
    [setGameState]
  );

  const handleCharacterCreation = (finalizedCharacter) => {
    const tempChar = JSON.parse(JSON.stringify(finalizedCharacter));

    if (tempChar.ability_bonus_assignments) {
      for (const [ability, bonus] of Object.entries(
        tempChar.ability_bonus_assignments
      )) {
        tempChar.abilities[ability] += bonus;
      }
    }

    const raceData = allRaceData.find((r) => r.key === tempChar.race.key);
    const hp = calculateInitialHP(tempChar);

    const initialStats = {
      hp: hp,
      maxHp: hp,
      armor_class: calculateAC(tempChar),
      speed: raceData?.speed || 30,
      abilities: tempChar.abilities,
    };

    const equipmentList = finalizedCharacter.class.starting_equipment || [];
    const initialEquipment = {};
    equipmentList.forEach((item) => {
      const itemDetails = allItems.find((i) => i.name === item.item);
      if (itemDetails && itemDetails.slot) {
        initialEquipment[itemDetails.slot] = {
          ...itemDetails,
          id: `${itemDetails.name}-${Date.now()}`,
        };
      }
    });

    const startingInventory = [
      allItems.find((item) => item.id === "longsword"),
      allItems.find((item) => item.id === "greatsword"),
      allItems.find((item) => item.id === "leather-armor"),
      allItems.find((item) => item.id === "shield"),
      allItems.find((item) => item.id === "healing-potion"),
    ].filter(Boolean);

    const characterWithStats = {
      ...finalizedCharacter,
      stats: initialStats,
      inventory: startingInventory,
      equipment: initialEquipment,
      position: { x: 2048, y: 1536 },
      currentLocation: "worldmap",
      worldMapPosition: { x: 2048, y: 1536 },
      discoveredLocations: [],
      level: 1,
      experience: 0,
    };

    // --- START: NEUER, SEHR DETAILLIERTER LOG-BLOCK ---
    // Dieser Block erfasst alle Felder aus dem `character`-State der CreationScreen.
    const characterCreationSummary = {
      // --- Identität & Volk ---
      Name: characterWithStats.name,
      Geschlecht: characterWithStats.gender,
      Alter: characterWithStats.age,
      Groesse: characterWithStats.height,
      Gewicht: characterWithStats.weight,
      Gesinnung: characterWithStats.alignment,
      Rasse: characterWithStats.race.name,
      Subrasse: characterWithStats.subrace?.name || "Keine",
      Abstammung: characterWithStats.ancestry?.name || "Keine",

      // --- Klasse & Hintergrund ---
      Klasse: characterWithStats.class.name,
      Subklasse_Key: characterWithStats.subclassKey || "Keine",
      Hintergrund: characterWithStats.background.name,
      Hintergrund_Sprachen: characterWithStats.background_choices.languages,
      Hintergrund_Werkzeuge: characterWithStats.background_choices.tools,

      // --- Attribute (Rohdaten) ---
      Basis_Attribute: characterWithStats.abilities,
      Attributsbonus_Zuweisung: characterWithStats.ability_bonus_assignments,

      // --- Fähigkeiten (Proficiencies) ---
      Gewaehlte_Skills: characterWithStats.skill_proficiencies_choice,
      Gewaehlte_Expertise: characterWithStats.expertise_choices,
      Waffen_Meisterschaft: characterWithStats.weapon_mastery_choices,

      // --- Klassenspezifische Auswahl (Lvl 1) ---
      Kampfstil: characterWithStats.fighting_style || "Kein",
      Bevorzugter_Feind: characterWithStats.favored_enemy || "Kein",
      Gelaende: characterWithStats.natural_explorer || "Kein",
      Klassen_Werkzeug: characterWithStats.class_tool_choice || "Kein",
      Barden_Instrumente: characterWithStats.tool_proficiencies_choice,

      // --- Magie (Lvl 1) ---
      Zaubertricks: characterWithStats.cantrips_known,
      Zauberbuch: characterWithStats.spellbook,
      Bekannte_Zauber: characterWithStats.spells_known,
      Vorbereitete_Zauber: characterWithStats.spells_prepared,

      // --- ABGELEITETE DATEN (Zur Kontrolle) ---
      Finale_Attribute_mit_Bonus: characterWithStats.stats.abilities,
      Start_Inventar_IDs: characterWithStats.inventory.map((item) => item.id),
      Start_Ausruestung: Object.keys(characterWithStats.equipment).map(
        (slot) => ({
          slot: slot,
          item: characterWithStats.equipment[slot]?.name,
        })
      ),
    };

    // Log der detaillierten Zusammenfassung
    console.log(
      "--- CHARAKTER ERSTELLT: DETAILLOG ALLER AUSWAHLEN ---",
      characterCreationSummary
    );
    // --- ENDE: NEUER LOG-BLOCK ---

    // --- LOG-ANPASSUNG ---
    setGameState({
      screen: "game",
      character: characterWithStats,
      logEntries: [
        createLogEntry(
          `Willkommen, ${characterWithStats.name}! Dein Abenteuer beginnt.`,
          "general"
        ),
      ],
    });
    // --- ENDE LOG-ANPASSUNG ---
  };

  // *** handleDiscoverLocation ANGEPASST ***
  const handleDiscoverLocation = useCallback((locationId) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      // Prüfen, ob der Ort bereits entdeckt wurde
      if (
        prevState.character.discoveredLocations &&
        prevState.character.discoveredLocations.includes(locationId)
      ) {
        return prevState; // Nichts tun, wenn schon entdeckt
      }

      // Den neuen Ort zum Array hinzufügen
      const newDiscoveredLocations = [
        ...(prevState.character.discoveredLocations || []),
        locationId,
      ];

      // --- START DER LOG-ÄNDERUNG ---
      let updatedCharacter = {
        ...prevState.character,
        discoveredLocations: newDiscoveredLocations,
      };

      let newLogEntries = [...prevState.logEntries];
      const locationData = locationsData.find((loc) => loc.id === locationId);

      if (locationData) {
        // Standard-Entdeckungs-Log
        newLogEntries.push(
          createLogEntry(
            `Neuer Ort entdeckt: ${locationData.name}`,
            "general"
          )
        );

        // EP-Logik für Entdeckung
        if (locationData.xp > 0) {
          // Rufe die Engine-Funktion auf
          updatedCharacter = grantXpToCharacter(
            updatedCharacter,
            locationData.xp
          );
          newLogEntries.push(
            createLogEntry(
              `Du erhältst ${locationData.xp} EP für das Entdecken von ${locationData.name}.`,
              "xp"
            )
          );

          // Prüfen, ob dies ein Level Up ausgelöst hat
          if (
            updatedCharacter.pendingLevelUp &&
            !prevState.character.pendingLevelUp
          ) {
            newLogEntries.push(
              createLogEntry(
                `${updatedCharacter.name} ist bereit für ein Level Up!`,
                "level"
              )
            );
          }
        }
      }
      // --- ENDE DER LOG-ÄNDERUNG ---

      return {
        ...prevState,
        character: updatedCharacter,
        logEntries: newLogEntries, // Speichere die neuen Logs
      };
    });
  }, []);

  const handleEnterLocation = useCallback((locationId, currentPosition) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      character.worldMapPosition = currentPosition;
      character.currentLocation = locationId;

      // Optional: Log-Eintrag hinzufügen
      const locationData = locationsData.find((loc) => loc.id === locationId);
      const newLogEntry = createLogEntry(
        `Betritt ${locationData?.name || "einen Ort"}.`,
        "general"
      );

      return {
        ...prevState,
        character,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleLeaveLocation = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const currentLocationData = locationsData.find(
        (loc) => loc.id === character.currentLocation
      );
      let newPosition = character.worldMapPosition;

      if (currentLocationData) {
        const angle = Math.atan2(
          newPosition.y - currentLocationData.y,
          newPosition.x - currentLocationData.x
        );
        const newX =
          currentLocationData.x +
          Math.cos(angle) * (currentLocationData.radius + 15);
        const newY =
          currentLocationData.y +
          Math.sin(angle) * (currentLocationData.radius + 15);
        newPosition = { x: newX, y: newY };
      }

      character.position = newPosition;
      character.currentLocation = "worldmap";

      // Optional: Log-Eintrag hinzufügen
      const newLogEntry = createLogEntry(
        `Verlässt ${currentLocationData?.name || "Ort"} und kehrt zur Weltkarte zurück.`,
        "general"
      );

      return {
        ...prevState,
        character,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleEquipItem = useCallback((item, targetSlot) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };
      const itemIndex = inventory.findIndex(
        (invItem) => invItem.id === item.id
      );
      if (itemIndex === -1) return prevState;
      inventory.splice(itemIndex, 1);
      const previouslyEquippedItem = equipment[targetSlot];
      if (previouslyEquippedItem) {
        inventory.push(previouslyEquippedItem);
      }
      equipment[targetSlot] = item;

      // Log-Eintrag
      const newLogEntry = createLogEntry(
        `${item.name} ausgerüstet (${targetSlot}).`,
        "item"
      );

      return {
        ...prevState,
        character: { ...character, inventory, equipment },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleToggleTwoHanded = (slotId) => {
    setGameState((prevGameState) => {
      const newCharacter = { ...prevGameState.character };
      const weapon = newCharacter.equipment[slotId];
      let newLogEntries = [...prevGameState.logEntries];

      if (weapon && weapon.properties.some((p) => p.startsWith("Vielseitig"))) {
        const currentState = weapon.isTwoHanded || false;
        weapon.isTwoHanded = !currentState;

        if (weapon.isTwoHanded) {
          newLogEntries.push(
            createLogEntry(`${weapon.name} wird jetzt zweihändig geführt.`, "item")
          );
          if (newCharacter.equipment["off-hand"]) {
            const offHandItem = newCharacter.equipment["off-hand"];
            newCharacter.inventory.push(offHandItem);
            newCharacter.equipment["off-hand"] = null;
            newLogEntries.push(
              createLogEntry(`${offHandItem.name} abgelegt (in Inventar).`, "item")
            );
          }
        } else {
          newLogEntries.push(
            createLogEntry(`${weapon.name} wird jetzt einhändig geführt.`, "item")
          );
        }
      }
      return { ...prevGameState, character: newCharacter, logEntries: newLogEntries };
    });
  };

  const handleUnequipItem = useCallback((item, sourceSlot) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };
      if (
        !sourceSlot ||
        !equipment[sourceSlot] ||
        equipment[sourceSlot].id !== item.id
      ) {
        return prevState;
      }
      inventory.push(equipment[sourceSlot]);
      equipment[sourceSlot] = null;

      // Log-Eintrag
      const newLogEntry = createLogEntry(
        `${item.name} abgelegt (in Inventar).`,
        "item"
      );

      return {
        ...prevState,
        character: { ...character, inventory, equipment },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleUpdatePosition = useCallback((newPosition) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      return {
        ...prevState,
        character: {
          ...prevState.character,
          position: newPosition,
        },
      };
    });
  }, []);

  const handleConfirmLevelUp = useCallback((hpRollResult, levelUpChoices) => {
    setGameState((prevState) => {
      if (!prevState.character || !prevState.character.pendingLevelUp) {
        return prevState;
      }

      // 2. Beide Argumente an die Engine-Funktion übergeben
      const updatedCharacter = applyLevelUp(
        prevState.character,
        hpRollResult,
        levelUpChoices // <-- 3. HIER 'levelUpChoices' WEITERGEBEN
      );

      // --- LOG-ANPASSUNG ---
      const newLogEntry = createLogEntry(
        `${updatedCharacter.name} hat Stufe ${updatedCharacter.level} erreicht!`,
        "level"
      );

      return {
        ...prevState,
        character: updatedCharacter,
        logEntries: [...prevState.logEntries, newLogEntry], // Log hinzufügen
      };
      // --- ENDE LOG-ANPASSUNG ---
    });
  }, []);

  return {
    gameState,
    setGameState, // <-- WICHTIG: setGameState exponieren
    handleNewGame,
    handleLoadAutoSaveGame,
    handleDeleteGame,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleCharacterCreation,
    handleEquipItem,
    handleUnequipItem,
    handleToggleTwoHanded,
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp,
    rollDiceFormula,
  };
};