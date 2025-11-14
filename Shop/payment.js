/* Shop/payment.js */
/* Modul für die (simulierte) Zahlungsabwicklung. */

import { openModal, closeModal, initModal } from './modal.js';
import * as game from '../main.js'; // Importiert das Spiel-Modul

// Definition der Kristall-Pakete
const crystalPackages = {
    "1": { name: "100 Kristalle", price: "$0.99", amount: 100 },
    "2": { name: "550 Kristalle", price: "$4.99", amount: 550 },
    "3": { name: "1200 Kristalle", price: "$9.99", amount: 1200 }
};

let pendingPurchase = null;
let currentUser = null;

/**
 * Initialisiert das Payment-Modul.
 * Wird von app.js aufgerufen.
 */
export function initPayment() {
    initModal('payment-modal', null, 'payment-close-btn');

    document.getElementById('giropay-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handlePaymentFormSubmit();
    });
}

/**
 * Startet den Bezahlvorgang für ein Paket.
 * @param {string} packageId Die ID des Pakets (z.B. "1", "2")
 * @param {object} user Das eingeloggte Benutzerobjekt aus auth.js
 */
export function startPayment(packageId, user) {
    pendingPurchase = crystalPackages[packageId];
    currentUser = user; // Benutzer für diesen Vorgang speichern
    
    if (!pendingPurchase) {
        alert("Kauf-Paket nicht gefunden!");
        return;
    }

    // Hat der Benutzer gespeicherte Zahlungsdaten?
    if (user.paymentInfo && user.paymentInfo.iban) {
        // JA: Direkte Bestätigung (simulieren)
        const confirmed = confirm(`Willkommen, ${user.username}!\n\nKauf bestätigen:\n${pendingPurchase.name} für ${pendingPurchase.price}\n\nGespeicherte IBAN: ...${user.paymentInfo.iban.slice(-4)}`);
        if (confirmed) {
            completePurchase();
        } else {
            pendingPurchase = null; // Kauf abbrechen
        }
    } else {
        // NEIN: Formular für IBAN zeigen
        document.getElementById('payment-title').textContent = `Zahlung für ${pendingPurchase.name}`;
        document.getElementById('payment-summary').textContent = `Preis: ${pendingPurchase.price}`;
        openModal('payment-modal');
    }
}

// Interne Funktion: Formular wird abgeschickt
function handlePaymentFormSubmit() {
    const iban = document.getElementById('iban').value;
    const saveDetails = document.getElementById('save-payment').checked;

    if (iban.length < 10) { // Simple Validierung
        alert("Bitte gib eine gültige IBAN ein.");
        return;
    }
    
    if (saveDetails && currentUser) {
        currentUser.paymentInfo = { iban: iban };
        // Wir müssen die 'users' DB aus auth.js aktualisieren.
        // Besser wäre ein 'saveUser(user)' in auth.js.
        // Fürs Erste speichern wir es im LocalStorage direkt (nicht ideal, aber funktioniert).
        let users = JSON.parse(localStorage.getItem('coinRainUsers')) || {};
        if (users[currentUser.username]) {
            users[currentUser.username].paymentInfo = { iban: iban };
            localStorage.setItem('coinRainUsers', JSON.stringify(users));
        }
    }
    
    closeModal('payment-modal');
    document.getElementById('giropay-form').reset();
    completePurchase();
}

// Interne Funktion: Kauf abschließen
function completePurchase() {
    if (!pendingPurchase) return;
    
    alert(`(Dummy) Zahlung erfolgreich!\n${pendingPurchase.amount} Kristalle wurden deinem Konto gutgeschrieben.`);
    
    // Spiel-Modul aufrufen, um Kristalle hinzuzufügen
    game.addCrystals(pendingPurchase.amount); 
    
    pendingPurchase = null;
    currentUser = null;
}