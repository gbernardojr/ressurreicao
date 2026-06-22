function renderBoleto(mensalidadeId) {
  const m = AppState.mensalidades.find(x => (x.id === mensalidadeId) || String(x.reg) === mensalidadeId);

  if (!m) {
    navigate('#/mensalidades');
    return;
  }

  AppState._mensalidadeAtual = m;

  const isPago = m.pago === true;
  const config = AppState.configBanco;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-bar">
      <button class="btn-icon" onclick="navigate('#/mensalidades')">&#8592;</button>
      <span class="title">Mensalidade ${m.num || m.reg}</span>
    </div>
    <div class="main-content">
      <div class="card">
        <div class="boleto-info-row">
          <span class="boleto-label">Mensalidade</span>
          <span class="boleto-value">${m.num || m.reg}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Vencimento</span>
          <span class="boleto-value">${formatDate(m.vecto)}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Valor</span>
          <span class="boleto-value">${formatCurrency(m.valor)}</span>
        </div>
        <div class="boleto-info-row">
          <span class="boleto-label">Jazigo</span>
          <span class="boleto-value">${m.jazigo || '-'}</span>
        </div>
        ${m.nosso_numero ? `<div class="boleto-info-row"><span class="boleto-label">Nosso Número</span><span class="boleto-value">${m.nosso_numero}</span></div>` : ''}
        ${m.bol_pagador_nome ? `<div class="boleto-info-row"><span class="boleto-label">Pagador</span><span class="boleto-value">${m.bol_pagador_nome}</span></div>` : ''}
        ${m.bol_mensagem2 ? `<div class="boleto-info-row"><span class="boleto-label">Mensagem</span><span class="boleto-value" style="font-size:12px">${m.bol_mensagem2}</span></div>` : ''}
        <div class="boleto-info-row">
          <span class="boleto-label">Status</span>
          <span class="boleto-value" style="color:${isPago ? 'var(--success)' : 'var(--warning)'}">${isPago ? 'Pago' : 'Pendente'}</span>
        </div>
        ${isPago && m.pagto ? `<div class="boleto-info-row"><span class="boleto-label">Pago em</span><span class="boleto-value">${formatDate(m.pagto)}</span></div>` : ''}
      </div>

      ${!isPago ? `
        <div class="card">
          <div id="boletoBarcode" style="display:flex;justify-content:center;padding:16px 0">
            <div class="spinner"></div>
          </div>
          <div id="boletoLinha" class="linha-digitavel"></div>
          <button class="btn btn-primary no-print" onclick="copiarLinhaDigitavel()" style="margin-bottom:12px">
            COPIAR CÓDIGO DE BARRA
          </button>
          <button class="btn btn-outline no-print" onclick="gerarPdfBoleto()">
            GERAR PDF
          </button>
          <button class="btn btn-outline no-print" onclick="imprimirBoleto()" style="margin-top:8px">
            IMPRIMIR
          </button>
        </div>
      ` : `
        <div class="card" style="text-align:center;padding:32px">
          <div style="font-size:48px;margin-bottom:16px">&#x2705;</div>
          <p style="font-size:18px;font-weight:600;color:var(--success)">Mensalidade paga</p>
          <p style="color:var(--text-secondary);margin-top:8px">Esta mensalidade já foi quitada.</p>
        </div>
      `}
    </div>
  `;

  if (!isPago && config) {
    setTimeout(() => gerarBarcode(m, config), 200);
  }
}

function gerarBarcode(m, config) {
  try {
    const boleto = BradescoHelper.gerarBoleto({
      agencia: config.agencia || '0000',
      carteira: config.carteira || '06',
      nossoNumero: m.nosso_numero || String(m.reg),
      contaCorrente: config.conta_corrente || '0000000',
      valor: m.valor || 0,
      vencimento: new Date(m.vecto),
    });

    AppState._boletoAtual = boleto;

    const container = document.getElementById('boletoBarcode');
    container.innerHTML = '<svg id="barcodeSvg"></svg>';

    JsBarcode('#barcodeSvg', boleto.codigoBarras, {
      format: 'CODE128',
      width: 2,
      height: 80,
      displayValue: false,
      margin: 10,
    });

    document.getElementById('boletoLinha').textContent = boleto.linhaDigitavel;
  } catch (err) {
    document.getElementById('boletoBarcode').innerHTML =
      '<p style="color:var(--danger)">Erro ao gerar código de barras</p>';
  }
}

function copiarLinhaDigitavel() {
  const boleto = AppState._boletoAtual;
  if (!boleto || !boleto.linhaDigitavel) {
    showToast('Gere o código de barras primeiro');
    return;
  }
  const codigo = boleto.linhaDigitavel.replace(/[.\s]/g, '');
  navigator.clipboard.writeText(codigo).then(() => {
    showToast('Código copiado!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = codigo;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Código copiado!');
    } catch (e) {
      showToast('Erro ao copiar. Selecione manualmente.');
    }
    textarea.remove();
  });
}

function gerarPdfBoleto() {
  const boleto = AppState._boletoAtual;
  const m = AppState._mensalidadeAtual;

  if (!boleto || !m) {
    showToast('Gere o código de barras primeiro');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('P', 'mm', 'A4');

  const df = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return String(dt.getDate()).padStart(2,'0') + '/' + String(dt.getMonth()+1).padStart(2,'0') + '/' + dt.getFullYear();
  };
  const cf = (v) => {
    if (v == null) return '';
    return 'R$ ' + Number(v).toFixed(2).replace('.',',');
  };

  const cedente = 'CEMITÉRIO FACE DO SOL';
  const cnpjCedente = m.cpf_cnpj || '';
  const agencia = AppState.configBanco?.agencia || '';
  const conta = AppState.configBanco?.conta_corrente || '';
  const nossoNumero = m.nosso_numero || '';
  const vencimento = m.vecto ? new Date(m.vecto) : new Date();
  const valor = m.valor || 0;

  const bolMensagem2 = m.bol_mensagem2 || 'APOS 30 DIAS DO VENCIMENTO O TITULO SERA PROTESTADO AUTOMAT.';
  const bolEspecie = m.bol_especie || '12';
  const bolMultaPerc = m.bol_multa_perc;
  const bolMora = m.bol_mora;
  const bolEmissao = m.bol_emissao;
  const bolPagadorNome = m.bol_pagador_nome || m.cliente_nome || '';
  const bolPagadorCpfCnpj = m.bol_pagador_cpf_cnpj;
  const bolPagadorEndereco = m.bol_pagador_endereco;
  const bolPagadorBairro = m.bol_pagador_bairro;
  const bolPagadorCidade = m.bol_pagador_cidade;
  const bolPagadorUf = m.bol_pagador_uf;
  const bolPagadorCep = m.bol_pagador_cep;

  let enderecoPagador = bolPagadorEndereco || '';
  if (bolPagadorBairro) enderecoPagador += ' - ' + bolPagadorBairro;
  if (bolPagadorCidade) enderecoPagador += ' - ' + bolPagadorCidade;
  if (bolPagadorUf) enderecoPagador += '/' + bolPagadorUf;
  if (bolPagadorCep) enderecoPagador += ' - CEP: ' + bolPagadorCep;

  const especieMap = {'01':'CHEQUE','02':'DM','03':'DMI','04':'NOTA','12':'DM','17':'RC','20':'AP','99':'OU'};

  // Helper: draw a field cell
  function drawCell(x, y, w, h, label, value, opts) {
    opts = opts || {};
    doc.setDrawColor(180);
    doc.rect(x, y, w, h);
    doc.setFontSize(5);
    doc.setTextColor(100);
    doc.text(label, x + 1, y + 3);
    doc.setFontSize(opts.fontSize || 8);
    doc.setTextColor(0);
    if (opts.bold !== false) doc.setFont(undefined, 'bold');
    doc.text(String(value || ' '), x + 1, y + (opts.fontSize || 8) + 2);
    doc.setFont(undefined, 'normal');
  }

  // Helper: draw a row of cells
  function drawRow(y, cells, heights) {
    let x = 15;
    const rowH = heights || 12;
    cells.forEach(c => {
      const w = c.w || 40;
      const label = c.label || '';
      const value = c.value !== undefined ? c.value : '';
      drawCell(x, y, w, rowH, label, String(value), c.opts || {});
      x += w;
    });
    return y + rowH;
  }

  // Helper: draw a full-width cell
  function drawFullCell(y, h, label, value, opts) {
    drawCell(15, y, 180, h, label, value, opts);
    return y + h;
  }

  let y = 15;

  // ==================== TOPO: RECIBO DO PAGADOR ====================
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text('BANCO BRADESCO', 15, y);
  doc.setFontSize(14);
  doc.setTextColor(255, 152, 0);
  doc.text('237-2', 180, y, { align: 'right' });
  y += 8;

  // Barcode + linha digitavel
  const barcodeContainerH = 32;
  doc.setDrawColor(255, 152, 0);
  doc.setLineWidth(1.5);
  doc.rect(15, y, 180, barcodeContainerH);

  // Barcode image
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, boleto.codigoBarras, {
      format: 'CODE128',
      width: 1.2,
      height: 30,
      displayValue: false,
      margin: 5,
    });
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 30, y + 2, 150, 16);
  } catch (e) {}

  // Linha digitavel
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text(boleto.linhaDigitavel, 105, y + barcodeContainerH - 4, { align: 'center' });
  y += barcodeContainerH + 2;

  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(100);
  doc.text('RECIBO DO PAGADOR', 15, y);
  y += 5;

  // Recibo fields
  y = drawRow(y, [
    { label: 'Beneficiário', value: cedente, w: 120 },
    { label: 'CNPJ/CPF', value: cnpjCedente, w: 60 },
  ]);

  y = drawRow(y, [
    { label: 'Agência/Código', value: agencia + ' / ' + conta, w: 72 },
    { label: 'Vencimento', value: df(vencimento), w: 54 },
    { label: 'Valor', value: cf(valor), w: 54, opts: { bold: true } },
  ]);

  const row3cells = [
    { label: 'Nosso Número', value: nossoNumero, w: 72 },
    { label: 'Espécie', value: especieMap[bolEspecie] || bolEspecie, w: 27 },
  ];
  if (bolMultaPerc && Number(bolMultaPerc) > 0) {
    row3cells.push({ label: 'Multa', value: bolMultaPerc + '%', w: 27 });
  }
  if (bolMora && Number(bolMora) > 0) {
    row3cells.push({ label: 'Mora', value: cf(bolMora), w: 27 });
  }
  // fill remaining
  const usedW = row3cells.reduce((s, c) => s + c.w, 0);
  if (usedW < 180) {
    row3cells.push({ label: '', value: '', w: 180 - usedW });
  }
  y = drawRow(y, row3cells);

  y = drawRow(y, [
    { label: 'Pagador', value: bolPagadorNome, w: 120 },
    { label: 'CPF/CNPJ', value: bolPagadorCpfCnpj || '', w: 60 },
  ]);

  if (enderecoPagador) {
    y = drawFullCell(y, 12, 'Endereço', enderecoPagador);
  }

  // Mensagem
  y = drawFullCell(y, 10, 'Mensagem', bolMensagem2, { fontSize: 6, bold: false });

  // ==================== LINHA DE CORTE ====================
  y += 8;
  doc.setFontSize(7);
  doc.setTextColor(150);
  const corteW = 60;
  doc.text('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 15, y);
  doc.text('CORTE AQUI', 105, y, { align: 'center' });
  doc.text('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -', 195, y, { align: 'right' });
  y += 10;

  // ==================== BOLETO BANCÁRIO ====================
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text('BANCO BRADESCO', 15, y);
  doc.setFontSize(12);
  doc.text('237-2', 55, y);
  doc.setFontSize(10);
  doc.text(boleto.linhaDigitavel, 180, y, { align: 'right' });
  y += 8;

  // Boleto fields
  y = drawRow(y, [
    { label: 'Local de Pagamento', value: 'PAGÁVEL PREFERENCIALMENTE NA REDE BRADESCO', w: 126 },
    { label: 'Vencimento', value: df(vencimento), w: 54 },
  ]);

  y = drawRow(y, [
    { label: 'Beneficiário', value: cedente + ' - CNPJ: ' + cnpjCedente, w: 126 },
    { label: 'Ag/Código Beneficiário', value: agencia + ' / ' + conta, w: 54 },
  ]);

  y = drawRow(y, [
    { label: 'Data Emissão', value: bolEmissao ? df(bolEmissao) : df(new Date()), w: 36 },
    { label: 'Nosso Número', value: nossoNumero, w: 54 },
    { label: 'Espécie', value: especieMap[bolEspecie] || bolEspecie, w: 27 },
    { label: 'Quantidade', value: '', w: 27 },
    { label: 'Valor', value: cf(valor), w: 36, opts: { bold: true } },
  ]);

  const rowDesconto = [
    { label: '(-) Desconto / Abatimento', value: '', w: 72 },
  ];
  if (bolMultaPerc && Number(bolMultaPerc) > 0) {
    rowDesconto.push({ label: '(+) Multa', value: bolMultaPerc + '%', w: 36 });
  }
  if (bolMora && Number(bolMora) > 0) {
    rowDesconto.push({ label: '(+) Mora/Dia', value: cf(bolMora), w: 36 });
  }
  rowDesconto.push({ label: '(=) Valor Total', value: cf(valor), w: 36, opts: { bold: true, fontSize: 7 } });
  y = drawRow(y, rowDesconto);

  y = drawRow(y, [
    { label: 'Pagador', value: bolPagadorNome, w: 120 },
    { label: 'CPF/CNPJ', value: bolPagadorCpfCnpj || '', w: 60 },
  ]);

  if (enderecoPagador) {
    y = drawFullCell(y, 12, 'Endereço', enderecoPagador);
  }

  // Mensagem
  y = drawFullCell(y, 10, 'Mensagem', bolMensagem2, { fontSize: 6, bold: false });

  // Código de Barras
  y += 6;
  try {
    const canvas2 = document.createElement('canvas');
    JsBarcode(canvas2, boleto.codigoBarras, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false,
      margin: 5,
    });
    const imgData2 = canvas2.toDataURL('image/png');
    doc.addImage(imgData2, 'PNG', 30, y, 150, 22);
  } catch (e) {}

  doc.save('boleto_' + (m.num || m.reg || 'mensalidade') + '.pdf');
  showToast('PDF gerado com sucesso!');
}

function imprimirBoleto() {
  window.print();
}
