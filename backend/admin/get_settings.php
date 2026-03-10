<?php
// backend/admin/get_settings.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['key'], $data['value'])) {
        echo json_encode(['success' => false, 'error' => 'Missing key/value']); exit;
    }
    $pdo->prepare("UPDATE global_settings SET config_value = ? WHERE config_key = ?")
        ->execute([$data['value'], $data['key']]);
    adminLog($pdo, 'update_setting', $data['key'], $data['value']);
    echo json_encode(['success' => true]);
} else {
    $settings = $pdo->query("SELECT * FROM global_settings ORDER BY config_key")->fetchAll();
    echo json_encode(['success' => true, 'settings' => $settings]);
}
