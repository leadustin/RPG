import React, { useState } from 'react';
import { rollDiceFormula } from '../../engine/characterEngine';
import allClassData from '../../data/classes.json'; 
import './LevelUpModal.css';

// *** (Unveränderte Unter-Komponente) ***
const AbilityScoreImprovement = ({ abilities, points, choices, onChange }) => {
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
      {Object.keys(abilities).map((key) => (
        <div key={key} className="asi-row">
          <span className="asi-label">{key.toUpperCase()} ({abilities[key]})</span>
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


export const LevelUpModal = ({ character, onConfirm }) => {
  // *** 5. KORREKTUR: Hooks MÜSSEN vor dem "early return" stehen ***
  const [step, setStep] = useState('hp'); // 'hp', 'asi', 'subclass', 'summary'
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  
  // State für Wahlen
  // Wir initialisieren 'asiPoints' basierend auf dem Flag, *falls* character existiert
  const initialAsiPoints = character?.pendingLevelUp?.isAbilityIncrease ? 2 : 0;
  const [asiPoints, setAsiPoints] = useState(initialAsiPoints);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedSubclass, setSelectedSubclass] = useState(null);

  // *** KORREKTUR: "early return" kommt NACH den Hooks ***
  if (!character || !character.pendingLevelUp) {
    return null;
  }

  // *** 4. Daten aus pendingLevelUp extrahieren (jetzt nach dem Guard) ***
  const { newLevel, hpRollFormula, isAbilityIncrease, isSubclassChoice } = character.pendingLevelUp;

  
  // *** 6. Logik zur Schritt-Navigation ***
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
      setRollResult(Math.floor(Math.random() * 8) + 1);
      
      if (rollCount > 10) { 
        clearInterval(interval);
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
  
  // *** 7. Finale Bestätigung ***
  const handleConfirmAll = () => {
    const choices = {
      asi: isAbilityIncrease ? asiChoices : null,
      subclassKey: isSubclassChoice ? selectedSubclass : null,
    };
    // onConfirm sendet nun HP UND die Wahlen an die Engine
    onConfirm(rollResult, choices); 
  };

  // *** 8. Render-Funktionen für Schritte (unverändert) ***

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
      <AbilityScoreImprovement
        abilities={character.abilities}
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