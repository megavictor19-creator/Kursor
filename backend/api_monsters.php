<?php
header('Content-Type: application/json');
require_once 'connection.php';

$current_zone = 'Dark Forest';

try {
    $stmt = $pdo->prepare("SELECT name, sprite_path, base_hp, hp_regen, damage, defense, speed, attack_rate_ms, aggro_radius, move_set, exp_yield, gold_drop_min, gold_drop_max FROM monsters WHERE zone = ?");
    $stmt->execute([$current_zone]);
    $monsters = $stmt->fetchAll();

    if (!$monsters) {
        echo json_encode(["success" => false, "error" => "No monsters found in this zone."]);
        exit;
    }

    echo json_encode(["success" => true, "monsters" => $monsters], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
?>