// Diese Datei implementiert die spezifische Klassenlogik für den Barbaren.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  // Diese Funktion existiert auch in characterEngine.js, wird hier aber
  // der Einfachheit halber neu definiert, um Abhängigkeiten zu minimieren.
  return Math.floor((score - 10) / 2);
}

// (NEU) Hilfsfunktion, um den Kampfrausch-Schadensbonus basierend auf dem Level zu erhalten.
// (Basierend auf 'rage_progression' in classes.json)
function getRageDamageBonus(level) {
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    if (level >= 1) return 2;
    return 0;
}

/**
 * Wendet alle passiven Stat-Modifikatoren für den Barbaren an.
 * Diese Funktion wird aufgerufen, NACHDEM Basis-Stats und Attributssteigerungen (ASI)
 * berechnet wurden, aber BEVOR finale Ausrüstungs-Stats (wie Rüstungs-AC) angewendet werden.
 * * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (mit Basiswerten, ASI etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
    // Erstelle eine Kopie, um das Original nicht zu verändern (Immutability)
    const newStats = { ...stats };
    
    // Annahme: abilities-Werte sind in stats bereits final berechnet (inkl. Rasse)
    const abilities = stats; 
    const level = character.level || 1;

    // --- Level 1: Ungepanzerte Verteidigung ---
    // Beschreibung: "Solange du keine Rüstung trägst, ist deine Rüstungsklasse 10 + dein Geschicklichkeitsmodifikator + dein Konstitutionsmodifikator."
    if (level >= 1) {
        // Wir gehen davon aus, dass `character.equipment.chest` null oder undefined ist, wenn nichts getragen wird.
        const isUnarmored = !character.equipment.armor; // (Angepasst an calculateAC-Logik)
        
        if (isUnarmored) {
            const dexMod = calculateModifier(abilities.dexterity);
            const conMod = calculateModifier(abilities.constitution);
            const barbarianAC = 10 + dexMod + conMod;
            
            // Wende die Barbaren-AC nur an, wenn sie besser ist als die aktuelle AC.
            // (Die Standard-AC ist 10 + Dex-Mod)
            if (barbarianAC > newStats.armorClass) {
                newStats.armorClass = barbarianAC;
            }
        }
    }

    // --- Level 5: Schnelle Bewegung ---
    // Beschreibung: "Deine Bewegungsrate erhöht sich um 3 Meter, solange du keine schwere Rüstung trägst."
    if (level >= 5) {
        let isWearingHeavyArmor = false;
        if (character.equipment.armor) {
             // Annahme: Rüstungs-Namen (aus calculateAC)
             const armorName = character.equipment.armor.name.toLowerCase();
             if (armorName.includes("plattenpanzer") || armorName.includes("kettenrüstung") || armorName.includes("ringpanzer")) {
                 isWearingHeavyArmor = true;
             }
        }
        
        if (!isWearingHeavyArmor) {
            // Annahme: `newStats.speed` ist in Metern (Standard 9m)
            newStats.speed += 3; 
        }
    }

    // --- Level 7: Instinktives Zuschlagen ---
    // Beschreibung: "Du hast Vorteil auf Initiativewürfe."
    if (level >= 7) {
        // Initiative ist im Grunde ein Dex-Wurf. Wir fügen ein Flag hinzu,
        // das die Würfel-Engine später prüfen kann.
        newStats.initiativeAdvantage = true;
    }

    // --- Level 20: Urtümlicher Champion ---
    // Beschreibung: "Dein Stärkewert und dein Konstitutionswert steigen um 4 (max. 24)."
    if (level >= 20) {
        newStats.strength = Math.min(24, newStats.strength + 4);
        newStats.constitution = Math.min(24, newStats.constitution + 4);
    }
    
    // Gib die modifizierten Stats zurück
    return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Barbaren-Klasse zur Verfügung stehen.
 * * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
    const activeSkills = [];

    // --- Level 1: Kampfrausch ---
    // Beschreibung: "Als Bonusaktion kannst du in einen Kampfrausch verfallen."
    if (character.level >= 1) {
        activeSkills.push({
            key: "rage",
            name: "Kampfrausch",
            type: "bonus_action", // Wichtig für die UI-Sortierung
            description: "Als Bonusaktion in einen Kampfrausch verfallen. (Vorteil auf ST-Würfe, +Schaden, Resistenz...)"
            // `uses` könnten hier basierend auf `rage_progression` berechnet werden
        });
    }

    // --- Level 2: Tollkühner Angriff ---
    // Beschreibung: "Du kannst bei deinem ersten Angriff in einem Zug Vorteil erhalten..."
    if (character.level >= 2) {
        activeSkills.push({
            key: "reckless_attack",
            name: "Tollkühner Angriff",
            type: "action_modifier", // Dies ist keine Aktion, sondern modifiziert eine Aktion (Angriff)
            description: "Vorteil bei deinem ersten ST-Angriff in diesem Zug. Gegner haben Vorteil gegen dich bis zu deinem nächsten Zug."
        });
    }

    // Zukünftige aktive Skills (z.B. von Subklassen) würden hier hinzugefügt...
    
    return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Barbar auf dieses Ereignis reagieren muss.
 * * @param {string} eventType - Die Art des Ereignisses (z.B. 'saving_throw', 'damage_taken').
 * @param {object} data - Die Daten des Ereignisses (z.B. { type: 'dexterity', target: character }).
 * @param {object} character - Das Charakterobjekt des Barbaren.
 * @returns {object} - Modifizierte Ereignisdaten (z.B. { ...data, advantage: true }).
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    // Annahme: Der Status des Kampfrauschs wird auf dem Charakterobjekt verfolgt
    const isRaging = character.status?.isRaging || false; 

    // --- Level 2: Gefahrensinn ---
    if (level >= 2 && eventType === 'saving_throw' && data.ability === 'dexterity') {
        // (Bedingungen aus 5e: nicht blind, taub oder handlungsunfähig)
        const canReact = !character.status?.isBlinded && !character.status?.isDeafened && !character.status?.isIncapacitated;
        if (canReact) {
            return { ...data, advantage: true };
        }
    }

    // --- Level 11: Unnachgiebiger Zorn ---
    if (level >= 11 && eventType === 'damage_taken' && data.newHp <= 0) {
        if (isRaging) {
            // Signalisiere der Engine, dass ein Rettungswurf (SG 10 KON) erforderlich ist.
            // Wenn erfolgreich, sollte die Engine die HP auf 1 setzen.
            return { ...data, requiresSave: { type: 'constitution', dc: 10, effect: 'relentless_rage' } };
        }
    }
    
    // --- (NEU) Level 2: Tollkühner Angriff ---
    if (level >= 2 && eventType === 'before_attack_roll') {
        // Die characterEngine hat `askForReckless: true` gesendet.
        // Der Spieler (UI) hat geantwortet, indem er das Event mit `choice: 'reckless_attack'` erneut ausgelöst hat.
        // (Annahme: `data.attackType` wird von `getAttackModifiers` hinzugefügt)
        if (data.choice === 'reckless_attack' && data.attackType === 'melee_weapon_str') {
            // (Die Engine muss nun auch einen Status 'isReckless' auf den Barbaren setzen,
            // damit Feinde Vorteil gegen ihn haben)
            return { ...data, advantage: true, setStatus: 'isReckless' };
        }
    }
    
    // --- (NEU) Level 1: Kampfrausch-Schaden ---
    if (level >= 1 && eventType === 'attack_hit') {
        // Bedingungen: Im Kampfrausch UND ein Nahkampfangriff, der STR verwendet.
        if (isRaging && data.attackType === 'melee_weapon_str') {
            const rageBonus = getRageDamageBonus(level);
            const currentFlatBonus = data.flatBonusDamage || 0;
            
            // Wir fügen flachen Schaden hinzu (keine Würfel)
            return { ...data, flatBonusDamage: currentFlatBonus + rageBonus };
        }
    }
    
    // Keine Änderung am Ereignis
    return data;
}