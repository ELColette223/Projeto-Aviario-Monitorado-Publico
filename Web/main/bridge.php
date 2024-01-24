<?php

/*
 *  API para obter os dados em tempo real
 *  Versão: 1.2.3
 */

header("Content-Type: application/json");

require 'controller/functions.php';

// Verifica se o limite de acesso está ativado
checkLimitAccess();

// Define a URL do ESP
$espURL = ESP_URL;

// Conectar ao Redis
try {
    $redis = new Redis();
    $redis->connect(REDIS_HOST, REDIS_PORT);
} catch (Exception $e) {
    logDebug("Falha ao conectar ao Redis: {$e->getMessage()}");
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode([
        "success" => false,
        "message" => "Falha ao conectar ao Redis.",
    ]);
    exit();
}

// Define a chave do cache
$cacheKey = ESP_CACHE_KEY;

// Define o tempo de cache
$cacheTime = CACHE_TIME;

// FUNÇÃO PARA VERIFICAR SE O CACHE É VÁLIDO
function isCacheValid($redis, $cacheKey, $cacheTime) {
    return $redis->exists($cacheKey) && (time() - $redis->get($cacheKey . '_time')) < $cacheTime;
}

// FUNÇÃO PARA OBTER OS DADOS DO CACHE
function getCacheData($redis, $cacheKey) {
    return json_decode($redis->get($cacheKey), true);
}

// FUNÇÃO PARA SALVAR OS DADOS NO CACHE
function saveCacheData($redis, $cacheKey, $data, $cacheTime) {
    $redis->set($cacheKey, json_encode($data));
    $redis->set($cacheKey . '_time', time());
    $redis->expire($cacheKey, $cacheTime); // Define o tempo de expiração do cache
}

// ENDPOINT: /bridge.php?status PARA VERIFICAR SE O SENSOR ESTÁ ONLINE
if (isset($_GET["status"])) {
    $httpcode = 0;

    // Verifica a resposta de checkSensorOnline() com retorno
    if (checkSensorOnline($espURL, $httpcode)) {
        logDebug("Sensor online: {$espURL}, {$httpcode}");
        header("HTTP/1.1 200 OK");
        echo json_encode([
            "server_status" => "online",
            "server_ip" => $espURL,
        ]);
    } else {
        logDebug("Sensor offline: {$espURL}, {$httpcode}");
        header("HTTP/1.1 500 Internal Server Error");
        echo json_encode([
            "server_status" => "offline",
            "server_ip" => $espURL,
        ]);
    }
    exit();
}

// FUNÇÃO PARA CALCULAR AS MÉDIAS ENTREGANDO NO JSON
function addAveragesToSensorData($sensorData) {
    $tempSum = 0;
    $humSum = 0;
    $tempCount = 0;
    $humCount = 0;

    foreach ($sensorData as $key => $sensor) {
        $tempValid = !empty($sensor["temperatura"]);
        $humValid = !empty($sensor["umidade"]);

        if ($tempValid) {
            $temp = floatval(str_replace("°C", "", $sensor["temperatura"]));
            if ($temp >= -15 && $temp <= 100) {
                $tempSum += $temp;
                $tempCount++;
            }
        }

        if ($humValid) {
            $hum = floatval(str_replace("%", "", $sensor["umidade"]));
            if ($hum >= 0 && $hum <= 100) {
                $humSum += $hum;
                $humCount++;
            }
        }
    }

    if ($tempCount > 0) {
        $sensorData["media"]["temperatura"] = round($tempSum / $tempCount, 1) . "°C";
    }

    if ($humCount > 0) {
        $sensorData["media"]["umidade"] = round($humSum / $humCount, 1) . "%";
    }

    return $sensorData;
}

// FUNÇÃO PARA VALIDAR OS DADOS DO SENSOR
function validateSensorData($data) {
    foreach ($data as $key => $sensor) {
        if (isset($sensor["temperatura"]) && $sensor["temperatura"] !== "") {
            $temp = floatval(str_replace("°C", "", $sensor["temperatura"]));
            // Temperatura válida para DHT22: -40°C a 80°C
            if ($temp < -40 || $temp > 80) {
                $data[$key]["temperatura"] = "";
            }
        }

        if (isset($sensor["umidade"]) && $sensor["umidade"] !== "") {
            $hum = floatval(str_replace("%", "", $sensor["umidade"]));
            // Umidade válida para DHT22: 0% a 100%
            if ($hum < 0 || $hum > 100) {
                $data[$key]["umidade"] = "";
                $data[$key]["temperatura"] = "";
            }
        }
    }
    return $data;
}

// FUNÇÃO PARA OBTER OS DADOS DO SENSOR EM TEMPO REAL COM RETRY EM CASO DE VALORES VAZIOS
function fetchSensorData($espURL, $maxRetries = MAX_RETRIES) {
    $retryCount = 0;

    do {
        $ch = curl_init($espURL);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $response = curl_exec($ch);
        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($httpcode == 200) {
            $sensorData = json_decode($response, true);
            $validatedData = validateSensorData($sensorData);

            // Verifica se há valores vazios
            $isEmpty = checkForEmptyValues($validatedData);
            if (!$isEmpty) {
                return $validatedData;
            }
        }

        $retryCount++;
    } while ($retryCount < $maxRetries && ($httpcode != 200 || $isEmpty));

    if ($httpcode == 200) {
        $sensorData = json_decode($response, true);
        return validateSensorData($sensorData);
    }

    return null;
}

// FUNÇÃO PARA VERIFICAR SE HÁ VALORES VAZIOS
function checkForEmptyValues($data) {
    foreach ($data as $key => $sensor) {
        if (isset($sensor["temperatura"]) && $sensor["temperatura"] === "") {
            return true;
        }

        if (isset($sensor["umidade"]) && $sensor["umidade"] === "") {
            return true;
        }
    }
    return false;
}

// ENTREGA OS DADOS DO SENSOR EM TEMPO REAL
try {
    if (CACHE_BRIDGE_STATUS == false || !isCacheValid($redis, $cacheKey, $cacheTime)) {
        // Se o cache estiver desativado ou inválido, faz a requisição
        $sensorData = fetchSensorData($espURL);

        if ($sensorData) {
            $sensorDataWithAverage = addAveragesToSensorData($sensorData);

            // Salva os dados no cache se o cache estiver ativo
            if (CACHE_BRIDGE_STATUS) {
                saveCacheData($redis, $cacheKey, $sensorDataWithAverage, $cacheTime);
            }

            echo json_encode($sensorDataWithAverage);
            logDebug("JSON: " . json_encode($sensorDataWithAverage));
        } else {
            logDebug("Falha ao obter dados do sensor: {$espURL}");
            header("HTTP/1.1 500 Internal Server Error");
            echo json_encode([
                "success" => false,
                "message" => "Falha ao obter dados do sensor.",
            ]);
        }
    } else {
        // Cache é válido, então usa os dados do cache
        $sensorDataWithAverage = getCacheData($redis, $cacheKey);

        echo json_encode($sensorDataWithAverage);
        logDebug("CACHE: JSON: " . json_encode($sensorDataWithAverage));
    }
    exit();
} catch (PDOException $e) {
    logDebug("Falha ao obter dados do ESP: {$espURL}");
    header("HTTP/1.1 500 Internal Server Error");
    echo json_encode([
        "success" => false,
        "message" => "Falha ao obter dados do ESP.",
    ]);
}