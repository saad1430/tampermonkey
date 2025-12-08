// ==UserScript==
// @name         Twitch Auto Claim Drops
// @namespace    https://www.twitch.tv/
// @version      1.4.1
// @description  Auto claims Twitch drops reliably + refreshes page every 5 mins
// @icon         https://raw.githubusercontent.com/saad1430/tampermonkey/refs/heads/main/icons/twitch-automation-100.png
// @author       Saad1430
// @match        https://www.twitch.tv/drops/inventory
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const RELOAD_MINUTES = 5;
  const RELOAD_INTERVAL = RELOAD_MINUTES * 60 * 1000;

  function showNotification(message, duration = 3000) {
    // Remove previous notification
    const old = document.querySelector('.notification');
    if (old) old.remove();

    // Create a notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Add some basic styling
    notification.style.position = 'fixed';
    notification.style.bottom = '100px';
    notification.style.right = '25px';
    notification.style.padding = '15px 20px';
    notification.style.backgroundColor = 'rgba(24, 24, 27, 0.85)';
    notification.style.color = 'rgb(169, 112, 255)';
    notification.style.fontSize = '16px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '9999';
    notification.style.textAlign = 'center';
    notification.style.boxShadow = '0 2px 10px rgba(169, 112, 255, 0.3)';
    notification.style.userSelect = 'none';
    notification.style.opacity = '1';
    notification.style.transition = 'opacity 0.5s ease';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 500);
    }, duration);
  }

  function claimDrops() {
    const buttons = document.querySelectorAll('button');

    buttons.forEach(btn => {
      const text = btn.innerText.trim().toLowerCase();
      if (text.includes('claim') && !btn.disabled) {
        console.log('[Twitch Auto Claim] Claiming drop...');
        showNotification('🎁 Claiming a drop...');
        btn.click();
      }
    });
  }

  function startReloadCountdown(minutes) {
    let remainingTime = minutes * 60; // total seconds
    const notificationElement = document.createElement('div');

    // Basic notification styling
    notificationElement.className = 'persistentNotification';
    Object.assign(notificationElement.style, {
      position: 'fixed',
      bottom: '30px',
      right: '25px',
      backgroundColor: 'rgba(24, 24, 27, 0.85)',
      color: 'rgb(169, 112, 255)',
      padding: '12px 20px',
      borderRadius: '6px',
      zIndex: '9998',
      fontSize: '15px',
      boxShadow: '0 2px 10px rgba(169, 112, 255, 0.3)',
      userSelect: 'none',
      transition: 'opacity 0.5s ease',
    });

    document.body.appendChild(notificationElement);

    const updateMessage = () => {
      const mins = Math.floor(remainingTime / 60);
      const secs = remainingTime % 60;
      const formattedTime = `${mins}m ${secs}s`;
      notificationElement.textContent = `🔄 Page will reload in ${formattedTime}...`;
    };

    updateMessage();

    const interval = setInterval(() => {
      remainingTime--;
      if (remainingTime > 0) {
        updateMessage();
      } else {
        notificationElement.textContent = '♻️ Reloading now...';
        clearInterval(interval);
        setTimeout(() => location.reload(), 1000);
      }
    }, 1000); // update every second
  }

  function observeAndClaim() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => claimDrops());
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try claiming every 5 seconds in case observer misses
    setInterval(claimDrops, 5000);
  }

  // Start observing and claiming once DOM is ready
  window.addEventListener('load', () => {
    console.log('[Twitch Auto Claim] Script loaded, starting claim observer...');
    showNotification('✅ Auto Claim Script Loaded');
    observeAndClaim();
    startReloadCountdown(RELOAD_MINUTES);
  });

  // Refresh page every 5 minutes
  setTimeout(() => {
    console.log('[Twitch Auto Claim] Reloading page...');
    // showNotification('🔄 Refreshing page to stay active...');
  }, RELOAD_INTERVAL);
})();
