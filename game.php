<?php
session_start();
if (!isset($_SESSION['player_id'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kursor Souls - The Realm</title>
    <link rel="stylesheet" href="css/game.css">
    <style>
        * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 300; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        img { -webkit-user-drag: none; pointer-events: none; }
        input[type="text"], input[type="password"], textarea { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }

        body { background-color: #0b140d; color: #e0e0e0; width: 100vw; height: 100vh; overflow: hidden; position: relative; }

        /* ===== UI WINDOWS ===== */
        .ui-window { position: absolute; background: rgba(0,0,0,0.72); border-radius: 8px; z-index: 1500; display: flex; flex-direction: column; overflow: hidden; max-height: calc(100vh - 40px); transition: opacity 0.15s ease-out, transform 0.15s ease-out; }
        .window-content { overflow-y: auto; flex: 1; }
        .window-content::-webkit-scrollbar { width: 4px; }
        .window-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

        .stat-row { display:flex; justify-content:space-between; align-items:center; padding: 5px 6px; border-radius: 6px; margin-bottom: 3px; }
        .stat-row:hover { background: rgba(255,255,255,0.03); }
        .stat-plus { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); color: #fff; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; }
        .stat-plus:hover { background: rgba(255,255,255,0.2); }

        .bag-grid-layout { display: grid; grid-template-columns: repeat(4, 48px); gap: 5px; justify-content: center; overflow: hidden; }
        .slot { width: 48px; height: 48px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; display: flex; justify-content: center; align-items: center; cursor: grab; position: relative; transition: border-color 0.15s; box-sizing: border-box; overflow: hidden; }
        .slot.empty-slot { opacity: 0.3; cursor: default; }
        .slot:hover:not(.empty-slot) { border-color: rgba(255,255,255,0.2); }
        .slot.drag-over { border-color: rgba(0,229,255,0.6) !important; background: rgba(0,229,255,0.05); }
        .slot.common    { border-color: rgba(180,180,180,0.4); }
        .slot.uncommon  { border-color: rgba(0,180,80,0.5); }
        .slot.rare      { border-color: rgba(0,120,255,0.5); }
        .slot.epic      { border-color: rgba(160,0,255,0.6); }
        .slot.legendary { border-color: rgba(255,140,0,0.6); }
        .ui-window.hidden { opacity: 0; pointer-events: none; transform: translateY(-8px) scale(0.97); }
        
        .drag-handle { cursor: grab; } .drag-handle:active { cursor: grabbing; }

        .window-header { display: flex; justify-content: center; align-items: center; position: relative; padding: 8px 20px; background: rgba(0,0,0,0.35); border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 400; color: rgba(200,205,210,0.7); letter-spacing: 2px; text-transform: uppercase; font-size: 10px; width: 100%; box-sizing: border-box; flex-shrink: 0; }
        
        .close-win { position: absolute; right: 10px; top: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #888; font-size: 16px; cursor: pointer; font-weight: 300; transition: all 0.15s; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; padding-bottom: 2px; z-index: 10; }
        .close-win:hover { color: #fff; background: rgba(255,42,42,0.8); border-color: #ff2a2a; }
        
        .char-preview-box { width: 90px; height: 90px; background: rgba(255,255,255,0.03); display: flex; justify-content: center; align-items: center; position: relative; margin: 0 auto 10px auto; border-radius: 50%; }
        .char-preview-box img { width: 65px; height: 65px; object-fit: contain; }

        .player-mini-stats { width: 100%; font-size: 11px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; box-sizing: border-box; }
        
        .stat-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 5px 8px; background: rgba(0,0,0,0.2); border-radius: 4px; color: #aaa; }
        .stat-line:last-child { margin-bottom: 0; }
        .highlight { font-weight: 400; color: #fff; }

        .section-title { font-weight: 400; letter-spacing: 2px; font-size: 10px; color: rgba(0,229,255,0.7); text-align: center; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
        .section-title::before, .section-title::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,0.06); }

        .equip-grid-layout { display: flex; justify-content: center; gap: 10px; }

        .item-stack-count { position: absolute; top: -6px; right: -6px; background: #ff2a2a; color: #fff; font-family: 'Courier New', monospace; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px; border: 1px solid #ffca28; z-index: 5; pointer-events: none; }

        .menu-btn { width: 100%; padding: 10px; background: rgba(255,255,255,0.04); color: #ccc; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; font-weight: 300; letter-spacing: 1px; transition: background 0.15s; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 12px; }
        .menu-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .setting-row { display: flex; justify-content: space-between; align-items: center; color: #ccc; font-weight: 300; font-size: 13px; margin-bottom: 10px; }

        .race-list-item { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.35); border-radius: 6px; padding: 12px; margin-bottom: 10px; transition: background 0.15s; }
        .race-list-item:hover { background: rgba(0,229,255,0.04); }
        .race-list-item img { width: 45px; height: 45px; object-fit: contain; margin-right: 15px; }
        .race-list-item.locked { opacity: 0.5; filter: grayscale(100%); pointer-events: none; }
        .btn-equip-race { background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.3); color: #00e5ff; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; text-transform: uppercase; transition: 0.15s; }
        .btn-equip-race:hover { background: #00e5ff; color: #000; }

        /* =====================================================
           HUD SUPERIOR ESQUERDO — avatar circular + barras
           ===================================================== */
        .phud {
            position: fixed; top: 14px; left: 14px; z-index: 2500;
            display: flex; align-items: center;
            background: rgba(0,0,0,0.52);
            border-radius: 40px 12px 12px 40px;
            padding: 8px 18px 8px 8px;
            gap: 0;
            pointer-events: none;
            min-width: 240px;
        }

        .phud-avatar-ring {
            position: relative; flex-shrink: 0;
            width: 70px; height: 70px;
        }
        .phud-avatar-ring svg {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
        }
        /* FIX #4 — foto clicável para trocar raça */
        .phud-photo {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 54px; height: 54px;
            border-radius: 50%;
            object-fit: contain;
            image-rendering: pixelated;
            background: rgba(0,0,0,0.5);
            pointer-events: all;
            cursor: pointer;
            transition: filter 0.2s;
        }
        .phud-photo:hover { filter: brightness(1.3); }

        .phud-bars {
            display: flex; flex-direction: column;
            gap: 6px; flex: 1; margin-left: 12px;
        }
        .phud-bar-row {
            display: flex; align-items: center; gap: 7px;
        }
        .phud-bar-label {
            font-size: 9px; font-weight: 800;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.5px; width: 18px;
            text-align: right; flex-shrink: 0;
            opacity: 0.6;
        }
        .phud-bar-track {
            flex: 1; height: 11px; border-radius: 3px;
            background: rgba(255,255,255,0.05);
            position: relative; overflow: hidden;
        }
        .phud-bar-fill {
            position: absolute; left: 0; top: 0; height: 100%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        .phud-bar-val {
            position: absolute; right: 4px; top: 50%;
            transform: translateY(-50%);
            font-size: 8px; font-weight: 700;
            color: rgba(255,255,255,0.65);
            font-family: 'Courier New', monospace;
            z-index: 2; white-space: nowrap;
        }
        .phud-fill-hp { background: rgba(210, 50, 50, 0.8); }
        .phud-fill-mp { background: rgba(40, 110, 210, 0.8); }
        .phud-fill-sp { background: rgba(220, 150, 0, 0.8); }

        /* =====================================================
           HUD INFERIOR
           ===================================================== */
        .hud-master-wrapper {
            position: fixed; bottom: 16px; left: 50%;
            transform: translateX(-50%);
            display: flex; align-items: flex-end;
            gap: 6px; z-index: 2000;
        }
        .hud-menu-btns {
            display: flex; flex-direction: column; gap: 5px;
            background: rgba(0,0,0,0.52);
            border-radius: 10px;
            padding: 8px 6px;
        }
        .os-btn {
            background: transparent; border: none; border-radius: 6px;
            cursor: pointer; transition: background 0.15s;
            display: flex; justify-content: center; align-items: center;
            width: 34px; height: 34px; font-size: 18px; line-height: 1;
            pointer-events: all;
        }
        .os-btn:hover { background: rgba(255,255,255,0.09); }

        .hud-core {
            background: rgba(0,0,0,0.52);
            border-radius: 12px;
            padding: 10px 14px 6px;
            display: flex; flex-direction: column;
            align-items: center; gap: 6px;
        }
        .skills-row { display: flex; gap: 8px; }
        .skill-mini-slot {
            width: 46px; height: 46px;
            background: rgba(255,255,255,0.04);
            border-radius: 8px; position: relative;
            cursor: pointer; transition: background 0.12s;
            display: flex; justify-content: center; align-items: center;
            font-size: 20px; pointer-events: all;
        }
        .skill-mini-slot:hover { background: rgba(255,255,255,0.09); }
        .skill-mini-slot .key {
            position: absolute; top: -7px; left: -7px;
            background: rgba(0,0,0,0.85); color: #aaa;
            border: 1px solid rgba(255,255,255,0.12);
            font-size: 9px; padding: 1px 4px;
            border-radius: 3px; font-weight: bold; z-index: 15;
        }

        .hud-xp-row {
            width: 100%; display: flex; align-items: center; gap: 7px;
        }
        .hud-xp-track {
            flex: 1; height: 4px; border-radius: 3px;
            background: rgba(255,255,255,0.05); overflow: hidden;
        }
        .hud-xp-fill {
            height: 100%; width: 0%;
            background: rgba(155,55,210,0.75);
            transition: width 0.3s;
        }
        .hud-xp-text {
            font-size: 9px; font-weight: 800;
            color: rgba(180,110,240,0.75);
            font-family: 'Courier New', monospace;
            white-space: nowrap; flex-shrink: 0;
        }

        .corner-btn { position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.52); border: none; border-radius: 50%; width: 42px; height: 42px; font-size: 20px; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 2000; transition: 0.15s; }
        .corner-btn:hover { transform: scale(1.1) rotate(45deg); }

        .game-area { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; cursor: none; z-index: 1; background-color: #0b140d; }
        .world-map { position: absolute; top: 0; left: 0; width: 5000px; height: 5000px; background-color: #161a22; background-image: linear-gradient(#1e2430 2px, transparent 2px), linear-gradient(90deg, #1e2430 2px, transparent 2px); background-size: 80px 80px; transform-origin: 0 0; will-change: transform; backface-visibility: hidden; }

        /* ===== CHAT ===== */
        .chat-container { position: absolute; left: 10px; bottom: 15px; width: 270px; height: 185px; background: rgba(0,0,0,0.5); border-radius: 8px; display: flex; flex-direction: column; z-index: 1000; overflow: hidden; transition: opacity 0.2s; opacity: 0.5; }
        .chat-container:hover, .chat-container.active { background: rgba(0,0,0,0.78); opacity: 1; }
        .chat-tabs { display: flex; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .chat-tab { flex: 1; text-align: center; padding: 6px 0; font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; cursor: pointer; transition: 0.15s; border-bottom: 2px solid transparent; }
        .chat-tab:hover { color: #bbb; }
        .chat-tab.active { color: rgba(200,205,210,0.85); border-bottom-color: rgba(200,205,210,0.4); }
        .chat-messages { flex-grow: 1; padding: 8px; overflow-y: auto; font-size: 12px; color: #ccc; display: flex; flex-direction: column; gap: 4px; font-family: 'Segoe UI', Tahoma, sans-serif; }
        .chat-input-wrapper { background: rgba(0,0,0,0.3); padding: 6px 8px; border-top: 1px solid rgba(255,255,255,0.04); }
        .chat-input { width: 100%; background: transparent; border: none; color: #fff; font-size: 12px; outline: none; }
        .chat-input::placeholder { color: rgba(255,255,255,0.18); }

        #death-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5,0,0,0.95); z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 1.5s ease-in-out; }
        #death-screen h1 { color: #e53935; font-size: 72px; letter-spacing: 12px; font-weight: 300; margin-bottom: 20px; }
    </style>
    <script>
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73 || e.key === 'J' || e.key === 'j' || e.keyCode === 74 || e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); return false; }
        });
    </script>
</head>
<body>
    
    <div id="death-screen">
        <h1>YOU DIED</h1>
        <p>Your soul is fragmenting... Returning to SafePad.</p>
    </div>

    <div id="top-info-hud" style="position: absolute; top: 15px; right: 20px; display: flex; flex-direction: column; gap: 5px; text-align: right; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; color: rgba(0,229,255,0.75); pointer-events: none; z-index: 2000;">
        <span id="ui-fps-display" style="display: none;">FPS: --</span>
        <span id="ui-ping-display" style="display: none;">Ping: -- ms</span>
        <span id="ui-coords-display" style="display: none;">X: -- | Y: --</span>
    </div>

    <div id="chat-container" class="chat-container">
        <div class="chat-tabs">
            <div class="chat-tab active" data-channel="zone">Local</div>
            <div class="chat-tab" data-channel="global">Global</div>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div style="color: #ff4444; font-weight: bold;">[System]: Welcome to Kursor Souls.</div>
        </div>
        <div class="chat-input-wrapper">
            <input type="text" class="chat-input" id="chat-input" placeholder="Press Enter to chat..." autocomplete="off">
        </div>
    </div>

    <div id="window-character" class="ui-window draggable-window hidden" style="width: 620px; max-width: 98vw;">
        <div class="window-header drag-handle">
            <span>Character Sheet</span>
            <button class="close-win" onclick="toggleWindow('window-character')">&times;</button>
        </div>
        <div class="window-content" style="padding: 12px;"></div>
    </div>

    <div id="window-race-selector" class="ui-window draggable-window hidden" style="width: 400px; z-index: 2500;">
        <div class="window-header drag-handle">
            <span>Soul Transmutation</span>
            <button class="close-win" onclick="toggleWindow('window-race-selector')">&times;</button>
        </div>
        <div class="window-content" style="padding: 15px;">
            <p style="text-align: center; color: #ffca28; font-size: 11px; margin-top: 0; margin-bottom: 15px;">Select a race or forge a new one using fragments!</p>
            <div id="race-list-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 350px; overflow-y: auto;"></div>
        </div>
    </div>

    <div id="window-inventory" class="ui-window draggable-window hidden" style="width: 240px;">
        <div class="window-header drag-handle">
            <span>Inventory</span>
            <button class="close-win" onclick="toggleWindow('window-inventory')">&times;</button>
        </div>
        <div class="window-content" style="padding: 12px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; flex-shrink: 0;">
            <!-- FIX #3 — contador de slots -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:10px; color:rgba(255,255,255,0.3); letter-spacing:1px; text-transform:uppercase;">Bag</span>
                <span id="inv-slot-count" style="font-size:10px; font-family:'Courier New',monospace; color:rgba(255,255,255,0.4);">0 / 20</span>
            </div>
            <div class="bag-grid-layout" id="bag-container"></div>
            <div style="display:flex; justify-content:flex-end; padding-top:6px; border-top:1px solid rgba(255,255,255,0.04);">
                <span style="color:#ffca28; font-weight:bold; font-size:12px; display:flex; align-items:center; gap:5px;">
                    <span id="ui-bag-gold">0 DPI</span>
                </span>
            </div>
        </div>
    </div>

    <div id="window-loot" class="ui-window draggable-window hidden" style="left: 60%; top: 30%; width: 340px;">
        <div class="window-header drag-handle">
            <span>Monster Loot</span>
            <button class="close-win" onclick="closeLootWindow()">&times;</button>
        </div>
        <div class="window-content" id="loot-content-container" style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;"></div>
    </div>

    <div id="window-maps" class="ui-window draggable-window hidden" style="width: 300px;">
        <div class="window-header drag-handle"><span>Realm Travel</span><button class="close-win" onclick="toggleWindow('window-maps')">&times;</button></div>
        <div class="window-content" id="maps-container" style="display: flex; flex-direction: column; gap: 10px;"><button class="menu-btn disabled-btn">Loading Maps...</button></div>
    </div>
    
    <div id="window-settings" class="ui-window draggable-window hidden" style="width: 300px;">
        <div class="window-header drag-handle">
            <span>Settings</span><button class="close-win" onclick="toggleWindow('window-settings')">&times;</button>
        </div>
        <div class="window-content" style="padding:12px;">
            <label class="setting-row"><span>Edge Scrolling</span><input type="checkbox" id="toggle-edge-scroll" checked></label>
            <label class="setting-row"><span>Cursor HUD</span><input type="checkbox" id="toggle-cursor-ui" checked></label>
            <label class="setting-row"><span>Player Name</span><input type="checkbox" id="toggle-name" checked></label>
            <label class="setting-row"><span>Show Ping</span><input type="checkbox" id="toggle-ping"></label>
            <label class="setting-row"><span>Show FPS</span><input type="checkbox" id="toggle-fps"></label>
            <label class="setting-row"><span>Show Coords</span><input type="checkbox" id="toggle-coords"></label>
            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.08); margin: 20px 0 15px 0;">
            <button class="menu-btn" id="btn-logout" style="color: #ff4444; background: rgba(255,0,0,0.04);"><span style="font-size: 16px;">🚪</span> Disconnect</button>
        </div>
    </div>

    <!-- ===== HUD SUPERIOR ESQUERDO ===== -->
    <div class="phud" id="mini-hud">

        <!-- Avatar circular com anel decorativo -->
        <div class="phud-avatar-ring">
            <svg viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="35" cy="35" r="33" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
                <circle id="phud-ring" cx="35" cy="35" r="33"
                    stroke="rgba(200,50,50,0.65)" stroke-width="3"
                    stroke-dasharray="207.3" stroke-dashoffset="0"
                    stroke-linecap="round"
                    transform="rotate(-90 35 35)"
                    style="transition: stroke-dashoffset 0.3s ease, stroke 0.3s;"/>
            </svg>
            <!-- FIX #4 — clique na foto abre o Soul Transmutation -->
            <img id="mini-hud-photo" class="phud-photo" src="img/races/humano.png" alt=""
                 onclick="if(window.openRaceModal) window.openRaceModal()"
                 title="Click to Transmute Soul">
        </div>

        <!-- Barras HP / MP / EP -->
        <div class="phud-bars">

            <div class="phud-bar-row">
                <span class="phud-bar-label" style="color:rgba(220,80,80,0.8);">HP</span>
                <div class="phud-bar-track">
                    <div class="phud-bar-fill phud-fill-hp" id="mini-hp-bar" style="width:100%;"></div>
                    <span class="phud-bar-val" id="mini-hp-text"></span>
                </div>
            </div>

            <div class="phud-bar-row">
                <span class="phud-bar-label" style="color:rgba(80,150,230,0.8);">MP</span>
                <div class="phud-bar-track">
                    <div class="phud-bar-fill phud-fill-mp" id="mini-mp-bar" style="width:100%;"></div>
                    <span class="phud-bar-val" id="mini-mp-text"></span>
                </div>
            </div>

            <div class="phud-bar-row">
                <span class="phud-bar-label" style="color:rgba(240,160,0,0.8);">EP</span>
                <div class="phud-bar-track">
                    <div class="phud-bar-fill phud-fill-sp" id="mini-sp-bar" style="width:100%;"></div>
                    <span class="phud-bar-val" id="mini-sp-text"></span>
                </div>
            </div>

        </div>

        <!-- elementos fantasma para compatibilidade com o engine -->
        <div style="display:none;">
            <div id="bottom-hp-fill"></div><div id="bottom-mp-fill"></div>
            <span id="ui-hp-text"></span><span id="ui-mp-text"></span>
        </div>
    </div>

    <div class="hud-master-wrapper">

        <!-- Botões de menu -->
        <div class="hud-menu-btns">
            <button class="os-btn" onclick="toggleWindow('window-character')" title="[C] Character">👤</button>
            <button class="os-btn" onclick="toggleWindow('window-inventory')" title="[I] Inventory">🎒</button>
            <button class="os-btn" onclick="toggleWindow('window-maps')" title="[M] Maps">🗺️</button>
        </div>

        <!-- Skills + XP -->
        <div class="hud-core">
            <div class="skills-row">
                <div class="skill-mini-slot" id="skill-1" onclick="window.doAutoAttack && window.doAutoAttack()"><span class="key">1</span>⚔️</div>
                <div class="skill-mini-slot" id="skill-2"><span class="key">2</span></div>
                <div class="skill-mini-slot" id="skill-3"><span class="key">3</span></div>
                <div class="skill-mini-slot" id="skill-4"><span class="key">4</span></div>
                <div class="skill-mini-slot" id="skill-5"><span class="key">5</span></div>
            </div>
            <div class="hud-xp-row">
                <span class="hud-xp-text">LV <span id="ui-level-display">1</span></span>
                <div class="hud-xp-track">
                    <div class="hud-xp-fill" id="hud-xp-fill"></div>
                </div>
                <span class="hud-xp-text"><span id="ui-xp-percent">0.00%</span></span>
            </div>
        </div>

        <!-- Elementos legado escondidos — engine ainda referencia estes IDs -->
        <div style="display:none;">
            <div id="hud-xp-strip-fill"></div>
            <div id="phud-xp-bar"></div>
            <div id="phud-level-num"></div>
            <div id="ui-energy-text-wrap"><span id="ui-energy-text">100</span></div>
            <div class="hud-xp-panel"><div class="hud-xp-info"></div><div class="xp-segments"><?php for($i=0;$i<10;$i++) echo '<div class="xp-segment"><div class="xp-fill" id="xp-seg-'.$i.'"></div></div>'; ?></div></div>
        </div>
    </div>

    <button id="btn-settings-corner" class="corner-btn" onclick="toggleWindow('window-settings')" title="Settings">⚙️</button>

    <main class="game-area" id="gameArea">
        <div id="worldMap" class="world-map">
            <div id="safezone-mousepad" style="position: absolute; left: 2100px; top: 2200px; width: 800px; height: 600px; background: #12141a; border: 2px solid rgba(255,255,255,0.06); border-radius: 16px; display: flex; justify-content: center; align-items: center; z-index: 0;">
                <span style="color: #ffffff; font-size: 45px; font-weight: 900; letter-spacing: 15px; opacity: 0.05; user-select: none;">SAFEPAD</span>
            </div>
        </div>
    </main>

    <script>
        let isLoggingOut = false;
        document.getElementById('btn-logout').addEventListener('click', () => {
            if(confirm("Disconnect from The Realm?")) { isLoggingOut = true; window.location.href = 'index.php?logout=1'; }
        });
        window.addEventListener('beforeunload', (e) => { if (!isLoggingOut) { e.preventDefault(); e.returnValue = ''; } });
        
        let highestZ = 1500;
        let currentOpenBag = null;

        document.querySelectorAll('.ui-window').forEach(win => {
            win.addEventListener('mousedown', () => {
                highestZ++; win.style.zIndex = highestZ;
            });
        });

        function closeLootWindow() {
            document.getElementById('window-loot').classList.add('hidden');
            currentOpenBag = null;
        }

        function toggleWindow(winId) {
            const win = document.getElementById(winId);
            
            if (!win.classList.contains('hidden')) {
                win.classList.add('hidden'); 
                win.style.pointerEvents = 'none';
                if(winId === 'window-loot') currentOpenBag = null;
            } else {
                win.classList.remove('hidden'); 
                win.style.pointerEvents = 'auto';
                highestZ++; win.style.zIndex = highestZ;

                if (!win.dataset.positioned) {
                    const rect = win.getBoundingClientRect(); 
                    
                    if (winId === 'window-character') {
                        win.style.left = '20px'; win.style.top = '40px';
                    } else if (winId === 'window-inventory') {
                        let wWidth = rect.width || 320; 
                        win.style.left = (window.innerWidth - wWidth - 20) + 'px';
                        win.style.top = '40px';
                    } else if (winId === 'window-race-selector') {
                        let wWidth = rect.width || 400; 
                        win.style.left = (window.innerWidth - wWidth) / 2 + 'px';
                        win.style.top = '100px';
                    } else {
                        let wWidth = rect.width || 300; let wHeight = rect.height || 200;
                        win.style.left = (window.innerWidth - wWidth) / 2 + 'px';
                        win.style.top = (window.innerHeight - wHeight) / 2 + 'px';
                    }
                    win.dataset.positioned = "true";
                }

                if (winId === 'window-character' && typeof window.renderCharacterSheet === 'function') {
                    window.renderCharacterSheet();
                }
                if (winId === 'window-inventory' && typeof window.loadInventoryData === 'function') {
                    window.loadInventoryData();
                }
            }
        }
    </script>

    <script>
        (async function bootKursorSoulsEngine() {
            try {
                const response = await fetch('backend/api_scripts.php');
                if (!response.ok) throw new Error();
                const encryptedCode = await response.text();
                const binStr = atob(encryptedCode);
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
                const decodedCode = new TextDecoder('utf-8').decode(bytes);
                const engine = document.createElement('script');
                engine.type = 'text/javascript';
                engine.textContent = decodedCode;
                document.body.appendChild(engine);
                engine.remove();
            } catch (error) {
                alert("Failed to load game resources. Ensure your session is valid.");
            }
        })();
    </script>

    <script>
    // ============================================================
    // ATALHOS DE TECLADO GLOBAIS
    // ============================================================
    window.addEventListener('keydown', function(e) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        const k = e.key.toLowerCase();
        if (k === 'c') toggleWindow('window-character');
        if (k === 'i') toggleWindow('window-inventory');
        if (k === 'm') toggleWindow('window-maps');
        if (k === 'escape') {
            document.querySelectorAll('.ui-window:not(.hidden)').forEach(w => {
                if (parseInt(w.style.zIndex) === highestZ) toggleWindow(w.id);
            });
        }
    });

    // ============================================================
    // MINI-HUD: sincroniza anéis e barras com o engine
    // ============================================================
    (function() {
        window.updateMiniHud = function() {
            const hp    = window.playerCurrentHp  || 0;
            const maxHp = window.playerMaxHp      || 1;
            const mp    = window.playerMana        || 0;
            const maxMp = window.playerMaxMana     || 1;
            const sp    = window.playerEnergy      || 0;
            const maxSp = (window.playerData && window.playerData.max_energy) ? parseInt(window.playerData.max_energy) : 100;

            const hpPct = Math.max(0, Math.min(1, hp / maxHp));
            const mpPct = Math.max(0, Math.min(1, mp / maxMp));
            const spPct = Math.max(0, Math.min(1, sp / maxSp));

            const hpBar = document.getElementById('mini-hp-bar');
            const mpBar = document.getElementById('mini-mp-bar');
            const spBar = document.getElementById('mini-sp-bar');
            const hpTxt = document.getElementById('mini-hp-text');
            const mpTxt = document.getElementById('mini-mp-text');
            const spTxt = document.getElementById('mini-sp-text');

            if (hpBar) {
                hpBar.style.width = (hpPct * 100) + '%';
                if      (hpPct > 0.5)  hpBar.style.background = 'rgba(50,190,90,0.8)';
                else if (hpPct > 0.25) hpBar.style.background = 'rgba(210,150,0,0.8)';
                else                   hpBar.style.background = 'rgba(210,40,40,0.8)';
            }
            if (mpBar) mpBar.style.width = (mpPct * 100) + '%';
            if (spBar) spBar.style.width = (spPct * 100) + '%';

            // FIX #2 — floor para evitar decimais longos
            if (hpTxt) hpTxt.innerText = Math.floor(hp) + '/' + Math.floor(maxHp);
            if (mpTxt) mpTxt.innerText = Math.floor(mp) + '/' + Math.floor(maxMp);
            if (spTxt) spTxt.innerText = Math.floor(sp) + '/' + Math.floor(maxSp);

            // Anel SVG (segue HP)
            const ring = document.getElementById('phud-ring');
            if (ring) {
                const circ = 207.3;
                ring.style.strokeDashoffset = circ * (1 - hpPct);
                if      (hpPct > 0.5)  ring.style.stroke = 'rgba(50,190,90,0.65)';
                else if (hpPct > 0.25) ring.style.stroke = 'rgba(210,150,0,0.65)';
                else                   ring.style.stroke = 'rgba(210,40,40,0.65)';
            }
        };

        window._updatePhudXp = function() {
            const xpPct = window.playerNextLevelXp > 0
                ? Math.min(1, (window.playerXp || 0) / window.playerNextLevelXp) : 0;
            const xpFill = document.getElementById('hud-xp-fill');
            const xpPct2 = document.getElementById('ui-xp-percent');
            const lvDisp = document.getElementById('ui-level-display');
            if (xpFill)  xpFill.style.width  = (xpPct * 100) + '%';
            if (xpPct2)  xpPct2.innerText     = (xpPct * 100).toFixed(1) + '%';
            if (lvDisp && window.playerLevel) lvDisp.innerText = window.playerLevel;
        };

        window.updateMiniHudPhoto = function() {
            const photo = document.getElementById('mini-hud-photo');
            if (!photo) return;
            const spritePath = (window.playerData && window.playerData.sprite_path)
                ? window.playerData.sprite_path
                : 'img/races/humano.png';
            if (photo.src !== spritePath) photo.src = spritePath;
        };
        const _photoInterval = setInterval(() => {
            if (window.playerData && window.playerData.sprite_path) {
                window.updateMiniHudPhoto();
                clearInterval(_photoInterval);
            }
        }, 300);

        Object.defineProperty(window, 'updateHealthBars', {
            set: function(fn) { window._updateHealthBars = fn; },
            get: function() { return function() { if (window._updateHealthBars) window._updateHealthBars(); window.updateMiniHud(); }; }
        });
        Object.defineProperty(window, 'updateMpUI', {
            set: function(fn) { window._updateMpUI = fn; },
            get: function() { return function() { if (window._updateMpUI) window._updateMpUI(); window.updateMiniHud(); }; }
        });
        Object.defineProperty(window, 'updateEnergyUI', {
            set: function(fn) { window._updateEnergyUI = fn; },
            get: function() { return function() { if (window._updateEnergyUI) window._updateEnergyUI(); window.updateMiniHud(); }; }
        });
        Object.defineProperty(window, 'updateXpUI', {
            set: function(fn) { window._updateXpUI = fn; },
            get: function() { return function() { if (window._updateXpUI) window._updateXpUI(); if (window._updatePhudXp) window._updatePhudXp(); }; }
        });
    })();
    </script>
</body>
</html>
