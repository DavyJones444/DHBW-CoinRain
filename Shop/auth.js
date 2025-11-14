/* Shop/auth.js */
/* Modul für Authentifizierung (Login/Register), Status & User-Daten. */

import { openModal, closeModal, initModal } from './modal.js';
import { saveGame } from '../main.js';

let currentUser = null;
let users = JSON.parse(localStorage.getItem('coinRainUsers')) || {};
let onLoginSuccessCallback = null;
let isLoginForced = false; // NEU: Steuert die "Login-Wall"

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
    // 1. Modals initialisieren (KEIN auto-init mehr von modal.js)
    // initModal('login-modal', null, 'login-close-btn'); <-- Wir machen das manuell
    initModal('register-modal', null, 'register-close-btn'); // Register kann normal schließen

    // KORRIGIERT: Manuelle Steuerung des Login-Modal-Schließens
    document.getElementById('login-close-btn').addEventListener('click', () => {
        if (isLoginForced) return; // Blockiere Schließen, wenn 'force' aktiv ist
        onLoginSuccessCallback = null;
        setMessage('error', 'login-message', '');
        closeModal('login-modal');
    });
    // Klick daneben
    document.getElementById('login-modal').addEventListener('click', (e) => {
        if (isLoginForced) return; // Blockiere Schließen
        if (e.target.id === 'login-modal') {
            onLoginSuccessCallback = null;
            setMessage('error', 'login-message', '');
            closeModal('login-modal');
        }
    });

    // 2. Links zwischen Modals
    document.getElementById('show-register-link').addEventListener('click', () => {
        closeModal('login-modal');
        openModal('register-modal');
        // WICHTIG: Wenn der Benutzer von der Login-Wall zur Registrierung wechselt,
        // muss der Callback (startApplication) beibehalten werden!
        // onLoginSuccessCallback = null; // <-- Diesen NICHT zurücksetzen
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
        document.getElementById('profile-btn').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('openProfile', { detail: currentUser }));
        });
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    } else {
        // Abgemeldet-Ansicht
        statusEl.innerHTML = `
            <a href="#" id="show-login-btn">Anmelden / Registrieren</a>
        `;
        document.getElementById('show-login-btn').addEventListener('click', () => {
            // Standard-Login (nicht erzwungen)
            promptLogin(null, false);
        });
    }
}

// --- Auth-Flow Funktionen ---
function handleLogin(e) {
    if (e) e.preventDefault();
    const credential = document.getElementById('login-credential').value;
    const password = document.getElementById('login-password').value;
    let foundUser = null;

    if (users[credential] && users[credential].password === password) {
        foundUser = users[credential];
    }
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
        setMessage('error', 'login-message', '');
        
        isLoginForced = false; // "Wall" ist durchbrochen
        
        if (onLoginSuccessCallback) {
            onLoginSuccessCallback(currentUser); // Starte die Anwendung (via app.js)
            onLoginSuccessCallback = null;
        }
    } else {
        setMessage('error', 'login-message', 'Benutzername/E-Mail oder Passwort falsch.');
    }
}

function handleRegister(e) {
    e.preventDefault();
    // ... (Validierungslogik bleibt gleich) ...
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const pass1 = document.getElementById('register-password').value;
    const pass2 = document.getElementById('register-password-confirm').value;

    if (!username || !email || !pass1 || !pass2) { /* ... */ }
    if (pass1 !== pass2) { /* ... */ }
    if (users[username]) { /* ... */ }
    if (findUserByEmail(email)) { /* ... */ }

    // Erfolg
    users[username] = { username, email, password: pass1, paymentInfo: null };
    saveUsers();
    
    // KORRIGIERT: Neuen Benutzer SOFORT anmelden
    currentUser = users[username];
    localStorage.setItem('coinRainCurrentUser', currentUser.username);
    updateAuthHeader();
    closeModal('register-modal');
    document.getElementById('register-form').reset();
    
    isLoginForced = false; // "Wall" ist durchbrochen

    // Starte die Anwendung, falls dies der erste Login war
    if (onLoginSuccessCallback) {
        onLoginSuccessCallback(currentUser);
        onLoginSuccessCallback = null;
    }
}

function handleLogout() {
    saveGame(); // Speichere den Spielstand vor dem Abmelden
    currentUser = null;
    localStorage.removeItem('coinRainCurrentUser');
    // KORRIGIERT: Seite neuladen, um die Login-Wall zu erzwingen
    location.reload();
}

// --- API für andere Module ---

/**
 * KORRIGIERT: Öffnet das Login-Modal, speichert Callback und erzwingt ggf.
 * @param {function} [onSuccess] Callback nach erfolgreichem Login.
 * @param {boolean} [forceLogin] Wenn true, kann das Modal nicht geschlossen werden.
 */
export function promptLogin(onSuccess = null, forceLogin = false) {
    isLoginForced = forceLogin;
    onLoginSuccessCallback = onSuccess;
    setMessage('error', 'login-message', 'Bitte anmelden, um fortzufahren.');

    // Schließen-Button basierend auf 'force' ein/ausblenden
    const closeBtn = document.getElementById('login-close-btn');
    if (closeBtn) {
        closeBtn.style.display = forceLogin ? 'none' : 'block';
    }
    
    openModal('login-modal');
}

export function getCurrentUser() {
    return currentUser;
}

// ... (Alle 'change...'-Funktionen bleiben exakt gleich)
export function changeUsername(newUsername) {
    // ...
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (users[newUsername]) return { success: false, message: "Benutzername bereits vergeben." };
    
    const oldUsername = currentUser.username;
    currentUser.username = newUsername;
    delete users[oldUsername];
    users[newUsername] = currentUser;
    
    localStorage.setItem('coinRainCurrentUser', newUsername);
    saveUsers();
    updateAuthHeader();
    return { success: true, message: "Benutzername geändert." };
}

export function changeEmail(newEmail) {
    // ...
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (findUserByEmail(newEmail)) return { success: false, message: "E-Mail bereits vergeben." };
    
    currentUser.email = newEmail;
    saveUsers();
    return { success: true, message: "E-Mail geändert." };
}

export function changePassword(oldPass, newPass, confirmPass) {
    // ...
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    if (currentUser.password !== oldPass) return { success: false, message: "Aktuelles Passwort ist falsch." };
    if (newPass !== confirmPass) return { success: false, message: "Neue Passwörter stimmen nicht überein." };
    
    currentUser.password = newPass;
    saveUsers();
    return { success: true, message: "Passwort erfolgreich geändert." };
}

export function changePayment(iban, save) {
    // ...
    if (!currentUser) return { success: false, message: "Nicht angemeldet." };
    
    if (save && iban) {
        currentUser.paymentInfo = { iban: iban };
    } else {
        currentUser.paymentInfo = null;
    }
    saveUsers();
    return { success: true, message: "Zahlungsdaten aktualisiert." };
}