<?php
// backend/admin/get_skills.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$skills = $pdo->query("SELECT * FROM skills_template ORDER BY race_owner, id")->fetchAll();
echo json_encode(['success' => true, 'skills' => $skills]);
