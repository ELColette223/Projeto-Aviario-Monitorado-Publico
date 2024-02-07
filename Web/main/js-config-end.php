<?php
define('PAM', true);

include 'config.php';

header('Content-Type: application/json');
echo json_encode([
    "API_URL_RAW" => API_URL_RAW,
    "API_URL_BRIDGE" => API_URL_BRIDGE,
]);
