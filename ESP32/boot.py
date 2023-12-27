# Este arquivo é executado na inicialização do ESP32
# Bibliotecas necessárias para execução correta do código

from collections import OrderedDict
import ubinascii
import time
import esp
import webrepl
import network
import socket
import ujson
import machine
import dht
import gc
import uping

led = machine.Pin(16, machine.Pin.OUT)

# Garante a inicialização correta do ESP
try:
    print('Iniciando main.py...')
    import main
except Exception as e: # Em caso de erro imprime no console, acende a led e reinicia o ESP
    print('Falha ao executar main.py', e)
    led.value(1)
    time.sleep(5)
    machine.reset()
