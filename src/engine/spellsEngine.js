/**
 * spellsEngine.js
 * Zentrale Engine für das Zaubersystem im D&D 5e Browser-Spiel
 * Implementiert das Regelwerk für Zaubersprüche, einschließlich Zaubersprucheffekte,
 * Saving Throws, Concentration und Statuseffekte.
 */

// Konstanten für Zauberkomponenten
const COMPONENTS = {
    VERBAL: 'V',
    SOMATIC: 'S',
    MATERIAL: 'M'
};

// Konstanten für Zauberreichweiten
const RANGE_TYPES = {
    SELF: 'self',
    TOUCH: 'touch',
    SIGHT: 'sight',
    UNLIMITED: 'unlimited'
};

// Konstanten für Zauberdauer
const DURATION_TYPES = {
    INSTANTANEOUS: 'instantaneous',
    CONCENTRATION: 'concentration',
    SPECIAL: 'special',
    PERMANENT: 'permanent'
};

// Konstanten für Schadensarten
const DAMAGE_TYPES = {
    ACID: 'acid',
    BLUDGEONING: 'bludgeoning',
    COLD: 'cold',
    FIRE: 'fire',
    FORCE: 'force',
    LIGHTNING: 'lightning',
    NECROTIC: 'necrotic',
    PIERCING: 'piercing',
    POISON: 'poison',
    PSYCHIC: 'psychic',
    RADIANT: 'radiant',
    SLASHING: 'slashing',
    THUNDER: 'thunder'
};

// Konstanten für Statuseffekte
const CONDITIONS = {
    BLINDED: 'blinded',
    CHARMED: 'charmed',
    DEAFENED: 'deafened',
    FRIGHTENED: 'frightened',
    GRAPPLED: 'grappled',
    INCAPACITATED: 'incapacitated',
    INVISIBLE: 'invisible',
    PARALYZED: 'paralyzed',
    PETRIFIED: 'petrified',
    POISONED: 'poisoned',
    PRONE: 'prone',
    RESTRAINED: 'restrained',
    STUNNED: 'stunned',
    UNCONSCIOUS: 'unconscious'
};

// Konstanten für Rettungswürfe
const SAVING_THROWS = {
    STRENGTH: 'strength',
    DEXTERITY: 'dexterity',
    CONSTITUTION: 'constitution',
    INTELLIGENCE: 'intelligence',
    WISDOM: 'wisdom',
    CHARISMA: 'charisma'
};

/**
 * Klasse zur Verwaltung aktiver Konzentrations-Zauber
 */
class ConcentrationManager {
    constructor() {
        this.concentrationSpells = new Map(); // Speichert aktive Konzentrationszauber (charakterId -> Zauberinfo)
    }

    /**
     * Startet einen Konzentrationszauber für einen Charakter
     * @param {string} characterId - ID des Charakters
     * @param {Object} spellInfo - Informationen über den Zauber
     * @returns {boolean} - Ob der Zauber erfolgreich gestartet wurde
     */
    startConcentration(characterId, spellInfo) {
        // Beende vorherige Konzentration, falls vorhanden
        if (this.concentrationSpells.has(characterId)) {
            this.breakConcentration(characterId);
        }

        this.concentrationSpells.set(characterId, {
            spellId: spellInfo.id,
            startTime: Date.now(),
            duration: spellInfo.duration,
            targets: spellInfo.targets,
            level: spellInfo.level,
            effects: spellInfo.effects
        });

        return true;
    }

    /**
     * Prüft, ob ein Charakter sich auf einen Zauber konzentriert
     * @param {string} characterId - ID des Charakters
     * @returns {boolean} - Ob der Charakter sich konzentriert
     */
    isConcentrating(characterId) {
        return this.concentrationSpells.has(characterId);
    }

    /**
     * Bricht die Konzentration eines Charakters ab
     * @param {string} characterId - ID des Charakters
     * @returns {Object|null} - Informationen über den beendeten Zauber
     */
    breakConcentration(characterId) {
        if (!this.concentrationSpells.has(characterId)) {
            return null;
        }

        const spellInfo = this.concentrationSpells.get(characterId);
        this.concentrationSpells.delete(characterId);

        // Alle Effekte entfernen
        if (spellInfo.effects && spellInfo.targets) {
            spellInfo.targets.forEach(targetId => {
                // Entferne Zaubereffekte vom Ziel
                // Implementierung abhängig von der Effekt-Verwaltung
            });
        }

        return spellInfo;
    }

    /**
     * Konzentrations-Rettungswurf nach Schaden
     * @param {string} characterId - ID des Charakters
     * @param {number} damage - Erlittener Schaden
     * @param {Object} gameState - Aktueller Spielzustand
     * @returns {boolean} - Ob die Konzentration bestehen bleibt
     */
    concentrationSavingThrow(characterId, damage, gameState) {
        if (!this.isConcentrating(characterId)) {
            return true;
        }

        const character = gameState.getCharacterById(characterId);
        if (!character) {
            return false;
        }

        // DC ist 10 oder die Hälfte des erlittenen Schadens, je nachdem was höher ist
        const dc = Math.max(10, Math.floor(damage / 2));

        // Würfelwurf + Constitution-Modifier + eventuelle Proficiency
        const constitutionMod = Math.floor((character.abilities.constitution - 10) / 2);
        const proficiencyBonus = character.hasSavingThrowProficiency('constitution') ?
            character.proficiencyBonus : 0;

        const roll = Math.floor(Math.random() * 20) + 1; // d20 Wurf
        const total = roll + constitutionMod + proficiencyBonus;

        // Bei Misserfolg wird die Konzentration gebrochen
        if (total < dc) {
            this.breakConcentration(characterId);
            return false;
        }

        return true;
    }
}

/**
 * Hauptklasse für die Zauber-Engine
 */
class SpellsEngine {
    constructor(gameState) {
        this.gameState = gameState;
        this.concentrationManager = new ConcentrationManager();
        this.activeEffects = new Map(); // Speichert aktive Effekte (zielId -> [effectObjects])
        this.spellRegistry = {}; // Registrierte Zauber-Implementierungen

        // Registriere alle Zauber
        this._registerSpells();
    }

    /**
     * Registriert alle verfügbaren Zauber in der Engine
     * @private
     */
    _registerSpells() {
        // Registriere Grad-0-Zauber (Cantrips)
        this.registerSpell('acid_splash', this._castAcidSplash);
        this.registerSpell('blade_ward', this._castBladeWard);
        this.registerSpell('chill_touch', this._castChillTouch);
        this.registerSpell('dancing_lights', this._castDancingLights);
        this.registerSpell('fire_bolt', this._castFireBolt);
        this.registerSpell('friends', this._castFriends);
        this.registerSpell('light', this._castLight);
        this.registerSpell('mage_hand', this._castMageHand);
        this.registerSpell('minor_illusion', this._castMinorIllusion);
        this.registerSpell('poison_spray', this._castPoisonSpray);
        this.registerSpell('ray_of_frost', this._castRayOfFrost);
        this.registerSpell('shocking_grasp', this._castShockingGrasp);
        this.registerSpell('sacred_flame', this._castSacredFlame);
        this.registerSpell('guidance', this._castGuidance);
        this.registerSpell('true_strike', this._castTrueStrike);
        this.registerSpell('eldritch_blast', this._castEldritchBlast);
        this.registerSpell('vicious_mockery', this._castViciousMockery);
        // Grad-1-Zauber
        this.registerSpell('animal_friendship', this._castAnimalFriendship);
        this.registerSpell('armor_of_agathys', this._castArmorOfAgathys);
        this.registerSpell('arms_of_hadar', this._castArmsOfHadar);
        this.registerSpell('bane', this._castBane);
        this.registerSpell('bless', this._castBless);
        this.registerSpell('burning_hands', this._castBurningHands);
        this.registerSpell('charm_person', this._castCharmPerson);
        this.registerSpell('chromatic_orb', this._castChromaticOrb);
        this.registerSpell('color_spray', this._castColorSpray);
        this.registerSpell('command', this._castCommand);
        this.registerSpell('compelled_duel', this._castCompelledDuel);
        this.registerSpell('create_or_destroy_water', this._castCreateOrDestroyWater);
        this.registerSpell('cure_wounds', this._castCureWounds);
        this.registerSpell('disguise_self', this._castDisguiseSelf);
        this.registerSpell('dissonant_whispers', this._castDissonantWhispers);
        this.registerSpell('divine_favor', this._castDivineFavor);
        this.registerSpell('ensnaring_strike', this._castEnsnaringStrike);
        this.registerSpell('entangle', this._castEntangle);
        this.registerSpell('expeditious_retreat', this._castExpeditiousRetreat);
        this.registerSpell('faerie_fire', this._castFaerieFire);
        this.registerSpell('false_life', this._castFalseLife);
        this.registerSpell('feather_fall', this._castFeatherFall);
        this.registerSpell('find_familiar', this._castFindFamiliar);
        this.registerSpell('fog_cloud', this._castFogCloud);
        this.registerSpell('goodberry', this._castGoodberry);
        this.registerSpell('guiding_bolt', this._castGuidingBolt);
        this.registerSpell('grease', this._castGrease);
        this.registerSpell('healing_word', this._castHealingWord);
        this.registerSpell('hellish_rebuke', this._castHellishRebuke);
        this.registerSpell('hex', this._castHex);
        this.registerSpell('hunters_mark', this._castHuntersMark);
        this.registerSpell('inflict_wounds', this._castInflictWounds);
        this.registerSpell('jump', this._castJump);
        this.registerSpell('protection_from_evil_and_good', this._castProtectionFromEvilAndGood);
        this.registerSpell('ray_of_sickness', this._castRayOfSickness);
        this.registerSpell('sanctuary', this._castSanctuary);
        this.registerSpell('searing_smite', this._castSearingSmite);
        this.registerSpell('shield_of_faith', this._castShieldOfFaith);
        this.registerSpell('sleep', this._castSleep);
        this.registerSpell('speak_with_animals', this._castSpeakWithAnimals);
        this.registerSpell('tashas_hideous_laughter', this._castTashasHideousLaughter);
        this.registerSpell('thunderous_smite', this._castThunderousSmite);
        this.registerSpell('thunderwave', this._castThunderwave);
        this.registerSpell('witch_bolt', this._castWitchBolt);
        this.registerSpell('wrathful_smite', this._castWrathfulSmite);
        // Grad-2-Zauber
        this.registerSpell('aid', this._castAid);
        this.registerSpell('barkskin', this._castBarkskin);
        this.registerSpell('blindness_deafness', this._castBlindnessDeafness);
        this.registerSpell('blur', this._castBlur);
        this.registerSpell('branding_smite', this._castBrandingSmite);
        this.registerSpell('calm_emotions', this._castCalmEmotions);
        this.registerSpell('cloud_of_daggers', this._castCloudOfDaggers);
        this.registerSpell('crown_of_madness', this._castCrownOfMadness);
        this.registerSpell('darkness', this._castDarkness);
        this.registerSpell('darkvision', this._castDarkvision);
        this.registerSpell('detect_thoughts', this._castDetectThoughts);
        this.registerSpell('enhance_ability', this._castEnhanceAbility);
        this.registerSpell('enlarge_reduce', this._castEnlargeReduce);
        this.registerSpell('flame_blade', this._castFlameBlade);
        this.registerSpell('flaming_sphere', this._castFlamingSphere);
        this.registerSpell('heat_metal', this._castHeatMetal);
        this.registerSpell('hold_person', this._castHoldPerson);
        this.registerSpell('invisibility', this._castInvisibility);
        this.registerSpell('lesser_restoration', this._castLesserRestoration);
        this.registerSpell('magic_weapon', this._castMagicWeapon);
        this.registerSpell('pass_without_trace', this._castPassWithoutTrace);
        this.registerSpell('mirror_image', this._castMirrorImage);
        this.registerSpell('misty_step', this._castMistyStep);
        this.registerSpell('moonbeam', this._castMoonbeam);
        this.registerSpell('pass_without_trace', this._castPassWithoutTrace);
        this.registerSpell('phantasmal_force', this._castPhantasmalForce);
        this.registerSpell('prayer_of_healing', this._castPrayerOfHealing);
        this.registerSpell('protection_from_poison', this._castProtectionFromPoison);
        this.registerSpell('ray_of_enfeeblement', this._castRayOfEnfeeblement);
        this.registerSpell('scorching_ray', this._castScorchingRay);
        this.registerSpell('shatter', this._castShatter);
        this.registerSpell('silence', this._castSilence);
        this.registerSpell('spiritual_weapon', this._castSpiritualWeapon);
        this.registerSpell('spike_growth', this._castSpikeGrowth);
        this.registerSpell('web', this._castWeb);
        // Grad-3-Zauber
        this.registerSpell('blink', this._castBlink);
        this.registerSpell('counterspell', this._castCounterspell);
        this.registerSpell('daylight', this._castDaylight);
        this.registerSpell('dispel_magic', this._castDispelMagic);
        this.registerSpell('fear', this._castFear);
        this.registerSpell('fireball', this._castFireball);
        this.registerSpell('fly', this._castFly);
        this.registerSpell('haste', this._castHaste);
        this.registerSpell('lightning_bolt', this._castLightningBolt);
        this.registerSpell('magic_circle', this._castMagicCircle);
        this.registerSpell('meld_into_stone', this._castMeldIntoStone);
        this.registerSpell('phantasmal_killer', this._castPhantasmalKiller);
        this.registerSpell('remove_curse', this._castRemoveCurse);
        this.registerSpell('slow', this._castSlow);
        this.registerSpell('stinking_cloud', this._castStinkingCloud);
        this.registerSpell('vampiric_touch', this._castVampiricTouch);

        // Weitere Zauber können hier registriert werden
    }

    /**
     * Registriert einen Zauber in der Engine
     * @param {string} spellId - ID des Zaubers
     * @param {Function} castFunction - Funktion zur Ausführung des Zaubers
     */
    registerSpell(spellId, castFunction) {
        this.spellRegistry[spellId] = castFunction;
    }

    /**
     * Wirkt einen Zauber
     * @param {string} spellId - ID des Zaubers
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots (0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen (Position, etc.)
     * @returns {Object} - Ergebnis des Zaubers
     */
    castSpell(spellId, caster, targets, slotLevel = 0, options = {}) {
        // Prüfe, ob der Zauber existiert
        if (!this.spellRegistry[spellId]) {
            return {
                success: false,
                message: `Zauber '${spellId}' nicht gefunden.`
            };
        }

        // Prüfe, ob der Charakter den Zauber wirken kann
        const canCast = this.canCastSpell(caster, spellId, slotLevel);
        if (!canCast.success) {
            return canCast;
        }

        // Führe die spezifische Zauber-Implementierung aus
        return this.spellRegistry[spellId].call(this, caster, targets, slotLevel, options);
    }

    /**
     * Prüft, ob ein Charakter einen Zauber wirken kann
     * @param {Object} character - Der Charakter
     * @param {string} spellId - ID des Zaubers
     * @param {number} slotLevel - Level des zu verwendenden Slots
     * @returns {Object} - Ergebnis der Prüfung
     */
    canCastSpell(character, spellId, slotLevel) {
        // Holt die Zauberinformationen aus der Datenbank
        const spellData = this.gameState.getSpellById(spellId);
        if (!spellData) {
            return {
                success: false,
                message: `Zauber '${spellId}' nicht gefunden.`
            };
        }

        // Prüft, ob der Charakter den Zauber kennt
        if (!character.knownSpells.includes(spellId)) {
            return {
                success: false,
                message: "Dieser Zauber ist dir nicht bekannt."
            };
        }

        // Cantrips (Level 0) benötigen keinen Slot
        if (spellData.level === 0) {
            return { success: true };
        }

        // Prüft, ob der Slot-Level ausreichend ist
        if (slotLevel < spellData.level) {
            return {
                success: false,
                message: "Der Zauberslot ist zu niedrig für diesen Zauber."
            };
        }

        // Prüft, ob ein Slot des angegebenen Levels verfügbar ist
        if (character.spellSlots[slotLevel] <= 0) {
            return {
                success: false,
                message: `Keine Zauberslots der Stufe ${slotLevel} mehr übrig.`
            };
        }

        return { success: true };
    }

    /**
     * Berechnet den Rettungswurf-DC für einen Zauberwirker
     * @param {Object} caster - Der Zauberwirker
     * @returns {number} - Der Zauber-DC
     */
    calculateSpellSaveDC(caster) {
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);
        return 8 + caster.proficiencyBonus + abilityModifier;
    }

    /**
     * Berechnet den Zauberangriffsbonus für einen Zauberwirker
     * @param {Object} caster - Der Zauberwirker
     * @returns {number} - Der Zauberangriffsbonus
     */
    calculateSpellAttackBonus(caster) {
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);
        return caster.proficiencyBonus + abilityModifier;
    }

    /**
     * Ermittelt die primäre Zauberattribute basierend auf der Klasse
     * @param {Object} character - Der Charakter
     * @returns {string} - Das primäre Zauberattribut (intelligence, wisdom, charisma)
     * @private
     */
    _getSpellcastingAbility(character) {
        switch (character.class) {
            case 'wizard':
            case 'artificer':
                return 'intelligence';
            case 'cleric':
            case 'druid':
            case 'ranger':
                return 'wisdom';
            case 'bard':
            case 'paladin':
            case 'sorcerer':
            case 'warlock':
                return 'charisma';
            default:
                // Fallback: Standardmäßig Intelligenz
                return 'intelligence';
        }
    }

    /**
     * Führt einen Rettungswurf gegen einen Zauber aus
     * @param {Object} target - Das Ziel, das den Rettungswurf durchführt
     * @param {string} ability - Die Fähigkeit für den Rettungswurf (str, dex, con, int, wis, cha)
     * @param {number} dc - Der Schwierigkeitsgrad des Rettungswurfs
     * @param {Object} options - Zusätzliche Optionen (advantage, disadvantage)
     * @returns {Object} - Ergebnis des Rettungswurfs
     */
    makeSavingThrow(target, ability, dc, options = {}) {
        // Bestimmt, ob der Wurf mit Vorteil oder Nachteil durchgeführt wird
        const hasAdvantage = options.advantage || false;
        const hasDisadvantage = options.disadvantage || false;

        // Berechnet den Modifikator basierend auf dem Attributwert
        const abilityMod = Math.floor((target.abilities[ability] - 10) / 2);

        // Fügt Übungsbonus hinzu, falls vorhanden
        const profBonus = target.hasSavingThrowProficiency(ability) ? target.proficiencyBonus : 0;

        // Würfelt ein- oder zweimal, je nach Vorteil/Nachteil
        let roll1 = Math.floor(Math.random() * 20) + 1;
        let roll2 = Math.floor(Math.random() * 20) + 1;

        // Bestimmt den zu verwendenden Wurf
        let roll;
        if (hasAdvantage && !hasDisadvantage) {
            roll = Math.max(roll1, roll2);
        } else if (!hasAdvantage && hasDisadvantage) {
            roll = Math.min(roll1, roll2);
        } else {
            roll = roll1;
        }

        const total = roll + abilityMod + profBonus;
        const success = total >= dc;

        return {
            roll: roll,
            ability: ability,
            modifier: abilityMod,
            proficiencyBonus: profBonus,
            total: total,
            dc: dc,
            success: success,
            critical: roll === 20, // Kritischer Erfolg bei natürlicher 20
            criticalFail: roll === 1 // Kritischer Misserfolg bei natürlicher 1
        };
    }

    /**
     * Fügt Schaden oder Heilung auf ein Ziel an
     * @param {Object} target - Das Ziel
     * @param {number} amount - Die Menge an Schaden/Heilung
     * @param {string} damageType - Art des Schadens (oder "healing" für Heilung)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis der Schadensberechnung
     */
    applyDamage(target, amount, damageType = null, options = {}) {
        // Prüfe, ob es sich um Heilung handelt
        if (damageType === 'healing') {
            const newHP = Math.min(target.maxHP, target.currentHP + amount);
            const actualHealing = newHP - target.currentHP;
            target.currentHP = newHP;

            return {
                success: true,
                healing: actualHealing,
                target: target
            };
        }

        // Andernfalls handelt es sich um Schaden
        let damage = amount;

        // Prüfe Resistenzen und Immunitäten
        if (damageType) {
            if (target.immunities && target.immunities.includes(damageType)) {
                damage = 0; // Immunität - kein Schaden
            } else if (target.resistances && target.resistances.includes(damageType)) {
                damage = Math.floor(damage / 2); // Resistenz - halber Schaden
            } else if (target.vulnerabilities && target.vulnerabilities.includes(damageType)) {
                damage = damage * 2; // Verwundbarkeit - doppelter Schaden
            }
        }

        // Wende den Schaden an
        target.currentHP = Math.max(0, target.currentHP - damage);

        // Prüfe, ob das Ziel bewusstlos/tot ist
        const isUnconscious = target.currentHP === 0;

        // Falls es ein Spielercharakter ist und er einen Konzentrationszauber aufrechterhält,
        // muss ein Rettungswurf gemacht werden
        if (damage > 0 && this.concentrationManager.isConcentrating(target.id)) {
            this.concentrationManager.concentrationSavingThrow(target.id, damage, this.gameState);
        }

        return {
            success: true,
            damage: damage,
            originalAmount: amount,
            damageType: damageType,
            target: target,
            isUnconscious: isUnconscious
        };
    }

    /**
     * Fügt einen temporären Effekt zu einem Ziel hinzu
     * @param {Object} target - Das Ziel
     * @param {Object} effect - Der Effekt
     * @returns {boolean} - Ob der Effekt erfolgreich angewendet wurde
     */
    addEffect(target, effect) {
        if (!target || !effect) return false;

        const targetId = target.id;

        if (!this.activeEffects.has(targetId)) {
            this.activeEffects.set(targetId, []);
        }

        // Füge den Effekt zur Liste der aktiven Effekte hinzu
        const effects = this.activeEffects.get(targetId);
        effects.push({
            ...effect,
            startTime: Date.now(),
            remainingDuration: effect.duration
        });

        // Wende sofortige Effekte an
        if (effect.onApply) {
            effect.onApply(target, this.gameState);
        }

        return true;
    }

    /**
     * Entfernt einen Effekt von einem Ziel
     * @param {Object} target - Das Ziel
     * @param {string} effectId - ID des zu entfernenden Effekts
     * @returns {boolean} - Ob der Effekt erfolgreich entfernt wurde
     */
    removeEffect(target, effectId) {
        if (!target) return false;

        const targetId = target.id;

        if (!this.activeEffects.has(targetId)) {
            return false;
        }

        const effects = this.activeEffects.get(targetId);
        const effectIndex = effects.findIndex(e => e.id === effectId);

        if (effectIndex === -1) {
            return false;
        }

        const effect = effects[effectIndex];

        // Führe die Aufräumfunktion aus, falls vorhanden
        if (effect.onRemove) {
            effect.onRemove(target, this.gameState);
        }

        // Entferne den Effekt
        effects.splice(effectIndex, 1);

        return true;
    }

    /**
     * Aktualisiert alle aktiven Effekte (wird pro Runde aufgerufen)
     * @param {number} deltaTime - Verstrichene Zeit in Millisekunden
     */
    tickEffects(deltaTime) {
        // Durchlaufe alle Ziele mit aktiven Effekten
        for (const [targetId, effects] of this.activeEffects.entries()) {
            const target = this.gameState.getEntityById(targetId);

            if (!target) {
                // Ziel existiert nicht mehr, entferne alle Effekte
                this.activeEffects.delete(targetId);
                continue;
            }

            // Aktualisiere jeden Effekt
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];

                // Reduziere die verbleibende Dauer
                if (effect.remainingDuration > 0) {
                    effect.remainingDuration -= deltaTime;
                }

                // Wende periodische Effekte an
                if (effect.onTick) {
                    effect.onTick(target, this.gameState, deltaTime);
                }

                // Entferne abgelaufene Effekte
                if (effect.remainingDuration <= 0 && effect.duration !== Infinity) {
                    if (effect.onRemove) {
                        effect.onRemove(target, this.gameState);
                    }
                    effects.splice(i, 1);
                }
            }

            // Entferne den Eintrag, wenn keine Effekte mehr vorhanden sind
            if (effects.length === 0) {
                this.activeEffects.delete(targetId);
            }
        }
    }

    /**
     * Überprüft, ob ein Zauber unterbrochen wird (z.B. durch Counterspell)
     * @param {Object} caster - Der Zaubercharakter
     * @param {string} spellId - ID des Zaubers
     * @param {Object} options - Zusätzliche Optionen
     * @returns {boolean} - Ob der Zauber unterbrochen wurde
     */
    checkSpellInterruption(caster, spellId, options = {}) {
        // Implementierung für Counterspell und ähnliche Mechaniken
        // In einer einfachen Version kann dies immer false zurückgeben
        return false;
    }

    // =========================================================================
    // Implementierungen der Cantrips (Grad-0-Zauber)
    // =========================================================================

    /**
     * Implementierung des Acid Splash-Zaubers (Säurespritzer)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (bis zu 2)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castAcidSplash(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'acid_splash',
            caster: caster.id,
            targets: [],
            message: "Du beschwörst einen Klumpen Säure."
        };

        // Acid Splash kann nur bis zu 2 Ziele haben, die maximal 5 Fuß voneinander entfernt sind
        if (targets.length > 2) {
            targets = targets.slice(0, 2);
            results.message += " (Maximal 2 Ziele möglich)";
        }

        // Überprüfe den Abstand zwischen den Zielen
        if (targets.length === 2) {
            const distance = this.gameState.calculateDistance(targets[0].position, targets[1].position);
            if (distance > 5) {
                // Entferne das zweite Ziel, wenn sie zu weit auseinander sind
                targets = [targets[0]];
                results.message += " (Ziele zu weit voneinander entfernt)";
            }
        }

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W6 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W6 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W6 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W6 auf Level 5-10
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        targets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            let damage = 0;
            // Bei Misserfolg wird Schaden zugefügt
            if (!saveResult.success) {
                // Würfle Schaden: damageDice x W6
                for (let i = 0; i < damageDice; i++) {
                    damage += Math.floor(Math.random() * 6) + 1;
                }

                // Füge Schaden zu
                const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.ACID);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: damageResult.damage,
                    success: false
                });
            } else {
                // Rettungswurf erfolgreich, kein Schaden
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: 0,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length > 0) {
            results.message = `Du schleuderst Säure auf ${results.targets.length} Ziel(e).`;
            const failedTargets = results.targets.filter(t => !t.success).length;
            if (failedTargets > 0) {
                results.message += ` ${failedTargets} Ziel(e) konnten nicht ausweichen und erleiden Säureschaden.`;
            }
        } else {
            results.message = "Der Säurespritzer trifft keine Ziele.";
        }

        return results;
    }

    /**
     * Implementierung des Blade Ward-Zaubers (Klingenabwehr)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (nur der Zauberwirker selbst)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castBladeWard(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'blade_ward',
            caster: caster.id,
            targets: [],
            message: "Du streckst deine Hand aus und zeichnest ein Schutzsymbol in die Luft."
        };

        // Blade Ward kann nur auf den Zauberwirker selbst gewirkt werden
        const target = caster;

        // Erstelle den Effekt
        const effect = {
            id: `blade_ward_${Date.now()}`,
            name: "Klingenabwehr",
            description: "Du hast Resistenz gegen Hieb-, Stich- und Schlitzschaden.",
            duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
            resistances: [DAMAGE_TYPES.BLUDGEONING, DAMAGE_TYPES.PIERCING, DAMAGE_TYPES.SLASHING],
            onApply: (target, gameState) => {
                // Füge temporäre Resistenzen hinzu
                if (!target.temporaryResistances) target.temporaryResistances = [];
                target.temporaryResistances.push(DAMAGE_TYPES.BLUDGEONING);
                target.temporaryResistances.push(DAMAGE_TYPES.PIERCING);
                target.temporaryResistances.push(DAMAGE_TYPES.SLASHING);
            },
            onRemove: (target, gameState) => {
                // Entferne temporäre Resistenzen
                if (target.temporaryResistances) {
                    target.temporaryResistances = target.temporaryResistances.filter(
                        r => ![DAMAGE_TYPES.BLUDGEONING, DAMAGE_TYPES.PIERCING, DAMAGE_TYPES.SLASHING].includes(r)
                    );
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, effect);

        results.targets.push({
            id: target.id,
            effect: effect.name
        });

        results.message = "Du umgibst dich mit einem magischen Schutz, der dich bis zum Ende deines nächsten Zuges vor nicht-magischen Nahkampfangriffen schützt.";

        return results;
    }

    /**
     * Implementierung des Chill Touch-Zaubers (Kältegriff)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castChillTouch(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'chill_touch',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst eine geisterhafte, skelettartige Hand."
        };

        // Chill Touch kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;

        // Prüfe, ob der Angriff trifft
        const hits = (attackRoll === 20) || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W8 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W8 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W8 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W8 auf Level 5-10
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1;
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.NECROTIC);

            // Erstelle den Effekt für den Heilungsmalus
            const effect = {
                id: `chill_touch_${Date.now()}`,
                name: "Kältegriff",
                description: "Das Ziel kann keine Trefferpunkte zurückgewinnen.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    target.cannotHeal = true;
                },
                onRemove: (target, gameState) => {
                    target.cannotHeal = false;
                }
            };

            // Zusatzeffekt für Untote und Konstrukte
            if (target.type === 'undead') {
                effect.duration = 12000; // 2 Runden
                effect.description += " Das Ziel hat Nachteil bei Angriffen gegen dich.";
                effect.onApply = (target, gameState) => {
                    target.cannotHeal = true;
                    if (!target.disadvantageTargets) target.disadvantageTargets = [];
                    target.disadvantageTargets.push(caster.id);
                };
                effect.onRemove = (target, gameState) => {
                    target.cannotHeal = false;
                    if (target.disadvantageTargets) {
                        target.disadvantageTargets = target.disadvantageTargets.filter(id => id !== caster.id);
                    }
                };
            }

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                damage: damageResult.damage,
                effect: effect.name
            });

            results.message = `Die skelettartige Hand umklammert ${target.name} und verursacht ${damageResult.damage} nekrotischen Schaden.`;
            if (target.type === 'undead') {
                results.message += " Da das Ziel untot ist, hat es außerdem Nachteil bei Angriffen gegen dich bis zu deinem übernächsten Zug.";
            } else {
                results.message += " Das Ziel kann bis zu deinem nächsten Zug keine Trefferpunkte zurückgewinnen.";
            }
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Die skelettartige Hand verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Dancing Lights-Zaubers (Tanzende Lichter)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} positions - Positionen für die Lichter (bis zu 4)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castDancingLights(caster, positions, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'dancing_lights',
            caster: caster.id,
            lights: [],
            message: "Du erschaffst bis zu vier leuchtende Lichtkugeln."
        };

        // Dancing Lights erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Maximal 4 Lichter
        const numLights = Math.min(positions.length, 4);

        // Erschaffe Lichter an den angegebenen Positionen
        for (let i = 0; i < numLights; i++) {
            const lightId = `dancing_light_${Date.now()}_${i}`;

            // Erstelle das Licht im Spielzustand
            this.gameState.createLight({
                id: lightId,
                position: positions[i],
                color: options.color || '#FFFF99', // Standardfarbe: warmes Gelb
                radius: 4, // 20 Fuß Radius (4 Kacheln)
                type: 'point'
            });

            results.lights.push({
                id: lightId,
                position: positions[i]
            });
        }

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'dancing_lights',
            startTime: Date.now(),
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            lightIds: results.lights.map(light => light.id),
            onEnd: () => {
                // Entferne alle Lichter, wenn die Konzentration endet
                results.lights.forEach(light => {
                    this.gameState.removeLight(light.id);
                });
            }
        });

        results.message = `Du erschaffst ${numLights} leuchtende Lichtkugel(n), die für bis zu 1 Minute existieren, solange du dich konzentrierst.`;

        return results;
    }

    /**
     * Implementierung des Fire Bolt-Zaubers (Feuerstrahl)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFireBolt(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'fire_bolt',
            caster: caster.id,
            targets: [],
            message: "Du schleuderst einen Feuerstrahl."
        };

        // Fire Bolt kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W10 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W10 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W10 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W10 auf Level 5-10
        }

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 10) + 1; // 1W10
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

            // Prüfe, ob ein brennbares Objekt getroffen wurde
            const isFlammable = target.traits?.includes('flammable') || false;

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                isFlammable: isFlammable
            });

            let message = `Der Feuerstrahl trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Feuerschaden.`;

            if (isFlammable && !target.isCreature) {
                message += " Das Objekt fängt Feuer.";
                // Hier könnten wir einen Feuereffekt zum Objekt hinzufügen
            }

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der Feuerstrahl verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Friends-Zaubers (Freundschaft)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFriends(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'friends',
            caster: caster.id,
            targets: [],
            message: "Dein Gesicht nimmt einen vertrauenerweckenden Schimmer an."
        };

        // Friends kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel humanoid ist
        if (target.type !== 'humanoid') {
            results.success = false;
            results.message = "Dieser Zauber funktioniert nur bei humanoiden Kreaturen.";
            return results;
        }

        // Friends erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `friends_${Date.now()}`,
            name: "Freundschaft",
            description: "Vorteil bei Charisma-Würfen gegenüber diesem Ziel.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            targetId: target.id,
            casterId: caster.id,
            // Es gibt keinen direkten onApply-Effekt, da dies nur Würfe betrifft
        };

        // Füge den Effekt zum Zauberwirker hinzu (nicht zum Ziel)
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'friends',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: [target.id],
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);

                // Das Ziel wird sich bewusst, dass es verzaubert wurde
                // Hier könnten wir die Einstellung des NPCs ändern
                if (target.isNPC && this.gameState.getNPC) {
                    const npc = this.gameState.getNPC(target.id);
                    if (npc) {
                        npc.attitude = Math.max(1, (npc.attitude || 5) - 2); // Verringere Einstellung um 2 Stufen, Minimum 1 (feindlich)
                        npc.knownCasters = npc.knownCasters || [];
                        if (!npc.knownCasters.includes(caster.id)) {
                            npc.knownCasters.push(caster.id); // Merke, dass dieser Charakter Magie gegen den NPC eingesetzt hat
                        }
                    }
                }
            }
        });

        results.targets.push({
            id: target.id,
            effect: effect.name
        });

        results.message = `Du erhältst für die nächste Minute Vorteil bei allen Charisma-Würfen gegen ${target.name}, solange du dich konzentrierst. Das Ziel wird nach Ablauf des Zaubers wissen, dass du Magie gegen es eingesetzt hast.`;

        return results;
    }

    /**
     * Implementierung des Light-Zaubers (Licht)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (Objekt oder Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castLight(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'light',
            caster: caster.id,
            targets: [],
            message: "Du berührst ein Objekt, das nicht größer als 10 Fuß in jeder Richtung ist."
        };

        // Light benötigt ein Ziel (Objekt oder Kreatur)
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Wenn das Ziel eine Kreatur ist, muss es einen Dexterity-Saving Throw machen
        if (target.isCreature && !target.isObject) {
            const saveDC = this.calculateSpellSaveDC(caster);
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            if (saveResult.success) {
                results.success = false;
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
                results.message = `${target.name} weicht aus und der Zauber schlägt fehl.`;
                return results;
            }
        }

        // Prüfe, ob das Ziel bereits von Licht oder Dunkelheit betroffen ist
        const hasLightEffect = (target.effects || []).some(e =>
            e.id.includes('light_') || e.id.includes('darkness_')
        );

        if (hasLightEffect) {
            results.success = false;
            results.message = "Das Ziel ist bereits von einem Licht- oder Dunkelheitszauber betroffen.";
            return results;
        }

        // Erstelle den Lichteffekt
        const lightId = `light_${Date.now()}`;
        const effect = {
            id: lightId,
            name: "Licht",
            description: "Das Objekt leuchtet in einem Radius von 20 Fuß mit hellem Licht und weiteren 20 Fuß mit schwachem Licht.",
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onApply: (target, gameState) => {
                // Erstelle eine Lichtquelle am Ziel
                gameState.createLight({
                    id: lightId,
                    attachedTo: target.id, // Licht ist an das Ziel gebunden und bewegt sich mit ihm
                    color: options.color || '#FFFFFF', // Standardfarbe: Weiß
                    radius: 8, // 40 Fuß Radius (8 Kacheln)
                    brightRadius: 4, // 20 Fuß helles Licht (4 Kacheln)
                    type: 'point'
                });
            },
            onRemove: (target, gameState) => {
                // Entferne die Lichtquelle
                gameState.removeLight(lightId);
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, effect);

        results.targets.push({
            id: target.id,
            effect: effect.name
        });

        if (target.isCreature) {
            results.message = `Du berührst ${target.name}, das nun für 1 Stunde in hellem Licht erstrahlt.`;
        } else {
            results.message = `Das Objekt erstrahlt nun für 1 Stunde in hellem Licht.`;
        }

        return results;
    }

    /**
   * Implementierung des Mage Hand-Zaubers (Magierhand)
   * @param {Object} caster - Der Zaubercharakter
   * @param {Object} position - Position für die Magierhand
   * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
   * @param {Object} options - Zusätzliche Optionen
   * @returns {Object} - Ergebnis des Zaubers
   */
    _castMageHand(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'mage_hand',
            caster: caster.id,
            handId: null,
            message: "Du erschaffst eine geisterhafte, schwebende Hand."
        };

        // Prüfe, ob der Zauberwirker bereits eine Magierhand hat
        const existingHand = this.gameState.getEntities()
            .find(e => e.type === 'mage_hand' && e.casterId === caster.id);

        if (existingHand) {
            // Wenn eine Hand existiert, bewege sie zur neuen Position
            existingHand.position = position;
            results.handId = existingHand.id;
            results.message = "Du bewegst deine Magierhand zu einer neuen Position.";
            return results;
        }

        // Erstelle eine neue Magierhand
        const handId = `mage_hand_${Date.now()}`;

        const hand = {
            id: handId,
            name: "Magierhand",
            type: 'mage_hand',
            casterId: caster.id,
            position: position,
            maxDistance: 30, // 30 Fuß maximale Entfernung vom Zauberwirker
            maxWeight: 10, // 10 Pfund maximales Gewicht
            duration: 60000, // 1 Minute = 60000ms
            actions: {
                move: (newPosition) => {
                    // Bewegung der Hand
                    const distance = this.gameState.calculateDistance(caster.position, newPosition);
                    if (distance > hand.maxDistance) {
                        return {
                            success: false,
                            message: "Die Hand kann sich nicht weiter als 30 Fuß von dir entfernen."
                        };
                    }

                    hand.position = newPosition;
                    return {
                        success: true,
                        message: "Die Magierhand bewegt sich."
                    };
                },
                manipulate: (targetId) => {
                    // Manipulation einfacher Objekte
                    const target = this.gameState.getEntityById(targetId);
                    if (!target || !target.isObject) {
                        return {
                            success: false,
                            message: "Die Magierhand kann nur einfache Objekte manipulieren."
                        };
                    }

                    // Prüfe, ob das Objekt zu schwer ist
                    if (target.weight && target.weight > hand.maxWeight) {
                        return {
                            success: false,
                            message: "Das Objekt ist zu schwer für die Magierhand."
                        };
                    }

                    // Hier könnten spezifische Manipulationsaktionen stattfinden
                    return {
                        success: true,
                        message: `Die Magierhand manipuliert ${target.name}.`
                    };
                },
                pickup: (targetId) => {
                    // Objekte aufheben
                    const target = this.gameState.getEntityById(targetId);
                    if (!target || !target.isObject) {
                        return {
                            success: false,
                            message: "Die Magierhand kann nur Objekte aufheben."
                        };
                    }

                    // Prüfe, ob das Objekt zu schwer ist
                    if (target.weight && target.weight > hand.maxWeight) {
                        return {
                            success: false,
                            message: "Das Objekt ist zu schwer für die Magierhand."
                        };
                    }

                    // Setze das Objekt als getragenes Objekt der Hand
                    hand.heldItem = targetId;
                    target.carriedBy = handId;

                    return {
                        success: true,
                        message: `Die Magierhand hebt ${target.name} auf.`
                    };
                },
                drop: () => {
                    // Getragenes Objekt fallenlassen
                    if (!hand.heldItem) {
                        return {
                            success: false,
                            message: "Die Magierhand trägt kein Objekt."
                        };
                    }

                    const target = this.gameState.getEntityById(hand.heldItem);
                    if (target) {
                        target.carriedBy = null;
                        target.position = hand.position; // Objekt fällt an der Position der Hand
                    }

                    hand.heldItem = null;

                    return {
                        success: true,
                        message: "Die Magierhand lässt das Objekt fallen."
                    };
                }
            }
        };

        // Füge die Hand dem Spielzustand hinzu
        this.gameState.addEntity(hand);

        // Erstelle einen Timer zum Entfernen der Hand nach Ablauf der Dauer
        setTimeout(() => {
            // Lasse ggf. gehaltenes Objekt fallen
            if (hand.heldItem) {
                const target = this.gameState.getEntityById(hand.heldItem);
                if (target) {
                    target.carriedBy = null;
                    target.position = hand.position;
                }
            }

            // Entferne die Hand
            this.gameState.removeEntity(handId);
        }, hand.duration);

        results.handId = handId;
        results.message = "Du erschaffst eine geisterhafte Hand, die für 1 Minute in der Luft schwebt und einfache Aufgaben für dich erledigen kann.";

        return results;
    }

    /**
     * Implementierung des Minor Illusion-Zaubers (Kleine Illusion)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für die Illusion
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen (illusion type, appearance, sound)
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castMinorIllusion(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'minor_illusion',
            caster: caster.id,
            illusionId: null,
            message: "Du erschaffst eine kleine Illusion."
        };

        // Prüfe, ob die Optionen gültig sind
        const illusionType = options.type || 'image'; // 'image' oder 'sound'

        if (illusionType !== 'image' && illusionType !== 'sound') {
            results.success = false;
            results.message = "Du musst zwischen einer visuellen oder akustischen Illusion wählen.";
            return results;
        }

        // Erstelle die Illusion
        const illusionId = `minor_illusion_${Date.now()}`;

        const illusion = {
            id: illusionId,
            name: "Kleine Illusion",
            type: 'illusion',
            illusionType: illusionType,
            casterId: caster.id,
            position: position,
            size: {
                width: options.width || 5, // Standardgröße: 5 Fuß
                height: options.height || 5,
                depth: options.depth || 5
            },
            appearance: options.appearance || "Ein undeutliches Bild",
            sound: options.sound || "Ein undeutliches Geräusch",
            duration: 60000, // 1 Minute = 60000ms

            // Methode, um zu prüfen, ob jemand die Illusion durchschaut
            checkDetection(observer) {
                const perceptionDC = 10; // Fester Wert für Untersuchungen

                // Führe eine Untersuchungsprobe durch
                const investigationRoll = Math.floor(Math.random() * 20) + 1;
                const investigationMod = Math.floor((observer.abilities.intelligence - 10) / 2);
                const investigationTotal = investigationRoll + investigationMod +
                    (observer.skillProficiencies.investigation ? observer.proficiencyBonus : 0);

                return {
                    success: investigationTotal >= perceptionDC,
                    roll: investigationRoll,
                    total: investigationTotal
                };
            }
        };

        // Füge die Illusion dem Spielzustand hinzu
        this.gameState.addEntity(illusion);

        // Erstelle einen Timer zum Entfernen der Illusion nach Ablauf der Dauer
        setTimeout(() => {
            this.gameState.removeEntity(illusionId);
        }, illusion.duration);

        results.illusionId = illusionId;

        if (illusionType === 'image') {
            results.message = `Du erschaffst ein illusionäres Bild von "${illusion.appearance}", das für 1 Minute bestehen bleibt. Jede Kreatur, die die Illusion untersucht, kann mit einer erfolgreichen Intelligenzprobe (Untersuchen) gegen DC 10 ihre wahre Natur erkennen.`;
        } else {
            results.message = `Du erschaffst ein illusionäres Geräusch von "${illusion.sound}", das für 1 Minute bestehen bleibt. Jede Kreatur, die das Geräusch untersucht, kann mit einer erfolgreichen Intelligenzprobe (Untersuchen) gegen DC 10 seine wahre Natur erkennen.`;
        }

        return results;
    }

    /**
     * Implementierung des Poison Spray-Zaubers (Giftnebel)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castPoisonSpray(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'poison_spray',
            caster: caster.id,
            targets: [],
            message: "Du streckst deine Hand aus und entfesselst eine Wolke giftigen Gases."
        };

        // Poison Spray kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Constitution-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W12 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W12 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W12 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W12 auf Level 5-10
        }

        if (!saveResult.success) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 12) + 1; // 1W12
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.POISON);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: false
            });

            results.message = `${target.name} kann der Giftwolke nicht ausweichen und erleidet ${damageResult.damage} Giftschaden.`;
        } else {
            // Rettungswurf erfolgreich, kein Schaden
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: 0,
                success: true
            });

            results.message = `${target.name} weicht der Giftwolke aus und erleidet keinen Schaden.`;
        }

        return results;
    }

    /**
     * Implementierung des Ray of Frost-Zaubers (Strahl der Kälte)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castRayOfFrost(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'ray_of_frost',
            caster: caster.id,
            targets: [],
            message: "Du schießt einen Strahl eisiger Kälte."
        };

        // Ray of Frost kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W8 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W8 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W8 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W8 auf Level 5-10
        }

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.COLD);

            // Erstelle den Verlangsamungseffekt
            const effect = {
                id: `ray_of_frost_${Date.now()}`,
                name: "Strahl der Kälte",
                description: "Bewegungsrate um 10 Fuß reduziert.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    // Reduziere die Bewegungsrate
                    target.originalSpeed = target.originalSpeed || target.speed;
                    target.speed = Math.max(5, target.originalSpeed - 10); // Minimum 5 Fuß
                },
                onRemove: (target, gameState) => {
                    // Stelle die Bewegungsrate wieder her
                    if (target.originalSpeed) {
                        target.speed = target.originalSpeed;
                        target.originalSpeed = undefined;
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                effect: effect.name
            });

            let message = `Der Strahl der Kälte trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Kälteschaden. Die Bewegungsrate des Ziels ist bis zum Beginn deines nächsten Zuges um 10 Fuß reduziert.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der Strahl der Kälte verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Shocking Grasp-Zaubers (Schockgriff)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castShockingGrasp(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'shocking_grasp',
            caster: caster.id,
            targets: [],
            message: "Blitzende Energie umgibt deine Hand."
        };

        // Shocking Grasp kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Prüfe, ob das Ziel Metallrüstung trägt, falls ja, mit Vorteil angreifen
        const wearingMetal = target.armor && target.armor.properties && target.armor.properties.includes('metal');
        const hasAdvantage = wearingMetal;

        // Würfle für den Angriff (mit Vorteil, wenn das Ziel Metall trägt)
        let attackRoll1 = Math.floor(Math.random() * 20) + 1;
        let attackRoll2 = Math.floor(Math.random() * 20) + 1;

        const attackRoll = hasAdvantage ? Math.max(attackRoll1, attackRoll2) : attackRoll1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W8 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W8 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W8 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W8 auf Level 5-10
        }

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.LIGHTNING);

            // Erstelle den Effekt für keine Reaktionen
            const effect = {
                id: `shocking_grasp_${Date.now()}`,
                name: "Schockgriff",
                description: "Kann keine Reaktionen nutzen.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    target.canUseReactions = false;
                },
                onRemove: (target, gameState) => {
                    target.canUseReactions = true;
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hasAdvantage: hasAdvantage,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                effect: effect.name
            });

            let message = `Der Schockgriff trifft ${target.name}`;
            if (hasAdvantage) {
                message += " (mit Vorteil, da das Ziel Metall trägt)";
            }
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Blitzschaden. Das Ziel kann bis zum Beginn seines nächsten Zuges keine Reaktionen nutzen.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hasAdvantage: hasAdvantage,
                hits: false
            });

            results.message = `Der Schockgriff verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Sacred Flame-Zaubers (Heilige Flamme)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castSacredFlame(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'sacred_flame',
            caster: caster.id,
            targets: [],
            message: "Flammenähnliche Strahlung steigt von dir herab."
        };

        // Sacred Flame kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Sacred Flame ignoriert Deckung

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Dexterity-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W8 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W8 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W8 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W8 auf Level 5-10
        }

        if (!saveResult.success) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Untote und Teufel sind besonders anfällig für diesen Zauber
            if (target.type === 'undead' || target.type === 'fiend') {
                damage = Math.floor(damage * 1.5); // 50% mehr Schaden
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.RADIANT);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: false,
                vulnerableType: (target.type === 'undead' || target.type === 'fiend') ? target.type : null
            });

            let message = `${target.name} kann der heiligen Flamme nicht ausweichen und erleidet ${damageResult.damage} Strahlenschaden.`;
            if (target.type === 'undead' || target.type === 'fiend') {
                message += " Da das Ziel ein(e) " + (target.type === 'undead' ? "Untote(r)" : "Teufel") + " ist, erleidet es erhöhten Schaden.";
            }

            results.message = message;
        } else {
            // Rettungswurf erfolgreich, kein Schaden
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: 0,
                success: true
            });

            results.message = `${target.name} weicht der heiligen Flamme aus und erleidet keinen Schaden.`;
        }

        return results;
    }

    /**
 * Implementierung des Guidance-Zaubers (Führung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
 * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castGuidance(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'guidance',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine willige Kreatur und bietest Führung an."
        };

        // Guidance kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Guidance erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `guidance_${Date.now()}`,
            name: "Führung",
            description: "Das Ziel kann 1W4 zu einem Attributswurf seiner Wahl hinzufügen.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            usedUp: false,
            onApply: (target, gameState) => {
                target.guidanceBonus = true;
            },
            onRemove: (target, gameState) => {
                delete target.guidanceBonus;
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'guidance',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: [target.id],
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, effect.id);
            }
        });

        results.targets.push({
            id: target.id,
            effect: effect.name
        });

        results.message = `Du berührst ${target.name}, das nun für die nächste Minute zu einem Attributswurf seiner Wahl 1W4 hinzufügen kann, solange du dich konzentrierst. Der Bonus endet, nachdem er einmal angewendet wurde oder die Zauber-Dauer abläuft.`;

        return results;
    }

    /**
     * Implementierung des True Strike-Zaubers (Unfehlbarer Schlag)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castTrueStrike(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'true_strike',
            caster: caster.id,
            targets: [],
            message: "Du streckst deinen Finger auf ein Ziel aus."
        };

        // True Strike kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // True Strike erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt - dieser betrifft den Zauberwirker, nicht das Ziel
        const effect = {
            id: `true_strike_${Date.now()}`,
            name: "Unfehlbarer Schlag",
            description: `Vorteil beim ersten Angriffswurf gegen ${target.name} in deinem nächsten Zug.`,
            duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
            targetId: target.id,
            onApply: (caster, gameState) => {
                if (!caster.trueStrikeTargets) caster.trueStrikeTargets = [];
                caster.trueStrikeTargets.push(target.id);
            },
            onRemove: (caster, gameState) => {
                if (caster.trueStrikeTargets) {
                    caster.trueStrikeTargets = caster.trueStrikeTargets.filter(id => id !== target.id);
                    if (caster.trueStrikeTargets.length === 0) {
                        delete caster.trueStrikeTargets;
                    }
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu (nicht zum Ziel)
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'true_strike',
            startTime: Date.now(),
            duration: 6000, // 1 Runde
            targets: [target.id],
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.targets.push({
            id: target.id,
            effect: effect.name
        });

        results.message = `Du erhältst magische Einsicht in die Verteidigung von ${target.name}. In deinem nächsten Zug hast du Vorteil bei deinem ersten Angriffswurf gegen dieses Ziel.`;

        return results;
    }

    /**
     * Implementierung des Eldritch Blast-Zaubers (Schauriger Strahl)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castEldritchBlast(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'eldritch_blast',
            caster: caster.id,
            targets: [],
            message: "Ein Strahl aus krachender Energie schießt auf dein Ziel zu."
        };

        // Bestimme die Anzahl der Strahlen basierend auf dem Charakterlevel
        const characterLevel = caster.level;
        let numBeams = 1; // 1 Strahl auf Level 1-4

        if (characterLevel >= 17) {
            numBeams = 4; // 4 Strahlen auf Level 17+
        } else if (characterLevel >= 11) {
            numBeams = 3; // 3 Strahlen auf Level 11-16
        } else if (characterLevel >= 5) {
            numBeams = 2; // 2 Strahlen auf Level 5-10
        }

        // Wenn nicht genug Ziele angegeben wurden, können mehrere Strahlen auf ein Ziel treffen
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst mindestens ein Ziel wählen.";
            return results;
        }

        // Verteile die Strahlen auf die Ziele
        // Wenn weniger Ziele als Strahlen vorhanden sind, können einige Ziele mehrfach getroffen werden
        let beamTargets = [];
        for (let i = 0; i < numBeams; i++) {
            if (i < targets.length) {
                beamTargets.push(targets[i]);
            } else {
                // Wenn mehr Strahlen als Ziele, wähle zufällig ein bereits ausgewähltes Ziel
                const randomIndex = Math.floor(Math.random() * targets.length);
                beamTargets.push(targets[randomIndex]);
            }
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Prüfe auf Hexenmeister-Invokationen (vereinfacht)
        const hasAgonizingBlast = caster.class === 'warlock' && caster.invocations && caster.invocations.includes('agonizing_blast');
        const hasRepellingBlast = caster.class === 'warlock' && caster.invocations && caster.invocations.includes('repelling_blast');

        let charismaModifier = 0;
        if (hasAgonizingBlast) {
            charismaModifier = Math.floor((caster.abilities.charisma - 10) / 2);
        }

        // Für jeden Strahl, führe einen separaten Angriff durch
        beamTargets.forEach((target, index) => {
            // Würfle für den Angriff
            const attackRoll = Math.floor(Math.random() * 20) + 1;
            const attackTotal = attackRoll + attackBonus;
            const isCritical = attackRoll === 20;

            // Prüfe, ob der Angriff trifft
            const hits = isCritical || (attackTotal >= target.armorClass);

            if (hits) {
                // Berechne Schaden: 1d10
                let damage = Math.floor(Math.random() * 10) + 1;

                // Bei kritischem Treffer verdoppeln wir den Würfelschaden
                if (isCritical) {
                    damage += Math.floor(Math.random() * 10) + 1;
                }

                // Füge Charisma-Modifikator hinzu, wenn Agonizing Blast vorhanden
                if (hasAgonizingBlast) {
                    damage += charismaModifier;
                }

                // Füge Schaden zu
                const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FORCE);

                // Anwendung von Repelling Blast, falls vorhanden
                if (hits && hasRepellingBlast) {
                    // Schiebe das Ziel 10 Fuß zurück
                    if (target.position && this.gameState.moveCreature) {
                        const direction = {
                            x: target.position.x - caster.position.x,
                            y: target.position.y - caster.position.y
                        };
                        // Normalisiere den Vektor
                        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                        if (length > 0) {
                            direction.x = direction.x / length;
                            direction.y = direction.y / length;
                        }
                        // Bewege 2 Felder zurück (10 Fuß)
                        const newPosition = {
                            x: target.position.x + Math.round(direction.x * 2),
                            y: target.position.y + Math.round(direction.y * 2)
                        };
                        this.gameState.moveCreature(target.id, newPosition);
                    }
                }

                results.targets.push({
                    id: target.id,
                    beamIndex: index,
                    attackRoll: attackRoll,
                    attackTotal: attackTotal,
                    hits: hits,
                    critical: isCritical,
                    damage: damageResult.damage,
                    pushed: hasRepellingBlast
                });
            } else {
                // Angriff verfehlt
                results.targets.push({
                    id: target.id,
                    beamIndex: index,
                    attackRoll: attackRoll,
                    attackTotal: attackTotal,
                    hits: false
                });
            }
        });

        // Erstelle die Ergebnismeldung
        const hitTargets = results.targets.filter(t => t.hits);
        const missTargets = results.targets.filter(t => !t.hits);

        if (numBeams === 1) {
            if (hitTargets.length === 1) {
                results.message = `Der schaurige Strahl trifft ${targets[0].name} und verursacht ${hitTargets[0].damage} Kraftschaden.`;
                if (hitTargets[0].pushed) {
                    results.message += " Das Ziel wird 10 Fuß zurückgestoßen.";
                }
            } else {
                results.message = `Der schaurige Strahl verfehlt ${targets[0].name}.`;
            }
        } else {
            results.message = `Du schießt ${numBeams} schaurige Strahlen ab. `;
            if (hitTargets.length > 0) {
                const totalDamage = hitTargets.reduce((sum, t) => sum + t.damage, 0);
                results.message += `${hitTargets.length} treffen und verursachen insgesamt ${totalDamage} Kraftschaden.`;
                if (hitTargets.some(t => t.pushed)) {
                    const pushedCount = hitTargets.filter(t => t.pushed).length;
                    results.message += ` ${pushedCount} Ziel(e) werden 10 Fuß zurückgestoßen.`;
                }
            }
            if (missTargets.length > 0) {
                results.message += ` ${missTargets.length} Strahlen verfehlen ihr Ziel.`;
            }
        }

        return results;
    }

    /**
     * Implementierung des Vicious Mockery-Zaubers (Verhöhnung)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots (immer 0 für Cantrips)
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castViciousMockery(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'vicious_mockery',
            caster: caster.id,
            targets: [],
            message: "Du überschüttest dein Ziel mit einer Tirade von Beleidigungen."
        };

        // Vicious Mockery kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel dich hören kann
        if (target.conditions && target.conditions.includes(CONDITIONS.DEAFENED)) {
            results.success = false;
            results.message = `${target.name} ist taub und kann deine Beleidigungen nicht hören.`;
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Wisdom-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

        // Berechne den Schaden basierend auf dem Level des Zauberwirkers
        const characterLevel = caster.level;
        let damageDice = 1; // 1W4 auf Level 1-4

        if (characterLevel >= 17) {
            damageDice = 4; // 4W4 auf Level 17+
        } else if (characterLevel >= 11) {
            damageDice = 3; // 3W4 auf Level 11-16
        } else if (characterLevel >= 5) {
            damageDice = 2; // 2W4 auf Level 5-10
        }

        if (!saveResult.success) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 4) + 1; // 1W4
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.PSYCHIC);

            // Erstelle den Nachteil-Effekt
            const effect = {
                id: `vicious_mockery_${Date.now()}`,
                name: "Verhöhnung",
                description: "Nachteil beim nächsten Angriffswurf vor dem Ende deines nächsten Zuges.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    if (!target.disadvantageOnNextAttack) target.disadvantageOnNextAttack = true;
                },
                onRemove: (target, gameState) => {
                    if (target.disadvantageOnNextAttack) delete target.disadvantageOnNextAttack;
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                effect: effect.name,
                success: false
            });

            // Generiere eine zufällige Beleidigung
            const insults = [
                "Du kämpfst wie ein Bauer!",
                "Deine Mutter war ein Hamster und dein Vater roch nach Holunderbeeren!",
                "Ich habe schon Kühe mit mehr Anmut gesehen!",
                "Bist du so hässlich geboren oder hast du dafür trainiert?",
                "Du bist so langsam, dass eine Schnecke dich überholen würde!",
                "Selbst ein Kobold hätte mehr Verstand als du!"
            ];
            const insult = insults[Math.floor(Math.random() * insults.length)];

            results.message = `Du rufst "${insult}" und ${target.name} erleidet ${damageResult.damage} psychischen Schaden durch deine Verhöhnung. Das Ziel hat Nachteil beim nächsten Angriffswurf vor dem Ende deines nächsten Zuges.`;
        } else {
            // Rettungswurf erfolgreich
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            results.message = `${target.name} widersteht deinen Beleidigungen mit einem erfolgreichen Weisheitswurf.`;
        }

        return results;
    }
    // Zauber Grad 1
    /**
   * Implementierung des Animal Friendship-Zaubers (Tierfreundschaft)
   * @param {Object} caster - Der Zaubercharakter
   * @param {Array} targets - Ziele des Zaubers (Tiere mit Intelligenz 3 oder weniger)
   * @param {number} slotLevel - Level des verwendeten Slots
   * @param {Object} options - Zusätzliche Optionen
   * @returns {Object} - Ergebnis des Zaubers
   */
    _castAnimalFriendship(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'animal_friendship',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, ein Tier zu bezaubern."
        };

        // Überprüfe die Anzahl der möglichen Ziele basierend auf Slot-Level
        const maxTargets = slotLevel; // 1 Tier pro Slot-Level

        // Überprüfe jedes Ziel
        let validTargets = [];
        for (const target of targets) {
            // Prüfe, ob es sich um ein Tier handelt
            if (target.type !== 'beast') {
                results.targets.push({
                    id: target.id,
                    valid: false,
                    reason: "Kein Tier"
                });
                continue;
            }

            // Prüfe die Intelligenz
            if ((target.abilities?.intelligence || 0) > 3) {
                results.targets.push({
                    id: target.id,
                    valid: false,
                    reason: "Intelligenz zu hoch"
                });
                continue;
            }

            validTargets.push(target);

            // Begrenze auf maximale Anzahl
            if (validTargets.length >= maxTargets) {
                break;
            }
        }

        // Wenn keine gültigen Ziele vorhanden sind
        if (validTargets.length === 0) {
            results.success = false;
            results.message = "Keine gültigen Ziele für Tierfreundschaft gefunden.";
            return results;
        }

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Für jedes gültige Ziel: Führe einen Wisdom-Saving Throw durch
        validTargets.forEach(target => {
            const saveDC = this.calculateSpellSaveDC(caster);
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Bezauberungseffekt
                const effect = {
                    id: `animal_friendship_${Date.now()}_${target.id}`,
                    name: "Tierfreundschaft",
                    description: "Das Tier ist bezaubert.",
                    duration: 86400000, // 24 Stunden = 86400 Sekunden = 86400000ms
                    onApply: (target, gameState) => {
                        target.charmed = target.charmed || [];
                        target.charmed.push(caster.id);
                        target.attitude = 'friendly';
                    },
                    onRemove: (target, gameState) => {
                        if (target.charmed) {
                            target.charmed = target.charmed.filter(id => id !== caster.id);
                            if (target.charmed.length === 0) {
                                delete target.charmed;
                            }
                        }
                        // Einstellung wird nicht automatisch zurückgesetzt
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: effect.name
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const charmedCount = results.targets.filter(t => !t.success).length;
        if (charmedCount > 0) {
            results.message = `Du bezauberst ${charmedCount} Tier(e) für 24 Stunden.`;
            if (charmedCount < validTargets.length) {
                results.message += ` ${validTargets.length - charmedCount} Tier(e) widerstehen dem Zauber.`;
            }
        } else {
            results.message = "Alle Tiere widerstehen deinem Zauber.";
        }

        return results;
    }

    /**
     * Implementierung des Armor of Agathys-Zaubers (Rüstung des Agathys)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castArmorOfAgathys(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'armor_of_agathys',
            caster: caster.id,
            message: "Eine schützende magische Kraft umgibt dich."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne temporäre Trefferpunkte basierend auf dem Slot-Level
        const tempHP = slotLevel * 5; // 5 TP pro Slot-Level

        // Füge temporäre Trefferpunkte hinzu (überschreibt bestehende temp TP)
        caster.temporaryHP = tempHP;

        // Berechne Kälteschaden bei Nahkampftreffern
        const coldDamage = slotLevel * 5; // 5 Schaden pro Slot-Level

        // Erstelle den Effekt
        const effect = {
            id: `armor_of_agathys_${Date.now()}`,
            name: "Rüstung des Agathys",
            description: `Verursacht ${coldDamage} Kälteschaden bei Nahkampfangriffen.`,
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            coldDamage: coldDamage,
            onHit: (attacker, target, damageType) => {
                // Nur auslösen bei Nahkampfangriffen und wenn der Zauber noch aktiv ist
                if (damageType === 'melee' && target.temporaryHP > 0) {
                    // Füge dem Angreifer Kälteschaden zu
                    const damageResult = this.applyDamage(attacker, coldDamage, DAMAGE_TYPES.COLD);
                    return {
                        triggered: true,
                        damage: damageResult.damage
                    };
                }
                return { triggered: false };
            },
            onRemove: (target, gameState) => {
                // Entferne temporäre Trefferpunkte, wenn sie von diesem Zauber stammen
                if (target.temporaryHP === tempHP) {
                    target.temporaryHP = 0;
                }
            }
        };

        // Registriere den Effekt als "onHitEffect"
        if (!caster.onHitEffects) {
            caster.onHitEffects = [];
        }
        caster.onHitEffects.push(effect);

        // Füge den Effekt zum Caster hinzu
        this.addEffect(caster, effect);

        results.tempHP = tempHP;
        results.coldDamage = coldDamage;
        results.effect = effect.name;
        results.duration = "1 Stunde";

        results.message = `Eine schützende Schicht aus magischem Frost umgibt dich und gewährt dir ${tempHP} temporäre Trefferpunkte. Solange du diese temporären Trefferpunkte hast, verursacht der Frost ${coldDamage} Kälteschaden bei jedem Wesen, das dich mit einem Nahkampfangriff trifft.`;

        return results;
    }

    /**
     * Implementierung des Arms of Hadar-Zaubers (Arme des Hadar)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castArmsOfHadar(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'arms_of_hadar',
            caster: caster.id,
            targets: [],
            message: "Tentakel aus dunkler Energie brechen aus dir heraus."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Finde alle Kreaturen im Umkreis von 10 Fuß
        const targets = this.gameState.getEntitiesInRadius(caster.position, 2); // 2 Kacheln = 10 Fuß

        // Filtere den Zauberwirker selbst heraus
        const validTargets = targets.filter(entity =>
            entity.id !== caster.id && entity.isCreature
        );

        if (validTargets.length === 0) {
            results.message = "Es befinden sich keine Kreaturen in Reichweite der schwarzen Tentakel.";
            return results;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W6 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Strength-Saving Throw durch
        validTargets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.STRENGTH, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            if (!saveResult.success) {
                // Füge vollen Schaden zu
                const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.NECROTIC);

                // Erstelle den "keine Reaktionen"-Effekt
                const effect = {
                    id: `arms_of_hadar_no_reaction_${Date.now()}_${target.id}`,
                    name: "Keine Reaktionen",
                    description: "Kann keine Reaktionen ausführen.",
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    onApply: (target, gameState) => {
                        target.canUseReactions = false;
                    },
                    onRemove: (target, gameState) => {
                        target.canUseReactions = true;
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: damageResult.damage,
                    success: false,
                    effect: effect.name
                });
            } else {
                // Rettungswurf erfolgreich, halber Schaden
                const halvedDamage = Math.floor(damage / 2);
                const damageResult = this.applyDamage(target, halvedDamage, DAMAGE_TYPES.NECROTIC);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: damageResult.damage,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const failedCount = results.targets.filter(t => !t.success).length;
        if (failedCount > 0) {
            results.message = `Schwarze Tentakel greifen nach ${results.targets.length} Kreatur(en) in deiner Nähe. ${failedCount} können nicht entkommen und können bis zu ihrem nächsten Zug keine Reaktionen ausführen.`;
        } else {
            results.message = `Schwarze Tentakel greifen nach ${results.targets.length} Kreatur(en) in deiner Nähe, aber alle können zum Teil entkommen.`;
        }

        return results;
    }

    /**
     * Implementierung des Bane-Zaubers (Fluch)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castBane(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'bane',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, deine Gegner mit einem Fluch zu belegen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bane erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = 3 + (slotLevel - 1); // 3 Ziele bei Level 1, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets) {
            targets = targets.slice(0, maxTargets);
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Charisma-Saving Throw durch
        const affectedTargets = [];
        targets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CHARISMA, saveDC);

            if (!saveResult.success) {
                // Erstelle den Malus-Effekt
                const effect = {
                    id: `bane_${Date.now()}_${target.id}`,
                    name: "Fluch",
                    description: "Das Ziel muss bei jedem Angriffswurf oder Rettungswurf 1W4 von seinem Ergebnis abziehen.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    onAttackRoll: (attackRoll) => {
                        const penalty = Math.floor(Math.random() * 4) + 1; // 1W4
                        return Math.max(1, attackRoll - penalty); // Mindestens 1
                    },
                    onSavingThrow: (savingThrow) => {
                        const penalty = Math.floor(Math.random() * 4) + 1; // 1W4
                        return Math.max(1, savingThrow - penalty); // Mindestens 1
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: effect.name
                });

                affectedTargets.push(target.id);
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration, wenn mindestens ein Ziel betroffen ist
        if (affectedTargets.length > 0) {
            this.concentrationManager.startConcentration(caster.id, {
                id: 'bane',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: affectedTargets,
                onEnd: () => {
                    // Effekte werden automatisch durch den ConcentrationManager entfernt
                }
            });
        }

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedTargets.length;
        if (affectedCount > 0) {
            results.message = `Du belegst ${affectedCount} Ziel(e) mit einem Fluch für die nächste Minute, solange du dich konzentrierst. Die betroffenen Ziele müssen bei jedem Angriffswurf oder Rettungswurf 1W4 von ihrem Wurf abziehen.`;
            if (affectedCount < targets.length) {
                results.message += ` ${targets.length - affectedCount} Ziel(e) widerstehen dem Zauber.`;
            }
        } else {
            results.message = "Alle Ziele widerstehen deinem Fluch.";
        }

        return results;
    }

    /**
     * Implementierung des Bless-Zaubers (Segen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castBless(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'bless',
            caster: caster.id,
            targets: [],
            message: "Du segnest deine Verbündeten mit göttlicher Gunst."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bless erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = 3 + (slotLevel - 1); // 3 Ziele bei Level 1, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets) {
            targets = targets.slice(0, maxTargets);
        }

        // Für jedes Ziel: Wende den Segen an
        const affectedTargets = [];
        targets.forEach(target => {
            // Erstelle den Bonus-Effekt
            const effect = {
                id: `bless_${Date.now()}_${target.id}`,
                name: "Segen",
                description: "Das Ziel kann bei jedem Angriffswurf oder Rettungswurf 1W4 zu seinem Ergebnis addieren.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                onAttackRoll: (attackRoll) => {
                    const bonus = Math.floor(Math.random() * 4) + 1; // 1W4
                    return attackRoll + bonus;
                },
                onSavingThrow: (savingThrow) => {
                    const bonus = Math.floor(Math.random() * 4) + 1; // 1W4
                    return savingThrow + bonus;
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                effect: effect.name
            });

            affectedTargets.push(target.id);
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'bless',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: affectedTargets,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du segnest ${affectedTargets.length} Verbündete für die nächste Minute, solange du dich konzentrierst. Die gesegneten Ziele können bei jedem Angriffswurf oder Rettungswurf 1W4 zu ihrem Wurf addieren.`;

        return results;
    }

    /**
 * Implementierung des Burning Hands-Zaubers (Brennende Hände)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} direction - Richtung des Kegels
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBurningHands(caster, direction, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'burning_hands',
            caster: caster.id,
            targets: [],
            message: "Du hältst deine Hände mit aneinanderliegenden Daumen vor dich und ein dünner Feuerschleier schießt aus deinen ausgestreckten Fingern hervor."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme den 15-Fuß-Kegel (3 Felder) vor dem Zauberwirker
        const targetsInCone = this.gameState.getEntitiesInCone(
            caster.position,
            direction,
            3, // 15 Fuß = 3 Felder
            60 // 60-Grad-Winkel für einen Kegel
        );

        // Filtere Kreaturen
        const validTargets = targetsInCone.filter(entity => entity.isCreature && entity.id !== caster.id);

        if (validTargets.length === 0) {
            results.message = "Der Feuerkegel trifft keine Kreaturen.";
            return results;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W6 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        validTargets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

            // Prüfe, ob brennbare Objekte in Flammen aufgehen
            const isFlammable = target.traits?.includes('flammable') || false;

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success,
                isFlammable: isFlammable
            });

            // Setze brennbare Objekte in Brand
            if (isFlammable && !target.isCreature) {
                // Hier könnte ein Feuereffekt implementiert werden
            }
        });

        // Formatiere die Ergebnismeldung
        const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
        const savedCount = results.targets.filter(t => t.success).length;

        results.message = `Ein Kegel aus Flammen schießt aus deinen Händen und trifft ${results.targets.length} Kreatur(en), was insgesamt ${totalDamage} Feuerschaden verursacht.`;
        if (savedCount > 0) {
            results.message += ` ${savedCount} Kreatur(en) konnten teilweise ausweichen und erleiden nur halben Schaden.`;
        }

        // Brennbare Gegenstände im Bereich, die nicht getragen werden, gehen in Flammen auf
        results.message += " Brennbare Gegenstände im Bereich, die nicht getragen werden, gehen in Flammen auf.";

        return results;
    }

    /**
     * Implementierung des Charm Person-Zaubers (Person bezaubern)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (Humanoide)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castCharmPerson(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'charm_person',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, eine oder mehrere humanoide Kreaturen zu bezaubern."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = slotLevel; // 1 Ziel bei Level 1, +1 pro höherem Level

        // Validiere und begrenze die Anzahl der Ziele
        let validTargets = [];
        for (const target of targets) {
            // Prüfe, ob es sich um einen Humanoiden handelt
            if (target.type !== 'humanoid') {
                results.targets.push({
                    id: target.id,
                    valid: false,
                    reason: "Kein Humanoid"
                });
                continue;
            }

            // Prüfe, ob das Ziel dich im Kampf bekämpft
            const isInCombatWithCaster = target.inCombatWith && target.inCombatWith.includes(caster.id);

            validTargets.push({
                target: target,
                disadvantage: isInCombatWithCaster
            });

            // Begrenze auf maximale Anzahl
            if (validTargets.length >= maxTargets) {
                break;
            }
        }

        // Wenn keine gültigen Ziele vorhanden sind
        if (validTargets.length === 0) {
            results.success = false;
            results.message = "Keine gültigen Ziele für Person bezaubern gefunden.";
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes gültige Ziel: Führe einen Wisdom-Saving Throw durch
        validTargets.forEach(({ target, disadvantage }) => {
            const saveOptions = { disadvantage: disadvantage };
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC, saveOptions);

            if (!saveResult.success) {
                // Erstelle den Bezauberungseffekt
                const effect = {
                    id: `charm_person_${Date.now()}_${target.id}`,
                    name: "Person bezaubern",
                    description: "Das Ziel ist von dir bezaubert.",
                    duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
                    onApply: (target, gameState) => {
                        target.charmed = target.charmed || [];
                        target.charmed.push(caster.id);
                        target.attitude = target.originalAttitude || target.attitude; // Speichere ggf. die ursprüngliche Einstellung
                        target.originalAttitude = target.attitude;
                        target.attitude = 'friendly';
                    },
                    onRemove: (target, gameState) => {
                        if (target.charmed) {
                            target.charmed = target.charmed.filter(id => id !== caster.id);
                            if (target.charmed.length === 0) {
                                delete target.charmed;
                            }
                        }

                        // Stelle die ursprüngliche Einstellung wieder her, aber merke sich, dass es bezaubert wurde
                        if (target.originalAttitude) {
                            target.attitude = target.originalAttitude;
                            delete target.originalAttitude;
                        }

                        // Das Ziel weiß nun, dass es bezaubert wurde
                        target.knows_charmed_by = target.knows_charmed_by || [];
                        if (!target.knows_charmed_by.includes(caster.id)) {
                            target.knows_charmed_by.push(caster.id);
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: effect.name,
                    disadvantage: disadvantage
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true,
                    disadvantage: disadvantage
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const charmedCount = results.targets.filter(t => !t.success).length;
        if (charmedCount > 0) {
            results.message = `Du bezauberst ${charmedCount} humanoide Kreatur(en) für 1 Stunde. Die betroffenen Ziele betrachten dich als freundliche Bekanntschaft.`;
            if (charmedCount < validTargets.length) {
                results.message += ` ${validTargets.length - charmedCount} Kreatur(en) widerstehen dem Zauber.`;
            }
            results.message += " Wenn der Zauber endet, wissen die Ziele, dass sie von dir bezaubert wurden.";
        } else {
            results.message = "Alle Ziele widerstehen deinem Bezauberungszauber.";
        }

        return results;
    }

    /**
     * Implementierung des Chromatic Orb-Zaubers (Chromatische Kugel)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen mit Schadenstyp
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castChromaticOrb(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'chromatic_orb',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst eine faustgroße Energiekugel."
        };

        // Prüfe, ob die benötigte Materialkomponente vorhanden ist
        const hasDiamond = caster.components && caster.components.some(c =>
            c.type === 'diamond' && c.value >= 50);

        if (!hasDiamond && !options.ignoreComponents) {
            results.success = false;
            results.message = "Du benötigst einen Diamanten im Wert von mindestens 50 Goldmünzen, um diesen Zauber zu wirken.";
            return results;
        }

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Chromatic Orb kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Bestimme den Schadenstyp
        const validDamageTypes = [
            DAMAGE_TYPES.ACID,
            DAMAGE_TYPES.COLD,
            DAMAGE_TYPES.FIRE,
            DAMAGE_TYPES.LIGHTNING,
            DAMAGE_TYPES.POISON,
            DAMAGE_TYPES.THUNDER
        ];

        let damageType = options.damageType || DAMAGE_TYPES.FIRE; // Standard: Feuer
        if (!validDamageTypes.includes(damageType)) {
            damageType = DAMAGE_TYPES.FIRE;
        }

        // Bestimme die Farbe basierend auf dem Schadenstyp
        const colors = {
            [DAMAGE_TYPES.ACID]: 'grün',
            [DAMAGE_TYPES.COLD]: 'blau',
            [DAMAGE_TYPES.FIRE]: 'rot',
            [DAMAGE_TYPES.LIGHTNING]: 'gelb',
            [DAMAGE_TYPES.POISON]: 'violett',
            [DAMAGE_TYPES.THUNDER]: 'grau'
        };
        const orbColor = colors[damageType] || 'schillernd';

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        if (hits) {
            // Berechne den Schaden basierend auf dem Slot-Level
            const baseDamage = 3; // 3W8 Grundschaden
            const upcastDamage = slotLevel - 1; // +1W8 pro Slot-Level über 1
            let damageDice = baseDamage + upcastDamage;

            // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
            if (isCritical) {
                damageDice *= 2;
            }

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, damageType);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                damageType: damageType
            });

            let message = `Du schleuderst eine ${orbColor}e Energiekugel auf ${target.name}`;
            if (isCritical) {
                message += ", die mit einem kritischen Treffer einschlägt";
            }
            message += ` und ${damageResult.damage} ${this.getDamageTypeName(damageType)}schaden verursacht.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false,
                damageType: damageType
            });

            results.message = `Deine ${orbColor}e Energiekugel verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Hilfsmethode: Liefert den deutschen Namen eines Schadenstyps
     * @param {string} damageType - Der Schadenstyp
     * @returns {string} - Der deutsche Name
     */
    getDamageTypeName(damageType) {
        const names = {
            [DAMAGE_TYPES.ACID]: 'Säure',
            [DAMAGE_TYPES.BLUDGEONING]: 'Wucht',
            [DAMAGE_TYPES.COLD]: 'Kälte',
            [DAMAGE_TYPES.FIRE]: 'Feuer',
            [DAMAGE_TYPES.FORCE]: 'Kraft',
            [DAMAGE_TYPES.LIGHTNING]: 'Blitz',
            [DAMAGE_TYPES.NECROTIC]: 'Nekrotischen',
            [DAMAGE_TYPES.PIERCING]: 'Stich',
            [DAMAGE_TYPES.POISON]: 'Gift',
            [DAMAGE_TYPES.PSYCHIC]: 'Psychischen',
            [DAMAGE_TYPES.RADIANT]: 'Strahlen',
            [DAMAGE_TYPES.SLASHING]: 'Schnitt',
            [DAMAGE_TYPES.THUNDER]: 'Donner'
        };
        return names[damageType] || damageType;
    }

    /**
     * Implementierung des Color Spray-Zaubers (Farbenschauer)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} direction - Richtung des Kegels
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castColorSpray(caster, direction, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'color_spray',
            caster: caster.id,
            targets: [],
            message: "Ein greller Farbenschauer bricht aus deiner Hand hervor."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme den 15-Fuß-Kegel (3 Felder) vor dem Zauberwirker
        const targetsInCone = this.gameState.getEntitiesInCone(
            caster.position,
            direction,
            3, // 15 Fuß = 3 Felder
            60 // 60-Grad-Winkel für einen Kegel
        );

        // Filtere Kreaturen
        const validTargets = targetsInCone.filter(entity => entity.isCreature && entity.id !== caster.id);

        if (validTargets.length === 0) {
            results.message = "Der Farbenschauer trifft keine Kreaturen.";
            return results;
        }

        // Berechne die maximalen Trefferpunkte, die betroffen werden können
        const baseDice = 6; // 6W10 Grundwert
        const upcastDice = (slotLevel - 1) * 2; // +2W10 pro Slot-Level über 1
        const totalDice = baseDice + upcastDice;

        // Würfle die totalen Trefferpunkte
        let totalHitPoints = 0;
        for (let i = 0; i < totalDice; i++) {
            totalHitPoints += Math.floor(Math.random() * 10) + 1; // 1W10
        }

        // Sortiere die Ziele nach aufsteigenden aktuellen Trefferpunkten
        validTargets.sort((a, b) => a.currentHP - b.currentHP);

        // Wende den Effekt auf Ziele an, bis die HP aufgebraucht sind
        let remainingHitPoints = totalHitPoints;
        validTargets.forEach(target => {
            // Prüfe, ob noch genügend HP übrig sind
            if (remainingHitPoints <= 0) {
                results.targets.push({
                    id: target.id,
                    affected: false,
                    reason: "Nicht genug Kapazität"
                });
                return;
            }

            // Prüfe Immunität gegen Geblendet-Zustand
            if (target.immunities && target.immunities.includes(CONDITIONS.BLINDED)) {
                results.targets.push({
                    id: target.id,
                    affected: false,
                    reason: "Immun gegen Blenden"
                });
                return;
            }

            // Prüfe, ob das Ziel bewusstlos ist
            if (target.conditions && target.conditions.includes(CONDITIONS.UNCONSCIOUS)) {
                results.targets.push({
                    id: target.id,
                    affected: false,
                    reason: "Bereits bewusstlos"
                });
                return;
            }

            // Ziehe die HP des Ziels von den verbleibenden HP ab
            remainingHitPoints -= target.currentHP;

            // Erstelle den Blenden-Effekt
            const effect = {
                id: `color_spray_${Date.now()}_${target.id}`,
                name: "Geblendet",
                description: "Das Ziel ist geblendet.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.BLINDED)) {
                        target.conditions.push(CONDITIONS.BLINDED);
                    }
                },
                onRemove: (target, gameState) => {
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c => c !== CONDITIONS.BLINDED);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                affected: true,
                effect: effect.name,
                currentHP: target.currentHP
            });
        });

        // Formatiere die Ergebnismeldung
        const blindedCount = results.targets.filter(t => t.affected).length;

        results.message = `Ein greller Farbenschauer mit einer Kapazität von ${totalHitPoints} Trefferpunkten bricht aus deiner Hand hervor und trifft ${results.targets.length} Kreatur(en) im Kegel.`;

        if (blindedCount > 0) {
            results.message += ` ${blindedCount} Kreatur(en) werden geblendet und können bis zu deinem nächsten Zug nicht sehen.`;
        } else {
            results.message += " Keine der Kreaturen wird geblendet.";
        }

        return results;
    }

    /**
     * Implementierung des Command-Zaubers (Befehl)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen mit Befehl
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castCommand(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'command',
            caster: caster.id,
            targets: [],
            message: "Du sprichst einen Einwort-Befehl aus."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = slotLevel; // 1 Ziel bei Level 1, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets) {
            targets = targets.slice(0, maxTargets);
        }

        // Validiere den Befehl
        const command = options.command || 'approach'; // Standardbefehl: Herantreten
        const validCommands = [
            'approach', // Herantreten
            'drop',     // Fallenlassen
            'flee',     // Fliehen
            'grovel',   // Kriechen
            'halt',     // Anhalten
            // Weitere Befehle könnten hier ergänzt werden
        ];

        if (!validCommands.includes(command)) {
            results.success = false;
            results.message = `Der Befehl "${command}" wird nicht unterstützt. Verwende einen der Standardbefehle.`;
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Wisdom-Saving Throw durch
        targets.forEach(target => {
            // Prüfe, ob das Ziel deine Sprache versteht
            const understandsLanguage = !target.languages ||
                target.languages.some(lang => caster.languages && caster.languages.includes(lang));

            if (!understandsLanguage) {
                results.targets.push({
                    id: target.id,
                    valid: false,
                    reason: "Versteht deine Sprache nicht"
                });
                return;
            }

            // Prüfe, ob das Ziel immun gegen Bezauberung ist
            if (target.immunities && target.immunities.includes('charm')) {
                results.targets.push({
                    id: target.id,
                    valid: false,
                    reason: "Immun gegen Bezauberung"
                });
                return;
            }

            // Führe den Rettungswurf durch
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Befehls-Effekt
                const effect = {
                    id: `command_${Date.now()}_${target.id}`,
                    name: "Befehl",
                    description: `Das Ziel muss dem Befehl "${command}" folgen.`,
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    command: command,
                    onApply: (target, gameState) => {
                        target.commands = target.commands || [];
                        target.commands.push({
                            type: 'command_spell',
                            command: command,
                            casterId: caster.id
                        });
                    },
                    onRemove: (target, gameState) => {
                        if (target.commands) {
                            target.commands = target.commands.filter(cmd =>
                                !(cmd.type === 'command_spell' && cmd.casterId === caster.id));
                            if (target.commands.length === 0) {
                                delete target.commands;
                            }
                        }
                    },
                    // Diese onTick-Funktion wird einmal ausgeführt, wenn das Ziel an der Reihe ist
                    onTick: (target, gameState, deltaTime) => {
                        // Hier würde die eigentliche Befehlsimplementierung erfolgen
                        // Der Code variiert je nach Befehl
                        const commandEffect = target.commands?.find(cmd =>
                            cmd.type === 'command_spell' && cmd.casterId === caster.id);

                        if (!commandEffect) return;

                        // Führe den Befehl aus
                        switch (commandEffect.command) {
                            case 'approach':
                                // Bewege sich auf den kürzesten Weg zum Zauberwirker
                                gameState.moveCreatureTowards(target.id, caster.id, target.speed);
                                break;
                            case 'drop':
                                // Lasse gehaltene Gegenstände fallen
                                if (target.heldItems && target.heldItems.length > 0) {
                                    target.heldItems.forEach(itemId => {
                                        const item = gameState.getEntityById(itemId);
                                        if (item) {
                                            item.carriedBy = null;
                                            item.position = target.position;
                                        }
                                    });
                                    target.heldItems = [];
                                }
                                break;
                            case 'flee':
                                // Fliehe vom Zauberwirker weg
                                gameState.moveCreatureAwayFrom(target.id, caster.id, target.speed);
                                break;
                            case 'grovel':
                                // Krieche und beende seinen Zug
                                target.isProneByCommand = true;
                                if (!target.conditions) target.conditions = [];
                                if (!target.conditions.includes(CONDITIONS.PRONE)) {
                                    target.conditions.push(CONDITIONS.PRONE);
                                }
                                break;
                            case 'halt':
                                // Bleibe stehen (keine Aktion nötig)
                                target.cannotMove = true;
                                break;
                        }

                        // Entferne den Befehl, da er ausgeführt wurde
                        this.removeEffect(target, effect.id);
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: effect.name,
                    command: command
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const commandedCount = results.targets.filter(t => !t.success && t.effect).length;
        const commandName = this.getCommandName(command);

        if (commandedCount > 0) {
            results.message = `Du sprichst den Befehl "${commandName}" aus und ${commandedCount} Kreatur(en) müssen ihn in ihrem nächsten Zug befolgen.`;
            if (commandedCount < targets.length) {
                const resistedCount = targets.length - commandedCount;
                results.message += ` ${resistedCount} Kreatur(en) widerstehen dem Zauber.`;
            }
        } else {
            results.message = `Du sprichst den Befehl "${commandName}" aus, aber alle Ziele widerstehen ihm.`;
        }

        return results;
    }

    /**
     * Hilfsmethode: Liefert den deutschen Namen eines Befehls
     * @param {string} command - Der Befehl
     * @returns {string} - Der deutsche Name
     */
    getCommandName(command) {
        const names = {
            'approach': 'Herantreten',
            'drop': 'Fallenlassen',
            'flee': 'Fliehen',
            'grovel': 'Kriechen',
            'halt': 'Anhalten'
        };
        return names[command] || command;
    }

    /**
 * Implementierung des Compelled Duel-Zaubers (Erzwungenes Duell)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCompelledDuel(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'compelled_duel',
            caster: caster.id,
            targets: [],
            message: "Du forderst eine Kreatur zu einem Duell heraus."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Compelled Duel kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Compelled Duel erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Wisdom-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

        if (!saveResult.success) {
            // Erstelle den Duell-Effekt
            const effect = {
                id: `compelled_duel_${Date.now()}`,
                name: "Erzwungenes Duell",
                description: "Das Ziel hat Nachteil bei Angriffen gegen andere Kreaturen als dich und kann sich nicht willentlich mehr als 30 Fuß von dir entfernen.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                challengerId: caster.id,
                onApply: (target, gameState) => {
                    // Speichere den Herausforderer
                    target.duelChallenger = caster.id;

                    // Implementiere Nachteil gegen andere Ziele
                    if (!target.disadvantageTargetsExcept) target.disadvantageTargetsExcept = {};
                    target.disadvantageTargetsExcept[caster.id] = true;
                },
                onRemove: (target, gameState) => {
                    // Entferne den Duelleffekt
                    delete target.duelChallenger;

                    if (target.disadvantageTargetsExcept) {
                        delete target.disadvantageTargetsExcept[caster.id];
                        if (Object.keys(target.disadvantageTargetsExcept).length === 0) {
                            delete target.disadvantageTargetsExcept;
                        }
                    }
                },
                onMove: (target, newPosition, gameState) => {
                    // Prüfe, ob die Bewegung erlaubt ist (nicht weiter als 30 Fuß vom Herausforderer)
                    const challenger = gameState.getEntityById(caster.id);
                    if (!challenger) return true; // Erlaube Bewegung, wenn der Herausforderer nicht mehr existiert

                    const distance = gameState.calculateDistance(challenger.position, newPosition);
                    return distance <= 6; // 30 Fuß = 6 Felder
                },
                onAttack: (attacker, targetId, gameState) => {
                    // Wenn das Ziel jemand anderen als den Herausforderer angreift,
                    // hat es Nachteil bei dem Angriff
                    return targetId !== caster.id ? { disadvantage: true } : {};
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'compelled_duel',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: effect.id,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, effect.id);
                },
                onBroken: (reason) => {
                    // Der Zauber endet auch, wenn der Zauberwirker einen anderen angreift
                    // oder einen schädlichen Zauber auf einen anderen wirkt
                    if (reason === 'attacked_other' || reason === 'harmful_spell_on_other') {
                        this.removeEffect(target, effect.id);
                    }
                }
            });

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: false,
                effect: effect.name
            });

            results.message = `Du forderst ${target.name} zu einem Duell heraus. Das Ziel hat Nachteil bei Angriffen gegen andere Kreaturen als dich und kann sich nicht willentlich mehr als 30 Fuß von dir entfernen, solange du dich konzentrierst.`;
        } else {
            // Rettungswurf erfolgreich, keine Wirkung
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            results.message = `${target.name} widersteht deiner Herausforderung.`;
        }

        return results;
    }

    /**
 * Implementierung des Create or Destroy Water-Zaubers (Wasser erschaffen oder zerstören)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position oder Ziel für den Zauber
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (mode: 'create' oder 'destroy')
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCreateOrDestroyWater(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'create_or_destroy_water',
            caster: caster.id,
            message: ""
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme Modus: erschaffen oder zerstören
        const mode = options.mode || 'create'; // Standardmäßig wird Wasser erschaffen

        // Berechne die Wassermenge basierend auf dem Slot-Level
        const baseAmount = 10; // 10 Gallonen bei Level 1
        const totalAmount = baseAmount * slotLevel; // +10 Gallonen pro Slot-Level

        if (mode === 'create') {
            // Wasser erschaffen - entweder in der Luft als Regen oder in einem offenen Behälter

            const targetType = options.targetType || 'rain'; // 'rain' oder 'container'

            if (targetType === 'rain') {
                // Erschaffe Regen in einem Würfel mit 30 Fuß Kantenlänge
                const rainfallArea = {
                    x: position.x - 3, // 30 Fuß = 6 Felder, zentriert
                    y: position.y - 3,
                    width: 6,
                    height: 6
                };

                // Füge einen Regeneffekt hinzu
                const effect = {
                    id: `rain_${Date.now()}`,
                    name: "Regen",
                    position: position,
                    area: rainfallArea,
                    description: `Ein leichter Regen fällt in einem 30-Fuß-Würfel.`,
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    // Hier könnten spezielle Effekte für Regen implementiert werden
                    // z.B. Löschen kleiner Feuer, Erschaffen von schlammigem Terrain, etc.
                };

                // Füge den Regeneffekt zur Spielwelt hinzu
                this.gameState.addEnvironmentalEffect(effect);

                results.effect = effect;
                results.message = `Du lässt ${totalAmount} Gallonen Wasser als leichten Regen in einem 30-Fuß-Würfel fallen.`;

                // Prüfe auf offene Flammen, die gelöscht werden könnten
                const entitiesInArea = this.gameState.getEntitiesInArea(rainfallArea);
                const fires = entitiesInArea.filter(e => e.type === 'fire' && e.size === 'small');

                if (fires.length > 0) {
                    fires.forEach(fire => {
                        this.gameState.removeEntity(fire.id);
                    });
                    results.message += ` ${fires.length} kleine Feuer wurden gelöscht.`;
                }
            } else if (targetType === 'container') {
                // Erschaffe Wasser in einem offenen Behälter
                const container = this.gameState.getEntityById(options.containerId);

                if (!container) {
                    results.success = false;
                    results.message = "Kein gültiger Behälter gefunden.";
                    return results;
                }

                // Prüfe, ob der Behälter offen ist und Wasser aufnehmen kann
                if (!container.isContainer || container.isClosed) {
                    results.success = false;
                    results.message = "Der Behälter ist nicht offen.";
                    return results;
                }

                // Prüfe die Kapazität des Behälters
                const capacity = container.capacity || 0;
                if (capacity < totalAmount) {
                    results.message = `Der Behälter kann nur ${capacity} Gallonen aufnehmen. Du füllst ihn komplett.`;
                    container.currentContents = { water: capacity };
                } else {
                    results.message = `Du füllst den Behälter mit ${totalAmount} Gallonen Wasser.`;
                    container.currentContents = container.currentContents || {};
                    container.currentContents.water = (container.currentContents.water || 0) + totalAmount;
                }
            }
        } else if (mode === 'destroy') {
            // Wasser zerstören - entweder Nebel oder offenes Wasservorkommen

            const targetType = options.targetType || 'fog'; // 'fog' oder 'water'

            if (targetType === 'fog') {
                // Zerstöre Nebel in einem Würfel mit 30 Fuß Kantenlänge
                const fogArea = {
                    x: position.x - 3, // 30 Fuß = 6 Felder, zentriert
                    y: position.y - 3,
                    width: 6,
                    height: 6
                };

                // Entferne Nebel/Dunst-Effekte im Bereich
                const removedEffects = this.gameState.removeEnvironmentalEffectsByType(fogArea, 'fog');

                if (removedEffects > 0) {
                    results.message = `Du lässt Nebel in einem 30-Fuß-Würfel verdampfen.`;
                } else {
                    results.message = "Es ist kein Nebel vorhanden, der verdampft werden könnte.";
                }
            } else if (targetType === 'water') {
                // Zerstöre Wasser in einem offenen Behälter oder einer kleinen Wasserfläche
                if (options.containerId) {
                    const container = this.gameState.getEntityById(options.containerId);

                    if (!container) {
                        results.success = false;
                        results.message = "Kein gültiger Behälter oder Wasserfläche gefunden.";
                        return results;
                    }

                    if (container.isContainer && !container.isClosed && container.currentContents && container.currentContents.water) {
                        const waterAmount = Math.min(totalAmount, container.currentContents.water);
                        container.currentContents.water -= waterAmount;

                        if (container.currentContents.water <= 0) {
                            delete container.currentContents.water;
                        }

                        results.message = `Du zerstörst ${waterAmount} Gallonen Wasser im Behälter.`;
                    }
                } else if (options.waterBodyId) {
                    const waterBody = this.gameState.getEntityById(options.waterBodyId);

                    if (!waterBody || waterBody.type !== 'water') {
                        results.success = false;
                        results.message = "Keine gültige Wasserfläche gefunden.";
                        return results;
                    }

                    // Für kleine Wasserflächen (Pfützen, kleine Teiche)
                    if (waterBody.size === 'small') {
                        // Zerstöre einen Teil oder die gesamte Wasserfläche
                        const waterAmount = Math.min(totalAmount, waterBody.volume || 100);
                        waterBody.volume = (waterBody.volume || 100) - waterAmount;

                        if (waterBody.volume <= 0) {
                            this.gameState.removeEntity(waterBody.id);
                            results.message = "Du lässt die Wasserfläche vollständig verdampfen.";
                        } else {
                            const percentRemoved = Math.floor((waterAmount / (waterBody.volume + waterAmount)) * 100);
                            results.message = `Du lässt etwa ${percentRemoved}% des Wassers verdampfen.`;
                        }
                    } else {
                        results.message = "Die Wasserfläche ist zu groß, um einen merklichen Effekt zu erzielen.";
                    }
                } else {
                    results.success = false;
                    results.message = "Kein gültiges Ziel für Wasserzerstörung angegeben.";
                    return results;
                }
            }
        } else {
            results.success = false;
            results.message = `Ungültiger Modus: ${mode}. Wähle 'create' oder 'destroy'.`;
            return results;
        }

        return results;
    }

    /**
 * Implementierung des Cure Wounds-Zaubers (Wunden heilen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCureWounds(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'cure_wounds',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und heilst ihre Wunden."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Cure Wounds kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Prüfe, ob das Ziel konstruiert oder untot ist (dann keine Heilung)
        if (target.type === 'construct' || target.type === 'undead') {
            results.success = false;
            results.message = `${target.name} kann nicht durch diesen Zauber geheilt werden.`;
            return results;
        }

        // Bestimme das Zauberattribut für den Modifikator
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);

        // Berechne die Heilung: 1W8 pro Slot-Level + Zaubermodifikator
        let healing = 0;
        for (let i = 0; i < slotLevel; i++) {
            healing += Math.floor(Math.random() * 8) + 1; // 1W8 pro Slot-Level
        }
        healing += abilityModifier; // Zaubermodifikator hinzufügen

        // Stelle sicher, dass die Heilung mindestens 1 beträgt
        healing = Math.max(1, healing);

        // Wende die Heilung an
        const healingResult = this.applyDamage(target, healing, 'healing');

        results.targets.push({
            id: target.id,
            healing: healingResult.healing,
            initialHP: target.currentHP - healingResult.healing,
            finalHP: target.currentHP
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du berührst ${target.name} und heilst ${healingResult.healing} Trefferpunkte.`;

        return results;
    }
    /**
 * Implementierung des Disguise Self-Zaubers (Selbstverkleidung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (Aussehen der Verkleidung)
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDisguiseSelf(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'disguise_self',
            caster: caster.id,
            message: "Du veränderst dein Erscheinungsbild durch Illusion."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Entferne vorherige Verkleidungseffekte
        const previousDisguise = caster.effects?.find(e => e.id.startsWith('disguise_self_'));
        if (previousDisguise) {
            this.removeEffect(caster, previousDisguise.id);
        }

        // Extrahiere Optionen für die Verkleidung
        const disguiseOptions = options.disguise || {};
        const race = disguiseOptions.race || caster.race;
        const height = disguiseOptions.height || caster.height;
        const weight = disguiseOptions.weight || caster.weight;
        const appearance = disguiseOptions.appearance || "veränderte Version deiner selbst";

        // Überprüfe Größenänderung (maximal 1 Fuß größer oder kleiner)
        const heightDifference = Math.abs((height || 0) - (caster.height || 0));
        if (heightDifference > 1) {
            results.message += " Die Größenänderung ist auf maximal 1 Fuß beschränkt.";
            // Begrenzen auf maximale Änderung
            if (height > caster.height) {
                disguiseOptions.height = caster.height + 1;
            } else {
                disguiseOptions.height = caster.height - 1;
            }
        }

        // Erstelle den Verkleidungseffekt
        const effect = {
            id: `disguise_self_${Date.now()}`,
            name: "Selbstverkleidung",
            description: `Illusorische Verkleidung: ${appearance}`,
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            disguiseDetails: disguiseOptions,
            onApply: (target, gameState) => {
                // Speichere das ursprüngliche Aussehen
                target.originalAppearance = {
                    race: target.displayRace || target.race,
                    height: target.height,
                    weight: target.weight,
                    appearance: target.appearance
                };

                // Wende das neue Aussehen an (nur visuell)
                target.displayRace = disguiseOptions.race;
                target.displayHeight = disguiseOptions.height;
                target.displayWeight = disguiseOptions.weight;
                target.displayAppearance = disguiseOptions.appearance;
            },
            onRemove: (target, gameState) => {
                // Stelle das ursprüngliche Aussehen wieder her
                if (target.originalAppearance) {
                    delete target.displayRace;
                    delete target.displayHeight;
                    delete target.displayWeight;
                    delete target.displayAppearance;
                    delete target.originalAppearance;
                }
            },
            // Funktion zur Prüfung der Illusion
            checkIllusion: (observer) => {
                // DC 10 + Intelligenz-Modifikator für Untersuchung
                const intelligenceMod = Math.floor((caster.abilities.intelligence - 10) / 2);
                const DC = 10 + intelligenceMod;

                // Würfle für Untersuchung
                const investigationRoll = Math.floor(Math.random() * 20) + 1;
                const investigationMod = Math.floor((observer.abilities.intelligence - 10) / 2) +
                    (observer.skillProficiencies.investigation ? observer.proficiencyBonus : 0);
                const investigationTotal = investigationRoll + investigationMod;

                return {
                    success: investigationTotal >= DC,
                    roll: investigationRoll,
                    total: investigationTotal,
                    DC: DC
                };
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Formatiere die Beschreibung der Verkleidung
        let disguiseDescription = "";
        if (race !== caster.race) {
            disguiseDescription += ` Rasse: ${race}.`;
        }
        if (height !== caster.height) {
            const change = height > caster.height ? "größer" : "kleiner";
            disguiseDescription += ` Größe: ${Math.abs(height - caster.height)} Fuß ${change}.`;
        }
        if (appearance) {
            disguiseDescription += ` Aussehen: ${appearance}.`;
        }

        results.effect = effect;
        results.disguise = disguiseOptions;
        results.message = `Du änderst dein Erscheinungsbild für 1 Stunde.${disguiseDescription} Die Illusion hält einer physischen Untersuchung nicht stand.`;

        return results;
    }

    /**
 * Implementierung des Dissonant Whispers-Zaubers (Dissonantes Flüstern)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDissonantWhispers(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'dissonant_whispers',
            caster: caster.id,
            targets: [],
            message: "Du flüsterst eine dissonante Melodie, die nur dein Ziel hören kann."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Dissonant Whispers kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel hören kann
        if (target.conditions && target.conditions.includes(CONDITIONS.DEAFENED)) {
            results.success = false;
            results.message = `${target.name} kann dich nicht hören und ist daher immun gegen diesen Zauber.`;
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Wisdom-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W6 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        let damage = 0;
        // Würfle für den Schaden
        for (let i = 0; i < damageDice; i++) {
            damage += Math.floor(Math.random() * 6) + 1; // 1W6
        }

        if (!saveResult.success) {
            // Füge vollen Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.PSYCHIC);

            // Das Ziel muss wegrennen (sofern es kann)
            let canFlee = target.speed > 0 && !target.conditions?.includes(CONDITIONS.GRAPPLED) &&
                !target.conditions?.includes(CONDITIONS.PARALYZED) &&
                !target.conditions?.includes(CONDITIONS.RESTRAINED) &&
                !target.conditions?.includes(CONDITIONS.STUNNED);

            if (canFlee) {
                // Berechne die Fluchtrichtung (weg vom Zauberwirker)
                const direction = {
                    x: target.position.x - caster.position.x,
                    y: target.position.y - caster.position.y
                };

                // Normalisiere den Vektor
                const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                if (length > 0) {
                    direction.x = direction.x / length;
                    direction.y = direction.y / length;
                }

                // Berechne neue Position (maximale Bewegung)
                const moveDistance = Math.floor(target.speed / 5); // Umrechnung von Fuß in Felder
                const newPosition = {
                    x: target.position.x + Math.round(direction.x * moveDistance),
                    y: target.position.y + Math.round(direction.y * moveDistance)
                };

                // Bewege das Ziel
                const moveResult = this.gameState.moveCreature(target.id, newPosition);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: damageResult.damage,
                    success: false,
                    fled: true,
                    initialPosition: { ...target.position },
                    finalPosition: moveResult.newPosition || target.position
                });
            } else {
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    damage: damageResult.damage,
                    success: false,
                    fled: false
                });
            }

            let message = `${target.name} erleidet ${damageResult.damage} psychischen Schaden von den dissonanten Flüstern`;
            if (canFlee) {
                message += " und flieht in Panik so weit wie möglich von dir weg, wobei Gelegenheitsangriffe ausgelöst werden können.";
            } else {
                message += ", kann aber nicht fliehen.";
            }
            results.message = message;

        } else {
            // Rettungswurf erfolgreich, halber Schaden
            const halvedDamage = Math.floor(damage / 2);
            const damageResult = this.applyDamage(target, halvedDamage, DAMAGE_TYPES.PSYCHIC);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: true,
                fled: false
            });

            results.message = `${target.name} widersteht teilweise den dissonanten Flüstern und erleidet ${damageResult.damage} psychischen Schaden, muss aber nicht fliehen.`;
        }

        return results;
    }

    /**
 * Implementierung des Divine Favor-Zaubers (Göttliche Gunst)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDivineFavor(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'divine_favor',
            caster: caster.id,
            message: "Eine Aura göttlicher Gunst umgibt deine Waffe."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Divine Favor erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `divine_favor_${Date.now()}`,
            name: "Göttliche Gunst",
            description: "Deine Waffenangriffe verursachen zusätzlich 1W4 Strahlenschaden.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Marker für den zusätzlichen Schaden
                target.divineFavor = true;
            },
            onRemove: (target, gameState) => {
                delete target.divineFavor;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Füge 1W4 Strahlenschaden hinzu
                const radiantDamage = Math.floor(Math.random() * 4) + 1; // 1W4
                return {
                    additionalDamage: radiantDamage,
                    damageType: DAMAGE_TYPES.RADIANT
                };
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'divine_favor',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Deine Waffe wird von göttlichem Licht umhüllt. Für die nächste Minute verursachen deine Waffenangriffe zusätzlich 1W4 Strahlenschaden, solange du dich konzentrierst.";

        return results;
    }

    /**
     * Implementierung des Ensnaring Strike-Zaubers (Fesselnder Schlag)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castEnsnaringStrike(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'ensnaring_strike',
            caster: caster.id,
            message: "Deine Waffe wird von rankenden Dornen umschlungen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Ensnaring Strike erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 1; // 1W6 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        // Erstelle den Effekt
        const effect = {
            id: `ensnaring_strike_${Date.now()}`,
            name: "Fesselnder Schlag",
            description: "Bei deinem nächsten erfolgreichen Waffenangriff muss das Ziel einen Stärke-Rettungswurf bestehen oder wird von magischen Ranken gefesselt.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            damageDice: damageDice,
            onApply: (target, gameState) => {
                // Marker für den nächsten Angriff
                target.ensnaringStrikePrepared = true;
            },
            onRemove: (target, gameState) => {
                delete target.ensnaringStrikePrepared;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Verbrauche den Fesselnden Schlag
                delete attacker.ensnaringStrikePrepared;

                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(attacker);

                // Führe einen Stärke-Rettungswurf durch
                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.STRENGTH, saveDC);

                if (!saveResult.success) {
                    // Ziel ist gefesselt
                    const restrainedEffect = {
                        id: `ensnaring_strike_restrained_${Date.now()}_${target.id}`,
                        name: "Von Ranken gefesselt",
                        description: "Das Ziel ist von magischen Ranken gefesselt und erleidet bei Beginn seines Zuges Schaden.",
                        duration: 60000, // 1 Minute
                        damageDice: damageDice,
                        saveDC: saveDC,
                        onApply: (target, gameState) => {
                            // Füge den Gefesselt-Zustand hinzu
                            target.conditions = target.conditions || [];
                            if (!target.conditions.includes(CONDITIONS.RESTRAINED)) {
                                target.conditions.push(CONDITIONS.RESTRAINED);
                            }
                        },
                        onRemove: (target, gameState) => {
                            // Entferne den Gefesselt-Zustand
                            if (target.conditions) {
                                target.conditions = target.conditions.filter(c => c !== CONDITIONS.RESTRAINED);
                                if (target.conditions.length === 0) {
                                    delete target.conditions;
                                }
                            }
                        },
                        onTick: (target, gameState, deltaTime) => {
                            // Verursache Schaden bei Beginn des Zuges
                            if (gameState.isCreatureTurn(target.id)) {
                                let damage = 0;
                                for (let i = 0; i < damageDice; i++) {
                                    damage += Math.floor(Math.random() * 6) + 1; // 1W6 pro Stufe
                                }

                                const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.PIERCING);
                                gameState.addMessage(`${target.name} erleidet ${damageResult.damage} Stichschaden durch die fesselnden Ranken.`);

                                // Erlaubte einen Stärke-Check zum Entkommen
                                const strengthCheck = Math.floor(Math.random() * 20) + 1 + Math.floor((target.abilities.strength - 10) / 2);
                                if (strengthCheck >= saveDC) {
                                    gameState.addMessage(`${target.name} befreit sich aus den Ranken!`);
                                    this.removeEffect(target, restrainedEffect.id);
                                    this.concentrationManager.breakConcentration(attacker.id);
                                }
                            }
                        }
                    };

                    // Füge den Gefesselt-Effekt zum Ziel hinzu
                    this.addEffect(target, restrainedEffect);

                    // Starte Konzentration auf den Gefesselt-Effekt
                    this.concentrationManager.startConcentration(attacker.id, {
                        id: 'ensnaring_strike',
                        startTime: Date.now(),
                        duration: 60000, // 1 Minute
                        targets: [target.id],
                        effectId: restrainedEffect.id,
                        onEnd: () => {
                            // Entferne den Effekt, wenn die Konzentration endet
                            this.removeEffect(target, restrainedEffect.id);
                        }
                    });

                    return {
                        message: `${target.name} wird von magischen Ranken gefesselt!`,
                        saveRoll: saveResult,
                        condition: CONDITIONS.RESTRAINED
                    };
                } else {
                    return {
                        message: `${target.name} entkommt den magischen Ranken.`,
                        saveRoll: saveResult
                    };
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'ensnaring_strike',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Beim nächsten Treffer mit einem Waffenangriff innerhalb der nächsten Minute wird dein Ziel von magischen Ranken umschlungen, sofern es einen Stärke-Rettungswurf nicht besteht. Ein gefesseltes Ziel erleidet bei Beginn seines Zuges Stichschaden und kann als Aktion einen Stärke-Check machen, um sich zu befreien.";

        return results;
    }

    /**
     * Implementierung des Entangle-Zaubers (Verstricken)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für den Bereich des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castEntangle(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'entangle',
            caster: caster.id,
            targets: [],
            message: "Gräser, Ranken und Wurzeln brechen aus dem Boden hervor."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Entangle erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Quadrat = 4x4 Felder)
        const area = {
            x: position.x - 2, // Zentriere das Quadrat auf die Position
            y: position.y - 2,
            width: 4,
            height: 4
        };

        // Erstelle den Terrain-Effekt
        const terrainEffectId = `entangle_terrain_${Date.now()}`;
        const terrainEffect = {
            id: terrainEffectId,
            name: "Verstricktes Gelände",
            description: "Der Boden ist von verstrickenden Pflanzen bedeckt.",
            position: position,
            area: area,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            terrain: {
                type: "difficult",
                description: "Verstrickende Pflanzen"
            },
            // Implementiere hier visuelle Effekte für die Karte
        };

        // Füge den Terrain-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(terrainEffect);

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Strength-Saving Throw durch
        creaturesInArea.forEach(target => {
            // Prüfe, ob das Ziel eine Kreatur ist
            if (!target.isCreature) return;

            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.STRENGTH, saveDC);

            if (!saveResult.success) {
                // Erstelle den Verstrickt-Effekt
                const restrainedEffect = {
                    id: `entangle_restrained_${Date.now()}_${target.id}`,
                    name: "Verstrickt",
                    description: "Das Ziel ist von Pflanzen verstrickt.",
                    duration: 60000, // 1 Minute
                    areaId: terrainEffectId,
                    onApply: (target, gameState) => {
                        // Füge den Gefesselt-Zustand hinzu
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(CONDITIONS.RESTRAINED)) {
                            target.conditions.push(CONDITIONS.RESTRAINED);
                        }
                    },
                    onRemove: (target, gameState) => {
                        // Entferne den Gefesselt-Zustand
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c => c !== CONDITIONS.RESTRAINED);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }
                    },
                    onTick: (target, gameState, deltaTime) => {
                        // Erlaubte einen Stärke-Check zum Entkommen, wenn das Ziel an der Reihe ist
                        if (gameState.isCreatureTurn(target.id)) {
                            // Prüfe, ob sich die Kreatur noch im Bereich befindet
                            if (!gameState.isEntityInArea(target.id, area)) {
                                gameState.addMessage(`${target.name} ist nicht mehr im Bereich des Zaubers und wird befreit.`);
                                this.removeEffect(target, restrainedEffect.id);
                                return;
                            }

                            gameState.addMessage(`${target.name} kann als Aktion einen Stärke-Check (DC ${saveDC}) machen, um sich zu befreien.`);
                        }
                    }
                };

                // Füge den Gefesselt-Effekt zum Ziel hinzu
                this.addEffect(target, restrainedEffect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: restrainedEffect.name
                });
            } else {
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'entangle',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            terrainEffectId: terrainEffectId,
            onEnd: () => {
                // Entferne alle Verstrickt-Effekte und den Terrain-Effekt
                this.gameState.getEntitiesInArea(area).forEach(entity => {
                    const effect = entity.effects?.find(e => e.id.startsWith('entangle_restrained_'));
                    if (effect) {
                        this.removeEffect(entity, effect.id);
                    }
                });

                this.gameState.removeEnvironmentalEffect(terrainEffectId);
            }
        });

        // Formatiere die Ergebnismeldung
        const restrainedCount = results.targets.filter(t => !t.success).length;

        results.message = `Ranken und Wurzeln brechen auf einem Gebiet von 20 Fuß Quadrat aus dem Boden hervor. Das Gebiet wird zu schwierigem Gelände für die Dauer des Zaubers.`;

        if (results.targets.length > 0) {
            results.message += ` ${results.targets.length} Kreatur(en) im Bereich mussten einen Stärke-Rettungswurf machen.`;

            if (restrainedCount > 0) {
                results.message += ` ${restrainedCount} Kreatur(en) konnten nicht entkommen und sind gefesselt. Sie können als Aktion einen Stärke-Check machen, um sich zu befreien.`;
            }
        } else {
            results.message += " Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        return results;
    }

    /**
     * Implementierung des Expeditious Retreat-Zaubers (Behände Flucht)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castExpeditiousRetreat(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'expeditious_retreat',
            caster: caster.id,
            message: "Magische Energie durchströmt deine Beine."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Expeditious Retreat erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `expeditious_retreat_${Date.now()}`,
            name: "Behände Flucht",
            description: "Du kannst in jedem deiner Züge als Bonusaktion sprinten.",
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            onApply: (target, gameState) => {
                target.canDashAsBonus = true;
            },
            onRemove: (target, gameState) => {
                delete target.canDashAsBonus;
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'expeditious_retreat',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Für die nächsten 10 Minuten kannst du in jedem deiner Züge als Bonusaktion sprinten, solange du dich konzentrierst.";

        return results;
    }

    /**
     * Implementierung des Faerie Fire-Zaubers (Feenfeuer)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für den Bereich des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen (Farbe des Feuers)
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFaerieFire(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'faerie_fire',
            caster: caster.id,
            targets: [],
            message: "Schimmerndes Licht umhüllt Kreaturen und Objekte in einem Würfel."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Faerie Fire erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Wähle eine Farbe für das Feenfeuer
        const color = options.color || "bläulich"; // Standardmäßig bläulich
        const validColors = ["rot", "orange", "gelb", "grün", "blau", "lila", "pink"];
        const fireColor = validColors.includes(options.color) ? options.color : "bläulich";

        // Definiere den Bereich (20-Fuß-Würfel = 4x4 Felder)
        const area = {
            x: position.x - 2, // Zentriere den Würfel auf die Position
            y: position.y - 2,
            width: 4,
            height: 4
        };

        // Finde alle Kreaturen und Objekte im Bereich
        const entitiesInArea = this.gameState.getEntitiesInArea(area);
        const creaturesInArea = entitiesInArea.filter(entity => entity.isCreature);

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        const affectedEntities = [];
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            if (!saveResult.success) {
                // Erstelle den Feenfeuer-Effekt
                const faerieFireEffectId = `faerie_fire_${Date.now()}_${target.id}`;
                const faerieFireEffect = {
                    id: faerieFireEffectId,
                    name: "Feenfeuer",
                    description: `Das Ziel ist von ${fireColor}em Licht umhüllt und kann nicht unsichtbar werden. Angriffe gegen das Ziel haben Vorteil.`,
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    color: fireColor,
                    onApply: (target, gameState) => {
                        // Markiere das Ziel als von Feenfeuer betroffen
                        target.faerieFire = true;
                        // Verhindere Unsichtbarkeit
                        target.cannotBeInvisible = true;
                        // Angriffe gegen dieses Ziel haben Vorteil
                        target.disadvantageOnDefense = true;

                        // Füge einen Lichteffekt hinzu
                        gameState.createLight({
                            id: `faerie_fire_light_${target.id}`,
                            attachedTo: target.id,
                            color: this.getFaerieFireColor(fireColor),
                            radius: 2, // 10 Fuß Radius (2 Kacheln)
                            intensity: 'dim'
                        });
                    },
                    onRemove: (target, gameState) => {
                        delete target.faerieFire;
                        delete target.cannotBeInvisible;
                        delete target.disadvantageOnDefense;

                        // Entferne den Lichteffekt
                        gameState.removeLight(`faerie_fire_light_${target.id}`);
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, faerieFireEffect);

                affectedEntities.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: faerieFireEffect.name
                });
            } else {
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'faerie_fire',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: affectedEntities,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedEntities.length;

        results.message = `${fireColor}es Feenfeuer umhüllt einen Würfel mit 20 Fuß Kantenlänge.`;

        if (results.targets.length > 0) {
            results.message += ` ${results.targets.length} Kreatur(en) im Bereich mussten einen Geschicklichkeits-Rettungswurf machen.`;

            if (affectedCount > 0) {
                results.message += ` ${affectedCount} Kreatur(en) sind nun von ${fireColor}em Licht umhüllt, können nicht unsichtbar werden und Angriffswürfe gegen sie haben Vorteil, solange du dich konzentrierst.`;
            }
        } else {
            results.message += " Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        return results;
    }

    /**
     * Hilfsmethode: Liefert die HTML-Farbcodes für Feenfeuer
     * @param {string} colorName - Name der Farbe
     * @returns {string} - HTML-Farbcode
     */
    getFaerieFireColor(colorName) {
        const colors = {
            'rot': '#FF3333',
            'orange': '#FF9933',
            'gelb': '#FFFF33',
            'grün': '#33FF33',
            'blau': '#3333FF',
            'bläulich': '#33CCFF',
            'lila': '#9933FF',
            'pink': '#FF33FF'
        };
        return colors[colorName] || '#33CCFF'; // Standard: bläulich
    }

    /**
 * Implementierung des False Life-Zaubers (Falsches Leben)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castFalseLife(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'false_life',
            caster: caster.id,
            message: "Nekromantische Energie durchströmt deinen Körper."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne temporäre Trefferpunkte basierend auf dem Slot-Level
        const baseTempHP = 4; // 1W4 + 4 Grund-TP
        const upcastTempHP = (slotLevel - 1) * 5; // +5 TP pro Slot-Level über 1

        // Würfle für die temporären Trefferpunkte
        const roll = Math.floor(Math.random() * 4) + 1; // 1W4
        const tempHP = roll + baseTempHP + upcastTempHP;

        // Wenn der Charakter bereits mehr temporäre TP hat, wirkt der Zauber nicht
        if (caster.temporaryHP && caster.temporaryHP >= tempHP) {
            results.success = false;
            results.message = "Du hast bereits mehr temporäre Trefferpunkte als dieser Zauber gewähren würde.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Füge temporäre Trefferpunkte hinzu
        caster.temporaryHP = tempHP;

        // Erstelle den Effekt (nur für Tracking, nicht für mechanische Wirkung)
        const effect = {
            id: `false_life_${Date.now()}`,
            name: "Falsches Leben",
            description: `Gewährt ${tempHP} temporäre Trefferpunkte.`,
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onRemove: (target, gameState) => {
                // Entferne temporäre Trefferpunkte nur, wenn sie noch vom Zauber stammen
                if (target.temporaryHP === tempHP) {
                    target.temporaryHP = 0;
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        results.tempHP = tempHP;
        results.effect = effect.name;
        results.duration = "1 Stunde";

        results.message = `Nekromantische Energie durchströmt deinen Körper und gewährt dir ${tempHP} temporäre Trefferpunkte für 1 Stunde.`;

        return results;
    }

    /**
     * Implementierung des Feather Fall-Zaubers (Federfall)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (bis zu 5 Kreaturen)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFeatherFall(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'feather_fall',
            caster: caster.id,
            targets: [],
            message: "Du sprichst ein Wort der Macht, das den Fall von Kreaturen verlangsamt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Feather Fall kann auf bis zu 5 Kreaturen gewirkt werden
        if (targets.length > 5) {
            targets = targets.slice(0, 5);
            results.message += " (Maximal 5 Ziele möglich)";
        }

        // Prüfe, ob die Ziele fallen
        const fallingTargets = targets.filter(t => t.isFalling);
        if (fallingTargets.length === 0) {
            results.message += " Es werden keine fallenden Kreaturen beeinflusst.";
        }

        // Wende den Effekt auf jedes Ziel an
        targets.forEach(target => {
            const isFalling = target.isFalling || false;

            // Erstelle den Federfall-Effekt
            const effect = {
                id: `feather_fall_${Date.now()}_${target.id}`,
                name: "Federfall",
                description: "Das Ziel fällt sanft wie eine Feder.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                onApply: (target, gameState) => {
                    target.featherFall = true;

                    // Wenn das Ziel gerade fällt, stoppe den Fall-Schaden
                    if (target.isFalling) {
                        target.fallDamage = 0;
                        target.fallSpeed = 10; // Fallgeschwindigkeit auf 60 Fuß pro Runde reduzieren
                    }
                },
                onRemove: (target, gameState) => {
                    delete target.featherFall;
                },
                onStartFalling: (target, gameState) => {
                    // Verhindere Fall-Schaden für neue Stürze während des Zaubers
                    return {
                        fallDamage: 0,
                        fallSpeed: 10 // 60 Fuß pro Runde
                    };
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                effect: effect.name,
                wasFalling: isFalling
            });
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length > 0) {
            const fallingCount = results.targets.filter(t => t.wasFalling).length;
            results.message = `Du lässt ${results.targets.length} Kreatur(en) sanft wie Federn fallen.`;

            if (fallingCount > 0) {
                results.message += ` ${fallingCount} davon waren bereits im Fall und werden vor Schaden bewahrt.`;
            }

            results.message += " Der Effekt hält 1 Minute an oder bis die Ziele landen.";
        } else {
            results.message = "Es wurden keine Ziele für den Federfall ausgewählt.";
        }

        return results;
    }

    /**
     * Implementierung des Find Familiar-Zaubers (Vertrauten finden)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für das Erscheinen des Vertrauten
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen (Typ des Vertrauten)
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFindFamiliar(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'find_familiar',
            caster: caster.id,
            familiar: null,
            message: "Du führst ein einstündiges Ritual durch, um einen Vertrauten zu beschwören."
        };

        // Prüfe, ob die benötigten Materialkomponenten vorhanden sind (10 GP Wert)
        const hasComponents = caster.components && caster.components.some(c =>
            c.value >= 10);

        if (!hasComponents && !options.ignoreComponents) {
            results.success = false;
            results.message = "Du benötigst Materialkomponenten im Wert von 10 Goldmünzen, um diesen Zauber zu wirken.";
            return results;
        }

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Überprüfe, ob der Charakter bereits einen Vertrauten hat
        const existingFamiliar = this.gameState.getEntities()
            .find(e => e.type === 'familiar' && e.masterId === caster.id);

        if (existingFamiliar) {
            // Entferne den existierenden Vertrauten
            this.gameState.removeEntity(existingFamiliar.id);
            results.message = "Du beschwörst einen neuen Vertrauten, der deinen bisherigen Vertrauten ersetzt.";
        }

        // Mögliche Vertrautentypen
        const familiarTypes = [
            'bat', 'cat', 'crab', 'frog', 'hawk', 'lizard', 'octopus',
            'owl', 'poisonous_snake', 'fish', 'rat', 'raven',
            'sea_horse', 'spider', 'weasel'
        ];

        // Wähle den Vertrautentyp
        let familiarType = options.type || 'cat'; // Standardmäßig eine Katze
        if (!familiarTypes.includes(familiarType)) {
            familiarType = 'cat'; // Fallback auf Katze, wenn ungültiger Typ
        }

        // Erstelle den Vertrauten
        const familiarId = `familiar_${Date.now()}`;
        const familiar = this._createFamiliar(familiarType, familiarId, caster.id, position);

        // Füge den Vertrauten zum Spielzustand hinzu
        this.gameState.addEntity(familiar);

        results.familiar = {
            id: familiar.id,
            type: familiar.familiarType,
            name: familiar.name,
            position: familiar.position
        };

        // Formatiere die Ergebnismeldung
        const typeName = this._getFamiliarTypeName(familiarType);
        results.message = `Du beschwörst einen Vertrauten in Form ${typeName}. Du kannst durch seine Sinne wahrnehmen und mit ihm kommunizieren, solange ihr auf dem gleichen Existenzplan seid.`;

        return results;
    }

    /**
     * Hilfsmethode: Erstellt einen Vertrauten basierend auf dem Typ
     * @private
     */
    _createFamiliar(type, id, masterId, position) {
        // Grundattribute, die für alle Vertrauten gleich sind
        const familiar = {
            id: id,
            name: this._getFamiliarTypeName(type),
            type: 'familiar',
            familiarType: type,
            masterId: masterId,
            position: position,
            isCreature: true,
            currentHP: 1,
            maxHP: 1,
            armorClass: 13, // Standardwert, variiert je nach Typ
            abilities: {
                strength: 3,
                dexterity: 15,
                constitution: 8,
                intelligence: 2,
                wisdom: 12,
                charisma: 6
            },
            speed: 6, // 30 Fuß, variiert je nach Typ
            senses: {
                darkvision: 6 // 30 Fuß Dunkelsicht für die meisten
            },
            actions: {
                // Standard-Aktionen für einen Vertrauten
            },
            // Spezielle Methoden für Vertraute
            canDeliverTouchSpell: true,
            canPerceiveThrough: true,
            canCommunicateTelepathically: true,
            canBeTemporarilyDismissed: true,
            canBePermanentlyDismissed: true
        };

        // Spezifische Anpassungen basierend auf dem Typ
        switch (type) {
            case 'bat':
                familiar.speed = 5; // 5 Fuß Gehgeschwindigkeit
                familiar.flySpeed = 6; // 30 Fuß Fluggeschwindigkeit
                familiar.senses.blindsight = 6; // 30 Fuß Blindsicht
                familiar.senses.darkvision = 0; // Keine Dunkelsicht
                familiar.abilities.dexterity = 16;
                break;
            case 'cat':
                familiar.speed = 8; // 40 Fuß
                familiar.abilities.dexterity = 16;
                familiar.skillProficiencies = { perception: true, stealth: true };
                break;
            case 'hawk':
            case 'owl':
                familiar.speed = 2; // 10 Fuß Gehgeschwindigkeit
                familiar.flySpeed = 12; // 60 Fuß Fluggeschwindigkeit
                familiar.abilities.dexterity = 16;
                familiar.skillProficiencies = { perception: true };
                break;
            case 'poisonous_snake':
                familiar.poison = {
                    damage: '1d1',
                    dc: 10,
                    type: 'constitution'
                };
                break;
            // Weitere Typen könnten hier implementiert werden
        }

        return familiar;
    }

    /**
     * Hilfsmethode: Gibt den deutschen Namen eines Vertrautentyps zurück
     * @private
     */
    _getFamiliarTypeName(type) {
        const names = {
            'bat': 'einer Fledermaus',
            'cat': 'einer Katze',
            'crab': 'einer Krabbe',
            'frog': 'eines Frosches',
            'hawk': 'eines Falken',
            'lizard': 'einer Eidechse',
            'octopus': 'eines Oktopus',
            'owl': 'einer Eule',
            'poisonous_snake': 'einer Giftschlange',
            'fish': 'eines Fisches',
            'rat': 'einer Ratte',
            'raven': 'eines Raben',
            'sea_horse': 'eines Seepferdchens',
            'spider': 'einer Spinne',
            'weasel': 'eines Wiesels'
        };
        return names[type] || "eines kleinen Tieres";
    }

    /**
     * Implementierung des Fog Cloud-Zaubers (Nebelwolke)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für das Zentrum der Nebelwolke
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFogCloud(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'fog_cloud',
            caster: caster.id,
            message: "Eine Sphäre aus dichtem Nebel erscheint."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Fog Cloud erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne den Radius basierend auf dem Slot-Level
        const baseRadius = 4; // 20 Fuß Radius bei Level 1
        const upcastRadius = slotLevel - 1; // +5 Fuß pro Slot-Level über 1
        const radius = baseRadius + upcastRadius;

        // Erstelle den Nebel-Effekt
        const fogEffectId = `fog_cloud_${Date.now()}`;
        const fogEffect = {
            id: fogEffectId,
            name: "Nebelwolke",
            description: `Eine Sphäre aus dichtem Nebel mit ${radius * 5} Fuß Radius.`,
            position: position,
            radius: radius,
            duration: 60000, // 1 Stunde = 3600 Sekunden, aber wir verwenden 1 Minute für Konzentration
            onApply: (gameState) => {
                // Füge den Nebel als Umgebungseffekt hinzu
                gameState.createObscuredArea({
                    id: fogEffectId,
                    position: position,
                    radius: radius,
                    type: 'fog',
                    visibility: 'heavily_obscured'
                });
            },
            onRemove: (gameState) => {
                // Entferne den Nebeleffekt
                gameState.removeObscuredArea(fogEffectId);
            }
        };

        // Füge den Nebeleffekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(fogEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'fog_cloud',
            startTime: Date.now(),
            duration: 60000, // 1 Stunde, aber für Konzentration setzen wir es auf 1 Minute
            effectId: fogEffectId,
            onEnd: () => {
                // Entferne den Nebeleffekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(fogEffectId);
            }
        });

        results.effect = fogEffect;
        results.radius = radius * 5; // In Fuß
        results.message = `Eine Sphäre aus dichtem Nebel mit einem Radius von ${radius * 5} Fuß erscheint an der gewählten Position. Der Bereich ist stark verhüllt und die Sicht darin ist blockiert. Der Nebel umgeht Ecken und breitet sich durch offene Türen und Fenster aus, aber nicht durch feste Barrieren. Der Nebel bleibt für 1 Stunde bestehen, solange du dich konzentrierst, oder bis ein starker Wind ihn vertreibt.`;

        return results;
    }

    /**
     * Implementierung des Goodberry-Zaubers (Gute Beere)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castGoodberry(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'goodberry',
            caster: caster.id,
            message: "Du erschaffst magisch infundierte Beeren."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Erstelle 10 Heilbeeren
        const berries = [];
        for (let i = 0; i < 10; i++) {
            const berryId = `goodberry_${Date.now()}_${i}`;

            // Erstelle das Beeren-Item
            const berry = {
                id: berryId,
                name: "Gute Beere",
                description: "Eine magisch infundierte Beere, die 1 Trefferpunkt heilt und für einen Tag genug Nahrung bietet.",
                type: 'item',
                subtype: 'consumable',
                weight: 0.01, // Sehr geringes Gewicht
                expirationTime: Date.now() + 86400000, // 24 Stunden = 86400 Sekunden = 86400000ms
                onConsume: (consumer, gameState) => {
                    // Heile 1 Trefferpunkt
                    const healingResult = this.applyDamage(consumer, 1, 'healing');

                    // Stelle auch Hunger/Durst für einen Tag wieder her
                    if (consumer.hunger !== undefined) consumer.hunger = Math.max(0, consumer.hunger - 100);
                    if (consumer.thirst !== undefined) consumer.thirst = Math.max(0, consumer.thirst - 50);

                    return {
                        message: `${consumer.name} isst eine Gute Beere und erhält ${healingResult.healing} Trefferpunkt.`,
                        healing: healingResult.healing
                    };
                }
            };

            // Füge die Beere dem Inventar des Zauberwirkers hinzu oder lasse sie am Boden erscheinen
            if (options.addToInventory !== false) {
                if (!caster.inventory) caster.inventory = [];
                caster.inventory.push(berry);
            } else {
                // Erstelle die Beere auf dem Boden an der Position des Zauberwirkers
                berry.position = { ...caster.position };
                this.gameState.addEntity(berry);
            }

            berries.push(berryId);
        }

        results.berries = berries;
        results.message = "Du erschaffst 10 Beeren, die mit magischer Energie infundiert sind. Eine Kreatur kann als Aktion eine Beere essen, um 1 Trefferpunkt zu heilen und genug Nahrung für einen Tag zu erhalten. Die Beeren verlieren ihre Wirkung, wenn sie nicht innerhalb von 24 Stunden verzehrt werden.";

        return results;
    }

    /**
     * Implementierung des Guiding Bolt-Zaubers (Leitender Bolzen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castGuidingBolt(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'guiding_bolt',
            caster: caster.id,
            targets: [],
            message: "Ein Strahl gleißenden Lichts schießt auf dein Ziel zu."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Guiding Bolt kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 4; // 4W6 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
        let damageDice = baseDamage + upcastDamage;

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.RADIANT);

            // Erstelle den Vorteil-Effekt für den nächsten Angriff gegen das Ziel
            const guidingEffect = {
                id: `guiding_bolt_${Date.now()}_${target.id}`,
                name: "Leitender Bolzen",
                description: "Der nächste Angriffswurf gegen das Ziel hat Vorteil.",
                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                onApply: (target, gameState) => {
                    if (!target.nextAttackHasAdvantage) target.nextAttackHasAdvantage = true;
                },
                onRemove: (target, gameState) => {
                    delete target.nextAttackHasAdvantage;
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, guidingEffect);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                effect: guidingEffect.name
            });

            let message = `Der leitende Bolzen trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Strahlenschaden. Der nächste Angriffswurf gegen das Ziel vor dem Ende deines nächsten Zuges hat Vorteil.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der leitende Bolzen verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Grease-Zaubers (Schmieren)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für den Bereich des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castGrease(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'grease',
            caster: caster.id,
            targets: [],
            message: "Glitschiges Fett bedeckt den Boden."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Definiere den Bereich (10-Fuß-Quadrat = 2x2 Felder)
        const area = {
            x: position.x - 1, // Zentriere das Quadrat auf die Position
            y: position.y - 1,
            width: 2,
            height: 2
        };

        // Erstelle den Fett-Effekt
        const greaseEffectId = `grease_${Date.now()}`;
        const greaseEffect = {
            id: greaseEffectId,
            name: "Schmieren",
            description: "Der Boden ist mit rutschigem Fett bedeckt.",
            position: position,
            area: area,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            terrain: {
                type: "difficult",
                description: "Rutschiges Fett"
            },
            onApply: (gameState) => {
                // Füge den Fetteffekt als Umgebungseffekt hinzu
                gameState.addDifficultTerrain(greaseEffectId, area, "grease");
            },
            onRemove: (gameState) => {
                // Entferne den Fetteffekt
                gameState.removeDifficultTerrain(greaseEffectId);
            },
            onEnter: (entity, gameState) => {
                // Wenn eine Kreatur das Gebiet betritt, muss sie einen Geschicklichkeits-Rettungswurf machen
                if (entity.isCreature) {
                    const saveDC = this.calculateSpellSaveDC(caster);
                    const saveResult = this.makeSavingThrow(entity, SAVING_THROWS.DEXTERITY, saveDC);

                    if (!saveResult.success) {
                        // Kreatur fällt hin
                        entity.conditions = entity.conditions || [];
                        if (!entity.conditions.includes(CONDITIONS.PRONE)) {
                            entity.conditions.push(CONDITIONS.PRONE);
                        }

                        gameState.addMessage(`${entity.name} rutscht auf dem Fett aus und fällt hin.`);
                    }
                }
            }
        };

        // Füge den Fetteffekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(greaseEffect);

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            if (!saveResult.success) {
                // Kreatur fällt hin
                target.conditions = target.conditions || [];
                if (!target.conditions.includes(CONDITIONS.PRONE)) {
                    target.conditions.push(CONDITIONS.PRONE);
                }

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    condition: CONDITIONS.PRONE
                });
            } else {
                // Rettungswurf erfolgreich
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Timer zum Entfernen des Effekts nach Ablauf der Dauer
        setTimeout(() => {
            this.gameState.removeEnvironmentalEffect(greaseEffectId);
        }, greaseEffect.duration);

        results.effect = greaseEffect;

        // Formatiere die Ergebnismeldung
        if (results.targets.length > 0) {
            const fallenCount = results.targets.filter(t => !t.success).length;

            results.message = `Glitschiges Fett bedeckt den Boden in einem 10-Fuß-Quadrat für 1 Minute. Der Bereich wird zu schwierigem Terrain.`;

            if (fallenCount > 0) {
                results.message += ` ${fallenCount} von ${results.targets.length} Kreatur(en) im Bereich rutschen aus und fallen hin.`;
            } else if (results.targets.length > 0) {
                results.message += ` Alle ${results.targets.length} Kreatur(en) im Bereich konnten das Ausrutschen vermeiden.`;
            }
        } else {
            results.message = "Glitschiges Fett bedeckt den Boden in einem 10-Fuß-Quadrat für 1 Minute. Der Bereich wird zu schwierigem Terrain. Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        return results;
    }

    /**
 * Implementierung des Healing Word-Zaubers (Heilendes Wort)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castHealingWord(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'healing_word',
            caster: caster.id,
            targets: [],
            message: "Du sprichst ein göttliches Wort der Heilung."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Healing Word kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Prüfe, ob das Ziel konstruiert oder untot ist (dann keine Heilung)
        if (target.type === 'construct' || target.type === 'undead') {
            results.success = false;
            results.message = `${target.name} kann nicht durch diesen Zauber geheilt werden.`;
            return results;
        }

        // Bestimme das Zauberattribut für den Modifikator
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);

        // Berechne die Heilung: 1W4 pro Slot-Level + Zaubermodifikator
        let healing = 0;
        for (let i = 0; i < slotLevel; i++) {
            healing += Math.floor(Math.random() * 4) + 1; // 1W4 pro Slot-Level
        }
        healing += abilityModifier; // Zaubermodifikator hinzufügen

        // Stelle sicher, dass die Heilung mindestens 1 beträgt
        healing = Math.max(1, healing);

        // Wende die Heilung an
        const healingResult = this.applyDamage(target, healing, 'healing');

        results.targets.push({
            id: target.id,
            healing: healingResult.healing,
            initialHP: target.currentHP - healingResult.healing,
            finalHP: target.currentHP
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du sprichst ein heilendes Wort zu ${target.name} und heilst ${healingResult.healing} Trefferpunkte.`;

        return results;
    }

    /**
     * Implementierung des Hellish Rebuke-Zaubers (Höllischer Tadel)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur, die den Zauberwirker verletzt hat)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castHellishRebuke(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'hellish_rebuke',
            caster: caster.id,
            targets: [],
            message: "Du zeigst mit dem Finger auf die Kreatur, die dich verletzt hat, und höllische Flammen umhüllen sie."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Hellish Rebuke kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Dexterity-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W10 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W10 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        let damage = 0;
        // Würfle für den Schaden
        for (let i = 0; i < damageDice; i++) {
            damage += Math.floor(Math.random() * 10) + 1; // 1W10
        }

        // Bei erfolgreichem Rettungswurf: Halber Schaden
        if (saveResult.success) {
            damage = Math.floor(damage / 2);
        }

        // Füge Schaden zu
        const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

        results.targets.push({
            id: target.id,
            saveRoll: saveResult,
            damage: damageResult.damage,
            success: saveResult.success
        });

        // Formatiere die Ergebnismeldung
        if (saveResult.success) {
            results.message = `${target.name} weicht teilweise den höllischen Flammen aus und erleidet ${damageResult.damage} Feuerschaden.`;
        } else {
            results.message = `Höllische Flammen umhüllen ${target.name}, das ${damageResult.damage} Feuerschaden erleidet.`;
        }

        return results;
    }

    /**
     * Implementierung des Hex-Zaubers (Verhexen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen mit ausgewähltem Attribut
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castHex(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'hex',
            caster: caster.id,
            targets: [],
            message: "Du platzierst einen Fluch auf einer Kreatur."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Hex erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Hex kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (90 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 18) { // 90 Fuß = 18 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (90 Fuß).";
            return results;
        }

        // Wähle eine Fähigkeit aus, bei der das Ziel Nachteil haben soll
        const validAbilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        const chosenAbility = validAbilities.includes(options.ability) ? options.ability : 'strength';

        // Bestimme die Dauer basierend auf dem Slot-Level
        let duration = 60000; // 1 Stunde = 3600 Sekunden, aber für Konzentration verwenden wir 1 Minute
        if (slotLevel >= 5) {
            duration = 86400000; // 24 Stunden = 86400 Sekunden
        } else if (slotLevel >= 3) {
            duration = 28800000; // 8 Stunden = 28800 Sekunden
        }

        // Erstelle den Hex-Effekt
        const hexEffectId = `hex_${Date.now()}`;
        const hexEffect = {
            id: hexEffectId,
            name: "Verhexen",
            description: `Das Ziel erleidet zusätzlichen Schaden und hat Nachteil bei ${this.getAbilityName(chosenAbility)}-Würfen.`,
            duration: duration,
            casterId: caster.id,
            chosenAbility: chosenAbility,
            onApply: (target, gameState) => {
                // Markiere das Ziel als verhext
                target.hexedBy = target.hexedBy || {};
                target.hexedBy[caster.id] = {
                    ability: chosenAbility
                };
            },
            onRemove: (target, gameState) => {
                // Entferne den Hex-Status
                if (target.hexedBy) {
                    delete target.hexedBy[caster.id];
                    if (Object.keys(target.hexedBy).length === 0) {
                        delete target.hexedBy;
                    }
                }
            },
            // Hook für Ability Checks
            onAbilityCheck: (target, ability, gameState) => {
                // Wenn es die ausgewählte Fähigkeit ist, hat das Ziel Nachteil
                if (ability === chosenAbility && target.hexedBy && target.hexedBy[caster.id]) {
                    return { disadvantage: true };
                }
                return {};
            },
            // Hook für zusätzlichen Schaden
            onHitBySpell: (caster, target, damage, spell) => {
                // Nur wenn der Caster das Ziel trifft
                if (target.hexedBy && target.hexedBy[caster.id]) {
                    // Zusätzlicher Schaden bei Treffern
                    const extraDamage = Math.floor(Math.random() * 6) + 1; // 1W6
                    return {
                        additionalDamage: extraDamage,
                        damageType: DAMAGE_TYPES.NECROTIC
                    };
                }
                return {};
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, hexEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'hex',
            startTime: Date.now(),
            duration: duration,
            targets: [target.id],
            effectId: hexEffectId,
            slotLevel: slotLevel,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, hexEffectId);
            },
            // Erlaube das Verschieben des Fluchs zu einem neuen Ziel,
            // wenn das ursprüngliche Ziel auf 0 TP fällt
            onTargetDown: (originalTarget, gameState) => {
                return {
                    canTransfer: true,
                    transferAction: (newTarget) => {
                        // Entferne den Effekt vom ursprünglichen Ziel
                        this.removeEffect(originalTarget, hexEffectId);

                        // Erstelle einen neuen Effekt für das neue Ziel
                        const newHexEffect = { ...hexEffect };
                        newHexEffect.id = `hex_${Date.now()}`;

                        // Füge den Effekt zum neuen Ziel hinzu
                        this.addEffect(newTarget, newHexEffect);

                        // Aktualisiere die Konzentrationsziele
                        this.concentrationManager.updateTargets(caster.id, [newTarget.id]);

                        return {
                            message: `Dein Fluch geht auf ${newTarget.name} über.`
                        };
                    }
                };
            }
        });

        results.targets.push({
            id: target.id,
            effect: hexEffect.name,
            ability: chosenAbility,
            duration: this.getDurationText(duration)
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du verhext ${target.name} für ${this.getDurationText(duration)}. Das Ziel hat Nachteil bei ${this.getAbilityName(chosenAbility)}-Würfen, und deine Angriffe gegen das Ziel verursachen zusätzlich 1W6 nekrotischen Schaden. Wenn das Ziel stirbt, kannst du den Fluch als Bonusaktion auf eine andere Kreatur übertragen.`;

        return results;
    }

    /**
     * Hilfsmethode: Gibt einen lesbaren Text für eine Dauer zurück
     * @param {number} milliseconds - Dauer in Millisekunden
     * @returns {string} - Lesbarer Text
     */
    getDurationText(milliseconds) {
        if (milliseconds >= 86400000) {
            return "24 Stunden";
        } else if (milliseconds >= 28800000) {
            return "8 Stunden";
        } else if (milliseconds >= 3600000) {
            return "1 Stunde";
        } else {
            return "1 Minute";
        }
    }

    /**
     * Implementierung des Hunter's Mark-Zaubers (Mal des Jägers)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castHuntersMark(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'hunters_mark',
            caster: caster.id,
            targets: [],
            message: "Du wählst eine Kreatur aus und markierst sie als deine Beute."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Hunter's Mark erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Hunter's Mark kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (90 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 18) { // 90 Fuß = 18 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (90 Fuß).";
            return results;
        }

        // Bestimme die Dauer basierend auf dem Slot-Level
        let duration = 60000; // 1 Stunde = 3600 Sekunden, aber für Konzentration verwenden wir 1 Minute
        if (slotLevel >= 3) {
            duration = 28800000; // 8 Stunden = 28800 Sekunden
        }

        // Erstelle den Hunter's Mark-Effekt
        const huntersMarkEffectId = `hunters_mark_${Date.now()}`;
        const huntersMarkEffect = {
            id: huntersMarkEffectId,
            name: "Mal des Jägers",
            description: `Das Ziel ist markiert und erleidet zusätzlichen Schaden. Du hast Vorteil bei Weisheits(Überlebenskunst)- und Weisheits(Wahrnehmung)-Würfen beim Aufspüren des Ziels.`,
            duration: duration,
            casterId: caster.id,
            onApply: (target, gameState) => {
                // Markiere das Ziel mit Hunter's Mark
                target.huntersMarkedBy = target.huntersMarkedBy || {};
                target.huntersMarkedBy[caster.id] = true;
            },
            onRemove: (target, gameState) => {
                // Entferne den Hunter's Mark-Status
                if (target.huntersMarkedBy) {
                    delete target.huntersMarkedBy[caster.id];
                    if (Object.keys(target.huntersMarkedBy).length === 0) {
                        delete target.huntersMarkedBy;
                    }
                }
            },
            // Hook für zusätzlichen Schaden bei Waffenangriffen
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Nur wenn der Caster das markierte Ziel mit einem Waffenangriff trifft
                if (attacker.id === caster.id && target.huntersMarkedBy && target.huntersMarkedBy[caster.id]) {
                    // Zusätzlicher Schaden
                    const extraDamage = Math.floor(Math.random() * 6) + 1; // 1W6
                    return {
                        additionalDamage: extraDamage,
                        damageType: damage.type // Gleicher Schadenstyp wie der Waffenangriff
                    };
                }
                return {};
            },
            // Vorteil bei bestimmten Fertigkeitswürfen zum Aufspüren
            onSkillCheck: (checker, target, skill) => {
                // Nur für den Zauberwirker
                if (checker.id === caster.id && target && target.huntersMarkedBy && target.huntersMarkedBy[caster.id]) {
                    // Vorteil bei Überlebenskunst und Wahrnehmung zum Aufspüren
                    if ((skill === 'survival' || skill === 'perception') && options.trackingCheck) {
                        return { advantage: true };
                    }
                }
                return {};
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, huntersMarkEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'hunters_mark',
            startTime: Date.now(),
            duration: duration,
            targets: [target.id],
            effectId: huntersMarkEffectId,
            slotLevel: slotLevel,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, huntersMarkEffectId);
            },
            // Erlaube das Verschieben des Marks zu einem neuen Ziel,
            // wenn das ursprüngliche Ziel auf 0 TP fällt
            onTargetDown: (originalTarget, gameState) => {
                return {
                    canTransfer: true,
                    transferAction: (newTarget) => {
                        // Entferne den Effekt vom ursprünglichen Ziel
                        this.removeEffect(originalTarget, huntersMarkEffectId);

                        // Erstelle einen neuen Effekt für das neue Ziel
                        const newMarkEffect = { ...huntersMarkEffect };
                        newMarkEffect.id = `hunters_mark_${Date.now()}`;

                        // Füge den Effekt zum neuen Ziel hinzu
                        this.addEffect(newTarget, newMarkEffect);

                        // Aktualisiere die Konzentrationsziele
                        this.concentrationManager.updateTargets(caster.id, [newTarget.id]);

                        return {
                            message: `Dein Mal geht auf ${newTarget.name} über.`
                        };
                    }
                };
            }
        });

        results.targets.push({
            id: target.id,
            effect: huntersMarkEffect.name,
            duration: this.getDurationText(duration)
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du markierst ${target.name} mystisch als deine Beute für ${this.getDurationText(duration)}. Deine Waffenangriffe gegen das Ziel verursachen zusätzlich 1W6 Schaden des Waffenschadentyps. Du hast außerdem Vorteil bei Weisheits(Überlebenskunst)- und Weisheits(Wahrnehmung)-Würfen beim Aufspüren des Ziels. Wenn das Ziel auf 0 Trefferpunkte fällt, kannst du das Mal als Bonusaktion auf eine andere Kreatur übertragen.`;

        return results;
    }

    /**
     * Implementierung des Inflict Wounds-Zaubers (Wunden verursachen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castInflictWounds(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'inflict_wounds',
            caster: caster.id,
            targets: [],
            message: "Nekrotische Energie strömt aus deiner Hand."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Inflict Wounds kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W10 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W10 pro Slot-Level über 1
        let damageDice = baseDamage + upcastDamage;

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 10) + 1; // 1W10
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.NECROTIC);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage
            });

            let message = `Deine Hand verursacht nekrotische Energie, die ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` durchströmt und ${damageResult.damage} nekrotischen Schaden verursacht.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Du versuchst, ${target.name} mit nekrotischer Energie zu berühren, aber verfehlst.`;
        }

        return results;
    }

    /**
     * Implementierung des Jump-Zaubers (Sprung)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castJump(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'jump',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und verleihst ihr übernatürliche Sprungkraft."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Jump kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Erstelle den Sprung-Effekt
        const jumpEffectId = `jump_${Date.now()}`;
        const jumpEffect = {
            id: jumpEffectId,
            name: "Sprung",
            description: "Die Sprungdistanz des Ziels ist verdreifacht.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Speichere die ursprüngliche Sprungdistanz
                target.originalJumpDistance = target.jumpDistance || target.strength;
                // Verdreifache die Sprungdistanz
                target.jumpDistance = target.originalJumpDistance * 3;
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprüngliche Sprungdistanz wieder her
                if (target.originalJumpDistance) {
                    target.jumpDistance = target.originalJumpDistance;
                    delete target.originalJumpDistance;
                } else {
                    delete target.jumpDistance;
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, jumpEffect);

        results.targets.push({
            id: target.id,
            effect: jumpEffect.name
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du berührst dich selbst und verleihst dir übernatürliche Sprungkraft. Deine Sprungdistanz ist für 1 Minute verdreifacht.";
        } else {
            results.message = `Du berührst ${target.name} und verleihst dem Ziel übernatürliche Sprungkraft. Die Sprungdistanz des Ziels ist für 1 Minute verdreifacht.`;
        }

        return results;
    }

    /**
     * Implementierung des Longstrider-Zaubers (Weitschritt)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castLongstrider(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'longstrider',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und erhöhst ihre Geschwindigkeit."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme die Anzahl der möglichen Ziele
        const maxTargets = 1 + slotLevel - 1; // 1 Ziel bei Level 1, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets) {
            targets = targets.slice(0, maxTargets);
            results.message += ` (Maximal ${maxTargets} Ziele möglich)`;
        }

        // Für jedes Ziel prüfen, ob es in Berührungsreichweite ist
        const validTargets = targets.filter(target => {
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            return distance <= 1; // Höchstens 5 Fuß entfernt
        });

        if (validTargets.length === 0) {
            results.success = false;
            results.message = "Keine Ziele in Berührungsreichweite.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Wende den Effekt auf jedes gültige Ziel an
        validTargets.forEach(target => {
            // Erstelle den Weitschritt-Effekt
            const longstriderEffectId = `longstrider_${Date.now()}_${target.id}`;
            const longstriderEffect = {
                id: longstriderEffectId,
                name: "Weitschritt",
                description: "Die Bewegungsrate des Ziels ist um 10 Fuß erhöht.",
                duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
                onApply: (target, gameState) => {
                    // Speichere die ursprüngliche Geschwindigkeit
                    target.originalSpeed = target.speed;
                    // Erhöhe die Geschwindigkeit um 10 Fuß (2 Felder)
                    target.speed += 2;
                },
                onRemove: (target, gameState) => {
                    // Stelle die ursprüngliche Geschwindigkeit wieder her
                    if (target.originalSpeed) {
                        target.speed = target.originalSpeed;
                        delete target.originalSpeed;
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, longstriderEffect);

            results.targets.push({
                id: target.id,
                effect: longstriderEffect.name
            });
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length === 1) {
            const target = this.gameState.getEntityById(results.targets[0].id);
            if (target.id === caster.id) {
                results.message = "Du berührst dich selbst und erhöhst deine Bewegungsrate um 10 Fuß für 1 Stunde.";
            } else {
                results.message = `Du berührst ${target.name} und erhöhst die Bewegungsrate des Ziels um 10 Fuß für 1 Stunde.`;
            }
        } else {
            results.message = `Du berührst ${results.targets.length} Kreaturen und erhöhst ihre Bewegungsrate um 10 Fuß für 1 Stunde.`;
        }

        return results;
    }

    /**
     * Implementierung des Mage Armor-Zaubers (Magierrüstung)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castMageArmor(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'mage_armor',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine willige Kreatur, die keine Rüstung trägt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Mage Armor kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Prüfe, ob das Ziel bereits Rüstung trägt
        if (target.wearingArmor) {
            results.success = false;
            results.message = `${target.name} trägt bereits Rüstung, daher kann der Zauber nicht gewirkt werden.`;
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Erstelle den Magierrüstung-Effekt
        const mageArmorEffectId = `mage_armor_${Date.now()}`;
        const mageArmorEffect = {
            id: mageArmorEffectId,
            name: "Magierrüstung",
            description: "Eine schützende magische Kraft umgibt das Ziel und gewährt eine Rüstungsklasse von 13 + Geschicklichkeitsmodifikator.",
            duration: 28800000, // 8 Stunden = 28800 Sekunden = 28800000ms
            onApply: (target, gameState) => {
                // Speichere die ursprüngliche Rüstungsklasse
                target.originalArmorClass = target.armorClass;

                // Berechne die neue Rüstungsklasse: 13 + Geschicklichkeitsmodifikator
                const dexModifier = Math.floor((target.abilities.dexterity - 10) / 2);
                target.armorClass = 13 + dexModifier;

                // Markiere, dass das Ziel Magierrüstung trägt
                target.hasMageArmor = true;
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprüngliche Rüstungsklasse wieder her
                if (target.originalArmorClass) {
                    target.armorClass = target.originalArmorClass;
                    delete target.originalArmorClass;
                }
                delete target.hasMageArmor;
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, mageArmorEffect);

        // Berechne die neue Rüstungsklasse für die Ausgabe
        const dexModifier = Math.floor((target.abilities.dexterity - 10) / 2);
        const newArmorClass = 13 + dexModifier;

        results.targets.push({
            id: target.id,
            effect: mageArmorEffect.name,
            oldAC: target.originalArmorClass,
            newAC: newArmorClass
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = `Du berührst dich selbst und eine schützende magische Kraft umgibt dich. Deine Rüstungsklasse ändert sich zu ${newArmorClass} für 8 Stunden.`;
        } else {
            results.message = `Du berührst ${target.name} und eine schützende magische Kraft umgibt das Ziel. Die Rüstungsklasse des Ziels ändert sich zu ${newArmorClass} für 8 Stunden.`;
        }

        return results;
    }

    /**
     * Implementierung des Magic Missile-Zaubers (Magisches Geschoss)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castMagicMissile(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'magic_missile',
            caster: caster.id,
            missiles: [],
            message: "Du erschaffst leuchtende Pfeile aus magischer Kraft."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne die Anzahl der Geschosse
        const baseMissiles = 3; // 3 Geschosse bei Level 1
        const upcastMissiles = slotLevel - 1; // +1 Geschoss pro Slot-Level über 1
        const totalMissiles = baseMissiles + upcastMissiles;

        // Wenn keine Ziele angegeben sind, alle auf das erste Ziel richten
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst mindestens ein Ziel wählen.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Verteile die Geschosse gemäß den Optionen oder auf alle Ziele
        let missileTargets = [];

        // Wenn spezifische Verteilung angegeben ist
        if (options.distribution && Array.isArray(options.distribution)) {
            // Überprüfe, ob die Gesamtzahl stimmt
            const totalDistributed = options.distribution.reduce((sum, missiles) => sum + missiles, 0);
            if (totalDistributed !== totalMissiles) {
                // Wenn nicht, verteile gleichmäßig
                missileTargets = this._distributeMissiles(targets, totalMissiles);
            } else {
                // Erstelle die Verteilung gemäß den Optionen
                missileTargets = [];
                for (let i = 0; i < options.distribution.length; i++) {
                    if (i < targets.length && options.distribution[i] > 0) {
                        for (let j = 0; j < options.distribution[i]; j++) {
                            missileTargets.push(targets[i]);
                        }
                    }
                }
            }
        } else {
            // Standardverteilung: Gleichmäßig auf alle Ziele verteilen
            missileTargets = this._distributeMissiles(targets, totalMissiles);
        }

        // Schaden für jedes Geschoss berechnen (immer 1W4+1)
        missileTargets.forEach((target, index) => {
            // Schaden würfeln
            const damage = Math.floor(Math.random() * 4) + 1 + 1; // 1W4+1

            // Wende den Schaden an
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FORCE);

            results.missiles.push({
                index: index + 1,
                targetId: target.id,
                damage: damageResult.damage
            });
        });

        // Zähle die Geschosse pro Ziel
        const targetCounts = {};
        missileTargets.forEach(target => {
            targetCounts[target.id] = (targetCounts[target.id] || 0) + 1;
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du erschaffst ${totalMissiles} leuchtende Pfeile aus magischer Kraft und schleuderst sie auf ${targets.length} Ziel(e).`;

        // Füge Details für jedes Ziel hinzu
        const targetDetails = [];
        for (const targetId in targetCounts) {
            const target = this.gameState.getEntityById(targetId);
            const missileCount = targetCounts[targetId];
            const totalDamage = results.missiles
                .filter(m => m.targetId === targetId)
                .reduce((sum, m) => sum + m.damage, 0);
            targetDetails.push(`${target.name}: ${missileCount} Geschoss(e), ${totalDamage} Kraftschaden`);
        }

        if (targetDetails.length > 0) {
            results.message += " " + targetDetails.join("; ") + ".";
        }

        return results;
    }

    /**
     * Hilfsmethode: Verteilt die Geschosse gleichmäßig auf die Ziele
     * @param {Array} targets - Liste der Ziele
     * @param {number} missiles - Anzahl der Geschosse
     * @returns {Array} - Liste der Ziele für jedes Geschoss
     */
    _distributeMissiles(targets, missiles) {
        const result = [];

        // Wenn nur ein Ziel vorhanden ist, alle Geschosse darauf
        if (targets.length === 1) {
            for (let i = 0; i < missiles; i++) {
                result.push(targets[0]);
            }
            return result;
        }

        // Sonst verteile gleichmäßig, mit überzähligen auf die ersten Ziele
        const basePerTarget = Math.floor(missiles / targets.length);
        let remaining = missiles - (basePerTarget * targets.length);

        for (let i = 0; i < targets.length; i++) {
            // Füge die Basiszahl an Geschossen hinzu
            for (let j = 0; j < basePerTarget; j++) {
                result.push(targets[i]);
            }

            // Füge ein zusätzliches Geschoss hinzu, wenn noch übrig
            if (remaining > 0) {
                result.push(targets[i]);
                remaining--;
            }
        }

        return result;
    }

    /**
     * Hilfsmethode: Liefert den deutschen Namen eines Attributs
     * @param {string} ability - Das Attribut
     * @returns {string} - Der deutsche Name
     */
    getAbilityName(ability) {
        const names = {
            'strength': 'Stärke',
            'dexterity': 'Geschicklichkeit',
            'constitution': 'Konstitution',
            'intelligence': 'Intelligenz',
            'wisdom': 'Weisheit',
            'charisma': 'Charisma'
        };
        return names[ability] || ability;
    }

    /**
 * Implementierung des Protection from Evil and Good-Zaubers (Schutz vor Gut und Böse)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castProtectionFromEvilAndGood(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'protection_from_evil_and_good',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine willige Kreatur und schützt sie vor bestimmten Kreaturentypen."
        };

        // Prüfe, ob die benötigten Materialkomponenten vorhanden sind
        const hasMaterials = caster.components && (
            caster.components.some(c => c.type === 'holy_water') ||
            (caster.components.some(c => c.type === 'powdered_silver') &&
                caster.components.some(c => c.type === 'powdered_iron'))
        );

        if (!hasMaterials && !options.ignoreComponents) {
            results.success = false;
            results.message = "Du benötigst Weihwasser oder Silber- und Eisenpulver, um diesen Zauber zu wirken.";
            return results;
        }

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Verbrauche die Materialkomponenten
        if (!options.ignoreComponents) {
            // Implementierung für das Verbrauchen der Materialien hier
            // ...
        }

        // Protection from Evil and Good erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Protection from Evil and Good kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Liste der betroffenen Kreaturentypen
        const affectedTypes = ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'];

        // Erstelle den Schutzeffekt
        const protectionEffectId = `protection_from_evil_and_good_${Date.now()}`;
        const protectionEffect = {
            id: protectionEffectId,
            name: "Schutz vor Gut und Böse",
            description: "Schutz vor Aberrationen, Himmlischen, Elementaren, Feen, Teufeln und Untoten.",
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            affectedTypes: affectedTypes,
            onApply: (target, gameState) => {
                // Markiere das Ziel als geschützt
                target.protectedFromTypes = affectedTypes;

                // Falls das Ziel bereits von einer solchen Kreatur bezaubert, verängstigt oder besessen ist,
                // erhält es Vorteil bei Rettungswürfen, um diesen Effekt zu beenden
                if (target.charmedBy || target.frightenedBy || target.possessedBy) {
                    target.advantageToEndEffectsFromTypes = affectedTypes;
                }
            },
            onRemove: (target, gameState) => {
                // Entferne den Schutz
                delete target.protectedFromTypes;
                delete target.advantageToEndEffectsFromTypes;
            },
            // Hook für Angriffswürfe gegen das Ziel
            onBeingAttacked: (attacker, target, gameState) => {
                // Wenn der Angreifer von einem der betroffenen Typen ist, hat er Nachteil
                if (attacker.type && affectedTypes.includes(attacker.type)) {
                    return { disadvantage: true };
                }
                return {};
            },
            // Hook für Rettungswürfe gegen Bezauberung, Angst oder Besessenheit
            onSavingThrow: (target, effect, saveType, gameState) => {
                // Wenn der Effekt von einer Kreatur eines betroffenen Typs stammt
                // und es sich um einen Bezauberungs-, Angst- oder Besessenheitseffekt handelt
                if (effect && effect.sourceType && affectedTypes.includes(effect.sourceType) &&
                    (effect.type === 'charm' || effect.type === 'frightened' || effect.type === 'possession')) {
                    return { advantage: true };
                }
                return {};
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, protectionEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'protection_from_evil_and_good',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            targets: [target.id],
            effectId: protectionEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, protectionEffectId);
            }
        });

        results.targets.push({
            id: target.id,
            effect: protectionEffect.name
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du umgibst dich mit einem Schutzschild gegen Aberrationen, Himmlische, Elementare, Feen, Teufel und Untote. Du erhältst Vorteil bei Rettungswürfen gegen Bezauberung, Angst oder Besessenheit durch solche Kreaturen, und sie haben Nachteil bei Angriffen gegen dich.";
        } else {
            results.message = `Du umgibst ${target.name} mit einem Schutzschild gegen Aberrationen, Himmlische, Elementare, Feen, Teufel und Untote. Das Ziel erhält Vorteil bei Rettungswürfen gegen Bezauberung, Angst oder Besessenheit durch solche Kreaturen, und sie haben Nachteil bei Angriffen gegen das Ziel.`;
        }

        return results;
    }

    /**
 * Implementierung des Ray of Sickness-Zaubers (Strahl der Übelkeit)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castRayOfSickness(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'ray_of_sickness',
            caster: caster.id,
            targets: [],
            message: "Ein gelbgrüner Strahl zischt auf dein Ziel zu."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Ray of Sickness kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W8 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W8 pro Slot-Level über 1
        let damageDice = baseDamage + upcastDamage;

        // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
        if (isCritical) {
            damageDice *= 2;
        }

        if (hits) {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.POISON);

            // Prüfe auf Vergiftung (nur bei erfolgreichem Treffer)
            const saveDC = this.calculateSpellSaveDC(caster);
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            // Ist das Ziel immun gegen Vergiftung?
            const isPoisonImmune = target.immunities &&
                (target.immunities.includes(DAMAGE_TYPES.POISON) ||
                    target.immunities.includes(CONDITIONS.POISONED));

            let poisoned = false;
            if (!saveResult.success && !isPoisonImmune) {
                // Ziel ist vergiftet
                poisoned = true;

                // Erstelle den Vergiftungseffekt
                const poisonedEffect = {
                    id: `ray_of_sickness_poisoned_${Date.now()}`,
                    name: "Vergiftet",
                    description: "Das Ziel ist vergiftet.",
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    onApply: (target, gameState) => {
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(CONDITIONS.POISONED)) {
                            target.conditions.push(CONDITIONS.POISONED);
                        }
                    },
                    onRemove: (target, gameState) => {
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c => c !== CONDITIONS.POISONED);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, poisonedEffect);
            }

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                saveRoll: saveResult,
                poisoned: poisoned,
                poisonImmune: isPoisonImmune
            });

            // Formatiere die Ergebnismeldung
            let message = `Der Strahl der Übelkeit trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Giftschaden.`;

            if (isPoisonImmune) {
                message += ` ${target.name} ist immun gegen Vergiftungen.`;
            } else if (poisoned) {
                message += ` ${target.name} ist bis zum Beginn deines nächsten Zuges vergiftet.`;
            } else {
                message += ` ${target.name} widersteht der Vergiftung.`;
            }

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der Strahl der Übelkeit verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Sanctuary-Zaubers (Schutzraum)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castSanctuary(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'sanctuary',
            caster: caster.id,
            targets: [],
            message: "Du schützt eine Kreatur vor Angriffen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Sanctuary kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Erstelle den Schutzraum-Effekt
        const sanctuaryEffectId = `sanctuary_${Date.now()}`;
        const sanctuaryEffect = {
            id: sanctuaryEffectId,
            name: "Schutzraum",
            description: "Das Ziel ist durch magischen Schutz geweiht.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Markiere das Ziel als unter Sanctuary-Schutz stehend
                target.hasCanctuary = true;
            },
            onRemove: (target, gameState) => {
                // Entferne den Schutz
                delete target.hasCanctuary;
            },
            // Hook für Angriffswürfe gegen das Ziel
            onBeingTargeted: (attacker, target, action, gameState) => {
                // Wenn die Aktion ein Angriff oder schädlicher Zauber ist
                if (action.type === 'attack' || action.type === 'harmful_spell') {
                    // Berechne DC für den Weisheits-Rettungswurf
                    const saveDC = this.calculateSpellSaveDC(caster);

                    // Führe einen Weisheits-Rettungswurf für den Angreifer durch
                    const saveResult = this.makeSavingThrow(attacker, SAVING_THROWS.WISDOM, saveDC);

                    if (!saveResult.success) {
                        // Angreifer muss ein anderes Ziel wählen oder seine Aktion verlieren
                        return {
                            canTarget: false,
                            message: `${attacker.name} kann ${target.name} nicht angreifen und muss ein anderes Ziel wählen oder die Aktion verlieren.`
                        };
                    } else {
                        // Angreifer kann das Ziel angreifen, aber der Schutzraum endet
                        this.removeEffect(target, sanctuaryEffectId);
                        return {
                            canTarget: true,
                            message: `${attacker.name} überwindet den Schutzraum von ${target.name}, und der Zauber endet.`
                        };
                    }
                }

                // Andere Aktionen sind nicht betroffen
                return { canTarget: true };
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, sanctuaryEffect);

        results.targets.push({
            id: target.id,
            effect: sanctuaryEffect.name
        });

        // Der Zauber endet, wenn das Ziel einen Angriff durchführt oder einen schädlichen Zauber wirkt
        // Dies wird durch einen Event-Listener implementiert
        this.gameState.addEventListener('actionPerformed', (event) => {
            if (event.actorId === target.id &&
                (event.action.type === 'attack' || event.action.type === 'harmful_spell')) {
                // Entferne den Effekt
                this.removeEffect(target, sanctuaryEffectId);

                // Benachrichtigung ausgeben
                this.gameState.addMessage(`${target.name} greift an oder wirkt einen schädlichen Zauber, und der Schutzraum endet.`);
            }
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du umgibst dich mit einem schützenden Zauber. Bis der Zauber endet muss jede Kreatur, die dich angreifen oder mit einem schädlichen Zauber belegen will, zuerst einen Weisheits-Rettungswurf bestehen.";
        } else {
            results.message = `Du umgibst ${target.name} mit einem schützenden Zauber. Bis der Zauber endet muss jede Kreatur, die das Ziel angreifen oder mit einem schädlichen Zauber belegen will, zuerst einen Weisheits-Rettungswurf bestehen.`;
        }

        results.message += " Wenn das Ziel einen Angriff durchführt oder einen schädlichen Zauber wirkt, endet der Zauber.";

        return results;
    }

    /**
 * Implementierung des Searing Smite-Zaubers (Sengender Schlag)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSearingSmite(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'searing_smite',
            caster: caster.id,
            message: "Deine Waffe wird mit loderndem Feuer umhüllt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Searing Smite erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `searing_smite_${Date.now()}`,
            name: "Sengender Schlag",
            description: "Der nächste Treffer mit einem Waffenangriff verursacht zusätzlichen Feuerschaden.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Markiere den Charakter als mit Searing Smite vorbereitet
                target.searingSmitePrepared = true;
            },
            onRemove: (target, gameState) => {
                delete target.searingSmitePrepared;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Verbrauche den vorbereiteten Searing Smite
                delete attacker.searingSmitePrepared;

                // Berechne den Schaden basierend auf dem Slot-Level
                const baseDamage = 1; // 1W6 Grundschaden
                const upcastDamage = slotLevel - 1; // +1W6 pro Slot-Level über 1
                const damageDice = baseDamage + upcastDamage;

                // Würfle für den zusätzlichen Schaden
                let additionalDamage = 0;
                for (let i = 0; i < damageDice; i++) {
                    additionalDamage += Math.floor(Math.random() * 6) + 1; // 1W6
                }

                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(attacker);

                // Führe einen Constitution-Saving Throw durch
                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

                if (!saveResult.success) {
                    // Erstelle den brennenden Effekt
                    const burningEffect = {
                        id: `searing_smite_burning_${Date.now()}_${target.id}`,
                        name: "Brennend",
                        description: "Das Ziel brennt und erleidet zu Beginn seines Zuges Feuerschaden.",
                        duration: 60000, // 1 Minute (max)
                        saveDC: saveDC,
                        onApply: (target, gameState) => {
                            // Markiere das Ziel als brennend
                            target.isOnFire = true;
                        },
                        onRemove: (target, gameState) => {
                            delete target.isOnFire;
                        },
                        onTick: (target, gameState, deltaTime) => {
                            // Verursache Schaden bei Beginn des Zuges des Ziels
                            if (gameState.isCreatureTurn(target.id)) {
                                // 1W6 Feuerschaden pro Runde
                                const burnDamage = Math.floor(Math.random() * 6) + 1;

                                // Wende den Schaden an
                                const damageResult = this.applyDamage(target, burnDamage, DAMAGE_TYPES.FIRE);
                                gameState.addMessage(`${target.name} brennt und erleidet ${damageResult.damage} Feuerschaden.`);

                                // Erlaube einen Constitution-Rettungswurf, um das Feuer zu löschen
                                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);
                                if (saveResult.success) {
                                    gameState.addMessage(`${target.name} löscht die Flammen!`);
                                    this.removeEffect(target, burningEffect.id);
                                }
                            }
                        }
                    };

                    // Füge den brennenden Effekt zum Ziel hinzu
                    this.addEffect(target, burningEffect);

                    // Starte Konzentration auf den brennenden Effekt
                    this.concentrationManager.startConcentration(attacker.id, {
                        id: 'searing_smite',
                        startTime: Date.now(),
                        duration: 60000, // 1 Minute
                        targets: [target.id],
                        effectId: burningEffect.id,
                        onEnd: () => {
                            // Entferne den Effekt, wenn die Konzentration endet
                            this.removeEffect(target, burningEffect.id);
                        }
                    });

                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.FIRE,
                        message: `${target.name} fängt Feuer und brennt! Es muss zu Beginn jedes Zuges einen Constitution-Rettungswurf ablegen, um die Flammen zu löschen.`,
                        saveRoll: saveResult,
                        effect: burningEffect.name
                    };
                } else {
                    // Ziel brennt nicht, aber nimmt den initialen Schaden
                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.FIRE,
                        message: `${target.name} widersteht den Flammen und fängt nicht Feuer.`,
                        saveRoll: saveResult
                    };
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'searing_smite',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Deine Waffe wird mit loderndem Feuer umhüllt. Bei deinem nächsten Treffer mit einem Waffenangriff innerhalb der nächsten Minute fügt die Waffe zusätzlichen Feuerschaden zu, und das Ziel fängt Feuer, wenn es einen Constitution-Rettungswurf nicht besteht.";

        return results;
    }

    /**
 * Implementierung des Shield of Faith-Zaubers (Schild des Glaubens)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castShieldOfFaith(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'shield_of_faith',
            caster: caster.id,
            targets: [],
            message: "Ein schimmerndes Feld umgibt eine Kreatur und gewährt ihr Schutz."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Shield of Faith erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Shield of Faith kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Erstelle den Schild-Effekt
        const shieldEffectId = `shield_of_faith_${Date.now()}`;
        const shieldEffect = {
            id: shieldEffectId,
            name: "Schild des Glaubens",
            description: "Ein schimmerndes Feld umgibt das Ziel und gewährt +2 auf die Rüstungsklasse.",
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            onApply: (target, gameState) => {
                // Speichere die ursprüngliche Rüstungsklasse
                target.originalArmorClass = target.armorClass;

                // Erhöhe die Rüstungsklasse um 2
                target.armorClass += 2;
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprüngliche Rüstungsklasse wieder her
                if (target.originalArmorClass) {
                    target.armorClass = target.originalArmorClass;
                    delete target.originalArmorClass;
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, shieldEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'shield_of_faith',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            targets: [target.id],
            effectId: shieldEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, shieldEffectId);
            }
        });

        results.targets.push({
            id: target.id,
            effect: shieldEffect.name,
            originalAC: target.originalArmorClass,
            newAC: target.armorClass
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = `Ein schimmerndes Feld umgibt dich und erhöht deine Rüstungsklasse um 2 auf ${target.armorClass} für 10 Minuten, solange du dich konzentrierst.`;
        } else {
            results.message = `Ein schimmerndes Feld umgibt ${target.name} und erhöht die Rüstungsklasse des Ziels um 2 auf ${target.armorClass} für 10 Minuten, solange du dich konzentrierst.`;
        }

        return results;
    }

    /**
 * Implementierung des Sleep-Zaubers (Schlaf)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Schlafbereichs
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSleep(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'sleep',
            caster: caster.id,
            targets: [],
            message: "Du verursachst einen Zustand übernatürlicher Schläfrigkeit in einem Bereich."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position,
            radius: 4
        };

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, 4)
            .filter(entity => entity.isCreature);

        // Wenn keine Kreaturen im Bereich sind
        if (creaturesInArea.length === 0) {
            results.message = "Es befinden sich keine Kreaturen im Bereich des Zaubers.";
            return results;
        }

        // Berechne die Gesamtzahl der Trefferpunkte, die betroffen werden können
        const baseDice = 5; // 5W8 Grundwert
        const upcastDice = (slotLevel - 1) * 2; // +2W8 pro Slot-Level über 1
        const totalDice = baseDice + upcastDice;

        // Würfle die totalen Trefferpunkte
        let totalHitPoints = 0;
        for (let i = 0; i < totalDice; i++) {
            totalHitPoints += Math.floor(Math.random() * 8) + 1; // 1W8
        }

        // Filtere Kreaturen, die nicht betroffen werden können (immun gegen Bezauberung, Untote, etc.)
        const validTargets = creaturesInArea.filter(creature => {
            // Prüfe auf Immunität gegen Schlaf oder Bezauberung
            if (creature.immunities && (
                creature.immunities.includes('sleep') ||
                creature.immunities.includes('charm'))) {
                results.targets.push({
                    id: creature.id,
                    affected: false,
                    reason: "Immun"
                });
                return false;
            }

            // Prüfe, ob es sich um einen Elfen oder Untoten handelt (immun gegen Schlaf)
            if (creature.race === 'elf' || creature.type === 'undead') {
                results.targets.push({
                    id: creature.id,
                    affected: false,
                    reason: `Immun (${creature.race === 'elf' ? 'Elf' : 'Untot'})`
                });
                return false;
            }

            // Gültige Kreatur für Schlaf
            return true;
        });

        // Sortiere die Ziele nach aufsteigenden aktuellen Trefferpunkten
        validTargets.sort((a, b) => a.currentHP - b.currentHP);

        // Wende den Effekt auf Ziele an, bis die HP aufgebraucht sind
        let remainingHitPoints = totalHitPoints;
        validTargets.forEach(target => {
            // Prüfe, ob noch genügend HP übrig sind
            if (remainingHitPoints <= 0) {
                results.targets.push({
                    id: target.id,
                    affected: false,
                    reason: "Nicht genug Kapazität"
                });
                return;
            }

            // Prüfe, ob das Ziel bewusstlos ist
            if (target.conditions && target.conditions.includes(CONDITIONS.UNCONSCIOUS)) {
                results.targets.push({
                    id: target.id,
                    affected: false,
                    reason: "Bereits bewusstlos"
                });
                return;
            }

            // Ziehe die HP des Ziels von den verbleibenden HP ab
            remainingHitPoints -= target.currentHP;

            // Erstelle den Schlafeffekt
            const sleepEffect = {
                id: `sleep_${Date.now()}_${target.id}`,
                name: "Schlafend",
                description: "Das Ziel ist bewusstlos und schläft.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                onApply: (target, gameState) => {
                    // Füge den bewusstlos-Zustand hinzu
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.UNCONSCIOUS)) {
                        target.conditions.push(CONDITIONS.UNCONSCIOUS);
                    }

                    // Markiere das Ziel als schlafend (nicht nur bewusstlos)
                    target.isSleeping = true;
                },
                onRemove: (target, gameState) => {
                    // Entferne den bewusstlos-Zustand
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c => c !== CONDITIONS.UNCONSCIOUS);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }

                    delete target.isSleeping;
                },
                // Der Schlaf endet, wenn das Ziel Schaden nimmt oder jemand es weckt
                onTakeDamage: (target, damage, type, attacker) => {
                    // Entferne den Schlafeffekt
                    this.removeEffect(target, sleepEffect.id);

                    return {
                        message: `${target.name} wacht durch den erlittenen Schaden auf.`
                    };
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, sleepEffect);

            results.targets.push({
                id: target.id,
                affected: true,
                effect: sleepEffect.name,
                currentHP: target.currentHP
            });
        });

        // Timer zum Entfernen des Effekts nach Ablauf der Dauer
        setTimeout(() => {
            results.targets.forEach(targetInfo => {
                if (targetInfo.affected) {
                    const target = this.gameState.getEntityById(targetInfo.id);
                    if (target) {
                        const sleepEffect = target.effects?.find(e => e.id.startsWith('sleep_'));
                        if (sleepEffect) {
                            this.removeEffect(target, sleepEffect.id);
                        }
                    }
                }
            });
        }, 60000);

        // Formatiere die Ergebnismeldung
        const sleepingCount = results.targets.filter(t => t.affected).length;
        const immuneCount = results.targets.filter(t => !t.affected && t.reason === "Immun").length;

        results.message = `Du erschaffst ${totalDice}W8 (${totalHitPoints}) Trefferpunkte an magischer Schläfrigkeit.`;

        if (sleepingCount > 0) {
            results.message += ` ${sleepingCount} Kreatur(en) fallen in einen magischen Schlaf, beginnend mit denen mit den wenigsten Trefferpunkten.`;
        } else {
            results.message += " Keine der Kreaturen wird durch den Zauber eingeschläfert.";
        }

        if (immuneCount > 0) {
            results.message += ` ${immuneCount} Kreatur(en) sind immun gegen den Zauber.`;
        }

        results.message += " Der Schlaf hält 1 Minute an oder bis die Kreatur Schaden erleidet oder geweckt wird.";

        return results;
    }
    /**
 * Implementierung des Speak with Animals-Zaubers (Mit Tieren sprechen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSpeakWithAnimals(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'speak_with_animals',
            caster: caster.id,
            message: "Du erhältst die Fähigkeit, mit Tieren zu kommunizieren."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Erstelle den Effekt
        const effectId = `speak_with_animals_${Date.now()}`;
        const effect = {
            id: effectId,
            name: "Mit Tieren sprechen",
            description: "Du kannst die Bedeutung der Laute von Tieren verstehen und zu ihnen sprechen.",
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            onApply: (target, gameState) => {
                // Füge die Fähigkeit hinzu, mit Tieren zu sprechen
                target.canSpeakWithAnimals = true;
            },
            onRemove: (target, gameState) => {
                delete target.canSpeakWithAnimals;
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Timer zum Entfernen des Effekts nach Ablauf der Dauer
        setTimeout(() => {
            this.removeEffect(caster, effectId);
            this.gameState.addMessage(`${caster.name} kann nicht mehr mit Tieren sprechen.`);
        }, effect.duration);

        results.effect = effect.name;
        results.duration = "10 Minuten";

        results.message = "Du erhältst für die nächsten 10 Minuten die Fähigkeit, die Bedeutung der Laute von Tieren zu verstehen und zu ihnen zu sprechen. Die Erkenntnis und Intelligenz vieler Tiere ist durch ihre Intelligenz begrenzt, aber zumindest können sie dir Informationen über nahe Orte und Monster, seltsame Dinge, die sie kürzlich beobachtet haben, oder was sie in der letzten Umgebung gesehen oder gehört haben, mitteilen.";

        return results;
    }

    /**
 * Implementierung des Tasha's Hideous Laughter-Zaubers (Tashas grässliches Gelächter)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castTashasHideousLaughter(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'tashas_hideous_laughter',
            caster: caster.id,
            targets: [],
            message: "Ein Ziel, das du in Reichweite siehst, nimmt alles als urkomisch wahr."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Tasha's Hideous Laughter erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Der Zauber kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Prüfe, ob das Ziel immun gegen den Zauber ist (z.B. Untote, Konstrukte)
        if (target.type === 'undead' || target.type === 'construct') {
            results.success = false;
            results.message = `${target.name} ist als ${target.type === 'undead' ? 'Untoter' : 'Konstrukt'} immun gegen diesen Zauber.`;
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Intelligenz-Rettungswurf durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.INTELLIGENCE, saveDC);

        if (!saveResult.success) {
            // Erstelle den Effekt für das Gelächter
            const laughterEffectId = `tashas_laughter_${Date.now()}`;
            const laughterEffect = {
                id: laughterEffectId,
                name: "Tashas grässliches Gelächter",
                description: "Das Ziel fällt zu Boden, kann keine Aktionen durchführen und hat Nachteil bei Attributswürfen und Rettungswürfen.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                saveDC: saveDC,
                onApply: (target, gameState) => {
                    // Füge die Zustände hinzu
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.PRONE)) {
                        target.conditions.push(CONDITIONS.PRONE);
                    }
                    if (!target.conditions.includes(CONDITIONS.INCAPACITATED)) {
                        target.conditions.push(CONDITIONS.INCAPACITATED);
                    }
                    target.laughingFit = true; // Markiere das Ziel als lachend
                },
                onRemove: (target, gameState) => {
                    // Entferne die Zustände
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c =>
                            c !== CONDITIONS.PRONE && c !== CONDITIONS.INCAPACITATED);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }
                    delete target.laughingFit;
                },
                onTick: (target, gameState, deltaTime) => {
                    // Erlaube bei Beginn des Zuges einen weiteren Rettungswurf
                    if (gameState.isCreatureTurn(target.id)) {
                        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);
                        if (saveResult.success) {
                            gameState.addMessage(`${target.name} befreit sich von Tashas Gelächter!`);
                            this.removeEffect(target, laughterEffectId);
                        }
                    }
                },
                // Der Effekt endet auch, wenn das Ziel Schaden nimmt
                onTakeDamage: (target, damage, type, attacker) => {
                    // Führe einen Weisheits-Rettungswurf durch
                    const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC,
                        { advantage: true }); // Vorteil beim Rettungswurf

                    if (saveResult.success) {
                        this.removeEffect(target, laughterEffectId);
                        return {
                            message: `${target.name} befreit sich durch den erlittenen Schaden von Tashas Gelächter.`
                        };
                    }
                    return {};
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, laughterEffect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'tashas_hideous_laughter',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: laughterEffectId,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, laughterEffectId);
                }
            });

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: false,
                effect: laughterEffect.name
            });

            results.message = `${target.name} wird von einem unwiderstehlichen Lachanfall überwältigt und fällt zu Boden. Das Ziel ist handlungsunfähig und kann nur noch lachen. Am Ende jedes seiner Züge und bei Schaden erhält es einen weiteren Rettungswurf.`;
        } else {
            // Rettungswurf erfolgreich, keine Wirkung
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            results.message = `${target.name} widersteht dem Zauber und wird nicht von dem Lachanfall beeinflusst.`;
        }

        return results;
    }

    /**
     * Implementierung des Thunderous Smite-Zaubers (Donnernder Schlag)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castThunderousSmite(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'thunderous_smite',
            caster: caster.id,
            message: "Deine Waffe wird mit der Kraft des Donners aufgeladen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Thunderous Smite erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `thunderous_smite_${Date.now()}`,
            name: "Donnernder Schlag",
            description: "Der nächste Treffer mit einem Waffenangriff verursacht zusätzlichen Donnerschaden.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Markiere den Charakter als mit Thunderous Smite vorbereitet
                target.thunderousSmitePrepared = true;
            },
            onRemove: (target, gameState) => {
                delete target.thunderousSmitePrepared;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Verbrauche den vorbereiteten Thunderous Smite
                delete attacker.thunderousSmitePrepared;

                // 2W6 Donnerschaden
                let additionalDamage = 0;
                for (let i = 0; i < 2; i++) {
                    additionalDamage += Math.floor(Math.random() * 6) + 1; // 1W6
                }

                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(attacker);

                // Führe einen Stärke-Rettungswurf durch
                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.STRENGTH, saveDC);

                if (!saveResult.success) {
                    // Ziel wird 10 Fuß weggestoßen und fällt hin
                    const direction = {
                        x: target.position.x - attacker.position.x,
                        y: target.position.y - attacker.position.y
                    };

                    // Normalisiere den Vektor
                    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                    if (length > 0) {
                        direction.x = direction.x / length;
                        direction.y = direction.y / length;
                    }

                    // Bewege 2 Felder zurück (10 Fuß)
                    const newPosition = {
                        x: target.position.x + Math.round(direction.x * 2),
                        y: target.position.y + Math.round(direction.y * 2)
                    };

                    // Bewege die Kreatur und lass sie fallen
                    if (this.gameState.moveCreature) {
                        this.gameState.moveCreature(target.id, newPosition);
                    }

                    // Füge den Zustand "Liegend" hinzu
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.PRONE)) {
                        target.conditions.push(CONDITIONS.PRONE);
                    }

                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.THUNDER,
                        message: `Ein donnernder Knall ertönt, der 300 Fuß weit zu hören ist, während ${target.name} ${additionalDamage} Donnerschaden erleidet, 10 Fuß zurückgestoßen wird und zu Boden fällt.`,
                        saveRoll: saveResult,
                        pushed: true,
                        prone: true
                    };
                } else {
                    // Ziel nimmt nur Schaden
                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.THUNDER,
                        message: `Ein donnernder Knall ertönt, der 300 Fuß weit zu hören ist, während ${target.name} ${additionalDamage} Donnerschaden erleidet, aber standhaft bleibt.`,
                        saveRoll: saveResult
                    };
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'thunderous_smite',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Deine Waffe wird mit der Kraft des Donners aufgeladen. Der nächste Treffer mit einem Nahkampf-Waffenangriff innerhalb der nächsten Minute verursacht zusätzlich 2W6 Donnerschaden. Außerdem muss das Ziel einen Stärke-Rettungswurf bestehen oder wird 10 Fuß von dir weggestoßen und fällt zu Boden. Der Zauber erzeugt einen Donnerschlag, der 300 Fuß weit zu hören ist.";

        return results;
    }

    /**
     * Implementierung des Thunderwave-Zaubers (Donnerwelle)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} direction - Richtung der Donnerwelle
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castThunderwave(caster, direction, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'thunderwave',
            caster: caster.id,
            targets: [],
            message: "Eine Welle aus Donnerenergie bricht aus dir hervor."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Definiere den Bereich (15-Fuß-Würfel = 3x3 Felder, ausgehend vom Zauberwirker)
        // Die Welle breitet sich vom Zauberwirker in die gewählte Richtung aus
        const area = this._getThunderwaveArea(caster.position, direction);

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature && entity.id !== caster.id);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W8 Grundschaden
        const upcastDamage = slotLevel - 1; // +1W8 pro Slot-Level über 1
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Constitution-Saving Throw durch
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.THUNDER);

            // Berechne, ob das Ziel zurückgestoßen wird
            let pushed = false;
            if (!saveResult.success) {
                // Berechne die Richtung vom Zauberwirker zum Ziel
                pushed = this._pushFromThunderwave(caster, target);
            }

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success,
                pushed: pushed
            });
        });

        // Prüfe auf ungesicherte Objekte im Bereich
        const objectsInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => !entity.isCreature && entity.isObject && !entity.secured);

        // Objekte werden ebenfalls zurückgestoßen
        objectsInArea.forEach(object => {
            this._pushFromThunderwave(caster, object);
        });

        // Der Donnerschlag ist 300 Fuß weit zu hören
        this.gameState.createSoundEvent({
            position: caster.position,
            type: 'thunder',
            radius: 60, // 300 Fuß = 60 Felder
            source: caster.id,
            spell: 'thunderwave'
        });

        // Formatiere die Ergebnismeldung
        const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
        const savedCount = results.targets.filter(t => t.success).length;
        const pushedCount = results.targets.filter(t => t.pushed).length;

        if (results.targets.length > 0) {
            results.message = `Eine Welle aus Donnerenergie bricht aus dir hervor und trifft ${results.targets.length} Kreatur(en), was insgesamt ${totalDamage} Donnerschaden verursacht. `;

            if (savedCount > 0) {
                results.message += `${savedCount} Kreatur(en) bestehen den Rettungswurf und erleiden nur halben Schaden. `;
            }

            if (pushedCount > 0) {
                results.message += `${pushedCount} Kreatur(en) werden 10 Fuß von dir weggestoßen. `;
            }
        } else {
            results.message = "Eine Welle aus Donnerenergie bricht aus dir hervor, trifft aber keine Kreaturen. ";
        }

        if (objectsInArea.length > 0) {
            results.message += `${objectsInArea.length} ungesicherte Objekte werden ebenfalls weggestoßen. `;
        }

        results.message += "Der Donnerschlag ist 300 Fuß weit zu hören.";

        return results;
    }

    /**
     * Hilfsmethode: Berechnet den Bereich der Donnerwelle basierend auf der Position und Richtung
     * @private
     */
    _getThunderwaveArea(position, direction) {
        // Normalisiere die Richtung
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length > 0) {
            direction.x = direction.x / length;
            direction.y = direction.y / length;
        }

        // Bestimme die Hauptrichtung (N, O, S, W)
        let mainDir = '';
        if (Math.abs(direction.x) > Math.abs(direction.y)) {
            mainDir = direction.x > 0 ? 'east' : 'west';
        } else {
            mainDir = direction.y > 0 ? 'south' : 'north';
        }

        // Erstelle den Bereich basierend auf der Hauptrichtung
        let area = { x: 0, y: 0, width: 3, height: 3 };

        switch (mainDir) {
            case 'north':
                area.x = position.x - 1;
                area.y = position.y - 3;
                break;
            case 'east':
                area.x = position.x;
                area.y = position.y - 1;
                break;
            case 'south':
                area.x = position.x - 1;
                area.y = position.y;
                break;
            case 'west':
                area.x = position.x - 3;
                area.y = position.y - 1;
                break;
        }

        return area;
    }

    /**
     * Hilfsmethode: Stößt ein Ziel von der Position des Zauberwirkers weg
     * @private
     */
    _pushFromThunderwave(caster, target) {
        // Berechne die Richtung vom Zauberwirker zum Ziel
        const direction = {
            x: target.position.x - caster.position.x,
            y: target.position.y - caster.position.y
        };

        // Normalisiere den Vektor
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (length > 0) {
            direction.x = direction.x / length;
            direction.y = direction.y / length;
        } else {
            // Bei identischer Position: Zufällige Richtung
            const angle = Math.random() * 2 * Math.PI;
            direction.x = Math.cos(angle);
            direction.y = Math.sin(angle);
        }

        // Bewege 2 Felder zurück (10 Fuß)
        const newPosition = {
            x: target.position.x + Math.round(direction.x * 2),
            y: target.position.y + Math.round(direction.y * 2)
        };

        // Bewege das Objekt/die Kreatur
        if (this.gameState.moveEntity) {
            this.gameState.moveEntity(target.id, newPosition);
            return true;
        }

        return false;
    }

    /**
     * Implementierung des Witch Bolt-Zaubers (Hexenblitz)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castWitchBolt(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'witch_bolt',
            caster: caster.id,
            targets: [],
            message: "Ein Strahl knisternder, blauer Energie schießt auf ein Ziel in Reichweite zu."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Witch Bolt erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Witch Bolt kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        if (hits) {
            // Berechne den Schaden basierend auf dem Slot-Level
            const baseDamage = 1; // 1W12 Grundschaden
            const upcastDamage = slotLevel - 1; // +1W12 pro Slot-Level über 1
            let damageDice = baseDamage + upcastDamage;

            // Bei kritischem Treffer verdoppeln wir die Anzahl der Würfel
            if (isCritical) {
                damageDice *= 2;
            }

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 12) + 1; // 1W12
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.LIGHTNING);

            // Erstelle den anhaltenden Effekt für Witch Bolt
            const witchBoltEffectId = `witch_bolt_${Date.now()}`;
            const witchBoltEffect = {
                id: witchBoltEffectId,
                name: "Hexenblitz",
                description: "Ein Strahl aus Energie verbindet dich mit dem Ziel.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                casterId: caster.id,
                targetId: target.id,
                initialDamage: damage,
                continuousDamage: 1, // 1W12 kontinuierlicher Schaden
                // Kein onApply/onRemove nötig, da der Effekt hauptsächlich zur Tracking dient
                onTick: (target, gameState, deltaTime) => {
                    // Prüfe Abstand
                    const caster = gameState.getEntityById(witchBoltEffect.casterId);
                    const target = gameState.getEntityById(witchBoltEffect.targetId);

                    if (!caster || !target) {
                        // Einer der Beteiligten existiert nicht mehr
                        this.concentrationManager.breakConcentration(witchBoltEffect.casterId);
                        return;
                    }

                    const distance = gameState.calculateDistance(caster.position, target.position);
                    if (distance > 6) { // Mehr als 30 Fuß
                        gameState.addMessage(`Die Verbindung des Hexenblitzes wird unterbrochen, da ${target.name} außer Reichweite ist.`);
                        this.concentrationManager.breakConcentration(witchBoltEffect.casterId);
                        return;
                    }

                    // Kontinuierlicher Schaden kann als Aktion zugefügt werden
                    // Dies wird in der Regel durch die Spiellogik/UI gesteuert
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, witchBoltEffect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'witch_bolt',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: witchBoltEffectId,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, witchBoltEffectId);
                }
            });

            // Registriere eine Aktion für den kontinuierlichen Schaden
            caster.actions = caster.actions || {};
            caster.actions.witchBoltDamage = {
                name: "Hexenblitz - Kontinuierlicher Schaden",
                description: "Füge dem verbundenen Ziel 1W12 Blitzschaden zu.",
                actionType: "action",
                execute: () => {
                    // Prüfe, ob die Konzentration noch aktiv ist
                    if (!this.concentrationManager.isConcentrating(caster.id)) {
                        return { success: false, message: "Du konzentrierst dich nicht mehr auf Hexenblitz." };
                    }

                    // Prüfe, ob das Ziel noch in Reichweite ist
                    const currentTarget = this.gameState.getEntityById(target.id);
                    if (!currentTarget) {
                        this.concentrationManager.breakConcentration(caster.id);
                        return { success: false, message: "Das Ziel existiert nicht mehr." };
                    }

                    const currentDistance = this.gameState.calculateDistance(caster.position, currentTarget.position);
                    if (currentDistance > 6) { // Mehr als 30 Fuß
                        this.concentrationManager.breakConcentration(caster.id);
                        return { success: false, message: "Das Ziel ist außer Reichweite." };
                    }

                    // Füge Schaden zu (immer 1W12, unabhängig vom Slot-Level)
                    const continuousDamage = Math.floor(Math.random() * 12) + 1;
                    const damageResult = this.applyDamage(currentTarget, continuousDamage, DAMAGE_TYPES.LIGHTNING);

                    return {
                        success: true,
                        message: `Der Hexenblitz fügt ${currentTarget.name} weitere ${damageResult.damage} Blitzschaden zu.`,
                        damage: damageResult.damage
                    };
                }
            };

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: hits,
                critical: isCritical,
                damage: damageResult.damage,
                effect: witchBoltEffect.name
            });

            let message = `Der Hexenblitz trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${damageResult.damage} Blitzschaden. Ein Strahl blauer Energie verbindet dich mit dem Ziel. Du kannst in deinem nächsten Zug und in jedem weiteren Zug deine Aktion verwenden, um automatisch 1W12 Blitzschaden zu verursachen.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der Hexenblitz verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
     * Implementierung des Wrathful Smite-Zaubers (Zorniger Schlag)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castWrathfulSmite(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'wrathful_smite',
            caster: caster.id,
            message: "Deine Waffe wird mit psychischer Energie aufgeladen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Wrathful Smite erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Effekt
        const effect = {
            id: `wrathful_smite_${Date.now()}`,
            name: "Zorniger Schlag",
            description: "Der nächste Treffer mit einem Waffenangriff verursacht zusätzlichen psychischen Schaden.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Markiere den Charakter als mit Wrathful Smite vorbereitet
                target.wrathfulSmitePrepared = true;
            },
            onRemove: (target, gameState) => {
                delete target.wrathfulSmitePrepared;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Verbrauche den vorbereiteten Wrathful Smite
                delete attacker.wrathfulSmitePrepared;

                // 1W6 psychischer Schaden
                const additionalDamage = Math.floor(Math.random() * 6) + 1;

                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(attacker);

                // Führe einen Weisheits-Rettungswurf durch
                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

                if (!saveResult.success) {
                    // Erstelle den Angst-Effekt
                    const fearEffectId = `wrathful_smite_fear_${Date.now()}_${target.id}`;
                    const fearEffect = {
                        id: fearEffectId,
                        name: "Verängstigt (Zorniger Schlag)",
                        description: "Das Ziel ist von dir verängstigt.",
                        duration: 60000, // 1 Minute (max)
                        casterId: attacker.id,
                        saveDC: saveDC,
                        onApply: (target, gameState) => {
                            // Füge den Zustand "Verängstigt" hinzu
                            target.conditions = target.conditions || [];
                            if (!target.conditions.includes(CONDITIONS.FRIGHTENED)) {
                                target.conditions.push(CONDITIONS.FRIGHTENED);
                            }

                            // Speichere, von wem das Ziel verängstigt ist
                            target.frightenedBy = target.frightenedBy || [];
                            if (!target.frightenedBy.includes(attacker.id)) {
                                target.frightenedBy.push(attacker.id);
                            }
                        },
                        onRemove: (target, gameState) => {
                            // Entferne den Zustand und die Quelle der Angst
                            if (target.conditions) {
                                target.conditions = target.conditions.filter(c => c !== CONDITIONS.FRIGHTENED);
                                if (target.conditions.length === 0) {
                                    delete target.conditions;
                                }
                            }

                            if (target.frightenedBy) {
                                target.frightenedBy = target.frightenedBy.filter(id => id !== attacker.id);
                                if (target.frightenedBy.length === 0) {
                                    delete target.frightenedBy;
                                }
                            }
                        },
                        onTick: (target, gameState, deltaTime) => {
                            // Das Ziel kann als Aktion einen Weisheits-Check machen, um den Effekt zu beenden
                            // Dies wird normalerweise durch die Spiellogik/UI gesteuert
                        }
                    };

                    // Füge den Angst-Effekt zum Ziel hinzu
                    this.addEffect(target, fearEffect);

                    // Starte Konzentration auf den Angst-Effekt
                    this.concentrationManager.startConcentration(attacker.id, {
                        id: 'wrathful_smite',
                        startTime: Date.now(),
                        duration: 60000, // 1 Minute
                        targets: [target.id],
                        effectId: fearEffect.id,
                        onEnd: () => {
                            // Entferne den Effekt, wenn die Konzentration endet
                            this.removeEffect(target, fearEffect.id);
                        }
                    });

                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.PSYCHIC,
                        message: `${target.name} erleidet ${additionalDamage} psychischen Schaden und ist nun von dir verängstigt.`,
                        saveRoll: saveResult,
                        effect: fearEffect.name
                    };
                } else {
                    // Ziel ist nicht verängstigt, nimmt aber den Schaden
                    return {
                        additionalDamage: additionalDamage,
                        damageType: DAMAGE_TYPES.PSYCHIC,
                        message: `${target.name} erleidet ${additionalDamage} psychischen Schaden, wird aber nicht verängstigt.`,
                        saveRoll: saveResult
                    };
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'wrathful_smite',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = "Deine Waffe wird mit göttlicher Energie aufgeladen, die die Furcht deiner Feinde darstellt. Der nächste Treffer mit einem Nahkampf-Waffenangriff innerhalb der nächsten Minute verursacht zusätzlich 1W6 psychischen Schaden, und das Ziel muss einen Weisheits-Rettungswurf bestehen oder ist von dir verängstigt, bis der Zauber endet.";

        return results;
    }

    /**
 * Implementierung des Aid-Zaubers (Unterstützung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (bis zu drei Kreaturen)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castAid(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'aid',
            caster: caster.id,
            targets: [],
            message: "Deine Verbündeten werden von göttlicher Unterstützung gestärkt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Aid kann auf bis zu 3 Ziele gewirkt werden
        if (targets.length > 3) {
            targets = targets.slice(0, 3);
            results.message += " (Maximal 3 Ziele möglich)";
        }

        // Berechne die Erhöhung der maximalen TP und aktuellen TP
        const baseBonus = 5; // 5 TP bei Level 2
        const upcastBonus = (slotLevel - 2) * 5; // +5 TP pro Slot-Level über 2
        const totalBonus = baseBonus + upcastBonus;

        // Wende den Effekt auf jedes Ziel an
        targets.forEach(target => {
            // Erhöhe die maximalen TP für die Dauer des Zaubers
            const originalMaxHP = target.maxHP;
            target.maxHP += totalBonus;

            // Erhöhe die aktuellen TP um den gleichen Betrag
            const originalHP = target.currentHP;
            target.currentHP += totalBonus;

            // Erstelle den Effekt
            const effect = {
                id: `aid_${Date.now()}_${target.id}`,
                name: "Unterstützung",
                description: `Erhöht maximale und aktuelle Trefferpunkte um ${totalBonus}.`,
                duration: 28800000, // 8 Stunden = 28800 Sekunden = 28800000ms
                originalMaxHP: originalMaxHP,
                bonus: totalBonus,
                onRemove: (target, gameState) => {
                    // Reduziere die maximalen TP wieder
                    target.maxHP = effect.originalMaxHP;

                    // Begrenze die aktuellen TP auf das neue Maximum
                    if (target.currentHP > target.maxHP) {
                        target.currentHP = target.maxHP;
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, effect);

            results.targets.push({
                id: target.id,
                bonus: totalBonus,
                originalHP: originalHP,
                originalMaxHP: originalMaxHP,
                newHP: target.currentHP,
                newMaxHP: target.maxHP
            });
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length > 0) {
            results.message = `Du stärkst die Lebenskraft von ${results.targets.length} Verbündeten. Jedes Ziel erhält ${totalBonus} zusätzliche maximale und aktuelle Trefferpunkte für 8 Stunden.`;
        } else {
            results.message = "Der Zauber betrifft keine Ziele.";
        }

        return results;
    }

    /**
 * Implementierung des Barkskin-Zaubers (Rinde)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBarkskin(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'barkskin',
            caster: caster.id,
            targets: [],
            message: "Die Haut des Ziels wird hart wie Baumrinde."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Barkskin erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Barkskin kann nur auf eine willige Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Erstelle den Barkskin-Effekt
        const barkskinEffectId = `barkskin_${Date.now()}`;
        const barkskinEffect = {
            id: barkskinEffectId,
            name: "Rinde",
            description: "Die Rüstungsklasse des Ziels beträgt mindestens 16.",
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onApply: (target, gameState) => {
                // Speichere die ursprüngliche Rüstungsklasse
                target.originalArmorClass = target.armorClass;

                // Setze die Rüstungsklasse auf mindestens 16
                if (target.armorClass < 16) {
                    target.armorClass = 16;
                    target.barkskinActive = true;
                }
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprüngliche Rüstungsklasse wieder her
                if (target.barkskinActive) {
                    target.armorClass = target.originalArmorClass;
                    delete target.barkskinActive;
                    delete target.originalArmorClass;
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, barkskinEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'barkskin',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: [target.id],
            effectId: barkskinEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, barkskinEffectId);
            }
        });

        // Berechne, ob sich die Rüstungsklasse verändert hat
        const acChanged = target.armorClass > target.originalArmorClass;
        const newAC = target.armorClass;

        results.targets.push({
            id: target.id,
            effect: barkskinEffect.name,
            originalAC: target.originalArmorClass,
            newAC: newAC,
            changed: acChanged
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du berührst dich selbst und deine Haut wird hart wie Baumrinde.";
        } else {
            results.message = `Du berührst ${target.name} und die Haut des Ziels wird hart wie Baumrinde.`;
        }

        if (acChanged) {
            results.message += ` Die Rüstungsklasse erhöht sich auf 16, solange du dich konzentrierst (maximal 1 Stunde).`;
        } else {
            results.message += ` Da die Rüstungsklasse bereits 16 oder höher ist, bleibt sie unverändert bei ${newAC}.`;
        }

        return results;
    }

    /**
 * Implementierung des Blindness/Deafness-Zaubers (Blindheit/Taubheit)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (condition: 'blindness' oder 'deafness')
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBlindnessDeafness(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'blindness_deafness',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, ein Ziel zu blenden oder zu ertauben."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme die Anzahl der möglichen Ziele
        const maxTargets = slotLevel - 1; // 1 Ziel bei Level 2, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets + 1) {
            targets = targets.slice(0, maxTargets + 1);
        }

        // Bestimme, ob Blindheit oder Taubheit verursacht werden soll
        const condition = options.condition === 'deafness' ? 'deafness' : 'blindness';
        const conditionName = condition === 'deafness' ? 'Taubheit' : 'Blindheit';
        const conditionType = condition === 'deafness' ? CONDITIONS.DEAFENED : CONDITIONS.BLINDED;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Constitution-Saving Throw durch
        targets.forEach(target => {
            // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance > 6) { // Mehr als 30 Fuß entfernt
                results.targets.push({
                    id: target.id,
                    outOfRange: true
                });
                return;
            }

            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            if (!saveResult.success) {
                // Erstelle den Blindheit/Taubheit-Effekt
                const effectId = `blindness_deafness_${condition}_${Date.now()}_${target.id}`;
                const effect = {
                    id: effectId,
                    name: conditionName,
                    description: `Das Ziel ist ${conditionName === 'Blindheit' ? 'blind' : 'taub'}.`,
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    onApply: (target, gameState) => {
                        // Füge den Zustand hinzu
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(conditionType)) {
                            target.conditions.push(conditionType);
                        }
                    },
                    onRemove: (target, gameState) => {
                        // Entferne den Zustand
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c => c !== conditionType);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }
                    },
                    onTick: (target, gameState, deltaTime) => {
                        // Am Ende jedes Zuges des Ziels: Erlaube einen neuen Rettungswurf
                        if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                            const newSaveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);
                            if (newSaveResult.success) {
                                gameState.addMessage(`${target.name} überwindet die ${conditionName}!`);
                                this.removeEffect(target, effectId);
                            }
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, effect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: conditionName
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Timer zum Entfernen der Effekte nach Ablauf der Dauer
        setTimeout(() => {
            results.targets.forEach(targetInfo => {
                if (targetInfo.effect) {
                    const target = this.gameState.getEntityById(targetInfo.id);
                    if (target) {
                        const effect = target.effects?.find(e =>
                            e.id.startsWith(`blindness_deafness_${condition}_`));
                        if (effect) {
                            this.removeEffect(target, effect.id);
                        }
                    }
                }
            });
        }, 60000);

        // Formatiere die Ergebnismeldung
        const affectedCount = results.targets.filter(t => !t.success && !t.outOfRange).length;
        const outOfRangeCount = results.targets.filter(t => t.outOfRange).length;

        if (condition === 'blindness') {
            results.message = `Du versuchst, ${targets.length} Ziel(e) zu blenden.`;
        } else {
            results.message = `Du versuchst, ${targets.length} Ziel(e) zu ertauben.`;
        }

        if (affectedCount > 0) {
            results.message += ` ${affectedCount} Ziel(e) konnten dem Zauber nicht widerstehen und sind für 1 Minute betroffen.`;
        } else if (results.targets.length > outOfRangeCount) {
            results.message += " Alle Ziele in Reichweite widerstehen dem Zauber.";
        }

        if (outOfRangeCount > 0) {
            results.message += ` ${outOfRangeCount} Ziel(e) sind außerhalb der Reichweite.`;
        }

        return results;
    }

    /**
 * Implementierung des Blur-Zaubers (Verschwimmen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBlur(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'blur',
            caster: caster.id,
            message: "Deine Gestalt wird verschwommen und unscharf."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Blur erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Verschwimmen-Effekt
        const blurEffectId = `blur_${Date.now()}`;
        const blurEffect = {
            id: blurEffectId,
            name: "Verschwimmen",
            description: "Angriffe gegen dich haben Nachteil, außer der Angreifer ist immun gegen Illusionen.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                target.hasBlurEffect = true;
            },
            onRemove: (target, gameState) => {
                delete target.hasBlurEffect;
            },
            // Hook für Angriffswürfe gegen dich
            onBeingAttacked: (attacker, target, gameState) => {
                // Prüfe, ob der Angreifer immun ist
                const isImmune = attacker.immuneToIllusions ||
                    attacker.truesight ||
                    attacker.seeInvisible;

                if (!isImmune) {
                    return { disadvantage: true };
                }
                return {};
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, blurEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'blur',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: blurEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, blurEffectId);
            }
        });

        results.effect = blurEffect.name;
        results.duration = "1 Minute";

        results.message = "Dein Körper wird verschwommen und unscharf, sodass es schwieriger wird, dich zu treffen. Für die Dauer des Zaubers haben alle Kreaturen Nachteil bei Angriffswürfen gegen dich. Ein Angreifer ist von diesem Effekt nicht betroffen, wenn er nicht auf Sicht angewiesen ist, wie bei Blindsicht, oder wenn er Wahrnehmungssicht oder Wahre Sicht besitzt.";

        return results;
    }

    /**
 * Implementierung des Branding Smite-Zaubers (Brandmal)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBrandingSmite(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'branding_smite',
            caster: caster.id,
            message: "Deine Waffe wird mit gleißendem Licht erfüllt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Branding Smite erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W6 Grundschaden
        const upcastDamage = slotLevel - 2; // +1W6 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Erstelle den Effekt
        const effect = {
            id: `branding_smite_${Date.now()}`,
            name: "Brandmal",
            description: "Der nächste Treffer mit einem Waffenangriff verursacht zusätzlichen Strahlenschaden.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            damageDice: damageDice,
            onApply: (target, gameState) => {
                // Markiere den Charakter als mit Branding Smite vorbereitet
                target.brandingSmitePrepared = true;
            },
            onRemove: (target, gameState) => {
                delete target.brandingSmitePrepared;
            },
            onWeaponAttackHit: (attacker, target, damage, weapon) => {
                // Verbrauche den vorbereiteten Branding Smite
                delete attacker.brandingSmitePrepared;

                // Würfle für den zusätzlichen Schaden
                let additionalDamage = 0;
                for (let i = 0; i < damageDice; i++) {
                    additionalDamage += Math.floor(Math.random() * 6) + 1; // 1W6
                }

                // Erstelle den Brandmal-Effekt (Enthüllung und Unsichtbarkeit verhindern)
                const brandingEffect = {
                    id: `branding_smite_mark_${Date.now()}_${target.id}`,
                    name: "Brandmal-Zeichen",
                    description: "Das Ziel ist mit einem leuchtenden Mal gezeichnet und kann nicht unsichtbar werden.",
                    duration: 60000, // 1 Minute
                    onApply: (target, gameState) => {
                        // Verhindere Unsichtbarkeit
                        target.cannotBeInvisible = true;

                        // Falls das Ziel unsichtbar ist, wird es sichtbar
                        if (target.conditions && target.conditions.includes(CONDITIONS.INVISIBLE)) {
                            target.conditions = target.conditions.filter(c => c !== CONDITIONS.INVISIBLE);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }

                        // Füge visuellen Effekt hinzu (leuchtendes Mal)
                        target.hasGlowingMark = true;
                    },
                    onRemove: (target, gameState) => {
                        delete target.cannotBeInvisible;
                        delete target.hasGlowingMark;
                    }
                };

                // Füge den Brandmal-Effekt zum Ziel hinzu
                this.addEffect(target, brandingEffect);

                // Breche die Konzentration ab (da der Haupteffekt nun gewirkt hat)
                this.concentrationManager.breakConcentration(attacker.id);

                return {
                    additionalDamage: additionalDamage,
                    damageType: DAMAGE_TYPES.RADIANT,
                    message: `Dein Angriff trifft ${target.name} mit gleißendem Licht und verursacht ${additionalDamage} Strahlenschaden. Das Ziel ist mit einem leuchtenden Mal gezeichnet und kann für 1 Minute nicht unsichtbar werden.`,
                    effect: brandingEffect.name
                };
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'branding_smite',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, effect.id);
            }
        });

        results.effect = effect.name;
        results.message = `Deine Waffe wird mit gleißendem Licht erfüllt. Der nächste Treffer mit einem Waffenangriff innerhalb der nächsten Minute verursacht zusätzlich ${damageDice}W6 Strahlenschaden. Außerdem ist das Ziel mit einem leuchtenden Mal gezeichnet und kann für 1 Minute nicht unsichtbar werden.`;

        return results;
    }

    /**
 * Implementierung des Calm Emotions-Zaubers (Emotionen beruhigen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCalmEmotions(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'calm_emotions',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, starke Emotionen in einem Bereich zu unterdrücken."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Calm Emotions erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position,
            radius: 4
        };

        // Finde alle humanoiden Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, 4)
            .filter(entity => entity.isCreature && entity.type === 'humanoid');

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Charisma-Saving Throw durch
        const affectedTargets = [];
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CHARISMA, saveDC);

            if (!saveResult.success) {
                // Erstelle den Emotionen beruhigen-Effekt
                const calmEffect = {
                    id: `calm_emotions_${Date.now()}_${target.id}`,
                    name: "Emotionen beruhigen",
                    description: "Extreme Emotionen werden unterdrückt.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    onApply: (target, gameState) => {
                        // Option 1: Entferne Effekte, die Bezauberung oder Angst verursachen
                        if (options.removeEffects) {
                            // Entferne Bezauberungs-Effekte
                            if (target.charmedBy) {
                                delete target.charmedBy;
                            }

                            // Entferne Angst-Effekte
                            if (target.frightenedBy) {
                                delete target.frightenedBy;
                            }

                            // Entferne entsprechende Zustände
                            if (target.conditions) {
                                target.conditions = target.conditions.filter(c =>
                                    c !== CONDITIONS.CHARMED && c !== CONDITIONS.FRIGHTENED);
                                if (target.conditions.length === 0) {
                                    delete target.conditions;
                                }
                            }

                            target.calmEmotionsRemoveEffects = true;
                        }
                        // Option 2: Mache Kreaturen freundlich
                        else {
                            // Speichere die ursprüngliche Einstellung
                            target.originalAttitude = target.attitude || 'neutral';

                            // Setze die Einstellung auf freundlich
                            target.attitude = 'friendly';

                            target.calmEmotionsFriendly = true;
                        }
                    },
                    onRemove: (target, gameState) => {
                        // Stelle die ursprüngliche Einstellung wieder her
                        if (target.calmEmotionsFriendly && target.originalAttitude) {
                            target.attitude = target.originalAttitude;
                            delete target.originalAttitude;
                            delete target.calmEmotionsFriendly;
                        }

                        // Lösche den Marker, falls Option 1 verwendet wurde
                        if (target.calmEmotionsRemoveEffects) {
                            delete target.calmEmotionsRemoveEffects;
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, calmEffect);

                affectedTargets.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: calmEffect.name,
                    option: options.removeEffects ? "removeEffects" : "makeFriendly"
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'calm_emotions',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            targets: affectedTargets,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedTargets.length;
        const totalCount = creaturesInArea.length;

        if (totalCount > 0) {
            results.message = `Du unterdrückst starke Emotionen in einem 20-Fuß-Radius. Von ${totalCount} humanoiden Kreaturen im Bereich sind ${affectedCount} betroffen.`;

            if (affectedCount > 0) {
                if (options.removeEffects) {
                    results.message += " Die betroffenen Ziele sind nicht mehr bezaubert oder verängstigt.";
                } else {
                    results.message += " Die betroffenen Ziele werden für die Dauer des Zaubers friedlich und freundlich.";
                }
            }
        } else {
            results.message = "Es befinden sich keine humanoiden Kreaturen in dem Bereich.";
        }

        return results;
    }

    /**
 * Implementierung des Cloud of Daggers-Zaubers (Wolke aus Dolchen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCloudOfDaggers(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'cloud_of_daggers',
            caster: caster.id,
            message: "Du füllst die Luft mit wirbelnden Dolchen aus magischer Kraft."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Cloud of Daggers erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (5-Fuß-Würfel = 1x1 Feld)
        const area = {
            x: position.x,
            y: position.y,
            width: 1,
            height: 1,
            center: position
        };

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 4; // 4W4 Grundschaden
        const upcastDamage = (slotLevel - 2) * 2; // +2W4 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Erstelle den Cloud of Daggers-Effekt
        const cloudEffectId = `cloud_of_daggers_${Date.now()}`;
        const cloudEffect = {
            id: cloudEffectId,
            name: "Wolke aus Dolchen",
            description: `Eine 5-Fuß-Würfel aus wirbelnden Dolchen, die ${damageDice}W4 Schnittschaden verursacht.`,
            position: position,
            area: area,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            damageDice: damageDice,
            casterId: caster.id,
            terrain: {
                type: "hazardous",
                description: "Wirbelnde magische Dolche"
            },
            // Bei Betreten des Bereichs oder Beginn des Zuges darin
            onAreaEnter: (entity, gameState) => {
                if (entity.isCreature) {
                    // Berechne Schaden
                    let damage = 0;
                    for (let i = 0; i < damageDice; i++) {
                        damage += Math.floor(Math.random() * 4) + 1; // 1W4
                    }

                    // Füge Schaden zu
                    const damageResult = this.applyDamage(entity, damage, DAMAGE_TYPES.SLASHING);

                    gameState.addMessage(`${entity.name} betritt die Wolke aus Dolchen und erleidet ${damageResult.damage} Schnittschaden.`);
                }
            },
            onTick: (gameState, deltaTime) => {
                // Prüfe bei Rundenbeginn, ob Kreaturen im Bereich sind
                const creaturesInArea = gameState.getEntitiesInArea(area)
                    .filter(entity => entity.isCreature);

                creaturesInArea.forEach(entity => {
                    // Wenn eine Kreatur ihren Zug in dem Bereich beginnt
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(entity.id)) {
                        // Berechne Schaden
                        let damage = 0;
                        for (let i = 0; i < damageDice; i++) {
                            damage += Math.floor(Math.random() * 4) + 1; // 1W4
                        }

                        // Füge Schaden zu
                        const damageResult = this.applyDamage(entity, damage, DAMAGE_TYPES.SLASHING);

                        gameState.addMessage(`${entity.name} beginnt seinen Zug in der Wolke aus Dolchen und erleidet ${damageResult.damage} Schnittschaden.`);
                    }
                });
            }
        };

        // Füge den Cloud-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(cloudEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'cloud_of_daggers',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            environmentalEffectId: cloudEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(cloudEffectId);
            }
        });

        // Prüfe, ob sich bereits Kreaturen im Bereich befinden
        const initialTargets = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Für jede Kreatur, die sich bereits im Bereich befindet, sofort Schaden anwenden
        initialTargets.forEach(target => {
            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 4) + 1; // 1W4
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.SLASHING);

            results.targets = results.targets || [];
            results.targets.push({
                id: target.id,
                damage: damageResult.damage
            });
        });

        // Formatiere die Ergebnismeldung
        results.effect = cloudEffect;
        results.damageDice = damageDice;

        results.message = `Du erschaffst eine Wolke aus wirbelnden Dolchen in einem 5-Fuß-Würfel. Eine Kreatur erleidet ${damageDice}W4 Schnittschaden, wenn sie den Würfel zum ersten Mal während eines Zuges betritt oder ihren Zug darin beginnt. Die Wolke bleibt für 1 Minute bestehen, solange du dich konzentrierst.`;

        if (initialTargets.length > 0) {
            const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
            results.message += ` ${initialTargets.length} Kreatur(en) befinden sich bereits in dem Bereich und erleiden insgesamt ${totalDamage} Schnittschaden.`;
        }

        return results;
    }

    /**
 * Implementierung des Crown of Madness-Zaubers (Krone des Wahnsinns)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCrownOfMadness(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'crown_of_madness',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, eine Kreatur mit einer verdrehten Krone aus gezacktem Eisen zu beschwören."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Crown of Madness erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Crown of Madness kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (120 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 24) { // 120 Fuß = 24 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (120 Fuß).";
            return results;
        }

        // Prüfe, ob das Ziel ein Humanoid ist
        if (target.type !== 'humanoid') {
            results.success = false;
            results.message = "Dieser Zauber wirkt nur auf Humanoide.";
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Weisheits-Rettungswurf durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

        if (!saveResult.success) {
            // Erstelle den Krone des Wahnsinns-Effekt
            const crownEffectId = `crown_of_madness_${Date.now()}`;
            const crownEffect = {
                id: crownEffectId,
                name: "Krone des Wahnsinns",
                description: "Eine verdrehte Krone aus gezacktem Eisen erscheint auf dem Kopf des Ziels.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                casterId: caster.id,
                targetId: target.id,
                saveDC: saveDC,
                onApply: (target, gameState) => {
                    // Markiere das Ziel als bezaubert
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.CHARMED)) {
                        target.conditions.push(CONDITIONS.CHARMED);
                    }

                    // Speichere, von wem das Ziel bezaubert ist
                    target.charmedBy = target.charmedBy || [];
                    if (!target.charmedBy.includes(caster.id)) {
                        target.charmedBy.push(caster.id);
                    }

                    // Füge visuellen Effekt hinzu (die Krone)
                    target.hasMadnessCrown = true;
                },
                onRemove: (target, gameState) => {
                    // Entferne den Zustand und die Quelle der Bezauberung
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c => c !== CONDITIONS.CHARMED);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }

                    if (target.charmedBy) {
                        target.charmedBy = target.charmedBy.filter(id => id !== caster.id);
                        if (target.charmedBy.length === 0) {
                            delete target.charmedBy;
                        }
                    }

                    delete target.hasMadnessCrown;
                    delete target.forcedAttackTarget;
                },
                onTick: (target, gameState, deltaTime) => {
                    // Am Beginn des Zuges des Ziels
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(target.id)) {
                        // Führe erneut einen Weisheits-Rettungswurf durch
                        const newSaveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

                        if (newSaveResult.success) {
                            gameState.addMessage(`${target.name} befreit sich von der Krone des Wahnsinns!`);
                            this.concentrationManager.breakConcentration(caster.id);
                            return;
                        }

                        // Finde mögliche Ziele für den erzwungenen Angriff
                        const possibleTargets = gameState.getEntitiesInRadius(target.position, target.meleeRange || 1)
                            .filter(e => e.isCreature && e.id !== target.id && e.id !== caster.id);

                        if (possibleTargets.length > 0) {
                            // Wähle ein zufälliges Ziel
                            const attackTarget = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

                            // Markiere das Ziel für den Angriff
                            target.forcedAttackTarget = attackTarget.id;

                            gameState.addMessage(`Die Krone des Wahnsinns zwingt ${target.name}, ${attackTarget.name} anzugreifen!`);
                        } else {
                            gameState.addMessage(`Die Krone des Wahnsinns versucht, ${target.name} zum Angriff zu zwingen, aber es sind keine Ziele in Reichweite.`);
                        }
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, crownEffect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'crown_of_madness',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: crownEffectId,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, crownEffectId);
                }
            });

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: false,
                effect: crownEffect.name
            });

            results.message = `Eine verdrehte Krone aus gezacktem Eisen erscheint auf dem Kopf von ${target.name}. Das Ziel ist nun von dir bezaubert und muss vor seiner Bewegung in jedem seiner Züge einen Nahkampfangriff gegen eine Kreatur deiner Wahl durchführen, wenn es in Reichweite ist. Nach jedem Zug kann das Ziel einen erneuten Rettungswurf machen, um den Effekt zu beenden.`;
        } else {
            // Rettungswurf erfolgreich, keine Wirkung
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            results.message = `${target.name} widersteht der Krone des Wahnsinns.`;
        }

        return results;
    }

    /**
 * Implementierung des Darkness-Zaubers (Dunkelheit)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum der Dunkelheit
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (object: Zielobjekt für die Dunkelheit)
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDarkness(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'darkness',
            caster: caster.id,
            message: "Magische Dunkelheit breitet sich aus und verdrängt jegliches Licht."
        };

        // Prüfe, ob die benötigten Materialkomponenten vorhanden sind
        const hasMaterials = caster.components && caster.components.some(c =>
            c.type === 'bat_fur' || c.type === 'pitch' || c.type === 'coal');

        if (!hasMaterials && !options.ignoreComponents) {
            results.success = false;
            results.message = "Du benötigst Fledermauspelz und ein Stück Pech oder ein Stück Kohle, um diesen Zauber zu wirken.";
            return results;
        }

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Darkness erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Bestimme, ob die Dunkelheit an ein Objekt gebunden wird
        const targetObject = options.object ? this.gameState.getEntityById(options.object) : null;
        const attachedToObject = targetObject !== null;

        // Position bestimmen (entweder direkt oder vom Objekt)
        const darkPosition = attachedToObject ? { ...targetObject.position } : position;

        // Erstelle den Dunkelheits-Effekt
        const darknessEffectId = `darkness_${Date.now()}`;
        const darknessEffect = {
            id: darknessEffectId,
            name: "Dunkelheit",
            description: "Eine Sphäre aus magischer Dunkelheit mit 15 Fuß Radius.",
            position: darkPosition,
            radius: 3, // 15 Fuß Radius = 3 Felder
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            attachedTo: attachedToObject ? targetObject.id : null,
            onApply: (gameState) => {
                // Erstelle den Dunkelheitsbereich
                gameState.createObscuredArea({
                    id: darknessEffectId,
                    position: darkPosition,
                    radius: 3, // 15 Fuß Radius
                    type: 'darkness',
                    visibility: 'magical_darkness', // Spezielle Art der Dunkelheit, die auch Dunkelsicht übertrifft
                    movesWithObject: attachedToObject
                });
            },
            onRemove: (gameState) => {
                // Entferne den Dunkelheitsbereich
                gameState.removeObscuredArea(darknessEffectId);
            },
            onTick: (gameState, deltaTime) => {
                // Wenn die Dunkelheit an ein Objekt gebunden ist, bewege sie mit dem Objekt
                if (attachedToObject) {
                    const object = gameState.getEntityById(targetObject.id);
                    if (object) {
                        gameState.updateObscuredAreaPosition(darknessEffectId, object.position);
                    }
                }

                // Prüfe, ob die Dunkelheit mit Lichtquellen interagiert
                const lightsInArea = gameState.getLightsInRadius(darknessEffect.position, darknessEffect.radius);
                lightsInArea.forEach(light => {
                    // Magische Dunkelheit löscht alle Lichtquellen unter Stufe 3 aus
                    if (light.level < 3) {
                        gameState.suppressLight(light.id);
                    }
                });
            }
        };

        // Füge den Dunkelheits-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(darknessEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'darkness',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            environmentalEffectId: darknessEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(darknessEffectId);
            }
        });

        results.effect = darknessEffect;

        // Formatiere die Ergebnismeldung
        if (attachedToObject) {
            results.message = `Du erschaffst eine Sphäre aus magischer Dunkelheit mit einem Radius von 15 Fuß, die an ${targetObject.name} gebunden ist und sich mit dem Objekt bewegt. Die Dunkelheit breitet sich um Ecken aus und verdeckt sogar magisches Licht. Kreaturen mit Dunkelsicht können nicht durch diese Dunkelheit sehen. Nicht-magisches Licht sowie Lichtzauber unter Stufe 3 können den Bereich nicht erhellen.`;
        } else {
            results.message = `Du erschaffst eine Sphäre aus magischer Dunkelheit mit einem Radius von 15 Fuß. Die Dunkelheit breitet sich um Ecken aus und verdeckt sogar magisches Licht. Kreaturen mit Dunkelsicht können nicht durch diese Dunkelheit sehen. Nicht-magisches Licht sowie Lichtzauber unter Stufe 3 können den Bereich nicht erhellen.`;
        }

        return results;
    }

    /**
 * Implementierung des Darkvision-Zaubers (Dunkelsicht)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (willige Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDarkvision(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'darkvision',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine willige Kreatur und verleihst ihr die Fähigkeit, in der Dunkelheit zu sehen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Darkvision kann nur auf eine Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Erstelle den Dunkelsicht-Effekt
        const darkvisionEffectId = `darkvision_${Date.now()}`;
        const darkvisionEffect = {
            id: darkvisionEffectId,
            name: "Dunkelsicht",
            description: "Verleiht die Fähigkeit, in der Dunkelheit zu sehen.",
            duration: 28800000, // 8 Stunden = 28800 Sekunden = 28800000ms
            onApply: (target, gameState) => {
                // Speichere die ursprüngliche Dunkelsicht-Reichweite
                target.originalDarkvision = target.senses && target.senses.darkvision ? target.senses.darkvision : 0;

                // Setze die Dunkelsicht auf 60 Fuß (12 Felder), wenn sie nicht bereits größer ist
                if (!target.senses) target.senses = {};
                if (!target.senses.darkvision || target.senses.darkvision < 12) {
                    target.senses.darkvision = 12; // 60 Fuß
                }
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprüngliche Dunkelsicht wieder her
                if (target.originalDarkvision !== undefined) {
                    if (target.originalDarkvision > 0) {
                        target.senses.darkvision = target.originalDarkvision;
                    } else {
                        delete target.senses.darkvision;
                    }
                    delete target.originalDarkvision;
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, darkvisionEffect);

        results.targets.push({
            id: target.id,
            effect: darkvisionEffect.name
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du verleihst dir selbst die Fähigkeit, in der Dunkelheit zu sehen. Du erhältst Dunkelsicht mit einer Reichweite von 60 Fuß für 8 Stunden.";
        } else {
            results.message = `Du berührst ${target.name} und verleihst dem Ziel die Fähigkeit, in der Dunkelheit zu sehen. Das Ziel erhält Dunkelsicht mit einer Reichweite von 60 Fuß für 8 Stunden.`;
        }

        return results;
    }

    /**
     * Implementierung des Detect Thoughts-Zaubers (Gedanken wahrnehmen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur für tieferes Eindringen)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castDetectThoughts(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'detect_thoughts',
            caster: caster.id,
            targets: [],
            message: "Du öffnest deinen Geist, um die Gedanken anderer wahrnehmen zu können."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Detect Thoughts erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Erstelle den Gedanken wahrnehmen-Effekt für den Zauberwirker
        const detectThoughtsEffectId = `detect_thoughts_${Date.now()}`;
        const detectThoughtsEffect = {
            id: detectThoughtsEffectId,
            name: "Gedanken wahrnehmen",
            description: "Du kannst oberflächliche Gedanken von Kreaturen wahrnehmen.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (caster, gameState) => {
                caster.canDetectThoughts = true;
                caster.detectThoughtsRadius = 6; // 30 Fuß Radius (6 Felder)
            },
            onRemove: (caster, gameState) => {
                delete caster.canDetectThoughts;
                delete caster.detectThoughtsRadius;
                delete caster.deepThoughtTarget;
            },
            onTick: (caster, gameState, deltaTime) => {
                // Wenn der Zauberwirker den "passiven" Teil des Zaubers nutzt,
                // erkennt er Kreaturen mit Intelligenz > 3 in der Nähe
                const nearbyCreatures = gameState.getEntitiesInRadius(caster.position, caster.detectThoughtsRadius)
                    .filter(entity =>
                        entity.isCreature &&
                        entity.id !== caster.id &&
                        entity.abilities &&
                        entity.abilities.intelligence > 3);

                // Informationen über erkannte Kreaturen können über die UI angezeigt werden
                if (nearbyCreatures.length > 0 && Math.random() < 0.1) { // Gelegentliche Hinweise
                    gameState.addMessage(`Du spürst die Anwesenheit von ${nearbyCreatures.length} denkenden Wesen in der Nähe.`);
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, detectThoughtsEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'detect_thoughts',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: detectThoughtsEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, detectThoughtsEffectId);
            }
        });

        // Optional: Tieferes Eindringen in Gedanken eines bestimmten Ziels
        if (targets.length > 0) {
            const target = targets[0];

            // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance <= 6) { // 30 Fuß = 6 Felder
                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(caster);

                // Führe einen Weisheits-Rettungswurf durch
                const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

                if (!saveResult.success) {
                    // Tieferes Eindringen erfolgreich
                    caster.deepThoughtTarget = target.id;

                    results.targets.push({
                        id: target.id,
                        saveRoll: saveResult,
                        success: false,
                        effect: "Tiefe Gedankenlese"
                    });

                    results.message += ` Du dringst tiefer in die Gedanken von ${target.name} ein. Das Ziel ist sich deiner Anwesenheit bewusst.`;
                } else {
                    // Rettungswurf erfolgreich
                    results.targets.push({
                        id: target.id,
                        saveRoll: saveResult,
                        success: true
                    });

                    results.message += ` ${target.name} widersteht deinem Versuch, tiefer in seine Gedanken einzudringen.`;
                }
            } else {
                results.message += " Das gewählte Ziel für tieferes Gedankenlesen ist außerhalb der Reichweite (30 Fuß).";
            }
        }

        // Standardmeldung, wenn kein spezifisches Ziel gewählt wurde
        if (targets.length === 0) {
            results.message = "Du öffnest deinen Geist, um die oberflächlichen Gedanken von Kreaturen im Umkreis von 30 Fuß wahrzunehmen. Du kannst die Anwesenheit denkender Kreaturen mit Intelligenz über 3 spüren und deren Emotionen sowie Gedankenfragmente wahrnehmen, solange du dich konzentrierst.";
        }

        return results;
    }

    /**
     * Implementierung des Enhance Ability-Zaubers (Eigenschaft verbessern)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen (ability: zu verbessernde Eigenschaft)
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castEnhanceAbility(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'enhance_ability',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und verleihst ihr magische Verbesserung."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Enhance Ability erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Bestimme die Anzahl der möglichen Ziele
        const maxTargets = slotLevel - 1; // 1 Ziel bei Level 2, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets + 1) {
            targets = targets.slice(0, maxTargets + 1);
            results.message += ` (Maximal ${maxTargets + 1} Ziele möglich)`;
        }

        // Gültige Eigenschaften und ihre Effekte
        const validAbilities = {
            'strength': {
                name: "Bärenstärke",
                description: "Vorteil bei Stärke-Würfen und doppelte Tragekapazität.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.strength = true;
                    target.carryCapacityMultiplier = (target.carryCapacityMultiplier || 1) * 2;
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.strength;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }
                    if (target.carryCapacityMultiplier) {
                        target.carryCapacityMultiplier = target.carryCapacityMultiplier / 2;
                        if (target.carryCapacityMultiplier === 1) {
                            delete target.carryCapacityMultiplier;
                        }
                    }
                }
            },
            'dexterity': {
                name: "Katzengrazie",
                description: "Vorteil bei Geschicklichkeits-Würfen und kein Fallschaden bis 20 Fuß.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.dexterity = true;
                    target.reduceFallDamage = (target.reduceFallDamage || 0) + 20;
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.dexterity;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }
                    if (target.reduceFallDamage) {
                        target.reduceFallDamage -= 20;
                        if (target.reduceFallDamage <= 0) {
                            delete target.reduceFallDamage;
                        }
                    }
                }
            },
            'constitution': {
                name: "Ausdauer des Bullen",
                description: "Vorteil bei Konstitutions-Würfen und 2W6 temporäre Trefferpunkte.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.constitution = true;

                    // Würfle für temporäre TP
                    let tempHP = 0;
                    for (let i = 0; i < 2; i++) {
                        tempHP += Math.floor(Math.random() * 6) + 1; // 2W6
                    }

                    // Füge temporäre TP hinzu (überschreibt nicht höhere)
                    if (!target.temporaryHP || tempHP > target.temporaryHP) {
                        target.temporaryHP = tempHP;
                    }

                    return tempHP; // Gib die gewürfelten TP zurück
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.constitution;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }
                    // Temporäre TP bleiben bestehen
                }
            },
            'intelligence': {
                name: "Fuchsschlauheit",
                description: "Vorteil bei Intelligenz-Würfen und Sprachen für die Dauer des Zaubers.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.intelligence = true;

                    // Speichere die ursprünglichen Sprachen
                    target.originalLanguages = [...(target.languages || [])];

                    // Füge alle Standardsprachen hinzu
                    const allLanguages = ["common", "dwarvish", "elvish", "giant", "gnomish",
                        "goblin", "halfling", "orc"];
                    target.languages = [...new Set([...(target.languages || []), ...allLanguages])];
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.intelligence;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }

                    // Stelle die ursprünglichen Sprachen wieder her
                    if (target.originalLanguages) {
                        target.languages = [...target.originalLanguages];
                        delete target.originalLanguages;
                    }
                }
            },
            'wisdom': {
                name: "Eulenweisheit",
                description: "Vorteil bei Weisheits-Würfen und verbesserte Wahrnehmung.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.wisdom = true;

                    // Verbesserte Wahrnehmung
                    target.advantageSkill = target.advantageSkill || {};
                    target.advantageSkill.perception = true;
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.wisdom;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }

                    if (target.advantageSkill) {
                        delete target.advantageSkill.perception;
                        if (Object.keys(target.advantageSkill).length === 0) {
                            delete target.advantageSkill;
                        }
                    }
                }
            },
            'charisma': {
                name: "Adlercharisma",
                description: "Vorteil bei Charisma-Würfen und bessere soziale Interaktionen.",
                onApply: (target) => {
                    target.advantageAbility = target.advantageAbility || {};
                    target.advantageAbility.charisma = true;

                    // Verbesserte soziale Fähigkeiten
                    target.advantageSkill = target.advantageSkill || {};
                    target.advantageSkill.persuasion = true;
                    target.advantageSkill.deception = true;
                    target.advantageSkill.intimidation = true;
                    target.advantageSkill.performance = true;
                },
                onRemove: (target) => {
                    if (target.advantageAbility) {
                        delete target.advantageAbility.charisma;
                        if (Object.keys(target.advantageAbility).length === 0) {
                            delete target.advantageAbility;
                        }
                    }

                    if (target.advantageSkill) {
                        delete target.advantageSkill.persuasion;
                        delete target.advantageSkill.deception;
                        delete target.advantageSkill.intimidation;
                        delete target.advantageSkill.performance;
                        if (Object.keys(target.advantageSkill).length === 0) {
                            delete target.advantageSkill;
                        }
                    }
                }
            }
        };

        // Überprüfe, ob eine gültige Eigenschaft angegeben wurde
        const ability = options.ability || 'constitution'; // Standard: Konstitution
        if (!validAbilities[ability]) {
            results.success = false;
            results.message = "Ungültige Eigenschaft angegeben. Bitte wähle zwischen Stärke, Geschicklichkeit, Konstitution, Intelligenz, Weisheit oder Charisma.";
            return results;
        }

        const abilityEffect = validAbilities[ability];
        const affectedTargets = [];

        // Wende den Effekt auf jedes Ziel an
        targets.forEach(target => {
            // Prüfe, ob das Ziel in Berührungsreichweite ist
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance > 1) { // Mehr als 5 Fuß entfernt
                results.targets.push({
                    id: target.id,
                    outOfRange: true
                });
                return;
            }

            // Erstelle den Eigenschaft verbessern-Effekt
            const enhanceAbilityEffectId = `enhance_ability_${ability}_${Date.now()}_${target.id}`;
            const enhanceAbilityEffect = {
                id: enhanceAbilityEffectId,
                name: abilityEffect.name,
                description: abilityEffect.description,
                duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
                ability: ability,
                onApply: (target, gameState) => {
                    // Rufe die spezifische onApply-Funktion für diese Fähigkeit auf
                    const result = abilityEffect.onApply(target);
                    return result; // Gibt z.B. temporäre TP zurück
                },
                onRemove: (target, gameState) => {
                    // Rufe die spezifische onRemove-Funktion für diese Fähigkeit auf
                    abilityEffect.onRemove(target);
                }
            };

            // Füge den Effekt zum Ziel hinzu
            const applyResult = this.addEffect(target, enhanceAbilityEffect);
            const extraResult = enhanceAbilityEffect.onApply(target);

            affectedTargets.push(target.id);

            results.targets.push({
                id: target.id,
                effect: enhanceAbilityEffect.name,
                extraResult: extraResult
            });
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'enhance_ability',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: affectedTargets,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length > 0) {
            const effectName = abilityEffect.name;
            const effectDesc = abilityEffect.description;
            const outOfRangeCount = results.targets.filter(t => t.outOfRange).length;
            const affectedCount = results.targets.length - outOfRangeCount;

            if (affectedCount === 1) {
                const target = this.gameState.getEntityById(results.targets[0].id);
                const targetName = target.id === caster.id ? "dich selbst" : target.name;

                results.message = `Du berührst ${targetName} und verleihst ${targetName === "dich selbst" ? "dir" : "dem Ziel"} ${effectName}. ${effectDesc}`;

                // Füge Informationen über temporäre TP hinzu, falls vorhanden
                if (ability === 'constitution' && results.targets[0].extraResult) {
                    results.message += ` ${targetName === "dich selbst" ? "Du erhältst" : `${target.name} erhält`} ${results.targets[0].extraResult} temporäre Trefferpunkte.`;
                }
            } else {
                results.message = `Du berührst ${affectedCount} Kreatur(en) und verleihst ihnen ${effectName}. ${effectDesc}`;

                // Füge Informationen über temporäre TP hinzu, falls vorhanden
                if (ability === 'constitution') {
                    const totalTempHP = results.targets.reduce((sum, t) => sum + (t.extraResult || 0), 0);
                    if (totalTempHP > 0) {
                        results.message += ` Die Ziele erhalten insgesamt ${totalTempHP} temporäre Trefferpunkte.`;
                    }
                }
            }

            if (outOfRangeCount > 0) {
                results.message += ` ${outOfRangeCount} Ziel(e) sind außerhalb der Berührungsreichweite.`;
            }

            results.message += " Der Effekt hält für 1 Stunde an, solange du dich konzentrierst.";
        } else {
            results.message = "Der Zauber betrifft keine Ziele.";
        }

        return results;
    }

    /**
     * Implementierung des Enlarge/Reduce-Zaubers (Vergrößern/Verkleinern)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur oder Objekt)
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen (mode: 'enlarge' oder 'reduce')
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castEnlargeReduce(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'enlarge_reduce',
            caster: caster.id,
            targets: [],
            message: "Du lässt eine Kreatur oder ein Objekt größer oder kleiner werden."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Enlarge/Reduce erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Enlarge/Reduce kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Bestimme, ob vergrößern oder verkleinern
        const mode = options.mode === 'reduce' ? 'reduce' : 'enlarge'; // Standard: vergrößern

        // Prüfe, ob das Ziel nicht gewillt ist (nur für Kreaturen)
        if (target.isCreature && target.id !== caster.id) {
            // Berechne den DC für den Rettungswurf
            const saveDC = this.calculateSpellSaveDC(caster);

            // Führe einen Konstitutions-Rettungswurf durch
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            if (saveResult.success) {
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });

                results.message = `${target.name} widersteht dem Zauber.`;
                return results;
            }
        }

        // Prüfe, ob das Objekt von einer Kreatur getragen wird
        if (!target.isCreature && target.carriedBy) {
            const carrier = this.gameState.getEntityById(target.carriedBy);
            if (carrier) {
                // Berechne den DC für den Rettungswurf
                const saveDC = this.calculateSpellSaveDC(caster);

                // Führe einen Konstitutions-Rettungswurf durch
                const saveResult = this.makeSavingThrow(carrier, SAVING_THROWS.CONSTITUTION, saveDC);

                if (saveResult.success) {
                    results.targets.push({
                        id: target.id,
                        carriedBy: carrier.id,
                        saveRoll: saveResult,
                        success: true
                    });

                    results.message = `${carrier.name} widersteht dem Zauber, und ${target.name} bleibt unverändert.`;
                    return results;
                }
            }
        }

        // Erstelle den Vergrößern/Verkleinern-Effekt
        const effectId = `enlarge_reduce_${mode}_${Date.now()}`;
        const effect = {
            id: effectId,
            name: mode === 'enlarge' ? "Vergrößern" : "Verkleinern",
            description: mode === 'enlarge' ?
                "Das Ziel wird doppelt so groß und erhält Vorteil bei Stärke-Würfen." :
                "Das Ziel wird halb so groß und erhält Nachteil bei Stärke-Würfen.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            mode: mode,
            onApply: (target, gameState) => {
                // Speichere die ursprünglichen Werte
                target.originalSize = target.size || 'medium';
                target.originalHeight = target.height || 1;
                target.originalWidth = target.width || 1;
                target.originalWeight = target.weight || 1;
                target.originalScale = target.scale || 1;

                if (target.isCreature) {
                    // Speichere Schaden und Stärkevorteile/nachteile
                    target.originalDamageDiceCount = target.damageDiceCount || {};
                    Object.keys(target.damageDiceCount || {}).forEach(key => {
                        target.originalDamageDiceCount[key] = target.damageDiceCount[key];
                    });
                }

                if (mode === 'enlarge') {
                    // Vergrößern
                    target.size = this._getEnlargedSize(target.originalSize);
                    target.height = target.originalHeight * 2;
                    target.width = target.originalWidth * 2;
                    target.weight = target.originalWeight * 8; // 8-faches Gewicht
                    target.scale = target.originalScale * 2;

                    if (target.isCreature) {
                        // Vorteil bei Stärke-Würfen
                        target.advantageAbility = target.advantageAbility || {};
                        target.advantageAbility.strength = true;

                        // Zusätzlicher Würfel für Waffenschaden
                        target.extraDamageDice = 1;
                    }
                } else {
                    // Verkleinern
                    target.size = this._getReducedSize(target.originalSize);
                    target.height = target.originalHeight * 0.5;
                    target.width = target.originalWidth * 0.5;
                    target.weight = target.originalWeight * 0.125; // 1/8 des Gewichts
                    target.scale = target.originalScale * 0.5;

                    if (target.isCreature) {
                        // Nachteil bei Stärke-Würfen
                        target.disadvantageAbility = target.disadvantageAbility || {};
                        target.disadvantageAbility.strength = true;

                        // Reduzierter Waffenschaden
                        target.reducedDamage = true;
                    }
                }
            },
            onRemove: (target, gameState) => {
                // Stelle die ursprünglichen Werte wieder her
                if (target.originalSize) target.size = target.originalSize;
                if (target.originalHeight) target.height = target.originalHeight;
                if (target.originalWidth) target.width = target.originalWidth;
                if (target.originalWeight) target.weight = target.originalWeight;
                if (target.originalScale) target.scale = target.originalScale;

                // Entferne gespeicherte Originalwerte
                delete target.originalSize;
                delete target.originalHeight;
                delete target.originalWidth;
                delete target.originalWeight;
                delete target.originalScale;

                if (target.isCreature) {
                    if (mode === 'enlarge') {
                        // Entferne Vorteil bei Stärke-Würfen
                        if (target.advantageAbility) {
                            delete target.advantageAbility.strength;
                            if (Object.keys(target.advantageAbility).length === 0) {
                                delete target.advantageAbility;
                            }
                        }

                        // Entferne zusätzlichen Würfel für Waffenschaden
                        delete target.extraDamageDice;
                    } else {
                        // Entferne Nachteil bei Stärke-Würfen
                        if (target.disadvantageAbility) {
                            delete target.disadvantageAbility.strength;
                            if (Object.keys(target.disadvantageAbility).length === 0) {
                                delete target.disadvantageAbility;
                            }
                        }

                        // Entferne reduzierten Waffenschaden
                        delete target.reducedDamage;
                    }

                    // Stelle ursprünglichen Schaden wieder her
                    if (target.originalDamageDiceCount) {
                        target.damageDiceCount = { ...target.originalDamageDiceCount };
                        delete target.originalDamageDiceCount;
                    }
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, effect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'enlarge_reduce',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: [target.id],
            effectId: effect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, effect.id);
            }
        });

        results.targets.push({
            id: target.id,
            effect: effect.name,
            mode: mode
        });

        // Formatiere die Ergebnismeldung
        if (mode === 'enlarge') {
            if (target.isCreature) {
                results.message = `${target.name} wächst auf die doppelte Größe und erhält Vorteil bei Stärke-Würfen sowie erhöhten Waffenschaden für die nächste Minute, solange du dich konzentrierst.`;
            } else {
                results.message = `${target.name} wächst auf die doppelte Größe für die nächste Minute, solange du dich konzentrierst.`;
            }
        } else {
            if (target.isCreature) {
                results.message = `${target.name} schrumpft auf die halbe Größe und erhält Nachteil bei Stärke-Würfen sowie reduzierten Waffenschaden für die nächste Minute, solange du dich konzentrierst.`;
            } else {
                results.message = `${target.name} schrumpft auf die halbe Größe für die nächste Minute, solange du dich konzentrierst.`;
            }
        }

        return results;
    }

    /**
     * Hilfsmethode: Gibt die nächstgrößere Größe zurück
     * @private
     */
    _getEnlargedSize(originalSize) {
        const sizeOrder = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
        const currentIndex = sizeOrder.indexOf(originalSize);
        if (currentIndex < 0 || currentIndex >= sizeOrder.length - 1) {
            return 'gargantuan';
        }
        return sizeOrder[currentIndex + 1];
    }

    /**
     * Hilfsmethode: Gibt die nächstkleinere Größe zurück
     * @private
     */
    _getReducedSize(originalSize) {
        const sizeOrder = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
        const currentIndex = sizeOrder.indexOf(originalSize);
        if (currentIndex <= 0) {
            return 'tiny';
        }
        return sizeOrder[currentIndex - 1];
    }

    /**
     * Implementierung des Flame Blade-Zaubers (Flammenklinge)
     * @param {Object} caster - Der Zaubercharakter
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFlameBlade(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'flame_blade',
            caster: caster.id,
            message: "Du beschwörst eine feurige Klinge in deiner freien Hand."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Flame Blade erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Prüfe, ob der Zauberwirker eine freie Hand hat
        const hasWeaponEquipped = caster.equippedItems &&
            caster.equippedItems.some(item => item.slot === 'mainHand' || item.slot === 'offHand');

        const canUseOffHand = !caster.equippedItems ||
            !caster.equippedItems.some(item => item.slot === 'offHand');

        if (hasWeaponEquipped && !canUseOffHand) {
            results.success = false;
            results.message = "Du benötigst eine freie Hand, um die Flammenklinge zu halten.";
            return results;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W6 Grundschaden
        const upcastDamage = (slotLevel - 2); // +1W6 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Erstelle die Flammenklinge als Waffe
        const flameBladeId = `flame_blade_${Date.now()}`;
        const flameBlade = {
            id: flameBladeId,
            name: "Flammenklinge",
            type: 'weapon',
            weaponType: 'flameBlade',
            damage: {
                dice: 'd6',
                count: damageDice,
                type: DAMAGE_TYPES.FIRE
            },
            properties: ['finesse', 'light', 'magical'],
            description: `Eine feurige Klinge, die ${damageDice}W6 Feuerschaden verursacht.`,
            casterId: caster.id,
            light: {
                color: '#FF6400',
                radius: 2, // 10 Fuß helles Licht
                dimRadius: 4 // +10 Fuß schwaches Licht (20 Fuß gesamt)
            }
        };

        // Füge die Waffe zum Inventar des Zauberwirkers hinzu und rüste sie aus
        if (!caster.inventory) caster.inventory = [];
        caster.inventory.push(flameBlade);

        // Rüste die Flammenklinge aus
        if (!caster.equippedItems) caster.equippedItems = [];
        caster.equippedItems.push({
            id: flameBladeId,
            slot: canUseOffHand ? 'offHand' : 'mainHand'
        });

        // Erstelle den Effekt für die Flammenklinge
        const flameBladeEffectId = `flame_blade_effect_${Date.now()}`;
        const flameBladeEffect = {
            id: flameBladeEffectId,
            name: "Flammenklinge",
            description: `Eine feurige Klinge, die ${damageDice}W6 Feuerschaden verursacht.`,
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            weaponId: flameBladeId,
            onApply: (caster, gameState) => {
                // Die Klinge wurde bereits erstellt und ausgerüstet

                // Erstelle eine Lichtquelle
                gameState.createLight({
                    id: `flame_blade_light_${flameBladeId}`,
                    attachedTo: caster.id,
                    color: '#FF6400',
                    radius: 4, // 20 Fuß Radius (4 Kacheln)
                    brightRadius: 2 // 10 Fuß helles Licht (2 Kacheln)
                });
            },
            onRemove: (caster, gameState) => {
                // Entferne die Waffe aus dem Inventar
                if (caster.inventory) {
                    caster.inventory = caster.inventory.filter(item => item.id !== flameBladeId);
                }

                // Entferne die Waffe aus den ausgerüsteten Gegenständen
                if (caster.equippedItems) {
                    caster.equippedItems = caster.equippedItems.filter(item => item.id !== flameBladeId);
                }

                // Entferne die Lichtquelle
                gameState.removeLight(`flame_blade_light_${flameBladeId}`);
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, flameBladeEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'flame_blade',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            effectId: flameBladeEffect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, flameBladeEffect.id);
            }
        });

        results.flameBlade = flameBlade;
        results.effect = flameBladeEffect;

        results.message = `Du beschwörst eine flammende Klinge in deiner ${canUseOffHand ? "freien Hand" : "Hand"}, die ${damageDice}W6 Feuerschaden verursacht. Die Klinge strahlt helles Licht in einem Radius von 10 Fuß und schwaches Licht für weitere 10 Fuß aus. Sie bleibt für 10 Minuten bestehen, solange du dich konzentrierst.`;

        results.message += " Du kannst die Klinge als Aktion abwerfen und als Bonusaktion in einer späteren Runde neu beschwören.";

        return results;
    }

    /**
     * Implementierung des Flaming Sphere-Zaubers (Flammende Kugel)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für die Kugel
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFlamingSphere(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'flaming_sphere',
            caster: caster.id,
            message: "Du erschaffst eine Kugel aus Feuer."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Flaming Sphere erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Prüfe, ob die Position in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Der Zielpunkt ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W6 Grundschaden
        const upcastDamage = (slotLevel - 2); // +1W6 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Erstelle die flammende Kugel
        const flamingSphereId = `flaming_sphere_${Date.now()}`;
        const flamingSphere = {
            id: flamingSphereId,
            name: "Flammende Kugel",
            type: 'conjuration',
            subtype: 'flamingSphere',
            position: position,
            size: 'small', // 5 Fuß Durchmesser
            damageDice: damageDice,
            casterId: caster.id,
            description: "Eine 5-Fuß-Durchmesser große Kugel aus Feuer."
        };

        // Erstelle den Effekt für die flammende Kugel
        const flamingSphereEffectId = `flaming_sphere_effect_${Date.now()}`;
        const flamingSphereEffect = {
            id: flamingSphereEffectId,
            name: "Flammende Kugel",
            description: `Eine Kugel aus Feuer, die ${damageDice}W6 Feuerschaden verursacht.`,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            sphereId: flamingSphereId,
            damageDice: damageDice,
            saveDC: this.calculateSpellSaveDC(caster),
            onApply: (caster, gameState) => {
                // Füge die Kugel zum Spielzustand hinzu
                gameState.addEntity(flamingSphere);

                // Erstelle eine Lichtquelle
                gameState.createLight({
                    id: `flaming_sphere_light_${flamingSphereId}`,
                    attachedTo: flamingSphereId,
                    color: '#FF6400',
                    radius: 4, // 20 Fuß Radius (4 Kacheln)
                    brightRadius: 2 // 10 Fuß helles Licht (2 Kacheln)
                });

                // Füge die Bonusaktion zum Bewegen der Kugel hinzu
                caster.actions = caster.actions || {};
                caster.actions.moveFlamingSphere = {
                    name: "Flammende Kugel bewegen",
                    description: "Bewege die flammende Kugel um bis zu 30 Fuß.",
                    actionType: "bonus",
                    execute: (targetPosition) => {
                        const sphere = gameState.getEntityById(flamingSphereId);
                        if (!sphere) {
                            return { success: false, message: "Die flammende Kugel existiert nicht mehr." };
                        }

                        // Prüfe Distanz (maximal 30 Fuß = 6 Felder)
                        const moveDistance = gameState.calculateDistance(sphere.position, targetPosition);
                        if (moveDistance > 6) {
                            return { success: false, message: "Die flammende Kugel kann maximal 30 Fuß weit bewegt werden." };
                        }

                        // Bewege die Kugel
                        sphere.position = targetPosition;

                        // Prüfe auf Kreaturen, die von der Kugel getroffen werden
                        const hitTargets = gameState.getEntitiesInRadius(targetPosition, 0.5) // 5-Fuß-Radius = 0.5 Feld (Zentrum des Felds)
                            .filter(entity => entity.isCreature && entity.id !== flamingSphereId);

                        let damageResults = [];
                        hitTargets.forEach(target => {
                            // Führe Geschicklichkeits-Rettungswurf durch
                            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, flamingSphereEffect.saveDC);

                            // Berechne Schaden
                            let damage = 0;
                            for (let i = 0; i < damageDice; i++) {
                                damage += Math.floor(Math.random() * 6) + 1; // 1W6
                            }

                            // Bei erfolgreichem Rettungswurf: Halber Schaden
                            if (saveResult.success) {
                                damage = Math.floor(damage / 2);
                            }

                            // Füge Schaden zu
                            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

                            damageResults.push({
                                id: target.id,
                                saveRoll: saveResult,
                                damage: damageResult.damage,
                                success: saveResult.success
                            });
                        });

                        return {
                            success: true,
                            message: `Die flammende Kugel wurde bewegt.${hitTargets.length > 0 ? ` Sie hat ${hitTargets.length} Kreatur(en) getroffen.` : ''}`,
                            damageResults: damageResults
                        };
                    }
                };
            },
            onRemove: (caster, gameState) => {
                // Entferne die Kugel aus dem Spielzustand
                gameState.removeEntity(flamingSphereId);

                // Entferne die Lichtquelle
                gameState.removeLight(`flaming_sphere_light_${flamingSphereId}`);

                // Entferne die Bonusaktion
                if (caster.actions && caster.actions.moveFlamingSphere) {
                    delete caster.actions.moveFlamingSphere;
                }
            },
            onTick: (caster, gameState, deltaTime) => {
                const sphere = gameState.getEntityById(flamingSphereId);
                if (!sphere) return;

                // Prüfe auf Kreaturen, die ihren Zug in der Nähe der Kugel beginnen
                const nearbyCreatures = gameState.getEntitiesInRadius(sphere.position, 1) // 5 Fuß = 1 Feld
                    .filter(entity => entity.isCreature && entity.id !== flamingSphereId);

                nearbyCreatures.forEach(target => {
                    // Wenn eine Kreatur ihren Zug neben der Kugel beginnt
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(target.id)) {
                        // Führe Geschicklichkeits-Rettungswurf durch
                        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, flamingSphereEffect.saveDC);

                        // Berechne Schaden
                        let damage = 0;
                        for (let i = 0; i < damageDice; i++) {
                            damage += Math.floor(Math.random() * 6) + 1; // 1W6
                        }

                        // Bei erfolgreichem Rettungswurf: Halber Schaden
                        if (saveResult.success) {
                            damage = Math.floor(damage / 2);
                        }

                        // Füge Schaden zu
                        const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

                        gameState.addMessage(`${target.name} beginnt seinen Zug neben der flammenden Kugel und erleidet ${damageResult.damage} Feuerschaden.`);
                    }
                });
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, flamingSphereEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'flaming_sphere',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            effectId: flamingSphereEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, flamingSphereEffectId);
            }
        });

        // Prüfe, ob sich bereits Kreaturen an der Position befinden
        const initialTargets = this.gameState.getEntitiesInRadius(position, 0.5) // 5-Fuß-Radius = 0.5 Feld (Zentrum des Felds)
            .filter(entity => entity.isCreature);

        // Für jede Kreatur, die sich bereits an der Position befindet, sofort Schaden anwenden
        initialTargets.forEach(target => {
            // Führe Geschicklichkeits-Rettungswurf durch
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, flamingSphereEffect.saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

            results.targets = results.targets || [];
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success
            });
        });

        results.flamingSphere = flamingSphere;
        results.effect = flamingSphereEffect;

        results.message = `Du erschaffst eine flammende Kugel mit 5 Fuß Durchmesser an einem Punkt deiner Wahl in Reichweite. Die Kugel strahlt helles Licht in einem Radius von 10 Fuß und schwaches Licht für weitere 10 Fuß aus. Jede Kreatur, die ihren Zug innerhalb von 5 Fuß um die Kugel beginnt, muss einen Geschicklichkeits-Rettungswurf machen oder ${damageDice}W6 Feuerschaden erleiden (halber Schaden bei Erfolg). Als Bonusaktion kannst du die Kugel bis zu 30 Fuß bewegen. Die Kugel bleibt für 1 Minute bestehen, solange du dich konzentrierst.`;

        if (initialTargets.length > 0) {
            const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
            results.message += ` ${initialTargets.length} Kreatur(en) befinden sich bereits an der Position der Kugel und erleiden insgesamt ${totalDamage} Feuerschaden.`;
        }

        return results;
    }

    /**
 * Implementierung des Heat Metal-Zaubers (Metall erhitzen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (Metallgegenstand oder Kreatur mit Metallgegenstand)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castHeatMetal(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'heat_metal',
            caster: caster.id,
            targets: [],
            message: "Du erhitzt einen Metallgegenstand zum Glühen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Heat Metal erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Heat Metal kann nur auf einen Metallgegenstand oder eine Kreatur mit Metallgegenständen gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Prüfe, ob das Ziel Metall enthält/ist
        const hasMetalObject = target.material === 'metal' ||
            (target.equipment && target.equipment.some(item =>
                item.material === 'metal' && item.equipped));

        if (!hasMetalObject) {
            results.success = false;
            results.message = "Das Ziel trägt keine Metallgegenstände, die du erhitzen könntest.";
            return results;
        }

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W8 Grundschaden
        const upcastDamage = (slotLevel - 2); // +1W8 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Erstelle den Heat Metal-Effekt
        const heatMetalEffectId = `heat_metal_${Date.now()}`;
        const heatMetalEffect = {
            id: heatMetalEffectId,
            name: "Erhitztes Metall",
            description: "Ein Metallgegenstand ist glühend heiß.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            damageDice: damageDice,
            targetId: target.id,
            onApply: (target, gameState) => {
                // Markiere das Metall als erhitzt
                target.hasHeatedMetal = true;

                // Erster Schaden sofort
                let damage = 0;
                for (let i = 0; i < damageDice; i++) {
                    damage += Math.floor(Math.random() * 8) + 1; // 1W8
                }

                // Füge Schaden zu, wenn es eine Kreatur ist
                if (target.isCreature) {
                    const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);
                    gameState.addMessage(`${target.name} erleidet ${damageResult.damage} Feuerschaden durch das erhitzte Metall.`);

                    // Konstitutions-Rettungswurf, um den Gegenstand nicht fallen zu lassen
                    const saveDC = this.calculateSpellSaveDC(caster);
                    const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

                    if (!saveResult.success && target.equipment) {
                        // Identifiziere einen Metallgegenstand, den das Ziel fallen lassen könnte
                        const metalItems = target.equipment.filter(item =>
                            item.material === 'metal' && item.equipped && item.canBeDropped);

                        if (metalItems.length > 0) {
                            const droppedItem = metalItems[0];
                            gameState.addMessage(`${target.name} lässt ${droppedItem.name} vor Schmerz fallen!`);
                            // Hier Logik zum Fallenlassen implementieren
                        }
                    }
                }
            },
            onRemove: (target, gameState) => {
                delete target.hasHeatedMetal;
            },
            // Bei jeder Bonusaktion kann erneuter Schaden verursacht werden
            onBonusAction: (caster, gameState) => {
                const target = gameState.getEntityById(heatMetalEffect.targetId);
                if (!target) return { success: false, message: "Das Ziel existiert nicht mehr." };

                // Berechne Schaden
                let damage = 0;
                for (let i = 0; i < heatMetalEffect.damageDice; i++) {
                    damage += Math.floor(Math.random() * 8) + 1; // 1W8
                }

                // Füge Schaden zu
                if (target.isCreature) {
                    const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

                    // Konstitutions-Rettungswurf wiederholen
                    const saveDC = this.calculateSpellSaveDC(caster);
                    const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

                    if (!saveResult.success && target.equipment) {
                        // Versuche erneut, einen Gegenstand fallen zu lassen
                        const metalItems = target.equipment.filter(item =>
                            item.material === 'metal' && item.equipped && item.canBeDropped);

                        if (metalItems.length > 0) {
                            const droppedItem = metalItems[0];
                            return {
                                success: true,
                                message: `Das Metall glüht erneut. ${target.name} erleidet ${damageResult.damage} Feuerschaden und lässt ${droppedItem.name} fallen!`,
                                damage: damageResult.damage
                            };
                        }
                    }

                    return {
                        success: true,
                        message: `Das Metall glüht erneut. ${target.name} erleidet ${damageResult.damage} Feuerschaden!`,
                        damage: damageResult.damage
                    };
                }

                return {
                    success: true,
                    message: "Das Metall glüht erneut, aber es gibt keine Kreatur, die Schaden nehmen könnte."
                };
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, heatMetalEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'heat_metal',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: [target.id],
            effectId: heatMetalEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, heatMetalEffectId);
            }
        });

        // Registriere eine Bonusaktion für erneuten Schaden
        caster.actions = caster.actions || {};
        caster.actions.heatMetalDamage = {
            name: "Metall erhitzen - Erneuter Schaden",
            description: "Verursache erneut Schaden durch erhitztes Metall.",
            actionType: "bonus_action",
            execute: () => {
                return heatMetalEffect.onBonusAction(caster, this.gameState);
            }
        };

        // Berechne initialen Schaden für die Ergebnismeldung
        let initialDamage = 0;
        for (let i = 0; i < damageDice; i++) {
            initialDamage += Math.floor(Math.random() * 8) + 1; // 1W8
        }

        results.targets.push({
            id: target.id,
            effect: heatMetalEffect.name,
            initialDamage: initialDamage
        });

        // Formatiere die Ergebnismeldung
        if (target.isCreature) {
            results.message = `Du erhitzt das Metall an ${target.name}, das sofort ${initialDamage} Feuerschaden erleidet. Bis der Zauber endet, kannst du als Bonusaktion in jedem deiner Züge erneut Schaden verursachen.`;
        } else {
            results.message = `Du erhitzt ${target.name} zum Glühen. Jede Kreatur, die den Gegenstand berührt, erleidet Feuerschaden.`;
        }

        return results;
    }

    /**
 * Implementierung des Hold Person-Zaubers (Person festhalten)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (humanoide Kreaturen)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castHoldPerson(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'hold_person',
            caster: caster.id,
            targets: [],
            message: "Du versuchst, humanoide Wesen zu paralysieren."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Hold Person erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = slotLevel - 1; // 1 Ziel bei Level 2, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets + 1) {
            targets = targets.slice(0, maxTargets + 1);
            results.message += ` (Maximal ${maxTargets + 1} Ziele möglich)`;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Liste für betroffene Ziele für Konzentration
        const affectedTargets = [];

        // Für jedes Ziel: Prüfe und wende den Zauber an
        targets.forEach(target => {
            // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance > 12) { // 60 Fuß = 12 Felder
                results.targets.push({
                    id: target.id,
                    outOfRange: true
                });
                return;
            }

            // Prüfe, ob das Ziel ein Humanoid ist
            if (target.type !== 'humanoid') {
                results.targets.push({
                    id: target.id,
                    invalid: true,
                    reason: "Kein Humanoid"
                });
                return;
            }

            // Führe einen Weisheits-Rettungswurf durch
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Paralyse-Effekt
                const paralysisEffectId = `hold_person_${Date.now()}_${target.id}`;
                const paralysisEffect = {
                    id: paralysisEffectId,
                    name: "Festgehalten",
                    description: "Das Ziel ist paralysiert.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    saveDC: saveDC,
                    onApply: (target, gameState) => {
                        // Füge den Paralyse-Zustand hinzu
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(CONDITIONS.PARALYZED)) {
                            target.conditions.push(CONDITIONS.PARALYZED);
                        }
                    },
                    onRemove: (target, gameState) => {
                        // Entferne den Paralyse-Zustand
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c => c !== CONDITIONS.PARALYZED);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }
                    },
                    onTick: (target, gameState, deltaTime) => {
                        // Am Ende jedes Zuges des Ziels: Erlaube einen neuen Rettungswurf
                        if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                            const newSaveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);
                            if (newSaveResult.success) {
                                gameState.addMessage(`${target.name} befreit sich aus der Paralyse!`);
                                this.removeEffect(target, paralysisEffectId);
                            }
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, paralysisEffect);

                // Füge das Ziel zur Liste der betroffenen Ziele hinzu
                affectedTargets.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: paralysisEffect.name
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration, wenn mindestens ein Ziel betroffen ist
        if (affectedTargets.length > 0) {
            this.concentrationManager.startConcentration(caster.id, {
                id: 'hold_person',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: affectedTargets,
                onEnd: () => {
                    // Effekte werden automatisch entfernt durch den ConcentrationManager
                }
            });
        }

        // Formatiere die Ergebnismeldung
        const paralyzedCount = affectedTargets.length;
        const invalidCount = results.targets.filter(t => t.invalid).length;
        const outOfRangeCount = results.targets.filter(t => t.outOfRange).length;

        results.message = `Du versuchst, ${targets.length} Ziel(e) zu paralysieren.`;

        if (paralyzedCount > 0) {
            results.message += ` ${paralyzedCount} humanoide Ziel(e) konnten dem Zauber nicht widerstehen und sind paralysiert. Betroffene Ziele können am Ende jedes ihrer Züge einen erneuten Rettungswurf machen, um den Effekt zu beenden.`;
        } else {
            const validTargets = targets.length - invalidCount - outOfRangeCount;
            if (validTargets > 0) {
                results.message += " Alle gültigen Ziele haben dem Zauber widerstanden.";
            }
        }

        if (invalidCount > 0) {
            results.message += ` ${invalidCount} Ziel(e) sind keine Humanoiden und können nicht betroffen werden.`;
        }

        if (outOfRangeCount > 0) {
            results.message += ` ${outOfRangeCount} Ziel(e) sind außerhalb der Reichweite.`;
        }

        return results;
    }

    /**
 * Implementierung des Invisibility-Zaubers (Unsichtbarkeit)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (Kreatur oder Objekt)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castInvisibility(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'invisibility',
            caster: caster.id,
            targets: [],
            message: "Eine Kreatur oder ein Objekt wird unsichtbar."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Invisibility erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Berechne die maximale Anzahl von Zielen
        const maxTargets = slotLevel - 1; // 1 Ziel bei Level 2, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets + 1) {
            targets = targets.slice(0, maxTargets + 1);
            results.message += ` (Maximal ${maxTargets + 1} Ziele möglich)`;
        }

        // Liste für betroffene Ziele für Konzentration
        const affectedTargets = [];

        // Für jedes Ziel: Prüfe und wende den Zauber an
        targets.forEach(target => {
            // Prüfe, ob das Ziel in Berührungsreichweite ist
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance > 1) { // Mehr als 5 Fuß entfernt
                results.targets.push({
                    id: target.id,
                    outOfRange: true
                });
                return;
            }

            // Erstelle den Unsichtbarkeits-Effekt
            const invisibilityEffectId = `invisibility_${Date.now()}_${target.id}`;
            const invisibilityEffect = {
                id: invisibilityEffectId,
                name: "Unsichtbarkeit",
                description: "Das Ziel ist unsichtbar.",
                duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
                onApply: (target, gameState) => {
                    // Füge den Unsichtbar-Zustand hinzu
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.INVISIBLE)) {
                        target.conditions.push(CONDITIONS.INVISIBLE);
                    }
                },
                onRemove: (target, gameState) => {
                    // Entferne den Unsichtbar-Zustand
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c => c !== CONDITIONS.INVISIBLE);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }
                },
                // Der Effekt endet, wenn das Ziel angreift oder einen Zauber wirkt
                onActionPerformed: (target, action, gameState) => {
                    if (action.type === 'attack' || action.type === 'cast_spell') {
                        gameState.addMessage(`${target.name} wird sichtbar, da ${target.isCreature ? "es angreift oder einen Zauber wirkt" : "es für einen Angriff oder Zauber verwendet wird"}.`);
                        this.removeEffect(target, invisibilityEffectId);
                        return true; // Effekt entfernen
                    }
                    return false;
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, invisibilityEffect);

            // Füge das Ziel zur Liste der betroffenen Ziele hinzu
            affectedTargets.push(target.id);

            results.targets.push({
                id: target.id,
                effect: invisibilityEffect.name
            });
        });

        // Starte Konzentration, wenn mindestens ein Ziel betroffen ist
        if (affectedTargets.length > 0) {
            this.concentrationManager.startConcentration(caster.id, {
                id: 'invisibility',
                startTime: Date.now(),
                duration: 3600000, // 1 Stunde
                targets: affectedTargets,
                onEnd: () => {
                    // Effekte werden automatisch entfernt durch den ConcentrationManager
                }
            });
        }

        // Formatiere die Ergebnismeldung
        const invisibleCount = affectedTargets.length;
        const outOfRangeCount = results.targets.filter(t => t.outOfRange).length;

        if (invisibleCount === 1 && targets.length === 1) {
            const target = this.gameState.getEntityById(affectedTargets[0]);
            if (target.id === caster.id) {
                results.message = "Du machst dich unsichtbar, bis du einen Angriff durchführst, einen Zauber wirkst oder die Konzentration beendest.";
            } else {
                results.message = `Du berührst ${target.name}, das nun unsichtbar wird, bis es einen Angriff durchführt, einen Zauber wirkt oder du die Konzentration beendest.`;
            }
        } else if (invisibleCount > 0) {
            results.message = `Du berührst ${invisibleCount} Ziel(e), die nun unsichtbar werden, bis sie einen Angriff durchführen, einen Zauber wirken oder du die Konzentration beendest.`;
        } else {
            results.message = "Kein Ziel wird unsichtbar.";
        }

        if (outOfRangeCount > 0) {
            results.message += ` ${outOfRangeCount} Ziel(e) sind außerhalb der Berührungsreichweite.`;
        }

        return results;
    }

    /**
 * Implementierung des Lesser Restoration-Zaubers (Geringere Wiederherstellung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (mit condition für spezifischen Zustand)
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castLesserRestoration(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'lesser_restoration',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und beendest eine Krankheit oder einen Zustand."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Lesser Restoration kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Liste der Zustände, die der Zauber beenden kann
        const validConditions = [
            CONDITIONS.BLINDED,
            CONDITIONS.DEAFENED,
            CONDITIONS.PARALYZED,
            CONDITIONS.POISONED
        ];

        // Prüfe, ob das Ziel eine Krankheit hat
        const hasDisease = target.diseases && target.diseases.length > 0;

        // Sammle alle Zustände, die das Ziel hat und die beendet werden können
        const currentConditions = (target.conditions || [])
            .filter(condition => validConditions.includes(condition));

        // Wenn eine bestimmte Bedingung angegeben wurde, versuche diese zu entfernen
        if (options.condition) {
            if (options.condition === 'disease') {
                // Entferne eine Krankheit
                if (hasDisease) {
                    // Nimm die erste Krankheit
                    const disease = target.diseases[0];
                    target.diseases = target.diseases.filter(d => d !== disease);
                    if (target.diseases.length === 0) {
                        delete target.diseases;
                    }

                    results.targets.push({
                        id: target.id,
                        cured: true,
                        disease: disease
                    });

                    results.message = `Du berührst ${target.name} und heilst die Krankheit ${disease}.`;
                    return results;
                } else {
                    results.success = false;
                    results.message = `${target.name} leidet an keiner Krankheit.`;
                    return results;
                }
            } else if (validConditions.includes(options.condition)) {
                // Entferne einen bestimmten Zustand
                if (target.conditions && target.conditions.includes(options.condition)) {
                    target.conditions = target.conditions.filter(c => c !== options.condition);
                    if (target.conditions.length === 0) {
                        delete target.conditions;
                    }

                    // Entferne auch entsprechende Effekte
                    const effectsToRemove = [];
                    if (target.effects) {
                        target.effects.forEach(effect => {
                            if (effect.causesCondition === options.condition) {
                                effectsToRemove.push(effect.id);
                            }
                        });
                    }

                    effectsToRemove.forEach(effectId => {
                        this.removeEffect(target, effectId);
                    });

                    results.targets.push({
                        id: target.id,
                        cured: true,
                        condition: options.condition
                    });

                    // Gib den deutschen Namen des Zustands aus
                    const conditionName = this.getConditionName(options.condition);
                    results.message = `Du berührst ${target.name} und beendest den Zustand ${conditionName}.`;
                    return results;
                } else {
                    results.success = false;
                    results.message = `${target.name} leidet nicht an dem Zustand ${this.getConditionName(options.condition)}.`;
                    return results;
                }
            } else {
                results.success = false;
                results.message = `Der Zauber kann den Zustand ${options.condition} nicht heilen.`;
                return results;
            }
        }

        // Keine spezifische Bedingung angegeben, priorisiere automatisch
        if (currentConditions.length > 0) {
            // Entferne den ersten Zustand von der Liste
            const conditionToRemove = currentConditions[0];
            target.conditions = target.conditions.filter(c => c !== conditionToRemove);
            if (target.conditions.length === 0) {
                delete target.conditions;
            }

            // Entferne auch entsprechende Effekte
            const effectsToRemove = [];
            if (target.effects) {
                target.effects.forEach(effect => {
                    if (effect.causesCondition === conditionToRemove) {
                        effectsToRemove.push(effect.id);
                    }
                });
            }

            effectsToRemove.forEach(effectId => {
                this.removeEffect(target, effectId);
            });

            results.targets.push({
                id: target.id,
                cured: true,
                condition: conditionToRemove
            });

            // Gib den deutschen Namen des Zustands aus
            const conditionName = this.getConditionName(conditionToRemove);
            results.message = `Du berührst ${target.name} und beendest den Zustand ${conditionName}.`;
        } else if (hasDisease) {
            // Entferne eine Krankheit
            const disease = target.diseases[0];
            target.diseases = target.diseases.filter(d => d !== disease);
            if (target.diseases.length === 0) {
                delete target.diseases;
            }

            results.targets.push({
                id: target.id,
                cured: true,
                disease: disease
            });

            results.message = `Du berührst ${target.name} und heilst die Krankheit ${disease}.`;
        } else {
            // Keine heilbaren Zustände oder Krankheiten
            results.success = false;
            results.message = `${target.name} leidet an keiner Krankheit oder heilbarem Zustand.`;
        }

        return results;
    }

    /**
     * Hilfsmethode: Gibt den deutschen Namen eines Zustands zurück
     * @param {string} condition - Der Zustand
     * @returns {string} - Der deutsche Name
     */
    getConditionName(condition) {
        const names = {
            [CONDITIONS.BLINDED]: 'Blindheit',
            [CONDITIONS.DEAFENED]: 'Taubheit',
            [CONDITIONS.PARALYZED]: 'Paralyse',
            [CONDITIONS.POISONED]: 'Vergiftung',
            [CONDITIONS.CHARMED]: 'Bezauberung',
            [CONDITIONS.FRIGHTENED]: 'Angst',
            [CONDITIONS.GRAPPLED]: 'Gepackt',
            [CONDITIONS.INCAPACITATED]: 'Kampfunfähig',
            [CONDITIONS.INVISIBLE]: 'Unsichtbarkeit',
            [CONDITIONS.PETRIFIED]: 'Versteinerung',
            [CONDITIONS.PRONE]: 'Liegend',
            [CONDITIONS.RESTRAINED]: 'Gefesselt',
            [CONDITIONS.STUNNED]: 'Betäubt',
            [CONDITIONS.UNCONSCIOUS]: 'Bewusstlos'
        };
        return names[condition] || condition;
    }

    /**
 * Implementierung des Magic Weapon-Zaubers (Magische Waffe)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (nicht-magische Waffe)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castMagicWeapon(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'magic_weapon',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine nicht-magische Waffe und machst sie temporär magisch."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Magic Weapon erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Magic Weapon kann nur auf eine Waffe gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst eine nicht-magische Waffe wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel eine Waffe ist
        if (!target.isWeapon) {
            results.success = false;
            results.message = "Das Ziel ist keine Waffe.";
            return results;
        }

        // Prüfe, ob die Waffe bereits magisch ist
        if (target.magical) {
            results.success = false;
            results.message = "Die Waffe ist bereits magisch.";
            return results;
        }

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Berechne den Bonus basierend auf dem Slot-Level
        const bonus = slotLevel > 3 ? 2 : 1; // +1 bei Level 2-3, +2 bei Level 4+

        // Erstelle den Magische Waffe-Effekt
        const magicWeaponEffectId = `magic_weapon_${Date.now()}`;
        const magicWeaponEffect = {
            id: magicWeaponEffectId,
            name: "Magische Waffe",
            description: `Die Waffe wird magisch und erhält einen +${bonus} Bonus auf Angriffs- und Schadenswürfe.`,
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            bonus: bonus,
            onApply: (target, gameState) => {
                // Speichere den ursprünglichen Zustand
                target.originalMagical = target.magical;
                target.originalAttackBonus = target.attackBonus || 0;
                target.originalDamageBonus = target.damageBonus || 0;

                // Mache die Waffe magisch und füge Boni hinzu
                target.magical = true;
                target.attackBonus = (target.attackBonus || 0) + bonus;
                target.damageBonus = (target.damageBonus || 0) + bonus;
            },
            onRemove: (target, gameState) => {
                // Stelle den ursprünglichen Zustand wieder her
                if (target.originalMagical !== undefined) {
                    target.magical = target.originalMagical;
                    delete target.originalMagical;
                }
                if (target.originalAttackBonus !== undefined) {
                    target.attackBonus = target.originalAttackBonus;
                    delete target.originalAttackBonus;
                }
                if (target.originalDamageBonus !== undefined) {
                    target.damageBonus = target.originalDamageBonus;
                    delete target.originalDamageBonus;
                }
            }
        };

        // Füge den Effekt zur Waffe hinzu
        this.addEffect(target, magicWeaponEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'magic_weapon',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: [target.id],
            effectId: magicWeaponEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, magicWeaponEffectId);
            }
        });

        results.targets.push({
            id: target.id,
            effect: magicWeaponEffect.name,
            bonus: bonus
        });

        // Formatiere die Ergebnismeldung
        results.message = `Du berührst ${target.name} und machst sie zu einer magischen Waffe. Für die nächste Stunde erhält die Waffe einen +${bonus} Bonus auf Angriffs- und Schadenswürfe.`;

        return results;
    }

    /**
 * Implementierung des Melf's Acid Arrow-Zaubers (Melfs Säurepfeil)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelnes Ziel)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castMelfsAcidArrow(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'melfs_acid_arrow',
            caster: caster.id,
            targets: [],
            message: "Ein schimmernder grüner Pfeil schießt auf dein Ziel zu."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Melf's Acid Arrow kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (90 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 18) { // 90 Fuß = 18 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (90 Fuß).";
            return results;
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Berechne den sofortigen Schaden basierend auf dem Slot-Level
        const initialDamageDice = 2 + (slotLevel - 2); // 2W4 + 1W4 pro Slot-Level über 2
        // Bei kritischem Treffer verdoppeln wir die Würfel
        const critMultiplier = isCritical ? 2 : 1;

        // Prüfe, ob der Angriff trifft
        if (isCritical || (attackTotal >= target.armorClass)) {
            // Sofortiger Schaden
            let initialDamage = 0;
            for (let i = 0; i < initialDamageDice * critMultiplier; i++) {
                initialDamage += Math.floor(Math.random() * 4) + 1; // 1W4
            }

            // Anhaltender Schaden im nächsten Zug
            let persistentDamage = 0;
            for (let i = 0; i < initialDamageDice * critMultiplier; i++) {
                persistentDamage += Math.floor(Math.random() * 4) + 1; // 1W4
            }

            // Füge sofortigen Schaden zu
            const initialDamageResult = this.applyDamage(target, initialDamage, DAMAGE_TYPES.ACID);

            // Erstelle den anhaltenden Säure-Effekt
            const acidEffectId = `acid_arrow_${Date.now()}`;
            const acidEffect = {
                id: acidEffectId,
                name: "Anhaltender Säureschaden",
                description: "Säure verätzt das Ziel und verursacht am Ende seines nächsten Zuges Schaden.",
                duration: 12000, // Bis Ende des nächsten Zuges (ca. 12 Sekunden)
                damage: persistentDamage,
                onApply: (target, gameState) => {
                    // Markiere das Ziel als von Säure betroffen
                    target.hasAcidEffect = true;
                },
                onRemove: (target, gameState) => {
                    delete target.hasAcidEffect;
                },
                onTick: (target, gameState, deltaTime) => {
                    // Am Ende des Zuges des Ziels: Verursache anhaltenden Schaden
                    if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                        // Füge den anhaltenden Schaden zu
                        const persistentDamageResult = this.applyDamage(target, acidEffect.damage, DAMAGE_TYPES.ACID);

                        gameState.addMessage(`Die Säure verätzt ${target.name} weiter und verursacht ${persistentDamageResult.damage} Säureschaden.`);

                        // Entferne den Effekt nach Anwendung des anhaltenden Schadens
                        this.removeEffect(target, acidEffectId);
                    }
                }
            };

            // Füge den Säure-Effekt zum Ziel hinzu
            this.addEffect(target, acidEffect);

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: true,
                critical: isCritical,
                initialDamage: initialDamageResult.damage,
                persistentDamage: persistentDamage
            });

            let message = `Der Säurepfeil trifft ${target.name}`;
            if (isCritical) {
                message += " mit einem kritischen Treffer";
            }
            message += ` und verursacht ${initialDamageResult.damage} Säureschaden. Das Ziel wird weiterhin von der Säure verätzt und erleidet am Ende seines nächsten Zuges weitere ${persistentDamage} Säureschaden.`;

            results.message = message;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der Säurepfeil verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
 * Implementierung des Mirror Image-Zaubers (Spiegelbild)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castMirrorImage(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'mirror_image',
            caster: caster.id,
            message: "Drei illusorische Duplikate von dir erscheinen in deinem Raum."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme die Anzahl der Duplikate (würfle 1W4+2, maximal 3)
        const duplicates = Math.min(Math.floor(Math.random() * 4) + 3, 3);

        // Erstelle den Spiegelbild-Effekt
        const mirrorImageEffectId = `mirror_image_${Date.now()}`;
        const mirrorImageEffect = {
            id: mirrorImageEffectId,
            name: "Spiegelbild",
            description: `${duplicates} illusorische Duplikate schützen dich vor Angriffen.`,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            duplicates: duplicates,
            onApply: (target, gameState) => {
                // Setze die Anzahl der Duplikate
                target.mirrorImages = duplicates;
            },
            onRemove: (target, gameState) => {
                delete target.mirrorImages;
            },
            // Hook für Angriffe gegen dich
            onBeingHit: (attacker, target, attackRoll, gameState) => {
                if (!target.mirrorImages || target.mirrorImages <= 0) {
                    return { intercepted: false };
                }

                // Berechne den AC-Wert, der getroffen werden muss, um ein Spiegelbild statt dir zu treffen
                const imageAC = 10 + Math.floor((target.abilities.dexterity - 10) / 2);

                if (attackRoll >= imageAC) {
                    // Bestimme, ob ein Duplikat getroffen wird
                    const totalEntities = target.mirrorImages + 1; // Duplikate + Original
                    const hitChance = target.mirrorImages / totalEntities;

                    if (Math.random() < hitChance) {
                        // Ein Duplikat wurde getroffen
                        target.mirrorImages -= 1;

                        // Aktualisiere die Beschreibung des Effekts
                        const effectIndex = target.effects.findIndex(e => e.id === mirrorImageEffectId);
                        if (effectIndex >= 0) {
                            target.effects[effectIndex].description =
                                `${target.mirrorImages} illusorische Duplikate schützen dich vor Angriffen.`;
                        }

                        return {
                            intercepted: true,
                            message: `Der Angriff trifft eines deiner Spiegelbilder und zerstört es! Du hast noch ${target.mirrorImages} Duplikat(e).`
                        };
                    }
                }

                return { intercepted: false };
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, mirrorImageEffect);

        results.effect = mirrorImageEffect;
        results.duplicates = duplicates;
        results.duration = "1 Minute";

        results.message = `Drei illusorische Duplikate von dir erscheinen in deinem Raum. Der Zauber erstellt ${duplicates} Duplikate, die sich mit dir bewegen und deine Aktionen imitieren. Solange ein Duplikat existiert, kann es Angriffe abfangen, die eigentlich dich treffen würden.`;

        return results;
    }

    /**
 * Implementierung des Misty Step-Zaubers (Nebelschritt)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Zielposition für die Teleportation
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castMistyStep(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'misty_step',
            caster: caster.id,
            message: "Du bist kurz von silbrigem Nebel umgeben und teleportierst dich."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Prüfe, ob die Zielposition in Sichtweite und Reichweite ist
        const distance = this.gameState.calculateDistance(caster.position, position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Die Zielposition ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Prüfe, ob die Zielposition belegt ist
        const isOccupied = this.gameState.isPositionOccupied(position);
        if (isOccupied) {
            results.success = false;
            results.message = "Die Zielposition ist bereits belegt.";
            return results;
        }

        // Speichere die ursprüngliche Position
        const originalPosition = { ...caster.position };

        // Teleportiere den Zauberwirker
        caster.position = position;

        // Füge visuellen Effekt hinzu
        this.gameState.addVisualEffect({
            type: 'teleport',
            startPosition: originalPosition,
            endPosition: position,
            color: 'silver',
            duration: 1000 // 1 Sekunde Animation
        });

        results.originalPosition = originalPosition;
        results.newPosition = position;

        results.message = "Du bist kurz von silbrigem Nebel umgeben und teleportierst dich bis zu 30 Fuß weit an einen unbesetzten Ort, den du sehen kannst.";

        return results;
    }

    /**
 * Implementierung des Moonbeam-Zaubers (Mondstrahl)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für den Bereich des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castMoonbeam(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'moonbeam',
            caster: caster.id,
            targets: [],
            message: "Ein silbriger Strahl bläulichen Lichts scheint aus der Luft herab."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Moonbeam erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (5-Fuß-Zylinder = 1x1 Feld)
        const area = {
            x: position.x,
            y: position.y,
            width: 1,
            height: 1,
            center: position
        };

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 2; // 2W10 Grundschaden
        const upcastDamage = (slotLevel - 2); // +1W10 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Erstelle den Mondstrahl-Effekt
        const moonbeamEffectId = `moonbeam_${Date.now()}`;
        const moonbeamEffect = {
            id: moonbeamEffectId,
            name: "Mondstrahl",
            description: `Ein silbriger Strahl mondlichtähnlichen Lichts, der ${damageDice}W10 Strahlenschaden verursacht.`,
            position: position,
            area: area,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            damageDice: damageDice,
            casterId: caster.id,
            saveDC: saveDC,
            onApply: (gameState) => {
                // Füge einen Lichteffekt hinzu
                gameState.createLight({
                    id: `moonbeam_light_${moonbeamEffectId}`,
                    position: position,
                    color: '#E0F0FF', // Bläuliches Silber
                    radius: 2, // 10 Fuß Radius (2 Kacheln)
                    intensity: 'dim'
                });
            },
            onRemove: (gameState) => {
                // Entferne den Lichteffekt
                gameState.removeLight(`moonbeam_light_${moonbeamEffectId}`);
            },
            // Bei Betreten des Bereichs oder Beginn des Zuges darin
            onAreaEnter: (entity, gameState) => {
                if (entity.isCreature) {
                    // Berechne Schaden und führe Rettungswurf durch
                    applyMoonbeamDamage(entity, gameState);
                }
            },
            onTick: (gameState, deltaTime) => {
                // Prüfe bei Rundenbeginn, ob Kreaturen im Bereich sind
                const creaturesInArea = gameState.getEntitiesInArea(area)
                    .filter(entity => entity.isCreature);

                creaturesInArea.forEach(entity => {
                    // Wenn eine Kreatur ihren Zug in dem Bereich beginnt
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(entity.id)) {
                        // Berechne Schaden und führe Rettungswurf durch
                        applyMoonbeamDamage(entity, gameState);
                    }
                });
            }
        };

        // Hilfsfunktion für Schadensberechnung und Rettungswurf
        const applyMoonbeamDamage = (entity, gameState) => {
            // Führe einen Constitution-Saving Throw durch
            const saveResult = this.makeSavingThrow(entity, SAVING_THROWS.CONSTITUTION, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 10) + 1; // 1W10
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(entity, damage, DAMAGE_TYPES.RADIANT);

            // Gestaltwandler haben Nachteil beim Rettungswurf
            let isShapechanger = entity.traits && entity.traits.includes('shapechanger');

            gameState.addMessage(`Der Mondstrahl trifft ${entity.name} und verursacht ${damageResult.damage} Strahlenschaden.`);

            // Prüfe, ob es sich um einen Gestaltwandler handelt und füge zusätzliche Effekte hinzu
            if (isShapechanger && !saveResult.success) {
                gameState.addMessage(`Als Gestaltwandler muss ${entity.name} seine ursprüngliche Form annehmen!`);

                // Setze den Gestaltwandler in seine ursprüngliche Form zurück
                if (entity.originalForm) {
                    entity.currentForm = entity.originalForm;
                    entity.shapeshifted = false;
                }
            }
        };

        // Füge den Mondstrahl-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(moonbeamEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'moonbeam',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            environmentalEffectId: moonbeamEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(moonbeamEffectId);
            }
        });

        // Prüfe, ob sich bereits Kreaturen im Bereich befinden
        const initialTargets = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Für jede Kreatur, die sich bereits im Bereich befindet, sofort Schaden anwenden
        initialTargets.forEach(target => {
            // Führe einen Constitution-Saving Throw durch
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 10) + 1; // 1W10
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.RADIANT);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success,
                isShapechanger: target.traits && target.traits.includes('shapechanger')
            });
        });

        // Als Aktion kannst du den Strahl um bis zu 60 Fuß in eine Richtung bewegen
        caster.actions = caster.actions || {};
        caster.actions.moveMoonbeam = {
            name: "Mondstrahl bewegen",
            description: "Bewege den Mondstrahl um bis zu 60 Fuß in eine Richtung.",
            actionType: "action",
            execute: (newPosition) => {
                // Prüfe, ob die neue Position in Reichweite ist (60 Fuß von der alten Position)
                const currentPos = moonbeamEffect.position;
                const moveDistance = this.gameState.calculateDistance(currentPos, newPosition);

                if (moveDistance > 12) { // 60 Fuß = 12 Felder
                    return {
                        success: false,
                        message: "Die neue Position ist zu weit entfernt. Der Mondstrahl kann nur um bis zu 60 Fuß bewegt werden."
                    };
                }

                // Bewege den Mondstrahl
                moonbeamEffect.position = newPosition;
                moonbeamEffect.area = {
                    x: newPosition.x,
                    y: newPosition.y,
                    width: 1,
                    height: 1,
                    center: newPosition
                };

                // Aktualisiere die Position des Lichts
                this.gameState.updateLightPosition(`moonbeam_light_${moonbeamEffectId}`, newPosition);

                return {
                    success: true,
                    message: "Du bewegst den Mondstrahl an eine neue Position."
                };
            }
        };

        // Formatiere die Ergebnismeldung
        results.effect = moonbeamEffect;
        results.damageDice = damageDice;

        results.message = `Ein silbriger Strahl bläulichen Lichts scheint in einem 5-Fuß-Radius, 40 Fuß hohen Zylinder aus der Luft herab. Eine Kreatur erleidet ${damageDice}W10 Strahlenschaden, wenn sie zum ersten Mal während eines Zuges in den Bereich des Zaubers eintritt oder ihren Zug darin beginnt. Gestaltwandler haben Nachteil bei diesem Rettungswurf und müssen ihre ursprüngliche Form annehmen, wenn sie versagen.`;

        if (initialTargets.length > 0) {
            const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
            results.message += ` ${initialTargets.length} Kreatur(en) befinden sich bereits in dem Bereich und erleiden insgesamt ${totalDamage} Strahlenschaden.`;
        }

        return results;
    }

    /**
 * Implementierung des Pass Without Trace-Zaubers (Spurlos gehen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castPassWithoutTrace(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'pass_without_trace',
            caster: caster.id,
            targets: [],
            message: "Ein Schleier aus Schatten und Stille bedeckt dich und deine Gefährten."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Pass Without Trace erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Finde alle Verbündeten im Umkreis von 30 Fuß
        const allies = this.gameState.getEntitiesInRadius(caster.position, 6) // 30 Fuß = 6 Felder
            .filter(entity => entity.isCreature && (entity.id === caster.id || entity.faction === caster.faction));

        // Erstelle den Spurlos-gehen-Effekt
        const passEffectId = `pass_without_trace_${Date.now()}`;
        const passEffect = {
            id: passEffectId,
            name: "Spurlos gehen",
            description: "+10 auf Geschicklichkeit (Heimlichkeit) und keine Spuren hinterlassen.",
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onApply: (target, gameState) => {
                // Markiere das Ziel als unter dem Spurlos-gehen-Effekt stehend
                target.hasPassWithoutTrace = true;

                // Speichere den ursprünglichen Stealth-Bonus
                target.originalStealthBonus = target.skillBonuses && target.skillBonuses.stealth ?
                    target.skillBonuses.stealth : 0;

                // Füge +10 zum Stealth-Bonus hinzu
                if (!target.skillBonuses) target.skillBonuses = {};
                target.skillBonuses.stealth = (target.skillBonuses.stealth || 0) + 10;

                // Keine Spuren hinterlassen
                target.leavesNoTraces = true;
            },
            onRemove: (target, gameState) => {
                // Entferne den Stealth-Bonus
                if (target.skillBonuses && target.originalStealthBonus !== undefined) {
                    if (target.originalStealthBonus === 0) {
                        delete target.skillBonuses.stealth;
                    } else {
                        target.skillBonuses.stealth = target.originalStealthBonus;
                    }
                    delete target.originalStealthBonus;
                }

                delete target.hasPassWithoutTrace;
                delete target.leavesNoTraces;
            }
        };

        // Wende den Effekt auf alle Verbündeten an
        allies.forEach(ally => {
            // Erstelle eine Kopie des Effekts für jedes Ziel
            const effectCopy = { ...passEffect, id: `${passEffect.id}_${ally.id}` };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(ally, effectCopy);

            results.targets.push({
                id: ally.id,
                effect: effectCopy.name
            });
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'pass_without_trace',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: allies.map(ally => ally.id),
            effectId: passEffectId,
            onEnd: () => {
                // Entferne alle Effekte, wenn die Konzentration endet
                allies.forEach(ally => {
                    const allyEffectId = `${passEffectId}_${ally.id}`;
                    this.removeEffect(ally, allyEffectId);
                });
            }
        });

        results.message = `Ein Schleier aus Schatten und Stille bedeckt dich und bis zu ${allies.length - 1} Gefährten im Umkreis von 30 Fuß. Betroffene Kreaturen erhalten +10 auf Geschicklichkeit (Heimlichkeit) und können nicht durch nichtmagische Mittel aufgespürt werden. Der Zauber hält 1 Stunde, solange du dich konzentrierst.`;

        return results;
    }

    /**
 * Implementierung des Phantasmal Force-Zaubers (Phantomkraft)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen mit Beschreibung der Illusion
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castPhantasmalForce(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'phantasmal_force',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst eine Illusion im Geist einer Kreatur."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Phantasmal Force erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Phantasmal Force kann nur auf eine Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Intelligence-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.INTELLIGENCE, saveDC);

        if (!saveResult.success) {
            // Extrahiere die Beschreibung der Illusion
            const illusionDescription = options.illusion || "eine bedrohliche Gestalt";

            // Erstelle den Phantomkraft-Effekt
            const phantasmalEffectId = `phantasmal_force_${Date.now()}`;
            const phantasmalEffect = {
                id: phantasmalEffectId,
                name: "Phantomkraft",
                description: `Das Ziel nimmt ${illusionDescription} wahr.`,
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                illusion: illusionDescription,
                saveDC: saveDC,
                casterId: caster.id,
                onApply: (target, gameState) => {
                    // Markiere das Ziel als von der Illusion betroffen
                    target.affectedByPhantasmalForce = {
                        illusion: illusionDescription,
                        casterId: caster.id,
                        believesItsReal: true
                    };
                },
                onRemove: (target, gameState) => {
                    delete target.affectedByPhantasmalForce;
                },
                // Die Illusion kann in jedem Zug des Zauberwirkers Schaden verursachen
                onCasterTurn: (caster, target, gameState) => {
                    if (target.affectedByPhantasmalForce && target.affectedByPhantasmalForce.believesItsReal) {
                        // Der Zauberwirker kann als Aktion die Illusion so gestalten, dass sie Schaden verursacht
                        // Dies wird normalerweise durch UI/Spielmechanik gesteuert
                        if (options.causeDamage) {
                            // 1W6 psychischer Schaden
                            const damage = Math.floor(Math.random() * 6) + 1;
                            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.PSYCHIC);
                            gameState.addMessage(`Die Illusion fügt ${target.name} ${damageResult.damage} psychischen Schaden zu.`);
                        }
                    }
                },
                // Das Ziel kann als Aktion eine Intelligenzprobe durchführen, um die Illusion zu durchschauen
                onTargetAction: (target, action, gameState) => {
                    if (action === 'investigate_illusion') {
                        const intelligenceCheck = Math.floor(Math.random() * 20) + 1 +
                            Math.floor((target.abilities.intelligence - 10) / 2);

                        if (intelligenceCheck >= saveDC) {
                            target.affectedByPhantasmalForce.believesItsReal = false;
                            gameState.addMessage(`${target.name} durchschaut die Illusion als nicht real!`);
                        } else {
                            gameState.addMessage(`${target.name} hält die Illusion weiterhin für real.`);
                        }
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, phantasmalEffect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'phantasmal_force',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: phantasmalEffectId,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, phantasmalEffectId);
                }
            });

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: false,
                effect: phantasmalEffect.name,
                illusion: illusionDescription
            });

            results.message = `Du erschaffst eine Illusion in den Gedanken von ${target.name}: ${illusionDescription}. Das Ziel nimmt die Illusion als vollkommen real wahr und kann seine Aktion nutzen, um die Illusion zu untersuchen. Du kannst die Illusion so gestalten, dass sie 1W6 psychischen Schaden verursacht.`;
        } else {
            // Rettungswurf erfolgreich, keine Wirkung
            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            results.message = `${target.name} durchschaut deinen Versuch, eine Illusion in seinen Gedanken zu erzeugen.`;
        }

        return results;
    }

    /**
 * Implementierung des Prayer of Healing-Zaubers (Gebet der Heilung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (bis zu sechs Kreaturen)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castPrayerOfHealing(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'prayer_of_healing',
            caster: caster.id,
            targets: [],
            message: "Du sprichst ein Gebet der Heilung für verwundete Verbündete."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Prayer of Healing kann auf bis zu sechs Kreaturen gewirkt werden
        if (targets.length > 6) {
            targets = targets.slice(0, 6);
            results.message += " (Maximal 6 Ziele möglich)";
        }

        // Prüfe, ob alle Ziele in Reichweite sind (30 Fuß)
        const validTargets = targets.filter(target => {
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            return distance <= 6; // 30 Fuß = 6 Felder
        });

        if (validTargets.length === 0) {
            results.success = false;
            results.message = "Keine Ziele in Reichweite (30 Fuß).";
            return results;
        }

        // Bestimme das Zauberattribut für den Modifikator
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);

        // Berechne die Heilung: 2W8 + Zaubermodifikator
        // +1W8 pro Slot-Level über 2
        const baseHealingDice = 2;
        const upcastHealingDice = slotLevel - 2;
        const healingDice = baseHealingDice + Math.max(0, upcastHealingDice);

        // Für jedes Ziel
        validTargets.forEach(target => {
            // Prüfe, ob das Ziel konstruiert oder untot ist (dann keine Heilung)
            if (target.type === 'construct' || target.type === 'undead') {
                results.targets.push({
                    id: target.id,
                    healed: false,
                    reason: `Ist ${target.type === 'construct' ? 'ein Konstrukt' : 'untot'}`
                });
                return;
            }

            // Würfle für die Heilung
            let healing = 0;
            for (let i = 0; i < healingDice; i++) {
                healing += Math.floor(Math.random() * 8) + 1; // 1W8
            }
            healing += abilityModifier; // Zaubermodifikator hinzufügen

            // Stelle sicher, dass die Heilung mindestens 1 beträgt
            healing = Math.max(1, healing);

            // Wende die Heilung an
            const healingResult = this.applyDamage(target, healing, 'healing');

            results.targets.push({
                id: target.id,
                healed: true,
                healing: healingResult.healing,
                initialHP: target.currentHP - healingResult.healing,
                finalHP: target.currentHP
            });
        });

        // Formatiere die Ergebnismeldung
        const healedTargets = results.targets.filter(t => t.healed);
        const notHealedTargets = results.targets.filter(t => !t.healed);
        const totalHealing = healedTargets.reduce((sum, t) => sum + t.healing, 0);

        if (healedTargets.length > 0) {
            results.message = `Dein Gebet der Heilung stellt insgesamt ${totalHealing} Trefferpunkte bei ${healedTargets.length} Kreatur(en) wieder her.`;

            if (notHealedTargets.length > 0) {
                results.message += ` ${notHealedTargets.length} Kreatur(en) können nicht durch diesen Zauber geheilt werden.`;
            }
        } else {
            results.message = "Keine der Kreaturen kann durch dieses Gebet geheilt werden.";
        }

        return results;
    }

    /**
 * Implementierung des Protection from Poison-Zaubers (Schutz vor Gift)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castProtectionFromPoison(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'protection_from_poison',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und versuchst, Gift in ihrem System zu neutralisieren."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Protection from Poison kann nur auf eine Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Prüfe, ob das Ziel vergiftet ist
        const isPoisoned = target.conditions && target.conditions.includes(CONDITIONS.POISONED);

        // Erstelle den Schutz-Effekt
        const protectionEffectId = `protection_from_poison_${Date.now()}`;
        const protectionEffect = {
            id: protectionEffectId,
            name: "Schutz vor Gift",
            description: "Gewährt Resistenz gegen Giftschaden und Vorteil bei Rettungswürfen gegen Gift.",
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onApply: (target, gameState) => {
                // Füge Resistenz gegen Giftschaden hinzu
                target.resistances = target.resistances || [];
                if (!target.resistances.includes(DAMAGE_TYPES.POISON)) {
                    target.resistances.push(DAMAGE_TYPES.POISON);
                }

                // Setze Vorteil bei Rettungswürfen gegen Gift
                target.savingThrowAdvantages = target.savingThrowAdvantages || {};
                target.savingThrowAdvantages.poison = true;

                // Entferne den vergiftet-Zustand, falls vorhanden
                if (isPoisoned) {
                    target.conditions = target.conditions.filter(c => c !== CONDITIONS.POISONED);
                    if (target.conditions.length === 0) {
                        delete target.conditions;
                    }
                }
            },
            onRemove: (target, gameState) => {
                // Entferne Resistenz gegen Giftschaden
                if (target.resistances) {
                    target.resistances = target.resistances.filter(r => r !== DAMAGE_TYPES.POISON);
                    if (target.resistances.length === 0) {
                        delete target.resistances;
                    }
                }

                // Entferne Vorteil bei Rettungswürfen gegen Gift
                if (target.savingThrowAdvantages) {
                    delete target.savingThrowAdvantages.poison;
                    if (Object.keys(target.savingThrowAdvantages).length === 0) {
                        delete target.savingThrowAdvantages;
                    }
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, protectionEffect);

        results.targets.push({
            id: target.id,
            effect: protectionEffect.name,
            wasPoisoned: isPoisoned
        });

        // Formatiere die Ergebnismeldung
        let message = "";
        if (target.id === caster.id) {
            message = "Du berührst dich selbst und";
        } else {
            message = `Du berührst ${target.name} und`;
        }

        if (isPoisoned) {
            message += " neutralisierst Gift in seinem System. Der Zustand 'vergiftet' wird entfernt.";
        } else {
            message += " verleihst Schutz vor Gift.";
        }

        message += " Für 1 Stunde erhält das Ziel Resistenz gegen Giftschaden und Vorteil bei Rettungswürfen gegen Vergiftung.";
        results.message = message;

        return results;
    }

    /**
 * Implementierung des Ray of Enfeeblement-Zaubers (Strahl der Entkräftung)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castRayOfEnfeeblement(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'ray_of_enfeeblement',
            caster: caster.id,
            targets: [],
            message: "Ein schwarzer Strahl aus entkräftender Energie entspringt deinem Finger."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Ray of Enfeeblement erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Ray of Enfeeblement kann nur auf eine Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (60 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (60 Fuß).";
            return results;
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Würfle für den Angriff
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const attackTotal = attackRoll + attackBonus;
        const isCritical = attackRoll === 20;

        // Prüfe, ob der Angriff trifft
        const hits = isCritical || (attackTotal >= target.armorClass);

        if (hits) {
            // Erstelle den Entkräftungs-Effekt
            const enfeeblementEffectId = `ray_of_enfeeblement_${Date.now()}`;
            const enfeeblementEffect = {
                id: enfeeblementEffectId,
                name: "Strahl der Entkräftung",
                description: "Waffenangriffe, die Stärke nutzen, verursachen nur halben Schaden.",
                duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                casterId: caster.id,
                onApply: (target, gameState) => {
                    // Markiere das Ziel als von Ray of Enfeeblement betroffen
                    target.enfeebled = true;
                },
                onRemove: (target, gameState) => {
                    delete target.enfeebled;
                },
                // Modifiziere den Schaden von Stärke-basierten Waffenangriffen
                onDealDamage: (attacker, target, damage, attackType) => {
                    if (attacker.enfeebled && attackType === 'weapon' &&
                        (damage.ability === 'strength' || !damage.ability)) { // Wenn nicht angegeben, nehmen wir Stärke an
                        // Halbiere den Schaden
                        return { damageFactor: 0.5 };
                    }
                    return {};
                },
                // Am Ende jedes Zuges des Ziels: Erlaube einen Constitution-Rettungswurf
                onTick: (target, gameState, deltaTime) => {
                    if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                        const saveDC = this.calculateSpellSaveDC(caster);
                        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

                        if (saveResult.success) {
                            gameState.addMessage(`${target.name} überwindet den Strahl der Entkräftung!`);
                            this.concentrationManager.breakConcentration(caster.id);
                        }
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, enfeeblementEffect);

            // Starte Konzentration
            this.concentrationManager.startConcentration(caster.id, {
                id: 'ray_of_enfeeblement',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: [target.id],
                effectId: enfeeblementEffectId,
                onEnd: () => {
                    // Entferne den Effekt, wenn die Konzentration endet
                    this.removeEffect(target, enfeeblementEffectId);
                }
            });

            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: true,
                critical: isCritical,
                effect: enfeeblementEffect.name
            });

            results.message = `Der schwarze Strahl trifft ${target.name}. Bis der Zauber endet verursachen Waffenangriffe des Ziels, die Stärke nutzen, nur halben Schaden. Am Ende jedes seiner Züge kann das Ziel einen Constitution-Rettungswurf machen, um den Effekt zu beenden.`;
        } else {
            // Angriff verfehlt
            results.targets.push({
                id: target.id,
                attackRoll: attackRoll,
                attackTotal: attackTotal,
                hits: false
            });

            results.message = `Der schwarze Strahl verfehlt ${target.name}.`;
        }

        return results;
    }

    /**
 * Implementierung des Scorching Ray-Zaubers (Sengende Strahlen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen mit Verteilung der Strahlen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castScorchingRay(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'scorching_ray',
            caster: caster.id,
            rays: [],
            message: "Du erschaffst drei Strahlen aus Feuer."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Berechne die Anzahl der Strahlen
        const baseRays = 3; // 3 Strahlen bei Level 2
        const upcastRays = slotLevel - 2; // +1 Strahl pro Slot-Level über 2
        const totalRays = baseRays + upcastRays;

        // Wenn keine Ziele angegeben sind, kann der Zauber nicht gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst mindestens ein Ziel wählen.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Verteile die Strahlen gemäß den Optionen oder auf alle Ziele
        let rayTargets = [];

        // Wenn spezifische Verteilung angegeben ist
        if (options.distribution && Array.isArray(options.distribution)) {
            // Überprüfe, ob die Gesamtzahl stimmt
            const totalDistributed = options.distribution.reduce((sum, rays) => sum + rays, 0);
            if (totalDistributed !== totalRays) {
                // Wenn nicht, verteile gleichmäßig
                rayTargets = this._distributeRays(targets, totalRays);
            } else {
                // Erstelle die Verteilung gemäß den Optionen
                rayTargets = [];
                for (let i = 0; i < options.distribution.length; i++) {
                    if (i < targets.length && options.distribution[i] > 0) {
                        for (let j = 0; j < options.distribution[i]; j++) {
                            rayTargets.push(targets[i]);
                        }
                    }
                }
            }
        } else {
            // Standardverteilung: Gleichmäßig auf alle Ziele verteilen
            rayTargets = this._distributeRays(targets, totalRays);
        }

        // Berechne Zauberangriffsbonus
        const attackBonus = this.calculateSpellAttackBonus(caster);

        // Für jeden Strahl einen separaten Angriff durchführen
        rayTargets.forEach((target, index) => {
            // Prüfe, ob das Ziel in Reichweite ist (120 Fuß)
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            if (distance > 24) { // 120 Fuß = 24 Felder
                results.rays.push({
                    index: index + 1,
                    targetId: target.id,
                    outOfRange: true
                });
                return;
            }

            // Würfle für den Angriff
            const attackRoll = Math.floor(Math.random() * 20) + 1;
            const attackTotal = attackRoll + attackBonus;
            const isCritical = attackRoll === 20;

            // Prüfe, ob der Angriff trifft
            const hits = isCritical || (attackTotal >= target.armorClass);

            if (hits) {
                // Schaden: 2W6
                let damage = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;

                // Bei kritischem Treffer verdoppeln wir den Schaden
                if (isCritical) {
                    damage += Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
                }

                // Füge Schaden zu
                const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

                results.rays.push({
                    index: index + 1,
                    targetId: target.id,
                    attackRoll: attackRoll,
                    attackTotal: attackTotal,
                    hits: true,
                    critical: isCritical,
                    damage: damageResult.damage
                });
            } else {
                // Angriff verfehlt
                results.rays.push({
                    index: index + 1,
                    targetId: target.id,
                    attackRoll: attackRoll,
                    attackTotal: attackTotal,
                    hits: false
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const hitRays = results.rays.filter(r => r.hits);
        const missRays = results.rays.filter(r => !r.hits && !r.outOfRange);
        const outOfRangeRays = results.rays.filter(r => r.outOfRange);
        const totalDamage = hitRays.reduce((sum, r) => sum + r.damage, 0);

        results.message = `Du erschaffst ${totalRays} Strahlen aus Feuer.`;

        if (hitRays.length > 0) {
            results.message += ` ${hitRays.length} Strahl(en) treffen und verursachen insgesamt ${totalDamage} Feuerschaden.`;
        }

        if (missRays.length > 0) {
            results.message += ` ${missRays.length} Strahl(en) verfehlen ihr Ziel.`;
        }

        if (outOfRangeRays.length > 0) {
            results.message += ` ${outOfRangeRays.length} Strahl(en) können ihr Ziel nicht erreichen, da es außerhalb der Reichweite ist.`;
        }

        return results;
    }

    /**
     * Hilfsmethode: Verteilt die Strahlen gleichmäßig auf die Ziele
     * @param {Array} targets - Liste der Ziele
     * @param {number} rays - Anzahl der Strahlen
     * @returns {Array} - Liste der Ziele für jeden Strahl
     */
    _distributeRays(targets, rays) {
        const result = [];

        // Wenn nur ein Ziel vorhanden ist, alle Strahlen darauf
        if (targets.length === 1) {
            for (let i = 0; i < rays; i++) {
                result.push(targets[0]);
            }
            return result;
        }

        // Sonst verteile gleichmäßig, mit überzähligen auf die ersten Ziele
        const basePerTarget = Math.floor(rays / targets.length);
        let remaining = rays - (basePerTarget * targets.length);

        for (let i = 0; i < targets.length; i++) {
            // Füge die Basiszahl an Strahlen hinzu
            for (let j = 0; j < basePerTarget; j++) {
                result.push(targets[i]);
            }

            // Füge einen zusätzlichen Strahl hinzu, wenn noch übrig
            if (remaining > 0) {
                result.push(targets[i]);
                remaining--;
            }
        }

        return result;
    }

    /**
 * Implementierung des Shatter-Zaubers (Schmettern)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum der Explosion
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castShatter(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'shatter',
            caster: caster.id,
            targets: [],
            message: "Ein lauter, scharfer Klang ertönt an einem von dir gewählten Punkt."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Definiere den Bereich (10-Fuß-Radius = 2 Felder Radius)
        const area = {
            x: position.x - 2,
            y: position.y - 2,
            width: 4,
            height: 4,
            center: position,
            radius: 2
        };

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, 2)
            .filter(entity => entity.isCreature);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W8 Grundschaden
        const upcastDamage = slotLevel - 2; // +1W8 pro Slot-Level über 2
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Constitution-Saving Throw durch
        creaturesInArea.forEach(target => {
            // Prüfe auf besondere Verletzlichkeit bei Konstrukten
            const isVulnerable = target.type === 'construct';

            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC,
                isVulnerable ? { disadvantage: true } : {});

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 8) + 1; // 1W8
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Bei verletzlichen Objekten/Konstrukten: Doppelter Schaden
            if (isVulnerable) {
                damage = damage * 2;
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.THUNDER);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success,
                vulnerable: isVulnerable
            });
        });

        // Prüfe auf zerbrechliche Objekte im Bereich
        const objectsInArea = this.gameState.getEntitiesInRadius(position, 2)
            .filter(entity => !entity.isCreature && entity.isObject && entity.fragile);

        // Beschädige oder zerstöre zerbrechliche Objekte
        objectsInArea.forEach(object => {
            if (object.hitPoints) {
                // Berechne Schaden für Objekte (doppelter Schaden)
                let damage = 0;
                for (let i = 0; i < damageDice * 2; i++) {
                    damage += Math.floor(Math.random() * 8) + 1; // 1W8
                }

                // Füge Schaden zu
                this.applyDamage(object, damage, DAMAGE_TYPES.THUNDER);
            } else {
                // Zerstöre Objekte ohne HP direkt
                this.gameState.destroyEntity(object.id);
            }

            results.destroyedObjects = results.destroyedObjects || [];
            results.destroyedObjects.push(object.id);
        });

        // Erzeuge Geräuschereignis
        this.gameState.createSoundEvent({
            position: position,
            type: 'thunder',
            radius: 60, // 300 Fuß = 60 Felder
            source: caster.id,
            spell: 'shatter'
        });

        // Formatiere die Ergebnismeldung
        const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
        const savedCount = results.targets.filter(t => t.success).length;
        const destroyedCount = results.destroyedObjects?.length || 0;

        if (results.targets.length > 0) {
            results.message = `Ein lauter, scharfer Klang ertönt in einem 10-Fuß-Radius und trifft ${results.targets.length} Kreatur(en), was insgesamt ${totalDamage} Donnerschaden verursacht. `;

            if (savedCount > 0) {
                results.message += `${savedCount} Kreatur(en) bestehen den Rettungswurf und erleiden nur halben Schaden. `;
            }
        } else {
            results.message = "Ein lauter, scharfer Klang ertönt in einem 10-Fuß-Radius, trifft aber keine Kreaturen. ";
        }

        if (destroyedCount > 0) {
            results.message += `${destroyedCount} zerbrechliche Objekte werden beschädigt oder zerstört. `;
        }

        results.message += "Das Geräusch ist 300 Fuß weit zu hören.";

        return results;
    }

    /**
     * Implementierung des Silence-Zaubers (Stille)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für das Zentrum der Stille
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castSilence(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'silence',
            caster: caster.id,
            message: "Eine Sphäre vollkommener Stille entsteht an einem Punkt deiner Wahl."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Silence erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position,
            radius: 4
        };

        // Erstelle den Stille-Effekt
        const silenceEffectId = `silence_${Date.now()}`;
        const silenceEffect = {
            id: silenceEffectId,
            name: "Stille",
            description: "Eine Sphäre absoluter Stille mit 20 Fuß Radius.",
            position: position,
            area: area,
            radius: 4, // 20 Fuß Radius
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            onApply: (gameState) => {
                // Erstelle den Stillebereich
                gameState.createSilenceArea({
                    id: silenceEffectId,
                    position: position,
                    radius: 4
                });
            },
            onRemove: (gameState) => {
                // Entferne den Stillebereich
                gameState.removeSilenceArea(silenceEffectId);
            },
            onTick: (gameState, deltaTime) => {
                // Finde alle Kreaturen im Bereich
                const creaturesInArea = gameState.getEntitiesInRadius(position, 4)
                    .filter(entity => entity.isCreature);

                creaturesInArea.forEach(creature => {
                    // Markiere Kreaturen als in einem stillen Bereich
                    creature.inSilenceArea = true;

                    // Verhindere das Wirken von Zaubern mit verbaler Komponente
                    if (creature.castingSpell &&
                        creature.castingSpell.components &&
                        creature.castingSpell.components.includes(COMPONENTS.VERBAL)) {
                        gameState.interruptSpellcasting(creature.id,
                            "Der Zauber kann nicht gewirkt werden, da verbale Komponenten in einem Bereich der Stille nicht funktionieren.");
                    }
                });
            }
        };

        // Füge den Stille-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(silenceEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'silence',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            area: area,
            environmentalEffectId: silenceEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(silenceEffectId);
            }
        });

        results.effect = silenceEffect;

        // Formatiere die Ergebnismeldung
        results.message = "Eine Sphäre absoluter Stille mit einem Radius von 20 Fuß entsteht an dem gewählten Punkt. Innerhalb des Bereichs kann kein Geräusch erzeugt oder hindurchgelassen werden. Kreaturen oder Objekte, die sich vollständig innerhalb der Sphäre befinden, sind immun gegen Donnerschaden. Das Wirken von Zaubern mit verbaler Komponente ist innerhalb des Bereichs nicht möglich.";

        return results;
    }

    /**
     * Implementierung des Spiritual Weapon-Zaubers (Geistliche Waffe)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für die geistliche Waffe
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen (weaponType: Art der Waffe)
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castSpiritualWeapon(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'spiritual_weapon',
            caster: caster.id,
            message: "Du erschaffst eine schwebende, geisterhafte Waffe."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme die Art der geistlichen Waffe (Standard: Kriegshammer)
        const weaponType = options.weaponType || 'warhammer';

        // Berechne den Bonus-Schaden basierend auf dem Slot-Level
        const bonusDamage = Math.floor((slotLevel - 2) / 2); // +1 bei Level 4, 6, 8

        // Bestimme das Zauberattribut für den Modifikator
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);

        // Berechne Angriffsbonus
        const attackBonus = caster.proficiencyBonus + abilityModifier;

        // Erstelle die geistliche Waffe
        const weaponId = `spiritual_weapon_${Date.now()}`;
        const spiritualWeapon = {
            id: weaponId,
            name: "Geistliche Waffe",
            description: `Eine schwebende, geisterhafte ${this._getWeaponName(weaponType)}.`,
            type: 'conjuration',
            subtype: 'spiritual_weapon',
            position: position,
            casterId: caster.id,
            weaponType: weaponType,
            attackBonus: attackBonus,
            abilityModifier: abilityModifier,
            bonusDamage: bonusDamage,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            hasActed: false, // Ob die Waffe in dieser Runde bereits angegriffen hat
            // Methode zum Angreifen
            attack: (targetId) => {
                const target = this.gameState.getEntityById(targetId);
                if (!target || !target.isCreature) {
                    return {
                        success: false,
                        message: "Kein gültiges Ziel für den Angriff."
                    };
                }

                // Prüfe, ob die Waffe in dieser Runde bereits angegriffen hat
                if (spiritualWeapon.hasActed) {
                    return {
                        success: false,
                        message: "Die geistliche Waffe hat in dieser Runde bereits angegriffen."
                    };
                }

                // Würfle für den Angriff
                const attackRoll = Math.floor(Math.random() * 20) + 1;
                const attackTotal = attackRoll + spiritualWeapon.attackBonus;
                const isCritical = attackRoll === 20;

                // Prüfe, ob der Angriff trifft
                const hits = isCritical || (attackTotal >= target.armorClass);

                if (hits) {
                    // Berechne Schaden: 1W8 + Zaubermodifikator + Bonus
                    let damage = Math.floor(Math.random() * 8) + 1;

                    // Bei kritischem Treffer: Zusätzlicher Würfel
                    if (isCritical) {
                        damage += Math.floor(Math.random() * 8) + 1;
                    }

                    damage += spiritualWeapon.abilityModifier + spiritualWeapon.bonusDamage;

                    // Füge Schaden zu
                    const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FORCE);

                    spiritualWeapon.hasActed = true;

                    return {
                        success: true,
                        attackRoll: attackRoll,
                        attackTotal: attackTotal,
                        hits: true,
                        critical: isCritical,
                        damage: damageResult.damage,
                        message: `Die geistliche Waffe trifft ${target.name}${isCritical ? " kritisch" : ""} und verursacht ${damageResult.damage} Kraftschaden.`
                    };
                } else {
                    spiritualWeapon.hasActed = true;

                    return {
                        success: true,
                        attackRoll: attackRoll,
                        attackTotal: attackTotal,
                        hits: false,
                        message: `Die geistliche Waffe verfehlt ${target.name}.`
                    };
                }
            },
            // Methode zum Bewegen
            move: (newPosition) => {
                const distance = this.gameState.calculateDistance(spiritualWeapon.position, newPosition);
                if (distance > 4) { // Mehr als 20 Fuß
                    return {
                        success: false,
                        message: "Du kannst die geistliche Waffe nicht weiter als 20 Fuß bewegen."
                    };
                }

                spiritualWeapon.position = newPosition;
                return {
                    success: true,
                    message: "Die geistliche Waffe bewegt sich."
                };
            }
        };

        // Füge die geistliche Waffe zum Spielzustand hinzu
        this.gameState.addEntity(spiritualWeapon);

        // Registriere eine Bonusaktion für den Angriff mit der geistlichen Waffe
        caster.actions = caster.actions || {};
        caster.actions.spiritualWeaponAttack = {
            name: "Geistliche Waffe - Angriff",
            description: "Führe einen Angriff mit deiner geistlichen Waffe durch.",
            actionType: "bonus",
            execute: (targetId) => {
                const result = spiritualWeapon.attack(targetId);
                return result;
            }
        };

        // Registriere eine Bonusaktion für das Bewegen der geistlichen Waffe
        caster.actions.spiritualWeaponMove = {
            name: "Geistliche Waffe - Bewegen",
            description: "Bewege deine geistliche Waffe um bis zu 20 Fuß.",
            actionType: "bonus",
            execute: (newPosition) => {
                const result = spiritualWeapon.move(newPosition);
                return result;
            }
        };

        // Timer zum Entfernen der Waffe nach Ablauf der Dauer
        setTimeout(() => {
            // Entferne die Waffe
            this.gameState.removeEntity(weaponId);

            // Entferne die Aktionen
            if (caster.actions) {
                delete caster.actions.spiritualWeaponAttack;
                delete caster.actions.spiritualWeaponMove;
            }

            this.gameState.addMessage("Die geistliche Waffe verschwindet.");
        }, spiritualWeapon.duration);

        results.weapon = {
            id: weaponId,
            type: weaponType,
            position: position
        };

        results.message = `Du erschaffst eine schwebende, geisterhafte ${this._getWeaponName(weaponType)} an der gewählten Position. Als Bonusaktion kannst du die Waffe angreifen lassen oder sie um bis zu 20 Fuß bewegen. Bei einem Treffer verursacht sie 1W8 + ${abilityModifier + bonusDamage} Kraftschaden. Die Waffe bleibt für 1 Minute bestehen.`;

        return results;
    }

    /**
     * Hilfsmethode: Gibt den deutschen Namen einer Waffe zurück
     * @param {string} weaponType - Typ der Waffe
     * @returns {string} - Deutscher Name der Waffe
     */
    _getWeaponName(weaponType) {
        const names = {
            'warhammer': 'Kriegshammer',
            'mace': 'Streitkolben',
            'sword': 'Schwert',
            'axe': 'Axt',
            'spear': 'Speer',
            'flail': 'Morgenstern',
            'dagger': 'Dolch'
        };
        return names[weaponType] || 'Waffe';
    }

    /**
     * Implementierung des Spike Growth-Zaubers (Dornenwuchs)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für das Zentrum des Dornenwuchses
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castSpikeGrowth(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'spike_growth',
            caster: caster.id,
            message: "Der Boden in einem Bereich verwandelt sich in ein Feld aus Dornen und Stacheln."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Spike Growth erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position,
            radius: 4
        };

        // Erstelle den Dornenwuchs-Effekt
        const spikeEffectId = `spike_growth_${Date.now()}`;
        const spikeEffect = {
            id: spikeEffectId,
            name: "Dornenwuchs",
            description: "Der Boden ist mit harten Dornen und Stacheln bedeckt.",
            position: position,
            area: area,
            radius: 4, // 20 Fuß Radius
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            terrain: {
                type: "difficult_hazardous",
                description: "Dornen und Stacheln"
            },
            casterId: caster.id,
            onApply: (gameState) => {
                // Füge den Dornenwuchs als Geländeeffekt hinzu
                gameState.addDifficultTerrain(spikeEffectId, area, "spikes");
            },
            onRemove: (gameState) => {
                // Entferne den Geländeeffekt
                gameState.removeDifficultTerrain(spikeEffectId);
            },
            // Wenn sich eine Kreatur durch den Bereich bewegt
            onCreatureMove: (creature, fromPosition, toPosition, gameState) => {
                if (creature.flying) return {}; // Fliegende Kreaturen sind nicht betroffen

                // Berechne die zurückgelegte Distanz im Dornenfeld
                const distance = this._calculateDistanceInArea(fromPosition, toPosition, area);

                if (distance > 0) {
                    // Berechne Schaden: 2W4 pro 5 Fuß Bewegung
                    const feetMoved = distance * 5;
                    const damageMultiplier = Math.floor(feetMoved / 5);
                    let damage = 0;

                    for (let i = 0; i < damageMultiplier * 2; i++) {
                        damage += Math.floor(Math.random() * 4) + 1; // 2W4 pro 5 Fuß
                    }

                    // Füge Schaden zu
                    const damageResult = this.applyDamage(creature, damage, DAMAGE_TYPES.PIERCING);

                    return {
                        damage: damageResult.damage,
                        message: `${creature.name} bewegt sich durch die Dornen und erleidet ${damageResult.damage} Stichschaden.`
                    };
                }

                return {};
            }
        };

        // Füge den Dornenwuchs-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(spikeEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'spike_growth',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            area: area,
            environmentalEffectId: spikeEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(spikeEffectId);
            }
        });

        results.effect = spikeEffect;

        // Formatiere die Ergebnismeldung
        results.message = "Der Boden in einem Radius von 20 Fuß verwandelt sich in ein Feld aus harten Dornen und Stacheln. Der Bereich gilt als schwieriges Gelände und jede Kreatur, die sich hindurchbewegt, erleidet für je 5 Fuß Bewegung 2W4 Stichschaden. Die Dornen sind natürlich getarnt, und Kreaturen, die den Bereich nicht vor Betreten sehen können, müssen einen erfolgreichen Weisheitswurf (Wahrnehmung) gegen deinen Zauber-DC machen, um den Bereich als gefährlich zu erkennen.";

        return results;
    }

    /**
     * Hilfsmethode: Berechnet die Distanz einer Bewegung innerhalb eines bestimmten Bereichs
     * @param {Object} fromPosition - Ausgangsposition
     * @param {Object} toPosition - Zielposition
     * @param {Object} area - Der zu prüfende Bereich
     * @returns {number} - Zurückgelegte Distanz in Feldern innerhalb des Bereichs
     */
    _calculateDistanceInArea(fromPosition, toPosition, area) {
        // Prüfe, ob Start- oder Endpunkt im Bereich liegen
        const startInArea = this._isPositionInArea(fromPosition, area);
        const endInArea = this._isPositionInArea(toPosition, area);

        if (!startInArea && !endInArea) {
            // Wenn weder Start noch Ende im Bereich sind, prüfe ob der Pfad durch den Bereich führt
            // Diese vereinfachte Version erkennt nicht alle Durchquerungen, eine komplexere
            // Linien-Schnitt-Berechnung wäre für eine vollständige Lösung nötig
            return 0;
        }

        if (startInArea && endInArea) {
            // Beide Punkte im Bereich: Volle Distanz
            return this.gameState.calculateDistance(fromPosition, toPosition);
        }

        // Ein Punkt im Bereich: Schätze die Hälfte der Distanz
        return this.gameState.calculateDistance(fromPosition, toPosition) / 2;
    }

    /**
     * Hilfsmethode: Prüft, ob eine Position innerhalb eines Bereichs liegt
     * @param {Object} position - Die zu prüfende Position
     * @param {Object} area - Der Bereich
     * @returns {boolean} - True, wenn die Position im Bereich liegt
     */
    _isPositionInArea(position, area) {
        // Für kreisförmige Bereiche
        if (area.radius) {
            const distance = this.gameState.calculateDistance(position, area.center);
            return distance <= area.radius;
        }

        // Für rechteckige Bereiche
        return position.x >= area.x &&
            position.x < area.x + area.width &&
            position.y >= area.y &&
            position.y < area.y + area.height;
    }

    /**
 * Implementierung des Web-Zaubers (Spinnennetz)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Spinnennetzes
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castWeb(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'web',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst ein dichtes Netz aus klebrigen Spinnweben."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Web erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Würfel = 4x4x4 Felder)
        const area = {
            x: position.x - 2, // Zentriere den Würfel auf die Position
            y: position.y - 2,
            width: 4,
            height: 4,
            center: position
        };

        // Prüfe, ob es genügend Ankerpunkte für das Netz gibt
        const hasAnchors = this._checkWebAnchors(area);
        if (!hasAnchors) {
            results.success = false;
            results.message = "Das Spinnennetz benötigt Ankerpunkte wie Wände oder Bäume, um es zu halten.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Erstelle den Web-Effekt
        const webEffectId = `web_${Date.now()}`;
        const webEffect = {
            id: webEffectId,
            name: "Spinnennetz",
            description: "Ein dichtes Netz aus klebrigen Spinnweben füllt den Bereich.",
            position: position,
            area: area,
            duration: 60000, // 1 Stunde = 3600 Sekunden, aber für Konzentration setzen wir es auf 1 Minute
            casterId: caster.id,
            terrain: {
                type: "difficult",
                description: "Klebrige Spinnweben"
            },
            onApply: (gameState) => {
                // Erstelle den Spinnweben-Bereich als schwieriges Gelände
                gameState.addDifficultTerrain(webEffectId, area, "web");
            },
            onRemove: (gameState) => {
                // Entferne den Spinnweben-Bereich
                gameState.removeDifficultTerrain(webEffectId);
            },
            // Wenn eine Kreatur den Bereich betritt oder dort ihren Zug beginnt
            onAreaEnter: (entity, gameState) => {
                if (entity.isCreature) {
                    this._applyWebEffectToCreature(entity, webEffect, caster);
                }
            },
            onTick: (gameState, deltaTime) => {
                // Prüfe bei Rundenbeginn, ob Kreaturen im Bereich sind
                const creaturesInArea = gameState.getEntitiesInArea(area)
                    .filter(entity => entity.isCreature);

                creaturesInArea.forEach(entity => {
                    // Wenn eine Kreatur ihren Zug in dem Bereich beginnt
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(entity.id)) {
                        // Nur anwenden, wenn die Kreatur nicht bereits gefesselt ist
                        const existingEffect = entity.effects?.find(e => e.id.startsWith('web_restrained_'));
                        if (!existingEffect) {
                            this._applyWebEffectToCreature(entity, webEffect, caster);
                        }
                    }
                });

                // Prüfe, ob das Netz brennt
                if (webEffect.isBurning) {
                    // Füge Kreaturen im brennenden Netz Schaden zu
                    creaturesInArea.forEach(entity => {
                        const fireDamage = Math.floor(Math.random() * 6) + 1; // 1W6
                        const damageResult = this.applyDamage(entity, fireDamage, DAMAGE_TYPES.FIRE);
                        gameState.addMessage(`${entity.name} erleidet ${damageResult.damage} Feuerschaden im brennenden Netz.`);
                    });

                    // Verringere die Brenndauer
                    webEffect.burnDuration -= deltaTime;
                    if (webEffect.burnDuration <= 0) {
                        // Netz ist verbrannt
                        this.concentrationManager.breakConcentration(caster.id);
                        gameState.addMessage("Das Spinnennetz ist vollständig verbrannt.");
                    }
                }
            }
        };

        // Füge den Web-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(webEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'web',
            startTime: Date.now(),
            duration: 60000, // 1 Stunde, aber für Konzentration setzen wir es auf 1 Minute
            area: area,
            environmentalEffectId: webEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(webEffectId);
            }
        });

        // Prüfe, ob sich bereits Kreaturen im Bereich befinden
        const initialTargets = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Für jede Kreatur, die sich bereits im Bereich befindet
        initialTargets.forEach(target => {
            this._applyWebEffectToCreature(target, webEffect, caster);
        });

        results.effect = webEffect;
        results.affectedTargets = initialTargets.length;

        results.message = `Du erschaffst ein 20-Fuß-Würfel aus dichtem Spinnennetz. Der Bereich wird zu schwierigem Gelände, und Kreaturen müssen einen Geschicklichkeits-Rettungswurf bestehen oder werden gefesselt. Das Spinnennetz ist brennbar und kann mit Feuer zerstört werden.`;

        if (initialTargets.length > 0) {
            const restrainedCount = results.targets.filter(t => !t.success).length;
            results.message += ` ${initialTargets.length} Kreatur(en) befinden sich bereits im Bereich.`;
        }

        return results;
    }

    /**
     * Hilfsmethode: Prüft, ob es Ankerpunkte für ein Spinnennetz gibt
     * @private
     */
    _checkWebAnchors(area) {
        // Diese Methode würde prüfen, ob es Wände, Säulen, Bäume oder andere Ankerpunkte
        // im Bereich oder an dessen Rändern gibt. Für eine einfache Implementierung
        // geben wir hier true zurück.
        return true;
    }

    /**
     * Hilfsmethode: Wendet den Web-Effekt auf eine Kreatur an
     * @private
     */
    _applyWebEffectToCreature(target, webEffect, caster) {
        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Führe einen Dexterity-Saving Throw durch
        const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

        if (!saveResult.success) {
            // Erstelle den Gefesselt-Effekt
            const restrainedEffectId = `web_restrained_${Date.now()}_${target.id}`;
            const restrainedEffect = {
                id: restrainedEffectId,
                name: "Von Spinnweben gefesselt",
                description: "Das Ziel ist von klebrigen Spinnweben gefesselt.",
                duration: 60000, // 1 Stunde (max)
                saveDC: saveDC,
                webEffectId: webEffect.id,
                onApply: (target, gameState) => {
                    // Füge den Gefesselt-Zustand hinzu
                    target.conditions = target.conditions || [];
                    if (!target.conditions.includes(CONDITIONS.RESTRAINED)) {
                        target.conditions.push(CONDITIONS.RESTRAINED);
                    }
                },
                onRemove: (target, gameState) => {
                    // Entferne den Gefesselt-Zustand
                    if (target.conditions) {
                        target.conditions = target.conditions.filter(c => c !== CONDITIONS.RESTRAINED);
                        if (target.conditions.length === 0) {
                            delete target.conditions;
                        }
                    }
                },
                onTick: (target, gameState, deltaTime) => {
                    // Die Kreatur kann als Aktion versuchen, sich zu befreien
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(target.id)) {
                        gameState.addMessage(`${target.name} kann als Aktion einen Stärke-Check gegen DC ${saveDC} machen, um sich aus dem Spinnennetz zu befreien.`);
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, restrainedEffect);

            // Füge das Ergebnis zur Liste der Ziele hinzu
            webEffect.targets = webEffect.targets || [];
            webEffect.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: false,
                effect: restrainedEffect.name
            });

            this.gameState.addMessage(`${target.name} wird im Spinnennetz gefesselt!`);
        } else {
            // Füge das Ergebnis zur Liste der Ziele hinzu
            webEffect.targets = webEffect.targets || [];
            webEffect.targets.push({
                id: target.id,
                saveRoll: saveResult,
                success: true
            });

            this.gameState.addMessage(`${target.name} entkommt dem Spinnennetz.`);
        }
    }

    /**
     * Hilfsmethode: Setzt das Netz in Brand
     * @param {string} webEffectId - ID des Web-Effekts
     * @param {Object} source - Quelle des Feuers (optional)
     * @returns {Object} - Ergebnis
     */
    setWebOnFire(webEffectId, source = null) {
        const webEffect = this.gameState.getEnvironmentalEffect(webEffectId);
        if (!webEffect || !webEffect.id.startsWith('web_')) {
            return {
                success: false,
                message: "Kein gültiges Spinnennetz gefunden."
            };
        }

        // Markiere das Netz als brennend
        webEffect.isBurning = true;
        webEffect.burnDuration = 6000; // Das Netz brennt für 1 Runde (6 Sekunden)

        // Kreaturen im Netz erleiden sofort Schaden
        if (webEffect.area) {
            const creaturesInArea = this.gameState.getEntitiesInArea(webEffect.area)
                .filter(entity => entity.isCreature);

            creaturesInArea.forEach(creature => {
                const fireDamage = Math.floor(Math.random() * 6) + 1; // 1W6
                const damageResult = this.applyDamage(creature, fireDamage, DAMAGE_TYPES.FIRE);

                // Befreie gefesselte Kreaturen
                const restrainedEffect = creature.effects?.find(e =>
                    e.id.startsWith('web_restrained_') && e.webEffectId === webEffectId);
                if (restrainedEffect) {
                    this.removeEffect(creature, restrainedEffect.id);
                }
            });
        }

        return {
            success: true,
            message: "Das Spinnennetz fängt Feuer und verbrennt schnell."
        };
    }

    /**
 * Implementierung des Blink-Zaubers (Blinzeln)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castBlink(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'blink',
            caster: caster.id,
            message: "Du beginnst zwischen der materiellen Ebene und der Ätherebene zu blinzeln."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Erstelle den Blinzeln-Effekt
        const blinkEffectId = `blink_${Date.now()}`;
        const blinkEffect = {
            id: blinkEffectId,
            name: "Blinzeln",
            description: "Du blinzelst zufällig zwischen der materiellen Ebene und der Ätherebene.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                target.hasBlinkEffect = true;
            },
            onRemove: (target, gameState) => {
                // Stelle sicher, dass der Charakter auf der materiellen Ebene ist, wenn der Zauber endet
                if (target.onEtherealPlane) {
                    delete target.onEtherealPlane;
                    gameState.addMessage(`${target.name} kehrt von der Ätherebene zurück.`);
                }
                delete target.hasBlinkEffect;
            },
            onTick: (target, gameState, deltaTime) => {
                // Am Ende jedes Zugs des Zauberwirkers: 50% Chance zu blinzeln
                if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                    const roll = Math.floor(Math.random() * 20) + 1;

                    if (roll >= 11) { // 50% Chance (Würfel 11-20)
                        // Wenn bereits auf der Ätherebene, kehre zurück
                        if (target.onEtherealPlane) {
                            delete target.onEtherealPlane;
                            gameState.addMessage(`${target.name} kehrt von der Ätherebene zurück und wird sichtbar.`);

                            // Entferne Effekte, die mit dem Ätherischen zu tun haben
                            if (target.conditions && target.conditions.includes('ethereal')) {
                                target.conditions = target.conditions.filter(c => c !== 'ethereal');
                                if (target.conditions.length === 0) {
                                    delete target.conditions;
                                }
                            }
                        }
                        // Sonst gehe auf die Ätherebene
                        else {
                            target.onEtherealPlane = true;
                            gameState.addMessage(`${target.name} verschwindet in die Ätherebene.`);

                            // Füge ätherischen Zustand hinzu
                            target.conditions = target.conditions || [];
                            if (!target.conditions.includes('ethereal')) {
                                target.conditions.push('ethereal');
                            }
                        }
                    } else {
                        gameState.addMessage(`${target.name} versucht zu blinzeln, aber nichts passiert.`);
                    }
                }
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, blinkEffect);

        results.effect = blinkEffect.name;
        results.duration = "1 Minute";

        results.message = "Für die nächste Minute besteht am Ende jedes deiner Züge eine 50%-Chance, dass du in die Ätherebene blinzelst. Zu Beginn deines nächsten Zuges, oder wenn der Zauber endet, kehrst du auf die materielle Ebene an eine Position deiner Wahl innerhalb von 10 Fuß von der Stelle zurück, wo du verschwunden bist. Auf der Ätherebene kannst du nur von Kreaturen gesehen werden, die ebenfalls dort sind, und du siehst und hörst die materielle Ebene wie durch einen Schleier.";

        return results;
    }

    /**
 * Implementierung des Counterspell-Zaubers (Gegenzauber)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} targetSpell - Informationen über den zu konterten Zauber
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castCounterspell(caster, targetSpell, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'counterspell',
            caster: caster.id,
            message: "Du versuchst, einen Zauber zu unterbrechen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Überprüfe, ob ein gültiger Zielzauber angegeben wurde
        if (!targetSpell || !targetSpell.id || !targetSpell.caster || !targetSpell.level) {
            results.success = false;
            results.message = "Es gibt keinen Zauber, den du kontern kannst.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Prüfe, ob der Zauberwirker den zu konternden Zauber sehen kann
        const targetCaster = this.gameState.getEntityById(targetSpell.caster);
        if (!targetCaster) {
            results.success = false;
            results.message = "Du kannst den Zauberwirker nicht sehen.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Prüfe die Entfernung
        const distance = this.gameState.calculateDistance(caster.position, targetCaster.position);
        if (distance > 12) { // 60 Fuß = 12 Felder
            results.success = false;
            results.message = "Der Zauberwirker ist außerhalb der Reichweite (60 Fuß).";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Automatischer Erfolg, wenn der Slot-Level gleich oder höher ist als der Zielzauber
        if (slotLevel >= targetSpell.level) {
            results.success = true;
            results.countered = true;
            results.automatic = true;
            results.message = `Du konterst erfolgreich den Zauber "${targetSpell.name}" (Stufe ${targetSpell.level}).`;
            return results;
        }

        // Wenn der Slot-Level niedriger ist, muss eine Fähigkeitsprobe gemacht werden
        // DC = 10 + Stufe des Zielzaubers
        const dc = 10 + targetSpell.level;

        // Bestimme das primäre Zauberattribut
        const spellcastingAbility = this._getSpellcastingAbility(caster);
        const abilityModifier = Math.floor((caster.abilities[spellcastingAbility] - 10) / 2);

        // Würfle für die Fähigkeitsprobe
        const abilityRoll = Math.floor(Math.random() * 20) + 1;
        const abilityTotal = abilityRoll + abilityModifier;

        // Prüfe, ob die Probe erfolgreich war
        const success = abilityTotal >= dc;

        if (success) {
            results.success = true;
            results.countered = true;
            results.abilityCheck = {
                ability: spellcastingAbility,
                roll: abilityRoll,
                modifier: abilityModifier,
                total: abilityTotal,
                dc: dc
            };
            results.message = `Du konterst erfolgreich den Zauber "${targetSpell.name}" (Stufe ${targetSpell.level}) mit einer ${spellcastingAbility.toUpperCase()}-Probe von ${abilityTotal} gegen DC ${dc}.`;
        } else {
            results.success = true; // Der Zauber wurde gewirkt, auch wenn er nicht kontern konnte
            results.countered = false;
            results.abilityCheck = {
                ability: spellcastingAbility,
                roll: abilityRoll,
                modifier: abilityModifier,
                total: abilityTotal,
                dc: dc
            };
            results.message = `Du versuchst, den Zauber "${targetSpell.name}" (Stufe ${targetSpell.level}) zu kontern, aber deine ${spellcastingAbility.toUpperCase()}-Probe von ${abilityTotal} reicht nicht gegen DC ${dc}.`;
        }

        return results;
    }

    /**
 * Implementierung des Daylight-Zaubers (Tageslicht)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Tageslichts
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (object: Zielobjekt für das Tageslicht)
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castDaylight(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'daylight',
            caster: caster.id,
            message: "Eine Sphäre aus Licht breitet sich aus und erschafft helles Tageslicht."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Bestimme, ob das Tageslicht an ein Objekt gebunden wird
        const targetObject = options.object ? this.gameState.getEntityById(options.object) : null;
        const attachedToObject = targetObject !== null;

        // Position bestimmen (entweder direkt oder vom Objekt)
        const lightPosition = attachedToObject ? { ...targetObject.position } : position;

        // Erstelle den Tageslicht-Effekt
        const daylightEffectId = `daylight_${Date.now()}`;
        const daylightEffect = {
            id: daylightEffectId,
            name: "Tageslicht",
            description: "Eine Sphäre aus hellem Licht mit 60 Fuß Radius.",
            position: lightPosition,
            radius: 12, // 60 Fuß Radius = 12 Felder
            brightRadius: 6, // 30 Fuß helles Licht = 6 Felder
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            attachedTo: attachedToObject ? targetObject.id : null,
            onApply: (gameState) => {
                // Erstelle die Lichtquelle
                gameState.createLight({
                    id: daylightEffectId,
                    position: lightPosition,
                    color: '#FFFFFF', // Weißes Licht
                    radius: 12, // 60 Fuß Radius
                    brightRadius: 6, // 30 Fuß helles Licht
                    type: 'daylight', // Spezieller Typ für Tageslicht
                    movesWithObject: attachedToObject
                });
            },
            onRemove: (gameState) => {
                // Entferne die Lichtquelle
                gameState.removeLight(daylightEffectId);
            },
            onTick: (gameState, deltaTime) => {
                // Wenn das Tageslicht an ein Objekt gebunden ist, bewege es mit dem Objekt
                if (attachedToObject) {
                    const object = gameState.getEntityById(targetObject.id);
                    if (object) {
                        gameState.updateLightPosition(daylightEffectId, object.position);
                    }
                }

                // Prüfe auf Interaktion mit magischer Dunkelheit
                const darknessAreasInRadius = gameState.getObscuredAreasInRadius(daylightEffect.position, daylightEffect.radius)
                    .filter(area => area.type === 'darkness');

                darknessAreasInRadius.forEach(darkness => {
                    // Tageslicht (Stufe 3) überschreibt magische Dunkelheit unter Stufe 3
                    if (darkness.level < 3) {
                        gameState.suppressObscuredArea(darkness.id);
                    }
                });
            }
        };

        // Füge den Tageslicht-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(daylightEffect);

        // Timer zum Entfernen des Effekts nach Ablauf der Dauer
        setTimeout(() => {
            this.gameState.removeEnvironmentalEffect(daylightEffectId);
        }, daylightEffect.duration);

        results.effect = daylightEffect;

        // Formatiere die Ergebnismeldung
        if (attachedToObject) {
            results.message = `Eine Sphäre aus Tageslicht mit einem Radius von 60 Fuß erscheint, die an ${targetObject.name} gebunden ist und sich mit dem Objekt bewegt. Das Licht ist helles Licht in einem Radius von 30 Fuß und schwaches Licht für weitere 30 Fuß. Magische Dunkelheit unter Stufe 3 wird von diesem Licht vorübergehend aufgehoben.`;
        } else {
            results.message = `Eine Sphäre aus Tageslicht mit einem Radius von 60 Fuß erscheint an der gewählten Position. Das Licht ist helles Licht in einem Radius von 30 Fuß und schwaches Licht für weitere 30 Fuß. Magische Dunkelheit unter Stufe 3 wird von diesem Licht vorübergehend aufgehoben.`;
        }

        return results;
    }

    /**
 * Implementierung des Fear-Zaubers (Furcht)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Kegels
 * @param {Object} direction - Richtung des Kegels
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castFear(caster, position, direction, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'fear',
            caster: caster.id,
            targets: [],
            message: "Du projizierst ein fürchterliches Trugbild in den Geist nahegelegener Kreaturen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Fear erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Bestimme den Kegel (30-Fuß-Kegel = 6 Felder)
        const creaturesInCone = this.gameState.getEntitiesInCone(
            caster.position,
            direction,
            6, // 30 Fuß = 6 Felder
            60 // 60-Grad-Winkel für einen Kegel
        );

        // Filtere Kreaturen
        const validTargets = creaturesInCone.filter(entity =>
            entity.isCreature && entity.id !== caster.id);

        if (validTargets.length === 0) {
            results.message = "Es befinden sich keine Kreaturen im Bereich des Zaubers.";
            return results;
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Weisheits-Saving Throw durch
        const affectedTargets = [];
        validTargets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Furcht-Effekt
                const fearEffectId = `fear_${Date.now()}_${target.id}`;
                const fearEffect = {
                    id: fearEffectId,
                    name: "Furcht",
                    description: "Das Ziel hat Angst und muss fliehen.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    casterId: caster.id,
                    onApply: (target, gameState) => {
                        // Füge den Zustand "Verängstigt" hinzu
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(CONDITIONS.FRIGHTENED)) {
                            target.conditions.push(CONDITIONS.FRIGHTENED);
                        }

                        // Speichere, von wem das Ziel verängstigt ist
                        target.frightenedBy = target.frightenedBy || [];
                        if (!target.frightenedBy.includes(caster.id)) {
                            target.frightenedBy.push(caster.id);
                        }

                        // Alles fallen lassen
                        if (target.heldItems && target.heldItems.length > 0) {
                            target.droppedItems = target.droppedItems || [];
                            target.heldItems.forEach(itemId => {
                                const item = gameState.getEntityById(itemId);
                                if (item) {
                                    item.position = { ...target.position };
                                    item.carriedBy = null;
                                    target.droppedItems.push(itemId);
                                }
                            });
                            target.heldItems = [];
                        }
                    },
                    onRemove: (target, gameState) => {
                        // Entferne den Zustand und die Quelle der Angst
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c => c !== CONDITIONS.FRIGHTENED);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }

                        if (target.frightenedBy) {
                            target.frightenedBy = target.frightenedBy.filter(id => id !== caster.id);
                            if (target.frightenedBy.length === 0) {
                                delete target.frightenedBy;
                            }
                        }
                    },
                    onTick: (target, gameState, deltaTime) => {
                        // Bei jedem Zug: Ziel muss fliehen
                        if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(target.id)) {
                            // Berechne den Fluchtweg (weg vom Zauberwirker)
                            const casterEntity = gameState.getEntityById(caster.id);
                            if (casterEntity) {
                                const direction = {
                                    x: target.position.x - casterEntity.position.x,
                                    y: target.position.y - casterEntity.position.y
                                };

                                // Normalisiere den Vektor
                                const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                                if (length > 0) {
                                    direction.x = direction.x / length;
                                    direction.y = direction.y / length;
                                }

                                // Berechne die maximale Bewegung in dieser Richtung
                                const moveDistance = target.speed || 6; // Standardgeschwindigkeit: 30 Fuß = 6 Felder
                                const newPosition = {
                                    x: target.position.x + Math.round(direction.x * moveDistance),
                                    y: target.position.y + Math.round(direction.y * moveDistance)
                                };

                                // Bewege das Ziel
                                gameState.moveCreature(target.id, newPosition);
                                gameState.addMessage(`${target.name} flieht in Panik vor ${caster.name}.`);
                            }

                            // Am Ende jedes Zuges: neuer Rettungswurf
                            if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                                const newSaveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

                                if (newSaveResult.success) {
                                    gameState.addMessage(`${target.name} überwindet die Furcht!`);
                                    this.removeEffect(target, fearEffectId);
                                }
                            }
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, fearEffect);

                affectedTargets.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: fearEffect.name
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration
        if (affectedTargets.length > 0) {
            this.concentrationManager.startConcentration(caster.id, {
                id: 'fear',
                startTime: Date.now(),
                duration: 60000, // 1 Minute
                targets: affectedTargets,
                onEnd: () => {
                    // Effekte werden automatisch durch den ConcentrationManager entfernt
                }
            });
        }

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedTargets.length;
        const totalCount = validTargets.length;

        if (totalCount > 0) {
            results.message = `Du projizierst ein fürchterliches Trugbild in einen 30-Fuß-Kegel. Von ${totalCount} Kreaturen im Bereich haben ${affectedCount} den Rettungswurf nicht bestanden.`;

            if (affectedCount > 0) {
                results.message += " Die betroffenen Ziele lassen alles fallen, was sie halten, und fliehen für die Dauer des Zaubers vor dir. Am Ende jedes ihrer Züge können sie einen neuen Rettungswurf machen, um den Effekt zu beenden.";
            }
        } else {
            results.message = "Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        return results;
    }

    /**
 * Implementierung des Gaseous Form-Zaubers (Gasförmige Gestalt)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (eine willige Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castGaseousForm(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'gaseous_form',
            caster: caster.id,
            targets: [],
            message: "Du verwandelst eine willige Kreatur in eine nebelartige Form."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Gaseous Form erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Der Zauber kann nur auf eine Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Erstelle den Gaseous Form-Effekt
        const gaseousFormEffectId = `gaseous_form_${Date.now()}`;
        const gaseousFormEffect = {
            id: gaseousFormEffectId,
            name: "Gasförmige Gestalt",
            description: "Das Ziel wird zu einer nebligen Wolke mit speziellen Eigenschaften.",
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            onApply: (target, gameState) => {
                // Speichere ursprüngliche Werte
                target.originalForm = {
                    speed: target.speed,
                    flySpeed: target.flySpeed,
                    armorClass: target.armorClass,
                    resistances: [...(target.resistances || [])],
                    immunities: [...(target.immunities || [])],
                    advantages: { ...(target.advantages || {}) }
                };

                // Setze neue Werte
                target.flySpeed = 2; // 10 Fuß
                target.speed = 0; // Kein normales Gehen mehr

                // Resistenz gegen nichtmagischen Schaden
                target.resistances = target.resistances || [];
                [DAMAGE_TYPES.BLUDGEONING, DAMAGE_TYPES.PIERCING, DAMAGE_TYPES.SLASHING].forEach(type => {
                    if (!target.resistances.includes(type)) {
                        target.resistances.push(type);
                    }
                });

                // Vorteil bei Stärke-, Geschicklichkeit- und Konstitutions-Rettungswürfen
                target.advantages = target.advantages || {};
                target.advantages.savingThrows = target.advantages.savingThrows || {};
                target.advantages.savingThrows[SAVING_THROWS.STRENGTH] = true;
                target.advantages.savingThrows[SAVING_THROWS.DEXTERITY] = true;
                target.advantages.savingThrows[SAVING_THROWS.CONSTITUTION] = true;

                // Kann durch kleine Öffnungen passen
                target.canPassThroughSmallOpenings = true;

                // Visueller Effekt
                target.isGaseous = true;

                // Kann keine Aktionen außer Bewegung durchführen
                target.canOnlyMove = true;
            },
            onRemove: (target, gameState) => {
                // Stelle ursprüngliche Werte wieder her
                if (target.originalForm) {
                    target.speed = target.originalForm.speed;
                    target.flySpeed = target.originalForm.flySpeed;
                    target.armorClass = target.originalForm.armorClass;
                    target.resistances = [...target.originalForm.resistances];
                    target.advantages = { ...target.originalForm.advantages };

                    delete target.originalForm;
                    delete target.canPassThroughSmallOpenings;
                    delete target.isGaseous;
                    delete target.canOnlyMove;
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, gaseousFormEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'gaseous_form',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: [target.id],
            effectId: gaseousFormEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, gaseousFormEffectId);
            }
        });

        results.targets.push({
            id: target.id,
            effect: gaseousFormEffect.name
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du verwandelst dich selbst in eine neblige Wolke. Deine einzigen Aktionsmöglichkeiten sind Bewegung und Konzentration auf diesen Zauber. Du kannst durch kleine Öffnungen und enge Spalten hindurchfließen, hast Resistenz gegen nichtmagischen Schaden und Vorteil bei Stärke-, Geschicklichkeit- und Konstitutions-Rettungswürfen.";
        } else {
            results.message = `Du verwandelst ${target.name} in eine neblige Wolke. Das Ziel kann nur noch Bewegung als Aktion ausführen und sich auf Zauber konzentrieren. Es kann durch kleine Öffnungen und enge Spalten hindurchfließen, hat Resistenz gegen nichtmagischen Schaden und Vorteil bei Stärke-, Geschicklichkeit- und Konstitutions-Rettungswürfen.`;
        }

        return results;
    }

    /**
 * Implementierung des Fireball-Zaubers (Feuerball)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Feuerballs
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castFireball(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'fireball',
            caster: caster.id,
            targets: [],
            message: "Ein leuchtender Funke schießt aus deinem Finger und explodiert in einem Feuerball."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Definiere den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position,
            radius: 4
        };

        // Finde alle Kreaturen im Explosionsbereich
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, 4)
            .filter(entity => entity.isCreature);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 8; // 8W6 Grundschaden
        const upcastDamage = slotLevel - 3; // +1W6 pro Slot-Level über 3
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.FIRE);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success
            });
        });

        // Prüfe auf brennbare Objekte im Bereich
        const objectsInArea = this.gameState.getEntitiesInRadius(position, 4)
            .filter(entity => !entity.isCreature && entity.isObject && !entity.isWorn && !entity.isCarried);

        const flammableObjects = objectsInArea.filter(obj =>
            obj.material === 'wood' ||
            obj.material === 'cloth' ||
            obj.material === 'paper' ||
            obj.flammable === true
        );

        // Setze brennbare Objekte in Brand
        flammableObjects.forEach(object => {
            object.onFire = true;
            if (!object.effects) object.effects = [];
            object.effects.push({
                type: 'burning',
                duration: 30000 // 5 Minuten = 300 Sekunden = 300000ms
            });
        });

        // Erstelle einen visuellen Feuerball-Effekt
        this.gameState.addVisualEffect({
            type: 'explosion',
            subtype: 'fire',
            position: position,
            radius: 4,
            duration: 1000 // 1 Sekunde
        });

        // Formatiere die Ergebnismeldung
        const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
        const savedCount = results.targets.filter(t => t.success).length;

        if (results.targets.length > 0) {
            results.message = `Ein Feuerball explodiert an der gewählten Position und trifft ${results.targets.length} Kreatur(en), was insgesamt ${totalDamage} Feuerschaden verursacht.`;

            if (savedCount > 0) {
                results.message += ` ${savedCount} Kreatur(en) konnten teilweise ausweichen und erleiden nur halben Schaden.`;
            }
        } else {
            results.message = "Ein Feuerball explodiert an der gewählten Position, trifft aber keine Kreaturen.";
        }

        if (flammableObjects.length > 0) {
            results.message += ` ${flammableObjects.length} brennbare Objekte im Bereich fangen Feuer.`;
        }

        return results;
    }

    /**
     * Implementierung des Fly-Zaubers (Fliegen)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castFly(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'fly',
            caster: caster.id,
            targets: [],
            message: "Du verleihst einer Kreatur die Fähigkeit zu fliegen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Fly erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Bestimme die Anzahl der möglichen Ziele
        const maxTargets = 1 + (slotLevel - 3); // 1 Ziel bei Level 3, +1 pro höherem Level

        // Begrenze die Anzahl der Ziele
        if (targets.length > maxTargets) {
            targets = targets.slice(0, maxTargets);
            results.message += ` (Maximal ${maxTargets} Ziele möglich)`;
        }

        // Für jedes Ziel prüfen, ob es in Berührungsreichweite ist
        const validTargets = targets.filter(target => {
            const distance = this.gameState.calculateDistance(caster.position, target.position);
            return distance <= 1; // Höchstens 5 Fuß entfernt
        });

        if (validTargets.length === 0) {
            results.success = false;
            results.message = "Keine Ziele in Berührungsreichweite.";
            // Gib den Zauberslot zurück
            caster.spellSlots[slotLevel]++;
            return results;
        }

        // Liste der betroffenen Ziele für Konzentration
        const affectedTargets = [];

        // Wende den Effekt auf jedes gültige Ziel an
        validTargets.forEach(target => {
            // Erstelle den Fliegen-Effekt
            const flyEffectId = `fly_${Date.now()}_${target.id}`;
            const flyEffect = {
                id: flyEffectId,
                name: "Fliegen",
                description: "Das Ziel erhält eine Fluggeschwindigkeit von 60 Fuß.",
                duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
                onApply: (target, gameState) => {
                    // Speichere die ursprüngliche Fluggeschwindigkeit
                    target.originalFlySpeed = target.flySpeed;

                    // Setze die Fluggeschwindigkeit auf 12 (60 Fuß)
                    target.flySpeed = 12;

                    // Markiere als fliegend
                    target.isFlying = true;
                },
                onRemove: (target, gameState) => {
                    // Stelle die ursprüngliche Fluggeschwindigkeit wieder her
                    if (target.originalFlySpeed !== undefined) {
                        target.flySpeed = target.originalFlySpeed;
                        delete target.originalFlySpeed;
                    } else {
                        delete target.flySpeed;
                    }

                    // Entferne fliegend-Status
                    delete target.isFlying;

                    // Wenn der Charakter noch in der Luft ist, fällt er
                    if (target.position && target.position.z > 0) {
                        gameState.addMessage(`${target.name} fällt zu Boden!`);
                        // Implementiere Fallschaden hier...
                    }
                }
            };

            // Füge den Effekt zum Ziel hinzu
            this.addEffect(target, flyEffect);

            affectedTargets.push(target.id);

            results.targets.push({
                id: target.id,
                effect: flyEffect.name
            });
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'fly',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            targets: affectedTargets,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        if (results.targets.length === 1) {
            const target = this.gameState.getEntityById(results.targets[0].id);
            if (target.id === caster.id) {
                results.message = "Du berührst dich selbst und erhältst eine Fluggeschwindigkeit von 60 Fuß für die nächsten 10 Minuten, solange du dich konzentrierst.";
            } else {
                results.message = `Du berührst ${target.name} und verleihst dem Ziel eine Fluggeschwindigkeit von 60 Fuß für die nächsten 10 Minuten, solange du dich konzentrierst.`;
            }
        } else {
            results.message = `Du berührst ${results.targets.length} Kreaturen und verleihst ihnen eine Fluggeschwindigkeit von 60 Fuß für die nächsten 10 Minuten, solange du dich konzentrierst.`;
        }

        results.message += " Wenn der Zauber endet, während das Ziel noch in der Luft ist, fällt es zu Boden.";

        return results;
    }

    /**
     * Implementierung des Haste-Zaubers (Hast)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Array} targets - Ziele des Zaubers
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castHaste(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'haste',
            caster: caster.id,
            targets: [],
            message: "Du veränderst die Zeit um eine Kreatur und beschleunigst ihre Bewegungen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Haste erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Der Zauber kann nur auf eine willige Kreatur gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Reichweite ist (30 Fuß)
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 6) { // 30 Fuß = 6 Felder
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Reichweite (30 Fuß).";
            return results;
        }

        // Erstelle den Hast-Effekt
        const hasteEffectId = `haste_${Date.now()}`;
        const hasteEffect = {
            id: hasteEffectId,
            name: "Hast",
            description: "Das Ziel ist beschleunigt und erhält verschiedene Vorteile.",
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (target, gameState) => {
                // Speichere ursprüngliche Werte
                target.originalHasteValues = {
                    speed: target.speed,
                    armorClass: target.armorClass,
                    advantages: { ...(target.advantages || {}) }
                };

                // Verdopple die Geschwindigkeit
                target.speed = target.speed * 2;

                // Erhöhe AC um 2
                target.armorClass += 2;

                // Vorteil bei Geschicklichkeits-Rettungswürfen
                target.advantages = target.advantages || {};
                target.advantages.savingThrows = target.advantages.savingThrows || {};
                target.advantages.savingThrows[SAVING_THROWS.DEXTERITY] = true;

                // Zusätzliche Aktion pro Runde
                target.extraActions = target.extraActions || {};
                target.extraActions.haste = {
                    availableActions: ["attack", "dash", "disengage", "hide", "use_object"],
                    used: false
                };
            },
            onRemove: (target, gameState) => {
                // Stelle ursprüngliche Werte wieder her
                if (target.originalHasteValues) {
                    target.speed = target.originalHasteValues.speed;
                    target.armorClass = target.originalHasteValues.armorClass;
                    target.advantages = { ...target.originalHasteValues.advantages };
                    delete target.originalHasteValues;
                }

                // Entferne extra Aktion
                if (target.extraActions && target.extraActions.haste) {
                    delete target.extraActions.haste;
                    if (Object.keys(target.extraActions).length === 0) {
                        delete target.extraActions;
                    }
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, hasteEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'haste',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: [target.id],
            effectId: hasteEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, hasteEffectId);

                // Erschöpfung nach Ende des Zaubers
                const exhaustionEffect = {
                    id: `haste_exhaustion_${Date.now()}`,
                    name: "Erschöpfung durch Hast",
                    description: "Das Ziel kann keine Aktionen oder Reaktionen durchführen.",
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    onApply: (target, gameState) => {
                        target.cannotAct = true;
                        target.cannotReact = true;
                    },
                    onRemove: (target, gameState) => {
                        delete target.cannotAct;
                        delete target.cannotReact;
                    }
                };

                this.addEffect(target, exhaustionEffect);
            }
        });

        results.targets.push({
            id: target.id,
            effect: hasteEffect.name
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = "Du beschleunigst dich selbst. Deine Geschwindigkeit verdoppelt sich, du erhältst +2 auf deine Rüstungsklasse, Vorteil bei Geschicklichkeits-Rettungswürfen und eine zusätzliche Aktion pro Runde. Wenn der Zauber endet, kannst du für 1 Runde keine Aktionen durchführen.";
        } else {
            results.message = `Du beschleunigst ${target.name}. Die Geschwindigkeit des Ziels verdoppelt sich, es erhält +2 auf seine Rüstungsklasse, Vorteil bei Geschicklichkeits-Rettungswürfen und eine zusätzliche Aktion pro Runde. Wenn der Zauber endet, kann das Ziel für 1 Runde keine Aktionen durchführen.`;
        }

        return results;
    }

    /**
     * Implementierung des Hypnotic Pattern-Zaubers (Hypnotisches Muster)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} position - Position für das Zentrum des Musters
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castHypnoticPattern(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'hypnotic_pattern',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst ein wirbelndes Muster aus Farben, das Kreaturen verzaubert."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Hypnotic Pattern erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (30-Fuß-Würfel = 6x6 Felder)
        const area = {
            x: position.x - 3, // Zentriere den Würfel auf die Position
            y: position.y - 3,
            width: 6,
            height: 6
        };

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Weisheits-Saving Throw durch
        const affectedTargets = [];
        creaturesInArea.forEach(target => {
            // Prüfe, ob das Ziel immun gegen Bezauberung ist
            if (target.immunities && target.immunities.includes('charm')) {
                results.targets.push({
                    id: target.id,
                    immune: true,
                    reason: "Immun gegen Bezauberung"
                });
                return;
            }

            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Bezauberungseffekt
                const charmEffectId = `hypnotic_pattern_${Date.now()}_${target.id}`;
                const charmEffect = {
                    id: charmEffectId,
                    name: "Hypnotisches Muster",
                    description: "Das Ziel ist bezaubert und handlungsunfähig.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    onApply: (target, gameState) => {
                        // Füge die Zustände hinzu
                        target.conditions = target.conditions || [];
                        if (!target.conditions.includes(CONDITIONS.CHARMED)) {
                            target.conditions.push(CONDITIONS.CHARMED);
                        }
                        if (!target.conditions.includes(CONDITIONS.INCAPACITATED)) {
                            target.conditions.push(CONDITIONS.INCAPACITATED);
                        }

                        // Geschwindigkeit auf 0 setzen
                        target.originalSpeed = target.speed;
                        target.speed = 0;
                    },
                    onRemove: (target, gameState) => {
                        // Entferne die Zustände
                        if (target.conditions) {
                            target.conditions = target.conditions.filter(c =>
                                c !== CONDITIONS.CHARMED && c !== CONDITIONS.INCAPACITATED);
                            if (target.conditions.length === 0) {
                                delete target.conditions;
                            }
                        }

                        // Stelle Geschwindigkeit wieder her
                        if (target.originalSpeed !== undefined) {
                            target.speed = target.originalSpeed;
                            delete target.originalSpeed;
                        }
                    },
                    // Der Effekt endet, wenn das Ziel Schaden nimmt
                    onTakeDamage: (target, damage, type, attacker) => {
                        this.removeEffect(target, charmEffectId);
                        return {
                            message: `${target.name} erwacht aus der Hypnose durch den erlittenen Schaden.`
                        };
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, charmEffect);

                affectedTargets.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: charmEffect.name
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Erstelle den visuellen Effekt für das Muster
        const patternEffectId = `hypnotic_pattern_visual_${Date.now()}`;
        const patternEffect = {
            id: patternEffectId,
            name: "Hypnotisches Muster (Visuell)",
            description: "Ein wirbelndes Muster aus leuchtenden Farben.",
            position: position,
            area: area,
            duration: 60000, // 1 Minute
            // Hier können visuelle Eigenschaften definiert werden
        };

        // Füge den visuellen Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(patternEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'hypnotic_pattern',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            targets: affectedTargets,
            environmentalEffectId: patternEffectId,
            onEnd: () => {
                // Entferne den visuellen Effekt
                this.gameState.removeEnvironmentalEffect(patternEffectId);

                // Effekte auf Zielen werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedTargets.length;
        const immuneCount = results.targets.filter(t => t.immune).length;
        const resistedCount = results.targets.filter(t => !t.immune && t.success).length;

        results.message = `Du erschaffst ein wirbelndes Muster aus Farben in einem 30-Fuß-Würfel. `;

        if (creaturesInArea.length > 0) {
            if (affectedCount > 0) {
                results.message += `${affectedCount} Kreatur(en) werden bezaubert, handlungsunfähig und haben eine Geschwindigkeit von 0. `;
            }
            if (resistedCount > 0) {
                results.message += `${resistedCount} Kreatur(en) widerstehen dem Zauber. `;
            }
            if (immuneCount > 0) {
                results.message += `${immuneCount} Kreatur(en) sind immun gegen den Zauber. `;
            }

            results.message += "Der Effekt endet für ein Ziel, wenn es Schaden erleidet oder jemand eine Aktion verwendet, um es zu schütteln.";
        } else {
            results.message += "Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        return results;
    }

    /**
     * Implementierung des Lightning Bolt-Zaubers (Blitzstrahl)
     * @param {Object} caster - Der Zaubercharakter
     * @param {Object} direction - Richtung des Blitzstrahls
     * @param {number} slotLevel - Level des verwendeten Slots
     * @param {Object} options - Zusätzliche Optionen
     * @returns {Object} - Ergebnis des Zaubers
     */
    _castLightningBolt(caster, direction, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'lightning_bolt',
            caster: caster.id,
            targets: [],
            message: "Ein Blitzstrahl schießt aus deiner Hand."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Normalisiere die Richtung (wichtig für eine gerade Linie)
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const normalizedDirection = {
            x: length > 0 ? direction.x / length : 0,
            y: length > 0 ? direction.y / length : 1 // Standardmäßig nach unten, wenn keine Richtung
        };

        // Erstelle eine Linie von 100 Fuß (20 Felder) in die gewählte Richtung
        const lineLength = 20;
        const targets = this.gameState.getEntitiesInLine(
            caster.position,
            normalizedDirection,
            lineLength,
            1 // Breite der Linie: 5 Fuß = 1 Feld
        ).filter(entity => entity.isCreature && entity.id !== caster.id);

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 8; // 8W6 Grundschaden
        const upcastDamage = (slotLevel - 3); // +1W6 pro Slot-Level über 3
        const damageDice = baseDamage + upcastDamage;

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        targets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            // Berechne Schaden
            let damage = 0;
            for (let i = 0; i < damageDice; i++) {
                damage += Math.floor(Math.random() * 6) + 1; // 1W6
            }

            // Bei erfolgreichem Rettungswurf: Halber Schaden
            if (saveResult.success) {
                damage = Math.floor(damage / 2);
            }

            // Füge Schaden zu
            const damageResult = this.applyDamage(target, damage, DAMAGE_TYPES.LIGHTNING);

            results.targets.push({
                id: target.id,
                saveRoll: saveResult,
                damage: damageResult.damage,
                success: saveResult.success
            });
        });

        // Erstelle den visuellen Blitzstrahl-Effekt
        const lightningEffectId = `lightning_bolt_visual_${Date.now()}`;
        const lightningEffect = {
            id: lightningEffectId,
            name: "Blitzstrahl (Visuell)",
            description: "Ein gleißender Blitz.",
            position: caster.position,
            direction: normalizedDirection,
            length: lineLength,
            width: 1,
            duration: 1000 // 1 Sekunde für den visuellen Effekt
        };

        // Füge den visuellen Effekt zur Spielwelt hinzu
        this.gameState.addVisualEffect(lightningEffect);

        // Entferne den visuellen Effekt nach kurzer Zeit
        setTimeout(() => {
            this.gameState.removeVisualEffect(lightningEffectId);
        }, 1000);

        // Prüfe auf metallische Objekte im Pfad des Blitzes
        const objectsInPath = this.gameState.getEntitiesInLine(
            caster.position,
            normalizedDirection,
            lineLength,
            1
        ).filter(entity => !entity.isCreature && entity.material === 'metal');

        // Formatiere die Ergebnismeldung
        const totalDamage = results.targets.reduce((sum, t) => sum + t.damage, 0);
        const savedCount = results.targets.filter(t => t.success).length;

        if (results.targets.length > 0) {
            results.message = `Ein Blitzstrahl von 100 Fuß Länge und 5 Fuß Breite schießt aus deiner Hand und trifft ${results.targets.length} Kreatur(en), was insgesamt ${totalDamage} Blitzschaden verursacht.`;

            if (savedCount > 0) {
                results.message += ` ${savedCount} Kreatur(en) konnten teilweise ausweichen und erleiden nur halben Schaden.`;
            }
        } else {
            results.message = "Ein Blitzstrahl von 100 Fuß Länge und 5 Fuß Breite schießt aus deiner Hand, trifft aber keine Kreaturen.";
        }

        if (objectsInPath.length > 0) {
            results.message += " Der Blitz schlägt in metallische Objekte im Pfad ein.";
        }

        return results;
    }

    /**
 * Implementierung des Protection from Energy-Zaubers (Schutz vor Energie)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Array} targets - Ziele des Zaubers (einzelne Kreatur)
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (damageType: Schadenstyp)
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castProtectionFromEnergy(caster, targets, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'protection_from_energy',
            caster: caster.id,
            targets: [],
            message: "Du berührst eine Kreatur und gewährst ihr Schutz vor einem bestimmten Schadenstyp."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Protection from Energy erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Protection from Energy kann nur auf ein Ziel gewirkt werden
        if (targets.length === 0) {
            results.success = false;
            results.message = "Du musst ein Ziel wählen.";
            return results;
        }

        const target = targets[0];

        // Prüfe, ob das Ziel in Berührungsreichweite ist
        const distance = this.gameState.calculateDistance(caster.position, target.position);
        if (distance > 1) { // Mehr als 5 Fuß entfernt
            results.success = false;
            results.message = "Das Ziel ist außerhalb der Berührungsreichweite.";
            return results;
        }

        // Wähle den Schadenstyp
        const validDamageTypes = [
            DAMAGE_TYPES.ACID,
            DAMAGE_TYPES.COLD,
            DAMAGE_TYPES.FIRE,
            DAMAGE_TYPES.LIGHTNING,
            DAMAGE_TYPES.THUNDER
        ];

        let damageType = options.damageType || DAMAGE_TYPES.FIRE; // Standard: Feuer
        if (!validDamageTypes.includes(damageType)) {
            damageType = DAMAGE_TYPES.FIRE;
        }

        // Erstelle den Schutz-Effekt
        const protectionEffectId = `protection_from_energy_${Date.now()}`;
        const protectionEffect = {
            id: protectionEffectId,
            name: `Schutz vor ${this.getDamageTypeName(damageType)}`,
            description: `Das Ziel hat Resistenz gegen ${this.getDamageTypeName(damageType)}schaden.`,
            duration: 3600000, // 1 Stunde = 3600 Sekunden = 3600000ms
            damageType: damageType,
            onApply: (target, gameState) => {
                // Füge die Resistenz hinzu
                target.resistances = target.resistances || [];
                if (!target.resistances.includes(damageType)) {
                    target.resistances.push(damageType);
                }
            },
            onRemove: (target, gameState) => {
                // Entferne die Resistenz
                if (target.resistances) {
                    target.resistances = target.resistances.filter(r => r !== damageType);
                    if (target.resistances.length === 0) {
                        delete target.resistances;
                    }
                }
            }
        };

        // Füge den Effekt zum Ziel hinzu
        this.addEffect(target, protectionEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'protection_from_energy',
            startTime: Date.now(),
            duration: 3600000, // 1 Stunde
            targets: [target.id],
            effectId: protectionEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(target, protectionEffectId);
            }
        });

        results.targets.push({
            id: target.id,
            effect: protectionEffect.name,
            damageType: damageType
        });

        // Formatiere die Ergebnismeldung
        if (target.id === caster.id) {
            results.message = `Du berührst dich selbst und gewährst dir Resistenz gegen ${this.getDamageTypeName(damageType)}schaden für bis zu 1 Stunde, solange du dich konzentrierst.`;
        } else {
            results.message = `Du berührst ${target.name} und gewährst dem Ziel Resistenz gegen ${this.getDamageTypeName(damageType)}schaden für bis zu 1 Stunde, solange du dich konzentrierst.`;
        }

        return results;
    }

    /**
 * Implementierung des Sleet Storm-Zaubers (Graupelsturm)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Sturms
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSleetStorm(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'sleet_storm',
            caster: caster.id,
            targets: [],
            message: "Ein Sturm aus gefrierendem Regen und Hagel erscheint."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Sleet Storm erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (40-Fuß-Radius = 8 Felder Radius, Zylinder)
        const radius = 8; // 40 Fuß
        const area = {
            x: position.x - radius,
            y: position.y - radius,
            width: radius * 2,
            height: radius * 2,
            center: position,
            radius: radius
        };

        // Erstelle den Graupelsturm-Effekt
        const stormEffectId = `sleet_storm_${Date.now()}`;
        const stormEffect = {
            id: stormEffectId,
            name: "Graupelsturm",
            description: "Ein Zylinder aus gefrierendem Regen und Hagel.",
            position: position,
            area: area,
            radius: radius,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            terrain: {
                type: "difficult",
                description: "Gefrorener Boden"
            },
            onApply: (gameState) => {
                // Füge den Sturm als Umgebungseffekt hinzu
                gameState.createObscuredArea({
                    id: stormEffectId,
                    position: position,
                    radius: radius,
                    type: 'sleet_storm',
                    visibility: 'heavily_obscured'
                });

                // Markiere den Bereich als schwieriges Gelände
                gameState.addDifficultTerrain(stormEffectId, area, "ice");
            },
            onRemove: (gameState) => {
                // Entferne den Sturmeffekt
                gameState.removeObscuredArea(stormEffectId);
                gameState.removeDifficultTerrain(stormEffectId);
            },
            onTick: (gameState, deltaTime) => {
                // Finde alle Kreaturen im Bereich
                const creaturesInArea = gameState.getEntitiesInRadius(position, radius)
                    .filter(entity => entity.isCreature);

                // Prüfe auf Zauberwirker, die sich konzentrieren müssen
                creaturesInArea.forEach(creature => {
                    if (gameState.isConcentrating(creature.id)) {
                        // Berechne den DC für den Konzentrations-Rettungswurf
                        const concentrationDC = 10; // Fester DC für Sleet Storm

                        // Führe einen Constitution-Rettungswurf durch
                        const saveResult = this.makeSavingThrow(creature, SAVING_THROWS.CONSTITUTION, concentrationDC);

                        if (!saveResult.success) {
                            // Konzentration verloren
                            this.concentrationManager.breakConcentration(creature.id);
                            gameState.addMessage(`${creature.name} verliert durch den Graupelsturm die Konzentration!`);
                        }
                    }
                });

                // Lösche offene Flammen im Bereich
                const flames = gameState.getEntitiesInRadius(position, radius)
                    .filter(entity => entity.type === 'fire' && entity.size === 'small');

                flames.forEach(flame => {
                    gameState.removeEntity(flame.id);
                });
            },
            // Bei Betreten des vereisten Bodens
            onAreaEnter: (entity, gameState) => {
                if (entity.isCreature) {
                    // Berechne den DC für den Dexterity-Rettungswurf
                    const saveDC = this.calculateSpellSaveDC(caster);

                    // Führe einen Dexterity-Rettungswurf durch
                    const saveResult = this.makeSavingThrow(entity, SAVING_THROWS.DEXTERITY, saveDC);

                    if (!saveResult.success) {
                        // Kreatur fällt hin
                        entity.conditions = entity.conditions || [];
                        if (!entity.conditions.includes(CONDITIONS.PRONE)) {
                            entity.conditions.push(CONDITIONS.PRONE);
                        }

                        gameState.addMessage(`${entity.name} rutscht auf dem gefrorenen Boden aus und fällt hin.`);
                    }
                }
            }
        };

        // Füge den Sturm-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(stormEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'sleet_storm',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            environmentalEffectId: stormEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(stormEffectId);
            }
        });

        // Finde alle Kreaturen im Bereich für initiale Rettungswürfe
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, radius)
            .filter(entity => entity.isCreature);

        // Für jedes Ziel: Führe einen Dexterity-Saving Throw durch
        const saveDC = this.calculateSpellSaveDC(caster);
        creaturesInArea.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.DEXTERITY, saveDC);

            if (!saveResult.success) {
                // Kreatur fällt hin
                target.conditions = target.conditions || [];
                if (!target.conditions.includes(CONDITIONS.PRONE)) {
                    target.conditions.push(CONDITIONS.PRONE);
                }

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    prone: true
                });
            } else {
                // Rettungswurf erfolgreich
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const fallenCount = results.targets.filter(t => !t.success).length;

        results.message = `Ein Zylinderförmiger Sturm aus gefrierendem Regen und Hagel mit einem Radius von 40 Fuß erscheint. Der Bereich wird zu schwierigem Gelände und ist stark verhüllt.`;

        if (creaturesInArea.length > 0) {
            if (fallenCount > 0) {
                results.message += ` ${fallenCount} von ${creaturesInArea.length} Kreatur(en) im Bereich rutschen aus und fallen hin.`;
            } else {
                results.message += ` Alle ${creaturesInArea.length} Kreatur(en) im Bereich konnten das Ausrutschen vermeiden.`;
            }
        }

        results.message += " Kreaturen, die im Sturm einen Konzentrationswurf ablegen müssen, haben einen DC von mindestens 10. Offene Flammen im Bereich werden gelöscht.";

        return results;
    }

    /**
 * Implementierung des Spirit Guardians-Zaubers (Geisterwächter)
 * @param {Object} caster - Der Zaubercharakter
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen (alignment: 'good' oder 'evil')
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSpiritGuardians(caster, _, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'spirit_guardians',
            caster: caster.id,
            targets: [],
            message: "Geister umkreisen dich und schützen dich."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Spirit Guardians erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Bestimme das Aussehen basierend auf der Gesinnung
        const alignment = options.alignment === 'evil' ? 'evil' : 'good';
        const spiritDescription = alignment === 'evil' ?
            "finstere Geister, die wie Untote oder teuflische Kreaturen aussehen" :
            "engelsgleiche Geister, die wie Feen oder Himmlische aussehen";
        const damageType = alignment === 'evil' ? DAMAGE_TYPES.NECROTIC : DAMAGE_TYPES.RADIANT;

        // Berechne den Schaden basierend auf dem Slot-Level
        const baseDamage = 3; // 3W8 Grundschaden
        const upcastDamage = slotLevel - 3; // +1W8 pro Slot-Level über 3
        const damageDice = baseDamage + upcastDamage;

        // Radius der Wächter (15 Fuß = 3 Felder)
        const radius = 3;

        // Erstelle den Geisterwächter-Effekt
        const guardiansEffectId = `spirit_guardians_${Date.now()}`;
        const guardiansEffect = {
            id: guardiansEffectId,
            name: "Geisterwächter",
            description: `${spiritDescription} umkreisen dich und beschützen dich.`,
            duration: 600000, // 10 Minuten = 600 Sekunden = 600000ms
            radius: radius,
            damageDice: damageDice,
            damageType: damageType,
            casterId: caster.id,
            onApply: (target, gameState) => {
                // Füge visuellen Effekt hinzu
                target.hasGuardianSpirits = {
                    type: alignment,
                    radius: radius * 5 // In Fuß
                };
            },
            onRemove: (target, gameState) => {
                // Entferne visuellen Effekt
                delete target.hasGuardianSpirits;
            },
            // Bei jeder Aktualisierung
            onTick: (gameState, deltaTime) => {
                const caster = gameState.getEntityById(guardiansEffect.casterId);
                if (!caster) return;

                // Hole alle Kreaturen im Bereich außer dem Zauberwirker
                const creaturesInArea = gameState.getEntitiesInRadius(caster.position, radius)
                    .filter(entity => entity.isCreature && entity.id !== caster.id);

                // Filtere Verbündete und Feinde basierend auf Deiner Implementierung
                const hostileCreatures = creaturesInArea.filter(entity =>
                    !gameState.isAlly(caster.id, entity.id)
                );

                // Für jede feindliche Kreatur, die ihren Zug im Bereich beginnt oder den Bereich betritt
                hostileCreatures.forEach(creature => {
                    // Wenn die Kreatur den Bereich gerade betreten hat oder ihren Zug dort beginnt
                    if (gameState.hasJustEnteredArea(creature.id, caster.position, radius) ||
                        (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(creature.id))) {

                        // Berechne den DC für den Rettungswurf
                        const saveDC = this.calculateSpellSaveDC(caster);

                        // Führe einen Wisdom-Saving Throw durch
                        const saveResult = this.makeSavingThrow(creature, SAVING_THROWS.WISDOM, saveDC);

                        // Berechne Schaden
                        let damage = 0;
                        for (let i = 0; i < damageDice; i++) {
                            damage += Math.floor(Math.random() * 8) + 1; // 1W8
                        }

                        // Bei erfolgreichem Rettungswurf: Halber Schaden
                        if (saveResult.success) {
                            damage = Math.floor(damage / 2);
                        }

                        // Füge Schaden zu
                        const damageResult = this.applyDamage(creature, damage, damageType);

                        gameState.addMessage(`Die Geisterwächter schaden ${creature.name} und verursachen ${damageResult.damage} ${this.getDamageTypeName(damageType)}schaden.`);

                        // Reduziere die Bewegungsgeschwindigkeit des Ziels
                        creature.originalSpeed = creature.originalSpeed || creature.speed;
                        creature.speed = Math.floor(creature.originalSpeed / 2); // Halbiere Geschwindigkeit
                    }
                });

                // Stelle die normale Geschwindigkeit wieder her für Kreaturen, die den Bereich verlassen haben
                gameState.getEntities()
                    .filter(entity => entity.isCreature && entity.originalSpeed &&
                        !gameState.isEntityInRadius(entity.id, caster.position, radius))
                    .forEach(creature => {
                        creature.speed = creature.originalSpeed;
                        delete creature.originalSpeed;
                    });
            }
        };

        // Füge den Effekt zum Zauberwirker hinzu
        this.addEffect(caster, guardiansEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'spirit_guardians',
            startTime: Date.now(),
            duration: 600000, // 10 Minuten
            effectId: guardiansEffect.id,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.removeEffect(caster, guardiansEffect.id);
            }
        });

        results.effect = guardiansEffect;
        results.damageType = damageType;
        results.damageDice = damageDice;
        results.radius = radius * 5; // In Fuß

        // Formatiere die Ergebnismeldung
        results.message = `${spiritDescription} erscheinen und umkreisen dich in einem Radius von 15 Fuß. Für die Dauer des Zaubers verursachen sie ${damageDice}W8 ${this.getDamageTypeName(damageType)}schaden bei feindlichen Kreaturen, die den Bereich betreten oder dort ihren Zug beginnen. Diese Kreaturen können einen Weisheits-Rettungswurf ablegen, um den Schaden zu halbieren. Außerdem wird ihre Bewegungsrate im Bereich halbiert.`;

        return results;
    }

    /**
 * Implementierung des Slow-Zaubers (Verlangsamen)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum des Zaubers
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castSlow(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'slow',
            caster: caster.id,
            targets: [],
            message: "Du veränderst die Zeit um bis zu sechs Kreaturen herum."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Slow erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (40-Fuß-Würfel = 8x8 Felder)
        const area = {
            x: position.x - 4,
            y: position.y - 4,
            width: 8,
            height: 8,
            center: position
        };

        // Finde alle Kreaturen im Bereich
        const creaturesInArea = this.gameState.getEntitiesInArea(area)
            .filter(entity => entity.isCreature);

        // Maximal 6 Ziele
        const maxTargets = 6;
        let validTargets = creaturesInArea;

        // Bei mehr als 6 Zielen, wähle die 6 mit den niedrigsten Trefferpunkten
        if (validTargets.length > maxTargets) {
            validTargets.sort((a, b) => a.currentHP - b.currentHP);
            validTargets = validTargets.slice(0, maxTargets);
        }

        // Berechne den DC für den Rettungswurf
        const saveDC = this.calculateSpellSaveDC(caster);

        // Für jedes Ziel: Führe einen Wisdom-Saving Throw durch
        const affectedTargets = [];
        validTargets.forEach(target => {
            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

            if (!saveResult.success) {
                // Erstelle den Verlangsamungs-Effekt
                const slowEffectId = `slow_${Date.now()}_${target.id}`;
                const slowEffect = {
                    id: slowEffectId,
                    name: "Verlangsamt",
                    description: "Die Zeit fließt langsamer für das Ziel.",
                    duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
                    onApply: (target, gameState) => {
                        // Reduziere Bewegungsrate um die Hälfte
                        target.originalSpeed = target.speed;
                        target.speed = Math.floor(target.speed / 2);

                        // Reduziere AC um 2
                        target.originalArmorClass = target.armorClass;
                        target.armorClass -= 2;

                        // Markiere als verlangsamt für andere Effekte
                        target.isSlowed = true;
                    },
                    onRemove: (target, gameState) => {
                        // Stelle ursprüngliche Werte wieder her
                        if (target.originalSpeed) {
                            target.speed = target.originalSpeed;
                            delete target.originalSpeed;
                        }

                        if (target.originalArmorClass) {
                            target.armorClass = target.originalArmorClass;
                            delete target.originalArmorClass;
                        }

                        delete target.isSlowed;
                    },
                    // Am Ende jedes Zuges des Ziels
                    onTick: (target, gameState, deltaTime) => {
                        if (gameState.isCreatureTurnEnd && gameState.isCreatureTurnEnd(target.id)) {
                            // Erlaube einen neuen Rettungswurf
                            const newSaveResult = this.makeSavingThrow(target, SAVING_THROWS.WISDOM, saveDC);

                            if (newSaveResult.success) {
                                gameState.addMessage(`${target.name} überwindet die Verlangsamung!`);
                                this.removeEffect(target, slowEffectId);
                            }
                        }
                    }
                };

                // Füge den Effekt zum Ziel hinzu
                this.addEffect(target, slowEffect);

                affectedTargets.push(target.id);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: slowEffect.name
                });
            } else {
                // Rettungswurf erfolgreich, keine Wirkung
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'slow',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            targets: affectedTargets,
            area: area,
            onEnd: () => {
                // Effekte werden automatisch durch den ConcentrationManager entfernt
            }
        });

        // Formatiere die Ergebnismeldung
        const affectedCount = affectedTargets.length;
        const totalTargets = validTargets.length;

        if (totalTargets > 0) {
            results.message = `Du veränderst die Zeit im Bereich und versuchst, bis zu ${maxTargets} Kreaturen zu verlangsamen. `;

            if (affectedCount > 0) {
                results.message += `${affectedCount} von ${totalTargets} Kreatur(en) werden verlangsamt: Ihre Geschwindigkeit wird halbiert, sie erhalten -2 auf ihre RK und Geschicklichkeits-Rettungswürfe, können keine Reaktionen nutzen und dürfen bei ihrem Zug nur entweder eine Aktion oder eine Bonusaktion ausführen (nicht beides). Außerdem können sie beim Zauberwirken nur einen Zauber pro Runde wirken. Am Ende jedes Zuges darf ein verlangsamtes Ziel einen erneuten Weisheits-Rettungswurf ablegen, um den Effekt zu beenden.`;
            } else {
                results.message += `Alle ${totalTargets} Kreaturen widerstehen dem Zauber.`;
            }
        } else {
            results.message = "Es befinden sich keine Kreaturen im Wirkungsbereich des Zaubers.";
        }

        return results;
    }

    /**
 * Implementierung des Stinking Cloud-Zaubers (Stinkende Wolke)
 * @param {Object} caster - Der Zaubercharakter
 * @param {Object} position - Position für das Zentrum der Wolke
 * @param {number} slotLevel - Level des verwendeten Slots
 * @param {Object} options - Zusätzliche Optionen
 * @returns {Object} - Ergebnis des Zaubers
 */
    _castStinkingCloud(caster, position, slotLevel, options) {
        const results = {
            success: true,
            spellId: 'stinking_cloud',
            caster: caster.id,
            targets: [],
            message: "Du erschaffst eine Sphäre aus widerlich gelben Dämpfen."
        };

        // Verbrauche einen Zauberslot
        caster.spellSlots[slotLevel]--;

        // Stinking Cloud erfordert Konzentration
        if (this.concentrationManager.isConcentrating(caster.id)) {
            const breakResult = this.concentrationManager.breakConcentration(caster.id);
            results.message += ` Du brichst deine Konzentration auf ${breakResult.spellId}.`;
        }

        // Definiere den Bereich (20-Fuß-Radius = 4 Felder Radius)
        const radius = 4; // 20 Fuß
        const area = {
            x: position.x - radius,
            y: position.y - radius,
            width: radius * 2,
            height: radius * 2,
            center: position,
            radius: radius
        };

        // Erstelle den Wolken-Effekt
        const cloudEffectId = `stinking_cloud_${Date.now()}`;
        const cloudEffect = {
            id: cloudEffectId,
            name: "Stinkende Wolke",
            description: "Eine Sphäre aus widerlich gelben Dämpfen.",
            position: position,
            area: area,
            radius: radius,
            duration: 60000, // 1 Minute = 60 Sekunden = 60000ms
            onApply: (gameState) => {
                // Füge die Wolke als Umgebungseffekt hinzu
                gameState.createObscuredArea({
                    id: cloudEffectId,
                    position: position,
                    radius: radius,
                    type: 'stinking_cloud',
                    visibility: 'heavily_obscured'
                });
            },
            onRemove: (gameState) => {
                // Entferne den Wolken-Effekt
                gameState.removeObscuredArea(cloudEffectId);
            },
            onTick: (gameState, deltaTime) => {
                // Finde alle Kreaturen im Bereich
                const creaturesInArea = gameState.getEntitiesInRadius(position, radius)
                    .filter(entity => entity.isCreature);

                // Für jede Kreatur, die ihren Zug im Bereich beginnt
                creaturesInArea.forEach(creature => {
                    if (gameState.isCreatureTurnStart && gameState.isCreatureTurnStart(creature.id)) {
                        // Berechne den DC für den Rettungswurf
                        const saveDC = this.calculateSpellSaveDC(caster);

                        // Prüfe auf Immunität gegen Vergiftung
                        const isPoisonImmune = creature.immunities &&
                            (creature.immunities.includes(DAMAGE_TYPES.POISON) ||
                                creature.immunities.includes(CONDITIONS.POISONED));

                        if (isPoisonImmune) {
                            gameState.addMessage(`${creature.name} ist immun gegen Vergiftungen und wird nicht von der stinkenden Wolke betroffen.`);
                            return;
                        }

                        // Führe einen Constitution-Rettungswurf durch
                        const saveResult = this.makeSavingThrow(creature, SAVING_THROWS.CONSTITUTION, saveDC);

                        if (!saveResult.success) {
                            // Kreatur muss ihre Aktion aufwenden, um zu würgen
                            const nauseatedEffectId = `stinking_cloud_nauseated_${Date.now()}_${creature.id}`;
                            const nauseatedEffect = {
                                id: nauseatedEffectId,
                                name: "Übel",
                                description: "Muss die Aktion aufwenden, um zu würgen.",
                                duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                                onApply: (target, gameState) => {
                                    target.isNauseated = true;
                                },
                                onRemove: (target, gameState) => {
                                    delete target.isNauseated;
                                }
                            };

                            // Füge den Effekt hinzu
                            this.addEffect(creature, nauseatedEffect);

                            gameState.addMessage(`${creature.name} wird von den Dämpfen überwältigt und muss seine Aktion aufwenden, um zu würgen.`);
                        } else {
                            gameState.addMessage(`${creature.name} widersteht den Dämpfen der stinkenden Wolke.`);
                        }
                    }
                });
            }
        };

        // Füge den Wolken-Effekt zur Spielwelt hinzu
        this.gameState.addEnvironmentalEffect(cloudEffect);

        // Starte Konzentration
        this.concentrationManager.startConcentration(caster.id, {
            id: 'stinking_cloud',
            startTime: Date.now(),
            duration: 60000, // 1 Minute
            area: area,
            environmentalEffectId: cloudEffectId,
            onEnd: () => {
                // Entferne den Effekt, wenn die Konzentration endet
                this.gameState.removeEnvironmentalEffect(cloudEffectId);
            }
        });

        // Finde alle Kreaturen im Bereich für initiale Rettungswürfe
        const creaturesInArea = this.gameState.getEntitiesInRadius(position, radius)
            .filter(entity => entity.isCreature);

        // Für jedes Ziel: Führe einen Constitution-Saving Throw durch
        const saveDC = this.calculateSpellSaveDC(caster);
        creaturesInArea.forEach(target => {
            // Prüfe auf Immunität gegen Vergiftung
            const isPoisonImmune = target.immunities &&
                (target.immunities.includes(DAMAGE_TYPES.POISON) ||
                    target.immunities.includes(CONDITIONS.POISONED));

            if (isPoisonImmune) {
                results.targets.push({
                    id: target.id,
                    immune: true
                });
                return;
            }

            const saveResult = this.makeSavingThrow(target, SAVING_THROWS.CONSTITUTION, saveDC);

            if (!saveResult.success) {
                // Kreatur muss ihre Aktion aufwenden, um zu würgen
                const nauseatedEffectId = `stinking_cloud_nauseated_${Date.now()}_${target.id}`;
                const nauseatedEffect = {
                    id: nauseatedEffectId,
                    name: "Übel",
                    description: "Muss die Aktion aufwenden, um zu würgen.",
                    duration: 6000, // 1 Runde = 6 Sekunden = 6000ms
                    onApply: (target, gameState) => {
                        target.isNauseated = true;
                    },
                    onRemove: (target, gameState) => {
                        delete target.isNauseated;
                    }
                };

                // Füge den Effekt hinzu
                this.addEffect(target, nauseatedEffect);

                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: false,
                    effect: nauseatedEffect.name
                });
            } else {
                // Rettungswurf erfolgreich
                results.targets.push({
                    id: target.id,
                    saveRoll: saveResult,
                    success: true
                });
            }
        });

        // Formatiere die Ergebnismeldung
        const nauseatedCount = results.targets.filter(t => !t.success && !t.immune).length;
        const immuneCount = results.targets.filter(t => t.immune).length;

        results.message = `Eine Sphäre aus widerlich gelben Dämpfen mit einem Radius von 20 Fuß erscheint. Der Bereich ist stark verhüllt.`;

        if (creaturesInArea.length > 0) {
            if (nauseatedCount > 0) {
                results.message += ` ${nauseatedCount} Kreatur(en) im Bereich werden von den Dämpfen überwältigt und müssen ihre Aktion aufwenden, um zu würgen.`;
            }

            const savedCount = results.targets.filter(t => t.success).length;
            if (savedCount > 0) {
                results.message += ` ${savedCount} Kreatur(en) widerstehen den Dämpfen.`;
            }

            if (immuneCount > 0) {
                results.message += ` ${immuneCount} Kreatur(en) sind immun gegen die Wirkung.`;
            }
        } else {
            results.message += " Es befinden sich keine Kreaturen im Bereich des Zaubers.";
        }

        results.message += " Die Wolke bleibt für 1 Minute bestehen, solange du dich konzentrierst, und Kreaturen, die ihren Zug im Bereich beginnen, müssen einen Constitution-Rettungswurf bestehen oder ihre Aktion aufwenden, um zu würgen.";

        return results;
    }
}

// Exportiere die Klasse
export default SpellsEngine;