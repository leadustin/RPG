// Diese Datei implementiert die spezifische Klassenlogik für den Schurken.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Wendet alle passiven Stat-Modifikatoren für den Schurken an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const level = character.level || 1;

  // --- Level 1: Hinterhältiger Angriff (Sneak Attack) ---
  // Beschreibung: "Einmal pro Zug verursachst du 1W6 zusätzlichen Schaden..."
  // Die D&D 5e-Progression ist (Level / 2, aufgerundet) W6.
  if (level >= 1) {
    const sneakAttackDice = Math.ceil(level / 2);
    // Die Kampf-Engine kann dies prüfen, wenn die Angriffsbedingungen erfüllt sind.
    newStats.sneakAttack = `${sneakAttackDice}d6`;
  }

  // --- Level 1: Expertise ---
  // Beschreibung: "Wähle zwei Fertigkeiten... Dein Übungsbonus wird für diese verdoppelt."
  if (level >= 1) {
    // Annahme: Die Wahlen sind im Charakterobjekt gespeichert
    const expertiseChoices = character.choices?.expertise || [];
    newStats.expertiseSkills = expertiseChoices; // z.B. ['stealth', 'perception']
    // Die `calculateSkillBonus`-Funktion in der characterEngine muss dies
    // zukünftig prüfen und den Bonus verdoppeln.
  }
  
  // --- Level 6: Expertise (erneut) ---
  if (level >= 6) {
      // (Logik, um ZWEI WEITERE Skills hinzuzufügen, falls implementiert)
  }

  // --- Level 11: Verlässliches Talent ---
  // Beschreibung: "Du kannst jeden W20-Wurf von 9 oder niedriger als 10 behandeln..."
  if (level >= 11) {
    // Die Würfel-Engine kann dies bei allen Fähigkeitswürfen prüfen,
    // bei denen der Schurke geübt ist.
    newStats.reliableTalent = true;
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Schurken-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];

  // --- Level 2: Listige Aktion (Cunning Action) ---
  // Beschreibung: "Du kannst eine Bonusaktion verwenden, um Spurt-, Rückzugs- oder Verstecken-Aktion auszuführen."
  // Diese "Aktionen" signalisieren der UI, dass die Standard-Aktionen
  // auch als Bonusaktion verfügbar sind.
  if (character.level >= 2) {
    activeSkills.push(
      {
        key: "cunning_action_dash",
        name: "Listige Aktion: Spurt",
        type: "bonus_action",
        description: "Nutze deine Bonusaktion, um die Spurt-Aktion auszuführen.",
      },
      {
        key: "cunning_action_disengage",
        name: "Listige Aktion: Rückzug",
        type: "bonus_action",
        description: "Nutze deine Bonusaktion, um die Rückzug-Aktion auszuführen.",
      },
      {
        key: "cunning_action_hide",
        name: "Listige Aktion: Verstecken",
        type: "bonus_action",
        description: "Nutze deine Bonusaktion, um die Verstecken-Aktion auszuführen.",
      }
    );
  }
  
  // (Fähigkeiten von Subklassen wie "Flinke Hände" würden hier auch hinzugefügt)
  
  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'damage_taken', 'saving_throw').
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Schurken.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;

    // --- Level 5: Unheimliches Gespür (Uncanny Dodge) ---
    // Beschreibung: "Wenn ein Angreifer dich trifft, kannst du deine Reaktion verwenden, um den Schaden zu halbieren."
    if (
        level >= 5 &&
        eventType === 'damage_taken' &&
        data.sourceType === 'attack' && // Nur bei Angriffen
        data.target === character.id 
    ) {
        // Signalisieren, dass die Reaktion "Unheimliches Gespür" verfügbar ist.
        // Die Engine muss den Spieler fragen, ob er seine Reaktion nutzen will.
        return { ...data, canReact: 'uncanny_dodge' };
    }

    // --- Level 7: Entrinnen (Evasion) ---
    // Beschreibung: "...nimmst du bei Erfolg keinen und bei Misserfolg nur halben Schaden."
    if (
        level >= 7 &&
        eventType === 'saving_throw' &&
        data.ability === 'dexterity' && // Nur bei Geschicklichkeits-Rettungswürfen
        data.effect === 'half_damage_on_save' // Nur bei Effekten, die halben Schaden erlauben
    ) {
        // (Identisch zur Mönch-Fähigkeit)
        // Die Engine liest dies und wendet 0 Schaden bei Erfolg / halben bei Misserfolg an.
        return { ...data, hasEvasion: true };
    }

    // =================================================================
    // --- NEUE HINZUFÜGUNG: Level 1: Hinterhältiger Angriff ---
    // =================================================================
    if (level >= 1 && eventType === 'attack_hit') {
        // Annahme: `data.rollData` wird von der Engine übergeben und enthält { advantage: true }
        // Annahme: `data.gameState` wird übergeben und enthält Positionen
        // Annahme: `character.status.hasUsedSneakAttackThisTurn` wird von der Engine verwaltet.
        
        const hasUsedSneakAttack = character.status?.hasUsedSneakAttackThisTurn || false;
        
        // 1. Bedingung: Waffe muss Finesse oder Fernkampf sein
        const isFinesseOrRanged = (data.attackType === 'melee_weapon_dex' || data.attackType === 'ranged_weapon');
        
        if (!hasUsedSneakAttack && isFinesseOrRanged) {
            // 2. Bedingung: Vorteil ODER Verbündeter in der Nähe
            const hasAdvantage = data.rollData?.advantage || false;
            const hasAllyNearby = isAllyAdjacent(character, data.target, data.gameState);

            if (hasAdvantage || hasAllyNearby) {
                const sneakAttackDice = Math.ceil(level / 2);
                const diceFormula = `${sneakAttackDice}d6`;
                
                // Füge den Schaden zu den Bonus-Würfeln hinzu
                return { 
                    ...data, 
                    // Fügt den Sneak-Schaden hinzu (z.B. 3d6)
                    bonusDamage: (data.bonusDamage || "") + `+${diceFormula}`, 
                    // Fügt den Schaden für Kritische Treffer hinzu
                    bonusDamageCrit: (data.bonusDamageCrit || "") + `+${diceFormula}`,
                    // Setze das Flag, damit es nur 1x pro Zug passiert
                    setStatus: 'hasUsedSneakAttackThisTurn' 
                };
            }
        }
    }

    // Keine Änderung am Ereignis
    return data;
}

// =================================================================
// --- NEUE HILFSFUNKTION ---
// =================================================================

/**
 * (NEU) Prüft, ob ein Verbündeter des Angreifers neben dem Ziel steht.
 * Dies ist eine Annahme, wie die Datenstruktur aussehen könnte.
 * @param {object} attacker - Der Charakter des Schurken.
 * @param {object} target - Das Zielobjekt (mit Position).
 * @param {object} gameState - Das (angenommene) Spielstatus-Objekt mit Positionen aller Charaktere.
 */
function isAllyAdjacent(attacker, target, gameState) {
    if (!gameState || !target?.position || !gameState.partyPositions) {
        return false;
    }

    const { x: targetX, y: targetY } = target.position;

    // Durchlaufe alle Verbündeten
    for (const allyId in gameState.partyPositions) {
        // Ignoriere den Angreifer selbst
        if (allyId === attacker.id) continue;

        const allyPos = gameState.partyPositions[allyId];
        
        // Berechne die Distanz (einfache Gitterdistanz)
        const distance = Math.abs(allyPos.x - targetX) + Math.abs(allyPos.y - targetY);
        
        // Wenn ein Verbündeter auf einem angrenzenden Feld (1.5m / 1 Feld) steht
        if (distance === 1) {
            return true;
        }
    }
    
    return false;
}