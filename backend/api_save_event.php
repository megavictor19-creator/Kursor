<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$playerId = $_SESSION['player_id'];
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!$data || !isset($data['event'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid payload']);
    exit;
}

try {
    require_once 'connection.php';
    if (!isset($pdo)) {
        $pdo = new PDO('mysql:host=127.0.0.1;dbname=kursor_souls;charset=utf8', 'root', '');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    
    if ($data['event'] === 'add_gold') {
        $stmt = $pdo->prepare("UPDATE players SET gold = IFNULL(gold, 0) + ? WHERE id = ?");
        $stmt->execute([$data['amount'], $playerId]);
        echo json_encode(['success' => true, 'action' => 'gold_saved']);
        
    } elseif ($data['event'] === 'update_stats') {
        $stmtRaceInfo = $pdo->prepare("SELECT race, highest_race_level FROM players WHERE id = ?");
        $stmtRaceInfo->execute([$playerId]);
        $pInfo = $stmtRaceInfo->fetch(PDO::FETCH_ASSOC);
        
        if($pInfo) {
            $race = $pInfo['race'];
            $xp = $data['xp'] ?? 0;
            $level = $data['level'] ?? 1;
            $kills = $data['kills'] ?? 0;
            $max_hp = $data['max_hp'] ?? 100;
            $current_hp = $data['current_hp'] ?? 100;
            
            $highestLevel = max((int)$pInfo['highest_race_level'], $level);

            $stmtRace = $pdo->prepare("UPDATE player_unlocked_races SET race_level = ?, race_xp = ? WHERE player_id = ? AND race_name = ?");
            $stmtRace->execute([$level, $xp, $playerId, $race]);

            $stmtPlayer = $pdo->prepare("UPDATE players SET highest_race_level = ?, kills = ?, max_hp = ?, current_hp = ? WHERE id = ?");
            $stmtPlayer->execute([$highestLevel, $kills, $max_hp, $current_hp, $playerId]);
            
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
        
    } elseif ($data['event'] === 'add_level_points') {
        $sp = (int)($data['skill_points'] ?? 0);
        $stp = (int)($data['stat_points'] ?? 0);

        if ($stp > 0) {
            $stmtUpdateStats = $pdo->prepare("UPDATE players SET stat_points = IFNULL(stat_points, 0) + ? WHERE id = ?");
            $stmtUpdateStats->execute([$stp, $playerId]);
        }

        if ($sp > 0) {
            $stmtRaceInfo = $pdo->prepare("SELECT race FROM players WHERE id = ?");
            $stmtRaceInfo->execute([$playerId]);
            $pInfo = $stmtRaceInfo->fetch(PDO::FETCH_ASSOC);
            if($pInfo) {
                $stmtRace = $pdo->prepare("UPDATE player_unlocked_races SET skill_points = IFNULL(skill_points, 0) + ? WHERE player_id = ? AND race_name = ?");
                $stmtRace->execute([$sp, $playerId, $pInfo['race']]);
            }
        }
        echo json_encode(['success' => true]);
        
    } elseif ($data['event'] === 'add_skill_point') {
        $sp = (int)($data['points'] ?? 1);
        $stmtRaceInfo = $pdo->prepare("SELECT race FROM players WHERE id = ?");
        $stmtRaceInfo->execute([$playerId]);
        $pInfo = $stmtRaceInfo->fetch(PDO::FETCH_ASSOC);
        if($pInfo) {
            $stmtRace = $pdo->prepare("UPDATE player_unlocked_races SET skill_points = IFNULL(skill_points, 0) + ? WHERE player_id = ? AND race_name = ?");
            $stmtRace->execute([$sp, $playerId, $pInfo['race']]);
        }
        echo json_encode(['success' => true]);

    } elseif ($data['event'] === 'allocate_stat_point') {
        $allowedStats = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'aur'];
        $stat = strtolower($data['stat'] ?? '');
        
        if (in_array($stat, $allowedStats)) {
            $stmtCheck = $pdo->prepare("SELECT stat_points, stat_$stat FROM players WHERE id = ?");
            $stmtCheck->execute([$playerId]);
            $pData = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if ($pData && $pData['stat_points'] > 0) {
                $stmtUpdate = $pdo->prepare("UPDATE players SET stat_points = stat_points - 1, stat_$stat = IFNULL(stat_$stat, 0) + 1 WHERE id = ?");
                $stmtUpdate->execute([$playerId]);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'No stat points available']);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid stat']);
        }

    } elseif ($data['event'] === 'claim_account_reward') {
        $type = $data['reward_type'] ?? '';
        $val = $data['reward_value'] ?? 0;
        
        $stmtCheck = $pdo->prepare("SELECT account_level, highest_race_level FROM players WHERE id = ?");
        $stmtCheck->execute([$playerId]);
        $pInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        
        $pending = max(0, (int)$pInfo['highest_race_level'] - (int)$pInfo['account_level']);
        
        if ($pending > 0) {
            if ($type === 'attribute') {
                $attrCol = 'attr_' . $val;
                $stmtUp = $pdo->prepare("UPDATE players SET account_level = account_level + 1, $attrCol = IFNULL($attrCol, 0) + 1 WHERE id = ?");
                $stmtUp->execute([$playerId]);
            } elseif ($type === 'gold') {
                $stmtUp = $pdo->prepare("UPDATE players SET account_level = account_level + 1, gold = IFNULL(gold, 0) + ? WHERE id = ?");
                $stmtUp->execute([(int)$val, $playerId]);
            } elseif ($type === 'item') {
                $itemName = $data['item_name'];
                $rarity = $data['rarity'];
                $cat = $data['category'];
                
                $stmtUp = $pdo->prepare("UPDATE players SET account_level = account_level + 1 WHERE id = ?");
                $stmtUp->execute([$playerId]);
                
                $stmtInv = $pdo->prepare("INSERT INTO inventory (player_id, item_name, rarity, item_type, category) VALUES (?, ?, ?, 'Material', ?)");
                $stmtInv->execute([$playerId, $itemName, $rarity, $cat]);
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'No pending rewards']);
        }
        
    } elseif ($data['event'] === 'upgrade_skill') {
        $skillName = $data['skill_name'] ?? '';
        
        $stmtCheck = $pdo->prepare("SELECT race FROM players WHERE id = ?");
        $stmtCheck->execute([$playerId]);
        $pInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);
        
        if($pInfo) {
            $stmtRace = $pdo->prepare("SELECT skill_points, skill_levels_json FROM player_unlocked_races WHERE player_id = ? AND race_name = ?");
            $stmtRace->execute([$playerId, $pInfo['race']]);
            $rData = $stmtRace->fetch(PDO::FETCH_ASSOC);
            
            if ($rData && $rData['skill_points'] > 0) {
                $levels = json_decode($rData['skill_levels_json'], true);
                if (!is_array($levels)) $levels = [];
                
                $levels[$skillName] = isset($levels[$skillName]) ? $levels[$skillName] + 1 : 2;
                
                $newJson = json_encode($levels);
                $stmtUp = $pdo->prepare("UPDATE player_unlocked_races SET skill_points = skill_points - 1, skill_levels_json = ? WHERE player_id = ? AND race_name = ?");
                $stmtUp->execute([$newJson, $playerId, $pInfo['race']]);
                
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'No skill points available']);
            }
        }
        
    } else {
        echo json_encode(['success' => false, 'error' => 'Unknown event']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>