document.addEventListener('DOMContentLoaded', () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    loadData();

    document.getElementById('loadDataButton').addEventListener('click', loadData);
});

let rawDataForExport = [];

const processDailyAverage = (rawData) => {
    const dailyData = {};
    rawData.forEach(entry => {
        
        if (!entry || !entry.temperature || !entry.humidity) return;

        const date = entry.date.split(' ')[0];
        if (!dailyData[date]) {
            dailyData[date] = { temperature: 0, humidity: 0, count: 0 };
        }
        dailyData[date].temperature += parseFloat(entry.temperature);
        dailyData[date].humidity += parseFloat(entry.humidity);
        dailyData[date].count += 1;
    });

    return Object.keys(dailyData).map(date => {
        return {
            date: date,
            temperature: (dailyData[date].temperature / dailyData[date].count).toFixed(2),
            humidity: (dailyData[date].humidity / dailyData[date].count).toFixed(2)
        };
    });
};

const sensorPrefixes = {
    "S1": "25m",
    "S2": "50m",
    "S3": "75m"
};

const processRawDataForExport = (apiData) => {
    let exportData = [];
    let lastDate = null;

    for (const key in apiData) {
        const entry = apiData[key];
        const date = entry.time.data;

        if (lastDate && date !== lastDate) {
            exportData.push({});
        }

        for (const sensorId in entry.sensors) {
            const sensorData = entry.sensors[sensorId];
            exportData.push({
                date: date,
                sensorId: sensorId + ", " + sensorPrefixes[sensorId],
                temperatura: sensorData.temperatura,
                umidade: sensorData.umidade
            });
        }

        lastDate = date;
    }

    return exportData;
};

const loadData = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
    }

    try {
        const response = await axios.get('https://SEU_IP/api.php?raw=full');
        const rawData = processAPIData(response.data, startDate, endDate);
        const data = processDailyAverage(rawData);
        rawDataForExport = processRawDataForExport(response.data);

        const tempData = data.map(d => d.temperature);
        const humidityData = data.map(d => d.humidity);
        const labels = data.map(d => d.date);

        updateChart(tempHumidityChart, labels, tempData, humidityData);
    } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
        alert("Falha ao carregar dados.");
    }
};

const processAPIData = (apiData, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const processedData = [];

    for (const key in apiData) {
        const entry = apiData[key];
        const entryDate = new Date(entry.time.data.split(' ')[0].split('-').reverse().join('-'));

        if (entryDate >= start && entryDate <= end) {
            let totalTemp = 0, totalHumidity = 0, count = 0;
            for (const sensorId in entry.sensors) {
                const sensor = entry.sensors[sensorId];

                if (sensor.temperatura && sensor.umidade) {
                    totalTemp += parseFloat(sensor.temperatura.replace('°C', ''));
                    totalHumidity += parseFloat(sensor.umidade.replace('%', ''));
                    count++;
                }
            }

            if (count > 0) {
                processedData.push({
                    date: entry.time.data,
                    temperature: (totalTemp / count).toFixed(2),
                    humidity: (totalHumidity / count).toFixed(2)
                });
            }
        }
    }

    return processedData.sort((a, b) => new Date(a.date) - new Date(b.date));
};


const getDummyData = async (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        data.push({
            date: d.toISOString().split('T')[0],
            temperature: Math.random() * 30,
            humidity: Math.random() * 100
        });
    }
    return data;
};

const updateChart = (chart, labels, tempData, humidityData) => {
    chart.data.labels = labels;
    chart.data.datasets[0].data = tempData;
    chart.data.datasets[1].data = humidityData;
    chart.update();
};

const setDateFilter = (days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    loadData();

    document.getElementById('filterModal').style.display = 'none';
};

var modal = document.getElementById("filterModal");

var btn = document.getElementById("openModalBtn");

btn.onclick = function() {
    modal.style.display = "block";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

window.exportData = function() {
    const data = tempHumidityChart.toBase64Image();
    const link = document.createElement('a');
    link.href = data;
    link.download = 'Dados_do_Sensor_Histórico-' + moment(new Date()).format("DD/MM/YYYY") + '.png';
    link.click();
};

window.exportDataXlsx = async function() {
    try {
        const response = await axios.get('https://SEU_IP/api.php?raw=full');
        const rawData = response.data;

        let worksheet_data = [];
        const header = ["Data", "Sensor ID", "Temperatura", "Umidade"];
        worksheet_data.push(header);

        for (const key in rawData) {
            const entry = rawData[key];
            const date = entry.time.data;

            for (const sensorId in entry.sensors) {
                const sensorData = entry.sensors[sensorId];
                const row = [
                    date,
                    sensorId + ", " + (sensorPrefixes[sensorId] || ""),
                    sensorData.temperatura || "N/A",
                    sensorData.umidade || "N/A"
                ];
                worksheet_data.push(row);
            }

            worksheet_data.push([]);
        }

        const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados do Sensor");
        XLSX.writeFile(workbook, "Dados_do_Sensor_Histórico-" + moment(new Date()).format("DD-MM-YYYY") + ".xlsx");

    } catch (error) {
        console.error("Erro ao exportar dados da API:", error);
        alert("Falha ao exportar dados.");
    }
};




const ctx = document.getElementById('tempHumidityChart').getContext('2d');
const tempHumidityChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperatura (°C)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 4,
            yAxisID: 'y',
            data: []
        }, {
            label: 'Umidade (%)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 4,
            yAxisID: 'y1',
            data: []
        }]
    },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    font: {
                        size: 10,
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
