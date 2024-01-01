import schedule
import time
import json
import subprocess
import datetime
from datetime import datetime

# Habilite para ter mensagens de debug.
DEBUG = False #True/False
DEBUG_FILE = True #True/False

def debug_print(message):
    if DEBUG:
        print(message)
    if DEBUG_FILE:
        with open('debug-auto_send.txt', 'a', encoding='utf-8') as file:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            file.write(f"{current_time}: {message}\n")

def executar_script():
    subprocess.run(["python", "notifica.py"])

def carregar_horarios():
    with open('config.json', 'r') as file:
        data = json.load(file)
        return data["horarios"]

def agendar_tarefas(horarios):
    for horario in horarios:
        schedule.every().day.at(horario).do(executar_script)

def executar_tarefa_se_pendente(horarios):
    agora = datetime.now().strftime("%H:%M")
    if agora in horarios:
        debug_print("Executando script...")
        executar_script()

debug_print("Aguardando próximo horário...")

horarios = carregar_horarios()
agendar_tarefas(horarios)
executar_tarefa_se_pendente(horarios)

while True:
    schedule.run_pending()
    time.sleep(1)
