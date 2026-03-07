import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Sale, SaleItem } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

const formatAmount = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateBillHtml = (
  sale: Sale,
  storeName: string = 'HisaabKitab Store',
  customerName?: string,
): string => {
  const billNumber = sale.id.slice(0, 8).toUpperCase();
  const subtotal = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const itemRows = sale.items
    .map(
      (item, index) => `
    <tr>
      <td style="padding: 8px 4px; border-bottom: 1px solid #E0D5CA;">${index + 1}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #E0D5CA;">${item.productName}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #E0D5CA; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #E0D5CA; text-align: right;">${formatAmount(item.price)}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #E0D5CA; text-align: right;">${formatAmount(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('');

  const paymentLabel =
    sale.paymentType === 'cash' ? 'Cash' : sale.paymentType === 'upi' ? 'UPI' : 'Credit (Udhaar)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #2C1810;
      background: #fff;
      padding: 20px;
    }
    .bill-container {
      max-width: 400px;
      margin: 0 auto;
      border: 2px solid #7B4B2A;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background: #7B4B2A;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 22px;
      margin-bottom: 4px;
      letter-spacing: 1px;
    }
    .header p {
      font-size: 12px;
      opacity: 0.85;
    }
    .bill-info {
      padding: 16px 20px;
      background: #FDF2EA;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #6B5D52;
    }
    .bill-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .bill-info-label {
      font-weight: 600;
      color: #7B4B2A;
    }
    .items-section {
      padding: 0 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      padding: 10px 4px;
      text-align: left;
      font-weight: 700;
      color: #7B4B2A;
      border-bottom: 2px solid #7B4B2A;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th:nth-child(3) { text-align: center; }
    th:nth-child(4), th:nth-child(5) { text-align: right; }
    .totals {
      padding: 16px 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 13px;
    }
    .total-row.grand {
      border-top: 2px solid #7B4B2A;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #7B4B2A;
    }
    .payment-badge {
      display: inline-block;
      background: #FDF2EA;
      color: #7B4B2A;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #E0D5CA;
    }
    .footer {
      text-align: center;
      padding: 16px 20px;
      background: #FAF6F0;
      border-top: 1px dashed #D9CFC4;
      font-size: 12px;
      color: #6B5D52;
    }
    .footer p:first-child {
      font-weight: 600;
      color: #7B4B2A;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="bill-container">
    <div class="header">
      <h1>${storeName}</h1>
      <p>Tax Invoice / Bill of Supply</p>
    </div>

    <div class="bill-info">
      <div style="flex: 1;">
        <div class="bill-info-row">
          <span class="bill-info-label">Bill No:</span>
          <span>#${billNumber}</span>
        </div>
        <div class="bill-info-row">
          <span class="bill-info-label">Date:</span>
          <span>${formatDate(sale.createdAt)}</span>
        </div>
        ${customerName ? `
        <div class="bill-info-row">
          <span class="bill-info-label">Customer:</span>
          <span>${customerName}</span>
        </div>` : ''}
        <div class="bill-info-row">
          <span class="bill-info-label">Payment:</span>
          <span class="payment-badge">${paymentLabel}</span>
        </div>
      </div>
    </div>

    <div class="items-section">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatAmount(subtotal)}</span>
      </div>
      ${sale.discount > 0 ? `
      <div class="total-row" style="color: #27AE60;">
        <span>Discount</span>
        <span>- ${formatAmount(sale.discount)}</span>
      </div>` : ''}
      <div class="total-row grand">
        <span>Grand Total</span>
        <span>${formatAmount(sale.totalAmount)}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for shopping with us!</p>
      <p>Powered by HisaabKitab</p>
    </div>
  </div>
</body>
</html>`;
};

export const generateAndShareBill = async (
  sale: Sale,
  storeName?: string,
  customerName?: string,
): Promise<void> => {
  const html = generateBillHtml(sale, storeName, customerName);
  const { uri } = await Print.printToFileAsync({ html, width: 420, height: 595 });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Bill #${sale.id.slice(0, 8).toUpperCase()}`,
      UTI: 'com.adobe.pdf',
    });
  }
};

export const printBill = async (
  sale: Sale,
  storeName?: string,
  customerName?: string,
): Promise<void> => {
  const html = generateBillHtml(sale, storeName, customerName);
  await Print.printAsync({ html });
};
