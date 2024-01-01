<?php

/*
 * CRON JOB PARA COLETAR DADOS DO ESP
 * RECOMENDADO: Rodar a cada 1 Hora
 *
 * Para configurar o cron job, use:
 * 0 * * * * /usr/bin/php /scripts/collect_data.php?key=TOKENSUPERSEGURO
 */

include "../config.php";

// Verifica se a requisição chega por meio de GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    header("HTTP/1.0 405 Method Not Allowed");
    die("405 Method Not Allowed");
}

// Verifica se a chave 'key' foi enviada na requisição GET
if (!isset($_GET['key']) || $_GET['key'] !== 'TOKENSUPERSEGURO') {
    header('HTTP/1.0 403 Forbidden');
    die('403 Forbidden');
}

$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

$errorLog = "log.txt";

function logError($message)
{
    global $errorLog;
    error_log(date("[Y-m-d H:i:s] ") . $message . PHP_EOL, 3, $errorLog);
}

header("Content-Type: application/json");

try {
    $conn = new PDO(
        "mysql:host=$dbHost;dbname=$dbName",
        $dbUsername,
        $dbPassword
    );
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    logError("Conexão falhou: " . $e->getMessage());
    die();
}

$url = ESP_URL;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpcode == 200) {
    $data = json_decode($response, true);

    if (json_last_error() === JSON_ERROR_NONE) {
        // Verifica se os sensores S1, S2 e S3 estão presentes no JSON
        if (isset($data["S1"]) && isset($data["S2"]) && isset($data["S3"])) {
            $stmt = $conn->prepare(
                "INSERT INTO sensor_data (sensors_json, timestamp) VALUES (:data, NOW())"
            );
            $stmt->execute([
                ":data" => $response,
            ]);

            // Responde com sucesso caso os dado sejam inseridos
            echo json_encode([
                "success" => true,
                "message" => "Dados inseridos.",
                "data" => json_decode($response),
            ]);
            logError("SUCESSO: Dados inseridos. $response");
        } else {
            echo json_encode([
                "success" => false,
                "message" =>
                    "JSON não contém todos os sensores necessários (S1, S2 e S3).",
            ]);
            logError(
                "ERRO: JSON não contém todos os sensores necessários (S1, S2 e S3)."
            );
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Resposta não é um JSON válido ou está malformado.",
        ]);
        logError("ERRO: Resposta não é um JSON válido ou está malformado.");
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Falha ao obter dados do ESP. Código HTTP: " . $httpcode,
    ]);
    logError("ERRO: Falha ao obter dados do ESP. Código HTTP: $httpcode");
}

?>
