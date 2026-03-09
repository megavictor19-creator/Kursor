<?php
session_start();

if (!isset($_SESSION['player_id'])) {
    http_response_code(403);
    die(base64_encode("console.error('Access Denied to Kursor Souls Engine.');"));
}

$files = [
    '../js/vfx_core.js',
    '../js/classes/vfx_orc.js',
    '../js/classes/vfx_elf.js',
    '../js/classes/vfx_human.js',
    '../js/classes/vfx_dwarf.js',
    '../js/tabs/tab_character.js',
    '../js/tabs/tab_inventory.js',
    '../js/cursor_engine.js',
    '../js/combat_engine.js',
    '../js/classes/skills_orc.js',
    '../js/classes/skills_elf.js',
    '../js/classes/skills_human.js',
    '../js/classes/skills_dwarf.js'
];

$output = "";

foreach ($files as $file) {
    if (file_exists($file)) {
        $output .= file_get_contents($file) . "\n\n";
    }
}

header("Content-Type: text/plain");
echo base64_encode($output);
?>