let bridgeURL = '';
let notyf;
let apiWasOffline = false;
let sensorChart;
let serverStatus = false;

document.addEventListener('DOMContentLoaded', function() {
    notyf = new Notyf({
        duration: 4000,
        position: { x: 'right', y: 'bottom' },
        types: [{
            type: 'warning',
            background: 'orange',
            icon: {
                className: 'fa-solid fa-triangle-exclamation',
                tagName: 'i',
                color: '#fff'
            }
        }]
    });

    Chart.defaults.font.family = 'Montserrat, sans-serif';
    Chart.defaults.font.style = 'normal';
    Chart.defaults.font.weight = 'bold';

    setupEventListeners();
    initializeChart();
});

function initializeChart() {
    const sensorChartElement = document.getElementById('sensorChart');
    if (!sensorChartElement) return console.error('Element not found:', sensorChartElement);
    
    const ctx = sensorChartElement.getContext('2d');
    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperatura (°C)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                data: [],
            }, {
                label: 'Umidade (%)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                data: [],
            }]
        },
        options: {
            layout: { padding: { left: 25, right: 25 } },
            interaction: { mode: 'nearest', intersect: false, axis: 'x' },
            scales: {
                x: { reverse: true },
                y: {
                    ticks: { color: '#FF6384' },
                    type: 'linear',
                    display: true,
                    position: 'left',
                    id: 'y-temperatura',
                    min: 10,
                    max: 100,
                },
                y1: {
                    ticks: { color: '#36A2EB' },
                    type: 'linear',
                    display: true,
                    position: 'right',
                    id: 'y-umidade',
                    min: 10,
                    max: 100,
                    grid: { drawOnChartArea: false },
                },
            },
            responsive: true,
            maintainAspectRatio: false
        },
    });

    window.exportData = function(fileType) {
        const dateFormat = moment(new Date()).format("DD-MM-YYYY");
        if (!window.confirm(`Deseja exportar os dados: "Dados_do_Sensor-${dateFormat}.${fileType}"?`)) {
            notyf.error('Operação cancelada!');
            return;
        }
    
        try {
            if (fileType === 'png') {
                const data = sensorChart.toBase64Image();
                const link = document.createElement('a');
                link.href = data;
                link.download = `Dados_do_Sensor-${dateFormat}.png`;
                link.click();
                notyf.success('Dados exportados com sucesso!');
            } else if (fileType === 'xlsx') {
                const datasets = sensorChart.data.datasets;
                let worksheet_data = [];
                const labels = sensorChart.data.labels;
                const header = ["Data", ...datasets.map(dataset => dataset.label)];
                worksheet_data.push(header);
    
                labels.forEach((label, index) => {
                    const row = [label, ...datasets.map(dataset => dataset.data[index] || '')];
                    worksheet_data.push(row);
                });
    
                const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Dados do Sensor");
    
                XLSX.writeFile(workbook, `Dados_do_Sensor-${dateFormat}.xlsx`);
                notyf.success('Dados exportados com sucesso!');
            } else {
                notyf.error('Formato de arquivo não suportado!');
            }
        } catch (error) {
            notyf.error('Erro ao exportar dados!');
            console.error('Export Error:', error);
        }
    };    

    fetchDataAndUpdateChart();
}

function fetchDataAndUpdateChart() {
    const url = `api.php`;
    fetch(url, {
        Headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })
    .then(response => response.json())
    .then(data => {
        updateChart(data);
        serverStatus = true;
    })
    .catch(error => console.error('Error fetching data:', error));
}

function updateChart(data) {
    if (!sensorChart) return;
    sensorChart.data.labels = data.labels.map(label => new Date(label).toISOString().split('T')[0]);
    sensorChart.data.datasets[0].data = data.temperatures.map(temp => parseFloat(temp) || null);
    sensorChart.data.datasets[1].data = data.humidities.map(hum => parseFloat(hum.replace('%', '')) || null);

    sensorChart.update();
}

function setupEventListeners() {
    const actions = [
        { id: 'increaseFont', change: 1, reset: false },
        { id: 'decreaseFont', change: -1, reset: false },
        { id: 'resetFont', change: 0, reset: true }
    ];

    actions.forEach(({ id, change, reset }) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => changeFontSize(change, reset));
        }
    });
}

function changeFontSize(change, reset = false) {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        if (reset) {
            element.style.fontSize = '';
        } else {
            const currentSize = parseFloat(window.getComputedStyle(element).getPropertyValue('font-size'));
            element.style.fontSize = `${currentSize + change}px`;
        }
    });
}

function setupEventListeners() {
    const increaseFontButton = document.getElementById('increaseFont');
    const decreaseFontButton = document.getElementById('decreaseFont');
    const resetFontButton = document.getElementById('resetFont');

    if (increaseFontButton) {
        increaseFontButton.addEventListener('click', () => changeFontSize(1));
    }

    if (decreaseFontButton) {
        decreaseFontButton.addEventListener('click', () => changeFontSize(-1));
    }

    if (resetFontButton) {
        resetFontButton.addEventListener('click', resetFontSize);
    }
}

async function fetchAPIBridgeConfig() {
    try {
        const response = await fetch('js-config-end.php');
        const config = await response.json();
        bridgeURL = config.API_URL_BRIDGE;
    } catch (error) {
        console.error('Error:', error);
    }
}

window.addEventListener('load', async () => {
    await fetchAPIBridgeConfig();
    fetchSensorData();
    setInterval(fetchSensorData, 10000);
})

var apiOffline = false;

function fetchSensorData() {
    const url = bridgeURL;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (apiWasOffline) {
                notyf.success('Servidor Online!');
                apiWasOffline = false;
            }
            updateSensorData('temp1', data.S1.temperatura);
            updateSensorData('hum1', data.S1.umidade);

            updateSensorData('temp2', data.S2.temperatura);
            updateSensorData('hum2', data.S2.umidade);

            updateSensorData('temp3', data.S3.temperatura);
            updateSensorData('hum3', data.S3.umidade);
            hideLoader();
        })
        .catch(error => {
            handleError(error);
            apiWasOffline = true;
        });
}

function updateSensorData(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        if (value && value !== 'ERRO') {
            element.textContent = value;
            element.classList.remove('error');
            applyColorBasedOnValue(elementId, value);
        } else {
            element.textContent = 'ERRO';
            element.className = 'error';
            hideAlertIcons(elementId);
        }
    }
}

function hideAlertIcons(elementId) {
    const alertIconId = elementId.includes('temp') ? 'temp' + elementId.substring(4) + 'alert' : 'alert' + elementId.substring(3);
    const alertIcon = document.getElementById(alertIconId);
    if (alertIcon) {
        alertIcon.style.display = 'none';
    }
}

function changeFontSize(change) {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        const currentSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));
        element.style.fontSize = `${currentSize + change}px`;
    });
}

function resetFontSize() {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        element.style.fontSize = ''
    });
}

function applyColorBasedOnValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        const alertIcons = document.querySelectorAll('.alert-icon');
        alertIcons.forEach(icon => {
            if (icon.id.startsWith('alert' + elementId.substring(3))) {
                icon.style.display = 'none';
            }
        });

        if (value === 'ERRO') {
            return;
        }

        const numberValue = parseFloat(value);
        element.className = '';
        let alertIconId;

        if (elementId.includes('temp')) {
            alertIconId = 'temp' + elementId.substring(4) + 'alert';

            if (numberValue < 23) {
                element.classList.add('below-23');
                const alertIcon = document.getElementById(alertIconId);
                if (alertIcon) {
                    alertIcon.style.display = 'inline';
                }
            } else if (numberValue >= 23 && numberValue < 26) {
                element.classList.add('between-23-26');
                alertIconId = null
            } else if (numberValue >= 26 && numberValue < 29) {
                element.classList.add('between-26-29');
                alertIconId = null
            } else if (numberValue >= 29 && numberValue < 32) {
                element.classList.add('between-29-32');
                alertIconId = null
            } else if (numberValue >= 32 && numberValue < 35) {
                element.classList.add('between-32-35');
                alertIconId = null
            } else {
                element.classList.add('above-36');
            }

        } else if (elementId.includes('hum')) {

            alertIconId = 'alert' + elementId.substring(3);

            if (numberValue < 60) {
                element.classList.add('between-0-60');
            } else if (numberValue < 70) {
                element.classList.add('between-60-70');
                alertIconId = null;
            } else {
                element.classList.add('above-70');
            }
        }

        if (alertIconId) {
            const alertIcon = document.getElementById(alertIconId);
            if (alertIcon) {
                alertIcon.style.display = (numberValue < 60 || numberValue > 70) ? 'inline' : 'none';
            }
        }
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    const content = document.getElementById('content');
    if (loader && content) {
        loader.style.display = 'none';
        content.style.display = 'block';
    }
}

function handleError(error) {
    console.error('Erro ao buscar dados:', error, bridgeURL);
    displayError();
    hideLoader();

    if (!apiWasOffline) {
        notyf.error('Servidor Offline!');
    }
    notyf.open({type: 'warning', message: 'Tentando reconectar...'});
}

function displayError() {
    const sensors = ['temp1', 'hum1', 'temp2', 'hum2', 'temp3', 'hum3'];
    sensors.forEach(sensor => updateSensorData(sensor, 'ERRO'));
}

function toggleHistorico() {
    const historicoDiv = document.querySelector('.historico');
    const h2Element = document.querySelector('.historico h2');
    const btn = document.querySelector('.button');

    if (historicoDiv && h2Element && btn) {
        historicoDiv.classList.toggle('show-content');
        h2Element.innerHTML = historicoDiv.classList.contains('show-content') ? 'Fechar Histórico' : 'Ver Histórico';
        btn.classList.toggle('show-content');
    }
}

function dropdownActivate() {
    document.getElementById("dropdown").classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        let i;
        for (i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function togglePopup() {
    var popup = document.getElementById("exportPopup");
    popup.classList.toggle("show");
}