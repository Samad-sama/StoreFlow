import { formatCurrency } from './utils';

export interface InvoicePrintData {
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  saleNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  cashierName?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    unit?: string;
  }[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  totalAmount: number;
  paidAmount: number;
  remainingDebt?: number;
  customerTotalDebt?: number;
  changeDue?: number;
  notes?: string;
  format?: 'thermal' | 'a4';
  language?: 'ar' | 'fr' | 'en';
}

export function printInvoice(data: InvoicePrintData) {
  const isArabic = data.language !== 'en' && data.language !== 'fr';
  const isA4 = data.format === 'a4';
  const currencySymbol = isArabic ? 'د.ج' : 'DA';

  const formatMoney = (val: number) => formatCurrency(val, 'DZD', isArabic ? 'ar-DZ' : 'fr-FR');

  let iframe = document.getElementById('storeflow-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'storeflow-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  const html = `
<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'fr'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>${data.saleNumber} - ${data.storeName}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: ${
        isArabic
          ? "'Segoe UI', Tahoma, -apple-system, BlinkMacSystemFont, Arial, sans-serif"
          : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      };
      color: #000;
      background: #fff;
      font-size: ${isA4 ? '13px' : '12px'};
      line-height: 1.4;
    }

    @page {
      size: ${isA4 ? 'A4 portrait' : '80mm auto'};
      margin: ${isA4 ? '15mm' : '4mm 4mm 10mm 4mm'};
    }

    /* THERMAL 80MM RECEIPT STYLES */
    .thermal-receipt {
      width: 72mm;
      margin: 0 auto;
      padding: 2mm 0;
    }
    .thermal-header {
      text-align: center;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
      margin-bottom: 8px;
    }
    .thermal-header h1 {
      font-size: 18px;
      font-weight: 900;
      margin-bottom: 2px;
    }
    .thermal-header p {
      font-size: 11px;
      color: #333;
    }
    .thermal-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 11px;
    }
    .thermal-table th {
      border-bottom: 1px dashed #000;
      padding: 4px 0;
      text-align: ${isArabic ? 'right' : 'left'};
      font-weight: bold;
    }
    .thermal-table td {
      padding: 4px 0;
      vertical-align: top;
    }
    .thermal-totals {
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 12px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .bold-row {
      font-size: 14px;
      font-weight: 900;
      border-top: 1px solid #000;
      padding-top: 4px;
      margin-top: 4px;
    }
    .debt-badge {
      border: 1px dashed #000;
      padding: 4px;
      margin: 6px 0;
      font-weight: bold;
      text-align: center;
      background: #f8f8f8;
    }
    .thermal-footer {
      text-align: center;
      font-size: 10px;
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px dashed #000;
    }

    /* A4 OFFICIAL FACTURE STYLES */
    .a4-invoice {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 10px;
    }
    .a4-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .a4-store-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .a4-facture-title {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      color: #111;
      text-align: ${isArabic ? 'left' : 'right'};
    }
    .a4-meta-box {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 25px;
    }
    .a4-box {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px 15px;
      background: #fafafa;
    }
    .a4-box-title {
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 6px;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }
    .a4-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .a4-table th {
      background: #f1f1f1;
      border: 1px solid #ccc;
      padding: 8px 10px;
      font-weight: bold;
      text-align: ${isArabic ? 'right' : 'left'};
      font-size: 12px;
    }
    .a4-table td {
      border: 1px solid #e0e0e0;
      padding: 8px 10px;
      font-size: 12px;
    }
    .a4-summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .a4-summary-table {
      width: 320px;
      border-collapse: collapse;
    }
    .a4-summary-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #eee;
    }
    .a4-summary-table .total-row td {
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      background: #f9f9f9;
    }
    .a4-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
    }
    .a4-sign-box {
      width: 220px;
      height: 80px;
      border: 1px dashed #aaa;
      border-radius: 6px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 6px;
      font-size: 11px;
      color: #666;
    }
  </style>
</head>
<body>

${
  isA4
    ? `
  <!-- A4 OFFICIAL FACTURE -->
  <div class="a4-invoice">
    <div class="a4-top">
      <div>
        <div class="a4-store-title">${data.storeName}</div>
        <p style="margin-top:4px; color:#444;">${data.storeAddress || (isArabic ? 'الجزائر' : 'Algérie')}</p>
        <p style="color:#444;">${isArabic ? 'الهاتف:' : 'Tél:'} ${data.storePhone || '0550 00 00 00'}</p>
      </div>
      <div>
        <div class="a4-facture-title">${isArabic ? 'فاتورة مبيعات' : 'FACTURE'}</div>
        <p style="font-weight:bold; font-size:14px; margin-top:4px;">N° ${data.saleNumber}</p>
        <p style="font-size:12px; color:#555;">${isArabic ? 'التاريخ:' : 'Date:'} ${data.date}</p>
      </div>
    </div>

    <div class="a4-meta-box">
      <div class="a4-box">
        <div class="a4-box-title">${isArabic ? 'معلومات المتجر والبائع' : 'ÉMETTEUR'}</div>
        <p><strong>${data.storeName}</strong></p>
        <p>${data.storeAddress || ''}</p>
        <p>${data.storePhone ? `${isArabic ? 'الهاتف:' : 'Tél:'} ${data.storePhone}` : ''}</p>
      </div>
      <div class="a4-box">
        <div class="a4-box-title">${isArabic ? 'بيانات العميل (الزبون)' : 'DESTINATAIRE / CLIENT'}</div>
        <p><strong>${data.customerName || (isArabic ? 'عميل كاش عادي' : 'Client Comptoir')}</strong></p>
        ${data.customerPhone ? `<p>${isArabic ? 'الهاتف:' : 'Tél:'} ${data.customerPhone}</p>` : ''}
        ${data.customerAddress ? `<p>${isArabic ? 'العنوان:' : 'Adresse:'} ${data.customerAddress}</p>` : ''}
      </div>
    </div>

    <table class="a4-table">
      <thead>
        <tr>
          <th style="width: 45%;">${isArabic ? 'تعيين السلعة / المنتج' : 'Désignation'}</th>
          <th style="text-align:center; width: 15%;">${isArabic ? 'الكمية' : 'Quantité'}</th>
          <th style="text-align:${isArabic ? 'left' : 'right'}; width: 20%;">${isArabic ? 'سعر الوحدة' : 'Prix Unitaire'}</th>
          <th style="text-align:${isArabic ? 'left' : 'right'}; width: 20%;">${isArabic ? 'المجموع' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (it) => `
          <tr>
            <td><strong>${it.name}</strong></td>
            <td style="text-align:center;">${it.quantity} ${it.unit || ''}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'};">${formatMoney(it.unitPrice)}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'}; font-weight:bold;">${formatMoney(it.totalAmount)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="a4-summary">
      <table class="a4-summary-table">
        <tr>
          <td>${isArabic ? 'المجموع الفرعي:' : 'Sous-total:'}</td>
          <td style="text-align:${isArabic ? 'left' : 'right'}; font-weight:bold;">${formatMoney(data.subtotal)}</td>
        </tr>
        ${
          data.discountAmount && data.discountAmount > 0
            ? `
          <tr>
            <td>${isArabic ? 'التخفيض / الخصم:' : 'Remise:'}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'}; color:#b30000;">-${formatMoney(data.discountAmount)}</td>
          </tr>
        `
            : ''
        }
        ${
          data.taxAmount && data.taxAmount > 0
            ? `
          <tr>
            <td>${isArabic ? `الضريبة (${data.taxRate || 19}%):` : `TVA (${data.taxRate || 19}%):`}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'}; font-weight:bold;">${formatMoney(data.taxAmount)}</td>
          </tr>
        `
            : ''
        }
        <tr class="total-row">
          <td>${isArabic ? 'المبلغ الإجمالي المستحق:' : 'NET À PAYER:'}</td>
          <td style="text-align:${isArabic ? 'left' : 'right'};">${formatMoney(data.totalAmount)}</td>
        </tr>
        <tr>
          <td>${isArabic ? 'المبلغ المدفوع:' : 'Montant Réglé:'}</td>
          <td style="text-align:${isArabic ? 'left' : 'right'}; font-weight:bold;">${formatMoney(data.paidAmount)}</td>
        </tr>
        ${
          data.remainingDebt && data.remainingDebt > 0
            ? `
          <tr style="background:#fff3f3; color:#c00; font-weight:bold;">
            <td>${isArabic ? 'الباقي كدَين مستحق:' : 'Reste en Dette:'}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'}; font-size:14px;">${formatMoney(data.remainingDebt)}</td>
          </tr>
        `
            : ''
        }
        ${
          data.customerTotalDebt && data.customerTotalDebt > 0
            ? `
          <tr style="color:#b30000; font-weight:bold;">
            <td>${isArabic ? 'إجمالي ديون العميل الحالية:' : 'Solde total débiteur:'}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'};">${formatMoney(data.customerTotalDebt)}</td>
          </tr>
        `
            : ''
        }
      </table>
    </div>

    ${data.notes ? `<p style="font-size:11px; color:#666; margin-bottom:15px;"><strong>${isArabic ? 'ملاحظة:' : 'Note:'}</strong> ${data.notes}</p>` : ''}

    <div class="a4-signatures">
      <div class="a4-sign-box">${isArabic ? 'توقيع وختم المتجر' : 'Cachet et Signature'}</div>
      <div class="a4-sign-box">${isArabic ? 'توقيع المستلم' : 'Bon pour Réception'}</div>
    </div>
  </div>
`
    : `
  <!-- THERMAL 80MM RECEIPT -->
  <div class="thermal-receipt">
    <div class="thermal-header">
      <h1>${data.storeName}</h1>
      ${data.storeAddress ? `<p>${data.storeAddress}</p>` : ''}
      ${data.storePhone ? `<p>${isArabic ? 'الهاتف:' : 'Tél:'} ${data.storePhone}</p>` : ''}
      <p style="margin-top:4px; font-weight:bold;">#${data.saleNumber}</p>
      <p>${data.date}</p>
      ${data.customerName ? `<p style="font-weight:bold; margin-top:2px;">${isArabic ? 'العميل:' : 'Client:'} ${data.customerName}</p>` : ''}
    </div>

    <table class="thermal-table">
      <thead>
        <tr>
          <th>${isArabic ? 'السلعة' : 'Article'}</th>
          <th style="text-align:center;">${isArabic ? 'الكمية' : 'Qté'}</th>
          <th style="text-align:${isArabic ? 'left' : 'right'};">${isArabic ? 'الإجمالي' : 'Total'}</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (it) => `
          <tr>
            <td>
              <div style="font-weight:bold;">${it.name}</div>
              <div style="font-size:9px; color:#555;">${formatMoney(it.unitPrice)} / ${it.unit || ''}</div>
            </td>
            <td style="text-align:center;">${it.quantity}</td>
            <td style="text-align:${isArabic ? 'left' : 'right'}; font-weight:bold;">${formatMoney(it.totalAmount)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="thermal-totals">
      <div class="row">
        <span>${isArabic ? 'المجموع الفرعي:' : 'Sous-total:'}</span>
        <span>${formatMoney(data.subtotal)}</span>
      </div>
      ${
        data.discountAmount && data.discountAmount > 0
          ? `
        <div class="row">
          <span>${isArabic ? 'الخصم:' : 'Remise:'}</span>
          <span>-${formatMoney(data.discountAmount)}</span>
        </div>
      `
          : ''
      }
      ${
        data.taxAmount && data.taxAmount > 0
          ? `
        <div class="row">
          <span>${isArabic ? `الضريبة (${data.taxRate || 19}%):` : `TVA (${data.taxRate || 19}%):`}</span>
          <span>${formatMoney(data.taxAmount)}</span>
        </div>
      `
          : ''
      }
      <div class="row bold-row">
        <span>${isArabic ? 'المجموع الإجمالي:' : 'TOTAL:'}</span>
        <span>${formatMoney(data.totalAmount)}</span>
      </div>
      <div class="row" style="margin-top:4px;">
        <span>${isArabic ? 'المبلغ المدفوع:' : 'Payé:'}</span>
        <span style="font-weight:bold;">${formatMoney(data.paidAmount)}</span>
      </div>
      ${
        data.remainingDebt && data.remainingDebt > 0
          ? `
        <div class="debt-badge">
          ${isArabic ? 'المتبقي كدَين:' : 'Reste Dette:'} ${formatMoney(data.remainingDebt)}
        </div>
      `
          : ''
      }
      ${
        data.changeDue && data.changeDue > 0
          ? `
        <div class="row">
          <span>${isArabic ? 'الباقي للزبون:' : 'Rendu:'}</span>
          <span>${formatMoney(data.changeDue)}</span>
        </div>
      `
          : ''
      }
      ${
        data.customerTotalDebt && data.customerTotalDebt > 0
          ? `
        <div class="row" style="font-weight:bold; color:#000; border-top:1px dashed #000; padding-top:3px; margin-top:3px;">
          <span>${isArabic ? 'إجمالي ديون العميل:' : 'Dette Totale Client:'}</span>
          <span>${formatMoney(data.customerTotalDebt)}</span>
        </div>
      `
          : ''
      }
    </div>

    <div class="thermal-footer">
      <p>${isArabic ? 'شكراً لزيارتكم! نتشرف بخدمتكم دائماً' : 'Merci pour votre visite et à bientôt !'}</p>
    </div>
  </div>
`
}

</body>
</html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 250);
}
