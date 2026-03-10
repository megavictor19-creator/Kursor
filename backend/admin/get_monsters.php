<?php
// backend/admin/get_monsters.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$monsters = $pdo->query("SELECT * FROM monsters ORDER BY zone, name")->fetchAll();
echo json_encode(['success' => true, 'monsters' => $monsters]);
