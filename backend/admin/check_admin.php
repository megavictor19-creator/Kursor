<?php
// backend/admin/check_admin.php
// Include em todos os endpoints admin — garante sessão válida + flag is_admin
if (session_status() === PHP_SESSION_NONE) session_start();

if (!isset($_SESSION['player_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/../connection.php';

$stmt = $pdo->prepare("SELECT is_admin FROM players WHERE id = ?");
$stmt->execute([$_SESSION['player_id']]);
$row = $stmt->fetch();

if (!$row || empty($row['is_admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

// Helper para logar ações admin
function adminLog($pdo, $action, $target = null, $detail = null) {
    global $_SESSION;
    try {
        $s = $pdo->prepare("INSERT INTO admin_logs (admin_id, action, target, detail) VALUES (?,?,?,?)");
        $s->execute([$_SESSION['player_id'], $action, $target, $detail]);
    } catch (Exception $e) {}
}
