<?php
$dbHost = '';           // SUBSTITUA PELO IP DO SEU SERVIDOR
$dbUsername = '';       // SUBSTITUA PELO USUÁRIO DO SEU BANCO DE DADOS
$dbPassword = '';       // SUBSTITUA PELA SENHA DO SEU BANCO DE DADOS
$dbName = '';           // SUBSTITUA PELO NOME DO SEU BANCO DE DADOS

try {
    $conn = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUsername, $dbPassword);
} catch (PDOException $e) {
    die("Erro de conexão");
}

// Define o IP do servidor
define("ESP_URL", "http://SEU_IP/");

// Define o status de cache da API 'api.php'
define("CACHE_STATUS", true);

// Define o arquivo e tempo de cache da API 'bridge.php' com Redis
define("CACHE_BRIDGE_STATUS", true);
define("REDIS_HOST", "127.0.0.1"); // IP do servidor Redis
define("REDIS_PORT", 6379); // Porta do servidor Redis
define("ESP_CACHE_KEY", "esp32_sensor_data"); // Chave do cache, não precisa alterar
define("CACHE_TIME", 8); // Tempo de cache em segundos

// Define o limite de acesso
define("LIMIT_ACCESS", false);
define("ALLOWED_IPS", "http://SEU_IP_AQUI");

// Define status de debug
define("DEBUG_STATUS", true);

// Define Token de segurança
define("TOKEN_API_STATUS", false);
define("TOKEN_API", "SEU_TOKEN_AQUI");
?>