<?php
// backend/admin/save_skill.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { echo json_encode(['success' => false, 'error' => 'No data']); exit; }

$fields = ['race_owner','skill_name','skill_type','keyboard_key','mana_cost','cooldown_ms','base_damage','icon_path','description'];
$id = intval($data['id'] ?? 0);

if ($id > 0) {
    $sets = implode(', ', array_map(fn($f) => "`$f` = ?", $fields));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $vals[] = $id;
    $pdo->prepare("UPDATE skills_template SET $sets WHERE id = ?")->execute($vals);
    adminLog($pdo, 'update_skill', "id:$id", $data['skill_name'] ?? '');
    echo json_encode(['success' => true, 'id' => $id]);
} else {
    $cols = implode(', ', array_map(fn($f) => "`$f`", $fields));
    $phs  = implode(', ', array_fill(0, count($fields), '?'));
    $vals = array_map(fn($f) => $data[$f] ?? null, $fields);
    $stmt = $pdo->prepare("INSERT INTO skills_template ($cols) VALUES ($phs)");
    $stmt->execute($vals);
    $newId = $pdo->lastInsertId();
    adminLog($pdo, 'create_skill', "id:$newId", $data['skill_name'] ?? '');
    echo json_encode(['success' => true, 'id' => $newId]);
}
