/* Shop/shop.js */
/* Modul für die Interaktion mit dem Premium-Shop-Modal. */

import { initModal, closeModal, openModal } from './modal.js';
import { getCurrentUser, promptLogin } from './auth.js';
import { startPayment } from './payment.js';
import * as game from '../main.js'; // Importiert alle Exporte aus main.js

/**
 * Eigene Funktion, um den Status der permanenten Items zu prüfen
 * und die Buttons zu deaktivieren, falls sie gekauft wurden.
 */
function updatePermanentItemUI() {
    // Finde die Buttons im (jetzt geladenen) Modal-HTML
    const multiBtn = document.querySelector('button[data-item-id="perm_multi_2x"]');
    const rainBtn = document.querySelector('button[data-item-id="auto_rain_5x"]');

    // Prüfe die Flags aus main.js
    try {
        if (multiBtn && game.isMultiplierPurchased()) {
            multiBtn.disabled = true;
            multiBtn.innerHTML = "Gekauft!";
        }
        if (rainBtn && game.isAutoRainBoostPurchased()) {
            rainBtn.disabled = true;
            rainBtn.innerHTML = "Gekauft!";
        }
    } catch (e) {
        console.error("Fehler: Stelle sicher, dass 'isMultiplierPurchased' und 'isAutoRainBoostPurchased' in main.js exportiert werden.", e);
    }
}

/**
 * Initialisiert das Shop-Modul.
 * Wird von app.js aufgerufen.
 */
export function initShop() {
    initModal('mtx-shop-modal', null, 'mtx-close-btn');

    const openShopBtn = document.getElementById('open-mtx-shop-btn');
    if (openShopBtn) {
        openShopBtn.addEventListener('click', () => {
            // 1. UI-Status der permanenten Items bei JEDEM Öffnen prüfen
            updatePermanentItemUI(); 
            // 2. Modal öffnen
            openModal('mtx-shop-modal');
        });
    }
    
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
        case 'perm_multi_2x': 
          success = game.spendCrystalsForMultiplier(cost, 2); 
          break;
        case 'auto_rain_5x': 
          success = game.spendCrystalsForAutoRainBoost(cost, 5); 
          break;
        case 'uc_10': success = game.spendCrystalsForUpgradeChips(cost, 10); break;
        case 'uc_50': success = game.spendCrystalsForUpgradeChips(cost, 50); break;
        case 'uc_120': success = game.spendCrystalsForUpgradeChips(cost, 120); break;
    }
    if (success && (itemId === 'perm_multi_2x' || itemId === 'auto_rain_5x')) {
        button.disabled = true;
        button.innerHTML = "Gekauft!";
    }
}