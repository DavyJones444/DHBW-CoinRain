/* Shop/modal.js */
/* Ein Utility-Modul zur Steuerung von Modals. SRP! */

/**
 * Öffnet ein Modal anhand seiner ID.
 * @param {string} modalId Die ID des Modal-Elements (z.B. 'mtx-shop-modal')
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    } else {
        console.error(`Modal mit ID '${modalId}' nicht gefunden.`);
    }
}

/**
 * Schließt ein Modal anhand seiner ID.
 * @param {string} modalId Die ID des Modal-Elements
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Initialisiert ein Modal mit seinen Öffnen- und Schließen-Buttons.
 * @param {string} modalId 
 * @param {string} openBtnId (Optional) ID des Buttons, der das Modal öffnet
 * @param {string} closeBtnId ID des 'X'-Buttons, der das Modal schließt
 */
export function initModal(modalId, openBtnId, closeBtnId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (openBtnId) {
        const openBtn = document.getElementById(openBtnId);
        if (openBtn) {
            openBtn.addEventListener('click', () => openModal(modalId));
        }
    }

    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modalId));
    }

    // Schließen bei Klick daneben
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal(modalId);
        }
    });
}