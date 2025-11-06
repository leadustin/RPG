// Diese Datei implementiert die spezifische Klassenlogik für den Barden
// und ALLE seine 6 Unterklassen.
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

/**
 * Tabelle für bekannte Zauber des Barden (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const BARD_SPELLS_KNOWN = [
    0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, // Level 1-10
    14, 15, 15, 16, 16, 18, 18, 19, 19, 22 // Level 11-20
];

/**
 * Wendet alle passiven Stat-Modifikatoren für den Barden an.
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
  
  // --- Level 1: Bardische Inspiration ---
  const bardicInspirationDie =
    level >= 15 ? 12 : level >= 10 ? 10 : level >= 5 ? 8 : 6;
  newStats.bardicInspiration = {
      die: `1d${bardicInspirationDie}`,
      uses: Math.max(1, chaMod), // Aufladungen = CHA-Mod (min 1)
      recharge: level >= 5 ? 'short_rest' : 'long_rest' // Ab Lvl 5: "Quelle der Inspiration"
  };

  // --- Level 2: Hansdampf in allen Gassen ---
  // Beschreibung: "Du kannst die Hälfte deines Übungsbonus zu jedem Attributswurf addieren, bei dem du nicht bereits geübt bist."
  if (level >= 2) {
      newStats.jackOfAllTrades = true;
      // Die `calculateSkillBonus`-Funktion in der Engine muss dies prüfen.
  }

  // --- Level 3: Expertise ---
  // Beschreibung: "Wähle zwei deiner Fertigkeiten, bei denen du geübt bist. Dein Übungsbonus verdoppelt sich..."
  if (level >= 3) {
    const expertiseChoices = character.choices?.expertise || [];
    newStats.expertiseSkills = (newStats.expertiseSkills || []).concat(expertiseChoices);
  }
  // --- Level 10: Expertise (erneut) ---
  if (level >= 10) {
    const expertiseChoices2 = character.choices?.expertise2 || [];
    newStats.expertiseSkills = (newStats.expertiseSkills || []).concat(expertiseChoices2);
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (PASSIV) ---
  // =================================================================

  if (!newStats.proficiencies) {
      newStats.proficiencies = { armor: [], weapons: [], skills: [] };
  }

  switch (subclassKey) {
      case 'college_of_valor':
          // Level 3: Bonus-Übungen (Kolleg des Mutes)
          // Beschreibung: "Du bist im Umgang mit mittlerer Rüstung, Schilden und Kriegswaffen geübt."
          if (level >= 3) {
              newStats.proficiencies.armor.push("medium", "shields");
              newStats.proficiencies.weapons.push("martial");
          }
          
          // Level 6: Zusätzlicher Angriff
          // Beschreibung: "Du kannst zweimal statt einmal angreifen..."
          if (level >= 6) {
              newStats.extraAttacks = (newStats.extraAttacks || 0) + 1;
          }
          break;
          
      case 'college_of_swords':
          // Level 3: Bonus-Übungen (Kolleg der Schwerter)
          // Beschreibung: "Du bist im Umgang mit mittlerer Rüstung und Krummsäbeln geübt."
          if (level >= 3) {
              newStats.proficiencies.armor.push("medium");
              newStats.proficiencies.weapons.push("scimitar");
              // Fügt "Klingenflourish" als Kampfstil-Option hinzu (wird von getActiveSkills genutzt)
              newStats.fightingStyle = "dueling"; // (Annahme: 5e-Regel, dass sie einen Kampfstil erhalten)
          }
          
          // Level 6: Zusätzlicher Angriff
          if (level >= 6) {
              newStats.extraAttacks = (newStats.extraAttacks || 0) + 1;
          }
          break;
          
      case 'college_of_eloquence':
          // Level 3: Silberne Zunge
          // Beschreibung: "Wenn du 9 oder niedriger auf einem Charisma-(Überzeugen) oder (Täuschen)-Wurf würfelst, behandelst du ihn als 10."
          if (level >= 3) {
              if (!newStats.skillMinimums) newStats.skillMinimums = {};
              newStats.skillMinimums.persuasion = 10;
              newStats.skillMinimums.deception = 10;
          }
          break;
          
      case 'college_of_lore':
          // Level 3: Zusätzliche Übungen
          // Beschreibung: "Du erhältst Übung in drei Fertigkeiten deiner Wahl."
          // (Dies wird bei der Charaktererstellung/Level-Up behandelt, nicht passiv)
          break;
          
      case 'college_of_glamour':
          // Level 3: Verlockende Präsenz
          // Beschreibung: "Du erhältst Vorteil auf Charisma-(Überzeugen)-Würfe gegen Kreaturen, die dich sehen können."
          // (Dies ist situationsabhängig und schwer in 'stats' abzubilden,
          // die Engine müsste dies beim Skill-Check prüfen)
          if (level >= 3) {
              newStats.situationalAdvantages = newStats.situationalAdvantages || [];
              newStats.situationalAdvantages.push({
                  skill: 'persuasion',
                  condition: 'target_can_see_you'
              });
          }
          break;
          
      case 'college_of_whispers':
          // (Die meisten Fähigkeiten sind aktiv oder reaktiv)
          break;
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Barden-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;
  
  // (Korrigierter Stub-Aufruf)
  const stats = calculateFinalStats(character); 

  // --- Level 1: Bardische Inspiration ---
  // Beschreibung: "Als Bonusaktion kannst du eine Kreatur inspirieren."
  if (level >= 1 && stats.bardicInspiration) {
    activeSkills.push({
      key: "bardic_inspiration",
      name: "Bardische Inspiration",
      type: "bonus_action",
      description: `Als Bonusaktion inspirierst du eine Kreatur. Sie erhält einen ${stats.bardicInspiration.die}, den sie zu einem Wurf addieren kann.`,
      uses: stats.bardicInspiration.uses,
      recharge: stats.bardicInspiration.recharge,
    });
  }
  
  // --- Level 2: Lied der Erholung ---
  if (level >= 2) {
      const die = level >= 17 ? 12 : level >= 13 ? 10 : level >= 9 ? 8 : 6;
      activeSkills.push({
          key: "song_of_rest",
          name: "Lied der Erholung",
          type: "passive", // (Wird bei kurzer Rast ausgelöst)
          description: `Wenn du oder Verbündete eine kurze Rast beenden und Trefferwürfel ausgeben, heilen sie 1d${die} zusätzlich.`
      });
  }

  // --- Level 6: Gegenbezauberung ---
  if (level >= 6) {
      activeSkills.push({
          key: "countercharm",
          name: "Gegenbezauberung",
          type: "action",
          description: "Als Aktion beginnst du eine Darbietung, die dir und Verbündeten in 9m Umkreis Vorteil bei Rettungswürfen gegen Bezauberung und Verängstigung gewährt."
      });
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (AKTIV) ---
  // =================================================================

  switch (subclassKey) {
      case 'college_of_lore':
          // Level 3: Schneidende Worte (Reaktion)
          if (level >= 3) {
              activeSkills.push({
                  key: "cutting_words",
                  name: "Schneidende Worte",
                  type: "reaction_modifier", // Signalisiert, dass dies als Reaktion genutzt wird
                  description: "Wenn eine Kreatur (nicht du) einen Angriffs-, Attributs- oder Schadenswurf macht, nutze deine Reaktion und einen Inspirationswürfel, um den Wurf zu verringern."
              });
          }
          break;

      case 'college_of_swords':
          // Level 3: Klingenflourish (Modifikator)
          if (level >= 3) {
              activeSkills.push(
                  {
                      key: "blade_flourish_defensive",
                      name: "Flourish: Verteidigung",
                      type: "attack_modifier",
                      description: "Nach einem Treffer: Nutze eine Inspiration, füge dem Schaden (Würfel) hinzu und erhöhe deine AC bis zu deinem nächsten Zug um den Würfelwurf."
                  },
                  {
                      key: "blade_flourish_slashing",
                      name: "Flourish: Hieb",
                      type: "attack_modifier",
                      description: "Nach einem Treffer: Nutze eine Inspiration, füge dem Schaden (Würfel) hinzu und treffe auch andere Kreaturen in 1,5m."
                  },
                  {
                      key: "blade_flourish_mobile",
                      name: "Flourish: Mobil",
                      type: "attack_modifier",
                      description: "Nach einem Treffer: Nutze eine Inspiration, füge dem Schaden (Würfel) hinzu und stoße das Ziel (plus Würfelwurf in m) weg."
                  }
              );
          }
          break;

      case 'college_of_glamour':
          // Level 3: Mantel der Inspiration
          if (level >= 3) {
              activeSkills.push({
                  key: "mantle_of_inspiration",
                  name: "Mantel der Inspiration",
                  type: "bonus_action",
                  description: "Als Bonusaktion (1 Inspiration) erhalten Verbündete temporäre TP und dürfen als Reaktion ihre volle Bewegung nutzen."
              });
          }
          // Level 6: Mantel der Majestät
          if (level >= 6) {
              activeSkills.push({
                  key: "mantle_of_majesty",
                  name: "Mantel der Majestät",
                  type: "bonus_action",
                  description: "Als Bonusaktion (1x pro Rast) den Zauber *Befehl* als Bonusaktion wirken, ohne einen Zauberplatz zu verbrauchen."
              });
          }
          break;

      case 'college_of_whispers':
          // Level 3: Psychische Klingen (Modifikator)
          if (level >= 3) {
              activeSkills.push({
                  key: "psychic_blades",
                  name: "Psychische Klingen",
                  type: "attack_modifier",
                  description: "Nach einem Treffer (1x pro Runde): Nutze eine Inspiration, um zusätzlichen psychischen Schaden zu verursachen (steigend mit Level)."
              });
          }
          // Level 3: Worte des Terrors
          if (level >= 3) {
              activeSkills.push({
                  key: "words_of_terror",
                  name: "Worte des Terrors",
                  type: "out_of_combat",
                  description: "Nachdem du 1 Min. mit jmd. sprichst, kannst du ihn verängstigen (WEI-Rettungswurf)."
              });
          }
          // Level 6: Mantel der Flüster
          if (level >= 6) {
              activeSkills.push({
                  key: "mantle_of_whispers",
                  name: "Mantel der Flüster",
                  type: "reaction",
                  description: "Als Reaktion (wenn ein Humanoide in 9m stirbt) seine Gestalt magisch annehmen."
              });
          }
          break;
          
      case 'college_of_eloquence':
          // Level 6: Verbindende Worte (im JSON) / Verunsichernde Worte (5e)
          // (Die Beschreibung im JSON "Schaden verringern" passt nicht zu 5e)
          // Wir implementieren 5e "Unsettling Words":
          if (level >= 3) { // (Lvl 3 in 5e)
              activeSkills.push({
                  key: "unsettling_words", 
                  name: "Verunsichernde Worte",
                  type: "bonus_action",
                  description: "Als Bonusaktion (1 Inspiration) einen Inspirationswürfel vom nächsten Rettungswurf einer Kreatur (innerhalb 1 Min) abziehen."
              });
          }
          break;
  }
  
  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'attack_roll', 'ability_check').
 * @param {object} data - Die Daten des Ereignisses (z.B. { target: 'enemy_1', value: 15 }).
 * @param {object} character - Das Charakterobjekt des Barden.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;
    const stats = calculateFinalStats(character); // Holt Barden-Stats

    // =================================================================
    // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
    // =================================================================
    
    // (Annahme: `character.resources.bardicInspiration` zählt die *aktuell verfügbaren* Aufladungen)
    const inspirationUses = character.resources?.bardicInspiration || stats.bardicInspiration.uses;

    switch (subclassKey) {
        case 'college_of_lore':
            // Level 3: Schneidende Worte (Reaktion)
            if (
                level >= 3 &&
                (eventType === 'attack_roll' || eventType === 'ability_check' || eventType === 'damage_roll') &&
                data.source !== character.id && // Darf nicht der Barde selbst sein
                inspirationUses > 0 
            ) {
                // Signalisieren, dass die Reaktion "Schneidende Worte" verfügbar ist.
                return { ...data, canReact: 'cutting_words', reactDie: stats.bardicInspiration.die };
            }
            break;

        case 'college_of_valor':
            // Level 3: Kampfinspiration (Modifiziert die Nutzung von Inspiration)
            if (
                level >= 3 &&
                eventType === 'inspiration_used' && // (Benötigt ein neues Event)
                data.source === character.id
            ) {
                // Signalisiert der Engine, dass der Verbündete diesen Würfel auch
                // für Waffenschaden oder AC (als Reaktion) nutzen darf.
                return { ...data, canUseFor: ['damage', 'ac_reaction'] };
            }
            break;
            
        case 'college_of_eloquence':
            // Level 3: Unfehlbare Inspiration
            if (
                level >= 3 &&
                eventType === 'inspiration_used' && // (Benötigt ein neues Event)
                data.source === character.id &&
                data.result === 'fail'
            ) {
                // Signalisiert der Engine, die Inspirations-Aufladung nicht zu verbrauchen
                return { ...data, refundResource: true };
            }
            
            // Level 6: Verbindende Worte (im JSON) / Unsettling Words (in 5e)
            // (Die JSON-Beschreibung "Schaden verringern" ist "Infallible Inspiration" in 5e)
            // Wir implementieren die JSON-Beschreibung "Schaden verringern":
            if (
                level >= 6 &&
                eventType === 'damage_taken' &&
                data.target !== character.id && // Ziel ist ein Verbündeter
                inspirationUses > 0
            ) {
                // Signalisieren, dass der Barde als Reaktion Schaden reduzieren kann
                return { ...data, canReact: 'inspiring_defense', reactDie: stats.bardicInspiration.die };
            }
            break;
            
        case 'college_of_whispers':
            // Level 3: Psychische Klingen
            if (
                level >= 3 &&
                eventType === 'attack_hit' &&
                data.attacker === character.id &&
                !character.status?.hasUsedPsychicBlades &&
                inspirationUses > 0
            ) {
                // (In 5e ist es optional, wir machen es automatisch für 1x pro Runde)
                const dice = level >= 15 ? '5d6' : level >= 10 ? '3d6' : '2d6';
                return {
                    ...data,
                    bonusDamage: (data.bonusDamage || "") + `+${dice}`,
                    bonusDamageCrit: (data.bonusDamageCrit || "") + `+${dice}`,
                    setStatus: 'hasUsedPsychicBlades',
                    consumeResource: 'bardicInspiration'
                };
            }
            break;
            
        case 'college_of_swords':
            // Level 3: Klingenflourish
             if (
                level >= 3 &&
                eventType === 'attack_hit' &&
                data.attacker === character.id &&
                data.attackType.includes('melee_weapon') &&
                inspirationUses > 0
            ) {
                // Signalisieren, dass der Spieler einen Flourish (als Reaktion/Bonus) wählen kann
                return { ...data, canReact: 'blade_flourish', reactDie: stats.bardicInspiration.die };
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Barden.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    let knownSpells = BARD_SPELLS_KNOWN[level];

    // Lvl 6: Zusätzliche Magische Geheimnisse (Kolleg des Wissens)
    if (level >= 6 && character.subclassKey === 'college_of_lore') {
        knownSpells += 2;
    }
    // Lvl 10: Magische Geheimnisse (Basis-Barde)
    if (level >= 10) {
        knownSpells += 2;
    }
    // Lvl 14: Magische Geheimnisse (Basis-Barde)
    if (level >= 14) {
        knownSpells += 2;
    }
    // Lvl 18: Magische Geheimnisse (Basis-Barde)
    if (level >= 18) {
        knownSpells += 2;
    }

    return {
        // "known": Barden wählen beim Stufenaufstieg eine feste Anzahl Zauber.
        spellcastingType: "known", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "bard", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "charisma",
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks).
        knownSpellsCount: knownSpells 
    };
}

// =================================================================
// --- NEUE HILFSFUNKTIONEN (STUBS) ---
// =================================================================

/**
 * (Helper-Stub) Ruft die finale Stat-Berechnung auf.
 * Dies ist ein Platzhalter. Idealerweise übergibt die Engine die finalen Stats
 * direkt an `getActiveSkills`.
 */
function calculateFinalStats(character) {
    // Diese Funktion ist ein STUB.
    const abilities = {
        charisma: character.abilities.cha + (getRacialAbilityBonus(character, "cha") || 0),
    };
    const chaMod = calculateModifier(abilities.charisma);
    const level = character.level || 1;
    
    const bardicInspirationDie =
      level >= 15 ? 12 : level >= 10 ? 10 : level >= 5 ? 8 : 6;
      
    return {
        charisma: abilities.charisma,
        bardicInspiration: {
            die: `1d${bardicInspirationDie}`,
            uses: Math.max(1, chaMod),
            recharge: level >= 5 ? 'short_rest' : 'long_rest'
        }
    };
}

/**
 * (Helper-Stub) Holt Rassenboni (lokal, falls nicht von der Engine bereitgestellt).
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
