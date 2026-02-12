
import { LineItem, Invoice, Quotation } from '../types';

export const calculateLineItem = (item: LineItem, isInterState: boolean) => {
  const taxableValue = item.qty * item.rate;
  const totalTaxAmount = (taxableValue * item.taxRate) / 100;
  
  let cgst = 0, sgst = 0, igst = 0;
  
  if (isInterState) {
    igst = totalTaxAmount;
  } else {
    cgst = totalTaxAmount / 2;
    sgst = totalTaxAmount / 2;
  }
  
  return {
    taxableValue,
    cgst,
    sgst,
    igst,
    total: taxableValue + totalTaxAmount
  };
};

/**
 * Calculates the final payable amount for a document including taxes, discounts, and charges
 */
export const calculateDocumentTotal = (doc: Invoice | Quotation) => {
  if (!doc.items || doc.items.length === 0) return 0;

  // 1. Calculate sum of line items
  const itemTotals = doc.items.reduce((acc, item) => {
    const taxable = item.qty * item.rate;
    const tax = (taxable * item.taxRate) / 100;
    return {
      taxable: acc.taxable + taxable,
      total: acc.total + taxable + tax
    };
  }, { taxable: 0, total: 0 });

  // 2. Calculate Discount
  let discountAmount = 0;
  if (doc.discountValue) {
    if (doc.discountType === 'percentage') {
      discountAmount = (itemTotals.taxable * doc.discountValue) / 100;
    } else {
      discountAmount = doc.discountValue;
    }
  }

  // 3. Calculate Additional Charges
  const chargesTotal = (doc.additionalCharges || []).reduce(
    (sum, charge) => sum + (Number(charge.amount) || 0), 
    0
  );

  // 4. Final Sum with Round Off
  const final = itemTotals.total - discountAmount + chargesTotal + (doc.roundOff || 0);
  return Math.max(0, final);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const numberToWords = (num: number): string => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const numStr = Math.round(num).toString();
  if (numStr.length > 9) return 'overflow';
  
  const n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  
  return (str.trim() || 'zero') + ' rupees only';
};
