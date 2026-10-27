# PLANEJAMENTO DO APLICATIVO DE MENSALIDADES

## Cemitério da Ressurreição - Sistema de Consulta de Boletos

---

## 1. RESUMO EXECUTIVO

Este documento apresenta o planejamento completo para o desenvolvimento de um aplicativo mobile que permitirá aos clientes do Cemitério da Ressurreição acessarem suas mensalidades, visualizando detalhes, obtendo código de barras e gerando boletos em PDF.

**Problema atual:** Os clientes precisam comparecer ao cemitério ou entrar em contato por telefone para obter informações sobre suas mensalidades e boletos.

**Solução proposta:** App mobile com sincronização local que permite acesso offline às informações de mensalidades, com geração de código de barras e PDF do boleto.

---

## 2. ANÁLISE DO BANCO DE DADOS ATUAL

### 2.1 Banco de Dados Existente

- **Sistema:** Firebird (acesso apenas via rede interna)
- **Localização:** Servidor local no cemitério
- **Nome do banco:** RESSURREICAO.GDB

### 2.2 Tabelas Principais Utilizadas

#### RECEBER (Mensalidades)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| REG | INTEGER | Chave primária |
| NUM | INTEGER | Número da mensalidade |
| JAZIGO | VARCHAR(6) | Código do jazigo |
| VECTO | DATE | Data de vencimento |
| VALOR | FLOAT | Valor da mensalidade |
| PAGO | VARCHAR(1) | Status de pagamento (S/N) |
| PAGTO | DATE | Data de pagamento |
| NOSSONUMERO | VARCHAR(12) | Número do boleto (Bradesco) |
| FK_PROPRI | INTEGER | Chave do proprietário |

#### PROPRI (Proprietários)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODIGO | VARCHAR(6) | Chave primária |
| RESPONS | VARCHAR(50) | Nome do responsável |
| CIC | VARCHAR(14) | CPF/CNPJ |
| FONE | VARCHAR(14) | Telefone |
| ENDERECO | VARCHAR(80) | Endereço |
| CIDADE | VARCHAR(40) | Cidade |
| ESTADO | VARCHAR(2) | UF |
| VLR_MENS | FLOAT | Valor da mensalidade |
| DIA | INTEGER | Dia de vencimento |

#### CONTASBANCARIAS (Configurações do Banco)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| CC_BANCONUMERO | VARCHAR(3) | Código do banco (237 = Bradesco) |
| CC_AGENCIA | VARCHAR(15) | Agência |
| CC_CONTACORRENTE | VARCHAR(30) | Conta corrente |
| CC_CARTEIRA | VARCHAR(15) | Carteira de cobrança |
| CC_CONVENIO | VARCHAR(20) | Número do convênio |

#### JAZIGO (Informações do Jazigo)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| CODIGO | VARCHAR(6) | Chave primária |
| QUADRA | VARCHAR(10) | Quadra do jazigo |
| SETOR | VARCHAR(1) | Setor |

---

## 3. CONFIGURAÇÃO DO SUPABASE

### 3.1 Dados de Conexão

```
URL do Projeto: https://pfzulktbhivfkfzuvztd.supabase.co
Project Ref: pfzulktbhivfkfzuvztd

Strings de conexão disponíveis no dashboard do Supabase
```

### 3.2 Serviços Utilizados

| Serviço | Utilização |
|---------|------------|
| **Database (PostgreSQL)** | Armazenamento de clientes e mensalidades |
| **Auth** | Autenticação de usuários (CPF) |
| **API** | Endpoints REST automáticos |
| **Realtime** | Sincronização em tempo real |

---

## 4. JUSTIFICATIVA TECNOLÓGICA

### 4.1 Flutter (Framework Mobile)

**Escolha:** Flutter (Dart)

**Justificativas:**

1. **Desenvolvimento nativo para múltiplas plataformas**
   - Com uma única base de código, gera apps para Android e iOS
   - Reduz tempo e custo de desenvolvimento pela metade

2. **Performance nativa**
   - Compilação AOT (Ahead of Time) para código nativo
   - Rendering a 60fps com widget próprio

3. **UI consistente e customizável**
   - Widgets Material Design e Cupertino
   - Total controle sobre a interface

4. **Ecossistema maduro**
   - Grande variedade de packages
   - Comunidade ativa e crescente

**Alternativas consideradas:**
- React Native: Performance inferior
- .NET MAUI: Menor comunidade
- Kotlin/Swift native: Custos duplicados

---

### 4.2 SQLite (Banco de Dados Local)

**Escolha:** SQLite com Drift (ORM para Flutter)

**Justificativas:**

1. **Banco de dados zero-configuration**
   - Não requer servidor
   - Arquivo único no dispositivo

2. **Sincronização offline-first**
   - Dados locais sempre disponíveis
   - Sincronização em background quando online

3. **Dados específicos do usuário**
   - Cada cliente baixa apenas suas mensalidades
   - Volume de dados pequeno

4. **Segurança dos dados**
   - Dados criptografados no dispositivo

---

### 4.3 Supabase (Cloud Database)

**Escolha:** Supabase (PostgreSQL gerenciado)

**Justificativas:**

1. **PostgreSQL real**
   - Banco relacional robusto
   - Queries SQL completas e flexíveis

2. **API automática**
   - Gera REST automaticamente a partir das tabelas
   - Menos código para escrever

3. **Auth integrado**
   - Login por email, telefone, OAuth pronto
   - Suporte a CPF como identificador

4. **Realtime**
   - Atualizações automáticas via subscriptions
   - Sincronização instantânea

5. **Tempo real**
   - Gera endpoints automaticamente
   - Suporte a PostgreSQL completo

6. **Preço justo**
   - Plano gratuito generoso
   - Excelente para startups

**Alternativas consideradas:**
- DynamoDB: Mais complexo, queries limitadas
- PostgreSQL puro: Mais trabalho de configuração

---

### 4.4 Arquitetura de Sincronização

**Escolha:** Sincronização incremental com Realtime do Supabase

**Justificativas:**

1. **Sincronização incremental**
   - Apenas dados novos são transferidos
   - Economiza banda e bateria

2. **Realtime do Supabase**
   - Atualização automática quando há mudanças
   - Push notifications integradas

3. **Polling configurável**
   - Sincronização periódica quando app está em background

---

### 4.5 Geração de Boleto PDF

**Escolha:** pdf package + flutter_barcode

**Justificativas:**

1. **pdf package**
   - Controle total sobre layout
   - Conformidade com layout oficial Bradesco

2. **flutter_barcode**
   - Geração do código de barras Padrão Bradesco
   - Alta taxa de leitura nos caixas

3. **Compartilhamento nativo**
   - Flutter share_plus para compartilhar via WhatsApp, email

---

### 4.6 Autenticação

**Escolha:** Supabase Auth (integrado)

**Justificativas:**

1. **JWT**
   - Tokens de curta duração (15-30 min)
   - Stateless authentication

2. **Supabase Auth**
   - Autenticação por email/senha
   - Suporte a CPF como identificador
   - Recuperação de senha integrada
   - 2FA opcional

3. **Segurança adicional**
   - Tokens armazenados de forma segura
   - Biometria para acesso ao app (opcional)

---

## 5. ARQUITETURA DO SISTEMA

### 5.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APP MOBILE (FLUTTER)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Login     │  │ Dashboard  │  │ Mensalida- │  │   Boleto    │ │
│  │ (Supabase  │  │  (Resumo)   │  │    des     │  │ (PDF/Código │ │
│  │    Auth)    │  │             │  │  (Lista)   │  │    Barra)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    SQLite Local (Drift)                       │ │
│  │   - Dados do cliente    - Mensalidades    - Cache config     │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SUPABASE (Cloud - https://pfzulktbhivfkfzuvztd.supabase.co) │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Database   │  │    Auth     │  │    API      │              │
│  │(PostgreSQL) │  │   (JWT)     │  │  (REST)     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    │ (Sincronização periódica)
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│              FIREBIRD (Banco de Dados Original)                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  RECEBER  │  PROPRI  │  JAZIGO  │  CONTASBANCARIAS            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Fluxo de Dados

```
1. CADASTRO DO CLIENTE
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Desktop      │────▶│ Firebird     │────▶│ Sincronização│
   │ (Recepção)   │     │ (Original)   │     │ (Job)        │
   └──────────────┘     └──────────────┘     └──────────────┘
                                                    │
                                                    ▼
2. ACESSO DO CLIENTE
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ App Mobile   │────▶│ Supabase     │────▶│ App Mobile   │
   │ (Login)      │     │ Auth         │     │ (Dashboard)  │
   └──────────────┘     └──────────────┘     └──────────────┘
   
3. SINCRONIZAÇÃO
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ App (Pull)   │────▶│ API          │────▶│ Supabase      │
   │              │     │ Supabase      │     │ Database      │
   └──────────────┘     └──────────────┘     └──────────────┘

4. CONSULTA BOLETO
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ App          │────▶│ SQLite Local │────▶│ PDF + Barra  │
   │ (Seleciona)  │     │ (Offline)    │     │ (Geração)    │
   └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 6. BANCO DE DADOS DO SUPABASE

### 6.1 Tabelas no Supabase (Cloud)

```sql
-- Clientes (espelho do PROPRI)
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_propri VARCHAR(6) UNIQUE,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    nome VARCHAR(80) NOT NULL,
    telefone VARCHAR(14),
    email VARCHAR(80),
    endereco VARCHAR(80),
    bairro VARCHAR(50),
    cidade VARCHAR(40),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ativo BOOLEAN DEFAULT true,
    data_cadastro TIMESTAMPTZ DEFAULT NOW(),
    data_ultima_sincronizacao TIMESTAMPTZ
);

-- Mensalidades (espelho do RECEBER)
CREATE TABLE mensalidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    reg INTEGER NOT NULL,
    num INTEGER,
    jazigo VARCHAR(6),
    vecto DATE NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    pago BOOLEAN DEFAULT false,
    pagto DATE,
    nosso_numero VARCHAR(12),
    status VARCHAR(2),
    desc_status VARCHAR(35),
    cancelado BOOLEAN DEFAULT false,
    data_ultima_sincronizacao TIMESTAMPTZ,
    UNIQUE(cliente_id, reg)
);

-- Configurações do Banco (espelho de CONTASBANCARIAS)
CREATE TABLE config_banco (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    banco_numero VARCHAR(3) NOT NULL,
    agencia VARCHAR(15) NOT NULL,
    conta_corrente VARCHAR(30) NOT NULL,
    conta_digito VARCHAR(2),
    carteira VARCHAR(15),
    convennio VARCHAR(20),
    cedente VARCHAR(20),
    ativo BOOLEAN DEFAULT true
);

-- Logs de Sincronização
CREATE TABLE sincronizacao_log (
    id BIGSERIAL PRIMARY KEY,
    tipo VARCHAR(20),
    registros_incluidos INTEGER,
    registros_atualizados INTEGER,
    erros TEXT,
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_clientes_cpf ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_codigo ON clientes(codigo_propri);
CREATE INDEX idx_mensalidades_cliente ON mensalidades(cliente_id);
CREATE INDEX idx_mensalidades_vecto ON mensalidades(vecto);
```

### 6.2 Políticas de Segurança (RLS)

```sql
-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL POLICY;

-- Política: usuário só vê seus próprios dados
CREATE POLICY "Usuário vê próprios dados" ON clientes
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário vê próprias mensalidades" ON mensalidades
    FOR SELECT USING (
        cliente_id IN (
            SELECT id FROM clientes 
            WHERE auth.uid() = id
        )
    );
```

---

## 7. SEGURANÇA

### 7.1 Medidas de Segurança

| Camada | Medida | Descrição |
|--------|--------|------------|
| Transporte | HTTPS | TLS obrigatório |
| API | Supabase Auth | JWT tokens |
| App | Armazenamento seguro | Flutter Secure Storage |
| App | Biometria | FaceID/Fingerprint opcional |
| Dados | RLS | Row Level Security no Supabase |
| Backend | Rate limiting | Prevenção de ataques |

### 7.2 Proteção de Dados Pessoais (LGPD)

- Coleta apenas dados necessários para o serviço
- Criptografia de dados sensíveis (CPF)
- Política de privacidade clara
- Opção de exclusão de dados

---

## 8. FUNCIONALIDADES DO MVP

### 8.1 Funcionalidades Prioritárias

1. **Autenticação do Cliente**
   - Login via email/senha (Supabase Auth)
   - Primeiro acesso cria conta automaticamente
   - Recuperação de senha

2. **Dashboard**
   - Nome do cliente
   - Valor total devido
   - Próximo vencimento
   - Status geral (em dia/inadimplente)

3. **Lista de Mensalidades**
   - Todas as mensalidades do cliente
   - Status (paga/pendente/vencida)
   - Filtrar por período/ano

4. **Detalhes da Mensalidade**
   - Data de vencimento
   - Valor
   - Data de pagamento (se pago)
   - Número do boleto

5. **Geração de Boleto**
   - Código de barras (Padrão Bradesco)
   - PDF do boleto formatado
   - Compartilhamento via WhatsApp/Email

6. **Sincronização**
   - Atualização automática via Supabase Realtime
   - Pull-to-refresh manual

### 8.2 Funcionalidades Futuras (Fase 2)

- Histórico de pagamentos
- Alertas de vencimento (push notification)
- Chat com atendimento
- Localização do jazigo

---

## 9. ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Foundation (Semanas 1-4)
- [ ] Setup do ambiente Flutter
- [ ] Configuração do Supabase
- [ ] Estrutura básica de autenticação
- [ ] Conexão com API do Supabase

### Fase 2: Core Features (Semanas 5-8)
- [ ] Login e autenticação Supabase
- [ ] Dashboard do cliente
- [ ] Lista de mensalidades
- [ ] Sincronização com Supabase
- [ ] Armazenamento SQLite local

### Fase 3: Boleto (Semanas 9-12)
- [ ] Geração de código de barras
- [ ] Geração de PDF do boleto
- [ ] Funcionalidade de compartilhamento
- [ ] Tratamento de erros

### Fase 4: Polish (Semanas 13-16)
- [ ] UI/UX refinamentos
- [ ] Testes de usabilidade
- [ ] Correção de bugs
- [ ] Publicação nas stores

---

## 10. EQUIPE E RECURSOS

### 10.1 Infraestrutura

| Serviço | Plano | Custo |
|---------|-------|-------|
| Supabase Database | Free | R$ 0 |
| Supabase Auth | Included | R$ 0 |
| Supabase API | Included | R$ 0 |
| Supabase Storage | Free (5GB) | R$ 0 |

**Total infraestrutura inicial: R$ 0**

---

## 11. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Dados desatualizados no app | Alta | Médio | Sincronização frequente + realtime |
| Queda do Supabase | Baixa | Alto | Cache local + retry |
| Problemas no banco original | Alta | Alto | Logging + alertas |
| Usuário sem internet | Alta | Baixo | Modo offline completo |
| Mudanças no layout do boleto | Baixa | Médio | Template flexível |

---

## 12. CONCLUSÃO

Este planejamento apresenta uma solução robusta e escalável utilizando Supabase como cloud database. A escolha do Flutter garante desenvolvimento eficiente para ambas as plataformas, enquanto a arquitetura offline-first com SQLite garante boa experiência do usuário.

O Supabase oferece:
- Banco PostgreSQL completo com API automática
- Auth integrado para autenticação
- Realtime para sincronização instantânea
- Plano gratuito adequado para o MVP

A separação entre o banco Firebird original (via sincronização) e o Supabase permite manter a integridade do sistema atual enquanto oferece uma experiência moderna aos clientes.

---

*Documento elaborado em Abril/2026*
*Versão 2.0 - Atualizado com Supabase*
*Projeto: https://pfzulktbhivfkfzuvztd.supabase.co*