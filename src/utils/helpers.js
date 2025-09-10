// src/utils/helpers.js

/**
 * Formatiert das ability_score_increase Objekt eines Volkes in einen lesbaren String.
 * @param {object} race - Das Objekt des ausgewählten Volkes.
 * @returns {string} Ein formatierter String wie "Stärke +2, Charisma +1".
 */
export const formatAbilityScores = (race) => {
  if (!race || !race.ability_score_increase) {
    return "Keine Boni";
  }

  const bonuses = [];
  const scoreIncrease = race.ability_score_increase;

  for (const [key, value] of Object.entries(scoreIncrease)) {
    if (key === 'all') {
      bonuses.push(`Alle Attribute +${value}`);
    } else if (key === 'other') {
      bonuses.push(`Wähle ${value.choose} andere Attribute +${value.amount}`);
    } else {
      // Wandelt 'strength' in 'Stärke' um
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      bonuses.push(`${formattedKey} +${value}`);
    }
  }
  return bonuses.join(', ');
};