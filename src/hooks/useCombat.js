// src/hooks/useCombat.js
// TODO: Logik für Objekt-Interaktionen implementieren
//       - Neue Action-Typen: 'INTERACT' (für Türen, Truhen)
//       - Prüfung: Ist Tür verschlossen? Schlüssel vorhanden?
// TODO: Erweitertes Beschwörungs-System (Summons)
//       - Bessere Kontrolle für beschworene Einheiten (z.B. Magierhand)
//       - Beschwörungen sollten eigene Züge oder Befehle haben
//       - 'REDUCE_SPEED': Bewegungsrate temporär senken (Ray of Frost)
//       - 'NO_HP_REGEN': TP-Regeneration blockieren (Chill Touch)
//       - 'NO_OPPORTUNITY_ATTACKS': Verhindert automatische Angriffe bei Bewegung (Shocking Grasp)
// TODO: Logik für Objekt-Interaktionen & Fallen implementieren
//       - Neue Action-Typen: 'INTERACT' (für Türen, Truhen)
//       - Trigger-System: Beim Betreten eines Feldes prüfen, ob ein Effekt auslöst (z.B. Zauber 'Alarm', 'Glyphe', Bärenfalle)
//       - "Passive Wahrnehmung" gegen den SG der Falle/des Alarms prüfen
// TODO: Geometrie für Kegel (Cones) und Linien (Lines) implementieren
//       - 'handleCombatTileClick' muss Richtung erkennen (Mausposition relativ zum Caster)
//       - Berechnung der betroffenen Tiles für Kegel (z.B. Burning Hands) und Linien (z.B. Lightning Bolt)
// TODO: Condition 'CHARMED' implementieren
//       - Effekt: Ziel kann den Bezauberer nicht angreifen.
//       - Effekt: Bezauberer hat Vorteil bei sozialen Interaktionen mit dem Ziel.
//       - Auto-Break: Zustand muss enden, wenn das Ziel Schaden vom Bezauberer erleidet.
// TODO: Erweiterte Zauber-Logik (Chromatic Orb, Chaos Bolt)
//       - UI für Schadensart-Auswahl beim Wirken ('variable' auflösen)
//       - "Leaping"-Mechanik: Würfelergebnisse auf Doubles prüfen und ggf. 'chain_target' auslösen.
// TODO: Condition-Logik erweitern (Expeditious Retreat)
//       - Beim Anwenden des Status 'EXPEDITIOUS_RETREAT': Sofort movementLeft erhöhen (Dash).
//       - In 'startTurn': Prüfen, ob Status aktiv ist -> 'Dash' Button für Bonusaktion freischalten.
// TODO: Temporäre Trefferpunkte (Temp HP) implementieren
//       - Eigenes Feld 'tempHp' im Combatant-Objekt.
//       - Bei Schaden: Erst tempHp abziehen, dann hp.
//       - Bei 'HEALING' mit type 'temp_hp': tempHp setzen (nicht addieren, nicht stapelbar!).
// TODO: Reaktions-System implementieren
//       - Ressource 'hasReaction' (1x pro Runde) tracken.
//       - Trigger-Logik: Wenn ein Event (z.B. 'FALL_DAMAGE_EVENT', 'ATTACKED_EVENT') eintritt,
//         prüfen, ob der Spieler eine passende Reaktion (Zauber/Fähigkeit) hat und UI-Prompt zeigen.
// TODO: Vertrauten-Mechanik erweitern
//       - 'Touch Delivery': Wenn ein Vertrauter in Reichweite ist, erlaube dem Spieler,
//         Zauber mit Reichweite 'Berührung' von der Position des Vertrauten aus zu wirken.
//       - 'Shared Senses': Fog of War für den Spieler basierend auf der Position des Vertrauten aufdecken.
// TODO: Bewegungs-Modifikatoren implementieren
//       - In 'calculateMoveTiles': Prüfen auf Conditions 'INCREASE_SPEED' (+3m) und 'REDUCE_SPEED' (-3m).
//       - Für 'JUMP_ENHANCED': Erlaubt das Ignorieren von Hindernissen/Schwierigem Gelände für X Felder?
// TODO: Rüstungs-Berechnung erweitern (Mage Armor)
//       - In 'calculateAC': Prüfen auf Condition 'MAGE_ARMOR'.
//       - Falls aktiv & keine Rüstung getragen: Base AC = 13 + DexMod.

// TODO: Projektil-System für Zauber (Magic Missile, Scorching Ray)
//       - Ermöglichen, dass ein Ziel mehrfach in der 'targets'-Liste vorkommt (z.B. 3x für 3 Geschosse).
//       - UI: Klicks auf dasselbe Ziel erhöhen einen Zähler statt es abzuwählen.
// TODO: Kampf-Modifikatoren implementieren
//       - 'SHIELD_SPELL': In 'calculateAC' temporär +5 addieren.
//       - 'PROTECTION_FROM_TYPES': Wenn Angreifer-Typ (z.B. Undead) matcht -> Nachteil (Disadvantage) auf Angriffswurf erzwingen.
// TODO: Mehrstufige Zustände (Progressive Conditions)
//       - Logik für 'Sleep (2024)':
//         1. Runde: Zustand 'Incapacitated' (Handlungsunfähig).
//         2. Am Ende des Zuges: Automatischer Save.
//         3. Bei Misserfolg: Upgrade zu 'Unconscious' (Bewusstlos).
// TODO: Komplexe Condition-Logik (Tasha's Laughter)
//       - Zustand 'HIDEOUS_LAUGHTER' muss 'PRONE' und 'INCAPACITATED' implizieren.
//       - Bei Schaden ('takeDamage'): Prüfen, ob Ziel 'HIDEOUS_LAUGHTER' hat -> Sofortiger Save mit Vorteil (2 Würfel, nimm höheren).

// TODO: Begleiter-Verhalten (Floating Disk)
//       - Logik für 'Follow': Wenn Caster sich bewegt, prüfen ob Summon > 6m entfernt ist -> automatisch nachziehen?
// TODO: Geometrie für Würfel (Cube) implementieren (Thunderwave)
//       - 'handleCombatTileClick': Berechnung für 'shape: CUBE' (origin: SELF).
//       - Meist die 3x3 Felder vor dem Spieler (abhängig von Blickrichtung?) oder Spieler im Zentrum/Ecke.

// TODO: Erzwungene Bewegung (Forced Movement / Push)
//       - Neuer Effekt-Typ 'PUSH' in 'performAction'.
//       - Berechnet Vektor von Attacker zu Target und bewegt Target X Felder weiter weg.
//       - Kollisionsprüfung: Stoppt an Wänden/anderen Kreaturen.
// TODO: Schaden bei Fehlschlag (Damage on Miss)
//       - Support für 'on_miss': 'half' in der Schadensberechnung von 'performAction'.
//       - Aktuell wird bei 'attack_roll' < AC oft gar nichts gemacht.

// TODO: Schaden über Zeit (DoT / Delayed Damage)
//       - Condition-Logik 'ACID_BURN': Muss in 'endTurn' Schaden auslösen.
//       - Skalierung von Conditions: Wenn Melfs Acid Arrow mit höherem Slot gewirkt wird,
//         muss auch der Schaden im Condition-Effekt (2d4) skalieren. Das ist komplex!
// TODO: Zauber-Optionen (Modal Dialog)
//       - Beim Wirken von Zaubern wie 'Alter Self', 'Enhance Ability' oder 'Hex' 
//         muss ein UI-Dialog aufgehen, um die Sub-Option zu wählen.

// TODO: Temporäre Angriffe/Waffen durch Conditions
//       - Wenn Condition 'ALTER_SELF' aktiv ist -> Füge temporäre Aktion "Klauenangriff (1W6)" zum Inventar hinzu.
//       - Angriff muss 'spellcasting ability' statt STR/DEX nutzen.
// TODO: Kampf-Zustände (Conditions) implementieren
//       - 'BLINDED': Nachteil auf eigene Angriffe, Vorteil für Angreifer. Keine Sichtradius (Fog of War?).
//       - 'BLUR': Nachteil für Angreifer (Disadvantage).
//       - 'repeat_end_of_turn': Logik am Ende von 'nextTurn' hinzufügen, um Rettungswürfe für Conditions automatisch zu würfeln.
// TODO: Gefährliche Zonen (Hazard Zones) implementieren
//       - Prüfen, ob ein Token (z.B. 'Cloud of Daggers') das Feld eines anderen Tokens betritt.
//       - Prüfen, ob ein Combatant seinen Zug auf einem Hazard-Feld beendet.
//       - Schaden aus dem verknüpften Effekt anwenden.
// TODO: Erhaltungs-Kosten für Konzentration (Crown of Madness, Witch Bolt)
//       - 'startTurn': Prüfen, ob Caster einen Zauber aktiv hat, der eine Aktion pro Runde fordert.
//       - UI-Prompt: "Aktion nutzen um [Zauber] zu halten?" -> Ja (Aktion verbraucht) / Nein (Zauber endet).
// TODO: Sicht-System (Darkvision)
//       - Globaler Licht-Level (Hell/Dämmrig/Dunkel).
//       - Combatant-Property 'senses.darkvision': Wenn > 0, ignoriert Malus durch Dunkelheit bis zur Reichweite.
//       - Zauber 'Darkvision' setzt diesen Wert temporär auf 45 (Meter).

// TODO: Skill-Checks im Kampf (Detect Thoughts)
//       - Ermöglichen, dass Aktionen (wie 'Gedanken abschütteln') einen Skill-Check (Arcana) gegen einen DC würfeln.
//       - Aktuell unterstützt 'saving_throw' nur Attribute (STR, DEX...), keine Skills.
// TODO: Größenänderung von Tokens (Enlarge/Reduce)
//       - Visualisierung: CSS 'transform: scale(X)' oder Grid-Größe (1x1 -> 2x2) ändern.
//       - Logik: 'rollDiceFormula' muss Bonus/Malus (+1d4 / -1d4) auf Waffenschaden anwenden, wenn Condition aktiv ist.

// TODO: Kollisions-Schaden für Summons (Flaming Sphere, Moonbeam)
//       - Wenn ein Summon-Token (controlledBy player) auf ein Gegner-Feld gezogen wird:
//         -> Sofortigen Effekt auslösen (hier: GE-RW gegen 2W6 Feuer).
//         -> Bewegung des Summons stoppen.
// TODO: Richtungsabhängige Bewegungskosten (Gust of Wind)
//       - In 'calculateMoveTiles': Wenn Bewegung in Richtung eines 'Wind'-Tokens (bzw. dessen Origin) geht,
//         kosten die Felder doppelt.
//       - Benötigt Vektor-Berechnung (Bewegungsrichtung vs. Windrichtung).

// TODO: Rotierbare Effekte (Gust of Wind, Burning Hands nach Cast?)
//       - UI: Ermöglichen, die Ausrichtung eines AREA-Effekts oder Summons nachträglich zu ändern.
// TODO: Zustand 'PARALYZED' (Gelähmt)
//       - Target kann keine Aktionen/Bewegung ausführen.
//       - Angriffe gegen Target haben Vorteil.
//       - Treffer in Nahkampfreichweite werden automatisch zu Crits (Schaden verdoppeln).

// TODO: Zustand 'INVISIBLE' (Unsichtbar)
//       - Vorteil auf eigene Angriffe, Nachteil auf Angriffe gegen dich.
//       - 'break_on_action': Logik implementieren, die den Status entfernt, wenn 'performAction' ausgeführt wird (Attacke/Zauber).
// TODO: Interaktions-Effekte (Knock)
//       - Neuer Effekt 'INTERACT': Muss prüfen, ob das Ziel-Tile ein interaktives Objekt (Tür/Truhe) ist und dessen Zustand auf 'unlocked' setzen.

// TODO: Höhen-System / Vertikalität (Levitate, Fly)
//       - Combatant Property 'altitude' einführen (Standard: 0).
//       - Nahkampf-Check: Wenn |Attacker.alt - Target.alt| > Weapon.reach -> Angriff unmöglich.
//       - 'LEVITATED' setzt speed auf 0 (außer es gibt Wände/Decken in der Nähe).
// TODO: Such-Mechanik (Locate Object / Creature)
//       - UI-Element: Kompass-Nadel oder Pfeil am Rand des Bildschirms,
//         der Richtung zum Ziel (falls auf Map vorhanden) anzeigt.

// TODO: Trigger-System für Summons (Magic Mouth, Glyph of Warding)
//       - Summons benötigen ein 'triggerCondition'-Feld.
//       - 'checkTriggers()': Wird bei jeder Bewegung/Aktion aufgerufen und prüft Bedingungen
//         (z.B. "Any creature within 30 feet").
// TODO: Waffen-Buffs (Magic Weapon)
//       - Condition 'MAGIC_WEAPON_BUFF': Muss in 'performAction' erkannt werden und auf 'attackBonus' und 'damage.bonus' der Waffe addiert werden.

// TODO: Abfang-Logik bei Treffern (Mirror Image)
//       - In 'performAction' (wenn Ziel getroffen wurde): Prüfen auf Condition 'MIRROR_IMAGE'.
//       - Würfeln (1d6 pro Stack). Bei 3+: Schaden auf 0 setzen, Condition-Stack um 1 reduzieren, Log-Eintrag "Duplikat zerstört".
// TODO: Teleportations-Mechanik (Misty Step, Dimension Door)
//       - Neuer Effekt-Typ 'TELEPORT'.
//       - In 'performAction': Setze c.x und c.y des Casters auf targetCoords.x/y.
//       - Validierung: Prüfen, ob Zielfeld 'unoccupied' ist (kein anderer Combatant).
// TODO: Schadens-Modifikatoren (Debuffs)
//       - Condition 'ENFEEBLED': In 'performAction' (wenn das Ziel angreift),
//         einen zusätzlichen 'damageModifier' (-1d8) auf die Schadensformel anwenden.
//       - Condition 'PHANTASMAL_FORCE': Logik für "Private Summons" (Nur Token X sieht Token Y)?
// TODO: Extradimensionale Räume (Rope Trick, Demiplane)
//       - Mechanik: Wenn Spieler auf das 'Rope Trick' Token klickt (Interact) ->
//         Token des Spielers vom Grid entfernen ("verstecken") aber in der Combat-Liste behalten.
//       - UI: Anzeige "Im Seiltrick" neben dem Portrait.
// TODO: Bedingte Vorteile/Nachteile (Shatter, Protection from Evil)
//       - In 'performAction' (bei saving_throw): Prüfen auf 'disadvantage_if'.
//       - Wenn 'target.type' (z.B. 'construct') mit der Bedingung übereinstimmt -> 2x würfeln, niedrigeren nehmen.
// TODO: Bewegungsarten (Movement Modes)
//       - 'SPIDER_CLIMB': Erlaubt Bewegung auf 'Wall'-Tiles oder über Hindernisse hinweg.
//       - 'CLIMB_SPEED': Ignoriert die extra Bewegungskosten für Klettern (falls implementiert).

// TODO: Automatische Abbruchbedingungen für Conditions
//       - 'SUGGESTION_CHARM', 'CHARM_PERSON': Wenn der Caster (attackerId) Schaden am Ziel (targetId) verursacht
//         -> Condition sofort entfernen.
// TODO: Zerstörbare Umgebung / Interaktive Felder (Web)
//       - Wenn 'Web'-Token Feuerschaden nimmt -> Entfernen + Schaden an alle auf diesem Feld.
//       - 'RESTRAINED' beenden: Neue Aktion "Befreien" (Stärke-Check) für betroffene Kreaturen.

// TODO: Gruppen-Kontrolle für Summons (Animate Dead)
//       - UI für "Alle Summons befehligen" (Bonusaktion des Spielers bewegt alle Untoten).
//       - Skalierung: 'ADD_SUMMON_COUNT' implementieren, um bei Grad 4+ mehrere Tokens zu spawnen.
// TODO: End-of-Turn Effekte (Blink, Curse)
//       - In 'endTurn' prüfen: Hat CurrentCombatant Condition 'BLINK_ACTIVE'?
//       - Würfeln (1d6). Bei 4-6: Token aus 'combatants' temporär ausblenden (Status 'ETHEREAL').
//       - Bei 'startTurn': Wenn Status 'ETHEREAL' -> Token wieder einblenden und Teleport-UI (3m Radius) öffnen.

// TODO: Variable Konzentrations-Regeln (Bestow Curse)
//       - Wenn Spell Slot Level >= 5: Flag 'requires_concentration' beim Casten ignorieren.
// TODO: Counterspell-Logik (PHB 2024)
//       - Neuer Effekt 'COUNTERSPELL': Löst beim Ziel einen KO-Save aus.
//       - Wenn Save misslingt: Die 'casting'-Aktion des Ziels abbrechen.
//       - Wichtig: Das Ressourcen-Management ('expendSpellSlot') darf in diesem Fall NICHT aufgerufen werden.

// TODO: Sensor-Umschaltung (Clairvoyance)
//       - UI-Button bei aktivem Sensor-Summon: "Switch Sense" (Sehen <-> Hören).
// TODO: Dispel-Mechanik (Dispel Magic)
//       - 'DISPEL'-Effekt: Durchsuche 'activeConditions' des Ziels.
//       - Vergleiche 'condition.spellLevel' mit 'castLevel'.
//       - Automatisch entfernen oder Ability Check (d20 + spellMod) würfeln.

// TODO: Entwaffnung / Item-Drop (Fear, Heat Metal)
//       - Effekt 'FORCE_DROP_ITEMS':
//         1. Prüfen, was das Ziel in der Hand hält (Waffe/Schild/Item).
//         2. Item aus 'equipped' entfernen und als Loot-Token auf das Feld (x,y) legen.
// TODO: Resistenz-System erweitern (Feign Death, Stoneskin)
//       - 'FEIGN_DEATH': damageModifier = 0.5 für alle Typen AUSSER 'psychic'.
//       - 'STONESKIN': damageModifier = 0.5 für 'bludgeoning', 'piercing', 'slashing' (non-magical).
//       - Dies muss in 'performAction' VOR der HP-Abzug-Berechnung passieren.
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier, calculateSpellAttackBonus, calculateSpellSaveDC, getProficiencyBonus } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

// --- HELPER FUNCTIONS ---
const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

const normalizeDice = (diceString) => {
    if (!diceString) return "1d4";
    return diceString.replace(/W/gi, 'd').replace(/\s/g, ''); 
};

const extractDamageValue = (rollResult) => {
    if (typeof rollResult === 'number') return rollResult;
    if (rollResult && typeof rollResult === 'object') {
        if (rollResult.total !== undefined) return rollResult.total;
        if (rollResult.value !== undefined) return rollResult.value;
        if (rollResult.result !== undefined) return rollResult.result;
        if (rollResult.sum !== undefined) return rollResult.sum;
    }
    return 1; 
};

const calculateMoveTiles = (speedString) => {
    if (!speedString) return 6; 
    const meters = parseInt(speedString);
    if (isNaN(meters)) return 6;
    return Math.floor(meters / 1.5);
};

const getCantripDice = (level, scaling) => {
    if (!scaling || !scaling.dice_at_levels) return null;
    const levels = Object.keys(scaling.dice_at_levels).map(Number).sort((a, b) => b - a);
    for (const l of levels) {
        if (level >= l) return scaling.dice_at_levels[l];
    }
    return scaling.dice_at_levels["1"]; 
};

const calculateWeaponRange = (action) => {
    if (!action) return 1; 
    if (action.range_m) return Math.floor(action.range_m / 1.5);

    const source = action.item || action;
    const props = source.properties || [];
    if (props.includes("Reichweite")) return 2; 

    if (source.range) {
        if (typeof source.range === 'string' && source.range.toLowerCase().includes('berührung')) return 1;
        const rangeMeters = parseInt(source.range.split('/')[0]);
        if (!isNaN(rangeMeters)) return Math.floor(rangeMeters / 1.5);
    }
    if (action.reach) {
        const reachVal = parseFloat(action.reach.replace(',', '.'));
        if (!isNaN(reachVal)) return Math.max(1, Math.floor(reachVal / 1.5));
    }
    return 1; 
};

const damageTypeMap = {
    acid: "Säure", bludgeoning: "Wucht", cold: "Kälte", fire: "Feuer", force: "Energie",
    lightning: "Blitz", necrotic: "Nekrotisch", piercing: "Stich", poison: "Gift",
    psychic: "Psychisch", radiant: "Gleißend", slashing: "Hieb", thunder: "Donner", healing: "Heilung"
};

// --- HOOK ---

export const useCombat = (playerCharacter) => {
  const initialState = {
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
    result: null
  };

  const [combatState, setCombatState] = useState(initialState);
  const [selectedAction, setSelectedAction] = useState(null);
  const stateRef = useRef(combatState);
  const processingTurn = useRef(false); 

  useEffect(() => { stateRef.current = combatState; }, [combatState]);

  // --- START COMBAT ---
  const startCombat = useCallback((enemies) => {
    if (!playerCharacter) return;
    const stats = playerCharacter.stats || {};
    const startHp = (typeof stats.hp === 'number') ? stats.hp : (playerCharacter.hp || 20);
    const maxHp = stats.maxHp || playerCharacter.maxHp || 20;
    const playerInit = d(20) + getAbilityModifier(stats.abilities?.dex || 10);

    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: startHp, maxHp: maxHp, ac: stats.armor_class || 12,
      initiative: playerInit, x: 2, y: 4, speed: 6, color: 'blue', icon: playerCharacter.icon
    };

    const enemyCombatants = enemies.map((e, i) => {
        let hpValue = 10;
        if (typeof e.hp === 'number') hpValue = e.hp;
        else if (e.hp && (e.hp.average || e.hp.max)) hpValue = e.hp.average || e.hp.max;
        const dex = e.stats?.dex || 10;
        return {
            ...e, id: e.instanceId || `enemy_${i}_${Date.now()}`,
            type: 'enemy', name: e.name || `Gegner ${i+1}`,
            initiative: d(20) + getAbilityModifier(dex),
            hp: hpValue, maxHp: hpValue, speed: e.speed || "9m", 
            color: 'red', x: 9, y: 3 + i
        };
    });

    const allCombatants = [playerCombatant, ...enemyCombatants].sort((a, b) => b.initiative - a.initiative);
    setCombatState({
      isActive: true, round: 1, turnIndex: 0, combatants: allCombatants,
      log: [`Kampf gestartet! ${allCombatants[0].name} beginnt.`],
      turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
      result: null
    });
    setSelectedAction(null);
    processingTurn.current = false;
  }, [playerCharacter]);

  // --- END COMBAT ---
  const endCombatSession = useCallback(() => {
      setCombatState(initialState);
      setSelectedAction(null);
      processingTurn.current = false;
  }, []);

  // --- PERFORM ACTION (MIT SUMMON SUPPORT) ---
  const performAction = useCallback((attackerId, targetIdsInput, action, targetCoords = null) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const targetIds = Array.isArray(targetIdsInput) ? targetIdsInput : [targetIdsInput];
      
      // Ziele filtern (nur existierende)
      const targets = prev.combatants.filter(c => targetIds.includes(c.id));
      
      // Abbruch nur, wenn es KEINE Ziele UND KEINE Beschwörung ist
      const isSummon = action.effects?.some(e => e.type === 'SUMMON');
      if (!attacker || (!isSummon && targets.length === 0)) return prev;

      let logEntries = [];
      const hpChanges = {};
      const newCombatantsToAdd = []; // Liste für neue Beschwörungen

      console.log(`⚡ ACTION: ${attacker.name} uses ${action.name}`);

      // ---------------------------------------------------------
      // FALL A: ZAUBER
      // ---------------------------------------------------------
      if (action.effects && action.effects.length > 0) {
          action.effects.forEach(effect => {
              
              // 1. BESCHWÖRUNG (SUMMON)
              if (effect.type === 'SUMMON' && targetCoords) {
                  // Erstelle neues Entity
                  const entity = effect.entity;
                  const newId = `summon_${Date.now()}_${Math.floor(Math.random()*1000)}`;
                  
                  newCombatantsToAdd.push({
                      id: newId,
                      name: entity.name || "Beschwörung",
                      type: entity.type || 'ally', // 'ally' (grün) oder 'enemy' (rot)
                      hp: entity.hp || 10,
                      maxHp: entity.maxHp || 10,
                      ac: entity.ac || 10,
                      speed: entity.speed || 6,
                      x: targetCoords.x,
                      y: targetCoords.y,
                      icon: entity.icon || 'src/assets/react.svg',
                      controlledBy: attacker.id, // Referenz wer es beschworen hat
                      actions: entity.actions || [], // Hat es eigene Angriffe?
                      initiative: attacker.initiative - 0.1 // Zieht direkt nach dem Beschwörer
                  });

                  logEntries.push(`✨ ${attacker.name} beschwört ${entity.name} an Position (${targetCoords.x}, ${targetCoords.y}).`);
              }

              // 2. SCHADEN & HEILUNG
              if ((effect.type === "DAMAGE" || effect.type === "HEALING") && targets.length > 0) {
                  let diceString = effect.damage.dice;
                  // Skalierung
                  if (effect.scaling && effect.scaling.type === "CANTRIP" && attacker.type === 'player') {
                      const scaled = getCantripDice(playerCharacter.level, effect.scaling);
                      if (scaled) diceString = scaled;
                  }

                  let baseRollVal = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  if (effect.add_modifier && attacker.type === 'player') {
                      baseRollVal += calculateSpellAttackBonus(playerCharacter) - getProficiencyBonus(playerCharacter.level); 
                  }

                  const typeKey = effect.damage?.type?.toLowerCase() || "force";
                  const dmgTypeDE = damageTypeMap[typeKey] || typeKey;

                  // Auf alle Ziele anwenden
                  targets.forEach(target => {
                      let hitSuccess = false;
                      let isCritical = false;
                      let halfDamage = false;
                      let finalDamage = baseRollVal;
                      let msg = '';

                      // A. ANGRIFFSWURF
                      if (effect.attack_roll && effect.attack_roll !== 'auto') {
                          const spellAttackBonus = (attacker.type === 'player') ? calculateSpellAttackBonus(playerCharacter) : (attacker.attack_bonus || 4);
                          const d20 = d(20);
                          const totalRoll = d20 + spellAttackBonus;
                          isCritical = d20 === 20;

                          if (totalRoll >= target.ac || isCritical) {
                              hitSuccess = true;
                              if (isCritical) finalDamage += extractDamageValue(rollDiceString(normalizeDice(diceString)));
                          } else {
                              msg = `💨 verfehlt ${target.name}.`;
                          }
                      }
                      // B. RETTUNGSWURF
                      else if (effect.saving_throw) {
                          const saveDC = (attacker.type === 'player') ? calculateSpellSaveDC(playerCharacter) : (attacker.save_dc || 12);
                          const abilityKey = effect.saving_throw.ability.toLowerCase().substring(0, 3);
                          const saveMod = getAbilityModifier(target.stats?.[abilityKey] || 10);
                          const saveRoll = d(20) + saveMod;

                          if (saveRoll < saveDC) {
                              hitSuccess = true; 
                              msg = `🎯 ${target.name} scheitert am RW.`;
                          } else {
                              if (effect.saving_throw.effect_on_success === 'NEGATES_DAMAGE') {
                                  hitSuccess = false;
                                  msg = `🛡️ ${target.name} weicht vollständig aus.`;
                              } else {
                                  hitSuccess = true;
                                  halfDamage = true;
                                  finalDamage = Math.floor(finalDamage / 2);
                                  msg = `🛡️ ${target.name} halbiert Schaden.`;
                              }
                          }
                      } else {
                          hitSuccess = true; // Auto hit
                      }

                      if (hitSuccess) {
                          if (effect.type === 'HEALING') {
                              hpChanges[target.id] = (hpChanges[target.id] || 0) + finalDamage;
                              msg = `💖 Heilt ${target.name} für ${finalDamage} TP.`;
                          } else {
                              hpChanges[target.id] = (hpChanges[target.id] || 0) - finalDamage;
                              msg += ` 💥 ${target.name} nimmt ${finalDamage} ${dmgTypeDE}schaden.`;
                          }
                      }
                      logEntries.push(msg);
                  });
              }
          });
      }
      
      // ---------------------------------------------------------
      // FALL B: WAFFE
      // ---------------------------------------------------------
      else if (!action.effects && action.type !== 'spell' && targets.length > 0) {
          targets.forEach(target => {
              const d20 = d(20);
              const attackBonus = action.attackBonus || 5; 
              const totalRoll = d20 + attackBonus;
              const isCritical = d20 === 20;
              
              if (totalRoll >= target.ac || isCritical) {
                  let diceString = "1d4";
                  if (action.item?.damage) diceString = action.item.damage; 
                  else if (action.damage?.dice) diceString = action.damage.dice; 
                  else if (typeof action.damage === 'string') diceString = action.damage;

                  const cleanDice = normalizeDice(diceString);
                  let damage = extractDamageValue(rollDiceString(cleanDice));

                  if (isCritical) damage += extractDamageValue(rollDiceString(cleanDice));
                  if (action.damage?.bonus) damage += Number(action.damage.bonus);

                  hpChanges[target.id] = (hpChanges[target.id] || 0) - damage;
                  logEntries.push(`⚔️ Trifft ${target.name} für ${damage} Schaden.${isCritical ? ' (KRIT!)' : ''}`);
              } else {
                  logEntries.push(`💨 Verfehlt ${target.name}.`);
              }
          });
      }

      // State Update: HP anwenden & neue Tokens hinzufügen
      let updatedCombatants = prev.combatants.map(c => {
          if (hpChanges[c.id] !== undefined) {
              const newHp = Math.max(0, Math.min(c.maxHp, c.hp + hpChanges[c.id]));
              if (newHp === 0) logEntries.push(`💀 ${c.name} besiegt!`);
              return { ...c, hp: newHp };
          }
          return c;
      });

      // Füge beschworene Kreaturen hinzu
      if (newCombatantsToAdd.length > 0) {
          updatedCombatants = [...updatedCombatants, ...newCombatantsToAdd];
          // Sortiere neu nach Initiative (optional, damit sie im Turn Order richtig stehen)
          updatedCombatants.sort((a, b) => b.initiative - a.initiative);
      }

      const enemiesAlive = updatedCombatants.some(c => c.type === 'enemy' && c.hp > 0);
      const playerAlive = updatedCombatants.some(c => c.type === 'player' && c.hp > 0);
      
      let result = null;
      if (!enemiesAlive) result = 'victory';
      if (!playerAlive) result = 'defeat';

      return {
          ...prev,
          combatants: updatedCombatants,
          log: [...prev.log, ...logEntries],
          turnResources: { ...prev.turnResources, hasAction: false },
          result
      };
    });
    
    setSelectedAction(null);
  }, [playerCharacter]);

  // --- CLICK HANDLER ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      // Erlaube auch Beschwörungen (controlledBy player) zu agieren, falls du das später willst
      if (current.type !== 'player' && current.controlledBy !== 'player') return; 

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      // A: Aktion ausgewählt
      if (selectedAction && state.turnResources.hasAction) {
          const allowedRange = calculateWeaponRange(selectedAction);
          const distToClick = getDistance(current, {x, y});

          if (distToClick > allowedRange) {
              setCombatState(prev => ({...prev, log: [...prev.log, `⚠️ Zu weit weg!`]}))
              return;
          }

          // 1. FLÄCHENZAUBER ODER PUNKT-ZIEL (SUMMON)
          if (selectedAction.target?.type === 'POINT' || selectedAction.target?.radius_m) {
              const radiusTiles = selectedAction.target.radius_m ? Math.floor(selectedAction.target.radius_m / 1.5) : 0;
              
              const targetsInArea = state.combatants.filter(c => {
                  if (c.hp <= 0) return false;
                  const distToImpact = getDistance({x, y}, c);
                  return distToImpact <= radiusTiles;
              });

              // WICHTIG: Auch wenn keine Ziele da sind, feuern wir für den SUMMON Effekt
              const targetIds = targetsInArea.map(t => t.id);
              performAction(current.id, targetIds, selectedAction, {x, y});
          } 
          // 2. EINZELZIEL
          else if (target && target.type === 'enemy') {
              performAction(current.id, [target.id], selectedAction, {x, y});
          }
      } 
      // B: Bewegung
      else if (!target && !selectedAction) {
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
          }
      }
  }, [selectedAction, performAction]);

  // ... (Rest bleibt gleich: nextTurn, KI, etc.)
  const nextTurn = useCallback(() => {
      processingTurn.current = false; 
      setCombatState(prev => {
          if (prev.result) return prev;
          const nextIndex = (prev.turnIndex + 1) % prev.combatants.length;
          const nextRound = nextIndex === 0 ? prev.round + 1 : prev.round;
          const nextCombatant = prev.combatants[nextIndex];
          return {
              ...prev,
              turnIndex: nextIndex,
              round: nextRound,
              turnResources: { hasAction: true, hasBonusAction: true, movementLeft: calculateMoveTiles(nextCombatant.speed) },
              log: [...prev.log, `--- Runde ${nextRound}: ${nextCombatant.name} ---`]
          };
      });
  }, []);

  // KI
  useEffect(() => {
    const state = combatState;
    if (!state.isActive || state.result) return;
    const currentC = state.combatants[state.turnIndex];
    if (currentC && currentC.hp <= 0) {
        if (!processingTurn.current) {
             processingTurn.current = true;
             setTimeout(() => nextTurn(), 500);
        }
        return;
    }
    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        processingTurn.current = true;
        const aiTurn = async () => {
            try {
                await new Promise(r => setTimeout(r, 800));
                let freshState = stateRef.current;
                if (!freshState.isActive || freshState.result) return;
                const player = freshState.combatants.find(c => c.type === 'player');
                if (player && player.hp > 0) {
                    let currentX = currentC.x;
                    let currentY = currentC.y;
                    const actionTemplate = (currentC.actions && currentC.actions[0]) || { name: 'Angriff', damage: '1d4' };
                    const attackRange = calculateWeaponRange(actionTemplate);
                    let distToPlayer = getDistance({x: currentX, y: currentY}, player);
                    const maxMoves = calculateMoveTiles(currentC.speed);
                    let movesLeft = maxMoves;
                    let hasMoved = false;
                    while (movesLeft > 0 && distToPlayer > attackRange) {
                        let bestX = currentX;
                        let bestY = currentY;
                        let minNewDist = distToPlayer;
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                if (dx === 0 && dy === 0) continue; 
                                const nextX = currentX + dx;
                                const nextY = currentY + dy;
                                const isOccupied = freshState.combatants.some(c => c.x === nextX && c.y === nextY && c.hp > 0);
                                if (!isOccupied) {
                                    const distFromNext = getDistance({x: nextX, y: nextY}, player);
                                    if (distFromNext < minNewDist) {
                                        minNewDist = distFromNext;
                                        bestX = nextX;
                                        bestY = nextY;
                                    }
                                }
                            }
                        }
                        if (bestX !== currentX || bestY !== currentY) {
                            currentX = bestX;
                            currentY = bestY;
                            movesLeft--;
                            hasMoved = true;
                            distToPlayer = minNewDist; 
                        } else {
                            break;
                        }
                    }
                    if (hasMoved) {
                        setCombatState(prev => ({
                            ...prev,
                            combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: currentX, y: currentY } : c),
                            log: [...prev.log, `${currentC.name} bewegt sich.`]
                        }));
                        await new Promise(r => setTimeout(r, 600)); 
                    }
                    const finalDistToPlayer = getDistance({x: currentX, y: currentY}, player);
                    if (finalDistToPlayer <= attackRange) {
                        performAction(currentC.id, [player.id], {
                            ...actionTemplate, type: 'weapon', range: actionTemplate.range, reach: actionTemplate.reach
                        });
                    }
                }
            } catch (error) { console.error("AI Error", error); } 
            finally { if (!stateRef.current.result) setTimeout(() => nextTurn(), 800); }
        };
        aiTurn();
    }
  }, [combatState.turnIndex, combatState.isActive, nextTurn, performAction]);

  return {
    combatState, startCombat, nextTurn, endCombatSession,
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};