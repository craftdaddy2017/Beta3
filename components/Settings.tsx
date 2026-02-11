
import React, { useState, useRef } from 'react';
import { UserBusinessProfile, Address } from '../types';
import { INDIAN_STATES } from '../constants';

interface SettingsProps {
  profile: UserBusinessProfile;
  onSave: (profile: UserBusinessProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<UserBusinessProfile>(profile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    onSave(formData);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Business Settings</h1>
        <p className="text-gray-500 text-sm">Configure your company identity and tax compliance details.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
            Company Branding
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative group">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo Preview" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">No Logo</p>
                </div>
              )}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                className="hidden" 
                accept="image/*" 
              />
              <p className="text-sm font-bold text-gray-700">Company Logo</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">Upload a high-resolution PNG or SVG logo. This will appear on all your invoices and quotations.</p>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition"
              >
                Select Image
              </button>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Legal Business Name</label>
              <input 
                required
                type="text" 
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-bold"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Acme Solutions Pvt Ltd"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Registered Address (Street)</label>
              <input 
                required
                type="text" 
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                value={formData.address.street}
                onChange={e => updateAddress('street', e.target.value)}
                placeholder="123 Business Hub, Lane 4"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">City</label>
              <input 
                required
                type="text" 
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                value={formData.address.city}
                onChange={e => updateAddress('city', e.target.value)}
                placeholder="New Delhi"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">State</label>
              <select 
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100"
                value={formData.address.stateCode}
                onChange={e => {
                  const state = INDIAN_STATES.find(s => s.code === e.target.value);
                  if (state) {
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: state.name, stateCode: state.code }
                    });
                  }
                }}
              >
                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pincode</label>
              <input 
                required
                type="text" 
                maxLength={6}
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono"
                value={formData.address.pincode}
                onChange={e => updateAddress('pincode', e.target.value.replace(/\D/g, ''))}
                placeholder="110001"
              />
            </div>
          </div>
        </div>

        {/* Tax Compliance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
            Tax Compliance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">GSTIN Number</label>
              <input 
                required
                type="text" 
                maxLength={15}
                className="w-full p-3 border rounded-xl bg-gray-50 text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono font-bold uppercase"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="07AAAAA0000A1Z1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">PAN Number</label>
              <input 
                required
                type="text" 
                maxLength={10}
                className="w-full p-3 border rounded-xl bg-gray-50 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition border-gray-100 font-mono font-bold uppercase"
                value={formData.pan}
                onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            type="submit" 
            disabled={saveStatus === 'saving'}
            className={`px-10 py-4 rounded-xl font-bold transition shadow-lg flex items-center gap-2 ${
              saveStatus === 'saved' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {saveStatus === 'saving' ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : saveStatus === 'saved' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : null}
            {saveStatus === 'saving' ? 'Applying...' : saveStatus === 'saved' ? 'Settings Saved' : 'Update Business Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
