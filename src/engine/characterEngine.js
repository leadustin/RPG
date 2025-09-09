// src/engine/characterEngine.js

import allRaceData from '../data/races.json'
import allClassData from '../data/classes.json'
import allBackgroundData from '../data/backgrounds.json'

/**
 * Erstellt ein initiales Charakterobjekt mit Standardwerten.
 * Dies wird beim Start der Charaktererstellung aufgerufen.
 */
export const initializeCharacter = () => {
  const initialRace = allRaceData.find((r) => r.key === 'human')
  const initialClass = allClassData.find((c) => c.key === 'fighter')
  const initialBackground = allBackgroundData[0]

  return {
    name: 'Held',
    gender: 'Männlich',
    race: initialRace,
    subrace: null,
    ancestry: null,
    class: initialClass,
    background: initialBackground,
    abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    ability_bonus_assignments: initialRace.ability_bonuses.fixed,
    skill_proficiencies_choice: [],
    position: { x: 2048, y: 1536 }, // Startposition für die Weltkarte
  }
}

// =================================================================
// KONSTANTEN
// =================================================================

export const SKILL_MAP = {
  acrobatics: 'dex',
  athletics: 'str',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  arcana: 'int',
  history: 'int',
  investigation: 'int',
  nature: 'int',
  religion: 'int',
  animal_handling: 'wis',
  insight: 'wis',
  medicine: 'wis',
  perception: 'wis',
  survival: 'wis',
  deception: 'cha',
  intimidation: 'cha',
  performance: 'cha',
  persuasion: 'cha',
}

export const SKILL_NAMES_DE = {
  acrobatics: 'Akrobatik',
  athletics: 'Athletik',
  sleight_of_hand: 'Fingerfertigkeit',
  stealth: 'Heimlichkeit',
  arcana: 'Arkanes Wissen',
  history: 'Geschichte',
  investigation: 'Nachforschungen',
  nature: 'Naturkunde',
  religion: 'Religion',
  animal_handling: 'Umgang mit Tieren',
  insight: 'Menschenkenntnis',
  medicine: 'Heilkunde',
  perception: 'Wahrnehmung',
  survival: 'Überlebenskunst',
  deception: 'Täuschung',
  intimidation: 'Einschüchtern',
  performance: 'Auftreten',
  persuasion: 'Überzeugen',
}

// =================================================================
// BERECHNUNGSFUNKTIONEN (aus dem Original-Projekt)
// =================================================================

/**
 * Berechnet den Attributsmodifikator für einen gegebenen Wert.
 * @param {number} score Der Attributswert (z.B. 14).
 * @returns {number} Der Modifikator (z.B. +2).
 */
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2)
}

/**
 * Berechnet den Übungsbonus für eine gegebene Stufe.
 * @param {number} level Die Charakterstufe.
 * @returns {number} Der Übungsbonus.
 */
export const getProficiencyBonus = (level) => {
  return Math.ceil(1 + level / 4)
}

/**
 * Berechnet den Attributsbonus einer bestimmten Fähigkeit basierend auf Volk, Untervolk und Zuweisungen.
 * @param {object} character Das Charakterobjekt.
 * @param {string} abilityKey Der Schlüssel der Fähigkeit (z.B. 'str').
 * @returns {number} Der gesamte Bonus für diese Fähigkeit.
 */
export const getRacialAbilityBonus = (character, abilityKey) => {
  if (!character || !character.race) return 0

  let totalBonus = 0
  const assignments = character.ability_bonus_assignments || {}

  // Feste Boni des Volks
  if (character.race.ability_bonuses.fixed && character.race.ability_bonuses.fixed[abilityKey]) {
    totalBonus += character.race.ability_bonuses.fixed[abilityKey]
  }
  // Feste Boni des Untervolks
  if (character.subrace?.ability_bonuses?.fixed?.[abilityKey]) {
    totalBonus += character.subrace.ability_bonuses.fixed[abilityKey]
  }
  // Zugewiesene flexible Boni
  if (assignments[abilityKey]) {
    totalBonus += assignments[abilityKey]
  }

  return totalBonus
}

/**
 * Berechnet die initialen Trefferpunkte (HP) auf Stufe 1.
 * @param {object} character Das Charakterobjekt.
 * @returns {number} Die maximalen HP.
 */
export const calculateInitialHP = (character) => {
  if (!character || !character.class || !character.abilities) return 0
  const conModifier = getAbilityModifier(
    character.abilities.con + getRacialAbilityBonus(character, 'con'),
  )
  return character.class.hit_die + conModifier
}

/**
 * Berechnet die Rüstungsklasse (AC).
 * @param {object} character Das Charakterobjekt.
 * @returns {number} Die Rüstungsklasse.
 */
export const calculateAC = (character) => {
  if (!character || !character.abilities) return 10
  const dexModifier = getAbilityModifier(
    character.abilities.dex + getRacialAbilityBonus(character, 'dex'),
  )
  // Vereinfachte Berechnung für den Anfang (ohne Rüstung)
  return 10 + dexModifier
}

/**
 * Prüft, ob ein Charakter in einer bestimmten Fertigkeit geübt ist.
 * @param {object} character Das Charakterobjekt.
 * @param {string} skillKey Der Schlüssel der Fertigkeit (z.B. 'athletics').
 * @returns {boolean} True, wenn geübt, sonst false.
 */
export const isProficientInSkill = (character, skillKey) => {
  if (!character) return false

  const sources = [
    character.race?.proficiencies?.skills,
    character.subrace?.proficiencies?.skills,
    character.class?.proficiencies.skills.from, // Hier nur die Auswahlmöglichkeiten
    character.background?.skill_proficiencies,
    character.skill_proficiencies_choice,
  ]

  const skillNameDE = SKILL_NAMES_DE[skillKey]

  for (const source of sources) {
    if (source?.includes(skillKey) || source?.includes(skillNameDE)) {
      return true
    }
  }
  return false
}

/**
 * Berechnet den Gesamtbonus für eine bestimmte Fertigkeit.
 * @param {object} character Das Charakterobjekt.
 * @param {string} skillKey Der Schlüssel der Fertigkeit.
 * @returns {number} Der finale Fertigkeitsbonus.
 */
export const calculateSkillBonus = (character, skillKey) => {
  if (!character || !character.abilities || !SKILL_MAP[skillKey]) return 0

  const abilityKey = SKILL_MAP[skillKey]
  const finalAbilityScore =
    character.abilities[abilityKey] + getRacialAbilityBonus(character, abilityKey)
  const modifier = getAbilityModifier(finalAbilityScore)
  const proficiencyBonus = getProficiencyBonus(1) // Annahme Stufe 1

  let bonus = modifier
  if (isProficientInSkill(character, skillKey)) {
    bonus += proficiencyBonus
  }

  return bonus
}
