<?php
// backend/admin/delete_monster.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
if ($id <= 0) { echo json_encode(['success' => false, 'error' => 'Invalid id']); exit; }

$row = $pdo->prepare("SELECT name FROM monsters WHERE id = ?");
$row->execute([$id]);
$name = $row->fetchColumn();

$pdo->prepare("DELETE FROM monsters WHERE id = ?")->execute([$id]);
adminLog($pdo, 'delete_monster', "id:$id", $name);
echo json_encode(['success' => true]);
