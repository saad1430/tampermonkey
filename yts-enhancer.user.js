// ==UserScript==
// @name         YTS Enhancer
// @namespace    Saad1430
// @author       Saad1430
// @version      1.3
// @description  Make YTS feel better and easier to use! This script adds aesthetic CSS improvements, smarter pagination navigation, visual highlighting on the navbar to show your current section, and customizable options so you can tweak it exactly how you want.
// @include      /^https:\/\/yts\.[a-z0-9]+\//
// @icon         https://yts.gg/assets/images/website/favicon.ico
// @updateURL    https://github.com/saad1430/tampermonkey/raw/main/yts-enhancer.user.js
// @downloadURL  https://github.com/saad1430/tampermonkey/raw/main/yts-enhancer.user.js
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function () {
  "use strict";
  const CONFIG = {
    cssTweaks: true,
    navHighlight: true,
    singlePagination: true,
    singlePaginationKeep: "top",
    enableTransparencyMode: true,
  };
  const SCRIPT_NAME = GM_info.script.name;
  const SCRIPT_VERSION = GM_info.script.version;
  const LOG_PREFIX = "[YTS Enhancer]";
  const LAYOUT_STYLE_ID = "yts-enhancer-layout-css";
  const PAGINATION_SEL = ".tsc_pagination.tsc_paginationA.tsc_paginationA06";
  const LAYOUT_CSS = `
    .col-lg-4 {
      max-width: 20vw;
      min-width: clamp(0px, 15vw, 180px);
      width: auto;
    }
    .browse-content .container {
      max-width: 98vw;
      width: auto;
      margin: 0 auto;
      padding: 0 clamp(10px, 2vw, 20px);
    }
    .row { margin: 0; }
    #info-page .selects-container {
      width: clamp(100px, 16%, 200px);
      margin-right: clamp(5px, 1vw, 8px);
      margin-top: 5px;
    }
    [class="browse-content"] .row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(clamp(160px, 9vw, 180px), 1fr));
      gap: 1rem;
    }
    .browse-movie-wrap { padding: 0; }
    [class="browse-content"] [class="row"]::before { display: none !important; }
    @media screen and (max-width: 768px) {
      .col-lg-4 { max-width: 30vw; min-width: clamp(140px, 25vw, 160px); }
      .browse-content .container { max-width: 95vw; padding: 0 10px; }
      #info-page .selects-container { width: clamp(80px, 20%, 150px); }
      [class="browse-content"] .row {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      }
    }
    @media screen and (max-width: 480px) {
      .col-lg-4 { max-width: 45vw; min-width: clamp(120px, 30vw, 140px); }
      .browse-content .container { max-width: 100vw; padding: 0 5px; }
      #info-page .selects-container { width: 100%; margin-right: 0; }
      [class="browse-content"] .row {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }
    }
    #main-search { padding: 5px; }
    .nav-links a[href*="/0/2160p/"] { color: inherit !important; }
    .active-nav {
      color: #6AC045 !important;
      font-weight: 600 !important;
      border-bottom: 1px solid #6AC045 !important;
    }
  `;
  function log(message, ...rest) {
    console.log(`%c${LOG_PREFIX}`, "color:#6AC045;font-weight:bold;", message, ...rest);
  }
  function migrateSaved(raw) {
    const next = { ...CONFIG, ...raw };
    if ("removeTopPagination" in raw || "removeBottomPagination" in raw) {
      const removeTop = !!raw.removeTopPagination;
      const removeBottom = !!raw.removeBottomPagination;
      next.singlePagination = removeTop || removeBottom;
      if (removeTop && !removeBottom) next.singlePaginationKeep = "bottom";
      else if (removeBottom && !removeTop) next.singlePaginationKeep = "top";
      else if (removeTop && removeBottom) next.singlePaginationKeep = "bottom";
      else next.singlePagination = false;
      delete next.removeTopPagination;
      delete next.removeBottomPagination;
    }
    if (next.singlePaginationKeep !== "top" && next.singlePaginationKeep !== "bottom") {
      next.singlePaginationKeep = "bottom";
    }
    return next;
  }
  function loadSettings() {
    return migrateSaved(GM_getValue("settings", {}));
  }
  function saveSettings(s) {
    GM_setValue("settings", s);
    log("Settings saved", s);
  }
  function paginationRemovals(s) {
    if (!s.singlePagination) {
      return { removeTop: false, removeBottom: false };
    }
    if (s.singlePaginationKeep === "top") {
      return { removeTop: false, removeBottom: true };
    }
    return { removeTop: true, removeBottom: false };
  }
  const storedRaw = GM_getValue("settings", {});
  let settings = loadSettings();
  if ("removeTopPagination" in storedRaw || "removeBottomPagination" in storedRaw) {
    saveSettings(settings);
  }
  let navHighlightMo = null;
  /** @type {{ top: Element, bottom: Element, topPlace: { parent: Node, next: Node | null }, bottomPlace: { parent: Node, next: Node | null } } | null} */
  let paginationAnchors = null;
  function applyCssTweaks(enabled) {
    let el = document.getElementById(LAYOUT_STYLE_ID);
    if (enabled) {
      if (!el) {
        el = document.createElement("style");
        el.id = LAYOUT_STYLE_ID;
        el.textContent = LAYOUT_CSS;
        (document.head || document.documentElement).appendChild(el);
      }
    } else {
      el?.remove();
    }
  }
  function clearNavHighlight() {
    document.querySelectorAll(".nav-links a.active-nav").forEach((link) => {
      link.classList.remove("active-nav");
    });
    navHighlightMo?.disconnect();
    navHighlightMo = null;
  }
  function applyNavHighlight(enabled) {
    clearNavHighlight();
    if (!enabled) return;
    const currentPath = location.pathname;
    function tryHighlight() {
      const navLinks = document.querySelectorAll(".nav-links a");
      if (!navLinks.length) return false;
      navLinks.forEach((link) => {
        try {
          const linkPath = new URL(link.href).pathname;
          if (
            (currentPath === "/" && linkPath === "/") ||
            (linkPath !== "/" && currentPath.startsWith(linkPath))
          ) {
            link.classList.add("active-nav");
          }
        } catch (_) { /* bad href */ }
      });
      return true;
    }
    if (tryHighlight()) return;
    navHighlightMo = new MutationObserver(() => {
      if (tryHighlight()) {
        navHighlightMo?.disconnect();
        navHighlightMo = null;
      }
    });
    navHighlightMo.observe(document.documentElement, { childList: true, subtree: true });
  }
  function capturePaginationAnchors() {
    const nodes = document.querySelectorAll(PAGINATION_SEL);
    if (nodes.length < 2) return null;
    const top = nodes[0];
    const bottom = nodes[nodes.length - 1];
    if (top === bottom) return null;
    return {
      top,
      bottom,
      topPlace: { parent: top.parentNode, next: top.nextSibling },
      bottomPlace: { parent: bottom.parentNode, next: bottom.nextSibling },
    };
  }
  function restorePagination(el, place) {
    if (!el || !place.parent || el.isConnected) return;
    place.parent.insertBefore(el, place.next);
  }
  function removePagination(el) {
    if (el?.isConnected) el.remove();
  }
  function applyPaginationSettings(s) {
    if (!paginationAnchors) paginationAnchors = capturePaginationAnchors();
    if (!paginationAnchors) return;
    const { top, bottom, topPlace, bottomPlace } = paginationAnchors;
    const { removeTop, removeBottom } = paginationRemovals(s);
    if (removeTop) removePagination(top);
    else restorePagination(top, topPlace);
    if (removeBottom) removePagination(bottom);
    else restorePagination(bottom, bottomPlace);
  }
  function applyAllSettings(s) {
    applyCssTweaks(s.cssTweaks);
    applyNavHighlight(s.navHighlight);
    applyPaginationSettings(s);
  }
  function toggleSetting(key) {
    settings = { ...settings, [key]: !settings[key] };
    saveSettings(settings);
    applyAllSettings(settings);
    const labels = {
      cssTweaks: "Cleaner layout",
      navHighlight: "Highlight active navbar",
      singlePagination: "Use single pagination",
    };
    showNotification(`${labels[key] || key}: ${settings[key] ? "on" : "off"}.`, 2800);
  }
  function showNotification(message, ms = 3000) {
    whenBodyReady(() => {
      let toast = document.getElementById("yts-enhancer-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "yts-enhancer-toast";
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(showNotification._t);
      showNotification._t = setTimeout(() => toast.classList.remove("show"), ms);
    });
  }
  function whenBodyReady(fn) {
    if (document.body) fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }
  function panelGlassClass(enabled) {
    return enabled ? "yts-enhancer-transparency" : "yts-enhancer-no-transparency";
  }
  GM_addStyle(`
    .yts-enhancer-transparency {
      background: rgba(30, 30, 30, 0.45);
      backdrop-filter: blur(7px);
      color: #fff;
    }
    .yts-enhancer-no-transparency {
      background: #1e1e1e;
      color: #fff;
    }
    #yts-enhancer-fab {
      position: fixed;
      left: 20px;
      bottom: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #6AC045;
      color: #000;
      border: none;
      box-shadow: 0 6px 18px rgba(0,0,0,.35);
      z-index: 1000000;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 20px;
      font-weight: 600;
      user-select: none;
    }
    #yts-enhancer-fab:hover { transform: scale(1.05); }
    .yts-enhancer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .yts-enhancer-settings {
      width: min(94vw, 400px);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
    }
    .yts-enhancer-settings header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .yts-enhancer-settings header h2 {
      margin: 0;
      font-size: 18px;
      color: #6AC045;
    }
    .yts-enhancer-settings .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .yts-enhancer-settings label {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      user-select: none;
    }
    .yts-enhancer-settings label input { margin-top: 3px; flex-shrink: 0; }
    .yts-enhancer-settings fieldset {
      margin: 0;
      padding: 10px 12px 12px;
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .yts-enhancer-settings fieldset:disabled {
      opacity: 0.45;
      pointer-events: none;
    }
    .yts-enhancer-settings fieldset legend {
      font-size: 12px;
      font-weight: 600;
      opacity: 0.75;
      padding: 0 4px;
    }
    .yts-enhancer-settings fieldset label {
      padding: 6px 8px;
      background: transparent;
      border: none;
      font-weight: 500;
    }
    .yts-enhancer-settings .hint {
      font-size: 12px;
      opacity: .65;
      margin: 0;
    }
    .yts-enhancer-settings footer {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 14px 16px;
      border-top: 1px solid rgba(255,255,255,.08);
    }
    .yts-enhancer-btn {
      cursor: pointer;
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 14px;
    }
    .yts-enhancer-btn.primary { background: #6AC045; color: #000; }
    .yts-enhancer-btn.ghost {
      background: transparent;
      color: #6AC045;
      border: 1px solid #6AC045;
    }
    #yts-enhancer-toast {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30,30,30,.95);
      color: #6AC045;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 1000001;
      box-shadow: 0 6px 20px rgba(0,0,0,.35);
      opacity: 0;
      transition: opacity .2s ease;
      pointer-events: none;
    }
    #yts-enhancer-toast.show { opacity: 1; }
  `);
  applyCssTweaks(settings.cssTweaks);
  applyNavHighlight(settings.navHighlight);
  function closeSettingsPanel() {
    document.querySelector(".yts-enhancer-overlay")?.remove();
  }
  function syncPaginationRadios(overlay) {
    const single = overlay.querySelector("#yts-cb-singlePagination");
    const fieldset = overlay.querySelector("#yts-pagination-radios");
    fieldset.disabled = !single.checked;
  }
  function openSettingsPanel() {
    whenBodyReady(() => {
      if (document.querySelector(".yts-enhancer-overlay")) {
        closeSettingsPanel();
        return;
      }
      const draft = { ...settings };
      const keepBottom = draft.singlePaginationKeep !== "top";
      const overlay = document.createElement("div");
      overlay.className = "yts-enhancer-overlay";
      overlay.innerHTML = `
        <div class="yts-enhancer-settings ${panelGlassClass(draft.enableTransparencyMode)}" role="dialog" aria-modal="true">
          <header>
            <h2>${SCRIPT_NAME} (v${SCRIPT_VERSION})</h2>
            <button type="button" class="yts-enhancer-btn ghost" id="yts-enhancer-close" aria-label="Close">✕</button>
          </header>
          <div class="body">
            <label>
              <input type="checkbox" id="yts-cb-cssTweaks" ${draft.cssTweaks ? "checked" : ""}>
              <span>Cleaner layout</span>
            </label>
            <label>
              <input type="checkbox" id="yts-cb-navHighlight" ${draft.navHighlight ? "checked" : ""}>
              <span>Highlight active navbar</span>
            </label>
            <label>
              <input type="checkbox" id="yts-cb-enableTransparencyMode" ${draft.enableTransparencyMode ? "checked" : ""}>
              <span>Transparency / glassy panel</span>
            </label>
            <label>
              <input type="checkbox" id="yts-cb-singlePagination" ${draft.singlePagination ? "checked" : ""}>
              <span>Use single pagination</span>
            </label>
            <fieldset id="yts-pagination-radios">
              <legend class="yts-enhancer-legend">Which pagination to keep</legend>
              <label>
                <input type="radio" name="yts-pagination-keep" value="bottom" ${keepBottom ? "checked" : ""}>
                <span>Use bottom pagination</span>
              </label>
              <label>
                <input type="radio" name="yts-pagination-keep" value="top" ${!keepBottom ? "checked" : ""}>
                <span>Use top pagination</span>
              </label>
            </fieldset>
            <p class="hint">Ctrl + Shift + S opens this panel. Tampermonkey menu has quick toggles. Save &amp; Apply to confirm.</p>
          </div>
          <footer>
            <button type="button" class="yts-enhancer-btn ghost" id="yts-enhancer-cancel">Cancel</button>
            <button type="button" class="yts-enhancer-btn primary" id="yts-enhancer-save">Save &amp; Apply</button>
          </footer>
        </div>
      `;
      const dialog = overlay.querySelector(".yts-enhancer-settings");
      overlay.querySelector("#yts-cb-enableTransparencyMode").addEventListener("change", (e) => {
        dialog.classList.remove("yts-enhancer-transparency", "yts-enhancer-no-transparency");
        dialog.classList.add(panelGlassClass(e.target.checked));
      });
      overlay.querySelector("#yts-cb-singlePagination").addEventListener("change", () => {
        syncPaginationRadios(overlay);
      });
      syncPaginationRadios(overlay);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeSettingsPanel();
      });
      overlay.querySelector("#yts-enhancer-close").onclick = closeSettingsPanel;
      overlay.querySelector("#yts-enhancer-cancel").onclick = closeSettingsPanel;
      overlay.querySelector("#yts-enhancer-save").onclick = () => {
        const keepRadio = overlay.querySelector('input[name="yts-pagination-keep"]:checked');
        settings = {
          cssTweaks: overlay.querySelector("#yts-cb-cssTweaks").checked,
          navHighlight: overlay.querySelector("#yts-cb-navHighlight").checked,
          enableTransparencyMode: overlay.querySelector("#yts-cb-enableTransparencyMode").checked,
          singlePagination: overlay.querySelector("#yts-cb-singlePagination").checked,
          singlePaginationKeep: keepRadio?.value === "top" ? "top" : "bottom",
        };
        saveSettings(settings);
        applyAllSettings(settings);
        showNotification("Settings saved & applied.", 3500);
        closeSettingsPanel();
        log("Settings applied", settings);
      };
      document.body.appendChild(overlay);
    });
  }
  function ensureFab() {
    if (document.getElementById("yts-enhancer-fab")) return;
    if (!document.body) {
      setTimeout(ensureFab, 50);
      return;
    }
    const fab = document.createElement("button");
    fab.id = "yts-enhancer-fab";
    fab.type = "button";
    fab.title = "YTS Enhancer settings (Ctrl+Shift+S)";
    fab.textContent = "⚙";
    fab.addEventListener("click", openSettingsPanel);
    document.body.appendChild(fab);
    log("Settings button created");
  }
  function registerMenuCommands() {
    const reg =
      typeof GM_registerMenuCommand === "function"
        ? (caption, fn) => GM_registerMenuCommand(caption, fn)
        : typeof GM !== "undefined" && typeof GM.registerMenuCommand === "function"
          ? (caption, fn) => GM.registerMenuCommand(caption, fn)
          : null;
    if (!reg) return;
    reg("Show settings", () => openSettingsPanel());
    reg("Toggle cleaner layout", () => toggleSetting("cssTweaks"));
    reg("Toggle highlighted navbar", () => toggleSetting("navHighlight"));
    reg("Toggle use single pagination", () => toggleSetting("singlePagination"));
  }
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
      e.preventDefault();
      openSettingsPanel();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    paginationAnchors = capturePaginationAnchors();
    applyPaginationSettings(settings);
    ensureFab();
  });
  registerMenuCommands();
})();
