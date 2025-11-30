// ==UserScript==
// @name         SwiftUploads Instant Download Auto (Updated 30 Nov 2025)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Auto-submit all SwiftUploads steps & auto-click final download (new 2025 system)
// @author       Saad1430
// @match        https://swiftuploads.com/*
// @match        https://www.swiftuploads.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function log(m) { console.log("[SwiftUploads Auto]:", m); }

  function submitIfExists(selector) {
    const form = document.querySelector(selector);
    if (form) {
      log("Submitting form: " + selector);
      form.submit();
      return true;
    }
    return false;
  }

  function clickIfExists(selector) {
    const el = document.querySelector(selector);
    if (el) {
      log("Clicking: " + selector);
      el.click();
      return true;
    }
    return false;
  }

  window.addEventListener("load", () => {
    log("Page loaded. Checking steps...");

    // -----------------------------------
    // PAGE 1 — FORM p=down_1
    // -----------------------------------
    const step1Form = document.querySelector('.download-type.original-button form input[name="p"][value="down_1"]');
    if (step1Form) {
      log("Detected PAGE 1 (down_1). Submitting hidden form...");
      submitIfExists('.download-type.original-button form');
      return;
    }

    // -----------------------------------
    // PAGE 2 — FORM p=down_2
    // -----------------------------------
    const step2Form = document.querySelector('#down_2Form input[name="p"][value="down_2"]');
    if (step2Form) {
      log("Detected PAGE 2 (down_2). Submitting hidden form...");
      submitIfExists('#down_2Form');
      return;
    }

    // -----------------------------------
    // PAGE 3 — FINAL DOWNLOAD
    // -----------------------------------
    const finalBtn = document.querySelector('#originalDownloadBtn');
    if (finalBtn) {
      log("Detected FINAL PAGE. Revealing & clicking download button...");

      // Make sure it's visible for users
      finalBtn.style.display = "block";

      // Auto-click after a small delay
      setTimeout(() => {
        clickIfExists('#originalDownloadBtn');
        clickIfExists('#originalDownloadBtn');
        clickIfExists('#originalDownloadBtn');
      }, 700);

      // CREATE FLOATING BUTTON FOR FAILSAFE
      const downloadURL = finalBtn.href;

      const floatBtn = document.createElement("button");
      floatBtn.innerHTML = `<i class="fa-solid fa-download"></i>`;
      floatBtn.style.position = "fixed";
      floatBtn.style.bottom = "20px";
      floatBtn.style.right = "20px";
      floatBtn.style.zIndex = "99999";
      floatBtn.style.padding = "12px 18px";
      floatBtn.style.fontSize = "20px";
      floatBtn.style.border = "0";
      floatBtn.style.borderRadius = "52%";
      floatBtn.style.background = "#fa0000";
      floatBtn.style.color = "#000";
      floatBtn.style.cursor = "pointer";
      floatBtn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
      floatBtn.style.opacity = "0.75";
      floatBtn.style.transition = "0.3s all";
      floatBtn.title = "Direct Download Button provided by Tampermonkey script";

      floatBtn.onmouseenter = () => floatBtn.style.opacity = "1";
      floatBtn.onmouseleave = () => floatBtn.style.opacity = "0.75";

      floatBtn.onclick = () => {
        log("Failsafe download button clicked.");
        window.location.href = downloadURL;
      };

      document.body.appendChild(floatBtn);

      log("Failsafe floating download button added.");

      return;
    }

    log("No known step detected. Waiting for dynamic elements...");
  });

})();
