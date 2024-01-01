<?php

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