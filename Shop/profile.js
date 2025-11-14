/* Shop/profile.js */
/* Modul für das "Mein Profil"-Modal. */

import { openModal, closeModal, initModal } from '../modal.js';
import * as auth from '../auth.js'; // Importiert das Auth-Modul

let tabs = [];
let tabContents = [];

/**
 * Initialisiert das Profil-Modul.
 */
export function initProfile() {
    // 1. Modal selbst initialisieren
    initModal('profile-modal', null, 'profile-close-btn');

    // 2. Tab-Logik
    tabs = document.querySelectorAll('.profile-tab');
    tabContents = document.querySelectorAll('.profile-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Alle Tabs & Inhalte deaktivieren
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            // Richtigen Tab & Inhalt aktivieren
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // 3. Formular-Listener
    document.getElementById('profile-username-form').addEventListener('submit', handleSaveUsername);
    document.getElementById('profile-password-form').addEventListener('submit', handleSavePassword);
    document.getElementById('profile-payment-form').addEventListener('submit', handleSavePayment);

    // 4. Globalen Listener für "openProfile"
    document.addEventListener('openProfile', (e) => {
        openProfileModal(e.detail);
    });
}

/**
 * Öffnet das Modal und füllt die Felder mit den aktuellen Benutzerdaten.
 * @param {object} user Das currentUser-Objekt
 */
function openProfileModal(user) {
    if (!user) return;
    
    // Felder vor-ausfüllen
    document.getElementById('profile-username').value = user.username;
    document.getElementById('profile-email').value = user.email;
    
    if (user.paymentInfo && user.paymentInfo.iban) {
        document.getElementById('profile-iban').value = user.paymentInfo.iban;
        document.getElementById('profile-save-payment').checked = true;
    } else {
        document.getElementById('profile-iban').value = '';
        document.getElementById('profile-save-payment').checked = false;
    }
    
    // Alle Formulare zurücksetzen (Nachrichten löschen, PW-Felder leeren)
    document.getElementById('profile-password-form').reset();
    clearAllMessages();
    
    // Ersten Tab als Standard
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tabs[0].classList.add('active');
    tabContents[0].classList.add('active');

    openModal('profile-modal');
}

// --- Formular-Handler ---
function handleSaveUsername(e) {
    e.preventDefault();
    const newUsername = document.getElementById('profile-username').value;
    const newEmail = document.getElementById('profile-email').value;
    const user = auth.getCurrentUser();

    // Benutzername
    if (newUsername !== user.username) {
        const res = auth.changeUsername(newUsername);
        setMessage('profile-username-message', res.success ? 'success' : 'error', res.message);
    }
    // Email
    if (newEmail !== user.email) {
        const res = auth.changeEmail(newEmail);
        // Hängt Nachricht an, falls Benutzername auch geändert wurde
        appendMessage('profile-username-message', res.success ? 'success' : 'error', res.message);
    }
}

function handleSavePassword(e) {
    e.preventDefault();
    const oldPass = document.getElementById('profile-old-password').value;
    const newPass = document.getElementById('profile-new-password').value;
    const confirmPass = document.getElementById('profile-new-password-confirm').value;

    const res = auth.changePassword(oldPass, newPass, confirmPass);
    setMessage('profile-password-message', res.success ? 'success' : 'error', res.message);

    if (res.success) {
        e.target.reset(); // Formular leeren bei Erfolg
    }
}

function handleSavePayment(e) {
    e.preventDefault();
    const iban = document.getElementById('profile-iban').value;
    const save = document.getElementById('profile-save-payment').checked;

    const res = auth.changePayment(iban, save);
    setMessage('profile-payment-message', res.success ? 'success' : 'error', res.message);
}


// --- Hilfsfunktionen für Nachrichten ---
function setMessage(id, type, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `profile-message ${type}`;
}
function appendMessage(id, type, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML += `<br>${text}`;
    el.className = `profile-message ${type}`; // Setzt den Typ basierend auf der letzten Nachricht
}
function clearAllMessages() {
    document.querySelectorAll('.profile-message').forEach(el => {
        el.textContent = '';
        el.className = 'profile-message';
    });
}