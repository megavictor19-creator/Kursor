<?php
// backend/admin/save_monster.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { echo json_encode(['success' => false, 'error' => 'No data']); exit; }

$fields = ['name','sprite_path','base_hp','hp_regen','damage','defense','resistance',
           'crit_chance','max_energy','energy_regen_pct','heal_skill_pct','attack_rate_ms',
           'speed','aggro_radius','move_set','zone','exp_yield','droplist',
           'gold_drop_min','gold_drop_max'];

$id = isset($data['id']) ? intval($data['id']) : 0;

if ($id > 0) {
    // UPDATE
    $sets = implode(', ', array_map(fn($f) => "`$f` = ?", $fields));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $vals[] = $id;
    $pdo->prepare("UPDATE monsters SET $sets WHERE id = ?")->execute($vals);
    adminLog($pdo, 'update_monster', "id:$id", $data['name'] ?? '');
    echo json_encode(['success' => true, 'id' => $id]);
} else {
    // INSERT
    $cols = implode(', ', array_map(fn($f) => "`$f`", $fields));
    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $stmt = $pdo->prepare("INSERT INTO monsters ($cols) VALUES ($placeholders)");
    $stmt->execute($vals);
    $newId = $pdo->lastInsertId();
    adminLog($pdo, 'create_monster', "id:$newId", $data['name'] ?? '');
    echo json_encode(['success' => true, 'id' => $newId]);
}
