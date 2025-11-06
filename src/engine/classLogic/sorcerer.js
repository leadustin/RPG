// Diese Datei implementiert die spezifische Klassenlogik für den Zauberer
// und seine Unterklassen (Drakonische Blutlinie, Wilde Magie, Göttliche Seele).
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
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

/**
 * Tabelle für bekannte Zauber des Zauberers (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const SORCERER_SPELLS_KNOWN = [
    0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, // Level 1-10
    11, 12, 12, 13, 13, 14, 14, 15, 15, 15 // Level 11-20
];

/**
 * Wendet alle passiven Stat-Modifikatoren für den Zauberer an.
 * @param {object} character - Das vollständige Charakterobjekt.
 *@param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
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
  if (level >= 2) {
      newStats.sorceryPoints = {
          current: level,
          max: level
      };
  }
  
  // --- Level 20: Zauber-Meister ---
  if (level >= 20) {
      // (Signalisiert der Engine, 4 Zauberpunkte bei kurzer Rast wiederherzustellen)
      newStats.sorcerousRestoration = true;
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (PASSIV) ---
  // =================================================================

  switch (subclassKey) {
      case 'draconic_bloodline':
          // Level 1: Drakonische Widerstandsfähigkeit (HP)
          if (level >= 1) {
              newStats.maxHpBonus = (newStats.maxHpBonus || 0) + level;
          }
          
          // Level 1: Drakonische Widerstandsfähigkeit (AC)
          if (level >= 1) {
              const isUnarmored = !character.equipment.armor;
              if (isUnarmored) {
                  const dexMod = calculateModifier(abilities.dexterity);
                  const draconicAC = 13 + dexMod;
                  if (draconicAC > newStats.armorClass) {
                      newStats.armorClass = draconicAC;
                  }
              }
          }
          
          // Level 6: Elementare Affinität
          if (level >= 6) {
              const ancestryType = character.choices?.draconicAncestry; 
              if (ancestryType) {
                  newStats.elementalAffinity = {
                      type: ancestryType,
                      bonus: Math.max(1, chaMod)
                  };
              }
          }
          
          // Level 14: Drachenschwingen
          if (level >= 14) {
              // (Muss von der Bewegungs-Engine als Fähigkeit implementiert werden)
              newStats.canGrowWings = true; 
          }
          break;

      case 'wild_magic':
          // Lvl 1: Gezeiten des Chaos (passiver Teil)
          // (Wird von getActiveSkills als Fähigkeit hinzugefügt)
          
          // Lvl 14: Magie kontrollieren
          if (level >= 14) {
              // (Signalisiert der Engine, bei einer Woge 2x zu würfeln)
              newStats.controlledChaos = true;
          }
          break;
          
      case 'divine_soul':
          // Lvl 1: Von den Göttern bevorzugt
          if (level >= 1) {
              // (Muss von handleGameEvent als Reaktion implementiert werden)
              newStats.favoredByTheGods = true;
          }
          
          // Lvl 6: Heilende Kraft (Empowered Healing)
          // (Wird von getActiveSkills als Fähigkeit hinzugefügt)
          
          // Lvl 14: Übernatürliche Erholung
          if (level >= 14) {
              // (Flugfähigkeit, wird als Aktion in getActiveSkills hinzugefügt)
              newStats.canGrowAngelicWings = true;
          }
          break;
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
  const subclassKey = character.subclassKey;

  // --- Level 2: Quelle der Magie (Flexible Casting) ---
  if (level >= 2) {
      activeSkills.push({
          key: "flexible_casting",
          name: "Flexible Magie",
          type: "bonus_action",
          description: "Nutze eine Bonusaktion, um Zauberpunkte in Zauberplätze umzuwandeln oder umgekehrt."
      });
  }
  
  // --- Level 3: Metamagie ---
  if (level >= 3) {
      const metamagicChoices = character.choices?.metamagic || [];
      
      // (Beispiele)
      if (metamagicChoices.includes('careful_spell')) {
          activeSkills.push({
              key: "metamagic_careful",
              name: "Metamagie: Behutsamer Zauber",
              type: "spell_modifier", 
              description: "Koste 1 Zauberpunkt. Wähle Kreaturen, die bei Rettungswürfen gegen deinen Zauber automatisch erfolgreich sind."
          });
      }
      if (metamagicChoices.includes('empowered_spell')) {
          activeSkills.push({
              key: "metamagic_empowered",
              name: "Metamagie: Verstärkter Zauber",
              type: "spell_modifier",
              description: "Koste 1 Zauberpunkt. Du kannst eine Anzahl von Schadenswürfeln (bis zu deinem CHA-Mod) neu würfeln."
          });
      }
      if (metamagicChoices.includes('quickened_spell')) {
           activeSkills.push({
              key: "metamagic_quickened",
              name: "Metamagie: Beschleunigter Zauber",
              type: "spell_modifier",
              description: "Koste 2 Zauberpunkte. Ändere die Zauberzeit von 1 Aktion zu 1 Bonusaktion."
          });
      }
      if (metamagicChoices.includes('twinned_spell')) {
           activeSkills.push({
              key: "metamagic_twinned",
              name: "Metamagie: Verdoppelter Zauber",
              type: "spell_modifier",
              description: "Kosten (Grad). Ziele auf eine zweite Kreatur mit einem Zauber, der nur eine trifft."
          });
      }
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (AKTIV) ---
  // =================================================================

  switch (subclassKey) {
      case 'draconic_bloodline':
          // Lvl 14: Drachenschwingen
          if (level >= 14) {
              activeSkills.push({
                  key: "draconic_wings",
                  name: "Drachenschwingen",
                  type: "bonus_action",
                  description: "Als Bonusaktion lässt du dir Schwingen wachsen (Flugbewegung). Sie halten unbegrenzt, bis du sie als Bonusaktion einklappst."
              });
          }
          break;

      case 'wild_magic':
          // Lvl 1: Gezeiten des Chaos
          if (level >= 1) {
              activeSkills.push({
                  key: "tides_of_chaos",
                  name: "Gezeiten des Chaos",
                  type: "reaction_modifier", // (Man nutzt es, *bevor* man würfelt)
                  description: "Erhalte Vorteil bei einem Angriffs-, Attributs- oder Rettungswurf. (1x pro langer Rast, oder bis Woge)",
                  uses: 1,
                  recharge: "long_rest_or_surge" // (Spezielles Aufladen)
              });
          }
          break;
          
      case 'divine_soul':
          // Lvl 6: Heilende Kraft
          if (level >= 6) {
              activeSkills.push({
                  key: "empowered_healing",
                  name: "Heilende Kraft",
                  type: "bonus_action", // (In 5e ist es "free action", BA passt besser)
                  description: "Koste 1 Zauberpunkt. Wenn du oder ein Verbündeter in 1,5m heilt, würfle Heilwürfel neu. (1x pro Runde)",
                  uses: 1, // (Begrenzung pro Runde, nicht pro Rast)
                  recharge: "round"
              });
          }
          // Lvl 14: Übernatürliche Erholung
          if (level >= 14) {
              activeSkills.push({
                  key: "angelic_wings",
                  name: "Übernatürliche Erholung",
                  type: "bonus_action",
                  description: "Als Bonusaktion lässt du dir geisterhafte Flügel wachsen (Flugbewegung). Sie halten, bis du kampfunfähig wirst oder sie einklappst."
              });
          }
          break;
  }


  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'spell_damage').
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Zauberers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const stats = calculateFinalStats(character); // (Engine sollte finale Stats bereitstellen)
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Level 6: Elementare Affinität (Drakonische Blutlinie) ---
    if (
        subclassKey === 'draconic_bloodline' &&
        stats.elementalAffinity &&
        eventType === 'spell_damage' && 
        data.spell.damageType === stats.elementalAffinity.type &&
        !data.isBonusDamageAdded 
    ) {
        return { 
            ...data, 
            bonusDamage: (data.bonusDamage || 0) + stats.elementalAffinity.bonus,
            isBonusDamageAdded: true 
        };
    }
    
    // =================================================================
    // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
    // =================================================================
    
    switch (subclassKey) {
        case 'wild_magic':
            // Lvl 1: Wilde Magie Woge
            if (
                level >= 1 &&
                eventType === 'cast_spell' &&
                data.spell.level >= 1 &&
                data.casterId === character.id
            ) {
                // Signalisiert der Engine, einen W20 zu würfeln.
                // Bei einer 1 (oder wenn Tides of Chaos genutzt wurde)
                // muss die Engine `triggerEffect: 'wild_magic_surge'` zurücksenden.
                return { ...data, requiresCheck: 'wild_magic_surge_check' };
            }
            
            // Lvl 6: Energie bändigen
            if (
                level >= 6 &&
                eventType === 'wild_magic_surge_roll' // (Neues Event von der Engine)
            ) {
                // Signalisieren, dass der Spieler seine Reaktion nutzen kann,
                // um 1d4 zum Wurf zu addieren oder zu subtrahieren
                return { ...data, canReact: 'bend_luck', reactDie: '1d4' };
            }
            break;
            
        case 'divine_soul':
            // Lvl 1: Von den Göttern bevorzugt
            if (
                level >= 1 &&
                (eventType === 'saving_throw' || eventType === 'attack_roll') &&
                data.result === 'fail' &&
                data.characterId === character.id &&
                !character.status?.hasUsedFavoredByTheGods // (1x pro kurzer Rast)
            ) {
                // Signalisiert der Engine, dass 2d4 addiert werden können
                return { 
                    ...data, 
                    canReact: 'favored_by_the_gods', 
                    reactDie: '2d4',
                    setStatus: 'hasUsedFavoredByTheGods'
                };
            }
            break;
    }


    // Keine Änderung am Ereignis
    return data;
}

/**
 * (NEU) Holt die spezifischen Zauber-Regeln für den Zauberer.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;
    
    let knownSpells = SORCERER_SPELLS_KNOWN[level];
    let spellList = ["sorcerer"]; // Standard-Zauberliste

    // --- Subklassen-Zauberlogik ---
    switch (subclassKey) {
        case 'divine_soul':
            // Lvl 1: Göttliche Magie
            // (Erhält Zugriff auf Kleriker-Zauberliste)
            spellList.push("cleric"); 
            
            // (Erhält einen zusätzlichen Kleriker-Zauber, basierend auf Gesinnung)
            // (Annahme: Gesinnung in character.choices.divineAlignment)
            // Die Engine muss diesen Zauber zur 'bekannten' Liste hinzufügen.
            knownSpells += 1; 
            break;
        
        // (Andere Subklassen könnten hier auch Zauber hinzufügen)
    }


    return {
        spellcastingType: "known", 
        spellList: spellList, // Kann jetzt ["sorcerer", "cleric"] sein
        spellcastingAttribute: "charisma",
        knownSpellsCount: knownSpells
    };
}


// =================================================================
// --- HILFSFUNKTIONEN (STUBS/KOPIEN) ---
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
 * (Helper) Ruft die finale Stat-Berechnung auf (lokal, falls nicht von der Engine bereitgestellt).
 * Dies ist ein Platzhalter. Idealerweise übergibt die Engine die finalen Stats
 * direkt an `handleGameEvent`.
 */
function calculateFinalStats(character) {
    // Diese Funktion ist ein STUB.
    const abilities = {
        charisma: character.abilities.cha + (getRacialAbilityBonus(character, "cha") || 0),
        dexterity: character.abilities.dex + (getRacialAbilityBonus(character, "dex") || 0),
    };
    const chaMod = calculateModifier(abilities.charisma);
    const level = character.level || 1;
    
    let stats = {
        elementalAffinity: null,
        favoredByTheGods: false
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
    
    if (character.subclassKey === 'divine_soul' && level >= 1) {
        stats.favoredByTheGods = true;
    }
    return stats;
}

/**
 * (Helper) Holt Rassenboni (lokal, falls nicht von der Engine bereitgestellt).
 */
function getRacialAbilityBonus(character, abilityKey) {
   // (Kopierter Stub)
   if (!character) return 0;
   let totalBonus = 0;
   if (character.ability_bonus_assignments && character.ability_bonus_assignments[abilityKey]) {
       totalBonus += character.ability_bonus_assignments[abilityKey];
   }
   return totalBonus;
}
