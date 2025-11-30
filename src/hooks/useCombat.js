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
// TODO: Auswirkungen von Kampf-Zuständen (Conditions) implementieren
//       - In 'performAction': Prüfen auf 'BLINDED' (Nachteil Attacke), 'BLUR' (Nachteil Angreifer) etc.
//       - 'repeat_end_of_turn': Logik in 'tickConditions' erweitern, um Rettungswürfe automatisch zu würfeln.
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
// TODO: Flug-Mechanik (Fly, Gaseous Form)
//       - Combatant-Property 'movementModes' (Walk, Fly, Swim).
//       - Wenn 'FLYING' aktiv: Hindernisse (außer hohe Wände) beim Bewegen ignorieren. 'HOVER' verhindert Absturz bei Speed 0.
// TODO: Fallen-Auslöser (Glyph of Warding)
//       - Erweitertes Summon: 'onTrigger' Effekt definieren (hier: DAMAGE).
//       - Auslöser definieren (z.B. 'ENTER_RADIUS_3M').
// TODO: Condition-Folgeeffekte (Haste Lethargy)
//       - 'onConditionRemove': Wenn 'HASTED' ausläuft/entfernt wird -> 
//         Automatisch Condition 'LETHARGIC' (Incapacitated) für 1 Runde anwenden.
// TODO: Aufweck-Mechanik (Hypnotic Pattern, Sleep)
//       - 'onDamage': Wenn Ziel Schaden nimmt und Condition 'HYPNOTIC_TRANCE' hat -> Condition entfernen.
//       - Neue Aktion 'Wachrütteln' (Help Action?): Entfernt Condition bei Verbündetem in 1,5m.
// TODO: Variable Konzentrations-Regeln (Major Image, Bestow Curse)
//       - Beim Casten prüfen: Wenn Spell Slot >= X (z.B. 4 für Major Image), 
//         das Flag 'requiresConcentration' im aktiven Effekt auf 'false' setzen.
// TODO: Reittier-Mechanik (Mounting)
//       - Interaktion: Spieler klickt auf 'Phantomross' -> Token bewegen sich nun gemeinsam.
//       - Wenn Mount stirbt/verschwindet -> Reiter landet auf einem Feld daneben (ggf. Prone).
// TODO: Dynamische Resistenz-Wahl (Protection from Energy)
//       - Beim Wirken: UI-Popup "Wähle Element".
//       - Condition 'ENERGY_RESISTANCE' muss den gewählten Typ speichern (z.B. condition.value = 'fire').
//       - In 'takeDamage': Prüfen, ob Schadenstyp == condition.value -> Schaden halbieren.
// TODO: Inventar-Effekte (Remove Curse)
//       - 'BREAK_ATTUNEMENT': Setzt bei ausgerüsteten Items mit 'cursed: true' den Status 'attuned' auf false.

// TODO: Konzentrations-Störer (Sleet Storm)
//       - Effekt 'BREAK_CONCENTRATION': Wenn 'activeConcentrationSpell' beim Ziel existiert -> Zauber beenden (Effekte entfernen).
// TODO: Aktions-Einschränkungen durch Conditions (Slow, Stinking Cloud)
//       - 'SLOWED': Setze 'turnResources.hasBonusAction' auf false, wenn Action genutzt wurde (und umgekehrt).
//                   Setze 'acModifier' auf -2.
//       - 'NAUSEATED': Setze 'hasAction' und 'hasBonusAction' auf false.
// TODO: Zauber-Fehlfunktion (Slow)
//       - In 'performAction': Wenn Caster 'SLOWED' ist -> 25% Chance (W4 == 1), dass der Zauber abgebrochen wird (ohne Slot-Verlust?).
// TODO: Lifesteal-Mechanik (Vampiric Touch)
//       - In 'performAction': Wenn Effekt-Property 'healing_on_damage' (z.B. 0.5) hat:
//         Berechneten Schaden nehmen, * 0.5 rechnen und dem 'attacker' als HP gutschreiben.
// TODO: Terrain-Immunität (Water Walk)
//       - In 'calculateMoveCost': Wenn Tile-Typ 'WATER'/'LAVA'/'ACID' ist UND Combatant hat 'WATER_WALK':
//         Behandle Tile als 'GROUND' (normale Kosten, kein Schaden/Sinken).
// TODO: Banished-Mechanik (Banishment)
//       - Wenn Status 'BANISHED' aktiv:
//         1. Speichere aktuelle Position des Tokens.
//         2. Entferne Token temporär aus der 'combatants'-Liste (oder setze Flag 'hidden: true').
//       - Beim Entfernen des Status: Token an alter Position (oder nächstem freien Feld) wieder einfügen.

// TODO: Auto-Fail Bedingungen bei Saves (Blight)
//       - In 'performAction' -> 'saving_throw':
//         Prüfen auf 'auto_fail_if'. Wenn 'target.type' oder Tags matchen -> Save gilt als misslungen.
// TODO: Emanationen / Auren (Spirit Guardians, Conjure Minor Elementals)
//       - Condition 'ELEMENTAL_SPIRITS':
//         1. In 'performAction': Addiere 2d8 Schaden zu jedem Angriff des Casters.
//         2. In 'calculateMoveCost': Wenn Gegner sich in 4,5m zum Caster befindet -> Kosten verdoppeln.

// TODO: Zufalls-Verhalten (Confusion)
//       - 'startTurn': Wenn Condition 'CONFUSED' aktiv -> W10 würfeln und Aktion automatisch setzen (z.B. 'forceAction: skip' oder 'forceAttack: random').
// TODO: Gruppen-Teleport (Dimension Door, Teleport)
//       - 'TELEPORT': Wenn mehrere Ziele ausgewählt sind (Caster + Gast), müssen beide zum Zielpunkt (tx, ty) verschoben werden.
//       - Kollisions-Check: Wenn Zielort besetzt -> 4d6 Force Damage anwenden und Teleport abbrechen.

// TODO: Terrain-Manipulation (Control Water)
//       - 'SUMMON' mit Typ 'WATER_EFFECT':
//         - Wenn Effekt 'Flood': Tiles im Radius erhalten Eigenschaft 'water' (Schwimmen nötig).
//         - Wenn Effekt 'Part Water': Tiles im Radius (Linie) verlieren 'water'-Eigenschaft (werden begehbar).
// TODO: Reaktiver Schaden (Fire Shield)
//       - In 'performAction': Wenn Ziel Condition 'FIRE_SHIELD' hat UND Attacke 'melee' ist:
//         -> Angreifer erhält 2d8 Schaden (Typ abhängig von Condition-Value).

// TODO: Unterscheidung Unsichtbarkeit (Greater Invisibility)
//       - In 'performAction': Wenn Attacker 'INVISIBLE' hat -> Condition entfernen.
//       - Wenn Attacker 'GREATER_INVISIBILITY' hat -> Condition behalten.
// TODO: Komplexer Schaden (Ice Storm, Flame Strike)
//       - Die Engine muss unterstützen, dass EINE Aktion MEHRERE Damage-Effekte nacheinander auslöst.
//       - Aktuell iteriert 'performAction' über 'effects', was korrekt ist, aber die Log-Ausgabe ("X Schaden")
//         sollte idealerweise zusammengefasst werden ("20 Wucht und 15 Kälte").

// TODO: Inventar-Integration (Secret Chest)
//       - Das Summon 'Geheime Truhe' sollte ein eigenes Inventar haben, das persistent gespeichert wird
//         (auch wenn das Token despawnt/neu beschworen wird).
// TODO: Automatische Runden-Effekte (Faithful Hound, Spiritual Weapon)
//       - 'onTurnStart': Prüfen, ob Caster ein Summon hat, das automatisch angreift (Hound).
//       - Automatisch 'performAction' für das Summon auslösen (bei Hound: GE-Save gegen nächsten Feind).

// TODO: Totale Immunität (Resilient Sphere, Otiluke's)
//       - Condition 'RESILIENT_SPHERE':
//         1. 'takeDamage' -> Schaden immer auf 0 setzen (außer 'Disintegrate').
//         2. 'performAction' -> Verhindern, dass Ziel Aktionen ausführt, die nach außen wirken.
// TODO: Wiederkehrender Schaden bei Save-Failure (Phantasmal Killer)
//       - Condition 'NIGHTMARE_HAUNTING': Wenn der 'repeat_end_of_turn' Save misslingt,
//         muss die Engine denselben Schadenswert (4d10) erneut anwenden.
//       - Benötigt Feld 'damageOnSaveFail' in der Condition-Definition.

// TODO: Polymorph-Mechanik (Temp-HP Puffer)
//       - Condition 'POLYMORPHED':
//         1. Beim Anwenden: UI öffnet "Wähle Tier".
//         2. Setze 'tempHp' des Ziels auf 'beast.hp'.
//         3. Ändere Token-Bild und Actions temporär.
// TODO: Dynamische HP für Summons (Bigby's Hand)
//       - Wenn 'entity.hp' == 'caster_max_hp' -> Setze HP des Tokens auf attacker.maxHp.

// TODO: Skalierung von Summon-Aktionen (Animate Objects)
//       - Wenn Spell Slot > Basis-Level: Erhöhe Schaden der 'entity.actions' (z.B. +1d12 bei Huge Object).
//       - Aktuell sind die Actions im JSON statisch definiert.
// TODO: Automatische Bewegung von Summons (Cloudkill)
//       - 'onTurnStart': Wenn Caster an der Reihe ist -> Alle eigenen Summons mit 'auto_move_away: true' finden.
//       - Vektor berechnen (Caster -> Summon) und Summon 3m weiter schieben.

// TODO: Große Token (Conjure Elemental)
//       - 'size: large' im Summon-Entity unterstützen.
//       - Grid-Logik anpassen: Token belegt 2x2 Felder. Kollisionsabfrage muss alle 4 Felder prüfen.
// TODO: Save bei Schaden (Dominate Person, Polymorph)
//       - Wenn 'takeDamage' aufgerufen wird: Prüfen ob Condition 'DOMINATED' aktiv ist.
//       - Wenn ja: Sofortigen Saving Throw (Wisdom) auslösen. Bei Erfolg Condition entfernen.

// TODO: Selbst-Gefährdung (Contact Other Plane)
//       - Wenn target.type === 'SELF' und saving_throw definiert ist:
//         Der Caster muss den Save würfeln, nicht ein Gegner.
// TODO: Rest-Prevention (Dream)
//       - Condition 'NIGHTMARE': Muss beim 'longRest'-Event geprüft werden.
//       - Wenn aktiv: Keine HP/Spellslots regenerieren und Exhaustion-Level nicht senken.

// TODO: Manuelle Schadens-Trigger (Geas)
//       - UI: Button "Strafe auslösen" bei aktiver 'GEAS'-Condition.
//       - Führt den verknüpften Damage-Effekt (5d10) sofort aus.
// TODO: Kontextabhängige Vorteile bei Saves (Modify Memory, Charm Person)
//       - Engine muss wissen, ob 'attacker' und 'target' feindlich sind ('isFighting').
//       - Falls ja: Vorteil auf den Wisdom-Save gewähren.

// TODO: Geteilte Sinne (Mislead, Arcane Eye, Familiar)
//       - UI-Feature: "Switch View" Button bei aktiven Summons, die das erlauben.
//       - Rendert den Fog of War aus der Perspektive des Summons.
// TODO: Wand-Passierbarkeit (Passwall)
//       - In 'calculateMoveCost' / 'isTilePassable':
//         Prüfen, ob ein 'Passwall'-Token auf einem 'WALL'-Tile liegt.
//         Falls ja: Tile temporär als passierbar behandeln.

// TODO: Beschwörungs-Verlängerung (Planar Binding)
//       - Wenn Condition 'BOUND_TO_SERVICE' erfolgreich angewendet wird:
//         Prüfen, ob das Ziel ein Summon ist. Falls ja, dessen 'despawnTime' überschreiben/verlängern.
// NEU: Logik für Teleportationskreis: Implementiere eine Mechanik zur sofortigen, zielsicheren Teleportation (kein Wurf) beim Durchqueren des Portal-Tokens ('TELEPORT' Effekt).
// NEU: Logik für die Totale Immunität (Wall of Force): Implementiere eine Immunitätsregel für das Summon-Objekt (hp: 9999, ac: 25), die verhindert, dass es durch normalen Schaden oder 'Magie bannen' beendet wird (es sei denn, die Aktion ist 'Auflösung').
// NEU: Logik für Steinwand: Implementiere einen GE-Rettungswurf, der ausgelöst wird, wenn eine Kreatur von einer (umschließenden) Steinwand eingeschlossen würde, um ihr eine Reaktion zur Bewegung zu geben.
// NEU: Logik für Steinwand-Segmente: Implementiere Logik, um die AC (15) und HP (180/Segment) des Summon-Tokens in Schadensberechnungen zu berücksichtigen.

// TODO: Logik für Objekt-Interaktionen implementieren
//       - Neue Action-Typen: 'INTERACT' (für Türen, Truhen)
//       - Prüfung: Ist Tür verschlossen? Schlüssel vorhanden?
// TODO: Erweitertes Beschwörungs-System (Summons)
//       - Bessere Kontrolle für beschworene Einheiten (z.B. Magierhand)
// TODO: Logik für Objekt-Interaktionen implementieren
//       - Neue Action-Typen: 'INTERACT' (für Türen, Truhen)
// NEU: Logik für Disintegrate (Auflösung): Implementiere den Effekt-Typ 'DISINTEGRATE'. 
//      Wenn Schaden eine Kreatur auf 0 TP reduziert, muss sie (und ihre Ausrüstung) entfernt werden. 
//      Zudem: Automatische Zerstörung von Creations of Magical Force (wie Wall of Force).
// NEU: Logik für Eyebite: Füge Condition 'EYEBITE_AFFECTED' hinzu (Unconscious, Panicked, Poisoned). 
//      Implementiere die Logik, die dem Caster erlaubt, in Folgezügen eine Magische Aktion zum Re-Targeting zu nutzen.
// NEU: Logik für Command Range (Create Undead): Stelle sicher, dass befehligte Summons (mit 'control_range_m') 
//      nur Befehle erhalten können, wenn sie innerhalb der Reichweite (36m) sind. Steuerung über Bonusaktion.
// NEU: Logik für Chain Lightning (Kettenblitz): Erweitere 'performAction', um den Effekt-Typ 'target_chain' zu verarbeiten. 
//      Dies umfasst die Berechnung der 3 zusätzlichen Ziele (und deren Skalierung) innerhalb der 9m-Reichweite vom primären Ziel.
// NEU: Logik für Contingency (Eventualität): Implementiere einen Mechanismus (z.B. ein 'activeContingency' Objekt im State), 
//      das einen gespeicherten Zauber (Grad <= 5) und eine Auslöser-Bedingung (Trigger) enthält. 
//      Der Trigger muss in 'startTurn' oder 'takeDamage' geprüft und der Zauber (mit Ziel 'Self') bei Erfolg sofort gewirkt werden.
// NEU: Logik für Flesh to Stone: Implementiere den mehrstufigen Zustand ('FTS_RESTRAINED'). 
//      Dieser muss 3 Erfolge und 3 Misserfolge beim KO-RW am Zugende zählen, um entweder den Zauber zu beenden oder den Zustand 'Versteinert' (Petrified) auszulösen.
// NEU: Logik für Globe of Invulnerability: Implementiere den Effekt-Typ 'MAGIC_BLOCK'. 
//      Dieser muss beim Versuch, einen Zauber zu wirken, prüfen, ob der Zaubergrad (inkl. Skalierung) den geblockten Grad (5 + Slot-Level-Bonus) übersteigt.
// NEU: Logik für Guards and Wards: Implementiere den Effekt-Typ 'APPLY_WARD'. 
//      Dieser muss die Generierung mehrerer statischer/magischer Hindernisse auf der Karte (Fog, Arcane Lock, Web, Suggestion) verwalten.
// NEU: Logik für Drawmijs Instant Summons: Implementiere den Effekt 'INSTANT_SUMMONS_MARK', der das getaggte Objekt (Item) und den Caster speichert. Der Action-Trigger (Saphir zerquetschen) muss dann die Zustände prüfen (getragen/nicht getragen) und entweder einen Teleport (Objekt in Hand) oder eine Informationsgabe (Ort/Träger) auslösen.
// NEU: Logik für Otto's Irresistible Dance: Implementiere die zwei Stufen des Zaubers: 'IRRESISTIBLE_DANCE_SUCCESS' (Speed 0, tanzt 1 Runde) und 'IRRESISTIBLE_DANCE_FAIL' (Charmed, Disadvantage auf GE/Angriff, Vorteil gegen es). Der Ziel-Combatant muss die Option erhalten, als Aktion einen Save zu würfeln, um den Zustand 'FAIL' zu beenden.
// NEU: Logik für Magic Jar: Implementiere den Effekt 'MAGIC_JAR_SOUL_TRANSFER' und verwalte den Zustand der Seele (in Body/Vessel/Host). Die 'MAGIC_ACTION' muss die Besitznahme (CH-Save) triggern, die temporäre Stat-Übernahme der Host-Kreatur und die Todes-Mechanik (CH-Save gegen DC) bei Zerstörung des Host-Körpers/Ende des Zaubers.
// NEU: Logik für Mass Suggestion: Erweitere 'SUGGESTION_CHARM' um die Logik 'DURATION_BY_SLOT', um die Dauer auf 10/30/366 Tage zu skalieren (86400s -> 864000s -> 2592000s -> 31622400s).
// NEU: Logik für Move Earth: Implementiere den Effekt-Typ 'TERRAIN_SHAPING'. Dies muss ein UI-Element ermöglichen, das alle 10 Minuten der Konzentration eine neue Geländemodifikation (ohne direkten Schaden/Einschluss von Kreaturen) erlaubt.
// NEU: Logik für Otiluke's Freezing Sphere (Versatile): Füge Logik für 'versatile_use' hinzu. Dies muss dem Spieler erlauben, den Zauber zu 'halten' (no_action) und ihn dann als Waffe (range 40ft/12m) zu verwenden.
// NEU: Logik für Otiluke's Freezing Sphere (Water): Implementiere den Effekt-Typ 'FREEZE_WATER_SPECIAL'. Wenn das Ziel eine 'WATER'-Fliese ist, spawne einen 9m-Radius 'Restrained' Hazard Zone. Die Kreaturen im Bereich müssen einen ST(Athletics)-Check gegen den Zauber-SG als Aktion nutzen, um sich zu befreien.
// NEU: Logik für Programmed Illusion: Implementiere den Effekt 'SUMMON_ILLUSION_TRAP', der die Illusion nach einem visuellen/hörbaren Trigger aktiviert und sie nach 5 Minuten für 10 Minuten in den Ruhezustand (Dormancy) versetzt.
// NEU: Logik für Sunbeam: Implementiere den Effekt 'RECAST_ACTION' für Magische Aktionen und sorge dafür, dass der Buff 'ADD_LIGHT_SOURCE' die Eigenschaft 'is_sunlight' korrekt anwendet (relevant für Kreaturen, die auf Sonnenlicht empfindlich reagieren).
// NEU: Logik für True Seeing: Implementiere die Condition 'TRUESIGHT_BUFF' (Wahrer Blick), die automatisch unsichtbare Kreaturen/Objekte und Illusionen innerhalb der Reichweite (36m) des Ziels sichtbar macht.
// NEU: Logik für Mass Suggestion: Erweitere 'SUGGESTION_CHARM' um die Logik 'DURATION_BY_SLOT', um die Dauer auf 10/30/366 Tage zu skalieren (86400s -> 864000s -> 2592000s -> 31622400s).
// NEU: Logik für Move Earth: Implementiere den Effekt-Typ 'TERRAIN_SHAPING'. Dies muss ein UI-Element ermöglichen, das alle 10 Minuten der Konzentration eine neue Geländemodifikation (ohne direkten Schaden/Einschluss von Kreaturen) erlaubt.
// NEU: Logik für Otiluke's Freezing Sphere: Implementiere den Effekt 'FREEZE_WATER_SPECIAL'. Wenn das Ziel eine 'WATER'-Fliese ist, spawne einen 9m-Radius 'Restrained' Hazard Zone. Die Kreaturen im Bereich müssen einen ST(Athletics)-Check gegen den Zauber-SG als Aktion nutzen, um sich zu befreien.
// NEU: Logik für Wall of Ice: Implementiere die Logik für 'VULNERABILITY' (Feuer) und die separate Schadensberechnung bei Zerstörung eines Segments ('FRIGID_AIR_HAZARD').
// NEU: Logik für Arcane Gate: Implementiere den Effekt-Typ 'SUMMON_LINKED_GATES'. Dies muss zwei separate Token spawnen und das Teleport-Verhalten (inkl. Bonusaktion zum Ändern der 'facing') für Kreaturen, die das Token betreten, verwalten.
// NEU: Logik für Mordenkainens Magnificent Mansion: Implementiere den Effekt-Typ 'SUMMON_PORTAL_TO_DEMIPLANE'. Dies muss einen 'Expel' (Auswurf) Effekt auf alle Kreaturen im Inneren des Dwellings auslösen, wenn der Zauber endet.
// NEU: Logik für Delayed Blast Fireball: Implementiere den Effekt 'DELAYED_EXPLOSION_HAZARD'. Dies muss den Cast im State speichern, pro Runde 1W6 Schaden akkumulieren und einen Trigger für die sofortige Explosion bei Berührung oder Wurf (neue Aktionen) bieten.
// NEU: Logik für Etherealness: Implementiere die Condition 'ETHEREAL', die die Interaktion mit der Haupt-Map unterbindet, die Sichtweite einschränkt und beim Entfernen den 'Shunting Damage' (Kraftschaden, wenn der Rückkehrplatz besetzt ist) berechnet.
// NEU: Logik für Finger of Death: Implementiere den Effekt 'KILL_TO_ZOMBIE'. Dieser muss prüfen, ob ein 'HUMANOID' auf 0 TP reduziert wurde, und die Beschwörung eines Zombie-Tokens zum Beginn des nächsten Zuges des Casters planen.
// NEU: Logik für Forcecage: Implementiere den Effekt 'SUMMON_PRISON', der ein unzerstörbares/nicht-bannbares Token platziert. Ein Teleportationsversuch (neue Aktion) aus dem Bereich muss einen CH-Rettungswurf triggern.
// NEU: Logik für Mordenkainen's Sword: Implementiere den kombinierten Schadenseffekt 'DAMAGE' mit 'initial_strike: true' und 'recast_bonus_action: true', der den Schaden **4W12 + Spell Mod** sowohl beim Wirken als auch als Bonusaktion anwendet.
// NEU: Logik für Plane Shift: Implementiere den Effekt-Typ 'INTERPLANAR_TELEPORT'. Dies muss eine Gruppe von bis zu 9 Kreaturen sofort von der aktuellen Karte entfernen (und optional eine neue Karte/Ebene laden).
// NEU: Logik für Prismatic Spray: Implementiere den Effekt-Typ 'PRISMATIC_RAY', der einen 1W8 Wurf mit einer verzweigten Tabelle von Effekten (Damage, Restrained/Petrified, Blinded/Plane Shift) verarbeitet.
// NEU: Logik für Project Image: Implementiere den Effekt 'SUMMON_ILLUSORY_DOUBLE'. Dieses Token muss eine 'MAGIC_ACTION' für Bewegung/Kontrolle nutzen können und bei jeglichem Schaden sofort entfernt werden.
// NEU: Logik für Reverse Gravity: Implementiere den Effekt 'REVERSE_GRAVITY_FALL' mit der Berechnung der Aufwärtsbewegung, der DEX-Save zum Festhalten an Objekten und den Fallschaden bei Kollision mit dem 'Dach' (oder bei Ende des Zaubers).
// NEU: Logik für Sequester: Implementiere die Condition 'SEQUESTERED'. Bei Kreaturen muss diese den Zustand 'Bewusstlos' (Unconscious) erzwingen, das Altern/Bedürfnisse stoppen und den Zustand bei jeglichem Schaden entfernen.
// NEU: Logik für Simulacrum: Implementiere den Effekt 'SUMMON_SIMULACRUM'. Dieser muss die Max-TP des Summons auf die Hälfte des Originals setzen und sicherstellen, dass die Heilung (100 GM/TP) nur während einer Langen Rast in 1.5m Entfernung möglich ist. Außerdem: Implementiere eine Logik, die ein vorhandenes Simulakrum zerstört, wenn der Zauber erneut gewirkt wird.
// NEU: Logik für Symbol: Implementiere den Effekt 'SUMMON_GLYPH_TRAP'. Dies ist eine passive Falle mit einer 'Perception'-Check-Schwelle zum Entdecken, einer Trigger-Logik (innerhalb von 9m) und einer verzweigten Rettungswurf-Logik (save-per-effect). Stelle sicher, dass die Falle zerbricht, wenn sie mehr als 3m bewegt wird.
// NEU: Logik für Teleport: Implementiere den Effekt 'TELEPORT_W100_CHECK'. Dieser muss eine Auswahl der Vertrautheitsstufe (Familiarity) ermöglichen, den W100-Wurf simulieren und bei 'Mishap' (Panne) den 3W10 Kraftschaden anwenden.
// NEU: Logik für Antimagic Field: Implementiere die Condition 'ANTIMAGIC_AURA'. Diese muss alle Zauberwirkungen (Casten, Magische Aktionen) im 3m-Radius blockieren und laufende Zauber/magische Effekte unterdrücken, wenn sie den Bereich betreten.
// NEU: Logik für Antipathy/Sympathy: Implementiere den Effekt 'APPLY_AURA_EFFECT' für erzwungenes Verhalten. Dieser muss beim Betreten des 36m-Aura-Radius einen WE-Rettungswurf auslösen und bei Fehlschlag 'FRIGHTENED' (muss fliehen) oder 'CHARMED' (muss sich nähern) anwenden.
// NEU: Logik für Clone: Erweitere den Engine-Zustand um eine 'cloneTracker'-Funktion, die den Tod des Originals abfängt und bei einer erfolgreichen Seelenübertragung das Token des Originals als 'inert' markiert.
// NEU: Logik für Control Weather: Implementiere den Effekt 'WEATHER_CONTROL'. Die Engine muss die 1d4x10 Minuten Verzögerung und den 5-Meilen-Radius berücksichtigen (relevant für Fernkampfsicht, falls implementiert).
// NEU: Logik für Demiplane: Implementiere den Effekt-Typ 'SUMMON_PORTAL_TO_DEMIPLANE' für die Erstellung der Tür. Beim Ende des Zaubers (Duration End) muss eine Abfrage erfolgen, die Kreaturen, die sich noch im Inneren des Dwellings befinden, entweder in den Zustand 'Prone' versetzt (wenn sie ausgeworfen werden) oder dauerhaft entfernt (wenn sie bleiben).
// NEU: Logik für Dominate Monster: Implementiere die Logik 'advantage_if_fighting' für Rettungswürfe (prüft, ob Caster/Verbündete das Ziel bekämpfen) und 'repeat_on_damage' (löst einen Save aus, wenn das Ziel Schaden nimmt).
// NEU: Logik für Incendiary Cloud: Implementiere den Hazard-Trigger 'AREA_DAMAGE_ON_ENTRY_OR_END_TURN' (Schaden bei Betreten/Zugende, max. 1x pro Zug). Implementiere die Summon-Bewegungs-Logik 'auto_move_away' (3m weg vom Caster zu Beginn des Zuges).
// NEU: Logik für Befuddlement: Implementiere die Condition, die das Wirken von Zaubern und 'Magische Aktionen' unterbindet und den 'repeat_interval' von '30_DAYS' unterstützt.
// NEU: Logik für Maze: Implementiere den Banishment-Effekt, bei dem das Ziel eine 'Study/Investigation'-Aktion nutzen kann, um sich mit einem IN(Investigation) Wurf (SG 20) zu befreien.
// NEU: Logik für Mind Blank: Implementiere die Condition 'MIND_BLANK', die Immunität gegen psychischen Schaden/Charmed gewährt und **alle** magischen Ortungs-/Gedankenleseversuche blockiert.
// NEU: Logik für Power Word: Stun: Implementiere den Effekt 'APPLY_CONDITION_CONDITIONAL' basierend auf dem aktuellen HP-Schwellenwert (<= 150 TP für Stunned). Füge den sekundären Effekt ('Speed 0') für Ziele mit >150 TP hinzu.
// TODO: Logik für Sunburst: Implementiere den Effekt 'DISPEL_MAGIC_EFFECTS' (speziell gegen DARKNESS_SPELL) und die verlängerte 'BLINDED' Condition mit wiederholtem KO-Rettungswurf am Zugende.
// TODO: Logik für Telepathy: Implementiere die Condition 'TELEPATHIC_LINK_PERMANENT', die die Kommunikation mit einem bekannten Ziel auf derselben Ebene für die Dauer ermöglicht (keine direkten Kampfeffekte).
// TODO: Logik für Astral Projection: Implementiere den Effekt 'ASTRAL_PROJECTION'. Dies muss das Ziel-Token vom Raster entfernen (Unconscious Condition auf dem Original), aber einen verknüpften 'Astral-Token' erstellen, der die Game-Statistiken erbt. Der Zauber muss auch das Ende des Zaubers bei 0 TP (Astral oder Material) behandeln.
// NEU: Logik für Foresight: Implementiere die Condition 'FORESIGHT', die dem Ziel dauerhaft Vorteil auf alle Checks/Saves und Gegnern Nachteil auf Angriffe gegen das Ziel gewährt.
// NEU: Logik für Gate: Implementiere den Effekt 'SUMMON_PORTAL_TO_PLANE', der ein interdimensionales Portal erstellt und die Option zur benannten Zwangsbeschwörung einer Kreatur (Nameingabe) von einer anderen Ebene unterstützt.
// NEU: Logik für Imprisonment: Implementiere den Effekt-Typ 'IMPRISON' mit einer komplexen Banishment/Condition-Logik, die die Immunität des Ziels bei erfolgreichem Save für 24 Stunden blockiert und die speziellen Effekte (wie 'Restrained' bei Chaining oder 'Unconscious' bei Slumber) anwendet.
// TODO: Logik für Meteor Swarm: Implementiere die 'multi_hit_restriction' Logik für Flächenschaden (Kreaturen werden nur einmal pro Cast von 4 Explosionen getroffen) und die kombinierte Schadensberechnung (20W6 Feuer + 20W6 Wucht).
// TODO: Logik für Power Word: Kill: Implementiere den Effekt 'INSTANT_KILL_CONDITIONAL', der bei 100 TP oder weniger das Ziel sofort tötet und andernfalls 12W12 Psychoschaden anwendet.
// TODO: Logik für Prismatic Wall: Implementiere den Effekt 'PRISMATIC_WALL_LAYER_DAMAGE'. Dies muss den KO-Rettungswurf für das 'Blinded'-Condition beim Start des Zuges/Betreten des 6m-Radius auslösen und die 7 schichtweisen GE-Rettungswürfe beim Durchqueren der Wand verwalten.
// TODO: Logik für Shapechange: Implementiere den Effekt 'SHAPECHANGE_TRANSFORM'. Dies muss die Fähigkeit zur 'MAGIC_ACTION' für Formwechsel während der Dauer bieten und die komplexe Stat-Erhaltung/Übernahme (Beibehaltung mentaler Stats/HP, Übernahme physischer Stats/Temp-HP der neuen Form) verwalten.
// TODO: Logik für Time Stop: Implementiere den Effekt 'TIME_STOP', der 1W4 + 1 zusätzliche, sequentielle Runden für den Caster gewährt. Die Engine muss den Zauber vorzeitig beenden, wenn der Caster eine andere Kreatur oder deren getragene Ausrüstung beeinflusst.
// TODO: Logik für True Polymorph: Implementiere den Effekt 'TRUE_POLYMORPH' mit den drei Verwandlungsvarianten (Creature<->Creature, Object->Creature, Creature->Object). Füge die Logik zur permanenten Verwandlung bei voller Konzentrationsdauer hinzu.
// TODO: Logik für Weird: Implementiere den Effekt 'PRISMATIC_RAY' für den 9. Grad Zauber. Dies muss den initialen Psychoschaden + Frightened Condition verarbeiten und die Logik für den wiederholten 5W10 Psychoschaden bei einem gescheiterten RW am Zugende implementieren.
// TODO: Logik für Wish: Implementiere den Effekt-Typ 'WISH'. Dies erfordert die Fähigkeit, andere Zauber der Stufe <= 8 zu simulieren, sowie die Logik für den 'Stress' bei nicht-Standard-Wünschen (unkombinierbarer nekrotischer Schaden, STR-Drop, Chance auf Zauberverlust).
// TODO: Logik für Guidance: Implementiere die Condition 'GUIDANCE', die dem Ziel erlaubt, einen 1W4-Bonus auf einen Fähigkeitscheck zu addieren (einmalige Nutzung, Konzentration).
// NEU: Logik für Resistance: Implementiere die Condition 'RESISTANCE_DAMAGE_REDUCTION' im Schadens-Handler, um 1W4 Schaden eines gewählten Typs einmal pro Zug zu reduzieren.
// NEU: Logik für Sacred Flame: Implementiere das Attribut 'ignore_cover' für Rettungswürfe, damit halbe/dreiviertel Deckung keinen Bonus auf den SG/RW gewährt.
// NEU: Logik für Thaumaturgy: Füge die Condition 'THAUMATURGY_BOOMING_VOICE' hinzu, die permanenten Vorteil auf CH(Einschüchtern) verleiht. Implementiere die Logik 'max_active_effects: 3' für Cantrips.
// NEU: Logik für Bane/Bless: Implementiere die Conditions 'BANE_DEBUFF' (-1W4) und 'BLESS_BUFF' (+1W4) direkt in die Würfel-Engine für Angriffs- und Rettungswürfe.
// NEU: Logik für Command: Implementiere den Zustand 'COMMANDED' (1 Runde). Die Engine muss die fünf spezifischen Befehle (Approach, Drop, Flee, Grovel, Halt) in der Logik des nächsten Zuges des Ziels auslösen (z.B. Zwangsbewegung, Ablegen von Gegenständen, Zustand 'Liegend').
// NEU: Logik für Create or Destroy Water: Implementiere den Effekt 'CREATE_OR_DESTROY_WATER' mit der dualen Funktionalität (Volumen ODER Flächeneffekt, skalierbar). Der Flächeneffekt 'Regen' muss das Entfernen von 'FIRE'-Tokens/Conditions aus dem Würfel ermöglichen.
// NEU: Logik für Cure Wounds: Korrigiere die Heilungsberechnung auf 2W8 + Modifikator (statt 1W8 + Mod) und erhöhe die Skalierung auf +2W8 pro Grad.
// NEU: Logik für Detect Evil and Good: Implementiere die Logik zur Blockade durch Deckung im Sichtprüfungs-Handler (1 Fuß Stein/Holz/Erde, 1 Zoll Metall, Blei). Füge die Sende-Mechanik für den 'Hallow'-Zauber hinzu.
// NEU: Logik für Guiding Bolt: Implementiere den Effekt 'ADVANTAGE_NEXT_ATTACK', der den nächsten Angriffswurf gegen das Ziel (vor Ende des nächsten Zuges des Zauberers) mit Vorteil ausführt.
// NEU: Logik für Healing Word: Korrigiere die Heilungsberechnung auf 2W4 + Modifikator und passe die Skalierung auf +2W4 pro Grad an.
// NEU: Logik für Detect Poison and Disease: Implementiere die Logik zur Blockade von 'detect_poison_and_disease' durch physische Deckung (1 Fuß Stein/Holz/Erde, 1 Zoll Metall, Blei).
// NEU: Logik für Inflict Wounds: Korrigiere die Schadenstyp-Anwendung von 'Nahkampf-Zauberangriff' auf einen 'KO-Rettungswurf' (2W10 Schaden).
// NEU: Logik für Purify Food and Drink: Implementiere den Effekt 'PURIFY_CONSUMABLES_OR_FOG'. Dieser muss die Dualität (Reinigung ODER Zerstörung eines 9m Nebel-Tokens) unterstützen.
// NEU: Logik für Sanctuary: Implementiere die Condition 'SANCTUARY'. Diese muss einen WE-Rettungswurf des Angreifers/Zaubernden auslösen und den Zauber sofort beenden ('ends_on_hostile_action'), wenn das geschützte Ziel selbst feindliche Aktionen ausführt.
// NEU: Logik für Shield of Faith: Implementiere die Condition 'SHIELD_OF_FAITH_BUFF' zur dynamischen Erhöhung der RK um +2 für die Dauer.
// NEU: Logik für Aid: Implementiere den Effekt 'HEALING' mit type 'max_hp_and_current_hp' zur gleichzeitigen Erhöhung der aktuellen und maximalen TP. Füge die Skalierungslogik (+5 pro Grad über 2) hinzu.
// NEU: Logik für Augury: Implementiere den Effekt 'DIVINATION_OMEN' als Logik, die den Zauberer über die Konsequenzen informiert und die kumulative 25%-Chance auf Fehlschlag bei wiederholter Anwendung vor einer Langen Rast verfolgt.
// NEU: Logik für Beacon of Hope: Implementiere die Condition 'BEACON_OF_HOPE', die Vorteil auf WE-Saves/Todesrettungswürfe gewährt und Heilung auf den maximal möglichen Wert setzt.
// NEU: Logik für Calm Emotions: Implementiere die Condition 'CALM_EMOTIONS_AFFECTED' mit der dualen Funktionalität: 1. Immunität/Unterdrückung von Charmed/Frightened. 2. Indifferenz (endet bei Schaden/witnessing damage).
// NEU: Logik für Enhance Ability: Implementiere die Condition 'ENHANCE_ABILITY_ADVANTAGE', die Vorteil auf Ability Checks für ein vom Zaubernden gewähltes Attribut gewährt.
// NEU: Logik für Find Traps: Implementiere den Effekt 'LOCATE_TRAPS' zur Erkennung von Fallen in Sichtlinie. Der Effekt darf nur die Existenz und die allgemeine Gefahr, nicht jedoch die genaue Position verraten.
// NEU: Logik für Lesser Restoration: Korrigiere die Casting Time von '1 Aktion' auf '1 Bonusaktion'.
// NEU: Logik für Prayer of Healing: Implementiere den Effekt 'GAIN_REST_BENEFIT' zur Gewährung der Vorteile einer Kurzen Rast. Führe außerdem einen 'Long Rest Cooldown' für betroffene Ziele ein.
// NEU: Logik für Protection from Poison: Implementiere die Logik zur sofortigen Entfernung des Zustands 'Poisoned' und zur Gewährung von Resistenz + Vorteil auf Saves gegen Gift für die Dauer.
// NEU: Logik für Silence: Implementiere den Effekt 'SILENCE_AURA'. Dieser muss dynamisch das Wirken von Zaubern mit verbalen Komponenten blockieren und Kreaturen innerhalb des 6m-Radius Immunität gegen Donnerschaden gewähren.
// NEU: Logik für Spiritual Weapon: Korrigiere die Skalierung des Schadens auf '+1W8 pro Zaubergrad über 2' und implementiere die Logik, die den Initialangriff beim Wirken auslöst.
// NEU: Logik für Warding Bond: Implementiere die Condition 'WARDING_BOND_LINK'. Der Schadens-Handler muss bei Schaden am Ziel den Caster (linked ID) identifizieren und dieselbe Schadensmenge zufügen. Die Condition muss bei Trennung (> 18m) enden.
// NEU: Logik für Zone of Truth: Implementiere den Hazard-Trigger 'CHARISMA_SAVE_ON_ENTRY_OR_START_TURN'. Der Caster muss über den Erfolg/Misserfolg des CH-Rettungswurfs (SG) informiert werden.
// NEU: Logik für Create Food and Water: Implementiere den Effekt-Typ 'CREATE_RESOURCES'. Dies ist eine Logik-Funktion außerhalb des Kampfrasters, die die Ressourcenzähler aktualisiert.
// NEU: Logik für Daylight: Implementiere den Lichteffekt 'ADD_LIGHT_SOURCE' mit dem Flag 'is_sunlight: true' (relevant für Kreaturenempfindlichkeiten). Implementiere den Effekt 'DISPEL_MAGIC_EFFECTS' zum Bannen von Dunkelheitszaubern (Grad <= 3).
// NEU: Logik für Mass Healing Word: Korrigiere die Heilungsberechnung auf '2W4 + Mod' und wende sie auf bis zu 6 Ziele als Bonusaktion an.
// NEU: Logik für Meld Into Stone: Implementiere die Condition 'MELDED_INTO_STONE'. Diese muss Unauffindbarkeit (nicht-magisch) und den Nachteil auf Hör-Checks gewähren. Der Schadens-Handler muss die Logik zur sofortigen Ausweisung (mit 6W6 oder 50 Kraftschaden und Zustand 'Prone') bei Zerstörung des Steins hinzufügen.
// NEU: Logik für Revivify: Implementiere den Heilungs-/Wiederbelebungs-Effekt mit der Bedingung, dass das Ziel innerhalb der letzten Minute gestorben ist.
// NEU: Logik für Speak with Dead: Implementiere den Effekt 'SPEAK_WITH_DEAD'. Stelle sicher, dass der Zauber bei Leichen von Untoten fehlschlägt und die Antwort des NSC von seiner (potenziellen) Feindseligkeit abhängt.
// NEU: Logik für Spirit Guardians: Implementiere den komplexen Hazard-Trigger 'DAMAGE_ON_ENTRY_START_END_TURN' (Schaden bei Eintritt/Zugbeginn/Zugende, max. 1x pro Zug). Füge die Geschwindigkeitsreduktion (Speed 50%) und die Schadensart (Gleißend/Nekrotisch) hinzu.
// NEU: Logik für Death Ward: Implementiere die Condition 'DEATH_WARD', die den Ziel-HP-Wert (im takeDamage-Handler) beim ersten Abfall auf 0 auf 1 setzt und sofortige Tötungseffekte negiert.
// NEU: Logik für Divination: Implementiere den Effekt 'DIVINATION_OMEN' mit dem 7-Tage-Zeitlimit und der kumulativen Fehlschlagchance von 25% bei wiederholtem Wirken vor einer Langen Rast.
// NEU: Logik für Freedom of Movement: Implementiere die Condition 'FREEDOM_OF_MOVEMENT'. Diese muss 1. die Immunität gegen magische Speed-Reduzierung/Paralyzed/Restrained gewähren und 2. die Nutzung von 5 Fuß Bewegung für das automatische Entkommen aus nicht-magischen Grapples/Restraints ermöglichen.
// NEU: Logik für Guardian of Faith: Implementiere den Effekt 'SUMMON_HAZARD' mit 'damage_dealt_limit' und 'damage_dealt_limit_scaling' zur Verfolgung des verursachten Gesamtschadens, nach dem der Token despawnt. Nutze 'DAMAGE_ON_ENTRY_OR_START_TURN' als Trigger.
// NEU: Logik für Commune: Implementiere den Effekt 'DIVINATION_OMEN' mit 'question_limit' (3) und der kumulativen 25%-Fehlschlagchance (für Wiederholungen vor einer LR).
// NEU: Logik für Contagion: Implementiere den Effekt 'CONTAGION_DISEASE'. Dies erfordert einen Mechanismus, der 3 Erfolge/Fehlschläge beim KON-RW am Zugende verfolgt. Füge die Option zur Auswahl des Attributs hinzu, das während des Zustands 'Vergiftet' Nachteil auf Saves erhält.
// NEU: Logik für Dispel Evil and Good: Implementiere die Condition 'DISPEL_EVIL_GOOD_AURA' (+Nachteil auf Angriffe von 5 Typen) und die zwei 'Magic Actions' (Break Enchantment/Dismissal) zur Banisierung von Kreaturen der betroffenen Typen.
// NEU: Logik für Flame Strike: Korrigiere den Schaden auf zwei separate Einträge (5W6 Feuer + 5W6 Gleißend) und implementiere die duale Skalierung für beide Schadensarten (+1W6 pro Slot > 5).
// NEU: Logik für Greater Restoration: Implementiere den Effekt 'GREATER_RESTORATION_CLEANSE', der gezielt einen von sechs schweren Debuff-Typen vom Ziel entfernt.
// NEU: Logik für Hallow: Implementiere den Effekt 'SUMMON_PERMANENT_AURA'. Dies muss eine persistente (Until dispelled) Aura erstellen, die die Bewegungsfreiheit bestimmter Kreaturentypen blockiert und die Befreiung/Unterdrückung von Charmed/Frightened/Possession auslöst.
// NEU: Logik für Insect Plague: Implementiere den Hazard-Trigger 'DAMAGE_ON_ENTRY_OR_END_TURN' für den Summon. Die Logik muss korrekt mit der leichten Sichtbehinderung ('LIGHTLY_OBSCURED') und dem schwierigen Gelände ('difficult_terrain') im Bereich interagieren.
// NEU: Logik für Mass Cure Wounds: Implementiere die Logik zur Heilung von bis zu 6 Zielen innerhalb einer 9m-Radius-Sphäre mit der Heilformel (5W8 + Mod) und der korrekten Skalierung.
// NEU: Logik für Raise Dead: Implementiere die Condition 'RESURRECTION_WEAKNESS' (-4 Malus auf alle W20-Würfe) mit der Logik zum Abbau der Strafe um 1 nach jeder Langen Rast.
// NEU: Logik für Blade Barrier: Implementiere den Hazard-Trigger 'DAMAGE_ON_ENTRY_OR_START_TURN' (max. 1x/Zug) für das Summon. Füge die Gelände- und Deckungseigenschaften (Difficult Terrain, Three-Quarters Cover) zum Token hinzu.
// NEU: Logik für Find the Path: Implementiere den sehr langen Konzentrations-Effekt (1 Tag). Die Logik muss die Zielwahl und die Einschränkung auf physische Wege ('most direct physical route') beachten.
// NEU: Logik für Forbiddance: Implementiere den Effekt 'SUMMON_FORBIDDANCE_AURA'. Dieser muss die Blockade von Teleportation/Ebenenreise und den Flächenschaden (5W10 Nekrotik/Gleißend) für spezifische Kreaturentypen innerhalb des gewählten Bereichs verwalten.
// NEU: Logik für Harm: Implementiere den Effekt 'DAMAGE_AND_MAX_HP_REDUCTION'. Der Schadens-Handler muss den erlittenen Nekrotikschaden verfolgen und den 'maxHp'-Wert des Ziels entsprechend reduzieren (Limit: maxHp >= 1).
// NEU: Logik für Heal: Implementiere die Logik zur Anwendung der hohen Flat-Healing-Zahl (70 + 10 pro Grad) und zur gleichzeitigen Entfernung der Zustände 'Blinded', 'Deafened' und 'Poisoned'.
// NEU: Logik für Heroes' Feast: Implementiere den Effekt 'max_hp_and_current_hp' für die Erhöhung der TP und die permanente Condition 'HEROES_FEAST_BUFF' (Immunitäten/Resistenz).
// NEU: Logik für Planar Ally: Implementiere den Effekt 'SUMMON_OUTSIDER_FOR_SERVICE' als DM-prompt/Logik, um die Verhandlungen und die Loyalität/Kosten der beschworenen Kreatur zu simulieren.
// NEU: Logik für Word of Recall: Implementiere den Effekt 'TELEPORT_TO_SANCTUARY', der den Caster und bis zu 5 Ziele zu einem vordefinierten Ort teleportiert. Füge eine 'Preparation Requirement' Logik hinzu.
// NEU: Logik für Conjure Celestial: Implementiere den Hazard 'DUAL_EFFECT_ON_CONTACT' mit flexibler Auswahl zwischen Heilung (4W12+Mod) und Schaden (6W12 Radiant) pro Kreatur (max. 1x/Zug) und skalierbarer Bewegung des Zylinders (9m/Zug).
// NEU: Logik für Divine Word: Implementiere den Effekt 'HP_CONDITIONAL_DEBUFF'. Der Schadens-Handler muss die HP des Ziels prüfen, um den passenden Zustand (Tod, Stunned/Blinded/Deafened) aus der Tabelle zuzuweisen. Füge die Logik zur sofortigen Banisierung von extraplanaren Kreaturen hinzu.
// NEU: Logik für Fire Storm: Implementiere den Flächeneffekt 'CONCATENATED_CUBES', der es erlaubt, bis zu 10x 3m-Würfel zu einem beliebigen, zusammenhängenden Muster zu formen.
// NEU: Logik für Regenerate: Implementiere die Condition 'REGENERATING'. Diese muss beim Heilungs-Handler 1 TP am Zugbeginn hinzufügen und die Nachwachs-Logik ('restores_limbs') tracken (kein Kampfeffekt).
// NEU: Logik für Resurrection: Implementiere den Effekt 'HEALING' mit 'MAX_HP' als Schadenswürfel (volle Heilung). Implementiere die Condition 'RESURRECTION_WEAKNESS' (-4 Malus, der sich pro Langer Rast reduziert) und die 'restores_limbs: true' Flag.
// NEU: Logik für Earthquake: Implementiere den Hazard-Trigger 'DAMAGE_AND_DEBUFF_ON_START_TURN' zur Anwendung von 'Prone' und Konzentrationsbruch. Füge die Logik 'STRUCTURAL_COLLAPSE_LOGIC' hinzu, um 50 Bludgeoning Schaden auf Strukturen anzuwenden und bei Zerstörung 12W6 Schaden auf Kreaturen zu verursachen (mit Rettungswurf).
// NEU: Logik für Holy Aura: Implementiere die Condition 'HOLY_AURA_BUFF' (+Vorteil auf Saves, Nachteil auf Angriffe gegen Verbündete). Füge den 'on_hit_melee_save' Trigger hinzu, um angreifende Unholde/Untote zum KO-Save gegen 'Blinded' zu zwingen.
// NEU: Logik für Mass Heal: Implementiere den Effekt-Typ 'MASS_HEALING', der einen festen TP-Pool (700) auf ausgewählte Ziele verteilt und gleichzeitig die Zustände 'Blinded', 'Deafened' und 'Poisoned' entfernt.
// NEU: Logik für True Resurrection: Implementiere den Effekt-Typ 'TRUE_RESURRECTION', der die maximale Wiederbelebung (volle TP, Wiederherstellung von Körperteilen, Entfernung aller Zustände/Flüche/Gifte) ermöglicht.
// NEU: Logik für Produce Flame: Implementiere die Logik, bei der der Bonusaktion-Cast einen Licht-Buff appliziert ('ADD_LIGHT_SOURCE'), der dann mit einer Hauptaktion (RECAST_ACTION: ACTION) als Fernkampf-Zauberangriff geworfen werden kann.
// NEU: Logik für Druidcraft: Erstelle einen Platzhalter für die 'UTILITY_EFFECT_CHOICE' Logik, um nicht-kampfbezogene Aktionen (Wetter, Blumen, Sensorik) im Interface zu verwalten.
// NEU: Logik für Shillelagh: Implementiere die Condition 'SHILLELAGH_WEAPON_BUFF' zur dynamischen Änderung des Waffenangriffs (nutzt Zauberattribut, ändert den Schadenswürfel und erlaubt Kraftschaden-Auswahl).
// NEU: Logik für Thorn Whip: Implementiere den Effekt 'PULL' mit der Größenbeschränkung ('filter_size_max: "LARGE"') im Nahkampf-Zauberangriff.
// NEU: Logik für Animal Friendship: Implementiere die Condition 'CHARMED' mit der spezifischen Endbedingung 'ends_on_damage_by_caster_or_ally: true'.
// NEU: Logik für Entangle: Implementiere den Hazard 'RESTRAIN_ON_CAST_AND_ENTRY' mit der Logik, die es dem Ziel erlaubt, als Aktion einen ST(Athletics) Check gegen den Zauber-SG zu machen, um den Zustand 'Restrained' zu beenden.
// NEU: Logik für Faerie Fire: Implementiere die Condition 'FAERIE_FIRE_OUTLINE'. Diese muss 1. 'Advantage' auf Angriffe gegen das Ziel hinzufügen und 2. sicherstellen, dass das Ziel nicht von der Condition 'INVISIBLE' profitieren kann.
// NEU: Logik für Goodberry: Implementiere den Effekt 'SUMMON_ITEM'. Dies muss sicherstellen, dass der Gegenstand 'Gute Beere' nur über eine Bonusaktion verzehrt werden kann und genau 1 HP heilt.
// NEU: Logik für Shillelagh: Implementiere die Condition 'SHILLELAGH_WEAPON_BUFF' zur dynamischen Änderung des Waffenangriffs (nutzt Zauberattribut, ändert den Schadenswürfel und erlaubt Kraftschaden-Auswahl).
// NEU: Logik für Thorn Whip: Implementiere den Effekt 'PULL' mit der Größenbeschränkung ('filter_size_max: "LARGE"') im Nahkampf-Zauberangriff.
// NEU: Logik für Barkskin: Implementiere die Condition 'BARKSKIN_AC_BUFF', die den RK-Wert des Ziels auf mindestens 17 setzt, falls er niedriger ist.
// NEU: Logik für Beast Sense: Implementiere den Effekt 'BEAST_SENSE_LINK', der die gemeinsame Wahrnehmung mit einem Tier ermöglicht.
// NEU: Logik für Flame Blade: Implementiere den kombinierten Effekt (Lichtquelle + Nahkampf-Zauberangriff mit Skalierung) in einer Bonusaktion.
// NEU: Logik für Heat Metal: Implementiere den Effekt 'DAMAGE_OVER_TIME' mit 'tick_action: BONUS_ACTION'. Die Logik muss den KO-Rettungswurf mit dem resultierenden 'drop object/disadvantage on attacks/checks' Debuff verknüpfen.
// NEU: Logik für Moonbeam: Implementiere den Hazard 'DAMAGE_AND_DEBUFF_ON_CONTACT'. Dieser muss den KO-RW bei Kontakt und Zugende auslösen und bei Fehlschlag den Effekt 'REVERT_SHAPECHANGE' (z.B. Polymorph/Wild Shape beenden) anwenden.
// NEU: Logik für Moonbeam (Bewegung): Füge die Logik hinzu, die es dem Caster erlaubt, den Moonbeam-Token als 'Magic Action' 18m zu bewegen.
// NEU: Logik für Pass Without Trace: Implementiere die Condition 'PASS_WITHOUT_TRACE' zur Anwendung des "+10 Bonus auf Geschicklichkeit (Heimlichkeit) Würfe" auf alle Verbündeten in der 9m-Aura.
// NEU: Logik für Spike Growth: Implementiere den Hazard-Trigger 'DAMAGE_PER_MOVEMENT'. Dieser muss die Bewegung des Tokens im Bereich um 1.5m verfolgen und die entsprechende 2W4 Schaden anwenden. Füge den 'Perception/Survival'-Check hinzu, um die Gefahr zu erkennen.
// NEU: Logik für Call Lightning: Implementiere die 'RECAST_ACTION: MAGIC_ACTION' zum wiederholten Blitzeinschlag. Füge eine Logik hinzu, die den zusätzlichen 1d10 Schaden im Falle eines externen Sturms (Szenario-abhängig) anwendet.
// NEU: Logik für Plant Growth: Implementiere den Hazard 'OVERGROWTH_HAZARD' (Bewegungskosten 4x). Füge die Logik 'ENRICHMENT_BUFF' hinzu, um die langanhaltenden (365 Tage) Ressourcen-Multiplikatoren zu verfolgen (Out-of-Combat).
// NEU: Logik für Speak with Plants: Implementiere den Effekt 'TERRAIN_TOGGLE'. Dies ermöglicht das Umschalten des Status von pflanzenbasiertem schwierigem Gelände in normales Gelände (und umgekehrt) im Zielbereich.
// NEU: Logik für Wind Wall: Implementiere den Hazard-Trigger 'DAMAGE_ON_ENTRY_OR_START_TURN' mit dem Zusatz 'projectile_deflection' (automatisch Fehlschlag für normale Geschosse). Füge die Logik zur Blockade von Gasen/Rauch und kleinen fliegenden Kreaturen hinzu.
// NEU: Logik für Conjure Woodland Beings: Implementiere die Condition 'CWLB_EMANATION_BUFF', die es dem Caster erlaubt, die Aktion 'Disengage' (Rückzug) als Bonusaktion auszuführen.
// NEU: Logik für Dominate Beast: Implementiere die Duration-Skalierung 'DURATION_BY_SLOT' für 4. Grad Zauber (5/6/7+ Slot-Level) sowie die 'advantage_if_fighting' Logik für den Rettungswurf.
// NEU: Logik für Giant Insect: Implementiere das komplexe Summon-Scaling 'stat_block_scaling'. Die Engine muss den AC, HP, Angriffsbonus und die Anzahl der Multiattacks basierend auf dem Zaubergrad des Zaubers berechnen.
// NEU: Logik für Grasping Vine: Implementiere den Effekt 'BONUS_ACTION_ATTACK_WITH_GRAPPLE' für ein Summon-Token. Muss die Logik für 'PULL' (9m) und 'Grappled' (max. Größe Huge, skalierbare Kapazität) auf einem erfolgreichen Nahkampf-Zauberangriff bündeln.
// NEU: Logik für Antilife Shell: Implementiere die Condition 'ANTILIFE_SHELL_AURA'. Diese muss die physische Bewegung/Reichweite für Nicht-Konstrukte/Untote in den 3m-Radius blockieren und den Zauber sofort beenden, wenn der Caster absichtlich eine Kreatur durch die Barriere drängt.
// NEU: Logik für Awaken: Implementiere den Effekt 'AWAKEN_STATUS_CHANGE'. Diese Logik muss die permanenten Änderungen der Werte (INT 10, Sprache) für das Zielobjekt/die Kreatur sowie die 30-tägige 'CHARMED' Condition anwenden.
// NEU: Logik für Commune with Nature: Implementiere den Effekt 'UTILITY_DIVINATION_QUERY' mit den zwei Reichweiten-Modi (8km / 90m) und der Abfrage von drei spezifischen Fakten (Portals, HG 10+ Kreatur, Ressourcen).
// NEU: Logik für Reincarnate: Implementiere den Effekt 'REVIVE_AND_REINCARNATE'. Dies muss die Wiederbelebung mit sofortiger, zufälliger Rassenänderung (im Wesentlichen das Zurücksetzen des Rassen-Statblocks des Tokens) auslösen.
// NEU: Logik für Tree Stride: Implementiere die Condition 'TREE_STRIDING'. Dies muss eine einmalige Pro-Zug-Teleportation (bis 150m) zwischen Baum-Tokens der gleichen Art ermöglichen und die Kosten von 1.5m Bewegung für das Betreten/Verlassen des Baumes berechnen.
// NEU: Logik für Conjure Fey: Implementiere die Bonusaktion 'Teleport/Attack' für das Summon-Token (Bonusaktion bewegt 9m, dann Nahkampf-Zauberangriff). Füge die Logik hinzu, die 'Frightened' vom Caster und dem Summon als Quelle setzt.
// NEU: Logik für Transport via Plants: Implementiere den Effekt 'SUMMON_LINKED_PLANT_PORTAL'. Dies muss zwei unsichtbare Portale (an Pflanzen) erstellen, die eine bidirektionale Teleportation mit festen Bewegungskosten (1.5m) ermöglichen.
// NEU: Logik für Wall of Thorns: Implementiere den Hazard-Trigger 'DAMAGE_ON_ENTRY_OR_END_TURN' mit der kombinierten Logik: 1. Bewegungs-Multiplikator von 4 (kostet 4ft pro 1ft) und 2. Hiebschaden (7W8) bei Eintritt/Zugende.
// NEU: Logik für Wind Walk: Implementiere die Condition 'WIND_WALK_CLOUD'. Die Engine muss die Resistenz (Physisch) und die eingeschränkten Aktionen (nur Dash / Magic Action zum Verwandeln) verwalten. Füge die 1-minütige Verwandlungslogik (Stunned) hinzu.
// NEU: Logik für Mirage Arcane: Implementiere den Effekt 'SUMMON_ILLUSIONARY_TERRAIN', der die Eigenschaft des Geländes (Difficult Terrain etc.) verändert, aber die Illusion durch 'Truesight' sichtbar lässt (wobei die taktilen/sensorischen Effekte bleiben).
// NEU: Logik für Animal Shapes: Implementiere den Effekt 'MASS_POLYMORPH'. Dies ist eine Massen-Variante von Polymorph mit der Bedingung, dass das Ziel TP und mentale Werte behält. Füge die Endbedingung 'ends_at_zero_temphp' und die Rückverwandlung per 'Bonusaktion' hinzu.
// NEU: Logik für Tsunami: Implementiere den Hazard-Trigger 'TSUNAMI_DYNAMIC_HAZARD'. Dieser muss 1. die Initialschaden-Anwendung, 2. die Bewegung des Tokens (15m weg/Zug) und 3. die rundenweise Reduzierung des Schadens (um 1d10) verwalten.
// NEU: Logik für Storm of Vengeance: Implementiere den Hazard-Trigger 'STORM_OF_VENGEANCE_SEQUENCE'. Dies ist eine rundenbasierte Logik (R1-R5), die jede Runde einen neuen, spezifischen Effekt (verschiedene Schadenstypen, Zustände, Gelände-Debuffs) auslöst.
// NEU: Logik für Blade Ward: Implementiere die Condition 'BLADE_WARD_DEBUFF_ATTACK_ROLL'. Diese muss den Angriffs-Handler dahingehend modifizieren, dass 1W4 von jedem Angriffswurf abgezogen wird, der gegen den Caster gerichtet ist.
// NEU: Logik für Vicious Mockery: Implementiere den kombinierten Effekt (Schaden + Debuff). Die Engine muss 'DISADVANTAGE_NEXT_ATTACK' anwenden, wenn der WE-Save fehlschlägt.
// NEU: Logik für Dissonant Whispers: Implementiere den Effekt 'FORCE_MOVEMENT_ON_FAIL'. Bei Fehlschlag muss die Kreatur ihre Reaktion nutzen, um sich mit maximaler Bewegung (safest route) vom Caster wegzubewegen.
// NEU: Logik für Heroism: Implementiere die Condition 'HEROISM_BUFF', die Immunität gegen 'Frightened' gewährt und zu Beginn jedes Zuges des Ziels Temp HP in Höhe des Caster-Modifikators hinzufügt.
// NEU: Logik für Illusory Script: Implementiere den Hilfs-Effekt 'UTILITY_ILLUSION_TEXT' für nicht-kampfbezogene illusionäre Texte.
// NEU: Logik für Glibness: Implementiere die Condition 'GLIBNESS', die Charisma-Checks mit 15 ersetzt und die Immunität gegen 'Zone of Truth'-ähnliche Effekte gewährt.
// NEU: Logik für Power Word: Heal: Implementiere den Effekt 'REMOVE_CONDITION' für die 5 Zustände und die Heilungs-Logik 'MAX_HP'.
// NEU: Logik für Eldritch Blast: Implementiere die Cantrip-Skalierung 'multi_attack_at_levels', die zusätzliche Strahlen bei Stufe 5, 11 und 17 erzeugt (jeder Strahl ist ein separater Angriff).
// NEU: Logik für Armor of Agathys: Implementiere die Condition 'ARMOR_OF_AGATHYS_COUNTER'. Diese muss den Start-TP-Wert tracken, die 5 Kälteschaden an Nahkampfangreifer zurückspiegeln und den Zauber beenden, wenn die gewährten Temp HP auf 0 fallen.
// NEU: Logik für Arms of Hadar: Implementiere die Condition 'NO_REACTIONS_UNTIL_NEXT_TURN'. Diese muss sicherstellen, dass die betroffenen Kreaturen bis zum Beginn ihres nächsten Zuges keine Reaktionen ausführen können.
// NEU: Logik für Hellish Rebuke: Implementiere die Logik, dass dieser Zauber nur als Reaktion auf Schaden durch eine Kreatur in Reichweite gewirkt werden kann.
// NEU: Logik für Hex: Implementiere die Condition 'HEXED'. Diese muss 1. den Zusatzschaden von 1W6 auf Angriffstreffer des Casters anwenden, 2. den Nachteil auf Attributs-Checks eines gewählten Attributs hinzufügen und 3. die rundenunabhängige Bonusaktion zum Übertragen des Fluches beim Tod des Ziels ermöglichen.
// NEU: Logik für Compelled Duel: Implementiere die Condition 'COMPELLED_DUEL'. Diese muss Nachteil auf Angriffe gegen andere als den Caster erzwingen, die Bewegungsreichweite limitieren (9m) und den Zauber sofort beenden, wenn der Caster/Verbündete gegen die Regeln verstoßen.
// NEU: Logik für Divine Favor: Implementiere die Condition 'DIVINE_FAVOR_BUFF', um den Zusatzschaden von 1W4 (Gleißend) auf Waffenangriffe anzuwenden.
// NEU: Logik für Searing Smite: Implementiere den Effekt 'SEARING_SMITE_DOT'. Dieser muss die sofortige Schadensanwendung, den wiederholten 1W6 Schaden am Zuganfang und den KO-Rettungswurf zur Beendigung des Zaubers verwalten.
// NEU: Logik für Thunderous Smite: Implementiere den kombinierten Effekt 'PUSH' und 'PRONE' nach einem Waffentreffer. Die Logik muss die Größenbeschränkung (Groß oder kleiner) und den ST-Rettungswurf berücksichtigen.
// NEU: Logik für Wrathful Smite: Implementiere die Condition 'FRIGHTENED' mit der Endbedingung 'repeat_end_of_turn: true' nach einem Waffentreffer.
// NEU: Logik für Shining Smite: Implementiere die Condition 'SHINING_SMITE_DEBUFF'. Diese muss 'Advantage' auf Angriffe gegen das Ziel erzwingen, das Ziel beleuchten und die Immunität gegen 'Invisible' aufheben.
// NEU: Logik für Find Steed: Implementiere den komplexen Effekt 'SUMMON_STEED_SCALED'. Die Logik muss die Berechnung der Stats (RK, TP, Schaden) basierend auf dem Zaubergrad sowie die speziellen Bonusaktionen (Heilung, Furcht, Teleport) des Rosses unterstützen.
// NEU: Logik für Aura of Vitality: Implementiere die Logik zur Heilung (2W6 + Skalierung) als einmaligen Effekt beim Wirken ('on_cast_heal') und zur Wiederholung am Zuganfang ('on_turn_start_aura').
// NEU: Logik für Blinding Smite: Implementiere die Kondition 'BLINDED' mit der Endbedingung 'repeat_end_of_turn: true' (KO-Save) nach einem Waffentreffer.
// NEU: Logik für Crusader's Mantle: Implementiere die Condition 'CRUSADERS_MANTLE_BUFF', um den Zusatzschaden von 1W4 (Gleißend) auf Waffenangriffe (Waffe/Unbewaffnet) aller Verbündeten in der 9m-Aura anzuwenden.
// NEU: Logik für Elemental Weapon: Implementiere die Condition 'ELEMENTAL_WEAPON_BUFF' mit 'scaling_stats' zur Anwendung des skalierenden Bonus (+1/+2/+3) auf Angriffs- und Schadenswürfe (1d4/2d4/3d4) basierend auf dem Slot-Level.
// NEU: Logik für Aura of Life: Implementiere den Effekt 'on_turn_start_heal_at_zero' innerhalb der Aura-Logik. Verbündete mit 0 TP im Bereich erhalten zu Beginn ihres Zuges 1 TP zurück (ignoriert max HP Reduktion und Necrotic Resistance).
// NEU: Logik für Aura of Purity: Implementiere den Effekt 'advantage_save_vs_conditions' (Vorteil auf Saves) für die spezifischen 7 Zustände, zusammen mit Resistenz gegen Giftschaden.
// NEU: Logik für Staggering Smite: Implementiere den kombinierten Effekt (Schaden + Debuff) mit der direkten Anwendung von 'STUNNED' bis zum Ende des NÄCHSTEN ZUGES des Casters bei fehlgeschlagenem WE-Save.
// NEU: Logik für Banishing Smite: Implementiere den Effekt 'APPLY_CONDITION_CONDITIONAL' mit dem Vergleich 'LESS_OR_EQUAL_AFTER_DAMAGE'. Die Logik muss den Zustand 'BANISHED_DEMIPLANE' (Handlungsunfähig, entfernt vom Raster) anwenden, wenn die TP nach dem Schaden <= 50 sind.
// NEU: Logik für Circle of Power: Implementiere die Condition 'CIRCLE_OF_POWER_BUFF'. Diese muss den 'Advantage' auf Saves gegen Zauber/Magie sowie die Mechanik 'half_damage_to_zero' (kein Schaden bei erfolgreichem Save) anwenden.
// NEU: Logik für Destructive Wave: Implementiere die Logik zur Anwendung von zwei Schadensarten (5W6 Thunder + 5W6 Radiant/Necrotic) mit nur einem KO-Rettungswurf, der bei Fehlschlag auch den Zustand 'Prone' anwendet.
// NEU: Logik für Ensnaring Strike: Implementiere die Condition 'RESTRAINED_DOT_ES' mit der Logik: 1. ST-Save mit 'advantage_if_size: "LARGE_OR_GREATER"'. 2. 1W6 Stichschaden (DoT, skalierend) am Zuganfang. 3. Beendigung durch ST(Athletics)-Check als Aktion.
// NEU: Logik für Hail of Thorns: Implementiere den Effekt 'DAMAGE_ON_HIT_AOE', der nach einem erfolgreichen Fernkampftreffer einen separaten Flächenschaden (1W10 Piercing mit GE-Save) auf das Ziel und Kreaturen in 1.5m auslöst.
// NEU: Logik für Hunter's Mark: Implementiere die Condition 'HUNTERS_MARK_BUFF'. Diese muss 1. den 1W6 Kraftschaden auf Angriffstreffer des Casters anwenden, 2. den Vorteil auf WE(Wahrnehmung/Überleben) zum Aufspüren gewähren und 3. die Transfer-Logik (Bonusaktion bei 0 TP des Ziels) ermöglichen.
// NEU: Logik für Cordon of Arrows: Implementiere den Hazard-Trigger 'DAMAGE_ON_ENTRY_OR_END_TURN_AMMO'. Dieser muss die Anzahl der Munition verfolgen, diese bei erfolgreicher Auslösung reduzieren und bei Verbrauch der Munition das Hazard-Token entfernen.
// NEU: Logik für Conjure Barrage: Implementiere den Cone-Schadens-Effekt mit der Schadensart 'Force' und der Option, nur Kreaturen der eigenen Wahl ('filter: "CREATURE_OF_CHOICE"') zu treffen.
// NEU: Logik für Lightning Arrow: Implementiere den Effekt 'DAMAGE_OVERWRITE_AND_AOE'. Der Schadens-Handler muss den Schaden basierend auf Hit/Miss berechnen und den sekundären GE-RW-Flächenschaden um das Ziel herum auslösen.
// NEU: Logik für Conjure Volley: Implementiere die Flächenziel-Filterung 'filter: "CREATURE_OF_CHOICE"' für Kegel/Zylinder-Effekte.
// NEU: Logik für Swift Quiver: Implementiere die Condition 'SWIFT_QUIVER_BUFF', die den Caster (Ranger) dazu befähigt, als Bonusaktion zwei zusätzliche Waffenangriffe auszuführen.
// NEU: Logik für Arcane Vigor: Implementiere den Effekt 'HEALING_USE_HIT_DICE'. Der Heilungs-Handler muss den Caster nach der zu verwendenden Trefferwürfelgröße fragen, die Würfel aus dem Inventar/den Ressourcen verbrauchen und die entsprechende Heilung anwenden.
// NEU: Logik für Charm Monster: Implementiere die Condition 'CHARMED' mit der Logik 'advantage_if_fighting' für den WE-RW und der Endbedingung 'ends_on_damage_by_caster_or_ally: true'.
// NEU: Logik für Conjure Animals: Implementiere den Hazard 'DAMAGE_ON_ENTRY_OR_END_TURN_ONCE' für das Rudel (max. 1x/Zug). Füge die 'utility_aura_buff' Logik hinzu, um Verbündeten in 1.5m Nähe Vorteil auf ST-Saves zu gewähren.
// NEU: Logik für Contagion: Implementiere den Effekt 'DAMAGE_AND_DEBUFF'. Das Ziel macht einen KO-Save bei Berührung. Fehlschlag: 1W8 Nekrotikschaden und der Zustand 'Vergiftet' wird angewendet. Die Logik muss die progressive Save-Regel (3 Erfolge/Fehlschläge) und die 'Heilungsresistenz' des Vergiftet-Zustands ('poison_condition_persistence_check') implementieren.
// NEU: Logik für Divine Smite: Implementiere den Effekt 'DAMAGE_ON_HIT' mit 'bonus_damage_if_type'. Der Schadens-Handler muss prüfen, ob das Ziel 'Fiend' oder 'Undead' ist, um den zusätzlichen 1W8 gleißenden Schaden hinzuzufügen.
// NEU: Logik für Dragon's Breath: Implementiere den Effekt 'RECAST_ACTION' mit 'action_type: MAGIC_ACTION' auf dem *Ziel*. Die Logik muss die Auswahl der Schadensart ('variable') und den Kegel-Schadens-Effekt (3d6, skalierend) beim Ausführen der Magischen Aktion ermöglichen.
// NEU: Logik für Elementalism: Implementiere den Effekt 'UTILITY_ELEMENTAL_CONTROL'. Die Logik muss die einfachen Interaktionen (z.B. Türen schließen, Feuer entfachen) im 1.5m-Würfel verwalten.
// NEU: Logik für Enthrall: Implementiere die Condition 'ENTHRALLED'. Diese muss einen WE-Save automatisch bestehen lassen (oder den Effekt negieren), wenn der Zauberer/Verbündete das Ziel bekämpft. Wende den Debuff von -10 auf WE(Perception) Checks und Passive Perception an.
// NEU: Logik für Evard's Black Tentacles: Implementiere den Hazard-Trigger 'DAMAGE_AND_RESTRAIN_ON_CONTACT'. Dieser muss 3W6 Wuchtschaden + Restrained anwenden und die Entfesselungs-Aktion (ST(Athletics) gegen SG) ermöglichen.
// NEU: Logik für Fountain of Moonlight: Implementiere die Condition 'FOUNTAIN_OF_MOONLIGHT' (Resistenz Radiant, +2W6 Radiant auf Nahkampf). Implementiere den Reaction-Trigger 'REACTION_BLIND_ON_DAMAGE' zur KO-Save-Prüfung gegen 'Blinded' nach erlittenem Schaden.
// NEU: Logik für Friends Cantrip: Implementiere die Condition 'FRIENDS_CHARM'. Diese muss die Logik 'auto_succeed_if' (Non-Humanoid, Fighting, Recent Cast) und die komplexe Endbedingung 'ends_on_hostile_action' (endet bei Angriff/Schaden/erzwungenem Save) implementieren.
// NEU: Logik für Hunger of Hadar: Implementiere den Hazard-Trigger 'DAMAGE_OVER_TIME_DUAL'. Dieser muss 2W6 Cold (Zugstart, Auto-Hit) und 2W6 Acid (Zugende, DEX-Save) anwenden und die rundenbasierte Logik für Blinded/Difficult Terrain implementieren.
// NEU: Logik für Ice Knife: Implementiere den Effekt 'DAMAGE_OVERWRITE_AND_AOE' mit 'secondary_aoe_on_hit'. Der Schadens-Handler muss nach dem Primärschaden (1d10 Piercing) den sekundären AoE-Schaden (2d6 Cold, skalierend) auslösen.
// NEU: Logik für Jallarzi's Storm of Radiance: Implementiere den Hazard 'DAMAGE_AND_DEBUFF_ON_CONTACT' für zwei Schadensarten (Radiant/Thunder). Füge den 'debuff_conditions' Array hinzu, um Blinded, Deafened und NO_VERBAL_CASTING bei Kontakt anzuwenden.
// NEU: Logik für Mind Sliver: Implementiere den Effekt 'DEBUFF_NEXT_SAVE' (zieht 1W4 vom nächsten Rettungswurf ab) und den initialen IN-Save.
// NEU: Logik für Mind Spike: Implementiere den Zustand 'PSIONIC_TRACKING'. Dieser muss die Sichtlinie zu Zielen (trotz Unsichtbarkeit/Verstecken) bei fehlgeschlagenem WE-Save aufrechterhalten.
// NEU: Logik für Power Word: Fortify: Implementiere den Effekt 'HEALING_POOL'. Die Logik muss die Verteilung eines festen TP-Pools (120 Temp HP) auf bis zu 6 ausgewählte Ziele ermöglichen.
// NEU: Logik für Ray of Sickness: Implementiere die Schadensanwendung (2d8) und die Bedingung 'POISONED' für 2 Runden bei einem erfolgreichen Treffer.
// NEU: Logik für Sorcerous Burst: Implementiere die 'critical_surge' Logik, die zusätzliche 1d8-Schadenswürfel (maximal Modifikator des Zauberattributs) gewährt, wenn der Basis-W8-Würfel eine 8 ist.
// NEU: Logik für Spare the Dying: Implementiere den Effekt 'STABILIZE_CREATURE' (setzt Ziel auf stabil) und die Cantrip-Skalierung 'range_multiplier_at_levels' für die Reichweite.
// NEU: Logik für Starry Wisp: Implementiere die Condition 'EMITS_DIM_LIGHT_NO_INVISIBILITY'. Diese muss den Licht-Effekt (3m dämmrig) und die Immunität gegen 'Invisible' für 2 Runden bei einem Treffer anwenden.
// NEU: Logik für Steel Wind Strike: Implementiere den Effekt 'MULTI_ATTACK_TELEPORT'. Die Logik muss 5 separate Nahkampf-Zauberangriffe ausführen und den Caster danach zu einem Ziel teleportieren.
// NEU: Logik für Summon Aberration: Implementiere das komplexe Summon-Scaling 'SUMMON_SCALED_SPIRIT'. Die Engine muss den AC, HP und die Angriffe des beschworenen Geistes basierend auf dem Zaubergrad berechnen.
// NEU: Logik für Summon Scaled Spirits: Implementiere den Effekt-Typ 'SUMMON_SCALED_SPIRIT'. 
//      Diese Logik muss die Werte des beschworenen Tokens (AC, HP, Multiattack-Count) basierend auf dem 'spell_level' dynamisch berechnen.
// NEU: Logik für Form-Abhängige Fähigkeiten: Füge dem Summon-Handler die Logik hinzu, um Form-spezifische Traits/Buffs (z.B. Flyby, Pack Tactics, Heated Body, Stony Lethargy, Healing Touch, Berserk Lashing) basierend auf der gewählten Form anzuwenden.
// NEU: Logik für Summon Beast: Implementiere die Logik zur Bestimmung der HP (20 vs 30) und der Bewegungsraten (Climb/Fly/Swim) basierend auf der gewählten Umgebung (Air/Land/Water).
// NEU: Logik für Summon Celestial: Implementiere die Logik zur Bestimmung der RK (Avenger vs Defender) und der Form-abhängigen Aktionen (Radiant Bow/Mace, Healing Touch).
// NEU: Logik für Summon Construct: Implementiere die Logik zur Bestimmung der Sonderfertigkeiten und Reaktionen (Heated Body/Stony Lethargy/Berserk Lashing) basierend auf dem gewählten Material.
// NEU: Logik für Summon Scaled Spirits: Implementiere den Effekt-Typ 'SUMMON_SCALED_SPIRIT'. 
//      Diese Logik muss die Werte des beschworenen Tokens (AC, HP, Multiattack-Count) basierend auf dem 'spell_level' dynamisch berechnen.
// NEU: Logik für Summon Elemental: Implementiere die Logik zur Bestimmung der Resistenz/Immunität, Bewegungsraten (Burrow/Fly/Swim) und Schadenstypen (Bludgeoning/Cold/Lightning/Fire) basierend auf dem gewählten Element.
// NEU: Logik für Summon Fey: Implementiere die Form-abhängigen Bonusaktionen (Vorteil auf Angriff, Charmed, Darkness) für die Stimmungen Fuming, Mirthful und Tricksy.
// NEU: Logik für Summon Dragon: Implementiere die Logik für die Atemwaffe (Breath Weapon) und den Trait 'Shared Resistances' (Caster erhält eine Resistenz des Drachen).
// NEU: Logik für Summon Fiend: Implementiere 'Death Throes' (2d6 + SL Fire-Schaden-Explosion bei 0 TP) für den Demon-Typ und 'Teleport' für den Yugoloth (Bonusaktion-Teleport nach Angriff).
// NEU: Logik für Summon Undead: Implementiere 'Festering Aura' (5ft KO-Save oder Poisoned) für Putrid und 'Incorporeal Passage' (durch Objekte/Kreaturen, mit Force-Schaden bei Beenden des Zuges im Objekt) für Ghostly.
// NEU: Logik für Synaptic Static: Implementiere die Condition 'MUDDLED_THOUGHTS'. Wende den Debuff von -1d6 auf Attack Rolls, Ability Checks und Konzentrations-Saves an, mit wiederholtem IN-Save zum Ende des Effekts.
// NEU: Logik für Tasha's Bubbling Cauldron: Implementiere den Effekt 'SUMMON_CAULDRON' mit der Logik der Potion-Produktion (Anzahl = Spell Mod, Bonusaktion zur Entnahme).
// NEU: Logik für Thunderclap: Implementiere den sehr kleinen Flächenschaden (1.5m Radius von Selbst) mit KO-Rettungswurf.
// NEU: Logik für Toll the Dead: Implementiere die Logik für 'conditional_damage_dice' zur rundenbasierten Prüfung, ob das Ziel TP fehlen, um 1W12 Schaden anstelle von 1W8 zu verursachen.
// NEU: Logik für Vitriolic Sphere: Implementiere die Logik zur Anwendung des initialen Schadens (10d4) mit der Condition 'ACID_BURN_DOT' (5d4 am Zugende). Füge die 'half_only' Logik hinzu (Erfolg = nur halber Initialschaden).
// NEU: Logik für Word of Radiance: Implementiere den Flächenziel-Filter 'filter: "CREATURE_OF_CHOICE"' für Emanation-Effekte.
// NEU: Logik für Yolande's Regal Presence: Implementiere den Hazard-Trigger 'DAMAGE_AND_DEBUFF_ON_CONTACT_ONCE_PER_TURN'. Dieser muss Schaden (4W6 Psycho), den Zustand 'Prone' und den 'PUSH' (3m Wegstoßen) bündeln.


import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier, calculateSpellAttackBonus, calculateSpellSaveDC, getProficiencyBonus } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';
import { 
  applyCondition, 
  hasCondition, 
  resolveDamage, 
  applyTempHp, 
  tickConditions,
  CONDITION_TYPES 
} from '../engine/combat/conditionManager';
import { getAffectedTiles, getDistance } from '../engine/combat/geometry';
import { calculateForcedMovement, isValidTeleport } from '../engine/combat/movementEffects';
import { checkHazardInteractions } from '../engine/combat/hazardManager';
import { processSpecialEffect } from '../engine/combat/specialEffectManager';

// --- HELPER FUNCTIONS ---
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
      initiative: playerInit, x: 2, y: 4, speed: 6, color: 'blue', icon: playerCharacter.icon,
      activeConditions: [],
      tempHp: 0
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
            color: 'red', x: 9, y: 3 + i,
            activeConditions: [],
            tempHp: 0
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

  // --- PERFORM ACTION (MIT SUMMON SUPPORT & CONDITIONS) ---
  // --- PERFORM ACTION (MÄCHTIGE VERSION) ---
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
      // Wir speichern hier das komplette aktualisierte Combatant-Objekt
      const combatantUpdates = {}; 
      const newCombatantsToAdd = []; 

      console.log(`⚡ ACTION: ${attacker.name} uses ${action.name}`);

      // ---------------------------------------------------------
      // FALL A: ZAUBER & EFFEKTE
      // ---------------------------------------------------------
      if (action.effects && action.effects.length > 0) {
          action.effects.forEach(effect => {
              
              // 1. BESCHWÖRUNG (SUMMON & HAZARDS)
              if (effect.type === 'SUMMON' && targetCoords) {
                  const entity = effect.entity;
                  const newId = `summon_${Date.now()}_${Math.floor(Math.random()*1000)}`;
                  const isHazard = entity.type === 'hazard';

                  newCombatantsToAdd.push({
                      id: newId,
                      name: entity.name || "Beschwörung",
                      type: entity.type || 'ally',
                      hp: entity.hp || 10,
                      maxHp: entity.maxHp || 10,
                      ac: entity.ac || 10,
                      speed: entity.speed || 0,
                      x: targetCoords.x,
                      y: targetCoords.y,
                      icon: entity.icon || 'src/assets/react.svg',
                      controlledBy: attacker.id,
                      actions: entity.actions || [],
                      initiative: attacker.initiative - 0.1,
                      activeConditions: [],
                      tempHp: 0,
                      hazardProfile: isHazard ? entity.hazard_profile : null,
                      isPassable: isHazard 
                  });

                  logEntries.push(`✨ ${attacker.name} erschafft ${entity.name}.`);
              }

              // 2. SCHADEN, HEILUNG, TEMP_HP, CONDITIONS & SPECIALS
              else if ((effect.type === "DAMAGE" || effect.type === "HEALING" || effect.type === "TEMP_HP" || effect.type === "APPLY_CONDITION" || effect.type === "DISINTEGRATE" || effect.type === "INSTANT_KILL_CONDITIONAL" || effect.type === "BANISH") && targets.length > 0) {
                  
                  // Würfel-Logik
                  let diceString = effect.damage?.dice || "1d4";
                  if (effect.scaling && effect.scaling.type === "CANTRIP" && attacker.type === 'player') {
                      const scaled = getCantripDice(playerCharacter.level, effect.scaling);
                      if (scaled) diceString = scaled;
                  }

                  let baseRollVal = 0;
                  if (effect.type !== 'APPLY_CONDITION' && effect.type !== 'BANISH') {
                      baseRollVal = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                      if (effect.add_modifier && attacker.type === 'player') {
                          baseRollVal += calculateSpellAttackBonus(playerCharacter) - getProficiencyBonus(playerCharacter.level); 
                      }
                  }

                  const typeKey = effect.damage?.type?.toLowerCase() || "force";
                  const dmgTypeDE = damageTypeMap[typeKey] || typeKey;

                  // Auf alle Ziele anwenden
                  targets.forEach(target => {
                      let hitSuccess = false;
                      let isCritical = false;
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
                              if (isCritical && effect.type === 'DAMAGE') finalDamage += extractDamageValue(rollDiceString(normalizeDice(diceString)));
                          } else {
                              // NEU: Damage on Miss (z.B. Melf's Acid Arrow)
                              if (effect.damage_on_miss) {
                                  const missDamage = Math.floor(baseRollVal / 2);
                                  let missedTargetState = combatantUpdates[target.id] || { ...target };
                                  missedTargetState = resolveDamage(missedTargetState, missDamage);
                                  combatantUpdates[target.id] = missedTargetState;
                                  msg = `💨 verfehlt ${target.name} knapp (${missDamage} Schaden).`;
                              } else {
                                  msg = `💨 verfehlt ${target.name}.`;
                              }
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
                                  // Save Halves
                                  hitSuccess = true;
                                  finalDamage = Math.floor(finalDamage / 2);
                                  msg = `🛡️ ${target.name} widersteht (halber Schaden).`;
                              }
                          }
                      } else {
                          hitSuccess = true; // Auto hit (z.B. Magic Missile, Healing)
                      }

                      if (hitSuccess) {
                          let currentTargetState = combatantUpdates[target.id] || { ...target };

                          // 1. HEILUNG
                          if (effect.type === 'HEALING') {
                              currentTargetState.hp = Math.min(currentTargetState.maxHp, currentTargetState.hp + finalDamage);
                              msg = `💖 Heilt ${target.name} für ${finalDamage} TP.`;
                          } 
                          // 2. TEMPORÄRE HP
                          else if (effect.type === 'TEMP_HP') {
                              currentTargetState = applyTempHp(currentTargetState, finalDamage);
                              msg = `🛡️ ${target.name} erhält ${finalDamage} Temp HP.`;
                          }
                          // 3. SCHADEN
                          else if (effect.type === 'DAMAGE') {
                              currentTargetState = resolveDamage(currentTargetState, finalDamage);
                              msg += ` 💥 ${target.name} nimmt ${finalDamage} ${dmgTypeDE}schaden.`;
                              if (currentTargetState.hp <= 0) msg += ` 💀 Besiegt!`;
                          }
                          // 4. CONDITION
                          else if (effect.type === 'APPLY_CONDITION' && effect.condition) {
                              currentTargetState = applyCondition(currentTargetState, effect.condition);
                              msg += ` 🌀 ${target.name} ist nun ${effect.condition.type}!`;
                          }

                          // 5. NEU: SPEZIAL-EFFEKTE (Disintegrate, Banishment, etc.)
                          const specialEffectData = { 
                              ...effect, 
                              damageDealt: (effect.type === 'DAMAGE') ? finalDamage : 0 
                          };
                          
                          // Wir rufen den Manager auf
                          const specialResult = processSpecialEffect(
                              specialEffectData, 
                              attacker, 
                              currentTargetState, 
                              prev.combatants
                          );

                          if (specialResult && specialResult.updates) {
                              // Updates anwenden (z.B. isPermadeath setzen)
                              currentTargetState = { ...currentTargetState, ...specialResult.updates };
                              if (specialResult.logs.length > 0) logEntries.push(...specialResult.logs);
                          }

                          combatantUpdates[target.id] = currentTargetState;
                      }
                      if(msg) logEntries.push(msg);
                  });
              }

              // 3. ERZWUNGENE BEWEGUNG (PUSH / PULL)
              else if ((effect.type === 'PUSH' || effect.type === 'PULL') && targets.length > 0) {
                  targets.forEach(target => {
                      let moveSuccess = true;
                      if (effect.saving_throw) {
                          const saveDC = (attacker.type === 'player') ? calculateSpellSaveDC(playerCharacter) : (attacker.save_dc || 12);
                          const abilityKey = effect.saving_throw.ability.toLowerCase().substring(0, 3);
                          const saveRoll = d(20) + getAbilityModifier(target.stats?.[abilityKey] || 10);
                          if (saveRoll >= saveDC) {
                              moveSuccess = false;
                              logEntries.push(`🛡️ ${target.name} hält stand.`);
                          }
                      }

                      if (moveSuccess) {
                          const dist = effect.distance_m || 3;
                          const newPos = calculateForcedMovement(target, attacker, effect.type, dist, prev.combatants);
                          
                          if (newPos.x !== target.x || newPos.y !== target.y) {
                              let currentTargetState = combatantUpdates[target.id] || { ...target };
                              currentTargetState.x = newPos.x;
                              currentTargetState.y = newPos.y;
                              combatantUpdates[target.id] = currentTargetState;
                              logEntries.push(`➡️ ${target.name} wird bewegt.`);
                          }
                      }
                  });
              }

              // 4. TELEPORTATION
              else if (effect.type === 'TELEPORT') {
                  if (targetCoords && isValidTeleport(targetCoords, prev.combatants)) {
                      let currentAttackerState = combatantUpdates[attacker.id] || { ...attacker };
                      currentAttackerState.x = targetCoords.x;
                      currentAttackerState.y = targetCoords.y;
                      combatantUpdates[attacker.id] = currentAttackerState;
                      logEntries.push(`✨ ${attacker.name} teleportiert sich.`);
                  } else {
                      logEntries.push(`🚫 Teleport blockiert.`);
                  }
              }
          });
      }
      
      // ---------------------------------------------------------
      // FALL B: WAFFE (Standard Angriff)
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

                  let damage = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  if (isCritical) damage += extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  if (action.damage?.bonus) damage += Number(action.damage.bonus);

                  let currentTargetState = combatantUpdates[target.id] || { ...target };
                  currentTargetState = resolveDamage(currentTargetState, damage);
                  combatantUpdates[target.id] = currentTargetState;
                  
                  logEntries.push(`⚔️ Trifft ${target.name} für ${damage} Schaden.${isCritical ? ' (KRIT!)' : ''}`);
                  if (currentTargetState.hp <= 0) logEntries.push(`💀 ${target.name} besiegt!`);
              } else {
                  logEntries.push(`💨 Verfehlt ${target.name}.`);
              }
          });
      }

      // State Update: Updates anwenden & neue Tokens hinzufügen
      let updatedCombatants = prev.combatants.map(c => {
          if (combatantUpdates[c.id]) return combatantUpdates[c.id];
          return c;
      });

      if (newCombatantsToAdd.length > 0) {
          updatedCombatants = [...updatedCombatants, ...newCombatantsToAdd];
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
      // Erlaube auch Beschwörungen (controlledBy player) zu agieren
      if (current.type !== 'player' && current.controlledBy !== 'player') return; 

      const targetCombatant = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      // A: Aktion ausgewählt (Angriff oder Zauber)
      if (selectedAction && state.turnResources.hasAction) {
          const allowedRange = calculateWeaponRange(selectedAction);
          const distToClick = getDistance(current, {x, y});

          // Reichweiten-Check
          if (distToClick > allowedRange) {
              setCombatState(prev => ({...prev, log: [...prev.log, `⚠️ Zu weit weg!`]}))
              return;
          }

          // 1. FLÄCHENZAUBER (AoE) & GEOMETRIE
          // Prüft auf explizite Form (Cone, Line, Cube) oder Radius
          if (selectedAction.target?.shape || selectedAction.target?.radius_m || selectedAction.target?.type === 'POINT') {
              
              // Berechne betroffene Kacheln
              // Wir bauen ein shapeData Objekt aus der Action
              const shapeData = {
                  type: selectedAction.target.shape || (selectedAction.target.radius_m ? 'SPHERE' : 'POINT'),
                  size_m: selectedAction.target.length_m || selectedAction.target.width_m || 0,
                  radius_m: selectedAction.target.radius_m
              };

              const affectedTiles = getAffectedTiles(current, {x, y}, shapeData);
              
              // Finde alle Combatants auf diesen Kacheln
              const targetsInArea = state.combatants.filter(c => {
                  if (c.hp <= 0) return false;
                  // Ignoriere den Caster selbst bei den meisten offensiven Zaubern (optional)
                  if (c.id === current.id && selectedAction.target.type !== 'SELF') return false;
                  
                  return affectedTiles.some(tile => tile.x === c.x && tile.y === c.y);
              });

              // Visuelles Feedback im Log (optional)
              // setCombatState(...) -> Log: "Zielt auf X Gegner"

              // Aktion ausführen (auch wenn keine Ziele getroffen werden, z.B. für Summon-Effekte auf den Boden)
              const targetIds = targetsInArea.map(t => t.id);
              performAction(current.id, targetIds, selectedAction, {x, y});
          } 
          
          // 2. EINZELZIEL (Gezielter Angriff)
          else if (targetCombatant && targetCombatant.type === 'enemy') {
              performAction(current.id, [targetCombatant.id], selectedAction, {x, y});
          }
          
          // 3. FEHLKLICK (Leeres Feld bei Einzelziel-Zauber)
          else if (!targetCombatant) {
               setCombatState(prev => ({...prev, log: [...prev.log, `⚠️ Kein gültiges Ziel.`]}))
          }
      } 
      
      // B: Bewegung (Keine Aktion ausgewählt)
      else if (!targetCombatant && !selectedAction) {
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
          } else {
              setCombatState(prev => ({...prev, log: [...prev.log, `⚠️ Bewegung reicht nicht.`]}))
          }
      }
  }, [selectedAction, performAction]);

  // nextTurn, KI, etc.)
  const nextTurn = useCallback(() => {
      processingTurn.current = false; 
      setCombatState(prev => {
          if (prev.result) return prev;

          let updatedCombatants = [...prev.combatants];
          let extraLogs = [];

          // 1. END OF TURN Trigger (für den, der gerade fertig ist)
          const endingCombatant = updatedCombatants[prev.turnIndex];
          if (endingCombatant && endingCombatant.hp > 0) {
              // A: Conditions ticken
              updatedCombatants[prev.turnIndex] = tickConditions(endingCombatant);
              
              // B: Hazard Check (End Turn) - z.B. Cloudkill
              const hazardResult = checkHazardInteractions(updatedCombatants[prev.turnIndex], prev.combatants, 'END_TURN');
              if (hazardResult.logs.length > 0) {
                  updatedCombatants[prev.turnIndex] = hazardResult.combatant;
                  extraLogs.push(...hazardResult.logs);
              }
          }

          const nextIndex = (prev.turnIndex + 1) % prev.combatants.length;
          const nextRound = nextIndex === 0 ? prev.round + 1 : prev.round;
          
          // 2. START OF TURN Trigger (für den Neuen)
          const nextCombatantIndex = nextIndex; // Workaround, um auf das Array zuzugreifen
          let nextCombatant = updatedCombatants[nextCombatantIndex];

          if (nextCombatant && nextCombatant.hp > 0) {
              // Hazard Check (Start Turn) - z.B. Spirit Guardians, Moonbeam
              const startHazardResult = checkHazardInteractions(nextCombatant, updatedCombatants, 'START_TURN');
              if (startHazardResult.logs.length > 0) {
                  updatedCombatants[nextCombatantIndex] = startHazardResult.combatant;
                  extraLogs.push(...startHazardResult.logs);
              }
          }

          // Prüfen ob jemand durch Hazards gestorben ist
          const activeNext = updatedCombatants[nextIndex]; // Neu laden falls update
          
          // Falls der nächste Spieler durch den Hazard am Rundenstart stirbt, müsste man eigentlich direkt weiterschalten,
          // aber das lassen wir der Einfachheit halber erst mal so.

          return {
              ...prev,
              turnIndex: nextIndex,
              round: nextRound,
              combatants: updatedCombatants,
              turnResources: { hasAction: true, hasBonusAction: true, movementLeft: calculateMoveTiles(activeNext.speed) },
              log: [...prev.log, ...extraLogs, `--- Runde ${nextRound}: ${activeNext.name} ---`]
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