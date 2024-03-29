<?php
if (!defined('PAM')) { die("Acesso negado!"); } // Não permite que o arquivo seja acessado diretamente

$dbHost = 'localhost';      // SUBSTITUA PELO IP DO SEU SERVIDOR
$dbUsername = 'root';       // SUBSTITUA PELO USUÁRIO DO SEU BANCO DE DADOS
$dbPassword = '';           // SUBSTITUA PELA SENHA DO SEU BANCO DE DADOS
$dbName = 'aviario_teste';  // SUBSTITUA PELO NOME DO SEU BANCO DE DADOS

// Define o timezone. https://www.php.net/manual/en/timezones.php
date_default_timezone_set('America/Sao_Paulo');

// Define o IP do servidor
define("ESP_URL", "http://192.168.0.219/");

// Define a URL da API RAW
define("API_URL_RAW", "https://SEU_IP/api.php?raw=full");

// Define a URL da Bridge
define("API_URL_BRIDGE", "https://SEU_IP/bridge.php");

// Define a URL da API de coleta de dados (usado em scripts/collect_data.php)
define("API_URL_COLLECT_DATA", "https://SEU_IP/bridge.php?normal");

// Define o limite de tentativas de conexão com o ESP
define("MAX_RETRIES", 3);

// Define o arquivo e tempo de cache da API 'bridge.php' com Redis
define("CACHE_BRIDGE_STATUS", true);
define("REDIS_HOST", "127.0.0.1"); // IP do servidor Redis
define("REDIS_PORT", 6379); // Porta do servidor Redis
define("ESP_CACHE_KEY", "esp32_sensor_data"); // Chave do cache, não precisa alterar
define("CACHE_TIME", 8); // Tempo de cache em segundos

// Define o status de cache da API 'api.php'
define("CACHE_STATUS", true);

// Define o limite de acesso
define("LIMIT_ACCESS", false);
define("ALLOWED_IPS", "https://SEU_IP_AQUI");

// Define status de debug
define("DEBUG_STATUS", false);

// Define Token de segurança para a API
define("TOKEN_API_STATUS", false);
define("TOKEN_API", "SEU_TOKEN_AQUI");

// Define o status de segurança da coleta de dados 'collect_data.php'
define("SECURITY_COLLECT_DATA", true);
define("TOKEN_SECURITY_COLLECT_DATA", "SEU_TOKEN_AQUI");

########### Define as credenciais de e-mail ###########

// E-mail do remetente
define("SENDER_EMAIL", "email@example.com");

// E-mail do destinatário
define("RECIPIENT_EMAIL", "destino@example.com");

// Host do servidor SMTP
define("EMAIL_HOST", "smtp.example.com");

// Usuário do servidor SMTP
define("EMAIL_USERNAME", "user@example.com");

// Senha do servidor SMTP
define("EMAIL_PASSWORD", "SUA_SENHA_AQUI");

// Porta do servidor SMTP
define("EMAIL_PORT", 465);
?>