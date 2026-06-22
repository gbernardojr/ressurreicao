class BoletoModel {
  constructor(linhaDigitavel, codigoBarras) {
    this.linhaDigitavel = linhaDigitavel;
    this.codigoBarras = codigoBarras;
  }
}

class BradescoHelper {
  static gerarBoleto({ agencia, carteira, nossoNumero, contaCorrente, valor, vencimento }) {
    const banco = '237';
    const moeda = '9';

    const ag = agencia.replace(/\D/g, '').padStart(4, '0');
    const car = carteira.replace(/\D/g, '').padStart(2, '0');
    const nn = nossoNumero.replace(/\D/g, '').padStart(11, '0');
    const cc = contaCorrente.replace(/\D/g, '').padStart(7, '0');

    const fatorVencimento = this._calcularFatorVencimento(vencimento);
    const fatorStr = fatorVencimento.toString().padStart(4, '0');

    const valorStr = Math.round(valor * 100).toString().padStart(10, '0');

    const campoLivre = ag + car + nn + cc + '0';

    const baseParaDv = banco + moeda + fatorStr + valorStr + campoLivre;

    const dvGeral = this._calcularDVModulo11(baseParaDv, 9);

    const codigoBarras = baseParaDv.substring(0, 4) + dvGeral.toString() + baseParaDv.substring(4);

    const c1 = banco + moeda + campoLivre.substring(0, 5);
    const dv1 = this._calcularDVModulo10(c1);
    const campo1 = c1.substring(0, 5) + '.' + c1.substring(5) + dv1;

    const c2 = campoLivre.substring(5, 15);
    const dv2 = this._calcularDVModulo10(c2);
    const campo2 = c2.substring(0, 5) + '.' + c2.substring(5) + dv2;

    const c3 = campoLivre.substring(15, 25);
    const dv3 = this._calcularDVModulo10(c3);
    const campo3 = c3.substring(0, 5) + '.' + c3.substring(5) + dv3;

    const campo4 = dvGeral.toString();

    const campo5 = fatorStr + valorStr;

    const linhaDigitavel = campo1 + ' ' + campo2 + ' ' + campo3 + ' ' + campo4 + ' ' + campo5;

    return new BoletoModel(linhaDigitavel, codigoBarras);
  }

  static _calcularFatorVencimento(data) {
    const dataBase = new Date(1997, 9, 7);
    let diferenca = Math.floor((data - dataBase) / (1000 * 60 * 60 * 24));
    const limite = new Date(2025, 1, 21);
    if (data > limite) {
      diferenca = (diferenca - 1000) % 9000 + 1000;
    }
    return diferenca;
  }

  static _calcularDVModulo10(texto) {
    let soma = 0;
    let peso = 2;
    for (let i = texto.length - 1; i >= 0; i--) {
      let num = parseInt(texto[i]) * peso;
      if (num > 9) {
        num = Math.floor(num / 10) + (num % 10);
      }
      soma += num;
      peso = peso === 2 ? 1 : 2;
    }
    let resto = soma % 10;
    let dv = 10 - resto;
    if (dv === 10) dv = 0;
    return dv;
  }

  static parseLinhaDigitavel(linha) {
    const cleaned = linha.replace(/[.\s]/g, '');
    if (cleaned.length !== 47) return null;

    const banco = cleaned.substring(0, 3);
    const moeda = cleaned.substring(3, 4);
    const campoLivre1 = cleaned.substring(4, 9);
    const dv1 = cleaned.substring(9, 10);
    const campoLivre2 = cleaned.substring(10, 20);
    const dv2 = cleaned.substring(20, 21);
    const campoLivre3 = cleaned.substring(21, 31);
    const dv3 = cleaned.substring(31, 32);
    const dvGeral = cleaned.substring(32, 33);
    const fator = cleaned.substring(33, 37);
    const valor = cleaned.substring(37, 47);

    const campoLivre = campoLivre1 + campoLivre2 + campoLivre3;
    const codigoBarras = banco + moeda + dvGeral + fator + valor + campoLivre;

    const c1 = banco + moeda + campoLivre1;
    const c1fmt = c1.substring(0, 5) + '.' + c1.substring(5) + dv1;
    const c2fmt = campoLivre2.substring(0, 5) + '.' + campoLivre2.substring(5) + dv2;
    const c3fmt = campoLivre3.substring(0, 5) + '.' + campoLivre3.substring(5) + dv3;

    const linhaDigitavel = c1fmt + ' ' + c2fmt + ' ' + c3fmt + ' ' + dvGeral + ' ' + fator + valor;

    return new BoletoModel(linhaDigitavel, codigoBarras);
  }

  static _calcularDVModulo11(texto, base = 9) {
    let soma = 0;
    let peso = 2;
    for (let i = texto.length - 1; i >= 0; i--) {
      soma += parseInt(texto[i]) * peso;
      if (peso < base) {
        peso++;
      } else {
        peso = 2;
      }
    }
    let resto = soma % 11;
    let dv = 11 - resto;
    if (dv === 0 || dv === 10 || dv === 11) dv = 1;
    return dv;
  }
}
