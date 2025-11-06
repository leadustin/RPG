// Diese Datei implementiert die spezifische Klassenlogik für den Kämpfer
// und seine Unterklassen (Champion, Kampfmeister, Mystischer Ritter).
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

// =================================================================
// --- NEUE KONSTANTEN FÜR MYSTISCHEN RITTER ---
// =================================================================

/**
 * (NEU) Zauberplätze pro Stufe für einen 1/3-Zauberwirker (Mystischer Ritter, Arkaner Betrüger)
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
 * (NEU) Bekannte Zauber für den Mystischen Ritter (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const ELDRITCH_KNIGHT_SPELLS_KNOWN = [
    0, 0, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9
];


/**
 * Wendet alle passiven Stat-Modifikatoren für den Kämpfer an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Kampfstil ---
  if (level >= 1) {
    const style = character.choices?.fightingStyle;

    if (style === "defense") {
      newStats.fightingStyle = "defense";
    }
    else if (style === "archery") {
      newStats.fightingStyle = "archery";
    }
    // (Andere Stile wie 'dueling' würden hier Boni auf 'stats.damageBonus' geben)
  }
  
  // --- Level 5: Zusätzlicher Angriff ---
  if (level >= 5) {
      newStats.extraAttacks = 1; 
  }
  
  // --- Level 11: Zusätzlicher Angriff (2) ---
  if (level >= 11) {
      newStats.extraAttacks = 2;
  }
  
  // --- Level 20: Zusätzlicher Angriff (3) ---
  if (level >= 20) {
      newStats.extraAttacks = 3;
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (PASSIV) ---
  // =================================================================
  
  if (!newStats.proficiencies) {
      newStats.proficiencies = { armor: [], weapons: [], skills: [], tools: [] };
  }

  switch (subclassKey) {
      case 'champion':
          // Lvl 3: Verbesserter kritischer Treffer
          if (level >= 3) {
              newStats.critRange = 19; 
          }
          
          // Lvl 7: Bemerkenswerter Athlet
          if (level >= 7) {
              newStats.remarkableAthlete = true; 
          }
          
          // Lvl 10: Zusätzlicher Kampfstil
          if (level >= 10) {
              const style2 = character.choices?.fightingStyle2;
              // (Logik, um style2 anzuwenden, z.B. newStats.fightingStyle2 = style2)
          }
          
          // Lvl 15: Verbesserter kritischer Treffer (Superior Critical)
          if (level >= 15) {
              newStats.critRange = 18; 
          }
          break;
          
      case 'battle_master':
          // Lvl 3: Überlegenheit im Kampf (Ressource)
          if (level >= 3) {
              let diceCount = 0;
              if (level >= 15) diceCount = 6;
              else if (level >= 7) diceCount = 5;
              else diceCount = 4;
              
              let diceType = 8;
              if (level >= 10) diceType = 10;
              if (level >= 18) diceType = 12; // (In 5e ist es Lvl 10 -> d10, Lvl 18 -> d12)
                                            // (JSON sagt Lvl 10 d10, passen wir das an)
              
              newStats.superiorityDice = {
                  count: diceCount,
                  die: `1d${diceType}`,
                  recharge: 'short_rest'
              };
          }
          
          // Lvl 3: Kriegskunststudent
          if (level >= 3) {
              const tool = character.choices?.artisanTool; // z.B. 'smiths_tools'
              if (tool && !newStats.proficiencies.tools.includes(tool)) {
                  newStats.proficiencies.tools.push(tool);
              }
          }
          break;
          
      case 'eldritch_knight':
          // Lvl 3: Waffenbindung (Passiver Effekt)
          if (level >= 3) {
              // (Signalisiert der Engine, dass diese Waffe nicht entwaffnet werden kann)
              newStats.weaponBondActive = true; 
          }
          break;
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Kämpfer-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Zweite Luft (Second Wind) ---
  if (level >= 1) {
    activeSkills.push({
      key: "second_wind",
      name: "Zweite Luft",
      type: "bonus_action",
      description: `Nutze eine Bonusaktion, um 1W10 + ${level} TP zu heilen. (1x pro kurzer Rast)`,
      uses: 1,
      recharge: "short_rest",
    });
  }

  // --- Level 2: Tatendrang (Action Surge) ---
  if (level >= 2) {
    activeSkills.push({
      key: "action_surge",
      name: "Tatendrang",
      type: "free_action", 
      description: "Erhalte sofort eine zusätzliche Aktion.",
      uses: (level >= 17 ? 2 : 1), 
      recharge: "short_rest",
    });
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (AKTIV) ---
  // =================================================================
  
  switch (subclassKey) {
      case 'battle_master':
          // Lvl 3: Manöver
          if (level >= 3) {
              // Annahme: Die 3 gelernten Manöver sind in character.choices.maneuvers gespeichert
              const maneuvers = character.choices?.maneuvers || [];
              
              // (Wir fügen alle Manöver hinzu, die der Spieler gelernt haben könnte)
              if (maneuvers.includes('parry')) {
                  activeSkills.push({
                      key: "maneuver_parry",
                      name: "Manöver: Parieren",
                      type: "reaction",
                      description: "Als Reaktion (wenn du Nahkampfschaden erleidest): Gib 1 Überlegenheitswürfel aus und reduziere den Schaden um den Würfelwurf + GES-Mod."
                  });
              }
              if (maneuvers.includes('precision_attack')) {
                  activeSkills.push({
                      key: "maneuver_precision_attack",
                      name: "Manöver: Präziser Angriff",
                      type: "attack_modifier",
                      description: "Vor dem Wurf: Gib 1 Überlegenheitswürfel aus und addiere ihn zu deinem Angriffswurf."
                  });
              }
              if (maneuvers.includes('pushing_attack')) {
                  activeSkills.push({
                      key: "maneuver_pushing_attack",
                      name: "Manöver: Stoßender Angriff",
                      type: "attack_modifier",
                      description: "Nach einem Treffer: Gib 1 Überlegenheitswürfel aus (addiere Schaden), stoße das Ziel (falls groß oder kleiner) bis zu 4,5m weg (STR-Rettungswurf)."
                  });
              }
              // (Weitere Manöver würden hier hinzugefügt)
          }
          break;
          
      case 'eldritch_knight':
          // Lvl 3: Waffenbindung (Aktion)
          if (level >= 3) {
              activeSkills.push({
                  key: "weapon_bond_call",
                  name: "Waffenbindung (Rufen)",
                  type: "bonus_action",
                  description: "Als Bonusaktion, rufe deine gebundene Waffe in deine Hand (solange auf derselben Ebene)."
              });
          }
          
          // Lvl 15: Arkane Aufladung (Teleport)
          if (level >= 15) {
              activeSkills.push({
                  key: "arcane_charge",
                  name: "Arkane Aufladung",
                  type: "passive_modifier", // Modifiziert "Tatendrang"
                  description: "Wenn du 'Tatendrang' nutzt, kannst du dich bis zu 9m teleportieren."
              });
          }
          break;
  }
  
  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Kämpfer auf dieses Ereignis reagieren muss.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'saving_throw').
 * @param {object} data - Die Daten des Ereignisses (z.B. { result: 'fail', ... }).
 * @param {object} character - Das Charakterobjekt des Kämpfers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
  const level = character.level || 1;
  const subclassKey = character.subclassKey;
    
  // --- Level 9: Unbezwingbar (Indomitable) ---
  if (eventType === 'saving_throw' && data.result === 'fail' && data.characterId === character.id) {
      let uses = 0;
      if (level >= 17) uses = 3;
      else if (level >= 13) uses = 2;
      else if (level >= 9) uses = 1;
      
      const usedCharges = character.resources?.indomitable || 0; 
      
      if (uses > usedCharges) {
          return { ...data, canReact: 'indomitable_reroll' };
      }
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
  // =================================================================
  
  // (Annahme: Engine stellt `character.resources.superiorityDice` bereit)
  const superiorityDice = character.resources?.superiorityDice || 0;
  const maneuvers = character.choices?.maneuvers || [];

  switch (subclassKey) {
      case 'battle_master':
          // Lvl 3: Manöver (Reaktionen)
          if (superiorityDice > 0) {
              // Reaktion: Parieren
              if (
                  maneuvers.includes('parry') &&
                  eventType === 'damage_taken' &&
                  data.sourceType === 'melee_attack' &&
                  data.target === character.id
              ) {
                  return { ...data, canReact: 'maneuver_parry' };
              }
              
              // Modifikator: Präziser Angriff
              if (
                  maneuvers.includes('precision_attack') &&
                  eventType === 'before_attack_roll' &&
                  data.attacker === character.id
              ) {
                  return { ...data, canReact: 'maneuver_precision_attack' };
              }
              
              // Modifikator: Stoßender Angriff
              if (
                  maneuvers.includes('pushing_attack') &&
                  eventType === 'attack_hit' &&
                  data.attacker === character.id
              ) {
                  return { ...data, canReact: 'maneuver_pushing_attack' };
              }
          }
          break;
          
      case 'eldritch_knight':
          // Lvl 7: Kriegsmagie
          if (
              level >= 7 &&
              eventType === 'cast_spell' &&
              data.spell.type === 'cantrip' && // Nur bei Zaubertricks
              data.castTime === 'action' &&     // Nur bei Aktion
              data.casterId === character.id
          ) {
              // Signalisiert der Engine, dass eine Bonusaktion-Angriff erlaubt ist
              return { ...data, grantBonusAction: 'weapon_attack' };
          }
          
          // Lvl 10: Mystischer Schlag
          if (
              level >= 10 &&
              eventType === 'attack_hit' &&
              data.attackType.includes('weapon') &&
              data.attacker === character.id
          ) {
              // Wendet einen Debuff auf das Ziel an
              return { 
                  ...data, 
                  targetDebuff: { 
                      effect: 'eldritch_strike_disadvantage_save', 
                      duration: 1, // (Bis zum Ende *deines* nächsten Zuges)
                      source: character.id 
                  }
              };
          }
          
          // Lvl 15: Arkane Aufladung (Teleport bei Tatendrang)
          if (
              level >= 15 &&
              eventType === 'action' &&
              data.action === 'action_surge' &&
              data.characterId === character.id
          ) {
              // Signalisiert der Engine, eine Teleport-Bewegung anzubieten
              return { ...data, triggerEffect: 'arcane_charge_teleport' };
          }
          break;
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
 * (NEU) Holt die Zauber-Fähigkeiten (falls vorhanden, z.B. für Eldritch Knight).
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;

    // Nur der Mystische Ritter kann zaubern
    if (character.subclassKey !== 'eldritch_knight') {
        return null;
    }
    
    // Zauberwirken beginnt auf Stufe 3
    if (level < 3) {
        return null;
    }
    
    const intMod = calculateModifier(stats.intelligence);

    return {
        // "known": Mystische Ritter lernen eine feste Anzahl Zauber.
        spellcastingType: "known", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "wizard", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "intelligence",
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks).
        knownSpellsCount: ELDRITCH_KNIGHT_SPELLS_KNOWN[level],
        
        // Spezielle Regel für Mystische Ritter:
        // Die Engine muss dies lesen und die Zauberwahl einschränken
        spellListRestrictions: {
            school: ["abjuration", "evocation"],
            flexibleLevels: [3, 8, 14, 20] // (Level, an denen 1 Zauber frei wählbar ist)
        },
        
        // Zauberplätze für 1/3-Zauberwirker
        spellSlots: THIRD_CASTER_SLOTS[level - 1]
    };
}
