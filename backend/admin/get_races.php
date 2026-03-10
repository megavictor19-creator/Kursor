<?php
// backend/admin/get_races.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$races = $pdo->query("SELECT * FROM races ORDER BY id")->fetchAll();
echo json_encode(['success' => true, 'races' => $races]);
