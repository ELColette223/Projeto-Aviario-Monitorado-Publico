<?php
define('PAM', true);
include (__DIR__ . "/../config.php");

// Verifica se a autenticação do token está desativada
if (TOKEN_API_STATUS == false) {
    
} else {
    // Se TOKEN_API_STATUS for true, verifica a chave API
    if (!isset($_GET["key"]) || $_GET["key"] !== TOKEN_API) {
        header("HTTP/1.1 400 Bad Request");
        die("400 Bad Request - Chave API ausente ou inválida.");
    }
}

// FUNÇÃO PARA REGISTRAR O DEBUG EM UM ARQUIVO
function logDebug($message) {
    if (!DEBUG_STATUS) { //DEBUG_STATUS está definido em config.php
        return;
    } else {
        $logFile = './debugs/debug.txt';
        $timestamp = date("Y-m-d H:i:s");
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}

// FUNÇÃO PARA VERIFICAR LIMITAÇÃO DE ACESSO
function checkLimitAccess() {
    if (LIMIT_ACCESS) {
        $allowedIPs = explode(",", ALLOWED_IPS);
        if (!in_array($_SERVER["REMOTE_ADDR"], $allowedIPs)) {
            header("HTTP/1.1 403 Forbidden");
            echo json_encode([
                "success" => false,
                "message" => "Acesso negado"
            ]);
            exit();
        }
    }
}

// FUNÇÃO PARA VERIFICAR SE O SENSOR ESTÁ ONLINE
function checkSensorOnline($espURL, $httpcode) {
    $httpcode = 0;
    for ($i = 0; $i < MAX_RETRIES; $i++) { // MAX_RETRIES está definido em config.php
        $ch = curl_init($espURL);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_exec($ch);

        // Verifica o status retornado como online ou offline
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($httpcode == 200) {
            curl_close($ch);
            return true;
        }

        // Fecha a conexão cURL
        curl_close($ch);

        // Espera um pouco antes de tentar novamente
        if ($i < 1) {
            sleep(1);
        }
    }

    return false;
}