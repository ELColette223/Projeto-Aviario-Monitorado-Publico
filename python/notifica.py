import os
import requests
import json
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import time
import pyperclip
import subprocess
import datetime

# Configurações do script, altere no arquivo config.json para alterar as configurações
api_url = json.load(open('config.json'))['api_url']
phone_number = json.load(open('config.json'))['phone_number']
SENSOR_ID = json.load(open('config.json'))['sensor_id']
PATH_CHROMEDRIVER = json.load(open('config.json'))['PATH_CHROMEDRIVER']
PATH_CHROME_PORTABLE = json.load(open('config.json'))['PATH_CHROME_PORTABLE']
PROFILE_PATH = json.load(open('config.json'))['PROFILE_PATH']

# Habilite para ter mensagens de debug.
DEBUG = True #True/False
DEBUG_FILE = True #True/False

def debug_print(message):
    if DEBUG:
        print(message)
    if DEBUG_FILE:
        with open('debug-notifica.txt', 'a', encoding='utf-8') as file:
            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"{current_time}: {message}\n")

def get_sensor_data_json(api_url):
    debug_print('Tentando conectar na API...')
    while True:
        response = requests.get(api_url)
        if response.status_code == 200:
            try:
                data = response.json()

                if 'success' in data and not data['success']:
                    error_message = data.get('message', 'Erro desconhecido.')
                    debug_print("Erro na API:", error_message)
                    debug_print("Tentando novamente em 3 segundos...")
                    time.sleep(3)
                    continue

                return data
            
            except json.JSONDecodeError:
                debug_print("Erro ao decodificar JSON")
                return {'error': 'Erro ao decodificar JSON'}
        else:
            debug_print(f'Erro ao acessar a API: Status {response.status_code}')
            time.sleep(5)


def check_conditions(data):
    sensor_id = SENSOR_ID
 
    # Verifique se o sensor escolhido está nos dados
    if sensor_id not in data:
        debug_print(f"Sensor {sensor_id} não encontrado nos dados.")
        return ''

    sensor_data = data[sensor_id]
    temperature = float(sensor_data['temperatura'].replace('°C', ''))
    humidity = float(sensor_data['umidade'].replace('%', ''))
    base_message = "🚨 Alertas: %0D%0A\n"

    # Verifica as condições de temperatura e umidade
    if temperature <= 23:
        base_message += f"❄️ Muito Frio, *{temperature}°C* %0D%0A"
    elif temperature > 36:
        base_message += f"🔥 Muito quente, *{temperature}°C* %0D%0A"

    if humidity <= 60:
        base_message += f"🌵 Umidade baixa, *{humidity}%* %0D%0A"
    elif humidity >= 70:
        base_message += f"💧 Umidade Alta, *{humidity}%* %0D%0A"

    # Substitui o identificador do sensor para a localização do sensor
    sensor_id = sensor_id.replace('S1', '25m').replace('S2', '50m').replace('S3', '75m')

    if base_message == "🚨 Alertas: %0D%0A\n":
        return ''

    return base_message

def send_whatsapp_message(phone_number, message):
    profile_path = PROFILE_PATH
    options = Options()
    options.binary_location = PATH_CHROME_PORTABLE
    options.add_argument('--user-data-dir=' + profile_path)

    phone_number = phone_number
    message = message

    s = Service(PATH_CHROMEDRIVER)
    driver = webdriver.Chrome(service=s, options=options)

    # Inicializa o WhatsApp Web
    driver.get("https://web.whatsapp.com/")
    
    debug_print("Passo 1")

    # Aguarde o usuário fazer o login no WhatsApp Web
    try:
        WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.XPATH, '//*[@id="app"]/div/div[2]/div[3]/header/div[1]/div/div/span')))
        debug_print("Login no WhatsApp Web confirmado.")
        debug_print("Passo 2")
    except TimeoutException:
        debug_print("Tempo limite excedido para login no WhatsApp Web")
        driver.quit()
    except NoSuchElementException:
        debug_print("Login no WhatsApp Web falhou")
        driver.quit()
    except Exception as e:
        debug_print("Erro desconhecido ao fazer login no WhatsApp Web")
        print(e)
        driver.quit()
    
    # Recarrega o link de envio de mensagem
    driver.get("https://web.whatsapp.com/send?phone=" + phone_number + "&text=" + message)
    debug_print("Passo 3")
    time.sleep(7)  # Aguarde o carregamento da página

    pyperclip.copy(message)  # Copiar mensagem para área de transferência

    debug_print("Passo 4")
    # Localizar o campo de entrada de mensagem e digitar a mensagem
    message_box = driver.find_element(By.XPATH, '//*[@id="main"]/footer/div[1]/div/span[2]/div/div[2]/div[2]/button')
    message_box.send_keys(Keys.CONTROL, 'v')
    message_box.send_keys(Keys.ENTER)
    debug_print("Passo 5")

    time.sleep(5)  # Aguarde a mensagem ser enviada
    debug_print("Passo 6 - fim")
    print('Mensagem enviada com sucesso.')
    driver.quit()

# Obter dados do sensor
data = get_sensor_data_json(api_url)

if data and 'error' not in data:
    alert_message = check_conditions(data)
    if alert_message != '':
        debug_print('Enviando mensagem de alerta: \n' + alert_message)
        send_whatsapp_message(phone_number, alert_message)
        debug_print(alert_message)
    else:
        debug_print("Nenhum alerta detectado.")

elif 'error' in data:
    # Enviar mensagem de erro
    send_whatsapp_message(phone_number, f"❌ Erro: {data['error']}")
    debug_print(data['error'])
else:
    debug_print("Erro ao obter dados do sensor.")
