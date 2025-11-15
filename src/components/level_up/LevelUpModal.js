// src/components/level_up/LevelUpModal.js
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box";
import { getRacialAbilityBonus } from '../../engine/characterEngine';
import { rollDiceFormula } from "../../utils/helpers";
import allClassData from '../../data/classes.json'; 
import './LevelUpModal.css';

const getRacialHpBonus = (character) => {
  if (character.subrace?.key === 'hill-dwarf') return 1;
  return 0;
};

const AbilityScoreImprovement = ({ finalAbilities, points, choices, onChange }) => {
  const handleIncrease = (key) => {
    if (points > 0 && (choices[key] || 0) < 2) {
      const newChoices = { ...choices, [key]: (choices[key] || 0) + 1 };
      onChange(newChoices, points - 1);
    }
  };

  const handleDecrease = (key) => {
    if (choices[key] > 0) {
      const newChoices = { ...choices, [key]: choices[key] - 1 };
      onChange(newChoices, points + 1);
    }
  };

  return (
    <div className="asi-selection">
      <h4>Attributswerte erhöhen ({points} Punkte übrig)</h4>
      <p>Verteile +2 auf ein Attribut oder +1 auf zwei Attribute.</p>
      {Object.keys(finalAbilities).map((key) => (
        <div key={key} className="asi-row">
          <span className="asi-label">{key.toUpperCase()} ({finalAbilities[key]})</span>
          <button onClick={() => handleDecrease(key)} disabled={!choices[key] || choices[key] <= 0}>-</button>
          <span className="asi-choice">+{choices[key] || 0}</span>
          <button onClick={() => handleIncrease(key)} disabled={points <= 0 || (choices[key] || 0) >= 2}>+</button>
        </div>
      ))}
    </div>
  );
};

const SubclassSelection = ({ classKey, onSelect, selectedKey }) => {
  const classData = allClassData.find(c => c.key === classKey);
  const subclasses = classData?.subclasses || [];

  if (subclasses.length === 0) {
    return <p>Keine Subklassen für diese Klasse verfügbar.</p>;
  }

  return (
    <div className="subclass-selection">
      <h4>Wähle deinen Archetyp</h4>
      {subclasses.map(sc => (
        <div 
          key={sc.key} 
          className={`subclass-option ${selectedKey === sc.key ? 'selected' : ''}`}
          onClick={() => onSelect(sc.key)}
        >
          <strong>{sc.name}</strong>
          <p>{sc.description}</p>
        </div>
      ))}
    </div>
  );
};

const LevelUpModal = ({ character, onConfirm }) => {
  const [step, setStep] = useState('hp');
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  const initialAsiPoints = character?.pendingLevelUp?.isAbilityIncrease ? 2 : 0;
  const [asiPoints, setAsiPoints] = useState(initialAsiPoints);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedSubclass, setSelectedSubclass] = useState(null);

  const diceContainerRef = useRef(null);
  const diceBoxRef = useRef(null);

  const finalAbilities = useMemo(() => {
    if (!character) return {};
    return {
      str: character.abilities.str + getRacialAbilityBonus(character, 'str'),
      dex: character.abilities.dex + getRacialAbilityBonus(character, 'dex'),
      con: character.abilities.con + getRacialAbilityBonus(character, 'con'),
      int: character.abilities.int + getRacialAbilityBonus(character, 'int'),
      wis: character.abilities.wis + getRacialAbilityBonus(character, 'wis'),
      cha: character.abilities.cha + getRacialAbilityBonus(character, 'cha'),
    };
  }, [character]);

  // init DiceBox
  useEffect(() => {
    async function initDice() {
      if (!diceContainerRef.current || diceBoxRef.current) return;
      try {
        diceBoxRef.current = new DiceBox("#dice-box", {
          assetPath: '/assets/dice-box/',
          scale: 20,
          width: 500,
          height: 400
        });
        await diceBoxRef.current.init();
      } catch (err) {
        console.error('Failed to init DiceBox', err);
      }
    }
    initDice();
  }, []);

  if (!character || !character.pendingLevelUp) return null;

  const { newLevel, hpRollFormula, isAbilityIncrease, isSubclassChoice } = character.pendingLevelUp;

  const getNextStep = (current) => {
    if (current === 'hp') {
      if (isAbilityIncrease) return 'asi';
      if (isSubclassChoice) return 'subclass';
      return 'summary';
    }
    if (current === 'asi') {
      if (isSubclassChoice) return 'subclass';
      return 'summary';
    }
    return 'summary';
  };

  const classToDieSides = () => {
    const c = (character.class?.key || '').toLowerCase();
    if (c.includes('barb')) return 12;
    if (c.includes('fight') || c.includes('kämpf')) return 10;
    if (c.includes('wizard') || c.includes('mage')) return 6;
    return 8;
  };

  const handleRoll = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setRollResult(null);

    const sides = classToDieSides();
    const notation = `1d${sides}`;

    try {
      let diceTotal = 0;

      if (diceBoxRef.current) {
        const ret = diceBoxRef.current.roll(notation);
        const results = await ret;

        if (results) {
          if (typeof results.total === 'number') {
            diceTotal = results.total;
          } else if (Array.isArray(results) && results.length > 0) {
            diceTotal = results.reduce((sum, r) => sum + (r.value || 0), 0);
          } else if (results.rolls && Array.isArray(results.rolls)) {
            diceTotal = results.rolls.reduce((sum, r) => sum + (r.value || 0), 0);
          }
        }
      } else {
        diceTotal = rollDiceFormula(hpRollFormula);
      }

      const match = hpRollFormula.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/i);
      const bonus = parseInt(match?.[3] || 0, 10);

      const racialBonus = getRacialHpBonus(character);

      // total OHNE racialBonus !!! (Variante A)
      setRollResult({
        die: diceTotal,
        bonus,
        racialBonus,
        total: diceTotal + bonus
      });

      setIsRolling(false);

    } catch (err) {
      console.error('Error rolling dice-box', err);
      const fallback = rollDiceFormula(hpRollFormula);
      const racialBonus = getRacialHpBonus(character);

      setRollResult({
        die: fallback,
        bonus: 0,
        racialBonus,
        total: fallback
      });

      setIsRolling(false);
    }
  };

  const handleHpConfirm = () => {
    if (!rollResult || isRolling) return;
    setStep(getNextStep('hp'));
  };

  const handleAsiChange = (newChoices, newPoints) => {
    setAsiChoices(newChoices);
    setAsiPoints(newPoints);
  };

  const handleConfirmAll = () => {
    const choices = {
      asi: isAbilityIncrease ? asiChoices : null,
      subclassKey: isSubclassChoice ? selectedSubclass : null,
    };

    // total OHNE racialBonus → Engine addiert selbst
    const hpGain = rollResult.total;

    onConfirm(hpGain, choices, rollResult);
  };

  const renderHpStep = () => (
    <div className="hp-roll-section">
      <h3>Neue Trefferpunkte</h3>
      <p>Dein Wurf: {hpRollFormula}</p>

      <div className="dice-roll-area">
        <div ref={diceContainerRef} id="dice-box" />

        {rollResult && (
          <span className="dice-result">
            {rollResult.die} + Mod {rollResult.bonus}
            {rollResult.racialBonus ? ` + Rassenbonus ${rollResult.racialBonus}` : ""}
            = {rollResult.total + (rollResult.racialBonus || 0)}
          </span>
        )}
      </div>

      {rollResult === null ? (
        <button onClick={handleRoll} disabled={isRolling} className="roll-button">
          {isRolling ? 'Würfelt…' : 'Würfeln!'}
        </button>
      ) : (
        <button onClick={handleHpConfirm} className="confirm-button">Weiter</button>
      )}
    </div>
  );

  const renderAsiStep = () => (
    <div className="asi-section">
      <AbilityScoreImprovement
        finalAbilities={finalAbilities}
        points={asiPoints}
        choices={asiChoices}
        onChange={handleAsiChange}
      />
      <button 
        onClick={() => setStep(getNextStep('asi'))}
        disabled={asiPoints > 0}
        className="confirm-button"
      >
        {asiPoints > 0 ? `Noch ${asiPoints} Punkte` : "Weiter"}
      </button>
    </div>
  );

  const renderSubclassStep = () => (
    <div className="subclass-section">
      <SubclassSelection 
        classKey={character.class.key}
        onSelect={setSelectedSubclass}
        selectedKey={selectedSubclass}
      />
      <button 
        onClick={() => setStep(getNextStep('subclass'))}
        disabled={!selectedSubclass}
        className="confirm-button"
      >
        {!selectedSubclass ? "Wähle einen Archetyp" : "Weiter"}
      </button>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="summary-section">
      <h3>Zusammenfassung</h3>
      <p>Neue Stufe: {newLevel}</p>

      {rollResult && (
        <p>
          HP-Zuwachs: {rollResult.die} + Mod {rollResult.bonus}
          {rollResult.racialBonus ? ` + Rassenbonus ${rollResult.racialBonus}` : ""}
          = {rollResult.total + (rollResult.racialBonus || 0)}  
          <br />
        </p>
      )}

      {isAbilityIncrease && asiChoices && (
        <div>
          <p>Attributserhöhungen:</p>
          <ul>
            {Object.keys(asiChoices).map(key => 
              asiChoices[key] > 0 && <li key={key}>{key.toUpperCase()}: +{asiChoices[key]}</li>
            )}
          </ul>
        </div>
      )}

      {isSubclassChoice && selectedSubclass && (
        <p>
          Neuer Archetyp: {
            allClassData
              .find(c => c.key === character.class.key)
              ?.subclasses.find(sc => sc.key === selectedSubclass)
              ?.name
          }
        </p>
      )}

      <button onClick={handleConfirmAll} className="confirm-button final-confirm">
        Aufstieg bestätigen
      </button>
    </div>
  );

  return (
    <div className="modal-backdrop">
      <div className="levelup-modal">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">
          {character.name} steigt auf Stufe {newLevel} auf!
        </p>

        {step === 'hp' && renderHpStep()}
        {step === 'asi' && renderAsiStep()}
        {step === 'subclass' && renderSubclassStep()}
        {step === 'summary' && renderSummaryStep()}
      </div>
    </div>
  );
};

export default LevelUpModal;
