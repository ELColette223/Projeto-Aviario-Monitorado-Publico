from collections import OrderedDict
import ubinascii
import network
import socket
import ujson
import machine
import dht
import time
import gc

# Configurações do Wi-Fi
ssid = 'SSID_REDE'
password = 'SENHA_REDE'

# Define o IP do ESP
ip = '192.168.0.219' # IP de operação do ESP
netmask = '255.255.255.0' # Mascara da sua rede
gateway = '192.168.0.1' # Seu Gateway
dns = '8.8.8.8' # Google DNS

station = network.WLAN(network.STA_IF)

# Descomente conforme o sensor que estiver usando (DHT11 ou DHT22)

# Inicializa os sensores DHT22
sensor1 = dht.DHT22(machine.Pin(12))
sensor2 = dht.DHT22(machine.Pin(13))
sensor3 = dht.DHT22(machine.Pin(14))

# Inicializa os sensores DHT11
#sensor1 = dht.DHT11(machine.Pin(12))
#sensor2 = dht.DHT11(machine.Pin(13))
#sensor3 = dht.DHT11(machine.Pin(14))

# Define o pino da LED
led = machine.Pin(16, machine.Pin.OUT)

# Função para piscar o LED
def blink_led(duration, count):
    for _ in range(count):
        led.value(1)  # Liga o LED
        time.sleep(duration)
        led.value(0)  # Desliga o LED
        time.sleep(duration)

def connect_to_wifi(ssid, password):
    print("Tentando conectar ao Wi-Fi...")
    led.value(1)
    station.active(False)  # Desativa e reativa o módulo de rede
    time.sleep(1)
    station.active(True)
    station.connect(ssid, password)
    station.ifconfig((ip, netmask, gateway, dns))
    start_time = time.time()

    while not station.isconnected():
        if time.time() - start_time > 20:  # Aumenta o timeout para 20 segundos
            print("Falha na conexão Wi-Fi. Tentando novamente...")
            led.value(0)
            return False
        led.value(not led.value())  # Pisca a LED enquanto tenta conectar
    print('Conexão estabelecida')
    print(station.ifconfig())
    led.value(0)
    
    return True

def check_wifi():
    if not station.isconnected():
        print('Desconectado do WiFi. Tentando reconectar...')
        return connect_to_wifi(ssid, password)
    return True

def read_sensor(sensor):
    try:
        sensor.measure()
        return sensor.temperature(), sensor.humidity()
    except Exception as e:
        pass
    print('Erro ao ler os sensores')
    blink_led(0.5, 3)# Led Piscou 3x: Conexão com cliente fechada.
    return None, None

# Gera a página web com os dados dos sensores
def web_page():
    temperature1, humidity1 = read_sensor(sensor1)
    temperature2, humidity2 = read_sensor(sensor2)
    temperature3, humidity3 = read_sensor(sensor3)
    
    info = OrderedDict({
        "S1": {
            "umidade": "{}%".format(humidity1) if humidity1 is not None else "",
            "temperatura": "{:.1f}°C".format(temperature1) if temperature1 is not None else "",
        },
        "S2": {
            "umidade": "{}%".format(humidity2) if humidity2 is not None else "",
            "temperatura": "{:.1f}°C".format(temperature2) if temperature2 is not None else "",
        },
        "S3": {
            "umidade": "{}%".format(humidity3) if humidity3 is not None else "",
            "temperatura": "{:.1f}°C".format(temperature3) if temperature3 is not None else "",
            
        },
    })
    json_info = ujson.dumps(info)
    return json_info

# Executa o servidor
def run_server():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 80))
    s.listen(5)

    while True:
        if not check_wifi():
            time.sleep(5)
            continue

        gc.collect()
        try:
            conn, addr = s.accept()
            conn.settimeout(5)  # Timeout para a conexão
            led.value(1) # Led acende
            print('Conexão recebida de %s' % str(addr))
            request = conn.recv(1024)
            response = web_page()
            conn.send('HTTP/1.1 200 OK\n')
            conn.send('Content-Type: application/json\n')
            conn.send('Access-Control-Allow-Origin: *\n')
            conn.send('Connection: close\n\n')
            conn.sendall(response)
            conn.close()
            led.value(0) # Led apaga
        except Exception as e:
            print('Erro:', e)
            if conn:
                conn.close()
                blink_led(0.3, 3)
try:
    if not connect_to_wifi(ssid, password):
        print("Não foi possível conectar ao Wi-Fi. Verifique as credenciais.")
        machine.reset()
    else:
        run_server()
except Exception as e:
    print("Erro crítico:", e)
    blink_led(0.5, 6)
    machine.reset()


