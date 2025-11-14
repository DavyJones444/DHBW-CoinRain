

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
      Lv. ${upgradeLevel} Münzen pro Klick
      <button id="buy-upgrade-btn">${upgradeCost} Münzen</button>
    </li>
    <li>
      Lv. ${autoRainLevel} Auto Münzregen
      <button id="buy-auto-rain-btn">${autoRainCost} Münzen</button>
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
        <button data-index="${i+1}" class="buy-chance-btn">+5% (${chanceCost} Münzen)</button><br>
        Wert: x${getTierValue(tier).toFixed(2)}
        <button data-index="${i+1}" class="buy-value-btn">+20% (${valueCost} Münzen)</button>
      </li>
    `;
    } else {
      html += `
      <li>
        <strong>${tier.name} Münze</strong>
        <br>Chance: ${(getTierChance(tier)*100).toFixed(1)}%
        <br>
        Wert: x${getTierValue(tier).toFixed(2)}
        <button data-index="${i+1}" class="buy-value-btn">+20% (${valueCost} Münzen)</button>
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
}
