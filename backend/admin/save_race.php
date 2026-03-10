<?php
// backend/admin/save_race.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { echo json_encode(['success' => false, 'error' => 'No data']); exit; }

$fields = ['name','description','base_hp_modifier','base_damage_modifier','base_speed_modifier','sprite_path'];
$id = intval($data['id'] ?? 0);

if ($id > 0) {
    $sets = implode(', ', array_map(fn($f) => "`$f` = ?", $fields));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $vals[] = $id;
    $pdo->prepare("UPDATE races SET $sets WHERE id = ?")->execute($vals);
    adminLog($pdo, 'update_race', "id:$id", $data['name'] ?? '');
    echo json_encode(['success' => true, 'id' => $id]);
} else {
    $cols = implode(', ', array_map(fn($f) => "`$f`", $fields));
    $phs  = implode(', ', array_fill(0, count($fields), '?'));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $stmt = $pdo->prepare("INSERT INTO races ($cols) VALUES ($phs)");
    $stmt->execute($vals);
    $newId = $pdo->lastInsertId();
    adminLog($pdo, 'create_race', "id:$newId", $data['name'] ?? '');
    echo json_encode(['success' => true, 'id' => $newId]);
}
