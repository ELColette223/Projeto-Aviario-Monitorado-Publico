## Changelog

### 1.8.2p - 07-Fev-2024

Web Log:
- Correção: Bugs e JavaScript.

### 1.8.1p - 07-Fev-2024

Web Log:
- Correção: Bugs
- Refatoração: Arquivo 'assets/js/index.js'.

### 1.8.0p - 07-Fev-2024

Web Log:
- Atualização, Correção e melhoria: Arquivos JavaScript otimizados e bugs corrigidos.
- Atualização: Font Awesome para v6.5.1.
- Atualização: 'collect_data.php'.
- Melhoria: Segurança do acesso ao arquivo 'config.php'.
- Mudança: Notyf disponibilizado localmente.

- Atualização da 'collect_data.php' para v1.3.0:
    - Mudança: Link da API para coleta de dados definida em 'config.php'.
    - Adição: Verificação de dados inseridos.

- Atualização da API Bridge para v1.3.0p:
    - Adição: Endpoint '?normal' Retorna os dados do sensor em tempo real sem a média.

- Correção de bugs.

### 1.7.3p - 24-Jan-2024
Web Log:
- Adição: Timezone na 'config.php'.
- Mudança: Função 'checkSensorOnline()' para status online do sensor movida para 'controller/functions.php'.
- Correção: Token do 'collect_data.php' definido agora em 'config.php'.
- Correção: Timezone correto em 'collect_data.php'.

- Atualização da API Bridge para v1.2.3:
    - Correção: Erro ao conectar no Redis retornando 200, agora retorna 500.

- Atualização API para v1.5.2:
    - Remoção: Teste de status do ESP (já é feita pela bridge).
    - Correção: Armazenagem de cache.
    - Refatoração de código e adição de comentários.

Arquivo 'config.php':
- Adição: Definição de timezone.
- Adição: Definição de status e token de segurança da coleta de dados 'collect_data.php'

### 1.7.2p - 21-Jan-2024
Web Log:
- Correção: Notyf não definido no 'index.html'.
- Correção: Botões colados no 'index.html'.

### 1.7.1p - 21-Jan-2024
Web Log:
- Adição: Toast notifications com o [notyf](https://github.com/caroso1222/notyf).
- Mudança: 'index.html' Botões de acessibilidade alterados.
- Mudança: 'assets/css/index.css' Tamanho de fontes padrão e botões.
- Correção: Erro 'increaseFontSize not defined'.
- Correção: Filtros de datas com um dia a menos.

### 1.7.0p - 14-Jan-2024
Web Log:
- Atualização da API Bridge para v1.2.1:
    - Adição: Retry para garantir entrega de dados completos.
- Atualização config.php:
    - Adição: Controle de tentativa de conexão com o ESP32.
- Atualização: Design do ChartJS do JavaScript dos arquivos 'historico.js' e 'index.js'.
- Adição: Favicons para 'historico.html'.
- Adição: URL as APIs pelo arquivo 'config.php'.
- Adição: 'js-config-end.php' para ponte entre o arquivo 'config.php' e JavaScript.
- Remoção: Zoom e botão de zoom para 'index.html'.

### 1.6.1p - 03-Jan-2024
Web Log:
- Adição: Favicons para vários dispositivos. (Gerado por [https://realfavicongenerator.net](https://realfavicongenerator.net))

### 1.6.0p - 31-Dez-2023 🎉
Web Log:
- Atualização da API Bridge para v1.2.0:
    - Correção: Média sendo calculada com dados vazios.
    - Adição: Dados inválidos agora são ignorados.

- Estrutura dos arquivos atualizada e corrigida.
- Bug corrigido: Cor não muda ao aparecer "ERRO".
- Bug corrigido: Alerta não some após parecer "ERRO".

- Adição: Arquivo controller/controller.php para armazenar funções reutilizáveis.
- Adição: .htaccess para prevenir acesso não autorizado os debugs.
- Adição: Sistema de cache com Redis para prevenir sobrecarga do ESP.

Geral:
- Adição: Possibilidade de debug geral. (Defina em config.php).

Python Log:
- Mudança: Configurações agora ficam no arquivo config.json para facilitar updates.

### 1.5.0p - 26-Dez-2023
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
- Mudança: Apenas um arquivo para ESP32 (ou 8266) com DHT11 e DHT22. (Instruções no arquivo main.py).

Geral:
- Debug removido!

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
