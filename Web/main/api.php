<?php

/*
 *  REST API para obter os dados do banco de dados
 *  Versão: 1.4.1
 */

header("Content-Type: application/json");

require 'controller/functions.php';

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

// Arquivo de cache para status
$cacheFile = "./cache/sensor_data_cache.json";
$cacheTime = 3600; // 1 hora

// Verfica o status do servidor com endpoint "api.php?status"
if (isset($_GET["status"])) {
    echo getServerStatus();
    exit();
}

// Arquivo de cache para dados crus
$cacheRaw = "./cache/raw_data_cache.json";
$cacheTimeRaw = 3600; // 1 hora

// Retorna os dados crus através do endpoint "api.php?raw"
if (isset($_GET["raw"])) {
    header('Access-Control-Allow-Origin: *');
    echo getRawData();
    exit();
}

// Retorna os dados dos sensores
echo getSensorData();
exit();

function getServerStatus() {
    // URL do servidor
    $serverURL = ESP_URL;

    // Verifica se o servidor está online
    $ch = curl_init($serverURL);

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_exec($ch);

    // Verifica o status retornado como online ou offline
    if (curl_getinfo($ch, CURLINFO_HTTP_CODE) == 200) {
        $response = [
            "server_status" => "online",
            "server_ip" => ESP_URL,
        ];
    } else {
        $response = [
            "server_status" => "offline",
            "server_ip" => ESP_URL
        ];
    }

    // Fecha a conecxão cURL
    curl_close($ch);

    return json_encode($response);
}

function getRawData() {
    global $cacheRaw, $cacheTimeRaw, $dbHost, $dbName, $dbUsername, $dbPassword;

    // Verifica se o usuário solicitou todos os dados sem filtrar os vazios
    $includeEmpty = isset($_GET["raw"]) && $_GET["raw"] === "full";

    if (CACHE_STATUS && file_exists($cacheRaw) && filemtime($cacheRaw) > time() - $cacheTimeRaw) {
        return file_get_contents($cacheRaw);
    } else {
        try {
            $conn = new PDO(
                "mysql:host=$dbHost;dbname=$dbName",
                $dbUsername,
                $dbPassword
            );
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Consulta para selecionar todos os dados
            $sql = "SELECT sensors_json, timestamp FROM sensor_data ORDER BY timestamp DESC";

            // Prepara e executa a consulta SQL
            $stmt = $conn->prepare($sql);
            $stmt->execute();

            // Define o array que irá armazenar os dados
            $data = [];

            // Itera sobre os resultados e adiciona ao array
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $sensors = json_decode($row["sensors_json"], true);

                // Se não estiver incluindo vazios, verifica se algum sensor está completamente vazio
                if (!$includeEmpty) {
                    $anySensorEmpty = false;
                    foreach ($sensors as $sensorValues) {
                        if (empty($sensorValues["umidade"]) && empty($sensorValues["temperatura"])) {
                            $anySensorEmpty = true;
                            break;
                        }
                    }

                    // Se algum sensor estiver completamente vazio, pula este registro
                    if ($anySensorEmpty) {
                        continue;
                    }
                }

                $time = date("d-m-Y H:i", strtotime($row["timestamp"]));

                // Adiciona os dados ao array mantendo a estrutura original
                $data[] = [
                    "sensors" => $sensors,
                    "time" => ["data" => $time]
                ];
            }

            $jsonData = json_encode($data, JSON_FORCE_OBJECT);

            // Salva os dados no cache
            if (!file_exists(dirname($cacheRaw))) {
                mkdir(dirname($cacheRaw), 0777, true);
            }
            file_put_contents($cacheRaw, $jsonData);

            return $jsonData;
        } catch (PDOException $e) {
            return json_encode([
                "success" => false,
                "message" => "Erro ao conectar com o banco de dados: " . $e->getMessage()
            ]);
        }
    }
}


function getSensorData() {
    global $cacheFile, $cacheTime, $dbHost, $dbName, $dbUsername, $dbPassword;

    if (CACHE_STATUS && file_exists($cacheFile) && filemtime($cacheFile) > time() - $cacheTime) {
        return file_get_contents($cacheFile);
    } else {
        try {
            $conn = new PDO(
                "mysql:host=$dbHost;dbname=$dbName",
                $dbUsername,
                $dbPassword
            );
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Calcula a data de início como 55 dias atrás da data mais recente
            $stmt = $conn->query(
                "SELECT DATE(timestamp) as recent_date FROM sensor_data ORDER BY timestamp DESC LIMIT 1"
            );
            $recentDateRow = $stmt->fetch(PDO::FETCH_ASSOC);
            $endDate = $recentDateRow["recent_date"]; // Usamos endDate para manter a consistência
            $startDate = (new DateTime($endDate))
                ->modify("-55 days")
                ->format("Y-m-d");

            $sql = "SELECT sensors_json, DATE(timestamp) as day FROM sensor_data ";
            $sql .= "WHERE timestamp BETWEEN :startDate AND :endDate ";
            $sql .= "ORDER BY timestamp DESC";

            // Prepara a consulta SQL
            $stmt = $conn->prepare($sql);

            // Binda os parâmetros de data
            $stmt->bindParam(":startDate", $startDate, PDO::PARAM_STR);
            $stmt->bindParam(":endDate", $endDate, PDO::PARAM_STR);

            $stmt->execute();

            // Define o array que irá armazenar os dados
            $data = [
                "labels" => [],
                "temperatures" => [],
                "humidities" => [],
            ];

            $groupedData = [];

            // Itera sobre os resultados e processa o JSON para extrair os dados
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $day = htmlspecialchars($row["day"]);
                $sensors = json_decode($row["sensors_json"], true);

                // Inicializa o grupo para o dia se ainda não existir
                if (!isset($groupedData[$day])) {
                    $groupedData[$day] = [
                        "tempSum" => 0,
                        "humSum" => 0,
                        "countTemp" => 0,
                        "countHum" => 0,
                    ];
                }

                // Soma as temperaturas e umidades dos sensores para esse dia
                foreach ($sensors as $sensor) {
                    $temperature = isset($sensor["temperatura"])
                        ? floatval(str_replace("°C", "", $sensor["temperatura"]))
                        : null;
                    $humidity = isset($sensor["umidade"])
                        ? floatval(str_replace("%", "", $sensor["umidade"]))
                        : null;

                    // Limpe a entrada do usuário antes de usar na consulta SQL
                    $temperature = htmlspecialchars($temperature);
                    $humidity = htmlspecialchars($humidity);

                    if (!empty($temperature)) {
                        $groupedData[$day]["tempSum"] += $temperature;
                        $groupedData[$day]["countTemp"]++;
                    }
                    if (!empty($humidity)) {
                        $groupedData[$day]["humSum"] += $humidity;
                        $groupedData[$day]["countHum"]++;
                    }
                }
            }

            // Agora calcula as médias para cada dia e prepara o array final de dados
            $data = [
                "labels" => [],
                "temperatures" => [],
                "humidities" => [],
            ];

            foreach ($groupedData as $day => $values) {
                $data["labels"][] = $day;

                // Verifica se há dados de temperatura e umidade para calcular as médias
                if ($values["countTemp"] > 0) {
                    $data["temperatures"][] = number_format(
                        $values["tempSum"] / $values["countTemp"],
                        1,
                        ".",
                        ""
                    );
                } else {
                    $data["temperatures"][] = "";
                }

                if ($values["countHum"] > 0) {
                    $data["humidities"][] = number_format(
                        $values["humSum"] / $values["countHum"],
                        0,
                        ".",
                        ""
                    );
                } else {
                    $data["humidities"][] = "";
                }
            }

            // Após buscar e processar os dados do banco de dados
            $jsonData = json_encode($data);

            // Salva os dados no cache
            if (!file_exists(dirname($cacheFile))) {
                mkdir(dirname($cacheFile), 0777, true);
            }
            file_put_contents($cacheFile, $jsonData);

            // Retorna os dados
            return $jsonData;
        } catch (PDOException $e) {
            return json_encode([
                "success" => false,
                "message" => "Erro ao conectar com o banco de dados: " . $e->getMessage()
            ]);
        }
    }
}
?>
