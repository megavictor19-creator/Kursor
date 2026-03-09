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

        .ui-window { position: absolute; background: rgba(12, 14, 18, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; z-index: 1500; display: flex; flex-direction: column; backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); box-shadow: 0 15px 40px rgba(0,0,0,0.8); transition: opacity 0.2s ease-out, transform 0.2s ease-out; transform: translateY(0) scale(1); overflow: hidden; max-height: 85vh; }
        .ui-window.hidden { opacity: 0; pointer-events: none; transform: translateY(-10px) scale(0.95); }
        
        .drag-handle { cursor: grab; } .drag-handle:active { cursor: grabbing; }

        .window-header { display: flex; justify-content: center; align-items: center; position: relative; padding: 10px 20px; background: linear-gradient(90deg, rgba(10,12,16,0.9), rgba(20,24,32,0.9)); border-bottom: 1px solid rgba(0, 229, 255, 0.4); font-weight: 400; color: #c4c9cd; letter-spacing: 2px; text-transform: uppercase; font-size: 11px; box-shadow: 0 2px 10px rgba(0,229,255,0.05); width: 100%; box-sizing: border-box; flex-shrink: 0; }
        
        .close-win { position: absolute; right: 10px; top: 6px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: #888; font-size: 16px; cursor: pointer; font-weight: 300; transition: all 0.2s; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; padding-bottom: 2px; z-index: 10; }
        .close-win:hover { color: #fff; background: rgba(255, 42, 42, 0.8); border-color: #ff2a2a; box-shadow: 0 4px 12px rgba(255,42,42,0.5); transform: translateY(-2px); }
        
        .char-preview-box { width: 90px; height: 90px; background: radial-gradient(circle, rgba(196, 201, 205, 0.08) 0%, rgba(0,0,0,0) 70%); border-bottom: 1px solid rgba(196, 201, 205, 0.2); display: flex; justify-content: center; align-items: center; position: relative; margin: 0 auto 10px auto; border-radius: 50%; }
        .char-preview-box img { width: 65px; height: 65px; object-fit: contain; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.8)); }

        .player-mini-stats { width: 100%; font-size: 11px; background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.03); box-sizing: border-box; }
        
        .stat-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 6px 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.02); border-radius: 6px; color: #aaa; transition: 0.2s; }
        .stat-line:hover { background: rgba(0, 229, 255, 0.05); border-color: rgba(0, 229, 255, 0.2); color: #ccc; }
        .stat-line:last-child { margin-bottom: 0; }
        .highlight { font-weight: 400; color: #fff; }

        .section-title { font-weight: 400; letter-spacing: 2px; font-size: 10px; color: #00e5ff; text-align: center; margin-bottom: 12px; text-transform: uppercase; display: flex; align-items: center; gap: 10px; opacity: 0.9; }
        .section-title::before, .section-title::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent); }

        .equip-grid-layout { display: flex; justify-content: center; gap: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 12px; margin-bottom: 15px; }
        .bag-grid-layout { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 12px; justify-items: center; }

        .slot { width: 40px; height: 40px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 18px; cursor: pointer; transition: 0.2s; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); position: relative; }
        .slot:hover { border-color: rgba(0,229,255,0.5); background: rgba(0,229,255,0.05); transform: scale(1.05); box-shadow: 0 0 10px rgba(0,229,255,0.2); z-index: 10; }
        .slot.empty-slot { opacity: 0.4; border-style: dashed; filter: grayscale(100%); }
        
        .bag-slot.drag-over { border: 2px dashed #00e5ff !important; transform: scale(1.1); z-index: 20; background: rgba(0, 229, 255, 0.1) !important; }

        .item-stack-count { position: absolute; top: -6px; right: -6px; background: #ff2a2a; color: #fff; font-family: 'Courier New', monospace; font-size: 9px; font-weight: bold; padding: 2px 4px; border-radius: 4px; border: 1px solid #ffca28; box-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 5; pointer-events: none; letter-spacing: 0; }
        .fragment-img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 0 4px #00e5ff) hue-rotate(180deg) saturate(1.5); transform: scale(0.8); pointer-events: none; }

        .menu-btn { width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.03); color: #ccc; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; cursor: pointer; font-weight: 300; letter-spacing: 1px; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 12px; }
        .menu-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
        .setting-row { display: flex; justify-content: space-between; align-items: center; color: #ccc; font-weight: 300; font-size: 13px; margin-bottom: 10px; }

        .race-list-item { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; transition: 0.2s; }
        .race-list-item:hover { background: rgba(0, 229, 255, 0.05); border-color: rgba(0, 229, 255, 0.3); transform: translateX(5px); }
        .race-list-item img { width: 45px; height: 45px; object-fit: contain; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8)); margin-right: 15px; }
        .race-list-item.locked { opacity: 0.5; filter: grayscale(100%); pointer-events: none; }
        .btn-equip-race { background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.4); color: #00e5ff; padding: 6px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; text-transform: uppercase; transition: 0.2s; }
        .btn-equip-race:hover { background: #00e5ff; color: #000; box-shadow: 0 0 15px rgba(0, 229, 255, 0.6); }

        .hud-master-wrapper { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 10px; z-index: 2000; }
        .hud-side-drawer { display: flex; background: rgba(10, 12, 16, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 0; gap: 5px; transition: width 0.3s, opacity 0.3s, padding 0.3s, margin 0.3s; overflow: hidden; width: 0px; opacity: 0; margin-right: -10px; white-space: nowrap; height: 50px; align-items: center; justify-content: center; }
        .hud-side-drawer.open { width: 135px; opacity: 1; padding: 0 5px; margin-right: 0; border-color: rgba(255,255,255,0.15); box-shadow: 0 5px 20px rgba(0,0,0,0.6); } 
        
        .os-btn { background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; width: 38px; height: 38px; font-size: 20px; line-height: 1; filter: saturate(1.2); }
        .os-btn:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); transform: translateY(-2px); }

        .drawer-toggle-btn { background: rgba(10, 12, 16, 0.8); border: 1px solid rgba(255,255,255,0.05); color: #aaa; border-radius: 8px; width: 25px; height: 50px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; backdrop-filter: blur(10px); font-size: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .drawer-toggle-btn:hover { color: #fff; background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }

        .hud-core { display: flex; flex-direction: column; align-items: center; gap: 12px; }

        .skills-row { display: flex; gap: 12px; }
        .skill-mini-slot { width: 46px; height: 46px; background: rgba(10,12,16,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; position: relative; cursor: pointer; box-shadow: 0 6px 15px rgba(0,0,0,0.6); transition: 0.2s; display: flex; justify-content: center; align-items: center; font-size: 18px; }
        .skill-mini-slot:hover { border-color: rgba(0, 229, 255, 0.5); transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0, 229, 255, 0.3); }
        .skill-mini-slot .key { position: absolute; top: -8px; left: -8px; background: #1a1c23; color: #fff; border: 1px solid #444; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; z-index: 15; box-shadow: 0 2px 4px rgba(0,0,0,0.5); text-shadow: 1px 1px 0 #000; }

        .stats-panel { width: 480px; background: rgba(10, 12, 16, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 10px 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.8); }

        .global-bars { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .global-bar-container { position: relative; width: 100%; background: rgba(0,0,0,0.8); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; display: flex; align-items: center; height: 14px; }
        
        .bar-label { position: absolute; left: 8px; font-weight: 600; font-size: 9px; color: rgba(255,255,255,0.8); z-index: 2; letter-spacing: 1px; text-shadow: 1px 1px 0 #000; }
        .bar-value { position: absolute; right: 8px; font-weight: bold; font-size: 10px; color: rgba(255,255,255,0.9); z-index: 2; text-shadow: 1px 1px 0 #000; font-family: 'Courier New', monospace; }
        
        .global-hp-fill { height: 100%; background: linear-gradient(90deg, rgba(0, 168, 67, 0.6), rgba(42, 255, 113, 0.8)); transition: width 0.2s; position: absolute; left: 0; top: 0; }
        .global-mp-fill { height: 100%; background: linear-gradient(90deg, rgba(0, 119, 255, 0.6), rgba(0, 212, 255, 0.8)); transition: width 0.2s; position: absolute; left: 0; top: 0; }

        .hud-xp-container { margin-top: 8px; width: 100%; display: flex; flex-direction: column; gap: 4px; }
        .xp-info { text-align: center; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 1px; color: #fff; text-shadow: 1px 1px 0 #000; }
        .xp-segments { display: flex; gap: 2px; height: 5px; width: 100%; }
        .xp-segment { flex: 1; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .xp-fill { height: 100%; width: 0%; background: linear-gradient(90deg, rgba(156, 39, 176, 0.7), rgba(224, 64, 251, 0.8)); box-shadow: 0 0 5px rgba(224, 64, 251, 0.5); transition: width 0.2s linear; }

        .energy-badge { background: rgba(10, 12, 16, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 202, 40, 0.3); border-radius: 12px; padding: 0 10px; height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #ffca28; font-weight: bold; font-size: 10px; text-shadow: 0 1px 2px #000; letter-spacing: 1px; box-shadow: 0 5px 20px rgba(0,0,0,0.6); }
        .energy-badge span { font-size: 15px; color: #fff; }

        .corner-btn { position: fixed; bottom: 20px; right: 20px; background: rgba(10, 12, 16, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 45px; height: 45px; font-size: 22px; display: flex; justify-content: center; align-items: center; padding-bottom: 2px; cursor: pointer; z-index: 2000; transition: 0.2s; backdrop-filter: blur(10px); box-shadow: 0 5px 15px rgba(0,0,0,0.6); }
        .corner-btn:hover { transform: scale(1.15) rotate(45deg); border-color: rgba(0, 229, 255, 0.5); box-shadow: 0 0 15px rgba(0, 229, 255, 0.4); color: #fff; }

        .game-area { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; cursor: none; z-index: 1; background-color: #0b140d; }
        .world-map { position: absolute; top: 0; left: 0; width: 5000px; height: 5000px; background-color: #161a22; background-image: linear-gradient(#1e2430 2px, transparent 2px), linear-gradient(90deg, #1e2430 2px, transparent 2px); background-size: 80px 80px; transform-origin: 0 0; will-change: transform; backface-visibility: hidden; }

        .chat-container { position: absolute; left: 10px; bottom: 15px; width: 280px; height: 200px; background: rgba(12, 14, 18, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; display: flex; flex-direction: column; z-index: 1000; overflow: hidden; transition: opacity 0.3s, background 0.3s; opacity: 0.6; }
        .chat-container:hover, .chat-container.active { background: rgba(12, 14, 18, 0.8); opacity: 1; border-color: rgba(255,255,255,0.15); }
        .chat-tabs { display: flex; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .chat-tab { flex: 1; text-align: center; padding: 6px 0; font-size: 10px; font-weight: 600; color: #777; text-transform: uppercase; cursor: pointer; transition: 0.2s; border-bottom: 2px solid transparent; }
        .chat-tab:hover { color: #ccc; background: rgba(255,255,255,0.02); }
        .chat-tab.active { color: #c4c9cd; border-bottom-color: #c4c9cd; background: rgba(196, 201, 205, 0.05); }
        .chat-messages { flex-grow: 1; padding: 8px; overflow-y: auto; font-size: 12px; color: #ccc; display: flex; flex-direction: column; gap: 4px; font-family: 'Segoe UI', Tahoma, sans-serif; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
        .chat-input-wrapper { background: rgba(0,0,0,0.5); padding: 6px 8px; border-top: 1px solid rgba(255,255,255,0.05); }
        .chat-input { width: 100%; background: transparent; border: none; color: #fff; font-size: 12px; outline: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
        .chat-input::placeholder { color: rgba(255,255,255,0.2); }
        #death-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5, 0, 0, 0.95); z-index: 9999; display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 1.5s ease-in-out; }
        #death-screen h1 { color: #ff2a2a; font-size: 80px; letter-spacing: 15px; font-weight: 300; margin-bottom: 20px; text-shadow: 0 0 30px rgba(255,0,0,0.8); }
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

    <div id="top-info-hud" style="position: absolute; top: 15px; right: 20px; display: flex; flex-direction: column; gap: 6px; text-align: right; font-family: 'Courier New', Courier, monospace; font-size: 13px; font-weight: bold; color: #00e5ff; text-shadow: 0 0 8px rgba(0,229,255,0.6); pointer-events: none; z-index: 2000;">
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

    <div id="window-character" class="ui-window draggable-window hidden" style="width: 600px; max-width: 95vw;">
        <div class="window-header drag-handle">
            <span>Character Sheet</span>
            <button class="close-win" onclick="toggleWindow('window-character')">&times;</button>
        </div>
        <div class="window-content" style="display: flex; padding: 15px; flex-wrap: wrap;"></div>
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

    <div id="window-inventory" class="ui-window draggable-window hidden" style="width: 320px; max-width: 95vw;">
        <div class="window-header drag-handle">
            <span>Inventory</span>
            <button class="close-win" onclick="toggleWindow('window-inventory')">&times;</button>
        </div>
        <div class="window-content" style="padding: 15px; overflow-y: auto; display: flex; flex-direction: column; height: calc(100% - 40px);">
            <h4 class="section-title" style="margin-top: 0;">Equipment</h4>
            <div class="equip-grid-layout" style="margin-bottom: 20px;">
                <div class="slot empty-slot" id="eq-pet" title="Pet">🐲</div>
                <div class="slot empty-slot" id="eq-wing" title="Wing">🪽</div>
                <div class="slot empty-slot" id="eq-aura" title="Aura">✨</div>
                <div class="slot empty-slot" id="eq-trail" title="Trail">☄️</div>
                <div class="slot empty-slot" id="eq-halo" title="Halo">💫</div>
            </div>
            
            <h4 class="section-title" style="margin: 0 0 10px 0;">Bag</h4>
            <div class="bag-grid-layout" id="bag-container" style="flex-grow: 1; margin-bottom: 15px;"></div>
            
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: auto; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <div style="background: rgba(0,0,0,0.6); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255, 202, 40, 0.3); color: #ffca28; font-weight: bold; font-size: 13px; text-shadow: 0 1px 2px #000; display: flex; align-items: center; gap: 8px;">
                    <img src="img/items/gold_coins.png" alt="DPI" style="width: 16px; height: 16px; filter: drop-shadow(0 0 2px #ffca28);" onerror="this.style.display='none'">
                    <span id="ui-bag-gold">-- DPI</span>
                </div>
            </div>
        </div>
    </div>

    <div id="window-loot" class="ui-window draggable-window hidden" style="left: 60%; top: 30%; width: 340px;">
        <div class="window-header drag-handle">
            <span>🎒 Monster Loot</span>
            <span style="color: #ffca28; font-weight: bold; font-size: 12px; margin-right: 15px;" id="loot-energy-display">EP 100</span>
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
        <div class="window-content">
            <label class="setting-row"><span>Edge Scrolling</span><input type="checkbox" id="toggle-edge-scroll" checked></label>
            <label class="setting-row"><span>Cursor HUD</span><input type="checkbox" id="toggle-cursor-ui" checked></label>
            <label class="setting-row"><span>Player Name</span><input type="checkbox" id="toggle-name" checked></label>
            <label class="setting-row"><span>Show Ping</span><input type="checkbox" id="toggle-ping"></label>
            <label class="setting-row"><span>Show FPS</span><input type="checkbox" id="toggle-fps"></label>
            <label class="setting-row"><span>Show Coords</span><input type="checkbox" id="toggle-coords"></label>
            <hr style="border: 0; border-top: 1px dashed rgba(255,255,255,0.1); margin: 20px 0 15px 0;">
            <button class="menu-btn" id="btn-logout" style="color: #ff4444; border-color: rgba(255,68,68,0.2); background: rgba(255,0,0,0.05);"><span style="font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">🚪</span> Disconnect</button>
        </div>
    </div>

    <div class="hud-master-wrapper">
        <div class="hud-side-drawer" id="hud-drawer">
            <button class="os-btn" onclick="toggleWindow('window-character')" title="Character Info">👤</button>
            <button class="os-btn" onclick="toggleWindow('window-inventory')" title="Inventory & Equipment">🎒</button>
            <button class="os-btn" onclick="toggleWindow('window-maps')" title="Maps">🗺️</button>
        </div>
        <div class="drawer-toggle-btn" id="drawer-toggle" onclick="toggleDrawer()">◀</div>

        <div class="hud-core">
            <div class="skills-row">
                <div class="skill-mini-slot" id="skill-1" onclick="window.doAutoAttack && window.doAutoAttack()"><span class="key">1/MB1</span>⚔️</div>
                <div class="skill-mini-slot" id="skill-2"><span class="key">2</span></div>
                <div class="skill-mini-slot" id="skill-3"><span class="key">3</span></div>
                <div class="skill-mini-slot" id="skill-4"><span class="key">4</span></div>
                <div class="skill-mini-slot" id="skill-5"><span class="key">5</span></div>
            </div>
            
            <div class="stats-panel">
                <div class="global-bars">
                    <div class="global-bar-container hp-container">
                        <span class="bar-label">HP</span><span class="bar-value" id="ui-hp-text">100 / 100</span>
                        <div class="global-hp-fill" id="bottom-hp-fill" style="width: 100%;"></div>
                    </div>
                    <div class="global-bar-container mp-container">
                        <span class="bar-label">MP</span><span class="bar-value" id="ui-mp-text">100 / 100</span>
                        <div class="global-mp-fill" id="bottom-mp-fill" style="width: 100%;"></div>
                    </div>
                </div>
                <div class="hud-xp-container">
                    <div class="xp-info">
                        <span style="color: #e040fb; font-weight: bold;">LVL <span id="ui-level-display">1</span></span>
                        <span style="color: #aaa; margin-left: 10px;">XP: <span id="ui-xp-percent">0.000%</span></span>
                    </div>
                    <div class="xp-segments">
                        <?php for($i=0; $i<10; $i++) echo '<div class="xp-segment"><div class="xp-fill" id="xp-seg-'.$i.'"></div></div>'; ?>
                    </div>
                </div>
            </div>
        </div>

        <div class="energy-badge">EP<span id="ui-energy-text">100</span></div>
    </div>

    <button id="btn-settings-corner" class="corner-btn" onclick="toggleWindow('window-settings')" title="Settings">⚙️</button>

    <main class="game-area" id="gameArea">
        <div id="worldMap" class="world-map">
            <div id="safezone-mousepad" style="position: absolute; left: 2100px; top: 2200px; width: 800px; height: 600px; background: #12141a; border: 4px solid #2a2a35; border-radius: 20px; box-shadow: inset 0 0 50px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 0; background-image: radial-gradient(#1e2430 1px, transparent 1px); background-size: 10px 10px;">
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

        function toggleDrawer() {
            const drawer = document.getElementById('hud-drawer');
            const btn = document.getElementById('drawer-toggle');
            drawer.classList.toggle('open');
            if(drawer.classList.contains('open')) {
                btn.innerText = '▶'; btn.style.color = '#fff';
            } else {
                btn.innerText = '◀'; btn.style.color = '#aaa';
            }
        }

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
                for (let i = 0; i < binStr.length; i++) {
                    bytes[i] = binStr.charCodeAt(i);
                }
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
</body>
</html>