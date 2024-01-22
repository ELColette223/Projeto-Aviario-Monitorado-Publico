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
define("ESP_URL", "http://192.168.0.219/");

// Define a URL da API RAW
define("API_URL_RAW", "https://SEU_IP/api.php?raw=full");

// Define a URL da Bridge
define("API_URL_BRIDGE", "https://SEU_IP/bridge.php");

// Define o limite de tentativas de conexão com o ESP
define("MAX_RETRIES", 3);

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
define("ALLOWED_IPS", "https://SEU_IP_AQUI");

// Define status de debug
define("DEBUG_STATUS", false);

// Define Token de segurança
define("TOKEN_API_STATUS", false);
define("TOKEN_API", "SEU_TOKEN_AQUI");
?>