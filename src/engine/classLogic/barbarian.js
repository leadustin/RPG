// Diese Datei implementiert die spezifische Klassenlogik für den Barbaren
// und ALLE seine Unterklassen.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Hilfsfunktion, um den Kampfrausch-Schadensbonus basierend auf dem Level zu erhalten.
 * (Basierend auf 'rage_progression' in classes.json)
 */
function getRageDamageBonus(level) {
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    if (level >= 1) return 2;
    return 0;
}

/**
 * Wendet alle passiven Stat-Modifikatoren für den Barbaren und seine Unterklasse an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt.
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
    const newStats = { ...stats };
    const abilities = stats; 
    const level = character.level || 1;
    const subclassKey = character.subclassKey;
    const isRaging = character.status?.isRaging || false; // Annahme

    // --- Level 1: Ungepanzerte Verteidigung ---
    if (level >= 1) {
        const isUnarmored = !character.equipment.armor;
        if (isUnarmored) {
            const dexMod = calculateModifier(abilities.dexterity);
            const conMod = calculateModifier(abilities.constitution);
            const barbarianAC = 10 + dexMod + conMod;
            if (barbarianAC > newStats.armorClass) {
                newStats.armorClass = barbarianAC;
            }
        }
    }

    // --- Level 5: Schnelle Bewegung ---
    if (level >= 5) {
        let isWearingHeavyArmor = false;
        if (character.equipment.armor) {
             const armorName = character.equipment.armor.name.toLowerCase();
             if (armorName.includes("plattenpanzer") || armorName.includes("kettenrüstung") || armorName.includes("ringpanzer")) {
                 isWearingHeavyArmor = true;
             }
        }
        if (!isWearingHeavyArmor) {
            newStats.speed += 3; 
        }
    }

    // --- Level 7: Instinktives Zuschlagen ---
    if (level >= 7) {
        newStats.initiativeAdvantage = true;
    }

    // --- Level 20: Urtümlicher Champion ---
    if (level >= 20) {
        newStats.strength = Math.min(24, newStats.strength + 4);
        newStats.constitution = Math.min(24, newStats.constitution + 4);
    }
    
    // =================================================================
    // --- SUBKLASSEN-LOGIK (PASSIV) ---
    // =================================================================

    switch (subclassKey) {
        case "path_of_the_totem_warrior":
            // Lvl 3: Totemgeist (Bär)
            // Annahme: Wahl ist gespeichert in character.choices.totemSpirit[3]
            if (level >= 3 && character.choices?.totemSpirit?.[3] === 'bear' && isRaging) {
                if (!newStats.resistances) newStats.resistances = [];
                newStats.resistances.push("poison", "acid", "cold", "fire", "force", "lightning", "necrotic", "radiant", "thunder");
                // (Hieb, Stich, Wunde sind bereits durch Kampfrausch abgedeckt)
            }
            
            // Lvl 6: Aspekt des Tieres
            // (Beispiel: Aspekt des Bären)
            if (level >= 6 && character.choices?.totemSpirit?.[6] === 'bear') {
                newStats.carryingCapacityMultiplier = 2; // (Doppelte Tragekapazität)
            }
            break;
            
        case "path_of_the_storm_herald":
            // Lvl 6: Sturmseele
            // Annahme: Wahl ist in character.choices.stormAura
            if (level >= 6 && character.choices?.stormAura) {
                if (!newStats.resistances) newStats.resistances = [];
                const auraType = character.choices.stormAura;
                if (auraType === 'desert') newStats.resistances.push('fire');
                if (auraType === 'sea') newStats.resistances.push('lightning');
                if (auraType === 'tundra') newStats.resistances.push('cold');
            }
            break;
            
        case "path_of_the_zealot":
            // Lvl 6: Krieger des Glaubens
            if (level >= 6) {
                // Zauber wie "Wiederbeleben" kosten kein Material, um diesen Barbaren wiederzubeleben.
                newStats.freeResurrection = true; 
            }
            break;
        
        case "path_of_the_ancestral_guardian":
             // Lvl 10: Beruhigender Geist (Heilung)
             // (In 5e ist dies 'Consult the Spirits', aber JSON sagt 'heilen'. Wir fügen es als Aktion hinzu.)
            break;

        case "path_of_the_beast":
            // Lvl 6: Bestienspürsinn
            // "Verstärkte Sinne" - wir interpretieren dies als Vorteil bei Wahrnehmung.
            if (level >= 6) {
                newStats.skillAdvantages = (newStats.skillAdvantages || []);
                if (!newStats.skillAdvantages.includes('perception')) {
                    newStats.skillAdvantages.push('perception');
                }
            }
            break;
    }

    return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen) für den Barbaren und seine Unterklasse.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
    const activeSkills = [];
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Level 1: Kampfrausch ---
    if (level >= 1) {
        activeSkills.push({
            key: "rage",
            name: "Kampfrausch",
            type: "bonus_action",
            description: "Als Bonusaktion in einen Kampfrausch verfallen. (Vorteil auf ST-Würfe, +Schaden, Resistenz...)"
        });
    }

    // --- Level 2: Tollkühner Angriff ---
    if (level >= 2) {
        activeSkills.push({
            key: "reckless_attack",
            name: "Tollkühner Angriff",
            type: "action_modifier",
            description: "Vorteil bei deinem ersten ST-Angriff in diesem Zug. Gegner haben Vorteil gegen dich bis zu deinem nächsten Zug."
        });
    }

    // =================================================================
    // --- SUBKLASSEN-LOGIK (AKTIV) ---
    // =================================================================

    switch (subclassKey) {
        case "path_of_the_berserker":
            // Lvl 3: Raserei
            if (level >= 3) {
                activeSkills.push({
                    key: "frenzy_attack",
                    name: "Raserei: Angriff",
                    type: "bonus_action",
                    description: "WÄHREND Kampfrausch: Mache einen zusätzlichen Waffenangriff als Bonusaktion. Erleide danach 1 Erschöpfung."
                });
            }
            // Lvl 10: Einschüchternde Präsenz
            if (level >= 10) {
                activeSkills.push({
                    key: "intimidating_presence",
                    name: "Einschüchternde Präsenz",
                    type: "action",
                    description: "Als Aktion eine Kreatur in 9m Umkreis einschüchtern (verängstigen)."
                });
            }
            break;

        case "path_of_the_storm_herald":
            // Lvl 3: Sturmaura
            if (level >= 3) {
                // Annahme: Wahl (Wüste, Meer, Tundra) ist in character.choices.stormAura gespeichert
                const auraType = character.choices?.stormAura || "Wüste";
                activeSkills.push({
                    key: "storm_aura",
                    name: `Sturmaura (${auraType})`,
                    type: "bonus_action",
                    description: `Als Bonusaktion (im Kampfrausch) deine Aura aktivieren (${auraType}-Effekt).`
                });
            }
            break;

        case "path_of_the_beast":
            // Lvl 3: Form der Bestie
            // (Dies sind keine Aktionen, die man auswählt, sondern Modifikatoren,
            // die 'Angriff' während des Kampfrauschs ändern. `handleGameEvent` ist besser.)
            break;
            
        case "path_of_the_ancestral_guardian":
            // Lvl 6: Geisterschilde
            if (level >= 6) {
                activeSkills.push({
                    key: "spirit_shield",
                    name: "Geisterschilde",
                    type: "reaction",
                    description: "Als Reaktion den Schaden an einem Verbündeten in 9m Umkreis reduzieren."
                });
            }
            // Lvl 10: Beruhigender Geist (Heilung)
            if (level >= 10) {
                 activeSkills.push({
                    key: "ancestral_healing", // (Name angepasst an Beschreibung)
                    name: "Beruhigender Geist",
                    type: "action",
                    description: "Als Aktion Geister rufen, um dich oder einen Verbündeten zu heilen."
                });
            }
            break;
    }
    
    return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Barbar auf dieses Ereignis reagieren muss.
 * @param {string} eventType - Die Art des Ereignisses.
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Barbaren.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;
    const isRaging = character.status?.isRaging || false; 

    // --- Basis-Klasse Events ---

    // Lvl 2: Gefahrensinn
    if (level >= 2 && eventType === 'saving_throw' && data.ability === 'dexterity') {
        const canReact = !character.status?.isBlinded && !character.status?.isDeafened && !character.status?.isIncapacitated;
        if (canReact) {
            return { ...data, advantage: true };
        }
    }

    // Lvl 11: Unnachgiebiger Zorn
    if (level >= 11 && eventType === 'damage_taken' && data.newHp <= 0) {
        if (isRaging) {
            return { ...data, requiresSave: { type: 'constitution', dc: 10, effect: 'relentless_rage' } };
        }
    }
    
    // Lvl 2: Tollkühner Angriff (Aktivierung)
    if (level >= 2 && eventType === 'before_attack_roll') {
        if (data.choice === 'reckless_attack' && data.attackType === 'melee_weapon_str') {
            return { ...data, advantage: true, setStatus: 'isReckless' };
        }
    }
    
    // Lvl 1: Kampfrausch-Schaden
    if (level >= 1 && eventType === 'attack_hit') {
        if (isRaging && data.attackType === 'melee_weapon_str') {
            const rageBonus = getRageDamageBonus(level);
            return { ...data, flatBonusDamage: (data.flatBonusDamage || 0) + rageBonus };
        }
    }
    
    // =================================================================
    // --- SUBKLASSEN-LOGIK (REAKTION/EVENT) ---
    // =================================================================

    switch (subclassKey) {
        case "path_of_the_berserker":
            // Lvl 6: Geistesgegenwärtiger Zorn
            if (level >= 6 && isRaging && eventType === 'saving_throw') {
                if (data.effectType === 'charmed' || data.effectType === 'frightened') {
                    // (In 5e ist es Immunität, Vorteil ist ein guter Kompromiss)
                    return { ...data, advantage: true };
                }
            }
            // Lvl 14: Vergeltender Zorn
            if (level >= 14 && eventType === 'damage_taken' && data.sourceType === 'melee_attack') {
                // Signalisieren, dass eine Reaktion (Angriff) möglich ist
                return { ...data, canReact: 'retaliation_attack' };
            }
            break;
            
        case "path_of_the_ancestral_guardian":
            // Lvl 3: Ahnenbeschützer
            if (level >= 3 && isRaging && eventType === 'attack_hit' && !character.status?.hasUsedAncestralProtectors) {
                // Erster Treffer im Zug
                return { 
                    ...data, 
                    // Wendet einen Debuff auf das Ziel an (Engine muss 'ancestral_marked' interpretieren)
                    targetDebuff: { effect: 'ancestral_marked', duration: 1, source: character.id },
                    setStatus: 'hasUsedAncestralProtectors'
                };
            }
            break;
            
        case "path_of_the_zealot":
            // Lvl 3: Göttliche Raserei
            if (level >= 3 && isRaging && eventType === 'attack_hit' && !character.status?.hasUsedDivineFury) {
                const dice = `1d6`;
                const flatDamage = Math.floor(level / 2);
                const damageType = "radiant"; // (oder 'necrotic', Annahme: Wahl gespeichert)
                
                return {
                    ...data,
                    bonusDamage: (data.bonusDamage || "") + `+${dice}`,
                    bonusDamageCrit: (data.bonusDamageCrit || "") + `+${dice}`,
                    flatBonusDamage: (data.flatBonusDamage || 0) + flatDamage,
                    setStatus: 'hasUsedDivineFury'
                };
            }
            break;
            
        case "path_of_wild_magic":
            // Lvl 3: Magische Wut
            if (level >= 3 && eventType === 'action' && data.action === 'rage') {
                // Signalisiert der Engine, auf der Wild-Magic-Tabelle zu würfeln
                return { ...data, triggerEffect: 'wild_magic_surge' };
            }
            break;
    }

    // Keine Änderung am Ereignis
    return data;
}

/**
 * (NEU) Holt die Zauber-Fähigkeiten (falls vorhanden, z.B. für Wild Magic).
 * Barbaren sind keine Zauberwirker, aber diese Funktion ist für die Vollständigkeit da.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    // Barbaren (außer Wild Magic vielleicht) haben kein Zauberwirken
    return null;
}
