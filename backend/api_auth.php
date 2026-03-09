<?php
session_start();
header('Content-Type: application/json');
require_once 'connection.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

$action = $_POST['action'] ?? '';
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'error' => 'Username and password are required.']);
    exit;
}

try {
    if ($action === 'register') {
        $race = $_POST['race'] ?? 'Human'; 
        
        $stmt = $pdo->prepare("SELECT id FROM players WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'error' => 'This name is already taken in the Realm.']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("INSERT INTO players (username, password, race, level, xp, gold, max_hp, current_hp, current_zone, quadrant, is_alive) VALUES (?, ?, ?, 1, 0, 0, 100, 100, 'Dark Forest', 'B2', 1)");
        $stmt->execute([$username, $hashedPassword, $race]);
        
        $playerId = $pdo->lastInsertId();

        $stmtInv = $pdo->prepare("INSERT INTO inventory (player_id, item_name, rarity, item_type, category, is_equipped) VALUES (?, 'Basic Core', 'Common', 'Permanent', 'Core', 1)");
        $stmtInv->execute([$playerId]);

        $_SESSION['player_id'] = $playerId;
        $_SESSION['username'] = $username;

        echo json_encode(['success' => true]);

    } elseif ($action === 'login') {
        $stmt = $pdo->prepare("SELECT id, username, password FROM players WHERE username = ?");
        $stmt->execute([$username]);
        $player = $stmt->fetch();

        if ($player && password_verify($password, $player['password'])) {
            $_SESSION['player_id'] = $player['id'];
            $_SESSION['username'] = $player['username'];
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid username or password.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Unknown action.']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>