// notyf function
const notyf = new Notyf({
    duration: 4500,
    position: {
        x: 'right',
        y: 'bottom',
    },
    types: [
        {
            type: 'warning',
            background: 'orange',
            icon: {
                className: 'fa-solid fa-triangle-exclamation',
                tagName: 'i',
                color: '#fff'
            }
        },
    ]
});

document.addEventListener('DOMContentLoaded', async () => {
    // Verifique se a tela é menor que 500px
    var largura = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (largura <= 500 && server_stauts === true) {
        notyf.open({
            type: 'warning',
            message: 'Para melhor visualização, vire sua tela na horizontal.'
        });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    await fetchAPIConfig();
    loadData();
    
    document.getElementById('loadDataButton').addEventListener('click', loadData);
});

let apiURL = '';

async function fetchAPIConfig() {
    try {
        const response = await fetch('js-config-end.php');
        const config = await response.json();
        apiURL = config.API_URL_RAW;
    } catch (error) {
        console.error('Error:', error);
        notyf.error('Servidor Offline!'); // notyf
    }
}

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

server_stauts = false;

const loadData = async () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert("Por favor, selecione as datas de início e fim.");
        return;
    }

    try {
        const response = await axios.get(apiURL);
        const rawData = processAPIData(response.data, startDate, endDate);
        const data = processDailyAverage(rawData);
        rawDataForExport = processRawDataForExport(response.data);

        const tempData = data.map(d => d.temperature);
        const humidityData = data.map(d => d.humidity);
        const labels = data.map(d => d.date);

        updateChart(tempHumidityChart, labels, tempData, humidityData);
        server_stauts = true;
    } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
        server_stauts = false;
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
    startDate.setDate(endDate.getDate() - days);

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
    if (server_stauts === true) {
        if (window.confirm('Deseja exportar os dados: "Dados_do_Sensor_Histórico-' + moment(new Date()).format("DD/MM/YYYY") + ".png" + "?")) {                
            const data = tempHumidityChart.toBase64Image();

            const link = document.createElement('a');
            link.href = data;
            link.download = "Dados_do_Sensor_Histórico-" + moment(new Date()).format("DD/MM/YYYY") + ".png";
            link.click();
            notyf.success('Dados exportados com sucesso!'); // notyf
        } else {
            notyf.error('Operação cancelada!'); // notyf
        }
    } else {
        notyf.error('Erro ao exportar dados!'); // notyf
    }
};

window.exportDataXlsx = async function() {
    if (server_stauts === true) {
        try {
            if (window.confirm('Deseja exportar os dados: "Dados_do_Sensor_Histórico-' + moment(new Date()).format("DD-MM-YYYY") + ".xlsx" + "?")) {   
                const response = await axios.get(apiURL);
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
                notyf.success('Dados exportados com sucesso!'); // notyf
            } else {
                notyf.error('Operação cancelada!'); // notyf
            }
        } catch (error) {
            notyf.error('Erro ao exportar dados!'); // notyf
        }
    } else {
        notyf.error('Erro ao exportar dados!'); // notyf
    }
};

Chart.defaults.font.family = 'Montserrat, sans-serif';
Chart.defaults.font.style = 'normal';
Chart.defaults.font.weight = '500';

const ctx = document.getElementById('tempHumidityChart').getContext('2d');
const tempHumidityChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperatura (°C)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointBackgroundColor: 'rgba(255, 99, 132, 0.8)',
            pointBorderColor: 'rgba(255, 99, 132, 0.8)',
            pointRadius: 0,
            pointHoverRadius: 5,
            yAxisID: 'y',
            data: []
        }, {
            label: 'Umidade (%)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: 'rgba(54, 162, 235, 0.8)',
            pointBorderColor: 'rgba(54, 162, 235, 0.8)',
            pointRadius: 0,
            pointHoverRadius: 5,
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
            },
            tooltip: {
                mode: 'index',
                intersect: false
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
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
                    color: '#FF6384',
                    font: {
                        size: 12,
                        weight: 'bold'
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
                    color: '#36A2EB',
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            }
        }
    }
});