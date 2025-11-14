/* app.js */
/* Der Haupt-Orchestrator der Anwendung. */

// Importiere die Initialisierungs-Funktionen von jedem Modul
import { initGame, updateUI } from './main.js';
import { initAuth } from './shop/auth.js';
import { initPayment } from './shop/payment.js';
import { initShop } from './shop/shop.js';
import { initProfile } from './shop/profile.js';

/**
 * Lädt HTML-Fragmente (Partials) in die Container-Divs.
 * Das ist "Clean Code", da das Haupt-HTML sauber bleibt.
 */
async function loadHtmlPartials() {
    try {
        const fetchHtml = async (url, containerId) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fehler beim Laden von ${url}`);
            const text = await response.text();
            document.getElementById(containerId).innerHTML = text;
        };

        // Lade alle Modals parallel
        await Promise.all([
            fetchHtml('shop/shop-modal.html', 'shop-modal-container'),
            fetchHtml('shop/login-modal.html', 'login-modal-container'),
            fetchHtml('shop/register-modal.html', 'register-modal-container'),
            fetchHtml('shop/payment-modal.html', 'payment-modal-container'),
            fetchHtml('shop/profile-modal.html', 'profile-modal-container')
        ]);

    } catch (error) {
        console.error("Konnte Modal-HTML nicht laden:", error);
        document.body.innerHTML = "<h1>Fehler beim Laden der Anwendung.</h1>";
    }
}

/**
 * Startet die gesamte Anwendung, sobald das DOM und die HTML-Fragmente geladen sind.
 */
async function main() {
    await loadHtmlPartials();
    
    // Initialisiere alle Module in der korrekten Reihenfolge
    initGame();     // Lädt Spielstand und stellt Spiel-Funktionen bereit
    updateUI();     // Aktualisiert Münzen/Kristalle beim Start
    
    // Initialisiere die Modal-Module
    initAuth();
    initPayment();
    initProfile();
    initShop();     // Shop als letztes, da er von Auth und Payment abhängt
}

// Warte, bis das DOM geladen ist, und starte dann die App
document.addEventListener('DOMContentLoaded', main);