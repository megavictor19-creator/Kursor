<?php
// backend/admin/edit_player.php
header('Content-Type: application/json');
require_once __DIR__ . '/check_admin.php';

$data = json_decode(file_get_contents('php://input'), true);
$id   = intval($data['id'] ?? 0);
if ($id <= 0) { echo json_encode(['success' => false, 'error' => 'Invalid id']); exit; }

$allowed = ['level','xp','gold','kills','max_hp','current_hp','max_mana','current_mana',
            'max_energy','current_energy','is_alive','current_zone','race','sprite_path',
            'stat_points','stat_str','stat_dex','stat_con','stat_int','stat_wis','stat_cha','stat_aur'];

$sets = []; $vals = [];
foreach ($allowed as $f) {
    if (array_key_exists($f, $data)) {
        $sets[] = "`$f` = ?";
        $vals[] = $data[$f];
    }
}

if (empty($sets)) { echo json_encode(['success' => false, 'error' => 'Nothing to update']); exit; }

$vals[] = $id;
$pdo->prepare("UPDATE players SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);

// Busca username para log
$username = $pdo->prepare("SELECT username FROM players WHERE id = ?");
$username->execute([$id]);
adminLog($pdo, 'edit_player', "id:$id", $username->fetchColumn());

echo json_encode(['success' => true]);
