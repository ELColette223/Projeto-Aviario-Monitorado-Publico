<?php
$dbHost = 'localhost';      // SUBSTITUA PELO IP DO SEU SERVIDOR
$dbUsername = 'root';       // SUBSTITUA PELO USUÁRIO DO SEU BANCO DE DADOS
$dbPassword = '';           // SUBSTITUA PELA SENHA DO SEU BANCO DE DADOS
$dbName = 'aviario_teste';  // SUBSTITUA PELO NOME DO SEU BANCO DE DADOS

try {
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUsername, $dbPassword);
} catch (PDOException $e) {
    die("Erro de conexão");
}

// Define o IP do servidor
define("ESP_URL", "http://IP_DO_SEU_ESP/");
define("CACHE_STATUS", true);

// Define o limite de acesso (Recomendo ativar APENAS se quiser limitar o acesso externo!).
// Atenção! Se você definir como true, Isso limitará também o acesso das APIs apenas aos IPs permitidos.
define("LIMIT_ACCESS", false);
define("ALLOWED_IPS", "SEU_IP_AQUI, SEU_OUTRO_IP_AQUI");
?>
