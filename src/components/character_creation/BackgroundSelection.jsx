// src/components/character_creation/BackgroundSelection.jsx
import "./BackgroundSelection.css";
import "./PanelDetails.css";
import allBackgroundData from "../../data/backgrounds.json";

// Definieren wir hier die Optionen, um sie wiederverwenden zu können
const languageOptions = [
  "Elfisch",
  "Gnomisch",
  "Halblingisch",
  "Infernalisch",
  "Orkisch",
  "Zwergisch",
  "Drakonisch",
  "Himmlisch",
];
const toolOptions = {
  Spieleset: ["Spielkartenset", "Würfelspielset", "Drachenschachspiel"],
  Handwerkerwerkzeug: [
    "Alchemistenwerkzeug",
    "Brauerwerkzeug",
    "Kalligraphenwerkzeug",
    "Schmiedewerkzeug",
    "Zimmermannswerkzeug",
    "Kartographenwerkzeug",
    "Schusterwerkzeug",
    "Kochgeschirr",
    "Glasblasewerkzeug",
    "Juwelierswerkzeug",
    "Lederwerkzeug",
    "Maurerwerkzeug",
    "Malerwerkzeug",
    "Töpferwerkzeug",
    "Steinmetzwerkzeug",
    "Flickwerkzeug",
    "Weberwerkzeug",
    "Holzschnitzerwerkzeug"
  ],
  Musikinstrument: [
    "Dudelsack",
    "Trommel",
    "Dulcimer",
    "Flöte",
    "Laute",
    "Leier",
    "Horn",
    "Panflöte",
    "Schalmei",
    "Harfe"
  ]
};

export const BackgroundSelection = ({ character, updateCharacter }) => {
  const selectedBackground = character.background;

  if (!selectedBackground) {
    return <div>Lade Hintergründe...</div>;
  }

  // Handler für die Auswahl in einem Dropdown
  const handleChoiceChange = (choiceKey, index, value) => {
    const newChoices = { ...character.background_choices };
    const currentSelection = newChoices[choiceKey] || [];
    currentSelection[index] = value;

    updateCharacter({
      background_choices: { ...newChoices, [choiceKey]: currentSelection },
    });
  };

  // Funktion zum Rendern der Auswahl-Dropdowns basierend auf den Texten
  const renderChoices = () => {
    const choiceElements = [];

    // Sprachauswahl
    (selectedBackground.languages || []).forEach((langText) => {
      let count = 0;
      if (langText.toLowerCase().includes("zwei")) count = 2;
      else if (langText.toLowerCase().includes("eine")) count = 1;

      if (count > 0) {
        choiceElements.push(
          <div key="language-choice" className="choice-block">
            <h4>Wähle {count} Sprache(n):</h4>
            {[...Array(count)].map((_, i) => {
              const currentLanguageChoices =
                character.background_choices.languages || [];

              // Logik zur Filterung der Optionen
              // Schließe Sprachen aus, die in *anderen* Dropdowns für Sprachen gewählt wurden.
              const availableOptions = languageOptions.filter(
                (option) =>
                  !currentLanguageChoices.some(
                    (selectedLang, selectedIndex) =>
                      selectedIndex !== i && selectedLang === option
                  )
              );

              return (
                <select
                  key={i}
                  className="panel-select"
                  value={currentLanguageChoices[i] || ""}
                  onChange={(e) =>
                    handleChoiceChange("languages", i, e.target.value)
                  }
                >
                  <option value="" disabled>
                    -- Sprache {i + 1} --
                  </option>
                  {availableOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
        );
      }
    });

    // Werkzeugauswahl
    (selectedBackground.tool_proficiencies || []).forEach((toolText, index) => {
      let options = [];
      let title = "Wähle 1 Werkzeug:";
      if (toolText.toLowerCase().includes("spieleset")) {
        options = toolOptions["Spieleset"];
        title = "Wähle 1 Spieleset:";
      } else if (toolText.toLowerCase().includes("handwerkerwerkzeug")) {
        options = toolOptions["Handwerkerwerkzeug"];
        title = "Wähle 1 Handwerkerwerkzeug:";
      } else if (toolText.toLowerCase().includes("musikinstrument")) {
        options = toolOptions["Musikinstrument"];
        title = "Wähle 1 Musikinstrument:";
      }

      if (options.length > 0) {
        // Wir verwenden hier den Tool-Text als eindeutigen Schlüssel, falls mehrere Werkzeugauswahlen existieren
        const choiceKey = `tool-${index}`;
        choiceElements.push(
          <div key={choiceKey} className="choice-block">
            <h4>{title}</h4>
            <select
              className="panel-select"
              value={character.background_choices.tools?.[index] || ""}
              onChange={(e) =>
                handleChoiceChange("tools", index, e.target.value)
              }
            >
              <option value="" disabled>
                -- Werkzeug wählen --
              </option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }
    });

    return choiceElements;
  };

  // Kombinierte Liste von Geübtheiten für die Anzeige
  const fixedToolProficiencies = (
    selectedBackground.tool_proficiencies || []
  ).filter((t) => !t.includes("deiner Wahl") && !t.includes("Ein Typ"));
  const allToolProficiencies = [
    ...fixedToolProficiencies,
    ...(character.background_choices.tools || []),
  ].filter(Boolean);
  const allLanguages = [
    ...(character.background_choices.languages || []),
  ].filter(Boolean);

  return (
    <div className="background-panel-layout">
      {/* --- LINKE SPALTE (Hintergrund-Liste) --- */}
      <div className="background-column-left">
        <div className="background-box">
          <h3>Hintergründe</h3>
          
          <div className="background-list-wrapper">
            {allBackgroundData.map((bg) => (
              <button
                key={bg.key}
                className={`background-button ${
                  selectedBackground.key === bg.key ? "selected" : ""
                }`}
                onClick={() => updateCharacter({ background: bg })}
              >
                {bg.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="background-column-right">
        <div className="background-box">
          <h2 className="panel-details-header">{selectedBackground.name}</h2>
          
          <div className="background-details-content-wrapper">
            <p className="panel-details-description">
              {selectedBackground.description}
            </p>

            {renderChoices().length > 0 && (
              <>
                <div className="details-divider"></div>
                {renderChoices()}
              </>
            )}

            <div className="details-divider"></div>

            <h3>Fertigkeiten & Werkzeuge</h3>
            <ul className="features-list">
              <li>
                <strong>Geübte Fertigkeiten:</strong>{" "}
                {selectedBackground.skill_proficiencies.join(", ")}
              </li>
              {allToolProficiencies.length > 0 && (
                <li>
                  <strong>Geübte Werkzeuge:</strong>{" "}
                  {allToolProficiencies.join(", ")}
                </li>
              )}
              {allLanguages.length > 0 && (
                <li>
                  <strong>Sprachen:</strong> {allLanguages.join(", ")}
                </li>
              )}
            </ul>

            <div className="details-divider"></div>

            <h3>Merkmal: {selectedBackground.feature.name}</h3>
            <p className="panel-details-description">
              {selectedBackground.feature.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};