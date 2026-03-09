<?php
session_start();

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}

if (isset($_SESSION['player_id'])) {
    header("Location: game.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kursor Souls - Hardcore MMORPG</title>
    <link rel="stylesheet" href="css/home.css">
    <style>
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); justify-content: center; align-items: center; backdrop-filter: blur(5px); }
        .modal-content { background: #12151c; border: 2px solid #2a2a35; padding: 30px; border-radius: 8px; width: 350px; text-align: center; position: relative; box-shadow: 0 0 20px rgba(0,0,0,0.8); }
        .close-btn { position: absolute; top: 10px; right: 15px; color: #ff4444; font-size: 24px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .close-btn:hover { color: #ff2a2a; transform: scale(1.1); }
        .modal h2 { color: #ffae00; margin-bottom: 20px; letter-spacing: 2px; }
        .form-group { margin-bottom: 15px; text-align: left; }
        .form-group label { display: block; color: #aaa; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; font-weight: bold; }
        .form-group input { width: 100%; padding: 10px; background: #0a0c11; border: 1px solid #333; color: #fff; border-radius: 4px; outline: none; transition: 0.2s; }
        .form-group input:focus { border-color: #ffae00; box-shadow: 0 0 5px rgba(255, 174, 0, 0.3); }
        .btn-submit { width: 100%; padding: 12px; background: #ffae00; color: #111; border: none; font-weight: bold; cursor: pointer; border-radius: 4px; margin-top: 10px; text-transform: uppercase; transition: 0.2s; }
        .btn-submit:hover { background: #ffc133; box-shadow: 0 0 10px rgba(255, 174, 0, 0.5); }
        .error-msg { color: #ff4444; font-size: 12px; margin-top: 10px; display: none; font-weight: bold; text-align: center; }
        
        .race-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
        .race-card { background: #1a1e26; border: 2px solid #333; border-radius: 6px; padding: 10px; cursor: pointer; transition: 0.2s; text-align: center; }
        .race-card:hover { border-color: #555; }
        .race-card.active { border-color: #ffae00; background: #2a2a35; box-shadow: 0 0 10px rgba(255, 174, 0, 0.3); }
        .race-card img { width: 45px; height: 45px; object-fit: contain; margin-bottom: 5px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); }
        .race-card span { display: block; color: #ccc; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .race-card.active span { color: #ffae00; }
    </style>
</head>
<body>
    <div class="forest-floor"></div>
    <div class="toxic-fog"></div>

    <nav class="top-bar">
        <div class="logo-area">
            <span class="logo-icon">🗡️</span>
            <span class="logo-text">KURSOR SOULS</span>
        </div>
        <div class="auth-buttons">
            <button class="btn btn-login" id="btnLogin">Login</button>
            <button class="btn btn-register" id="btnRegister">Create Account</button>
        </div>
    </nav>

    <main class="hero-container">
        <h1 class="game-title">KURSOR SOULS</h1>
        <h2 class="game-subtitle">Point. Survive. Lose Everything. Repeat.</h2>
        <p class="game-desc">The first hardcore MMORPG where your cursor is the character. Equip your wings, forge your jewels, and try to survive the power of ephemeral items.</p>
        
        <button class="btn-play" id="btnPlayNow">START JOURNEY</button>
    </main>

    <div id="authModal" class="modal">
        <div class="modal-content">
            <span class="close-btn" id="closeModal">&times;</span>
            <h2 id="modalTitle">LOGIN</h2>
            
            <form id="authForm">
                <input type="hidden" id="authAction" value="login">
                
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username" required autocomplete="off" placeholder="Your hero name">
                </div>
                
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required placeholder="••••••••">
                </div>
                
                <div class="form-group" id="raceSelectGroup" style="display: none;">
                    <label>Choose your Race</label>
                    <div class="race-grid">
                        <div class="race-card active" onclick="selectRace('Human', this)">
                            <img src="img/races/humano.png" alt="Human">
                            <span>Human</span>
                        </div>
                        <div class="race-card" onclick="selectRace('Orc', this)">
                            <img src="img/races/orc.png" alt="Orc">
                            <span>Orc</span>
                        </div>
                        <div class="race-card" onclick="selectRace('Elf', this)">
                            <img src="img/races/elfo.png" alt="Elf">
                            <span>Elf</span>
                        </div>
                        <div class="race-card" onclick="selectRace('Dwarf', this)">
                            <img src="img/races/anao.png" alt="Dwarf">
                            <span>Dwarf</span>
                        </div>
                    </div>
                    <input type="hidden" id="race" value="Human">
                    <script>
                        function selectRace(raceName, element) {
                            document.getElementById('race').value = raceName;
                            document.querySelectorAll('.race-card').forEach(c => c.classList.remove('active'));
                            element.classList.add('active');
                        }
                    </script>
                </div>
                
                <button type="submit" class="btn-submit" id="submitBtn">ENTER REALM</button>
                <div class="error-msg" id="errorMsg"></div>
            </form>
        </div>
    </div>

    <script src="js/home_auth.js"></script>
</body>
</html>