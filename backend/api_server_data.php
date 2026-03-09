<?php
header('Content-Type: application/json');
require_once 'connection.php';

try {
    $response = [
        'success' => true,
        'settings' => [],
        'status_effects' => [],
        'items' => [],
        'monsters' => []
    ];

    $stmtSettings = $pdo->query("SELECT config_key, config_value FROM global_settings");
    $settingsRaw = $stmtSettings->fetchAll();
    foreach ($settingsRaw as $row) {
        $response['settings'][$row['config_key']] = $row['config_value'];
    }

    $stmtEffects = $pdo->query("SELECT * FROM status_effects");
    $response['status_effects'] = $stmtEffects->fetchAll();

    $stmtItems = $pdo->query("SELECT * FROM item_templates");
    $response['items'] = $stmtItems->fetchAll();

    $stmtMobs = $pdo->query("SELECT * FROM monsters");
    $response['monsters'] = $stmtMobs->fetchAll();

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false, 
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>