// Diese Datei implementiert die spezifische Klassenlogik für den Zauberer.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * (Kopiert aus wizard.js)
 * Zauberplätze pro Stufe für einen Voll-Zauberwirker
 */
const FULL_CASTER_SLOTS = [
  // Lvl 1-20
  // G1, G2, G3, G4, G5, G6, G7, G8, G9
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
];

// =================================================================
// --- KORREKTUR: Fehlende Konstante hinzugefügt ---
// =================================================================
/**
 * Tabelle für bekannte Zauber des Zauberers (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const SORCERER_SPELLS_KNOWN = [
    0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, // Level 1-10
    11, 12, 12, 13, 13, 14, 14, 15, 15, 15 // Level 11-20
];
// =================================================================
// --- ENDE DER KORREKTUR ---
// =================================================================

/**
 * Wendet alle passiven Stat-Modifikatoren für den Zauberer an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats;
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Zauberwirken-Kernattribute ---
  const chaMod = calculateModifier(abilities.charisma);
  const proficiencyBonus = getProficiencyBonus(level); 

  newStats.spellcastingAbility = "charisma";
  newStats.spellSaveDC = 8 + proficiencyBonus + chaMod;
  newStats.spellAttackBonus = proficiencyBonus + chaMod;

  // --- Zauberplätze ---
  newStats.spellSlots = FULL_CASTER_SLOTS[level - 1];
  
  // --- Level 2: Quelle der Magie (Zauberpunkte) ---
  // Beschreibung: "Du erhältst Zauberpunkte..."
  if (level >= 2) {
      newStats.sorceryPoints = {
          current: level,
          max: level
      };
  }

  // --- Subklassen-Features (Drakonische Blutlinie) ---
  if (subclassKey === 'draconic_bloodline') {
      
      // Level 1: Drakonische Widerstandsfähigkeit (HP)
      // Beschreibung: "Maximale Trefferpunkte +1 pro Zauberstufe."
      if (level >= 1) {
          // Die `calculateMaxHP`-Funktion in der Engine muss dies berücksichtigen
          newStats.maxHpBonus = (newStats.maxHpBonus || 0) + level;
      }
      
      // Level 1: Drakonische Widerstandsfähigkeit (AC)
      // Beschreibung: "Rüstungsklasse 13 + Geschicklichkeitsmodifikator, falls ungerüstet."
      if (level >= 1) {
          const isUnarmored = !character.equipment.armor;
          if (isUnarmored) {
              const dexMod = calculateModifier(abilities.dexterity);
              const draconicAC = 13 + dexMod;
              
              // Vergleiche mit der Standard-AC (10 + Dex) und nimm die höhere.
              // Die `calculateAC`-Engine wird dies dann mit Rüstungen vergleichen.
              if (draconicAC > newStats.armorClass) {
                  newStats.armorClass = draconicAC;
              }
          }
      }
      
      // Level 6: Elementare Affinität
      // Beschreibung: "Bei Zaubern des Drachenahnen-Schadentyps kannst du Charisma-Modifikator zum Schaden addieren..."
      if (level >= 6) {
          // Annahme: Die Wahl des Schadenstyps ist gespeichert, z.B. 'fire'
          const ancestryType = character.choices?.draconicAncestry; 
          if (ancestryType) {
              newStats.elementalAffinity = {
                  type: ancestryType,
                  bonus: Math.max(1, chaMod) // (CHA-Mod, min 1 in 5e)
              };
          }
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Zauberer-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;

  // --- Level 2: Quelle der Magie (Flexible Casting) ---
  // Beschreibung: "...kannst du Zauberplätze erzeugen oder Zauber mit Metamagie verändern."
  if (level >= 2) {
      activeSkills.push({
          key: "flexible_casting",
          name: "Flexible Magie",
          type: "bonus_action", // (In 5e)
          description: "Nutze eine Bonusaktion, um Zauberpunkte in Zauberplätze umzuwandeln oder umgekehrt."
      });
  }
  
  // --- Level 3: Metamagie ---
  // Beschreibung: "Du wählst zwei Metamagie-Optionen..."
  if (level >= 3) {
      // Annahme: Die Wahlen sind im Charakter gespeichert, z.B. ['empowered_spell', 'careful_spell']
      const metamagicChoices = character.choices?.metamagic || [];
      
      if (metamagicChoices.includes('careful_spell')) {
          activeSkills.push({
              key: "metamagic_careful",
              name: "Metamagie: Behutsamer Zauber",
              type: "spell_modifier", // Modifiziert einen Zauber beim Wirken
              description: "Koste 1 Zauberpunkt. Wähle Kreaturen, die bei Rettungswürfen gegen deinen Zauber automatisch erfolgreich sind."
          });
      }
      if (metamagicChoices.includes('empowered_spell')) {
          activeSkills.push({
              key: "metamagic_empowered",
              name: "Metamagie: Verstärkter Zauber",
              type: "spell_modifier", // Modifiziert einen Zauber nach dem Schadenswurf
              description: "Koste 1 Zauberpunkt. Du kannst eine Anzahl von Schadenswürfeln (bis zu deinem CHA-Mod) neu würfeln."
          });
      }
      // (Weitere Metamagie-Optionen würden hier hinzugefügt)
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'spell_damage').
 * @param {object} data - Die Daten des Ereignisses (z.B. { spell: { ... }, damage: [...] }).
 * @param {object} character - Das Charakterobjekt des Zauberers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const stats = calculateFinalStats(character); // (Engine sollte finale Stats bereitstellen)

    // --- Level 6: Elementare Affinität (Drakonische Blutlinie) ---
    // Beschreibung: "...kannst du Charisma-Modifikator zum Schaden addieren."
    if (
        stats.elementalAffinity &&
        eventType === 'spell_damage' && // Event, wenn ein Zauber Schaden verursacht
        data.spell.damageType === stats.elementalAffinity.type &&
        !data.isBonusDamageAdded // Verhindern von doppelter Anwendung
    ) {
        // Füge den Bonus (CHA-Mod) zu EINEM Schadenswurf des Zaubers hinzu
        return { 
            ...data, 
            bonusDamage: (data.bonusDamage || 0) + stats.elementalAffinity.bonus,
            isBonusDamageAdded: true // Flag setzen
        };
    }

    // Keine Änderung am Ereignis
    return data;
}

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
 * (Helper) Ruft die finale Stat-Berechnung auf (lokal, falls nicht von der Engine bereitgestellt).
 * Dies ist ein Platzhalter. Idealerweise übergibt die Engine die finalen Stats
 * direkt an `handleGameEvent`.
 */
function calculateFinalStats(character) {
    // Diese Funktion ist ein STUB. Sie sollte die Logik aus der characterEngine aufrufen.
    // Hier simulieren wir nur die Stats, die wir brauchen.
    const abilities = {
        charisma: character.abilities.cha + (getRacialAbilityBonus(character, "cha") || 0),
        dexterity: character.abilities.dex + (getRacialAbilityBonus(character, "dex") || 0),
    };
    const chaMod = calculateModifier(abilities.charisma);
    const level = character.level || 1;
    
    let stats = {
        elementalAffinity: null
    };

    if (character.subclassKey === 'draconic_bloodline' && level >= 6) {
        const ancestryType = character.choices?.draconicAncestry;
        if (ancestryType) {
            stats.elementalAffinity = {
                type: ancestryType,
                bonus: Math.max(1, chaMod)
            };
        }
    }
    return stats;
}

/**
 * (Helper) Holt Rassenboni (lokal, falls nicht von der Engine bereitgestellt).
 */
function getRacialAbilityBonus(character, abilityKey) {
   // (Kopierter Stub aus der characterEngine)
   if (!character) return 0;
   let totalBonus = 0;
   if (character.ability_bonus_assignments && character.ability_bonus_assignments[abilityKey]) {
       totalBonus += character.ability_bonus_assignments[abilityKey];
   }
   if (character.race?.ability_bonuses?.floating && character.floating_bonus_assignments) {
       // (Vereinfachte Logik)
   }
   return totalBonus;
}

/**
 * (NEU) Holt die spezifischen Zauber-Regeln für den Zauberer.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;

    return {
        // "known": Zauberer wählen beim Stufenaufstieg eine feste Anzahl Zauber.
        spellcastingType: "known", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "sorcerer", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "charisma",
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks).
        knownSpellsCount: SORCERER_SPELLS_KNOWN[level] 
    };
}