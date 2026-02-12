
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Invoice, 
  Quotation,
  Client, 
  UserBusinessProfile, 
  LineItem, 
  InvoiceStatus,
  QuotationStatus,
  CustomField,
  AdditionalCharge
} from '../types';
import { CRAFT_DADDY_LOGO_SVG } from '../constants';
import { calculateLineItem, numberToWords, formatCurrency } from '../services/Calculations';

interface DocumentFormProps {
  userProfile: UserBusinessProfile;
  clients: Client[];
  onSave: (document: any) => void;
  onCancel: () => void;
  initialData?: Invoice | Quotation;
  mode?: 'invoice' | 'quotation';
  onConvertToInvoice?: (quotation: Quotation) => void;
}

const InvoiceForm: React.FC<DocumentFormProps> = ({ 
  userProfile, 
  clients, 
  onSave, 
  onCancel, 
  initialData, 
  mode = 'invoice',
  onConvertToInvoice
}) => {
  const [document, setDocument] = useState<any>(() => {
    const baseDoc = initialData ? { ...initialData } : {
      id: `${mode === 'invoice' ? 'inv' : 'qt'}-${Date.now()}`,
      number: mode === 'invoice' 
        ? `CD${new Date().getFullYear().toString().slice(-2)}${Math.floor(10000 + Math.random() * 89999)}`
        : `QT${new Date().getFullYear().toString().slice(-2)}${Math.floor(10000 + Math.random() * 89999)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      poNumber: '',
      status: mode === 'invoice' ? InvoiceStatus.DRAFT : QuotationStatus.DRAFT,
      clientId: clients[0]?.id || '',
      items: [
        { id: '1', description: 'PROFESSIONAL SERVICES', hsn: '9983', qty: 1, rate: 0, taxRate: 18 },
      ],
      placeOfSupply: `${userProfile.address.state} (${userProfile.address.stateCode})`,
      bankDetails: userProfile.bankAccounts[0],
      notes: '',
      terms: '1. Subject to local jurisdiction.\n2. Payment within due date.',
      customFields: [],
      discountType: 'fixed',
      discountValue: 0,
      additionalCharges: [],
      roundOff: 0,
      showBankDetails: true
    };

    if (mode === 'quotation' && (initialData as Quotation)?.validUntil) {
       baseDoc.dueDate = (initialData as Quotation).validUntil;
    }

    if (!baseDoc.bankDetails && userProfile.bankAccounts.length > 0) {
      baseDoc.bankDetails = userProfile.bankAccounts[0];
    }

    if (baseDoc.showBankDetails === undefined) baseDoc.showBankDetails = true;

    if (!baseDoc.customFields || baseDoc.customFields.length === 0) {
      baseDoc.customFields = [{ label: 'P.O. Number', value: '' }];
    }

    return baseDoc;
  });

  const [showDiscount, setShowDiscount] = useState(document.discountValue > 0);
  
  const isQuotation = mode === 'quotation';

  const selectedClient = useMemo(() => clients.find(c => c.id === document.clientId), [clients, document.clientId]);
  
  const isInterState = useMemo(() => {
    const supplyStateCode = document.placeOfSupply.match(/\((\d+)\)/)?.[1];
    return supplyStateCode && supplyStateCode !== userProfile.address.stateCode;
  }, [document.placeOfSupply, userProfile.address.stateCode]);

  const totals = useMemo(() => {
    const itemTotals = (document.items || []).reduce((acc: any, item: LineItem) => {
      const calc = calculateLineItem(item, !!isInterState);
      return {
        taxable: acc.taxable + calc.taxableValue,
        cgst: acc.cgst + calc.cgst,
        sgst: acc.sgst + calc.sgst,
        igst: acc.igst + calc.igst,
        total: acc.total + calc.total
      };
    }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

    let discountAmount = 0;
    if (document.discountValue) {
      if (document.discountType === 'percentage') {
        discountAmount = (itemTotals.taxable * document.discountValue) / 100;
      } else {
        discountAmount = document.discountValue;
      }
    }

    const additionalChargesTotal = (document.additionalCharges || []).reduce((sum: number, charge: AdditionalCharge) => sum + (Number(charge.amount) || 0), 0);
    const preRoundTotal = itemTotals.total - discountAmount + additionalChargesTotal;
    const finalTotal = preRoundTotal + (document.roundOff || 0);

    return {
      ...itemTotals,
      discountAmount,
      additionalChargesTotal,
      preRoundTotal,
      finalTotal
    };
  }, [document.items, isInterState, document.discountType, document.discountValue, document.additionalCharges, document.roundOff]);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setDocument((prev: any) => ({
      ...prev,
      items: prev.items.map((item: LineItem) => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setDocument((prev: any) => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', hsn: '', qty: 1, rate: 0, taxRate: 18 }]
    }));
  };

  const removeItem = (id: string) => {
    if (document.items.length <= 1) return;
    setDocument((prev: any) => ({ ...prev, items: prev.items.filter((i: LineItem) => i.id !== id) }));
  };

  const addCustomField = () => {
    setDocument((prev: any) => ({
      ...prev,
      customFields: [...(prev.customFields || []), { label: '', value: '' }]
    }));
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: string) => {
    const newFields = [...(document.customFields || [])];
    newFields[index] = { ...newFields[index], [field]: value };
    setDocument({ ...document, customFields: newFields });
  };

  const removeCustomField = (index: number) => {
    const newFields = [...(document.customFields || [])];
    newFields.splice(index, 1);
    setDocument({ ...document, customFields: newFields });
  };

  const addAdditionalCharge = () => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: [...(prev.additionalCharges || []), { id: Date.now().toString(), label: '', amount: 0 }]
    }));
  };

  const updateAdditionalCharge = (id: string, field: keyof AdditionalCharge, value: any) => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).map((c: AdditionalCharge) => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeAdditionalCharge = (id: string) => {
    setDocument((prev: any) => ({
      ...prev,
      additionalCharges: (prev.additionalCharges || []).filter((c: AdditionalCharge) => c.id !== id)
    }));
  };

  const handleSave = () => {
     const finalData = { ...document };
     if (isQuotation) {
        finalData.validUntil = finalData.dueDate;
        delete finalData.dueDate;
     }
     onSave(finalData);
  };

  const handlePrint = () => {
    window.focus();
    setTimeout(() => window.print(), 100);
  };

  const GRID_COLS = "grid-cols-[20px_minmax(0,2fr)_minmax(60px,0.5fr)_minmax(55px,0.4fr)_minmax(55px,0.4fr)_minmax(80px,0.5fr)_minmax(90px,0.6fr)_minmax(70px,0.5fr)_minmax(70px,0.5fr)_minmax(90px,0.6fr)_30px]";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 relative font-sans text-sm text-gray-700">
      
      <div className="print:hidden">
        <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm transition-all">
            <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition group">
                  <div className="bg-white p-1.5 rounded-full border border-gray-200 group-hover:border-gray-400 transition shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  </div>
                  <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="flex gap-3">
                  {isQuotation && onConvertToInvoice && (
                    <button onClick={() => onConvertToInvoice(document)} className="bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-50 active:scale-95 flex items-center gap-2 transition">
                        Convert to Invoice
                    </button>
                  )}
                  <button onClick={handlePrint} className="bg-indigo-600 text-white border border-transparent px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 flex items-center gap-2 transition transform">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Print / Save PDF
                  </button>
              </div>
            </div>
        </div>

        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-8 md:p-12 mb-8 mt-6 relative">
          <div className="flex flex-col items-center mb-10 group relative">
              <div className="flex items-center gap-2 border-b-2 border-dashed border-gray-300 pb-1 mb-1 hover:border-gray-400 transition">
                <h1 className="text-3xl font-extrabold text-gray-900">{isQuotation ? 'Quotation' : 'Tax Invoice'}</h1>
              </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
              <div className="flex-1 space-y-5 max-w-sm">
                <div className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                    <label className="text-gray-500 font-semibold">{isQuotation ? 'Quotation No' : 'Invoice No'}</label>
                    <input type="text" value={document.number} onChange={(e) => setDocument({...document, number: e.target.value})} className="w-full font-bold text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent" />
                </div>
                <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-gray-500 font-semibold">Date</label>
                    <input type="date" value={document.date} onChange={(e) => setDocument({...document, date: e.target.value})} className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent" />
                </div>
                
                {document.customFields?.map((field: CustomField, index: number) => (
                    <div key={index} className="grid grid-cols-[110px_1fr] items-center gap-2 group">
                      <input type="text" value={field.label} onChange={(e) => updateCustomField(index, 'label', e.target.value)} className="text-gray-500 font-semibold bg-transparent outline-none border-b border-transparent focus:border-indigo-600 placeholder-gray-400 text-right pr-2" placeholder="Label" />
                      <div className="flex items-center gap-2">
                          <input type="text" value={field.value} onChange={(e) => updateCustomField(index, 'value', e.target.value)} className="w-full font-medium text-gray-900 border-b border-gray-200 focus:border-indigo-600 outline-none py-1 bg-transparent" placeholder="Value" />
                          <button onClick={() => removeCustomField(index)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-1">×</button>
                      </div>
                    </div>
                ))}
                
                <button onClick={addCustomField} className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1 mt-2">
                    <span className="text-lg leading-none">+</span> Add Custom Fields
                </button>
              </div>

              <div className="w-full md:w-72 flex flex-col items-center">
                <div className="w-full h-32 border border-gray-100 rounded-lg flex items-center justify-center p-4 bg-white shadow-sm">
                    <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-h-full max-w-full object-contain" alt="Logo" />
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
                    <h3 className="text-gray-800 font-bold text-base border-b-2 border-gray-800 pb-0.5 inline-block">{isQuotation ? 'Quotation From' : 'Billed By'}</h3>
                </div>
                <div className="p-5 flex-1 bg-white text-xs text-gray-600 space-y-2">
                    <p className="font-bold text-indigo-700 text-sm">{userProfile.companyName}</p>
                    <p>{userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state} - {userProfile.address.pincode}</p>
                    <p><span className="font-bold">GSTIN:</span> {userProfile.gstin}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full bg-white shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 bg-white flex justify-between items-center">
                     <h3 className="text-gray-800 font-bold text-base border-b-2 border-gray-800 pb-0.5 inline-block">{isQuotation ? 'Quotation For' : 'Billed To'}</h3>
                </div>
                <div className="p-5 flex-1 bg-white">
                    <select className="border border-gray-200 rounded-md w-full p-2 bg-white text-sm focus:border-indigo-500 outline-none mb-4" value={document.clientId} onChange={(e) => setDocument({...document, clientId: e.target.value})}>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {selectedClient && (
                      <div className="text-xs text-gray-600 space-y-2">
                        <p className="font-bold text-indigo-700 text-sm">{selectedClient.name}</p>
                        <p>{selectedClient.address.street}, {selectedClient.address.city}, {selectedClient.address.state} - {selectedClient.address.pincode}</p>
                        <p><span className="font-bold">GSTIN:</span> {selectedClient.gstin || 'N/A'}</p>
                      </div>
                    )}
                </div>
              </div>
          </div>

          <div className="mb-4 rounded-t-lg border border-gray-200 overflow-hidden">
              <div className="min-w-full">
                  <div className={`bg-[#5c2c90] text-white text-xs font-bold py-3 px-3 grid ${GRID_COLS} gap-2 items-center rounded-t-lg`}>
                    <div>#</div>
                    <div>Item</div>
                    <div className="text-center">HSN</div>
                    <div className="text-left pl-1">GST%</div>
                    <div className="text-left">Qty</div>
                    <div className="text-left">Rate</div>
                    <div className="text-left">Amount</div>
                    <div className="text-left">CGST</div>
                    <div className="text-left">SGST</div>
                    <div className="text-left">Total</div>
                    <div></div>
                  </div>

                  {document.items.map((item: LineItem, idx: number) => {
                    const calc = calculateLineItem(item, !!isInterState);
                    return (
                        <div key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition group">
                          <div className={`py-4 px-3 grid ${GRID_COLS} gap-2 items-start text-xs text-gray-800`}>
                              <div className="font-bold pt-2">{idx + 1}.</div>
                              <input type="text" className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none pb-1 font-medium text-sm" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                              <input type="text" className="w-full bg-transparent text-center border-b border-transparent hover:border-gray-200 focus:border-indigo-500 outline-none" value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} />
                              <input type="number" className="w-full bg-transparent border-none outline-none text-left" value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value))} />
                              <input type="number" className="w-full text-left bg-transparent border-none outline-none" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} />
                              <input type="number" className="w-full bg-transparent border-none outline-none text-left font-bold" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value))} />
                              <div className="pt-1">₹{calc.taxableValue.toLocaleString('en-IN')}</div>
                              <div className="pt-1 text-gray-500">₹{calc.cgst.toLocaleString('en-IN')}</div>
                              <div className="pt-1 text-gray-500">₹{calc.sgst.toLocaleString('en-IN')}</div>
                              <div className="pt-1 font-bold">₹{calc.total.toLocaleString('en-IN')}</div>
                              <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">×</button>
                          </div>
                        </div>
                    );
                  })}
              </div>
          </div>

          <button onClick={addItem} className="border border-dashed border-indigo-400 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition mb-12">
              <span className="text-lg leading-none">+</span> Add New Line
          </button>
          
          <div className="flex justify-end mb-12">
               <div className="w-96 space-y-4">
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-bold text-gray-700">
                          <span>Sub Total</span>
                          <span>₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                          <span>Total Tax (GST)</span>
                          <span>₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>

                      {/* Functional Discount Section */}
                      <div className="pt-2 border-t border-gray-100">
                         {!showDiscount ? (
                            <button onClick={() => setShowDiscount(true)} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                <span className="text-lg leading-none">+</span> Add Discounts
                            </button>
                         ) : (
                            <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                               <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-600 uppercase">Discount</span>
                                  <button onClick={() => { setShowDiscount(false); setDocument({...document, discountValue: 0}); }} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                               </div>
                               <div className="flex gap-2">
                                  <select value={document.discountType} onChange={(e) => setDocument({...document, discountType: e.target.value})} className="bg-white border border-gray-200 rounded p-1 text-xs outline-none">
                                     <option value="fixed">Fixed (₹)</option>
                                     <option value="percentage">Percent (%)</option>
                                  </select>
                                  <input type="number" value={document.discountValue} onChange={(e) => setDocument({...document, discountValue: parseFloat(e.target.value) || 0})} className="flex-1 bg-white border border-gray-200 rounded p-1 text-xs outline-none text-right font-bold" />
                               </div>
                               <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-1">
                                  <span>Applied Discount:</span>
                                  <span className="text-green-600">- ₹{totals.discountAmount.toLocaleString('en-IN')}</span>
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Functional Additional Charges Section */}
                      <div className="pt-2">
                         {document.additionalCharges?.map((charge: AdditionalCharge) => (
                            <div key={charge.id} className="flex gap-2 items-center mb-2 bg-gray-50 p-2 rounded-lg">
                               <input type="text" placeholder="e.g. Shipping" value={charge.label} onChange={(e) => updateAdditionalCharge(charge.id, 'label', e.target.value)} className="flex-1 bg-white border border-gray-200 rounded p-1 text-xs outline-none" />
                               <input type="number" value={charge.amount} onChange={(e) => updateAdditionalCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)} className="w-24 bg-white border border-gray-200 rounded p-1 text-xs outline-none text-right font-bold" />
                               <button onClick={() => removeAdditionalCharge(charge.id)} className="text-red-400 hover:text-red-600 px-1 font-bold">×</button>
                            </div>
                         ))}
                         <button onClick={addAdditionalCharge} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                            <span className="text-lg leading-none">+</span> Add Additional Charges
                         </button>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t-2 border-gray-800 mt-4">
                          <span className="font-bold text-lg text-gray-800">Total (INR)</span>
                          <span className="font-bold text-lg text-gray-900">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                   </div>
               </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Total in Words</p>
              <p className="text-sm font-medium text-gray-700 uppercase">{numberToWords(Math.round(totals.finalTotal))}</p>
          </div>
          
          <div className="flex items-center gap-3 mb-8 bg-gray-50 p-4 rounded-lg">
             <input type="checkbox" id="showBankDetails" checked={document.showBankDetails} onChange={(e) => setDocument({...document, showBankDetails: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
             <label htmlFor="showBankDetails" className="text-sm font-medium text-gray-700">Include Bank Details in Print/PDF</label>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center z-50 shadow-lg">
            <button onClick={handleSave} className="bg-[#5c2c90] text-white px-12 py-3 rounded-md font-bold text-sm shadow-lg hover:opacity-90 transition">
                Save {isQuotation ? 'Quotation' : 'Invoice'}
            </button>
          </div>
        </div>
      </div>

      <div id="print-view" className="hidden print:block bg-white text-black p-0 m-0">
          <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-black text-[#5c2c90] mb-6">{isQuotation ? 'Quotation' : 'Tax Invoice'}</h1>
                  <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">{isQuotation ? 'Quotation #' : 'Invoice #'}</span>
                      <span className="font-black text-gray-900">{document.number}</span>
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Date</span>
                      <span className="font-black text-gray-900">{new Date(document.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                      {document.customFields?.map((field: CustomField, i: number) => (
                          field.label && field.value && (
                            <React.Fragment key={i}>
                                <span className="text-gray-500 font-bold uppercase tracking-wider">{field.label}</span>
                                <span className="font-black text-gray-900">{field.value}</span>
                            </React.Fragment>
                          )
                      ))}
                  </div>
              </div>
              <div className="w-64">
                  <img src={userProfile.logoUrl || CRAFT_DADDY_LOGO_SVG} className="max-w-full object-contain" alt="Logo" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#f8f5ff] p-5 rounded-xl border border-[#e9e2f5]">
                  <h3 className="text-[#5c2c90] font-black text-xs uppercase tracking-widest mb-3">{isQuotation ? 'Quotation From' : 'Billed By'}</h3>
                  <div className="text-xs space-y-1.5 text-gray-800">
                      <p className="font-black text-lg text-[#5c2c90]">{userProfile.companyName}</p>
                      <p className="font-medium">{userProfile.address.street}, {userProfile.address.city}, {userProfile.address.state}, {userProfile.address.country} - {userProfile.address.pincode}</p>
                      <div className="mt-3 pt-3 border-t border-[#e9e2f5] space-y-1">
                          <p><span className="font-bold text-gray-500 uppercase text-[10px]">GSTIN</span> <span className="font-black text-[#5c2c90] ml-2">{userProfile.gstin}</span></p>
                          <p><span className="font-bold text-gray-500 uppercase text-[10px]">PAN</span> <span className="font-bold ml-4">{userProfile.pan}</span></p>
                      </div>
                  </div>
              </div>
              <div className="bg-[#f8f5ff] p-5 rounded-xl border border-[#e9e2f5]">
                  <h3 className="text-[#5c2c90] font-black text-xs uppercase tracking-widest mb-3">{isQuotation ? 'Quotation For' : 'Billed To'}</h3>
                  <div className="text-xs space-y-1.5 text-gray-800">
                      <p className="font-black text-lg text-[#5c2c90] uppercase">{selectedClient?.name}</p>
                      <p className="font-medium uppercase">{selectedClient?.address.street}, {selectedClient?.address.city}, {selectedClient?.address.state}, {selectedClient?.address.country} - {selectedClient?.address.pincode}</p>
                      <div className="mt-3 pt-3 border-t border-[#e9e2f5] space-y-1">
                          <p><span className="font-bold text-gray-500 uppercase text-[10px]">GSTIN</span> <span className="font-black text-[#5c2c90] ml-2">{selectedClient?.gstin || 'N/A'}</span></p>
                      </div>
                  </div>
              </div>
          </div>

          <table className="w-full mb-10 border-collapse">
              <thead className="bg-[#5c2c90] text-white">
                  <tr>
                      <th className="py-3 px-3 text-left text-[10px] font-black uppercase">Description</th>
                      <th className="py-3 px-3 text-center text-[10px] font-black uppercase">HSN</th>
                      <th className="py-3 px-3 text-center text-[10px] font-black uppercase">GST</th>
                      <th className="py-3 px-3 text-center text-[10px] font-black uppercase">Qty</th>
                      <th className="py-3 px-3 text-right text-[10px] font-black uppercase">Rate</th>
                      <th className="py-3 px-3 text-right text-[10px] font-black uppercase">Total</th>
                  </tr>
              </thead>
              <tbody className="text-xs">
                  {document.items.map((item: LineItem, idx: number) => {
                      const calc = calculateLineItem(item, !!isInterState);
                      return (
                          <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-4 px-3 font-bold uppercase">{item.description}</td>
                              <td className="py-4 px-3 text-center text-gray-500 font-medium">{item.hsn}</td>
                              <td className="py-4 px-3 text-center">{item.taxRate}%</td>
                              <td className="py-4 px-3 text-center">{item.qty}</td>
                              <td className="py-4 px-3 text-right">₹{item.rate.toLocaleString('en-IN')}</td>
                              <td className="py-4 px-3 text-right font-black">₹{calc.total.toLocaleString('en-IN')}</td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>

          <div className="grid grid-cols-[1.5fr_1fr] gap-12 mb-10">
              <div>
                  <div className="mb-8 p-4 bg-[#f8f5ff] rounded-xl border border-[#e9e2f5]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount (in words)</p>
                      <p className="text-xs font-black text-[#5c2c90] uppercase">{numberToWords(Math.round(totals.finalTotal))}</p>
                  </div>
                  {document.showBankDetails && (
                    <div className="bg-[#f8f5ff] p-5 rounded-xl border border-[#e9e2f5]">
                        <h3 className="text-[#5c2c90] font-black text-xs uppercase tracking-widest mb-4">Payment Details</h3>
                        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-[11px]">
                            <span className="text-gray-500 font-bold uppercase">Account Name</span>
                            <span className="font-black text-gray-800 uppercase">{document.bankDetails?.accountName}</span>
                            <span className="text-gray-500 font-bold uppercase">Account No</span>
                            <span className="font-black text-gray-800">{document.bankDetails?.accountNumber}</span>
                            <span className="text-gray-500 font-bold uppercase">IFSC Code</span>
                            <span className="font-black text-[#5c2c90]">{document.bankDetails?.ifscCode}</span>
                            <span className="text-gray-500 font-bold uppercase">Bank</span>
                            <span className="font-black text-gray-800 uppercase">{document.bankDetails?.bankName}</span>
                        </div>
                    </div>
                  )}
              </div>

              <div className="space-y-3.5">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span className="uppercase">Taxable Value</span>
                      <span>₹{totals.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span className="uppercase">Integrated Tax</span>
                      <span>₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  {document.additionalCharges?.map((charge: AdditionalCharge) => (
                      <div key={charge.id} className="flex justify-between text-xs font-bold text-gray-500">
                          <span className="uppercase">{charge.label || 'Additional Charge'}</span>
                          <span>₹{Number(charge.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                  ))}
                  
                  {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-xs font-black text-emerald-600">
                          <span className="uppercase">Discount</span>
                          <span>- ₹{totals.discountAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                  )}

                  <div className="flex justify-between items-center border-t-2 border-black pt-4 mt-6">
                      <span className="font-black text-xl text-gray-900 uppercase tracking-tighter">Total Amount</span>
                      <span className="font-black text-2xl text-[#5c2c90]">₹{totals.finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
              </div>
          </div>

          <div className="mt-auto pt-10 border-t border-gray-100 flex justify-between items-end text-[9px] text-gray-400 font-bold uppercase tracking-widest">
             <p>Electronically generated document. No signature required.</p>
             <p className="text-[#5c2c90]">Powered by Craft Daddy OS</p>
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            @page { margin: 15mm; size: A4; }
            html, body { background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print, nav, aside, header, .sticky, button { display: none !important; }
            #print-view { visibility: visible !important; display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
            #print-view * { visibility: visible !important; }
        }
      `}} />
    </div>
  );
};

export default InvoiceForm;
