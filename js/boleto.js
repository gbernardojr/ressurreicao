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
            COPIAR CÓDIGO
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
  const linha = document.getElementById('boletoLinha');
  if (!linha) return;
  const codigo = linha.textContent.replace(/[.\s]/g, '');
  navigator.clipboard.writeText(codigo).then(() => {
    showToast('Código copiado!');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = codigo;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast('Código copiado!');
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

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('RESSURRIÇÃO', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Ressurreição', 105, 27, { align: 'center' });
  doc.text('CNPJ: 00.000.000/0001-00', 105, 33, { align: 'center' });

  doc.line(15, 38, 195, 38);

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('BOLETO DE MENSALIDADE', 105, 48, { align: 'center' });

  let y = 58;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  const fields = [
    { label: 'Mensalidade', value: String(m?.num || m?.reg || '') },
    { label: 'Vencimento', value: formatDate(m?.vecto) },
    { label: 'Valor', value: formatCurrency(m?.valor) },
    { label: 'Jazigo', value: m?.jazigo || '-' },
    { label: 'Nosso Número', value: m?.nosso_numero || '-' },
  ];

  fields.forEach(f => {
    doc.setFont(undefined, 'bold');
    doc.text(f.label + ':', 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(f.value, 80, y);
    y += 8;
  });

  doc.line(15, y + 2, 195, y + 2);
  y += 12;

  const barcodeData = boleto.codigoBarras;
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcodeData, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false,
      margin: 5,
    });
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 30, y, 150, 20);
    y += 28;
  } catch (e) {
    y += 5;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(boleto.linhaDigitavel, 105, y, { align: 'center' });

  doc.save(`boleto_${m?.num || m?.reg || 'mensalidade'}.pdf`);
  showToast('PDF gerado com sucesso!');
}

function imprimirBoleto() {
  window.print();
}
