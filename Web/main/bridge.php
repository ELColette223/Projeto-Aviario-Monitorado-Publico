<?php

/*
 *  API para obter os dados em tempo real
 *  Versão: 1.1.1
 */

header("Content-Type: application/json");

require 'config.php';

// Limitação de acesso
if (LIMIT_ACCESS) {
    $allowedIPs = explode(",", ALLOWED_IPS);
    if (!in_array($_SERVER["REMOTE_ADDR"], $allowedIPs)) {
        echo json_encode([
            "success" => false,
            "message" => "Acesso negado"
        ]);
        exit();
    }
}

$espURL = ESP_URL;

// FUNÇÃO PARA VERIFICAR SE O SENSOR ESTÁ ONLINE
function checkSensorOnline($espURL) {
    // Tenta conectar com o sensor duas vezes
    for ($i = 0; $i < 2; $i++) {
        $ch = curl_init($espURL);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_exec($ch);

        // Verifica o status retornado como online ou offline
        if (curl_getinfo($ch, CURLINFO_HTTP_CODE) == 200) {
            curl_close($ch);
            return true;
        }

        // Fecha a conexão cURL
        curl_close($ch);

        // Espera um pouco antes de tentar novamente
        if ($i < 1) {
            sleep(2);
        }
    }

    return false;
}

// ENDPOINT: "/bridge.php?status" PARA VERIFICAR SE O SENSOR ESTÁ ONLINE
if (isset($_GET["status"])) {

    // Verifica a resposta de checkSensorOnline() com retorno
    if (checkSensorOnline($espURL)) {
        echo json_encode([
            "server_status" => "online", 
            "server_ip" => $espURL,
        ]);
    } else {
        echo json_encode([
            "server_status" => "offline",
            "server_ip" => $espURL,
        ]);
    }
    exit();
}

// ENTREGA OS DADOS DO SENSOR EM TEMPO REAL
try {
    // Verifica se está online
    if (checkSensorOnline($espURL)){
        // Pega os dados do sensor em tempo real
        $ch = curl_init($espURL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($httpcode == 200) {
            // Processa a resposta e calcula as médias
            $sensorData = json_decode($response, true);
            $sensorDataWithAverage = addAveragesToSensorData($sensorData);

            echo json_encode($sensorDataWithAverage);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Falha ao obter dados do sensor.",
            ]);
        }
        exit();
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Sensor offline!",
        ]);
    }
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Falha ao obter dados do ESP.",
    ]);
}

// FUNÇÃO PARA CALCULAR AS MÉDIAS ENTREGANDO NO JSON
function addAveragesToSensorData($sensorData) {
    $tempSum = 0;
    $humSum = 0;
    $sensorCount = 0;

    foreach ($sensorData as $sensor) {
        if (isset($sensor["temperatura"]) && isset($sensor["umidade"])) {
            $temp = floatval(str_replace("°C", "", $sensor["temperatura"]));
            $hum = floatval(str_replace("%", "", $sensor["umidade"]));

            $tempSum += $temp;
            $humSum += $hum;
            $sensorCount++;
        }
    }

    if ($sensorCount > 0) {
        $sensorData["media"] = [
            "umidade" => round($humSum / $sensorCount, 1) . "%",
            "temperatura" => round($tempSum / $sensorCount, 1) . "°C"
        ];
    }

    return $sensorData;
}

?>
