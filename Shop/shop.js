/* mtx-shop.js */
/**
// Sicherstellen, dass das DOM geladen ist, bevor wir Elemente suchen
document.addEventListener('DOMContentLoaded', () => {

  // DOM-Elemente für den MTX-Shop
  const mtxModal = document.getElementById('mtx-shop-modal');
  const openMtxBtn = document.getElementById('open-mtx-shop-btn');
  const closeMtxBtn = document.getElementById('mtx-close-btn');
  const mtxContent = document.querySelector('.mtx-content');

  // --- Funktionen zum Öffnen/Schließen ---

  function openMtxShop() {
    mtxModal.style.display = 'block';
  }

  function closeMtxShop() {
    mtxModal.style.display = 'none';
  }

  // --- Event Listener ---

  // Shop öffnen
  if(openMtxBtn) {
    openMtxBtn.addEventListener('click', openMtxShop);
  }

  // Shop schließen (X-Button)
  if(closeMtxBtn) {
    closeMtxBtn.addEventListener('click', closeMtxShop);
  }

  // Shop schließen (Klick neben die Box)
  window.addEventListener('click', (event) => {
    if (event.target == mtxModal) {
      closeMtxShop();
    }
  });

  // Klick-Handler für Kaufen-Buttons (Event Delegation)
  if (mtxContent) {
    mtxContent.addEventListener('click', (e) => {
      // Prüfen, ob ein Kaufen-Button geklickt wurde
      if (e.target.classList.contains('mtx-buy-btn')) {
        handleMtxBuy(e.target);
      }
    });
  }

  // --- Kauffunktionen ---

  function handleMtxBuy(button) {
    const type = button.dataset.type;
    const price = button.textContent; // z.B. "$0.99"

    // HIER würde die echte Zahlungs-API (Stripe, PayPal) aufgerufen
    // Da dies ein Dummy ist, simulieren wir einen erfolgreichen Kauf
    console.log(`Kauf gestartet für ${type} zum Preis von ${price}`);
    alert(`(Dummy) Kauf erfolgreich! Du hast ${type} für ${price} gekauft.`);

    // Führe die Aktion basierend auf dem Typ aus
    switch (type) {
      case 'coins':
        const amount = parseInt(button.dataset.amount, 10);
        buyCoinPack(amount);
        break;
      
      case 'multiplier':
        const value = parseInt(button.dataset.value, 10);
        buyPermanentMultiplier(value);
        // Button deaktivieren, da permanent
        button.disabled = true;
        button.textContent = "Gekauft!";
        break;
        
      case 'auto-rain-boost':
        const boostFactor = parseInt(button.dataset.value, 10);
        buyAutoRainBoost(boostFactor);
        // Button deaktivieren, da permanent
        button.disabled = true;
        button.textContent = "Gekauft!";
        break;
    }
    
    // Spielstand speichern und UI aktualisieren (Funktionen aus main.js)
    updateShopUI(); 
    saveGame();
    closeMtxShop();
  }

  /**
   * Fügt Münzen hinzu.
   * Greift auf 'totalCoins' und 'coinCountEl' aus main.js zu.
   */
  /**function buyCoinPack(amount) {
    if (typeof totalCoins !== 'undefined' && coinCountEl) {
      totalCoins += amount;
      coinCountEl.textContent = totalCoins;
      console.log(`${amount} Münzen hinzugefügt.`);
    } else {
      console.error("Fehler: 'totalCoins' oder 'coinCountEl' nicht in main.js gefunden.");
    }
  }

  /**
   * Setzt den permanenten Multiplikator.
   * Greift auf 'permanentMultiplier' aus main.js zu.
   */
  /**function buyPermanentMultiplier(value) {
     if (typeof permanentMultiplier !== 'undefined') {
       // Multiplikatoren sollten multipliziert werden, falls man mehrere kauft
       permanentMultiplier *= value; 
       console.log(`Permanenter Multiplikator ist jetzt ${permanentMultiplier}x`);
     } else {
       console.error("Fehler: 'permanentMultiplier' nicht in main.js gefunden.");
     }
  }
  
  /**
   * Beschleunigt den Auto-Regen.
   * Greift auf 'autoRainInterval', 'autoRainTimer', 'autoRainMinInterval' aus main.js zu.
   */
  /**function buyAutoRainBoost(factor) {
    if (typeof autoRainInterval !== 'undefined') {
      // Berechne neues Intervall, aber nicht schneller als minInterval
      autoRainInterval = Math.max(autoRainInterval / factor, autoRainMinInterval);
      
      // Timer neu starten, falls er läuft
      if (autoRainTimer) {
        clearInterval(autoRainTimer);
        autoRainTimer = setInterval(() => addCoinsWithTiers(1), autoRainInterval);
      }
      console.log(`Auto-Regen Intervall ist jetzt ${autoRainInterval}ms`);
    } else {
       console.error("Fehler: 'autoRainInterval' nicht in main.js gefunden.");
    }
  }

}); // Ende von DOMContentLoaded*/

/* Shop/shop.js */
/* Modul für die Interaktion mit dem Premium-Shop-Modal. */

import { initModal, closeModal } from './modal.js';
import { getCurrentUser, promptLogin } from './auth.js';
import { startPayment } from './payment.js';
import * as game from '../main.js'; // Importiert alle Exporte aus main.js

/**
 * Initialisiert das Shop-Modul.
 * Wird von app.js aufgerufen.
 */
export function initShop() {
    initModal('mtx-shop-modal', 'open-mtx-shop-btn', 'mtx-close-btn');
    
    const mtxContent = document.querySelector('#mtx-shop-modal .mtx-content');
    if (mtxContent) {
        mtxContent.addEventListener('click', (e) => {
            const button = e.target.closest('.mtx-buy-btn');
            if (!button) return;

            const type = button.dataset.type;
            if (type === 'buy-crystals') {
                handleBuyCrystals(button);
            } else if (type === 'spend-crystals') {
                handleSpendCrystals(button);
            }
        });
    }
    
// Deaktiviere gekaufte permanente Items beim Laden
// (Diese Logik müsste noch implementiert werden,
// z.B. durch Prüfung eines Flags in 'saveData')
}

/**
 * Handhabt den Klick auf "Kristalle kaufen" (Echtgeld).
 */
function handleBuyCrystals(button) {
    const packageId = button.dataset.packageId;
    const user = getCurrentUser();

    if (user) {
        closeModal('mtx-shop-modal');
        startPayment(packageId, user);
    } else {
        // Starte den Login-Prozess
        closeModal('mtx-shop-modal');
        
        // auth.js kümmert sich um das Öffnen des login-modal
        // und ruft startPayment nach Erfolg
        promptLogin((loggedInUser) => {
            startPayment(packageId, loggedInUser);
        });
    }
}

/**
 * Handhabt den Klick auf "Für Kristalle kaufen" (Ingame-Währung).
 */
function handleSpendCrystals(button) {
    // ... (Diese Funktion bleibt exakt gleich wie vorher)
    const itemId = button.dataset.itemId;
    const cost = parseInt(button.dataset.cost, 10);
    
    if (game.getTotalCrystals() < cost) {
        alert("Nicht genügend Kristalle!");
        return;
    }
    let success = false;
    switch (itemId) {
        case 'coins_10k': success = game.spendCrystalsForCoins(cost, 10000); break;
        case 'coins_150k': success = game.spendCrystalsForCoins(cost, 150000); break;
        case 'coins_500k': success = game.spendCrystalsForCoins(cost, 500000); break;
        case 'perm_multi_2x': success = game.spendCrystalsForMultiplier(cost, 2); break;
        case 'auto_rain_5x': success = game.spendCrystalsForAutoRainBoost(cost, 5); break;
    }
    if (success && (itemId === 'perm_multi_2x' || itemId === 'auto_rain_5x')) {
        button.disabled = true;
        button.innerHTML = "Gekauft!";
    }
}