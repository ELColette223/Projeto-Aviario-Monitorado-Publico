let bridgeURL = '';
let notyf;
let apiWasOffline = false;

document.addEventListener('DOMContentLoaded', function() {
    notyf = new Notyf({
        duration: 3500,
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

    setupEventListeners();
    initializeChart();
});

let sensorChart;

Chart.defaults.font.family = 'Montserrat, sans-serif';
Chart.defaults.font.style = 'normal';
Chart.defaults.font.weight = 'bold';

server_stauts = false;

function initializeChart() {
    const sensorChartElement = document.getElementById('sensorChart');
    if (!sensorChartElement) return;

    setupChart(sensorChartElement);
    setupExportFunctions();
    adjustChartHeight(sensorChartElement);
}

function setupChart(sensorChartElement) {
    window.resetZoom = resetZoom;
    
    const ctx = sensorChartElement.getContext('2d');
    const sensorChart = new Chart(ctx, {
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
            layout: {
                padding: {
                    left: 25, // Para evitar bug da data desaparecendo
                    right: 25
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            scales: {
                x: {
                    reverse: true,
                },
                y: {
                    ticks:{
                        color: '#FF6384'
                    },
                    type: 'linear',
                    display: true,
                    position: 'left',
                    id: 'y-temperatura',
                    min: 10, // Valor mínimo
                    max: 100, // Valor máximo
                },
                y1: {
                    ticks:{
                        color: '#36A2EB'
                    },
                    type: 'linear',
                    display: true,
                    position: 'right',
                    id: 'y-umidade',
                    min: 10, // Valor mínimo
                    max: 100, // Valor máximo
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        zoom: {
                            pan: {
                                enabled: false,
                                mode: 'x',
                            },
                            zoom: {
                                pinch: {
                                    enabled: false,
                                },
                                drag: {
                                    enabled: false,
                                },
                                wheel: {
                                    enabled: false,
                                },
                                mode: 'xy',
                                sensitivity: 2,
                                speed: 5
                            },
                        },
                    },
                },
            });

    function resetZoom() {
        sensorChart.resetZoom();
    }

    function applyZoom(scaleFactor) {
        const minZoom = 1;
        const maxZoom = 10;
        let currentZoom = sensorChart.options.scales.x.zoom;

        currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * scaleFactor));

        sensorChart.options.scales.x.zoom = currentZoom;
        sensorChart.update();
    }
    
    function fetchData() {
        const url = `api.php`;
        fetch(url, {
                Headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                }
            })
            .then(response => response.json())
            .then(data => {
                updateChart(data);
                server_stauts = true;
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }
    fetchData();

    function formatDate(dateString) {
        return new Date(dateString).toISOString().split('T')[0];
    }

    function updateChart(data) {
        sensorChart.data.labels = data.labels.map(label => formatDate(label));
        sensorChart.data.datasets[0].data = data.temperatures.map(temp => parseFloat(temp) || null);
        sensorChart.data.datasets[1].data = data.humidities.map(hum => parseFloat(hum.replace('%', '')) || null);

        sensorChart.data.datasets.forEach(dataset => {
            dataset.data = dataset.data.filter(value => value !== null);
        });

        sensorChart.update();
    }
}

function calculateAspectRatioHeight(sensorChartElement) {
    const width = sensorChartElement.clientWidth;
    const aspectRatio = 1;
    return width / aspectRatio;
}

function adjustChartHeight(sensorChartElement) {
    const chartHeight = calculateAspectRatioHeight(sensorChartElement);
    sensorChartElement.style.height = `${chartHeight}px`;
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
});

var apiOffline = false;

function fetchSensorData() {
    const url = bridgeURL;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 500) {
                    response.json().then(data => {
                        if (data.hasOwnProperty('success') && data.success === false) {
                            if (data.hasOwnProperty('message')) {
                                console.error('Erro:', data.message);
                            }
                        }
                    }).catch(jsonError => {
                        console.error('Erro ao processar JSON:', jsonError);
                        throw new Error('Erro interno do servidor (500), resposta não é JSON!');
                    });
                }
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

function setupExportFunctions() {
    window.exportData = exportData;
    window.exportDataXlsx = exportDataXlsx;
}

function exportData() {
    window.exportData = function() {
        if (server_stauts === true) {
            if (window.confirm('Deseja exportar os dados: "Dados_do_Sensor-' + moment(new Date()).format("DD/MM/YYYY") + ".png" + "?")) {     
                const data = sensorChart.toBase64Image();
                const link = document.createElement('a');
                link.href = data;
                link.download = 'Dados_do_Sensor-' + moment(new Date()).format("DD/MM/YYYY") + '.png';
                link.click();
                notyf.success('Dados exportados com sucesso!'); // notyf
            } else {
                notyf.error('Operação cancelada!'); // notyf
            }
        } else {
            notyf.error('Erro ao exportar dados!'); // notyf
        }
    };
}

function exportDataXlsx() {
    window.exportDataXlsx = function() {
        if (server_stauts === true) {
            try {
                if (window.confirm('Deseja exportar os dados: "Dados_do_Sensor-' + moment(new Date()).format("DD-MM-YYYY") + ".xlsx" + "?")) {   
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
        
                    XLSX.writeFile(workbook, "Dados_do_Sensor-" + moment(new Date()).format("DD-MM-YYYY") + ".xlsx");
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

function increaseFontSize() {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        const currentSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));
        element.style.fontSize = (currentSize + 1) + 'px';
    });
}

function decreaseFontSize() {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        const currentSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));
        element.style.fontSize = (currentSize - 1) + 'px';
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
    console.error('Erro ao buscar dados:', error);
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

function increaseFontSize() {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        const currentSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));
        element.style.fontSize = (currentSize + 1) + 'px';
    });
}

function decreaseFontSize() {
    const elements = document.querySelectorAll('span');
    elements.forEach(element => {
        const currentSize = parseFloat(window.getComputedStyle(element, null).getPropertyValue('font-size'));
        element.style.fontSize = (currentSize - 1) + 'px';
    });
}