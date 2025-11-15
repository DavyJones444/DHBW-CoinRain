/* main.js */
/* Das Spiel-Modul. Es verwaltet den Spielstatus (Münzen, Kristalle, Upgrades). */

// --- Konstanten und globale Variablen ---
const coinTiers = [
  {name: 'Bronze', color: 'bronze', baseValue: 1, basePrice: 50, baseTierUCPrice: 1, chanceBase: 0, valueMultiplier: 1, unlockAt: 0, unlocked: true, chanceLevel: 0, valueLevel: 0, chanceUCLevel: 0, valueUCLevel: 0},
  {name: 'Silber', color: 'silver', baseValue: 5, basePrice: 200, baseTierUCPrice: 1, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000, unlocked: false, chanceLevel: 0, valueLevel: 0, chanceUCLevel: 0, valueUCLevel: 0},
  {name: 'Gold', color: 'gold', baseValue: 20, basePrice: 2500, baseTierUCPrice: 1, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 10000, unlocked: false, chanceLevel: 0, valueLevel: 0, chanceUCLevel: 0, valueUCLevel: 0},
  {name: 'Diamant', color: 'cyan', baseValue: 100, basePrice: 30000, baseTierUCPrice: 1, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 100000, unlocked: false, chanceLevel: 0, valueLevel: 0, chanceUCLevel: 0, valueUCLevel: 0},
  {name: 'Obsidian', color: 'darkviolet', baseValue: 500, basePrice: 35000, baseTierUCPrice: 1, chanceBase: 0.05, valueMultiplier: 1, unlockAt: 1000000, unlocked: false, chanceLevel: 0, valueLevel: 0, chanceUCLevel: 0, valueUCLevel: 0},
];

// Flags für permanente Upgrades
let multiplierFlag = false;
let autoRainBoostFlag = false;

// Speicher-Slot für den angemeldeten Benutzer
let saveSlotUser = null;

// Basis-Upgrades (Klick & Auto)
let upgradeLevel = 1;
let autoRainLevel = 0;
let upgradeUCLevel = 0;
let autoRainUCLevel = 0;

// MÜNZ-Kosten (Basis)
const upgradeCoinCostFactor = 1.95;
const baseAutoRainCoinCost = 100;
const autoRainCoinCostFactor = 1.15;

// UC-Kosten (Basis)
const baseUpgradeUCCost = 1;
const baseAutoRainUCCost = 1;

// Währungen
let totalCoins = 0;
let totalCrystals = 0;
let totalUpgradeChips = 0;
let coinsPerClick = 1;
let permanentMultiplier = 1;
let autoRainInterval = 5000;
let autoRainTimer = null;

// Kosten-Variablen
let upgradeCoinCost, autoRainCoinCost;
let upgradeUCCost, autoRainUCCost;

// --- DOM Elemente ---
export const coinCountEl = document.getElementById('coin-count');
export const crystalCountEl = document.getElementById('crystal-count');
export const chipCountEl = document.getElementById('upgrade-chip-count');
const coinContainer = document.getElementById('coin-container');
const cloud = document.getElementById('cloud');
const shopList = document.querySelector('#shop ul');

// --- Kern-Funktionen (Speichern, Laden) ---
/**
 * Speichert den Fortschritt für den aktuellen Benutzer.
 */
export function saveGame() {
  // Speichere nicht, wenn kein Benutzer angemeldet ist
  if (!saveSlotUser) return;

  const saveData = {
    totalCoins, totalCrystals, totalUpgradeChips,
    upgradeLevel, autoRainLevel, autoRainInterval,
    upgradeUCLevel, autoRainUCLevel,
    coinsPerClick, permanentMultiplier,
    multiplierFlag, autoRainBoostFlag,
    coinTiers: coinTiers.map(t => ({
      unlocked: t.unlocked,
      chanceLevel: t.chanceLevel,
      valueLevel: t.valueLevel,
      chanceUCLevel: t.chanceUCLevel,
      valueUCLevel: t.valueUCLevel,
    })),
  };
  
  // Benutzt den Benutzernamen als Teil des Schlüssels
  localStorage.setItem('coinRainSave_' + saveSlotUser.username, JSON.stringify(saveData));
}

/**
 * Lädt den Fortschritt für den aktuellen Benutzer.
 */
function loadGame() {
  if (!saveSlotUser) return;

  // Lädt den benutzerspezifischen Spielstand
  const saved = localStorage.getItem('coinRainSave_' + saveSlotUser.username);
  
  // Wenn kein Spielstand für DIESEN Benutzer existiert,
  // werden einfach die globalen Standardwerte (z.B. totalCoins = 0) verwendet.
  if (!saved) return; 

  const saveData = JSON.parse(saved);

  totalCoins = saveData.totalCoins ?? 0;
  totalCrystals = saveData.totalCrystals ?? 0;
  totalUpgradeChips = saveData.totalUpgradeChips ?? 0;
  upgradeLevel = saveData.upgradeLevel ?? 1;
  autoRainLevel = saveData.autoRainLevel ?? 0;
  upgradeUCLevel = saveData.upgradeUCLevel ?? 0;
  autoRainUCLevel = saveData.autoRainUCLevel ?? 0;
  autoRainInterval = saveData.autoRainInterval ?? 5000;
  coinsPerClick = saveData.coinsPerClick ?? 1;
  permanentMultiplier = saveData.permanentMultiplier ?? 1;
  multiplierFlag = saveData.multiplierFlag ?? false;
  autoRainBoostFlag = saveData.autoRainBoostFlag ?? false;

  if (saveData.coinTiers) {
    saveData.coinTiers.forEach((t, i) => {
      if (coinTiers[i]) {
        coinTiers[i].unlocked = t.unlocked;
        coinTiers[i].chanceLevel = t.chanceLevel;
        coinTiers[i].valueLevel = t.valueLevel;
        coinTiers[i].chanceUCLevel = t.chanceUCLevel ?? 0;
        coinTiers[i].valueUCLevel = t.valueUCLevel ?? 0;
      }
    });
  }
}

// --- Exportierte UI-Updater ---
export function updateUI() {
    updateCoinDisplay();
    updateCrystalDisplay();
    updateChipDisplay();
    updateShopUI(); 
    updateCloudSprite();
    updateShopUI();
    updateUnlockedTiers();
}
export function updateCoinDisplay() {
    if(coinCountEl) coinCountEl.textContent = Math.floor(totalCoins);
}
export function updateCrystalDisplay() {
    if(crystalCountEl) crystalCountEl.textContent = totalCrystals;
}
export function updateChipDisplay() {
    if(chipCountEl) chipCountEl.textContent = totalUpgradeChips;
}

export function isMultiplierPurchased() {
    return multiplierFlag; 
}
export function isAutoRainBoostPurchased() {
    return autoRainBoostFlag; 
}

// --- Exportierte API für den Shop (bleibt gleich) ---
// (addCrystals, getTotalCrystals, spendCrystalsForUpgradeChips, ...)
// ... (Alle diese Funktionen sind korrekt und bleiben unverändert) ...
export function addCrystals(amount) {
  totalCrystals += amount; updateCrystalDisplay(); saveGame();
}
export function getTotalCrystals() {
  return totalCrystals;
}
export function spendCrystalsForUpgradeChips(crystalCost, chipAmount) {
  if (totalCrystals < crystalCost) { alert("Nicht genügend Kristalle!"); return false; }
  totalCrystals -= crystalCost; totalUpgradeChips += chipAmount;
  updateCrystalDisplay(); updateChipDisplay();
  alert(`Du hast ${chipAmount} Upgrade-Chips für ${crystalCost} Kristalle gekauft!`);
  saveGame(); return true;
}
export function spendCrystalsForCoins(crystalCost, coinAmount) {
  if (totalCrystals < crystalCost) { alert("Nicht genügend Kristalle!"); return false; }
  totalCrystals -= crystalCost; totalCoins += coinAmount;
  updateCrystalDisplay(); updateCoinDisplay();
  alert(`Du hast ${coinAmount} Münzen für ${crystalCost} Kristalle gekauft!`);
  saveGame(); return true;
}
export function spendCrystalsForMultiplier(crystalCost, multiplier) {
  if (totalCrystals < crystalCost) { alert("Nicht genügend Kristalle!"); return false; }
  totalCrystals -= crystalCost; 
  permanentMultiplier *= multiplier;
  multiplierFlag = true;
  updateCrystalDisplay();
  alert(`Permanenter ${multiplier}x Multiplikator gekauft!`);
  saveGame(); return true;
}
export function spendCrystalsForAutoRainBoost(crystalCost, factor) {
  if (totalCrystals < crystalCost) { alert("Nicht genügend Kristalle!"); return false; }
  totalCrystals -= crystalCost;
  autoRainInterval = Math.max(autoRainInterval / factor, 500);
  autoRainBoostFlag = true;
  if (autoRainTimer) {
    clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
  }
  updateCrystalDisplay();
  alert(`Auto-Regen Boost (${factor}x) gekauft!`);
  saveGame(); return true;
}

// --- Restliche Spiellogik ---
function calculateUpgradeCost(base, factor, level) {
  // Diese Funktion wird NUR NOCH FÜR MÜNZEN verwendet
  return Math.floor(base * Math.pow(factor, level));
}
// ... (getUnlockedTiers, updateUnlockedTiers, chanceCheck, getTierChance, getTierValue bleiben gleich) ...
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
  updateCloudSprite();
}

// Freischaltungen basierend auf totalCoins dauerhaft setzen
function updateUnlockedTiers() {
  coinTiers.forEach(tier => {
    if (!tier.unlocked && totalCoins >= tier.unlockAt) {
      tier.unlocked = true;
      updateCloudSprite();
    }
  });
}
function chanceCheck(probability) { return Math.random() < probability; }
function getTierChance(tier) { return tier.chanceBase + tier.chanceLevel * 0.05; }
function getTierValue(tier) { return tier.baseValue * (1 + tier.valueLevel * 0.2); }


function addCoinsWithTiers(amount = 1) {
  // ...  ...
  let coinsThisClick = 0;
  let animations = [];
  const unlocked = getUnlockedTiers();
  // Für jede spawnbare Münze geht man durch die Tiers und schaut, ob sie geupgraded wird.
  for (let i=0; i<amount ;i++) {
    animations.push({color: 'bronze', coins: getTierValue(coinTiers[0])});
    unlocked.slice(1).forEach(tier => {
      if (chanceCheck(getTierChance(tier))) {
        animations.pop();
        animations.push({color: tier.color, coins: getTierValue(tier)});
      }
    });
  }
  // Der Wert jeder Münze, die gespawnt wird, wird hinzugefügt.
  animations.forEach(anim => {
    for (let i = 0; i < animations.length; i++) {
      coinsThisClick += anim.coins;
    }
  });
  
  totalCoins += (coinsThisClick * permanentMultiplier);
  updateUnlockedTiers();
  updateCoinDisplay();
  updateShopUI();
  saveGame();
  animations.forEach(anim => {
    dropCoinAnimation(anim.color);
  });
}

// --- In-Game Shop Logik ---

// 1. Münzen pro Klick
function buyUpgradeWithCoins() {
  if (totalCoins >= upgradeCoinCost) {
    totalCoins -= upgradeCoinCost;
    upgradeLevel++; // Erhöhe das allgemeine Level
    coinsPerClick = (upgradeLevel + 1) * coinTiers[0].baseValue;
    updateCoinDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Münzen!"); }
}
function buyUpgradeWithUCs() {
  if (totalUpgradeChips >= upgradeUCCost) {
    totalUpgradeChips -= upgradeUCCost;
    upgradeLevel++; // Erhöhe das allgemeine Level
    upgradeUCLevel++; // Erhöhe das UC-Level
    coinsPerClick = (upgradeLevel + 1) * coinTiers[0].baseValue;
    updateChipDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Upgrade-Chips!"); }
}

// 2. Auto-Regen
function buyAutoRainWithCoins() {
  if (totalCoins >= autoRainCoinCost) {
    totalCoins -= autoRainCoinCost;
    autoRainLevel++; // Erhöhe das allgemeine Level
    autoRainInterval = Math.max(autoRainInterval * 0.85, 500);
    if (autoRainTimer) clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
    updateCoinDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Münzen!"); }
}
function buyAutoRainWithUCs() {
  if (totalUpgradeChips >= autoRainUCCost) {
    totalUpgradeChips -= autoRainUCCost;
    autoRainLevel++; // Erhöhe das allgemeine Level
    autoRainUCLevel++; // Erhöhe das UC-Level
    autoRainInterval = Math.max(autoRainInterval * 0.85, 500);
    if (autoRainTimer) clearInterval(autoRainTimer);
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
    updateChipDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Upgrade-Chips!"); }
}

// 3. Tier-Chance
function buyChanceUpgradeWithCoins(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, 1.4, tier.chanceLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.chanceLevel++; // Erhöhe das allgemeine Level
    updateCoinDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Münzen!"); }
}
function buyChanceUpgradeWithUCs(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = tier.baseTierUCPrice + tier.chanceUCLevel; // Additive Kosten
  if (totalUpgradeChips >= cost) {
    totalUpgradeChips -= cost;
    tier.chanceLevel++; // Erhöhe das allgemeine Level
    tier.chanceUCLevel++; // Erhöhe das UC-Level
    updateChipDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Upgrade-Chips!"); }
}

// 4. Tier-Wert
function buyValueUpgradeWithCoins(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = calculateUpgradeCost(tier.basePrice, 1.5, tier.valueLevel);
  if (totalCoins >= cost) {
    totalCoins -= cost;
    tier.valueLevel++; // Erhöhe das allgemeine Level
    updateCoinDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Münzen!"); }
}
function buyValueUpgradeWithUCs(tierIndex) {
  const tier = coinTiers[tierIndex];
  const cost = tier.baseTierUCPrice + tier.valueUCLevel; // Additive Kosten
  if (totalUpgradeChips >= cost) {
    totalUpgradeChips -= cost;
    tier.valueLevel++; // Erhöhe das allgemeine Level
    tier.valueUCLevel++; // Erhöhe das UC-Level
    updateChipDisplay(); updateShopUI(); saveGame();
  } else { alert("Nicht genug Upgrade-Chips!"); }
}

function updateShopUI() {
  if (!shopList) return;
  
  // Berechne MÜNZ-Kosten (exponentiell)
  upgradeCoinCost = calculateUpgradeCost(coinTiers[0].basePrice, upgradeCoinCostFactor, upgradeLevel);
  autoRainCoinCost = calculateUpgradeCost(baseAutoRainCoinCost, autoRainCoinCostFactor, autoRainLevel);
  
  // Berechne UC-Kosten (additiv)
  upgradeUCCost = baseUpgradeUCCost + upgradeUCLevel;
  autoRainUCCost = baseAutoRainUCCost + autoRainUCLevel;

  let html = `
    <li>
      Münzen pro Klick | Lv. ${upgradeLevel}<br>
      <button id="buy-upgrade-coin-btn">Kauf: ${upgradeCoinCost} Münzen</button>
      <button id="buy-upgrade-uc-btn">Kauf: ${upgradeUCCost} <i class="fa-solid fa-microchip uc-icon"></i></button>
    </li>
    <li>
      Auto Münzregen | Lv. ${autoRainLevel}<br>
      <button id="buy-auto-rain-coin-btn">Kauf: ${autoRainCoinCost} Münzen</button>
      <button id="buy-auto-rain-uc-btn">Kauf: ${autoRainUCCost} <i class="fa-solid fa-microchip uc-icon"></i></button>
    </li>
  `;
  
  getUnlockedTiers().slice(1).forEach((tier, i) => {
    const tierIndex = i + 1; // 1 = Silber, 2 = Gold...
    
    // Berechne MÜNZ-Kosten (exponentiell)
    const chanceCoinCost = calculateUpgradeCost(tier.basePrice, 1.4, tier.chanceLevel);
    const valueCoinCost = calculateUpgradeCost(tier.basePrice, 1.5, tier.valueLevel);
    
    // Berechne UC-Kosten (additiv)
    const chanceUCCost = tier.baseTierUCPrice + tier.chanceUCLevel;
    const valueUCCost = tier.baseTierUCPrice + tier.valueUCLevel;
    
    const tierChance = (getTierChance(tier)*100).toFixed(1);
    
    html += `<li><strong>${tier.name} Münze</strong><br>`;
    
    // Chance-Buttons
    if (tierChance < 100) {
      html += `Chance: ${tierChance}%<br>
        <button data-index="${tierIndex}" class="buy-chance-coin-btn">+5% (${chanceCoinCost} Münzen)</button>
        <button data-index="${tierIndex}" class="buy-chance-uc-btn">+5% (${chanceUCCost} <i class="fa-solid fa-microchip uc-icon"></i>)</button><br>`;
    } else {
      html += `Chance: ${tierChance}%<br>`;
    }
    
    // Wert-Buttons
    html += `Wert: ${getTierValue(tier).toFixed(0)} Münzen<br>
      <button data-index="${tierIndex}" class="buy-value-coin-btn">+${(tier.baseValue*0.2).toFixed(0)} (${valueCoinCost} Münzen)</button>
      <button data-index="${tierIndex}" class="buy-value-uc-btn">+${(tier.baseValue*0.2).toFixed(0)} (${valueUCCost} <i class="fa-solid fa-microchip uc-icon"></i>)</button>
      </li>`;
  });
  shopList.innerHTML = html;
  
  // Eventlistener für ALLE 8 Button-Typen neu binden
  document.getElementById('buy-upgrade-coin-btn').addEventListener('click', buyUpgradeWithCoins);
  document.getElementById('buy-upgrade-uc-btn').addEventListener('click', buyUpgradeWithUCs);
  document.getElementById('buy-auto-rain-coin-btn').addEventListener('click', buyAutoRainWithCoins);
  document.getElementById('buy-auto-rain-uc-btn').addEventListener('click', buyAutoRainWithUCs);
  
  document.querySelectorAll('.buy-chance-coin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyChanceUpgradeWithCoins(parseInt(e.target.dataset.index)));
  });
  document.querySelectorAll('.buy-chance-uc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyChanceUpgradeWithUCs(parseInt(e.target.dataset.index)));
  });
  
  document.querySelectorAll('.buy-value-coin-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyValueUpgradeWithCoins(parseInt(e.target.dataset.index)));
  });
  document.querySelectorAll('.buy-value-uc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => buyValueUpgradeWithUCs(parseInt(e.target.dataset.index)));
  });
}

function updateCloudSprite() {
  // Reihenfolge Tiers nach "Wertigkeit" sortiert
  const sprites = [
    "cloud1.png", // Bronze
    "cloud2.png", // Silber
    "cloud3.png", // Gold
    "cloud4.png", // Diamant
    "cloud5.png"  // Obsidian
  ];

  // Standard: Bronze
  let highestUnlocked = 0;
  for (let i = coinTiers.length - 1; i > 0; i--) {
    if (coinTiers[i].unlocked) {
      highestUnlocked = i;
      break;
    }
  }
  // Ändere Bildquelle der Cloud
  cloud.setAttribute("src", "./sprites/"+sprites[highestUnlocked]);
}


// Münz-Animation mit zufälliger Position, Größe und Geschwindigkeit
function dropCoinAnimation(color = 'bronze') {
  // ... (Diese Funktion bleibt unverändert) ...
  const coin = document.createElement('i');
  coin.className = `fa-solid fa-coins coin-falling coin-${color}`;
  const skyRect = coinContainer.getBoundingClientRect();
  const cloudRect = cloud.getBoundingClientRect();
  if(!cloudRect) return;
  const cloudWidth = cloudRect.width;
  const randomX = Math.random() * (cloudWidth - 30);
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

/**
 * Nimmt den Benutzer entgegen, um den korrekten Spielstand zu laden.
 */
export function initGame(user) {
  saveSlotUser = user; // Setze den Benutzer für save/load
  loadGame(); // Lade den Spielstand DIESES Benutzers
  
  
  // Event: Klick auf Button "Münze regnen lassen"
  cloud.addEventListener('click', () => {
    // Füge Klasse zur Animation hinzu
    cloud.classList.add("click-animation");

    // Entferne Klasse nach Animation, damit man wieder klicken kann
    cloud.addEventListener('animationend', () => {
      cloud.classList.remove("click-animation");
    }, { once: true });
    addCoinsWithTiers(coinsPerClick);
  });

  // Automatischer Münzregen Timer starten wenn nötig
  if (autoRainLevel > 0 && !autoRainTimer) {
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
  }

  if (autoRainLevel > 0 && !autoRainTimer) {
    autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
  }
  
  // WICHTIG: updateUI() wird jetzt von app.js aufgerufen,
  // NACHDEM initGame() gelaufen ist.
}

