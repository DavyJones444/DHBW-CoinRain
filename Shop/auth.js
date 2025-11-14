/* Shop/auth.js */
/* Modul für Authentifizierung (Login/Register), Status & User-Daten. */

import { openModal, closeModal, initModal } from './modal.js';

let currentUser = null;
let users = JSON.parse(localStorage.getItem('coinRainUsers')) || {};

// --- Interne Hilfsfunktionen ---
function saveUsers() {
    localStorage.setItem('coinRainUsers', JSON.stringify(users));
}

function findUserByEmail(email) {
    return Object.values(users).find(user => user.email === email);
}

function setMessage(type, id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        el.className = text ? `auth-message ${type}` : 'auth-message';
    }
}

// --- Haupt-Initialisierung ---
export function initAuth() {
    // 1. Modals initialisieren
    initModal('login-modal', null, 'login-close-btn');
    initModal('register-modal', null, 'register-close-btn');

    // 2. Links zwischen Modals
    document.getElementById('show-register-link').addEventListener('click', () => {
        closeModal('login-modal');
        openModal('register-modal');
    });
    document.getElementById('show-login-link').addEventListener('click', () => {
        closeModal('register-modal');
        openModal('login-modal');
    });

    // 3. Formular-Listener
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // 4. "Persistente" Anmeldung prüfen
    const savedUser = localStorage.getItem('coinRainCurrentUser');
    if (savedUser && users[savedUser]) {
        currentUser = users[savedUser];
    }
    
    // 5. Header-UI aktualisieren
    updateAuthHeader();
}

// --- UI-Steuerung (Header) ---
function updateAuthHeader() {
    const statusEl = document.getElementById('auth-status');
    if (!statusEl) return;

    if (currentUser) {
        // Angemeldet-Ansicht
        statusEl.innerHTML = `
            <span>Willkommen, <button id="profile-btn">${currentUser.username}</button></span>
            <span>|</span>
            <a href="#" id="logout-btn">Abmelden</a>
        `;
        // Listener für neue Buttons
        document.getElementById('profile-btn').addEventListener('click', () => {
            // Sendet ein Event, das profile.js auffängt
            document.dispatchEvent(new CustomEvent('openProfile', { detail: currentUser }));
        });
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    } else {
        // Abgemeldet-Ansicht
        statusEl.innerHTML = `
            <a href="#" id="show-login-btn">Anmelden / Registrieren</a>
        `;
        document.getElementById('show-login-btn').addEventListener('click', () => {
            openModal('login-modal');
        });
    }
}

// --- Auth-Flow Funktionen ---
function handleLogin(e) {
    e.preventDefault();
    const credential = document.getElementById('login-credential').value;
    const password = document.getElementById('login-password').value;
    let foundUser = null;

    // 1. Nach Benutzername suchen
    if (users[credential] && users[credential].password === password) {
        foundUser = users[credential];
    }
    // 2. Nach E-Mail suchen
    if (!foundUser) {
        const userByEmail = findUserByEmail(credential);
        if (userByEmail && userByEmail.password === password) {
            foundUser = userByEmail;
        }
    }

    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('coinRainCurrentUser', currentUser.username);
        updateAuthHeader();
        closeModal('login-modal');
        document.getElementById('login-form').reset();
    } else {
        setMessage('error', 'login-message', 'Benutzername/E-Mail oder Passwort falsch.');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const pass1 = document.getElementById('register-password').value;
    const pass2 = document.getElementById('register-password-confirm').value;

    // Validierung
    if (!username || !email || !pass1 || !pass2) {
        return setMessage('error', 'register-message', 'Bitte alle Felder ausfüllen.');
    }
    if (pass1 !== pass2) {
        return setMessage('error', 'register-message', 'Die Passwörter stimmen nicht überein.');
    }
    if (users[username]) {
        return setMessage('error', 'register-message', 'Benutzername ist bereits vergeben.');
    }
    if (findUserByEmail(email)) {
        return setMessage('error', 'register-message', 'E-Mail ist bereits registriert.');
    }

    // Erfolg
    users[username] = {
        username,
        email,
        password: pass1,
        paymentInfo: null
    };
    saveUsers();
    
    alert('Registrierung erfolgreich! Du kannst dich jetzt anmelden.');
    closeModal('register-modal');
    document.getElementById('register-form').reset();
    openModal('login-modal');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('coinRainCurrentUser');
    updateAuthHeader();
}

// --- API für andere Module ---
export function getCurrentUser() {
    return currentUser;
}

export function changeUsername(newUsername) {
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (users[newUsername]) return { success: false, message: "Benutzername bereits vergeben." };
    
    const oldUsername = currentUser.username;
    
    // Benutzerdaten aktualisieren
    currentUser.username = newUsername;
    // Im 'users'-Objekt Schlüssel ändern
    delete users[oldUsername];
    users[newUsername] = currentUser;
    
    // In localStorage aktualisieren
    localStorage.setItem('coinRainCurrentUser', newUsername);
    saveUsers();
    updateAuthHeader(); // Zeigt sofort den neuen Namen an
    return { success: true, message: "Benutzername geändert." };
}

export function changeEmail(newEmail) {
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (findUserByEmail(newEmail)) return { success: false, message: "E-Mail bereits vergeben." };
    
    currentUser.email = newEmail;
    saveUsers();
    return { success: true, message: "E-Mail geändert." };
}

export function changePassword(oldPass, newPass, confirmPass) {
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (currentUser.password !== oldPass) return { success: false, message: "Aktuelles Passwort ist falsch." };
    if (newPass !== confirmPass) return { success: false, message: "Neue Passwörter stimmen nicht überein." };
    
    currentUser.password = newPass;
    saveUsers();
    return { success: true, message: "Passwort erfolgreich geändert." };
}

export function changePayment(iban, save) {
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    
    if (save && iban) {
        currentUser.paymentInfo = { iban: iban };
    } else {
        currentUser.paymentInfo = null; // Löschen, wenn "Speichern" nicht aktiv oder IBAN leer
    }
    saveUsers();
    return { success: true, message: "Zahlungsdaten aktualisiert." };
}