// src/components/combat/TurnOrderBar.jsx
import React from 'react';
import './TurnOrderBar.css';

export const TurnOrderBar = ({ combatants, activeIndex }) => {
    
    // Fallback-Icon, falls keines definiert ist
    const getIcon = (c) => c.icon || '/src/assets/react.svg';

    return (
        <div className="turn-order-container">
            <div className="turn-order-list">
                {combatants.map((c, index) => {
                    const isActive = index === activeIndex;
                    const isDead = c.hp <= 0;
                    
                    return (
                        <div 
                            key={c.id} 
                            className={`turn-card ${c.type} ${isActive ? 'active' : ''} ${isDead ? 'dead' : ''}`}
                        >
                            <div className="turn-portrait-wrapper">
                                <div 
                                    className="turn-portrait"
                                    style={{ backgroundImage: `url(${getIcon(c)})` }}
                                >
                                    {isDead && <div className="dead-overlay">💀</div>}
                                </div>
                                <div className="turn-initiative-badge">{c.initiative}</div>
                            </div>
                            
                            {/* Mini HP-Bar */}
                            <div className="turn-hp-bar-bg">
                                <div 
                                    className="turn-hp-bar-fill"
                                    style={{ 
                                        width: `${Math.min(100, Math.max(0, (c.hp / c.maxHp) * 100))}%`,
                                        backgroundColor: c.type === 'player' ? '#4caf50' : '#f44336'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};