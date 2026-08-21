# Manual do Usuário - Sistema Ressurreição

Este manual contém as instruções completas para utilização do **Sistema Ressurreição (Consulta de Mensalidades e Gestão Cemiterial)**, contemplando o **Módulo do Cliente** e o **Módulo Administrativo**.

---

## 📱 Sumário
1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Módulo do Cliente](#2-módulo-do-cliente)
   - [2.1. Primeiro Acesso / Cadastro de Senha](#21-primeiro-acesso--cadastro-de-senha)
   - [2.2. Acesso / Login do Cliente](#22-acesso--login-do-cliente)
   - [2.3. Recuperação de Senha](#23-recuperação-de-senha)
   - [2.4. Instalação do Aplicativo (PWA)](#24-instalação-do-aplicativo-pwa)
   - [2.5. Painel Inicial (Dashboard)](#25-painel-inicial-dashboard)
   - [2.6. Consulta e Impressão de Boletos / Mensalidades](#26-consulta-e-impressão-de-boletos--mensalidades)
   - [2.7. Consulta de Entes Queridos Falecidos](#27-consulta-de-entes-queridos-falecidos)
   - [2.8. Dados Pessoais e Alteração de Senha](#28-dados-pessoais-e-alteração-de-senha)
3. [Módulo Administrativo](#3-módulo-administrativo)
   - [3.1. Acesso à Área Restrita (Login Admin)](#31-acesso-à-área-restrita-login-admin)
   - [3.2. Consulta de Clientes e Jazigos](#32-consulta-de-clientes-e-jazigos)
   - [3.3. Ficha do Cliente e Criação de Contas de Acesso](#33-ficha-do-cliente-e-criação-de-contas-de-acesso)
   - [3.4. Consulta de Falecidos e Localizações na Área Admin](#34-consulta-de-falecidos-e-localizações-na-área-admin)
   - [3.5. Emissão e Visualização de Boletos pelo Admin](#35-emissão-e-visualização-de-boletos-pelo-admin)
   - [3.6. Gerenciamento de Usuários Administradores](#36-gerenciamento-de-usuários-administradores)
   - [3.7. Alteração de Senha do Administrador](#37-alteração-de-senha-do-administrador)
4. [Dúvidas Frequentes e Suporte](#4-dúvidas-frequentes-e-suporte)

---

## 1. Visão Geral do Sistema

O **Sistema Ressurreição** é uma plataforma web e PWA (aplicativo instalável no celular/computador) desenvolvida para a gestão e consulta de mensalidades, boletos bancários e dados de sepultamentos do Cemitério da Ressurreição.

O sistema possui dois perfis principais de acesso:
- **Cliente (Proprietário/Titular):** Acessa suas parcelas, copia linha digitável de boletos, baixa a segunda via em PDF, altera sua senha e consulta dados dos entes queridos sepultados no jazigo.
- **Administrador:** Localiza clientes por CPF/CNPJ ou número de jazigo, visualiza o histórico financeiro, gera boletos em PDF, cria contas de acesso para clientes e gerencia usuários administrativos.

---

## 2. Módulo do Cliente

### 2.1. Primeiro Acesso / Cadastro de Senha
Caso você seja um cliente cadastrado no cemitério mas ainda não possua senha de acesso ao aplicativo:
1. Acesse a tela inicial do sistema.
2. Clique no link **"Primeiro acesso? Cadastre sua senha"**.
3. Digite o seu **CPF** (apenas números ou formatado).
4. Informe o seu **E-mail** principal.
5. Crie uma **Senha de Acesso** (mínimo 6 caracteres) e confirme-a no campo correspondente.
6. Clique em **CADASTRAR**.
7. Um e-mail de confirmação será enviado para a sua caixa de entrada. Confirme o e-mail para ativar seu acesso.

### 2.2. Acesso / Login do Cliente
Para entrar no sistema após cadastrar sua senha:
1. Na tela principal, preencha o campo **CPF** com os seus 11 dígitos.
2. Informe a sua **Senha**.
3. Clique no botão **ENTRAR**.
4. Você será direcionado para o seu **Dashboard (Painel do Cliente)**.

### 2.3. Recuperação de Senha
Se esqueceu sua senha:
1. Na tela de login, clique em **"Esqueci minha senha"**.
2. Digite seu **CPF**.
3. Clique em **ENVIAR LINK**.
4. Acesse o seu e-mail cadastrado e siga as instruções enviadas para redefinir sua senha.

### 2.4. Instalação do Aplicativo (PWA)
Você pode instalar o sistema diretamente na tela inicial do seu celular ou computador:
- **No celular Android (Chrome):** Clique no link *"Instalar o sistema no dispositivo local"* na tela de login ou acesse o menu do navegador e selecione *"Adicionar à tela inicial"*.
- **No iPhone/iPad (Safari):** Toque no ícone de **Compartilhar** (quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.

---

### 2.5. Painel Inicial (Dashboard)
Ao fazer login, você verá o painel principal com as seguintes informações e recursos:
- **Saudação e Identificação:** Exibe seu nome completo e o código do proprietário.
- **Seletor de Jazigos:** Se você possuir mais de um jazigo vinculado ao seu CPF, um campo de seleção permitirá alternar entre os jazigos.
- **Resumo de Mensalidades:**
  - 🟡 **Em Aberto:** Quantidade de parcelas a vencer.
  - 🔴 **Vencidas:** Quantidade de parcelas em atraso.
  - 🟢 **Pagas:** Quantidade de parcelas quitadas.
- **Menu de Acesso Rápido:**
  - 👤 **Dados Pessoais:** Visualização do cadastro e alteração de senha.
  - ✝️ **Entes Queridos Falecidos:** Consulta de entes queridos sepultados.
  - 💳 **Mensalidades:** Acesso à lista completa de boletos.
  - 🚪 **Sair:** Desconecta sua conta do aplicativo com segurança.

---

### 2.6. Consulta e Impressão de Boletos / Mensalidades
1. Clique no botão **Mensalidades** no Dashboard.
2. Utilize os filtros no topo para listar:
   - **Todas:** Exibe todo o histórico de mensalidades.
   - **Em Aberto:** Exibe apenas parcelas pendentes com vencimento futuro.
   - **Vencido:** Exibe parcelas em atraso.
   - **Pago:** Exibe o histórico de mensalidades já quitadas.
3. Clique sobre qualquer mensalidade pendente para abrir os detalhes do boleto:
   - **Copiar Código de Barra:** Copia a linha digitável diretamente para a área de transferência do seu dispositivo, facilitando o pagamento no aplicativo do seu banco.
   - **Gerar PDF:** Baixa o arquivo do boleto bancário formatado em PDF para impressão ou visualização completa.

---

### 2.7. Consulta de Entes Queridos Falecidos
1. Clique no botão **Entes Queridos Falecidos** no Dashboard.
2. O aplicativo exibirá a lista de familiares sepultados vinculados ao seu jazigo.
3. Clique sobre o nome do ente querido para visualizar os detalhes:
   - Nome completo.
   - Data de Nascimento.
   - Data de Falecimento.
   - Data de Sepultamento.
   - Data de Exumação (quando houver).
   - **Locais de Sepultamento:** Quadra, Carneira, Jazigo e Período.

---

### 2.8. Dados Pessoais e Alteração de Senha
1. Clique no botão **Dados Pessoais** no Dashboard.
2. Confira seus dados cadastrais (CPF, telefone, e-mail, endereço completo).
3. Para alterar sua senha de acesso:
   - Preencha o campo **Senha Atual**.
   - Informe a **Nova Senha** (mínimo 6 caracteres).
   - Repita a nova senha no campo **Confirmar Nova Senha**.
   - Clique em **ALTERAR SENHA**.

---

## 3. Módulo Administrativo

### 3.1. Acesso à Área Restrita (Login Admin)
O Módulo Administrativo é de uso exclusivo de funcionários e administradores do cemitério.
1. Na tela inicial do aplicativo, clique no botão **🔒 Área Restrita**.
2. Preencha o **CPF do Administrador** e a **Senha**.
3. Clique no botão **ENTRAR COMO ADMIN**.

---

### 3.2. Consulta de Clientes e Jazigos
1. Ao acessar o painel administrativo, utilize a caixa de pesquisa **🔍 Consulta de Clientes / Jazigos**.
2. Você pode pesquisar por:
   - **CPF ou CNPJ** do cliente (ex: `123.456.789-00` ou apenas números).
   - **Número do Jazigo / Código do Proprietário** (ex: `0252`).
3. Clique em **BUSCAR** ou pressione *Enter*.
4. O sistema exibirá a lista de clientes ou jazigos encontrados. Clique sobre o cliente desejado para abrir a ficha de detalhes.

---

### 3.3. Ficha do Cliente e Criação de Contas de Acesso
Ao selecionar um cliente, a ficha exibirá:
- Nome completo, código do proprietário e CPF/CNPJ.
- **Botão "🔑 Criar conta de acesso para este cliente":** Permite ao administrador gerar uma conta de acesso e senha temporária para o cliente consultar suas mensalidades no aplicativo.

---

### 3.4. Consulta de Falecidos e Localizações na Área Admin
Na ficha do cliente selecionado, a seção **✝️ Entes Queridos Falecidos** exibe automaticamente:
- A lista de falecidos vinculados àquele titular/jazigo.
- Todas as datas registradas (Nascimento, Falecimento, Sepultamento, Exumação).
- **📍 Locais de Sepultamento:** Informações detalhadas do Jazigo, Quadra e Carneira onde o sepultamento está localizado.

---

### 3.5. Emissão e Visualização de Boletos pelo Admin
Na seção **💳 Mensalidades / Boletos** da ficha do cliente:
1. Filtre por *Todas*, *Em Aberto*, *Vencido* ou *Pago*.
2. Clique sobre a mensalidade desejada.
3. Na tela do boleto admin, utilize as opções:
   - **COPIAR CÓDIGO DE BARRA:** Copia a linha digitável do boleto.
   - **GERAR PDF:** Gera e baixa o boleto bancário formatado em PDF para impressão e entrega ao cliente na recepção ou atendimento.

---

### 3.6. Gerenciamento de Usuários Administradores
Administradores têm permissão para gerenciar a equipe de acesso ao sistema:
1. No painel principal do módulo administrativo, clique no botão **⚙️ Gerenciar Administradores**.
2. **Cadastrar Novo Administrador:**
   - Preencha Nome, E-mail, CPF e a Senha Inicial.
   - Clique em **CADASTRAR ADMINISTRADOR**.
3. **Listagem e Status:**
   - Visualize a lista de administradores cadastrados.
   - Clique em **Desativar** para revogar temporariamente o acesso de um administrador ou em **Ativar** para reestabelecer o acesso.

---

### 3.7. Alteração de Senha do Administrador
O administrador pode alterar a sua própria senha de acesso a qualquer momento:
1. No painel principal do módulo administrativo, clique no botão **🔑 Alterar Minha Senha**.
2. Preencha os campos:
   - **Senha Atual:** Informe a sua senha de acesso atual.
   - **Nova Senha:** Digite a nova senha desejada (mínimo de 6 caracteres).
   - **Confirmar Nova Senha:** Digite novamente a nova senha para confirmação.
3. Clique em **ALTERAR SENHA**. A nova senha entrará em vigor imediatamente para os próximos acessos.

---

## 4. Dúvidas Frequentes e Suporte

- **O que fazer se o CPF não for encontrado no login?**
  - Verifique se o CPF foi digitado corretamente. Caso o cliente seja novo ou esteja cadastrado com um CPF/CNPJ diferente no sistema do cemitério, entre em contato com a administração.
- **Como imprimir um boleto pelo celular?**
  - Clique em **GERAR PDF**. O boleto será salvo na pasta de downloads do celular. Você poderá abri-lo e enviar para uma impressora via Wi-Fi/Bluetooth ou compartilhar o arquivo.
- **O código de barras do PDF é aceito nos bancos?**
  - Sim! Os boletos gerados contêm código de barras padrão FEBRABAN e linha digitável válidos para pagamento em qualquer aplicativo bancário, internet banking ou lotérica.
