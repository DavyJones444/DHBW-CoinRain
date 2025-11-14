/**

// Münz Tiers mit Daten und persistentem Freischaltstatus
const coinTiers = [
  {name: 'Bronze', color: 'bronze', baseValue: 1, basePrice: 5, chanceBase: 0, valueMultiplier: 1, unlockAt: 0, unlocked: true, chanceLevel: 0, valueLevel: 0},
  {name: 'Silber', color: 'silver', baseValue: 5, basePrice: 200, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Gold', color: 'gold', baseValue: 20, basePrice: 2500, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 10000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Diamant', color: 'cyan', baseValue: 100, basePrice: 30000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 100000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Obsidian', color: 'darkviolet', baseValue: 500, basePrice: 35000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000000, unlocked: false, chanceLevel: 0, valueLevel: 0},
];

// Globale Variablen
let totalCoins = 0;
let coinsPerClick = coinTiers[0].baseValue;
let permanentMultiplier = 1; // NEU: Globaler Multiplikator

// Upgrade "Mehr Münzen pro Klick"
let upgradeLevel = 1;
const baseUpgradeCost = 25;
const upgradeCostFactor = 1.95;
let upgradeCost = baseUpgradeCost;

// Upgrade Automatischer Münzregen Variablen
let autoRainLevel = 0;
const baseAutoRainCost = 100;
const autoRainCostFactor = 1.15;
let autoRainCost = baseAutoRainCost;
let autoRainInterval = 5000; // ms Startintervall
const autoRainIntervalFactor = 0.85;
const autoRainMinInterval = 500;
let autoRainTimer = null;

// Upgrade Chance und Wert Startpreise und Steigerungsfaktor pro Münztier
const baseChanceUpgradeCost = 200;
const baseValueUpgradeCost = 300;
const upgradeTierCostFactor = 1.3;

// DOM Elemente
const coinCountEl = document.getElementById('coin-count');
const rainButton = document.getElementById('rain-button');
const coinContainer = document.getElementById('coin-container');
const cloud = document.getElementById('cloud');
const shopList = document.querySelector('#shop ul');

// Speichern des Spielstands in localStorage
function saveGame() {
  const saveData = {
    totalCoins,
    upgradeLevel,
    autoRainLevel,
    autoRainInterval,
    coinsPerClick,
    permanentMultiplier,
    coinTiers: coinTiers.map(t => ({
      unlocked: t.unlocked,
      chanceLevel: t.chanceLevel,
      valueLevel: t.valueLevel,
    })),
  };
  localStorage.setItem('coinRainSave', JSON.stringify(saveData));
}

// Laden des Spielstands aus localStorage
function loadGame() {
  const saved = localStorage.getItem('coinRainSave');
  if (!saved) return;
  const saveData = JSON.parse(saved);

  totalCoins = saveData.totalCoins ?? totalCoins;
  upgradeLevel = saveData.upgradeLevel ?? upgradeLevel;
  autoRainLevel = saveData.autoRainLevel ?? autoRainLevel;
  autoRainInterval = saveData.autoRainInterval ?? autoRainInterval;
  coinsPerClick = saveData.coinsPerClick ?? coinsPerClick;
  permanentMultiplier = saveData.permanentMultiplier ?? permanentMultiplier;

  if (saveData.coinTiers) {
    saveData.coinTiers.forEach((t, i) => {
      if (coinTiers[i]) {
        coinTiers[i].unlocked = t.unlocked ?? coinTiers[i].unlocked;
        coinTiers[i].chanceLevel = t.chanceLevel ?? coinTiers[i].chanceLevel;
        coinTiers[i].valueLevel = t.valueLevel ?? coinTiers[i].valueLevel;
      }
    });
  }

  upgradeCost = calculateUpgradeCost(coinTiers[0].basePrice, upgradeCostFactor, upgradeLevel);
  autoRainCost = calculateUpgradeCost(baseAutoRainCost, autoRainCostFactor, autoRainLevel);
}

// Berechnung Upgradekosten
function calculateUpgradeCost(base, factor, level) {
  return Math.floor(base * Math.pow(factor, level));
}

// Freigeschaltete Münztier basieren auf unlocked Property
function getUnlockedTiers() {
  return coinTiers.filter(tier => tier.unlocked);
}

// Zurücksetzen des Fortschritts
function reset() {
  totalCoins = 0;
  upgradeLevel = 1;
  autoRainLevel = 0;
  autoRainInterval = 5000;
  coinsPerClick = coinTiers[0].baseValue;
  permanentMultiplier = 1;

  const saveData = {
    totalCoins,
    upgradeLevel,
    autoRainLevel,
    autoRainInterval,
    coinsPerClick,
    permanentMultiplier,
    coinTiers: [
      {name: 'Bronze', color: 'bronze', baseValue: 1, basePrice: 5, chanceBase: 0, valueMultiplier: 1, unlockAt: 0, unlocked: true, chanceLevel: 0, valueLevel: 0},
      {name: 'Silber', color: 'silver', baseValue: 5, basePrice: 200, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000, unlocked: false, chanceLevel: 0, valueLevel: 0},
      {name: 'Gold', color: 'gold', baseValue: 20, basePrice: 2500, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 10000, unlocked: false, chanceLevel: 0, valueLevel: 0},
      {name: 'Diamant', color: 'cyan', baseValue: 100, basePrice: 30000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 100000, unlocked: false, chanceLevel: 0, valueLevel: 0},
      {name: 'Obsidian', color: 'darkviolet', baseValue: 500, basePrice: 35000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000000, unlocked: false, chanceLevel: 0, valueLevel: 0},
    ]
  };
  localStorage.setItem('coinRainSave', JSON.stringify(saveData));
  loadGame();
  updateShopUI();
}

// Freischaltungen basierend auf totalCoins dauerhaft setzen
function updateUnlockedTiers() {
  coinTiers.forEach(tier => {
    if (!tier.unlocked && totalCoins >= tier.unlockAt) {
      tier.unlocked = true;
    }
  });
}

// Zufallsprüfung für Chance
function chanceCheck(probability) {
  return Math.random() < probability;
}

// Berechnung der effektiven Chance pro Münztier
function getTierChance(tier) {
  return tier.chanceBase + tier.chanceLevel * 0.05;
}

// Berechnung effektiver Münzwert mit Wert-Upgrades
function getTierValue(tier) {
  return tier.baseValue * (1 + tier.valueLevel * 0.2);
}

// Münzen hinzufügen mit Tier-Logik und Animationen
function addCoinsWithTiers(amount = 1) {
  let coinsThisClick = 0;
  let animations = [];

  // Bronze Münze immer
  coinsThisClick += getTierValue(coinTiers[0]) * amount;
  animations.push({color: 'bronze', count: amount});

  // Weitere Münztier basierend auf unlocked und Chance
  const unlocked = getUnlockedTiers();
  unlocked.slice(1).forEach(tier => {
      if (chanceCheck(getTierChance(tier))) {
        coinsThisClick += getTierValue(tier);
        animations.push({color: tier.color, count: 1});
      }
  });

  totalCoins += (coinsThisClick * permanentMultiplier);
  updateUnlockedTiers();

  coinCountEl.textContent = totalCoins;
  updateShopUI();
  saveGame();

  animations.forEach(anim => {
    for (let i = 0; i < anim.count; i++) {
      dropCoinAnimation(anim.color);
    }
  });
}

// Upgrade kaufen: Mehr Münzen pro Klick
function buyUpgrade() {
  if (totalCoins >= upgradeCost) {
    totalCoins -= upgradeCost;
    upgradeLevel++;
    coinsPerClick = (upgradeLevel + 1) * coinTiers[0].baseValue;
    upgradeCost = calculateUpgradeCost(coinTiers[0].basePrice, upgradeCostFactor, upgradeLevel);
    coinCountEl.textContent = totalCoins;
    updateShopUI();
    saveGame();
  } else {
    alert("Nicht genug Münzen für das Upgrade!");
  }
}

// Upgrade kaufen: Automatischer Münzregen
function buyAutoRain() {
  if (totalCoins >= autoRainCost) {
    totalCoins -= autoRainCost;
    autoRainLevel++;
    autoRainCost = calculateUpgradeCost(baseAutoRainCost, autoRainCostFactor, autoRainLevel);
    autoRainInterval = Math.max(autoRainInterval * autoRainIntervalFactor, autoRainMinInterval);
    if (autoRainTimer) clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
    coinCountEl.textContent = totalCoins;
    updateShopUI();
    saveGame();
  } else {
    alert("Nicht genug Münzen für automatischen Münzregen!");
  }
}

// Upgrade kaufen: Chance Upgrade für Münztier
function buyChanceUpgrade(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, upgradeTierCostFactor, tier.chanceLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.chanceLevel++;
    coinCountEl.textContent = totalCoins;
    updateShopUI();
    saveGame();
  } else {
    alert(`Nicht genug Münzen für Chance-Upgrade (${tier.name})!`);
  }
}

// Upgrade kaufen: Wert Upgrade für Münztier
function buyValueUpgrade(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, upgradeTierCostFactor, tier.valueLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.valueLevel++;
    coinCountEl.textContent = totalCoins;
    updateShopUI();
    saveGame();
  } else {
    alert(`Nicht genug Münzen für Wert-Upgrade (${tier.name})!`);
  }
}

// Shop UI aktualisieren
function updateShopUI() {
  let html = `
    <li>
      Münzen pro Klick | Lv. ${upgradeLevel}
      <button id="buy-upgrade-btn">Upgrade: ${upgradeCost} Münzen</button>
    </li>
    <li>
      Auto Münzregen | Lv. ${autoRainLevel}
      <button id="buy-auto-rain-btn">Upgrade: ${autoRainCost} Münzen</button>
    </li>
  `;

  // Anzeigen für freigeschaltete Münzen (außer Bronze)
  getUnlockedTiers().slice(1).forEach((tier, i) => {
    const chanceCost = calculateUpgradeCost(tier.basePrice, upgradeTierCostFactor, tier.chanceLevel);
    const valueCost = calculateUpgradeCost(tier.basePrice, upgradeTierCostFactor, tier.valueLevel);

    if ((getTierChance(tier)*100).toFixed(1) < 100) {
      html += `
      <li>
        <strong>${tier.name} Münze</strong>
        <br>Chance: ${(getTierChance(tier)*100).toFixed(1)}%
        <button data-index="${i+1}" class="buy-chance-btn">+5% ${chanceCost} Münzen</button><br>
        Wert: ${getTierValue(tier).toFixed(0)} Münzen
        <button data-index="${i+1}" class="buy-value-btn">+${(tier.baseValue*0.2).toFixed(0)} ${valueCost} Münzen</button>
      </li>
    `;
    } else {
      html += `
      <li>
        <strong>${tier.name} Münze</strong>
        <br>Chance: ${(getTierChance(tier)*100).toFixed(1)}%
        <br>
        Wert: x${getTierValue(tier).toFixed(2)}
        <button data-index="${i+1}" class="buy-value-btn">+20% ${valueCost} Münzen</button>
      </li>
    `;
    }
  });

  shopList.innerHTML = html;

  // Eventlistener an Buttons anhängen
  document.getElementById('buy-upgrade-btn').addEventListener('click', buyUpgrade);
  document.getElementById('buy-auto-rain-btn').addEventListener('click', buyAutoRain);

  document.querySelectorAll('.buy-chance-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyChanceUpgrade(parseInt(e.target.dataset.index)));
  });

  document.querySelectorAll('.buy-value-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyValueUpgrade(parseInt(e.target.dataset.index)));
  });
}

// Event: Klick auf Button "Münze regnen lassen"
rainButton.addEventListener('click', () => {
  addCoinsWithTiers(coinsPerClick);
});

// Automatischer Münzregen Timer starten wenn nötig
if (autoRainLevel > 0 && !autoRainTimer) {
  autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
}

// Beim Laden Spielstand laden, UI und Timer setzen
loadGame();
updateUnlockedTiers();
updateShopUI();

// Münz-Animation mit zufälliger Position, Größe und Geschwindigkeit
function dropCoinAnimation(color = 'bronze') {
  const coin = document.createElement('i');
  coin.className = `fa-solid fa-coins coin-falling coin-${color}`;
  
  const skyRect = coinContainer.getBoundingClientRect();
  const cloudRect = cloud.getBoundingClientRect();
  const cloudWidth = cloudRect.width;

  const randomX = Math.random() * (cloudWidth - 20);
  const startX = cloudRect.left + 15 - skyRect.left + randomX;
  coin.style.left = `${startX}px`;

  // Zufällige Fallgeschwindigkeit (Animationsdauer)
  const minDuration = 1.5; // Sekunden
  const maxDuration = 2.5;
  const duration = (Math.random() * (maxDuration - minDuration) + minDuration).toFixed(2);
  coin.style.animationDuration = `${duration}s`;

  // Zufällige Größe der Münze
  const minSize = 10; // px
  const maxSize = 22;
  const size = Math.floor(Math.random() * (maxSize - minSize) + minSize);
  coin.style.fontSize = `${size}px`;

  coinContainer.appendChild(coin);

  coin.addEventListener('animationend', () => coin.remove());
}*/

/* main.js */
/* Das Spiel-Modul. Es verwaltet den Spielstatus (Münzen, Kristalle, Upgrades). */

// --- Konstanten und globale Variablen ---
const coinTiers = [
  // ... (deine coinTiers-Definition bleibt exakt gleich)
  {name: 'Bronze', color: 'bronze', baseValue: 1, basePrice: 5, chanceBase: 0, valueMultiplier: 1, unlockAt: 0, unlocked: true, chanceLevel: 0, valueLevel: 0},
  {name: 'Silber', color: 'silver', baseValue: 5, basePrice: 200, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Gold', color: 'gold', baseValue: 20, basePrice: 2500, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 10000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Diamant', color: 'cyan', baseValue: 100, basePrice: 30000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 100000, unlocked: false, chanceLevel: 0, valueLevel: 0},
  {name: 'Obsidian', color: 'darkviolet', baseValue: 500, basePrice: 35000, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000000, unlocked: false, chanceLevel: 0, valueLevel: 0},
];

let totalCoins = 0;
let totalCrystals = 0; // Wichtig
let coinsPerClick = 1;
let permanentMultiplier = 1;
let upgradeLevel = 1;
let autoRainLevel = 0;
let autoRainInterval = 5000;
let autoRainTimer = null;
let upgradeCost, autoRainCost;

// --- DOM Elemente ---
// Wir holen sie einmal und exportieren sie, damit andere Module sie nicht suchen müssen
export const coinCountEl = document.getElementById('coin-count');
export const crystalCountEl = document.getElementById('crystal-count');
const rainButton = document.getElementById('rain-button');
const coinContainer = document.getElementById('coin-container');
const cloud = document.getElementById('cloud');
const shopList = document.querySelector('#shop ul');

// --- Kern-Funktionen (Speichern, Laden) ---
export function saveGame() {
  const saveData = {
    totalCoins,
    totalCrystals,
    upgradeLevel,
    autoRainLevel,
    autoRainInterval,
    coinsPerClick,
    permanentMultiplier,
    coinTiers: coinTiers.map(t => ({
      unlocked: t.unlocked,
      chanceLevel: t.chanceLevel,
      valueLevel: t.valueLevel,
    })),
  };
  localStorage.setItem('coinRainSave', JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem('coinRainSave');
  if (!saved) return;
  const saveData = JSON.parse(saved);

  totalCoins = saveData.totalCoins ?? 0;
  totalCrystals = saveData.totalCrystals ?? 0;
  upgradeLevel = saveData.upgradeLevel ?? 1;
  autoRainLevel = saveData.autoRainLevel ?? 0;
  autoRainInterval = saveData.autoRainInterval ?? 5000;
  coinsPerClick = saveData.coinsPerClick ?? 1;
  permanentMultiplier = saveData.permanentMultiplier ?? 1;

  if (saveData.coinTiers) {
    saveData.coinTiers.forEach((t, i) => {
      if (coinTiers[i]) {
        coinTiers[i].unlocked = t.unlocked;
        coinTiers[i].chanceLevel = t.chanceLevel;
        coinTiers[i].valueLevel = t.valueLevel;
      }
    });
  }
}

// --- Exportierte UI-Updater ---
export function updateUI() {
    updateCoinDisplay();
    updateCrystalDisplay();
    updateShopUI(); // Aktualisiert den In-Game-Shop
}
export function updateCoinDisplay() {
    if(coinCountEl) coinCountEl.textContent = Math.floor(totalCoins);
}
export function updateCrystalDisplay() {
    if(crystalCountEl) crystalCountEl.textContent = totalCrystals;
}

// --- Exportierte API für den Shop ---
export function addCrystals(amount) {
  totalCrystals += amount;
  updateCrystalDisplay();
  saveGame();
}

export function getTotalCrystals() {
  return totalCrystals;
}

export function spendCrystalsForCoins(crystalCost, coinAmount) {
  if (totalCrystals < crystalCost) {
    alert("Nicht genügend Kristalle!");
    return false;
  }
  totalCrystals -= crystalCost;
  totalCoins += coinAmount;
  updateCrystalDisplay();
  updateCoinDisplay();
  alert(`Du hast ${coinAmount} Münzen für ${crystalCost} Kristalle gekauft!`);
  saveGame();
  return true;
}

export function spendCrystalsForMultiplier(crystalCost, multiplier) {
  if (totalCrystals < crystalCost) {
    alert("Nicht genügend Kristalle!");
    return false;
  }
  totalCrystals -= crystalCost;
  permanentMultiplier *= multiplier;
  updateCrystalDisplay();
  alert(`Permanenter ${multiplier}x Multiplikator gekauft!`);
  saveGame();
  return true;
}

export function spendCrystalsForAutoRainBoost(crystalCost, factor) {
  if (totalCrystals < crystalCost) {
    alert("Nicht genügend Kristalle!");
    return false;
  }
  totalCrystals -= crystalCost;
  autoRainInterval = Math.max(autoRainInterval / factor, 500); // 500 = autoRainMinInterval
  if (autoRainTimer) {
    clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
  }
  updateCrystalDisplay();
  alert(`Auto-Regen Boost (${factor}x) gekauft!`);
  saveGame();
  return true;
}

// --- Restliche Spiellogik (bleibt fast unverändert) ---
function calculateUpgradeCost(base, factor, level) {
  return Math.floor(base * Math.pow(factor, level));
}
function getUnlockedTiers() {
  return coinTiers.filter(tier => tier.unlocked);
}
function updateUnlockedTiers() {
  coinTiers.forEach(tier => {
    if (!tier.unlocked && totalCoins >= tier.unlockAt) {
      tier.unlocked = true;
    }
  });
}
function chanceCheck(probability) { return Math.random() < probability; }
function getTierChance(tier) { return tier.chanceBase + tier.chanceLevel * 0.05; }
function getTierValue(tier) { return tier.baseValue * (1 + tier.valueLevel * 0.2); }

function addCoinsWithTiers(amount = 1) {
  let coinsThisClick = 0;
  let animations = [];

  coinsThisClick += getTierValue(coinTiers[0]) * amount;
  animations.push({color: 'bronze', count: amount});

  const unlocked = getUnlockedTiers();
  unlocked.slice(1).forEach(tier => {
      if (chanceCheck(getTierChance(tier))) {
        coinsThisClick += getTierValue(tier);
        animations.push({color: tier.color, count: 1});
      }
  });

  totalCoins += (coinsThisClick * permanentMultiplier);
  updateUnlockedTiers();
  
  // UI wird nur noch hier aktualisiert
  updateCoinDisplay();
  updateShopUI(); 
  saveGame();

  animations.forEach(anim => {
    for (let i = 0; i < anim.count; i++) {
      dropCoinAnimation(anim.color);
    }
  });
}

// ... (buyUpgrade, buyAutoRain, buyChanceUpgrade, buyValueUpgrade bleiben exakt gleich) ...
// ... (Wir müssen sie hier nur aufrufen) ...
function buyUpgrade() {
  upgradeCost = calculateUpgradeCost(coinTiers[0].basePrice, 1.95, upgradeLevel);
  if (totalCoins >= upgradeCost) {
    totalCoins -= upgradeCost;
    upgradeLevel++;
    coinsPerClick = (upgradeLevel + 1) * coinTiers[0].baseValue;
    updateCoinDisplay();
    updateShopUI();
    saveGame();
  } else {
    alert("Nicht genug Münzen für das Upgrade!");
  }
}

function buyAutoRain() {
  autoRainCost = calculateUpgradeCost(100, 1.15, autoRainLevel);
  if (totalCoins >= autoRainCost) {
    totalCoins -= autoRainCost;
    autoRainLevel++;
    autoRainInterval = Math.max(autoRainInterval * 0.85, 500);
    if (autoRainTimer) clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
    updateCoinDisplay();
    updateShopUI();
    saveGame();
  } else {
    alert("Nicht genug Münzen für automatischen Münzregen!");
  }
}
function buyChanceUpgrade(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, 1.3, tier.chanceLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.chanceLevel++;
    updateCoinDisplay();
    updateShopUI();
    saveGame();
  } else {
    alert(`Nicht genug Münzen für Chance-Upgrade (${tier.name})!`);
  }
}
function buyValueUpgrade(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, 1.3, tier.valueLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.valueLevel++;
    updateCoinDisplay();
    updateShopUI();
    saveGame();
  } else {
    alert(`Nicht genug Münzen für Wert-Upgrade (${tier.name})!`);
  }
}

function updateShopUI() {
  if (!shopList) return; // Sicherstellen, dass das Element existiert
  upgradeCost = calculateUpgradeCost(coinTiers[0].basePrice, 1.95, upgradeLevel);
  autoRainCost = calculateUpgradeCost(100, 1.15, autoRainLevel);

  let html = `
    <li>
      Münzen pro Klick | Lv. ${upgradeLevel}
      <button id="buy-upgrade-btn">Upgrade: ${upgradeCost} Münzen</button>
    </li>
    <li>
      Auto Münzregen | Lv. ${autoRainLevel}
      <button id="buy-auto-rain-btn">Upgrade: ${autoRainCost} Münzen</button>
    </li>
  `;
  getUnlockedTiers().slice(1).forEach((tier, i) => {
    const chanceCost = calculateUpgradeCost(tier.basePrice, 1.3, tier.chanceLevel);
    const valueCost = calculateUpgradeCost(tier.basePrice, 1.3, tier.valueLevel);
    const tierChance = (getTierChance(tier)*100).toFixed(1);
    
    html += `<li><strong>${tier.name} Münze</strong><br>`;
    if (tierChance < 100) {
      html += `Chance: ${tierChance}% <button data-index="${i+1}" class="buy-chance-btn">+5% ${chanceCost} Münzen</button><br>`;
    } else {
      html += `Chance: ${tierChance}%<br>`;
    }
    html += `Wert: ${getTierValue(tier).toFixed(0)} Münzen <button data-index="${i+1}" class="buy-value-btn">+${(tier.baseValue*0.2).toFixed(0)} ${valueCost} Münzen</button></li>`;
  });
  shopList.innerHTML = html;
  
  // Eventlistener (neu binden)
  document.getElementById('buy-upgrade-btn').addEventListener('click', buyUpgrade);
  document.getElementById('buy-auto-rain-btn').addEventListener('click', buyAutoRain);
  document.querySelectorAll('.buy-chance-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyChanceUpgrade(parseInt(e.target.dataset.index)));
  });
  document.querySelectorAll('.buy-value-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyValueUpgrade(parseInt(e.target.dataset.index)));
  });
}

function dropCoinAnimation(color = 'bronze') {
  // ... (dropCoinAnimation Logik bleibt exakt gleich) ...
  const coin = document.createElement('i');
  coin.className = `fa-solid fa-coins coin-falling coin-${color}`;
  const skyRect = coinContainer.getBoundingClientRect();
  const cloudRect = cloud.getBoundingClientRect();
  if(!cloudRect) return;
  const cloudWidth = cloudRect.width;
  const randomX = Math.random() * (cloudWidth - 20);
  const startX = cloudRect.left + 15 - skyRect.left + randomX;
  coin.style.left = `${startX}px`;
  const duration = (Math.random() * (2.5 - 1.5) + 1.5).toFixed(2);
  coin.style.animationDuration = `${duration}s`;
  const size = Math.floor(Math.random() * (22 - 10) + 10);
  coin.style.fontSize = `${size}px`;
  coinContainer.appendChild(coin);
  coin.addEventListener('animationend', () => coin.remove());
}


// --- Initialisierung ---
export function initGame() {
  loadGame();
  
  // Klick-Handler für den Hauptbutton
  rainButton.addEventListener('click', () => {
    addCoinsWithTiers(coinsPerClick);
  });

  // Auto-Regen Timer starten
  if (autoRainLevel > 0 && !autoRainTimer) {
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
  }

  updateUnlockedTiers();
}
