// Speichern des Spielstands
export function saveGame(totalCoins, upgradeLevel, autoRainLevel, autoRainInterval, coinsPerClick, coinTiers) {
  if (!coinTiers || !Array.isArray(coinTiers) || coinTiers.length === 0) return; // Schutz vor Fehlern!
  const saveData = {
    totalCoins,
    upgradeLevel,
    autoRainLevel,
    autoRainInterval,
    coinsPerClick,
    coinTiers: coinTiers.map(t => ({
      unlocked: t.unlocked,
      chanceLevel: t.chanceLevel,
      valueLevel: t.valueLevel
    }))
  };
  localStorage.setItem('coinRainSave', JSON.stringify(saveData));
}

// Laden des Spielstands
export function loadGame() {
  const saved = localStorage.getItem('coinRainSave');
  if (!saved) return null;

  const saveData = JSON.parse(saved);
  return saveData;
}
