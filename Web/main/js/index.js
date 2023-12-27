window.addEventListener('load', function() {
    fetchSensorData();
    setInterval(fetchSensorData, 10000);
});

function fetchSensorData() {
    const url = 'http://SEU_IP/bridge.php';
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateSensorData('temp1', data.S1.temperatura);
            updateSensorData('hum1', data.S1.umidade);

            updateSensorData('temp2', data.S2.temperatura);
            updateSensorData('hum2', data.S2.umidade);

            updateSensorData('temp3', data.S3.temperatura);
            updateSensorData('hum3', data.S3.umidade);
            hideLoader();
        })
        .catch(handleError);
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
            element.classList.add('error');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const increaseFontButton = document.getElementById('increaseFont');
    const decreaseFontButton = document.getElementById('decreaseFont');
    const resetFontButton = document.getElementById('resetFont');

    increaseFontButton.addEventListener('click', function() {
        changeFontSize(1);
    });

    decreaseFontButton.addEventListener('click', function() {
        changeFontSize(-1);
    });

    resetFontButton.addEventListener('click', function() {
        resetFontSize();
    });
});

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
                if (numberValue < 60 || numberValue > 70) {
                    alertIcon.style.display = 'inline';
                } else {
                    alertIcon.style.display = 'none';
                }
            }
        } else {
            const alertIcons = document.querySelectorAll('.alert-icon');
            alertIcons.forEach(icon => {
                if (icon.id.startsWith('alert' + elementId.substring(3))) {
                    icon.style.display = 'none';
                }
            });
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
}

function displayError() {
    const sensors = ['temp1', 'hum1', 'temp2', 'hum2', 'temp3', 'hum3'];
    sensors.forEach(sensor => updateSensorData(sensor, 'ERRO'));
}

function toggleHistorico() {
    const historicoDiv = document.querySelector('.historico');
    const h2Element = document.querySelector('.historico h2');
    const btn = document.querySelector('.button');
    const btnHistoricoDetalhado = document.querySelector('.btn-historico-detalhado');

    if (historicoDiv && h2Element && btn) {
        historicoDiv.classList.toggle('show-content');
        h2Element.innerHTML = historicoDiv.classList.contains('show-content') ? 'Fechar Histórico' : 'Ver Histórico';
        btn.classList.toggle('show-content');
        btnHistoricoDetalhado.style.display = historicoDiv.classList.contains('show-content') ? 'flex' : 'none';
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

document.addEventListener('DOMContentLoaded', function() {
    const increaseFontButton = document.getElementById('increaseFont');
    const decreaseFontButton = document.getElementById('decreaseFont');
    const resetFontButton = document.getElementById('resetFont');

    if (increaseFontButton) {
        increaseFontButton.addEventListener('click', increaseFontSize);
    }

    if (decreaseFontButton) {
        decreaseFontButton.addEventListener('click', decreaseFontSize);
    }

    if (resetFontButton) {
        resetFontButton.addEventListener('click', resetFontSize);
    }
});


let sensorChart;

document.addEventListener('DOMContentLoaded', function() {
    const sensorChartElement = document.getElementById('sensorChart');
    if (sensorChartElement) {
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
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            pinch: {
                                enabled: true,
                            },
                            drag: {
                                enabled: true,
                            },
                            wheel: {
                                enabled: true,
                            },
                            enabled: true,
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

        window.exportData = function() {
            const data = sensorChart.toBase64Image();
            const link = document.createElement('a');
            link.href = data;
            link.download = 'Dados_do_Sensor-' + moment(new Date()).format("DD/MM/YYYY") + '.png';
            link.click();
        };

        window.exportDataXlsx = function() {
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
        };

        function calculateAspectRatioHeight() {
            const width = sensorChartElement.clientWidth;
            const aspectRatio = 1;
            return width / aspectRatio;
        }

        const chartHeight = calculateAspectRatioHeight();
        sensorChartElement.style.height = `${chartHeight}px`;

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
                })
                .catch(error => console.error('Error fetching data:', error));
        }

        fetchData();
    }
});