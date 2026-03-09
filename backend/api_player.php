<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['player_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$playerId = $_SESSION['player_id'];

try {
    require_once 'connection.php';
    
    $stmt = $pdo->prepare("
        SELECT 
            username, race, account_level, highest_race_level, IFNULL(kills, 0) as kills, IFNULL(gold, 0) as gold, 
            max_hp, current_hp, current_zone,
            crit_chance, max_energy, current_energy, energy_regen_pct, heal_skill_pct,
            IFNULL(max_mana, 100) as max_mana, IFNULL(current_mana, 100) as current_mana, IFNULL(mana_regen, 1.0) as mana_regen,
            attr_vitality, attr_power, attr_single_target, attr_area_damage, attr_melee, attr_range,
            attr_critical, attr_critical_damage, attr_resist, attr_dodge, attr_loot, attr_xp_bonus,
            IFNULL(stat_points, 0) as stat_points, IFNULL(stat_str, 0) as stat_str, 
            IFNULL(stat_dex, 0) as stat_dex, IFNULL(stat_con, 0) as stat_con, 
            IFNULL(stat_int, 0) as stat_int, IFNULL(stat_wis, 0) as stat_wis, 
            IFNULL(stat_cha, 0) as stat_cha, IFNULL(stat_aur, 0) as stat_aur
        FROM players 
        WHERE id = ?
    ");
    $stmt->execute([$playerId]);
    $player = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($player) {
        $imageName = strtolower(str_replace([' ', 'ã'], ['_', 'a'], $player['race'])) . '.png';
        $player['sprite_path'] = "img/races/{$imageName}";

        $stmtRace = $pdo->prepare("SELECT race_level, race_xp, skill_points, skill_levels_json FROM player_unlocked_races WHERE player_id = ? AND race_name = ?");
        $stmtRace->execute([$playerId, $player['race']]);
        $raceData = $stmtRace->fetch(PDO::FETCH_ASSOC);

        if ($raceData) {
            $player['race_level'] = (int)$raceData['race_level'];
            $player['race_xp'] = (int)$raceData['race_xp'];
            $player['skill_points'] = (int)$raceData['skill_points'];
            $player['skill_levels_json'] = $raceData['skill_levels_json'];
        } else {
            $stmtInsert = $pdo->prepare("INSERT INTO player_unlocked_races (player_id, race_name, race_level, race_xp, skill_points, skill_levels_json) VALUES (?, ?, 1, 0, 0, '{}')");
            $stmtInsert->execute([$playerId, $player['race']]);
            
            $player['race_level'] = 1;
            $player['race_xp'] = 0;
            $player['skill_points'] = 0;
            $player['skill_levels_json'] = '{}';
        }

        $player['next_level_xp'] = $player['race_level'] * 100;
        $player['pending_account_rewards'] = max(0, (int)$player['highest_race_level'] - (int)$player['account_level']);

        $stmtSkills = $pdo->prepare("SELECT * FROM skills_template WHERE race_owner = ? OR race_owner = 'All' ORDER BY id ASC");
        $stmtSkills->execute([$player['race']]);
        $player['skills'] = $stmtSkills->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'player' => $player]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Player not found']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>