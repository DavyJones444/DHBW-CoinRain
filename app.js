/* app.js */
/* Der Haupt-Orchestrator der Anwendung. */

// Importiere die Initialisierungs-Funktionen von jedem Modul
import { initGame, updateUI } from './main.js';
// KORRIGIERT: Wir brauchen getCurrentUser und promptLogin direkt in app.js
import { initAuth, getCurrentUser, promptLogin } from './shop/auth.js';
import { initPayment } from './shop/payment.js';
import { initShop } from './shop/shop.js';
import { initProfile } from './shop/profile.js';

/**
 * Lädt HTML-Fragmente (Partials) in die Container-Divs.
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
 * NEU: Diese Funktion startet das eigentliche Spiel,
 * nachdem der Login erfolgreich war.
 */
function startApplication(user) {
    console.log("Anwendung wird gestartet für:", user.username);
    
    // Initialisiere das Spiel-Modul MIT dem Benutzerobjekt
    initGame(user);
    
    // Aktualisiere die UI (lädt Spielstand-Werte in die Anzeige)
    updateUI();
}

/**
 * Startet die gesamte Anwendung.
 * KORRIGIERT: Erzwingt jetzt die Login-Wall.
 */
async function main() {
    // 1. Lade immer das HTML
    await loadHtmlPartials();
    
    // 2. Initialisiere alle Module, die für Modals/Auth gebraucht werden
    // (Sie hängen noch keine sichtbaren Listener an, außer auth)
    initAuth();
    initPayment();
    initProfile();
    initShop();
    
    // 3. Prüfe, ob ein Benutzer aus dem localStorage geladen wurde
    const user = getCurrentUser();
    
    if (user) {
        // 4a. Benutzer ist angemeldet: Starte das Spiel direkt
        startApplication(user);
    } else {
        // 4b. Benutzer ist nicht angemeldet: Zeige die Login-Wall
        // Wir übergeben 'startApplication' als Callback,
        // das nach erfolgreichem Login/Register ausgeführt wird.
        // 'true' erzwingt das Modal (kein Schließen).
        promptLogin(startApplication, true);
    }
}

// Warte, bis das DOM geladen ist, und starte dann die App
document.addEventListener('DOMContentLoaded', main);