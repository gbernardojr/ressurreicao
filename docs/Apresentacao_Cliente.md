# Projeto: App de Mensalidades do Cemitério da Ressurreição

## O que é este projeto?

É um aplicativo para celular que permitirá aos famílias acessarem suas mensalidades de forma simples e rápida, direto do celular, sem precisar ir ao cemitério ou ligar para perguntar sobre os valores.

---

## Quais são os benefícios para o cliente?

### Para o cliente (família)
- **Acesso 24 horas**: Consultar as mensalidades a qualquer momento
- **Visualizar detalhes**: Ver data de vencimento, valor, e se já foi pago
- **Gerar boleto**: Tirar o código de barras ou gerar PDF para pagamento
- **Compartilhar**: Enviar o boleto por WhatsApp ou email para outra pessoa pagar
- **Imprimir**: Se preferir, imprimir o boleto em casa

### Para o cemitério
- **Menos ligações**: Clientes resolvem suas dúvidas pelo app
- **Modernização**: Mostra que o cemitério se preocupa com a tecnologia
- **Agilidade**: Informações atualizadas na hora
- **Atendimento melhor**: Clientes satisfeitos com a facilidade

---

## Como o cliente vai usar?

1. **Baixar o app** na Play Store (Android) ou App Store (iOS)
2. **Fazer login** com o CPF (o sistema já reconhece o cadastro)
3. **Ver sua lista** de mensalidades (do ano atual e anterior)
4. **Escolher** qual mensalidade quer pagar
5. **Gerar o boleto** com código de barras pronto para pagamento
6. **Compartilhar** se quiser que outra pessoa pague

---

## Como funciona para o cemitério?

- O sistema continua usando o banco de dados atual (Firebird)
- Não precisa alterar nada no sistema que já existe
- Uma "ponte" será criada para transferir os dados para o app
- O cemitério continua cadastrando as mensalidades normalmente
- O app automaticamente mostra essas informações para o cliente

---

## O que o cliente vai ver na tela?

### Tela Inicial (Dashboard)
- Nome do cliente
- Total de mensalidades pendentes
- Próxima data de vencimento
- Situação (em dia ou com débitos)

### Lista de Mensalidades
- Mês/Ano de cada parcela
- Valor
- Status (pago/pendente/vencido)
- Data de vencimento

### Detalhes do Boleto
- Código de barras (para copiar e pagar)
- Botão para gerar PDF
- Botão para compartilhar

---

## Perguntas Frequentes

**O cliente precisa pagar para usar o app?**
Não, o app será gratuito para os clientes.

**E se o cliente não tiver internet?**
O app guarda os dados no celular. Se não tiver internet, pode ver as últimas informações baixadas.

**E se o cliente não souber usar celular?**
O app será bem simples e intuitive. Também podemos oferecer helpdesk para dúvidas.

**Os dados estão seguros?**
Sim, o app usa criptografia e login seguro. Cada cliente só vê suas próprias informações.

---

## Cronograma Previsto

| Fase | Tempo |
|------|-------|
| Desenvolvimento do sistema | 4 meses |
| Testes | 1 mês |
| Disponibilização aos clientes | 1 mês |
| **Total** | **6 meses** |

---

## O que vem depois (versões futuras)?

- Alerta no celular quando a mensalidade estiver perto do vencimento
- Histórico de pagamentos
- Chat com o atendimento do cemitério
- Parcelamento de débitos online
- Localização do jazigo no mapa do cemitério

---

## Resumo

Este projeto vai facilitar a vida dos clientes，让他们可以 pagar suas mensalidades de onde estiverem, sem precisar ir até o cemitério ou ligar para perguntar. É uma solução moderna que beneficia tanto as famílias quanto a administração do cemitério.

---

*Cemitério da Ressurreição - Innovação ao seu serviço*

*Abril/2026*