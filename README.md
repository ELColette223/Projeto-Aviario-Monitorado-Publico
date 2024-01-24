# Aviário Monitorado - Versão Pública

Este projeto de monitoramento de Temperatura e Umidade foi desenvolvido para aviários usando ESP32 e DHT com [MicroPython](https://micropython.org/download/). Entretanto, ele pode ser adaptado para outros ambientes.

## Hardware Utilizado

- ESP32_universal_V4
- [DHT22](https://drive.google.com/file/d/1T-D9HKNLSp9QoKesiYCRFFy9T8083udV/view?usp=sharing) (também compatível com DHT11)
- 3x Resistores 5.6k [Explicação na página 4 do datasheet do DHT22](https://drive.google.com/file/d/1T-D9HKNLSp9QoKesiYCRFFy9T8083udV/view?usp=sharing).
- LED 3mm 5V
  
### Hardwares Compatíveis

O código do ESP32 pode ser utilizado em dispositivos semelhantes, como o ESP8266. Requisitos:
- Qualquer ESP com firmware [MicroPython](https://micropython.org/download/)

## A Fazer
<details>
  <summary>Concluídos</summary>
  
- [x] Mostrar dados na tela
- [x] Tratar possíveis erros
- [x] Sistema de histórico ligado ao MySQL
- [x] Automatização na extração de dados do ESP32 (Cron Job)
- [x] Sistema de exportação de histórico (PNG e XLSX)
- [x] Navegação entre históricos
- [x] ~~App para Android (Flutter)~~ Não há necessidade, pode ser feito um atalho pelo navegador.
- [x] Função para limpar Cache
  
</details>

- [ ] Sistema aprimorado para envio de mensagem.
- [ ] Suporte a Linux Server.
- [ ] Sistema de detecção de anormalidade.
- [ ] Melhoria na coleta de dados Cron.
- [ ] Painel Admin de Gerenciamento.
- [ ] Suporte MQTT Full.

## Manual de Instalação

#### Atenção: Seu servidor PHP precisa conter extensão redis! 

1. Instale o [MicroPython](https://micropython.org/download/) em seu ESP.
2. Faça as modificações necessárias no código e hardware para o seu ESP.
3. Envie os arquivos `boot.py` e `main.py`.
4. Envie os arquivos da pasta `Web/main` para o seu servidor, local ou web.
5. No SQL, crie uma tabela chamada `sensor_data` com os campos `id` (primary Auto Increment), `sensors_json` (JSON utf8mb4_bin) e `timestamp` (datetime). Alternativamente, importe o arquivo `dump.sql`.
6. Atualize e confira os dados de `config.php`.
7. Instale a tarefa cron em seu servidor com o comando `0 * * * * /usr/bin/php /data/collect_data.php?key=SEU_TOKEN` para coleta automática de dados do ESP para o banco de dados.
8. Instale o [Python](https://www.python.org/downloads/) em seu PC (Instalação completa).
9. Baixe o [GoogleChromePortable64bits](https://drive.google.com/drive/folders/1tqb3kwqh1bLzXfG6TEc1eh6VbYTOq1zP?usp=sharing) ou [GoogleChromePortable32bits](https://drive.google.com/drive/folders/1XnBIfTEyFtG0BScimzkZAEFDWuZ0OWgt?usp=sharing) e coloque na pasta `python`.
10. Na pasta `python`, altere o arquivo `config.json` conforme necessário. Não esqueça de alterar **PATH_CHROMEDRIVER** e **PATH_CHROME_PORTABLE**, escolha entre 32 ou 64 bits para **PATH_CHROME_PORTABLE**
11. Execute o CMD na pasta `python`.
12. Execute o comando `pip install -r requirements.txt`.
13. Em primeiro momento inicie o script `notifica.py`, leia o QR Code do WhatsApp para vincula-lo. (Necessário fazer isso apenas uma vez).
14. Execute o arquivo `PAM-Auto-WhatsApp.bat` para rodar continuamente o script de envio. (Apenas Windows).
15. Para manter a continuidade, crie um atalho de `PAM-Auto-WhatsApp.bat` e coloque em `C:\Users\SEU-USER\AppData\Roaming\Microsoft\Windows\Start Menu\Programs`.
16. Após esses passos, o sistema estará configurado!
## Esquema de Hardware

<details>
  <summary>Clique para ver a representação em imagem</summary>
  <img src="https://i.ibb.co/M55KXt2/1.png" alt="hardware" width="35%"><br>
  OBS: Alterações na ligação do hardware exigirão ajustes correspondentes no código.
</details>

## Tabela utilizada como base
<details>
  <summary>Clique para ver a representação em imagem</summary>
  <img src="https://i.ibb.co/WcZ1TW2/tabela-temperatura-ambiente-umidade-ar.jpg" alt="tabela" width="65%"><br>
</details>

## Manual de Erros ESP32

- **Led Aceso**: Problema detectado.
- **Led Piscou 3x**: Conexão com cliente fechada.
- **Led Piscou 6x**: Erro Crítico, possível falha no funcionamento do ESP.
- **Led Piscou 10x**: Problema no Wi-Fi, verifique o sinal de rede.
- **Led Piscou 4x Longo 4x Curto**: Não foi possível se conectar com a internet.

## Changelog

#### [Acessar Changelog](CHANGELOG.md)