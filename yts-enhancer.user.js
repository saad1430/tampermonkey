// ==UserScript==
// @name         YTS Enhancer - Cleaner Browsing Pages
// @namespace    Saad1430
// @author       Saad1430
// @version      1.1
// @description  Make YTS feel better and easier to use! This script adds aesthetic CSS improvements, smarter pagination navigation, visual highlighting on the navbar to show your current section, and customizable options so you can tweak it exactly how you want.
// @match        https://yts.bz/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    "use strict";

    // -------------------------
    // User Config — Toggle Features
    // -------------------------
    const CONFIG = {
        cssTweaks: true,              // Grid, widths, spacing, mobile fixes
        navHighlight: true,           // Active navbar highlighting

        removeTopPagination: false,   // Remove pagination at top
        removeBottomPagination: true  // Remove pagination at bottom
    };

    // -------------------------
    // Logger
    // -------------------------
    const LOG_PREFIX = "[YTS Enhancer]";

    function log(message, ...rest) {
        console.log(
            `%c${LOG_PREFIX}`,
            "color:#6AC045;font-weight:bold;",
            message,
            ...rest
        );
    }

    // -------------------------
    // Settings Management
    // -------------------------
    function loadSettings() {
        const saved = GM_getValue("settings", {});
        const merged = { ...CONFIG, ...saved };
        return merged;
    }

    function saveSettings(settings) {
        GM_setValue("settings", settings);
        log("Settings saved", settings);
    }

    let settings = loadSettings();

    // -------------------------
    // Pagination safety check
    // -------------------------
    if (settings.removeTopPagination && settings.removeBottomPagination) {
        console.warn(
            `${LOG_PREFIX} Both paginations cannot be removed. Keeping bottom pagination.`
        );
        settings.removeTopPagination = false;
        saveSettings(settings);
        log("Settings updated to prevent both paginations from being removed");
    }

    // -------------------------
    // Inject CSS
    // -------------------------
    if (settings.cssTweaks) {
        GM_addStyle(`
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
            [class="browse-content"] [class="row"]::before {
                display: none !important;
            }

            @media screen and (max-width: 768px) {
                .col-lg-4 {
                    max-width: 30vw;
                    min-width: clamp(140px, 25vw, 160px);
                }
                .browse-content .container {
                    max-width: 95vw;
                    padding: 0 10px;
                }
                #info-page .selects-container {
                    width: clamp(80px, 20%, 150px);
                }
                [class="browse-content"] .row {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                }
            }

            @media screen and (max-width: 480px) {
                .col-lg-4 {
                    max-width: 45vw;
                    min-width: clamp(120px, 30vw, 140px);
                }
                .browse-content .container {
                    max-width: 100vw;
                    padding: 0 5px;
                }
                #info-page .selects-container {
                    width: 100%;
                    margin-right: 0;
                }
                [class="browse-content"] .row {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }
            }

            #main-search { padding: 5px; }

            .nav-links a[href*="/0/2160p/"] {
                color: inherit !important;
            }

            .active-nav {
                color: #6AC045 !important;
                font-weight: 600 !important;
                border-bottom: 1px solid #6AC045 !important;
            }
        `);
    }
    GM_addStyle(`
        #yts-enhancer-toggle-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #6AC045;
            color: #000;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            z-index: 99999;
            font-weight: 600;
            user-select: none;
        }
        #yts-enhancer-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e1e1e;
            color: #fff;
            padding: 12px 14px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0,0,0,.4);
            font-size: 14px;
            z-index: 99999;
            display: none;
            min-width: 220px;
            user-select: none;
        }

        #yts-enhancer-panel h4 {
            margin: 0 0 10px;
            font-size: 15px;
            color: #6AC045;
        }

        #yts-enhancer-panel label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            cursor: pointer;
        }

        #yts-enhancer-panel small {
            opacity: .6;
            display: block;
            margin-top: 6px;
        }
    `);

    // -------------------------
    // Highlight active navbar page
    // -------------------------
    if (settings.navHighlight) {
        (function quickNavHighlight() {
            const currentPath = location.pathname;

            function tryHighlight() {
                const navLinks = document.querySelectorAll(".nav-links a");
                if (!navLinks.length) return false;

                navLinks.forEach(link => {
                    try {
                        const linkPath = new URL(link.href).pathname;
                        if (
                            (currentPath === "/" && linkPath === "/") ||
                            (linkPath !== "/" && currentPath.startsWith(linkPath))
                        ) {
                            link.classList.add("active-nav");
                        }
                    } catch (_) { }
                });

                return true;
            }

            if (tryHighlight()) return;

            const mo = new MutationObserver(() => {
                if (tryHighlight()) mo.disconnect();
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });
        })();
    }

    // Script runs when DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        // -------------------------
        // Pagination control
        // -------------------------
        const paginations = document.querySelectorAll(
            ".tsc_pagination.tsc_paginationA.tsc_paginationA06"
        );

        if (paginations.length < 2) return;

        if (settings.removeTopPagination) {
            paginations[0].remove();
            log("Top pagination removed");
        }

        if (settings.removeBottomPagination) {
            paginations[paginations.length - 1].remove();
            log("Bottom pagination removed");
        }
        // -------------------------
        // Settings Panel
        // -------------------------
        function createSettingsPanel() {
            if (document.getElementById("yts-enhancer-panel")) return;

            const panel = document.createElement("div");
            panel.id = "yts-enhancer-panel";

            panel.innerHTML = `
          <h4>YTS Enhancer</h4>
    
          <label>
            <input type="checkbox" data-key="cssTweaks">
            Cleaner layout
          </label>
    
          <label>
            <input type="checkbox" data-key="navHighlight">
            Highlight active navbar
          </label>
    
          <label>
            <input type="checkbox" data-key="removeTopPagination">
            Remove Top pagination
          </label>
          
          <label>
            <input type="checkbox" data-key="removeBottomPagination">
            Remove Bottom pagination
          </label>
    
          <small>Ctrl + Shift + S to toggle</small>
        `;

            document.body.appendChild(panel);

            panel.querySelectorAll("input[type=checkbox]").forEach(cb => {
                const key = cb.dataset.key;
                cb.checked = settings[key];

                cb.addEventListener("change", () => {
                    settings[key] = cb.checked;
                    saveSettings(settings);
                    log(`Setting changed: ${key} = ${cb.checked}`);
                    location.reload(); // simplest + safest
                });
            });
        }

        function togglePanel() {
            createSettingsPanel();
            const panel = document.getElementById("yts-enhancer-panel");
            panel.style.display =
                panel.style.display === "none" ? "block" : "none";
        }

        document.addEventListener("keydown", e => {
            if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
                e.preventDefault();
                togglePanel();
                log("Settings panel toggled via hotkey");
            }
        });

        function createToggleButton() {
            if (document.getElementById("yts-enhancer-toggle-btn")) return;

            if (!document.body) {
                setTimeout(createToggleButton, 50);
                return;
            }

            const btn = document.createElement("div");
            btn.id = "yts-enhancer-toggle-btn";
            btn.textContent = "YTS Enhancer";

            btn.addEventListener("click", togglePanel);

            document.body.appendChild(btn);
            log("Toggle button created");
        }
        createToggleButton();

    });

})();
