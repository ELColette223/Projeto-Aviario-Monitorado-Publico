# Aviário Monitorado - Versão Pública

Este projeto de monitoramento de Temperatura e Umidade foi desenvolvido para aviários usando ESP32 e DHT com [MicroPython](https://micropython.org/download/). Entretanto, ele pode ser adaptado para outros ambientes. **Desenvolvido para ser utilizado em ambiente Web e Windows**. Este sistema pode ser hospedado em qualquer servidor Web com MySQL, e um servidor windows para envio de notificação por WhatsApp.

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
  
</details>

- [ ] Função para limpar Cache
- [ ] App para Android (Flutter)
    - [ ] Sistema básico do App
    - [ ] Sistema de alerta por notificação firebase
- [ ] Adaptar Python para Linux

## Manual de Instalação

1. Instale o [MicroPython](https://micropython.org/download/) em seu ESP.
2. Faça as modificações necessárias no código e hardware para o seu ESP.
3. Envie os arquivos `boot.py` e `main.py`.
4. Envie os arquivos da pasta `Web/main` para o seu servidor, local ou web.
5. No SQL, crie uma tabela chamada `sensor_data` com os campos `id` (primary Auto Increment), `sensors_json` (JSON utf8mb4_bin) e `timestamp` (datetime). Alternativamente, importe o arquivo `dump.sql`.
6. Modifique o IP em `js/index.js`.
7. Modifique os IPs em `js/historico.js`.
8. Atualize os dados de `config.php`.
9. Instale a tarefa cron em seu servidor com o comando `0 * * * * /usr/bin/php /data/collect_data.php` para coleta automática de dados do ESP para o banco de dados.
10. Instale o [Python](https://www.python.org/downloads/) em seu PC (Instalação completa).
10. Baixe o [GoogleChromePortable64bits](https://drive.google.com/drive/folders/1tqb3kwqh1bLzXfG6TEc1eh6VbYTOq1zP?usp=sharing) ou [GoogleChromePortable32bits](https://drive.google.com/drive/folders/1XnBIfTEyFtG0BScimzkZAEFDWuZ0OWgt?usp=sharing) e coloque na pasta `python`.
11. Na pasta `python`, altere o arquivo `config.json` conforme necessário. Não esqueça de alterar **PATH_CHROMEDRIVER** e **PATH_CHROME_PORTABLE**, escolha entre 32 ou 64 bits para **PATH_CHROME_PORTABLE**
11. Execute o CMD na pasta `python`.
12. Execute o comando `pip install -r requirements.txt`.
13. Em primeiro momento inicie o script `notifica.py`, leia o QR Code do WhatsApp para vincula-lo. (Necessário fazer isso apenas uma vez).
13. Execute o arquivo `PAM-Auto-WhatsApp.bat` para rodar continuamente o script de envio. (Apenas Windows).
14. Para manter a continuidade, crie um atalho de `PAM-Auto-WhatsApp.bat` e coloque em `C:\Users\SEU-USER\AppData\Roaming\Microsoft\Windows\Start Menu\Programs`.
14. Após esses passos, o sistema estará configurado!

## Esquema de Hardware

<details>
  <summary>Clique para ver a representação em imagem</summary>
  <img src="https://i.ibb.co/M55KXt2/1.png" alt="hardware" width="35%"><br>
  OBS: Alterações na ligação do hardware exigirão ajustes correspondentes no código.
</details>

## Tabela utilizada como base
<details>
  <summary>Clique para ver a representação em imagem</summary>
  <img src="https://www.btaaditivos.com.br/images/tabela-temperatura-ambiente-umidade-ar.jpg" alt="tabela" width="65%"><br>
</details>

## Manual de Erros ESP32

- **Led Aceso**: Problema detectado.
- **Led Piscou 3x**: Conexão com cliente fechada.
- **Led Piscou 6x**: Erro Crítico, possível falha no funcionamento do ESP.
- **Led Piscou 10x**: Problema no Wi-Fi, verifique o sinal de rede.
- **Led Piscou 4x Longo 4x Curto**: Não foi possível se conectar com a internet

## Changelog

### 1.6.1p - 03-Jan-2024
Web Log:
- Adição: Favicons para vários dispositivos. (Gerado por [https://realfavicongenerator.net](https://realfavicongenerator.net))

### 1.6.0p - 1-Jan-2024 🎉
Web Log:
- Estrutura dos arquivos atualizada e corrigida.
- Bug corrigido: Cor não muda ao aparecer "ERRO".
- Bug corrigido: Alerta não some após parecer "ERRO".

- Atualização da API Bridge para v1.2.0:
    - Correção: Média sendo calculada com dados vazios.
    - Adição: Dados inválidos agora são ignorados.
- Adição: Arquivo controller/controller.php para armazenar funções reutilizáveis.
- Adição: .htaccess para prevenir acesso não autorizado os debugs.
- Adição: Sistema de cache com Redis para prevenir sobrecarga do ESP.

Geral:
- Adição: Possibilidade de debug geral. (Defina em config.php).

Python Log:
- Mudança: Configurações agora ficam no arquivo config.json para facilitar updates.

### v1.5.0p - 26-Dez-2023
Web Log:
- Atualização API para v1.5.0:
    - Adição: Restrição de acesso para apenas um IP (limita apenas o acesso das APIs).
    - Adição: Endpoint "api.php?raw=full" para capturar todos os dados mesmo vazios do banco de dados
    - Mudança: Tratamento em caso de dados vazios no Endpoint "api.php?raw" para que não sejam mostrados
- Atualização da API Bridge para v1.1.1:
    - Adição: Restrição de acesso para apenas um IP (limita apenas o acesso das APIs).
- Correção: Bugs e problemas.

Python Log:
- Adição: requirements.txt
- Adição: PAM-Auto-WhatsApp.bat

ESP Log:
- Mudança: Apenas um arquivo para ESP32 (ou 8266) com DHT11 e DHT22. (Instruções no arquivo ESP32/main.py).

### 1.4.0p - 25-Dez-2023

NOVO* Python:
- Sistema de notificação por WhatsApp.
- Sistema de automação de envio de mensagens por WhatsApp em horários específicos.
OBS: Sistema criado para ser utilizado em Windows com ChromeDriver.

Web Log:
- Atualização da API Bridge para v1.1.0:
    - Entrega de média dos sensores juntamente com os dados de cada sensor.
    - Multiplos testes de conexão para garantir que consiga capturar os dados do sensor.
- Atualização página inicial:
    - Em caso de temperatura ou umidade anormal aparece um alerta piscando no canto do elemento em alerta.

ESP Log:
- Correção: Bug de leitura em loop dos sensores.
- Correção: IP fixo no Software.

### 1.3.1p - 06-Dez-2023

Web Log:
- Atualização da API para v1.4.0:
    - Adição: Endpoint "raw" para pegar os dados completos do banco de dados.

### 1.3.0p - 24-Nov-2023

ESP Log:
- Adição: Controle de leds definidos em função.
- Adição: Definição de IP estático do ESP.
- Melhoria: Implementado melhor tratamento de erros e reinício em caso de erro.
- Melhoria: Código otimizado e mais robusto em caso de erros.

Web Log:
- Adição: Controle de aumento do tamanho das fontes.
- Adição: API Ponte de acesso para o ESP na v1.0.0.
    - Verificação de status do sensor.
    - Espelhamento dos dados do sensor.
- Melhoria: Coleta de dados mais segura por meio de token.
- Atualização da API para v1.3.1:
    - Adição: Controle de cache para a API.


### v1.2.0p - 16-Nov-2023

- Correção: Erro de open_basedir restriction e acesso aos arquivos.
- Correção: Zoom para PC.
- Mudança: Tempo de atualização para 10 segundos.
- Otimização: JavaScript otimizado.
- Atualização da API para v1.3.0:
    - Adição: Verificação de status online do ESP e IP do servidor.
    - Correção: Filtro para impedir divisão por zero.
    - Otimização: Segurança básica implementada.

### v1.1.0p - 13-Nov-2023

- Correções diversas de bugs.
- Melhorias no código para otimização e eficiência.
- Módulos Node adicionados para suporte a funcionalidades adicionais.
- Funcionalidade de exportar histórico em formatos PNG e XLSX adicionada.
- Atualização da API para v1.2: Sistema de cache usando JSON implementado para melhorar a performance e reduzir a carga no banco de dados.
- Nota: O recurso de zoom no histórico funciona apenas em dispositivos móveis, devido a uma limitação do ChartJS.

### v1.0.0p - 8-Nov-2023

- Primeira versão.
