// Diese Datei implementiert die spezifische Klassenlogik für den Schurken
// und ALLE seine Unterklassen (Dieb, Assassine, Arkaner Betrüger).
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * (NEU) Zauberplätze pro Stufe für einen 1/3-Zauberwirker (Arkaner Betrüger, Eldritch Knight)
 * Index 0 = Level 1 (keine Slots), Index 2 = Level 3 (erste Slots), ...
 * G1, G2, G3, G4
 */
const THIRD_CASTER_SLOTS = [
  // Lvl 1-20
  // G1, G2, G3, G4
  [0, 0, 0, 0], // Level 1
  [0, 0, 0, 0], // Level 2
  [2, 0, 0, 0], // Level 3
  [3, 0, 0, 0], // Level 4
  [3, 0, 0, 0], // Level 5
  [3, 0, 0, 0], // Level 6
  [4, 2, 0, 0], // Level 7
  [4, 2, 0, 0], // Level 8
  [4, 2, 0, 0], // Level 9
  [4, 3, 0, 0], // Level 10
  [4, 3, 0, 0], // Level 11
  [4, 3, 0, 0], // Level 12
  [4, 3, 2, 0], // Level 13
  [4, 3, 2, 0], // Level 14
  [4, 3, 2, 0], // Level 15
  [4, 3, 3, 0], // Level 16
  [4, 3, 3, 0], // Level 17
  [4, 3, 3, 0], // Level 18
  [4, 3, 3, 1], // Level 19
  [4, 3, 3, 1], // Level 20
];

/**
 * (NEU) Bekannte Zauber für den Arkanen Betrüger (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const ARCANE_TRICKSTER_SPELLS_KNOWN = [
    0, 0, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9
];


/**
 * Wendet alle passiven Stat-Modifikatoren für den Schurken an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Hinterhältiger Angriff (Sneak Attack) ---
  if (level >= 1) {
    const sneakAttackDice = Math.ceil(level / 2);
    newStats.sneakAttack = `${sneakAttackDice}d6`;
  }

  // --- Level 1: Expertise ---
  if (level >= 1) {
    const expertiseChoices = character.choices?.expertise || [];
    newStats.expertiseSkills = expertiseChoices;
  }
  
  // --- Level 6: Expertise (erneut) ---
  if (level >= 6) {
    // Annahme: Die Wahlen sind im Charakterobjekt gespeichert
    const expertiseChoices2 = character.choices?.expertise2 || [];
    newStats.expertiseSkills = (newStats.expertiseSkills || []).concat(expertiseChoices2);
  }

  // --- Level 11: Verlässliches Talent ---
  if (level >= 11) {
    newStats.reliableTalent = true;
  }
  
  // --- Level 15: Schlauer Geist ---
  if (level >= 15) {
      // (Fügt Weisheits-Rettungswurf-Übung hinzu)
      newStats.savingThrowProficiencies = (newStats.savingThrowProficiencies || []);
      if (!newStats.savingThrowProficiencies.includes('wisdom')) {
          newStats.savingThrowProficiencies.push('wisdom');
      }
  }
  
  // --- Level 18: Flüchtiger Gedanke ---
  // (Ermöglicht Vorteil bei einem fehlgeschlagenen Wurf, 1x pro Rast)
  // (Wird in getActiveSkills als Fähigkeit hinzugefügt)

  // --- Level 20: Glückssträhne ---
  // (Verwandelt einen Fehlschlag in einen Treffer, 1x pro Rast)
  // (Wird in getActiveSkills als Fähigkeit hinzugefügt)


  // =================================================================
  // --- SUBKLASSEN-LOGIK (PASSIV) ---
  // =================================================================
  
  if (!newStats.proficiencies) {
      newStats.proficiencies = { armor: [], weapons: [], skills: [], tools: [] };
  }

  switch (subclassKey) {
      case 'thief':
          // Lvl 3: Akrobat (Second-Story Work)
          if (level >= 3) {
              // Klettern kostet keine extra Bewegung
              newStats.climbingDoesNotCostExtraMovement = true;
              // (Sprungweite-Bonus müsste von der Bewegungs-Engine implementiert werden)
          }
          
          // Lvl 9: Überlegene Heimlichkeit (Supreme Sneak)
          if (level >= 9) {
              // (Vorteil bei Heimlichkeit, wenn man sich nur halb bewegt)
              // (Müsste von der Skill-Check-Engine geprüft werden)
              newStats.supremeSneak = true;
          }
          
          // Lvl 13: Magische Gegenstände benutzen (Use Magic Device)
          if (level >= 13) {
              // (Ignoriert Klassen/Volks/Level-Anforderungen für mag. Gegenstände)
              // (Müsste von der Ausrüstungs-Engine geprüft werden)
              newStats.useMagicDevice = true;
          }
          break;
          
      case 'assassin':
          // Lvl 3: Bonus-Übungen
          if (level >= 3) {
              newStats.proficiencies.tools.push("disguise_kit", "poisoners_kit");
          }
          break;
          
      case 'arcane_trickster':
          // Lvl 9: Magischer Hinterhalt
          if (level >= 9) {
              // (Ziele haben Nachteil bei Rettungswürfen gegen Zauber, wenn du versteckt bist)
              // (Müsste von der Zauber-Engine geprüft werden)
              newStats.magicalAmbush = true;
          }
          break;
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
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Listige Aktion (Cunning Action) ---
  if (level >= 2) {
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
  
  // --- Level 18: Flüchtiger Gedanke (Elusive) ---
  if (level >= 18) {
      activeSkills.push({
          key: "elusive_mind",
          name: "Flüchtiger Gedanke",
          type: "reaction_modifier", // (Oder 'free_action' je nach Implementierung)
          description: "Wenn du einen Angriffs- oder Attributswurf verfehlst, kannst du den Wurf wiederholen (mit Vorteil). (1x pro Rast)",
          uses: 1,
          recharge: "short_rest" // (In 5e ist es "keine Aktion", also eher reaktiv)
      });
  }
  
  // --- Level 20: Glückssträhne (Stroke of Luck) ---
  if (level >= 20) {
      activeSkills.push({
          key: "stroke_of_luck",
          name: "Glückssträhne",
          type: "reaction_modifier",
          description: "Wenn du einen Angriff verfehlst, verwandle ihn in einen Treffer. Wenn du einen Attributs-/Rettungswurf verfehlst, behandle ihn als 20. (1x pro Rast)",
          uses: 1,
          recharge: "short_rest"
      });
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (AKTIV) ---
  // =================================================================
  
  switch (subclassKey) {
      case 'thief':
          // Lvl 3: Flinke Hände (Fast Hands)
          if (level >= 3) {
              // Fügt Listige Aktion hinzu:
              activeSkills.push(
                  {
                      key: "cunning_action_sleight_of_hand",
                      name: "Listige Aktion: Fingerfertigkeit",
                      type: "bonus_action",
                      description: "Nutze deine Bonusaktion, um einen Fingerfertigkeits-Wurf zu machen."
                  },
                  {
                      key: "cunning_action_thieves_tools",
                      name: "Listige Aktion: Diebeswerkzeug",
                      type: "bonus_action",
                      description: "Nutze deine Bonusaktion, um Diebeswerkzeug (Schlösser knacken) zu benutzen."
                  },
                  {
                      key: "cunning_action_use_object",
                      name: "Listige Aktion: Gegenstand nutzen",
                      type: "bonus_action",
                      description: "Nutze deine Bonusaktion, um die 'Gegenstand benutzen'-Aktion auszuführen (z.B. Trank trinken, Hebel ziehen)."
                  }
              );
          }
          break;
          
      case 'assassin':
          // (Die meisten Fähigkeiten des Assassinen sind passiv oder reaktiv)
          break;
          
      case 'arcane_trickster':
          // Lvl 3: Magierhand-Gaunerei (Mage Hand Legerdemain)
          if (level >= 3) {
              activeSkills.push({
                  key: "mage_hand_legerdemain",
                  name: "Magierhand-Gaunerei",
                  type: "passive_modifier",
                  description: "Deine 'Magierhand' ist unsichtbar und kann zum Stehlen, Entschärfen und Interagieren (Schlüssel im Gürtel etc.) genutzt werden."
              });
          }
          
          // Lvl 13: Vielseitiger Betrüger (Versatile Trickster)
          if (level >= 13) {
              activeSkills.push({
                  key: "versatile_trickster",
                  name: "Vielseitiger Betrüger",
                  type: "bonus_action",
                  description: "Als Bonusaktion, erhalte Vorteil bei Angriffswürfen gegen eine Kreatur in 1,5m Umkreis deiner Magierhand."
              });
          }
          
          // Lvl 17: Zauberdieb (Spell Thief)
          if (level >= 17) {
              activeSkills.push({
                  key: "spell_thief",
                  name: "Zauberdieb",
                  type: "reaction",
                  description: "Als Reaktion (wenn ein Zauber nur dich trifft): Erzwinge einen Rettungswurf (vs. dein Zauber-SG). Bei Misserfolg negierst du den Zauber und 'stiehlst' ihn (kannst ihn 1x wirken). (1x pro langer Rast)",
                  uses: 1,
                  recharge: "long_rest"
              });
          }
          break;
  }
  
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
    const subclassKey = character.subclassKey;

    // --- Level 5: Unheimliches Gespür (Uncanny Dodge) ---
    if (
        level >= 5 &&
        eventType === 'damage_taken' &&
        data.sourceType === 'attack' && 
        data.target === character.id &&
        !data.isHalved // Verhindert doppelte Anwendung
    ) {
        // Signalisieren, dass die Reaktion "Unheimliches Gespür" verfügbar ist.
        return { ...data, canReact: 'uncanny_dodge' };
    }

    // --- Level 7: Entrinnen (Evasion) ---
    if (
        level >= 7 &&
        eventType === 'saving_throw' &&
        data.ability === 'dexterity' && 
        data.effect === 'half_damage_on_save'
    ) {
        return { ...data, hasEvasion: true };
    }

    // --- Level 1: Hinterhältiger Angriff (Basis-Klasse) ---
    if (level >= 1 && eventType === 'attack_hit') {
        
        const hasUsedSneakAttack = character.status?.hasUsedSneakAttackThisTurn || false;
        
        // 1. Bedingung: Finesse oder Fernkampf
        // (In D&D 5e: 'finesse' ODER 'ranged' Eigenschaft)
        // (Annahme: data.weapon.properties ist ein Array)
        const weaponProps = data.weapon?.properties || [];
        const isFinesse = weaponProps.includes('finesse');
        const isRanged = (data.attackType === 'ranged_weapon'); // (attackType von characterEngine)
        
        if (!hasUsedSneakAttack && (isFinesse || isRanged)) {
            
            // 2. Bedingung: Vorteil ODER Verbündeter in 1.5m
            const hasAdvantage = data.rollData?.advantage || false;
            
            // 3. Bedingung: Kein Nachteil
            const hasDisadvantage = data.rollData?.disadvantage || false;
            
            // (Neue Hilfsfunktion `isAllyAdjacent` unten)
            const hasAllyNearby = isAllyAdjacent(character, data.target, data.gameState);

            // (Hinterhältiger Angriff funktioniert NICHT, wenn man Nachteil hat)
            if (!hasDisadvantage && (hasAdvantage || hasAllyNearby)) {
                
                const sneakAttackDice = Math.ceil(level / 2);
                const diceFormula = `${sneakAttackDice}d6`;
                
                return { 
                    ...data, 
                    bonusDamage: (data.bonusDamage || "") + `+${diceFormula}`, 
                    bonusDamageCrit: (data.bonusDamageCrit || "") + `+${diceFormula}`,
                    setStatus: 'hasUsedSneakAttackThisTurn' 
                };
            }
        }
    }
    
    // =================================================================
    // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
    // =================================================================

    switch (subclassKey) {
        case 'assassin':
            // Lvl 3: Attentat (Assassinate) - Vorteil
            if (
                level >= 3 &&
                eventType === 'before_attack_roll' &&
                data.target?.status?.hasNotActedInCombat // (Engine muss dies bereitstellen)
            ) {
                return { ...data, advantage: true };
            }

            // Lvl 3: Attentat (Assassinate) - Kritischer Treffer
            if (
                level >= 3 &&
                eventType === 'attack_hit' &&
                data.target?.status?.isSurprised // (Engine muss dies bereitstellen)
            ) {
                return { ...data, isCritical: true };
            }
            
            // Lvl 17: Todesstoß (Death Strike)
            if (
                level >= 17 &&
                eventType === 'attack_hit' &&
                data.target?.status?.isSurprised
            ) {
                // (Engine muss DC berechnen: 8 + Übung + GES-Mod)
                const profBonus = getProficiencyBonus(level);
                const dexMod = calculateModifier(character.abilities.dex); // (Sollte finalStats nutzen)
                const saveDC = 8 + profBonus + dexMod;
                
                // Signalisiert der Engine, einen Rettungswurf zu fordern
                // Wenn dieser fehlschlägt, muss die Engine den Schaden verdoppeln
                return { 
                    ...data, 
                    requiresSave: { 
                        type: 'constitution', 
                        dc: saveDC, 
                        effect: 'death_strike_double_damage' 
                    } 
                };
            }
            break;
            
        case 'thief':
            // Lvl 17: Reflexe des Diebes (Thief's Reflexes)
             if (
                level >= 17 &&
                eventType === 'combat_start' &&
                data.characterId === character.id &&
                !character.status?.hasUsedThiefsReflexes // Nur 1x pro langer Rast
            ) {
                // (Signalisiert der Engine, diesem Charakter 2 Züge in Runde 1 zu geben)
                return { 
                    ...data, 
                    grantExtraTurnInFirstRound: true, 
                    setStatus: 'hasUsedThiefsReflexes' 
                };
            }
            break;
    }


    // Keine Änderung am Ereignis
    return data;
}


/**
 * (NEU) Holt die Zauber-Fähigkeiten (falls vorhanden).
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;

    // Nur der Arkane Betrüger kann zaubern
    if (character.subclassKey !== 'arcane_trickster') {
        return null;
    }
    
    // Zauberwirken beginnt auf Stufe 3
    if (level < 3) {
        return null;
    }
    
    const intMod = calculateModifier(stats.intelligence);

    return {
        // "known": Arkane Betrüger lernen eine feste Anzahl Zauber.
        spellcastingType: "known", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "wizard", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "intelligence",
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks).
        knownSpellsCount: ARCANE_TRICKSTER_SPELLS_KNOWN[level],
        
        // (NEU) Spezielle Regel für Arkane Betrüger:
        // Die Engine muss dies lesen und die Zauberwahl einschränken
        // (Alle außer 3, 8, 14, 20 müssen Illusion oder Verzauberung sein)
        spellListRestrictions: {
            school: ["illusion", "enchantment"],
            flexibleLevels: [3, 8, 14, 20] // (Level, an denen 1 Zauber frei wählbar ist)
        },
        
        // (NEU) Zauberplätze für 1/3-Zauberwirker
        spellSlots: THIRD_CASTER_SLOTS[level - 1]
    };
}


// =================================================================
// --- NEUE HILFSFUNKTIONEN ---
// =================================================================

/**
 * (Helper) Holt den Übungsbonus (lokal, falls nicht von der Engine bereitgestellt).
 */
function getProficiencyBonus(level) {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
}

/**
 * (NEU) Prüft, ob ein Verbündeter des Angreifers neben dem Ziel steht.
 * Dies ist eine Annahme, wie die Datenstruktur aussehen könnte.
 * @param {object} attacker - Der Charakter des Schurken.
 * @param {object} target - Das Zielobjekt (mit Position).
 * @param {object} gameState - Das (angenommene) Spielstatus-Objekt mit Positionen aller Charaktere.
 */
function isAllyAdjacent(attacker, target, gameState) {
    // (Diese Funktion ist ein Stub und benötigt die echte Spiellogik)
    
    if (!gameState || !target?.position || !gameState.partyPositions) {
        // Wenn wir keine Positionsdaten haben, gehen wir sicherheitshalber davon aus,
        // dass die Bedingung (noch) nicht erfüllt ist.
        // ODER wir könnten `true` annehmen, um Sneak Attack im Zweifel zu erlauben.
        // Wir wählen `false` für strikte Regeln.
        return false; 
    }

    const { x: targetX, y: targetY } = target.position;

    // Durchlaufe alle Verbündeten
    for (const allyId in gameState.partyPositions) {
        // Ignoriere den Angreifer selbst
        if (allyId === attacker.id) continue;

        const allyPos = gameState.partyPositions[allyId];
        
        // Berechne die Distanz (einfache Gitterdistanz von 1.5m / 1 Feld)
        const distance = Math.max(Math.abs(allyPos.x - targetX), Math.abs(allyPos.y - targetY));
        
        // Wenn ein Verbündeter auf einem angrenzenden Feld steht UND nicht kampfunfähig ist
        const allyStatus = gameState.characterStatus[allyId];
        const isAllyIncapacitated = allyStatus?.isDowned || allyStatus?.isStunned || allyStatus?.isParalyzed;

        if (distance <= 1.5 && !isAllyIncapacitated) {
            return true;
        }
    }
    
    return false;
}
