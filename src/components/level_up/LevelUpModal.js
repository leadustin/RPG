import React, { useState, useMemo } from 'react'; // 'useMemo' importiert
import { 
  rollDiceFormula, 
  getRacialAbilityBonus // 'getRacialAbilityBonus' importiert
} from '../../engine/characterEngine';
import allClassData from '../../data/classes.json'; 
import './LevelUpModal.css';

// KORREKTUR: 'abilities' (Basiswerte) in 'finalAbilities' (Basis + Bonus) umbenannt
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
      {/* KORREKTUR: 'finalAbilities' wird iteriert und angezeigt (z.B. 17) */}
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

// *** (Unveränderte Unter-Komponente) ***
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


// KORREKTUR: 'export const' entfernt, um 'export default' am Ende zu verwenden
const LevelUpModal = ({ character, onConfirm }) => {
  
  // *** KORREKTUR: ALLE HOOKS (useState, useMemo) VOR DEN EARLY RETURN VERSCHOBEN ***
  const [step, setStep] = useState('hp'); // 'hp', 'asi', 'subclass', 'summary'
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  
  // State für Wahlen
  // Initialisierung muss ebenfalls vor dem Return stattfinden, mit 'character'-Prüfung
  const initialAsiPoints = character?.pendingLevelUp?.isAbilityIncrease ? 2 : 0;
  const [asiPoints, setAsiPoints] = useState(initialAsiPoints);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedSubclass, setSelectedSubclass] = useState(null);

  // 'useMemo' (Hook) muss vor dem Return stehen
  const finalAbilities = useMemo(() => {
    if (!character) return {}; // Sicherstellen, dass character existiert
    return {
      str: character.abilities.str + getRacialAbilityBonus(character, 'str'),
      dex: character.abilities.dex + getRacialAbilityBonus(character, 'dex'),
      con: character.abilities.con + getRacialAbilityBonus(character, 'con'),
      int: character.abilities.int + getRacialAbilityBonus(character, 'int'),
      wis: character.abilities.wis + getRacialAbilityBonus(character, 'wis'),
      cha: character.abilities.cha + getRacialAbilityBonus(character, 'cha'),
    };
  }, [character]); // Abhängigkeit von 'character'

  // *** (Early return ist jetzt sicher) ***
  if (!character || !character.pendingLevelUp) {
    return null;
  }

  // Datenextraktion (jetzt nach dem Guard und nach den Hooks)
  const { newLevel, hpRollFormula, isAbilityIncrease, isSubclassChoice } = character.pendingLevelUp;

  
  // *** (Restliche Funktionen bleiben unverändert) ***
  
  const getNextStep = (currentStep) => {
    if (currentStep === 'hp') {
      if (isAbilityIncrease) return 'asi';
      if (isSubclassChoice) return 'subclass';
      return 'summary';
    }
    if (currentStep === 'asi') {
      if (isSubclassChoice) return 'subclass';
      return 'summary';
    }
    if (currentStep === 'subclass') {
      return 'summary';
    }
    return 'summary';
  };

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setRollResult(null);

    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      // Zeigt eine zufällige Zahl des Würfels (ohne Boni) an
      const dieSides = parseInt(hpRollFormula.split(/[d+-]/)[1], 10) || 8;
      setRollResult(Math.floor(Math.random() * dieSides) + 1);
      
      if (rollCount > 10) { 
        clearInterval(interval);
        // Das endgültige Ergebnis ist der Wurf *inklusive* Boni
        const finalRoll = rollDiceFormula(hpRollFormula);
        setRollResult(finalRoll);
        setIsRolling(false);
      }
    }, 100);
  };

  const handleHpConfirm = () => {
    if (isRolling || rollResult === null) return;
    setStep(getNextStep('hp'));
  };

  const handleAsiChange = (newChoices, newPoints) => {
    setAsiChoices(newChoices);
    setAsiPoints(newPoints);
  };

  const handleSubclassSelect = (subclassKey) => {
    setSelectedSubclass(subclassKey);
  };

  const handleNextStep = (currentStep) => {
    setStep(getNextStep(currentStep));
  };
  
  const handleConfirmAll = () => {
    const choices = {
      asi: isAbilityIncrease ? asiChoices : null,
      subclassKey: isSubclassChoice ? selectedSubclass : null,
    };
    onConfirm(rollResult, choices); 
  };

  // *** (Render-Funktionen) ***

  const renderHpStep = () => (
    <div className="hp-roll-section">
      <h3>Neue Trefferpunkte</h3>
      <p>Dein Wurf: {hpRollFormula}</p>
      
      <div className="dice-roll-area">
        {rollResult !== null && (
          <span className={`dice-result ${isRolling ? 'rolling' : ''}`}>
            {rollResult}
          </span>
        )}
      </div>
      
      {rollResult === null ? (
        <button onClick={handleRoll} disabled={isRolling} className="roll-button">
          {isRolling ? 'Würfeln...' : 'Würfeln!'}
        </button>
      ) : (
        <button onClick={handleHpConfirm} disabled={isRolling} className="confirm-button">
          Weiter
        </button>
      )}
    </div>
  );

  const renderAsiStep = () => (
    <div className="asi-section">
      {/* KORREKTUR: Übergibt die 'finalAbilities' (mit Boni) an die Unterkomponente */}
      <AbilityScoreImprovement
        finalAbilities={finalAbilities}
        points={asiPoints}
        choices={asiChoices}
        onChange={handleAsiChange}
      />
      <button 
        onClick={() => handleNextStep('asi')} 
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
        onSelect={handleSubclassSelect}
        selectedKey={selectedSubclass}
      />
       <button 
        onClick={() => handleNextStep('subclass')} 
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
      <p>HP-Zuwachs: +{rollResult}</p>
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
        <p>Neuer Archetyp: {allClassData.find(c => c.key === character.class.key)?.subclasses.find(sc => sc.key === selectedSubclass)?.name}</p>
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
        <p className="levelup-subtitle">{character.name} steigt auf Stufe {newLevel} auf!</p>
        
        {step === 'hp' && renderHpStep()}
        {step === 'asi' && renderAsiStep()}
        {step === 'subclass' && renderSubclassStep()}
        {step === 'summary' && renderSummaryStep()}
            
      </div>
    </div>
  );
};

// KORREKTUR: 'export default' hinzugefügt, damit es zu App.js passt
export default LevelUpModal;