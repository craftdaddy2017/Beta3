
import React from 'react';
import { Quotation, Client, QuotationStatus } from '../types';
import { formatCurrency, calculateDocumentTotal } from '../services/Calculations';

interface QuotationListProps {
  quotations: Quotation[];
  clients: Client[];
  onEdit: (quotation: Quotation) => void;
  onDuplicate: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  onUpdateStatus: (id: string, status: QuotationStatus) => void;
  onDelete: (id: string) => void;
}

const QuotationList: React.FC<QuotationListProps> = ({ 
  quotations, 
  clients, 
  onEdit, 
  onDuplicate, 
  onUpdateStatus,
  onDelete 
}) => {
  const getClient = (id: string) => clients.find(c => c.id === id);

  const getStatusStyle = (status: QuotationStatus) => {
    switch (status) {
      case QuotationStatus.ACCEPTED: return 'bg-emerald-100 text-emerald-700';
      case QuotationStatus.SENT: return 'bg-blue-100 text-blue-700';
      case QuotationStatus.REJECTED: return 'bg-red-100 text-red-700';
      case QuotationStatus.DRAFT: return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quotations.map((qt) => {
              const total = calculateDocumentTotal(qt);
              return (
                <tr key={qt.id} className="hover:bg-gray-50 transition relative">
                  <td className="px-6 py-4 font-bold text-gray-900">{qt.number}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-[150px] font-medium">{getClient(qt.clientId)?.name || 'Unknown Client'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-bold uppercase">{new Date(qt.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</td>
                  <td className="px-6 py-4 font-black text-indigo-700">{formatCurrency(total)}</td>
                  <td className="px-6 py-4">
                    <div className="relative group/status">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(qt.status)} cursor-pointer whitespace-nowrap`}>
                        {qt.status}
                      </span>
                      <div className="hidden group-hover/status:flex absolute left-0 top-full mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl z-50 py-1 min-w-[120px] flex-col overflow-hidden">
                          <button onClick={() => onUpdateStatus(qt.id, QuotationStatus.ACCEPTED)} className="text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 font-bold">Mark Accepted</button>
                          <button onClick={() => onUpdateStatus(qt.id, QuotationStatus.SENT)} className="text-left px-4 py-2 text-xs hover:bg-blue-50 text-blue-600 font-bold">Mark Sent</button>
                          <button onClick={() => onUpdateStatus(qt.id, QuotationStatus.DRAFT)} className="text-left px-4 py-2 text-xs hover:bg-gray-50 text-gray-600 font-bold">Mark Draft</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onEdit(qt)} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => onDelete(qt.id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No quotations in directory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationList;
