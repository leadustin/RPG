// Diese Datei implementiert die spezifische Klassenlogik für den Hexenmeister
// und seine Unterklassen (Der Unhold, Der Große Alte, Die Erzfee).
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Paktmagie-Tabelle für den Hexenmeister.
 * Index 0 = Level 1, Index 1 = Level 2, ...
 * Das innere Array ist: [Anzahl Slots, Slot-Grad]
 */
const PACT_MAGIC_SLOTS = [
  // Lvl 1-20
  // Slots, Grad
  [1, 1], // Level 1
  [2, 1], // Level 2
  [2, 2], // Level 3
  [2, 2], // Level 4
  [2, 3], // Level 5
  [2, 3], // Level 6
  [2, 4], // Level 7
  [2, 4], // Level 8
  [2, 5], // Level 9
  [2, 5], // Level 10
  [3, 5], // Level 11
  [3, 5], // Level 12
  [3, 5], // Level 13
  [3, 5], // Level 14
  [3, 5], // Level 15
  [3, 5], // Level 16
  [4, 5], // Level 17
  [4, 5], // Level 18
  [4, 5], // Level 19
  [4, 5], // Level 20
];

/**
 * Tabelle für bekannte Zauber des Hexenmeisters (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const WARLOCK_SPELLS_KNOWN = [
    0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, // Level 1-10
    11, 11, 12, 12, 13, 13, 14, 14, 15, 15 // Level 11-20
];


/**
 * Wendet alle passiven Stat-Modifikatoren für den Hexenmeister an.
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

  // --- Paktmagie-Zauberplätze ---
  const [slotCount, slotLevel] = PACT_MAGIC_SLOTS[level - 1];
  newStats.pactMagic = {
      slots: slotCount,
      level: slotLevel,
      recharge: "short_rest"
  };
  
  // --- Level 11: Mystisches Arkanum ---
  newStats.mysticArcanum = [];
  if (level >= 11) newStats.mysticArcanum.push(6); // 1x Grad 6
  if (level >= 13) newStats.mysticArcanum.push(7); // 1x Grad 7
  if (level >= 15) newStats.mysticArcanum.push(8); // 1x Grad 8
  if (level >= 17) newStats.mysticArcanum.push(9); // 1x Grad 9
  
  // --- Level 2: Mystische Anrufungen (Invocations) ---
  // (Annahme: Wahlen sind in character.choices.invocations)
  const invocations = character.choices?.invocations || [];
  
  // Beispiel: Rüstung der Schatten
  if (invocations.includes('armor_of_shadows')) {
      // (Erlaube das Wirken von 'Magierrüstung' nach Belieben)
      // (Muss von der Zauber-Engine als "at-will" markiert werden)
      newStats.atWillSpells = (newStats.atWillSpells || []);
      newStats.atWillSpells.push('mage_armor');
  }
  // Beispiel: Teufelssicht
  if (invocations.includes('devils_sight')) {
      newStats.darkvisionRange = (newStats.darkvisionRange || 0) + 36; // (36m / 120ft)
      newStats.canSeeInMagicalDarkness = true;
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (PASSIV) ---
  // =================================================================
  
  switch (subclassKey) {
      case 'the_fiend':
          // Level 10: Unholdische Widerstandsfähigkeit
          if (level >= 10) {
              const resistanceChoice = character.choices?.fiendishResilience; 
              if (resistanceChoice) {
                  if (!newStats.resistances) newStats.resistances = [];
                  newStats.resistances.push(resistanceChoice);
              }
          }
          break;
          
      case 'the_great_old_one':
          // Lvl 1: Erwachter Geist
          if (level >= 1) {
              // (Muss von der Kommunikations-Engine implementiert werden)
              newStats.telepathyRange = 9; // (9m / 30ft)
          }
          
          // Lvl 10: Gedanken-Schutz
          if (level >= 10) {
              // (Gedanken können nicht gelesen werden)
              newStats.thoughtShield = true;
              // (Resistenz gegen psychischen Schaden)
              if (!newStats.resistances) newStats.resistances = [];
              newStats.resistances.push('psychic');
          }
          break;
          
      case 'the_archfey':
          // (Die meisten Fähigkeiten sind aktiv)
          break;
  }


  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Hexenmeister-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Mystische Anrufungen (Beispiele) ---
  const invocations = character.choices?.invocations || [];
  
  if (invocations.includes('agonizing_blast')) {
      activeSkills.push({
          key: "invocation_agonizing_blast",
          name: "Anrufung: Quälender Strahl",
          type: "passive_modifier", 
          description: "Füge deinen CHA-Modifikator zum Schaden von 'Eldritch Blast' hinzu."
      });
  }
  if (invocations.includes('repelling_blast')) {
       activeSkills.push({
          key: "invocation_repelling_blast",
          name: "Anrufung: Abstoßender Strahl",
          type: "passive_modifier", 
          description: "Wenn 'Eldritch Blast' trifft, stoße das Ziel 3m weg."
      });
  }
  
  // --- Level 20: Meister des Mystischen ---
  if (level >= 20) {
      activeSkills.push({
          key: "eldritch_master",
          name: "Meister des Mystischen",
          type: "action",
          description: "Als Aktion (1 Min) deine verbrauchten Paktmagie-Plätze beim Patron zurückfordern. (1x pro langer Rast)",
          uses: 1,
          recharge: "long_rest"
      });
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (AKTIV) ---
  // =================================================================

  switch (subclassKey) {
      case 'the_fiend':
          // Level 6: Gunst des Dunklen
          if (level >= 6) {
              activeSkills.push({
                  key: "dark_ones_own_luck",
                  name: "Gunst des Dunklen",
                  type: "reaction_modifier", 
                  description: "Addiere einen W10 zu einem Attributs- oder Rettungswurf, bei dem du versagt hast.",
                  uses: 1,
                  recharge: "short_rest"
              });
          }
          break;
          
      case 'the_great_old_one':
          // Lvl 6: Entropischer Schutz
          if (level >= 6) {
              activeSkills.push({
                  key: "entropic_ward",
                  name: "Entropischer Schutz",
                  type: "reaction",
                  description: "Als Reaktion (wenn angegriffen): Verpasse dem Angreifer Nachteil. Wenn er verfehlt, hast du Vorteil gegen ihn bis zum Ende deines nächsten Zuges.",
                  uses: 1,
                  recharge: "short_rest"
              });
          }
          
          // Lvl 14: Vasall erschaffen
          if (level >= 14) {
              activeSkills.push({
                  key: "create_thrall",
                  name: "Vasall erschaffen",
                  type: "action",
                  description: "Als Aktion (1 Min) einen kampfunfähigen Humanoiden berühren, um ihn permanent zu bezaubern (Vasall)."
              });
          }
          break;
          
      case 'the_archfey':
          // Lvl 1: Feenhafte Gegenwart
          if (level >= 1) {
              activeSkills.push({
                  key: "fey_presence",
                  name: "Feenhafte Gegenwart",
                  type: "action",
                  description: "Als Aktion: Jede Kreatur in einem 3m-Würfel um dich muss einen WEI-Rettungswurf bestehen oder wird bis zum Ende deines nächsten Zuges bezaubert ODER verängstigt (deine Wahl).",
                  uses: 1,
                  recharge: "short_rest"
              });
          }
          
          // Lvl 6: Nebliger Entkommer
          if (level >= 6) {
              activeSkills.push({
                  key: "misty_escape",
                  name: "Nebliger Entkommer",
                  type: "reaction",
                  description: "Als Reaktion (wenn du Schaden erleidest): Werde unsichtbar und teleportiere dich bis zu 18m weit. Hält bis du angreifst oder zauberst.",
                  uses: 1,
                  recharge: "short_rest"
              });
          }
          
          // Lvl 10: Irreführende Verteidigung
          // (Passiv/Reaktiv, siehe handleGameEvent)
          
          // Lvl 14: Dunkler Rauschzauber
          if (level >= 14) {
              activeSkills.push({
                  key: "dark_delirium",
                  name: "Dunkler Rauschzauber",
                  type: "action",
                  description: "Als Aktion: Wähle eine Kreatur (18m). Sie muss einen WEI-Rettungswurf bestehen oder ist 1 Min. lang bezaubert/verängstigt (Illusion).",
                  uses: 1,
                  recharge: "short_rest"
              });
          }
          break;
  }


  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'kill_enemy').
 * @param {object} data - Die Daten des Ereignisses (z.B. { target: 'goblin' }).
 * @param {object} character - Das Charakterobjekt des Hexenmeisters.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Pakt-Anrufungen (Beispiele) ---
    const invocations = character.choices?.invocations || [];
    
    // Anrufung: Quälender Strahl (Agonizing Blast)
    if (
        invocations.includes('agonizing_blast') &&
        eventType === 'spell_damage' &&
        data.spell.key === 'eldritch_blast' && // (Annahme: Zauber hat einen 'key')
        !data.isAgonizingBlastAdded // Verhindert doppelte Anwendung
    ) {
        const chaMod = calculateModifier(character.abilities.charisma); // (Sollte finalStats nutzen)
        return {
            ...data,
            // Addiere CHA-Mod zu jedem Strahl (Engine muss dies pro Strahl handhaben)
            bonusDamagePerBeam: (data.bonusDamagePerBeam || 0) + Math.max(1, chaMod),
            isAgonizingBlastAdded: true
        };
    }
    
    // Anrufung: Abstoßender Strahl (Repelling Blast)
    if (
        invocations.includes('repelling_blast') &&
        eventType === 'spell_hit' &&
        data.spell.key === 'eldritch_blast'
    ) {
        // Signalisiert der Engine, das Ziel 3m (10ft) zurückzustoßen
        return { ...data, pushTarget: 3 };
    }


    // =================================================================
    // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
    // =================================================================
    
    switch (subclassKey) {
        case 'the_fiend':
            // Level 1: Segen des Dunklen
            if (
                level >= 1 &&
                eventType === 'kill_enemy' && 
                data.killer === character.id
            ) {
                const chaMod = calculateModifier(character.abilities.charisma); 
                const tempHp = Math.max(1, chaMod + level);
                
                return { ...data, grantTempHp: tempHp, target: character.id };
            }
            
            // Lvl 14: Durch die Hölle schleudern
            if (
                level >= 14 &&
                eventType === 'attack_hit' &&
                data.attacker === character.id &&
                !character.status?.hasUsedHurlThroughHell // (1x pro langer Rast)
            ) {
                // Signalisiert der Engine, das Ziel temporär zu verbannen
                // und 10d10 psychischen Schaden zuzufügen
                return {
                    ...data,
                    canReact: 'hurl_through_hell', // (Als optionale Reaktion)
                    setStatus: 'hasUsedHurlThroughHell'
                };
            }
            break;
            
        case 'the_great_old_one':
            // Lvl 6: Entropischer Schutz (Reaktion)
             if (
                level >= 6 &&
                eventType === 'damage_taken' && // (Oder 'before_attack_roll' gegen den Hexenmeister)
                data.sourceType === 'attack' &&
                !character.status?.hasUsedEntropicWard // (1x pro kurzer Rast)
            ) {
                // Signalisiert, dass die Reaktion "Entropic Ward" verfügbar ist
                return { 
                    ...data, 
                    canReact: 'entropic_ward', 
                    setStatus: 'hasUsedEntropicWard' 
                };
            }
            break;
            
        case 'the_archfey':
            // Lvl 10: Irreführende Verteidigung
            if (
                level >= 10 &&
                eventType === 'damage_taken' &&
                data.target === character.id &&
                !character.status?.hasUsedBeguilingDefense // (1x pro kurzer Rast)
            ) {
                // Signalisiert, dass die Reaktion verfügbar ist
                return { 
                    ...data, 
                    canReact: 'beguiling_defense', 
                    setStatus: 'hasUsedBeguilingDefense' 
                };
                // (Engine muss dann den Schaden negieren und den Angreifer bezaubern)
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Hexenmeister.
 * @param {object} character - Das Charakterobjekt.
 *_@param {object} stats - Die finalen Stats des Charakters (enthält `pactMagic` und `mysticArcanum`).
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    let knownSpells = WARLOCK_SPELLS_KNOWN[level];
    let spellList = ["warlock"];
    
    // --- Subklassen-Zauberlisten ---
    // (Einige Schutzpatrone fügen Zauber zur *Auswahl* hinzu,
    // sie werden aber NICHT automatisch gelernt wie bei Klerikern)
    
    // Die Engine muss `stats.pactMagic` und `stats.mysticArcanum`
    // (berechnet in applyPassiveStatModifiers) verwenden,
    // um die Zauberplätze zu bestimmen.

    return {
        spellcastingType: "pact", 
        spellList: spellList, 
        spellcastingAttribute: "charisma",
        knownSpellsCount: knownSpells,
        
        // (Die Engine liest diese direkt aus den `stats`)
        // pactMagic: stats.pactMagic,
        // mysticArcanum: stats.mysticArcanum
    };
}
