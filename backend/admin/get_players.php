<?php
// backend/admin/get_players.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$players = $pdo->query("
    SELECT id, username, race, level, xp, gold, kills, max_hp, current_hp,
           max_mana, current_mana, max_energy, current_energy, is_alive, is_admin,
           current_zone, last_update, sprite_path, stat_points,
           stat_str, stat_dex, stat_con, stat_int, stat_wis, stat_cha, stat_aur,
           attr_vitality, attr_power, attr_single_target, attr_area_damage,
           attr_critical, attr_critical_damage, attr_resist, attr_dodge, attr_loot, attr_xp_bonus
    FROM players ORDER BY id
")->fetchAll();

echo json_encode(['success' => true, 'players' => $players]);
