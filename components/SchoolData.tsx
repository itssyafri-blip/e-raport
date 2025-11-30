
import React, { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { SchoolData } from '../types';
import { Save, Building2, Upload, Image as ImageIcon, UploadCloud } from 'lucide-react';

interface SchoolDataSettingsProps {
    onUpdate: () => void;
}

export const SchoolDataSettings: React.FC<SchoolDataSettingsProps> = ({ onUpdate }) => {
  const [formData, setFormData] = useState<SchoolData>({
    name: '',
    npsn: '',
    address: '',
    principalName: '',
    principalNip: '',
    website: '',
    email: '',
    logoUrl: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = () => {
        const data = StorageService.getSchoolData();
        setFormData(data);
    };
    loadData();
    // Subscribe to changes from other users
    const unsubscribe = StorageService.subscribe(STORAGE_KEYS.SCHOOL, loadData);
    return unsubscribe;
  }, []);

  const handleSave = () => {
    StorageService.saveSchoolData(formData);
    onUpdate(); // Trigger update in parent layout (Sidebar)
    setMessage('Data Sekolah berhasil disimpan ke Cloud Server & tersinkronisasi.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for localStorage safety
        alert("Ukuran file terlalu besar (Max 500KB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-gray-200">
        <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <Building2 className="w-6 h-6 text-blue-600" />
            Identitas Sekolah
            </h3>
            <p className="text-sm text-gray-500 mt-1">Pengaturan profil sekolah. Data ini akan disinkronkan ke seluruh pengguna via Cloud.</p>
        </div>
        <button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded shadow-sm text-sm font-semibold flex items-center gap-2 transition-colors"
        >
            <UploadCloud className="w-4 h-4" /> Simpan & Sinkron ke Cloud
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded border-l-4 border-emerald-500 text-sm flex items-center gap-3 shadow-sm animate-in fade-in">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: School Details */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
                    Profil Instansi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Nama Sekolah</label>
                        <input 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Contoh: SMA NEGERI 1..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">NPSN</label>
                        <input 
                            value={formData.npsn}
                            onChange={e => setFormData({...formData, npsn: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Nomor Pokok Sekolah Nasional"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Alamat Lengkap</label>
                        <textarea 
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-20 resize-none"
                            placeholder="Jalan, Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Website</label>
                        <input 
                            value={formData.website}
                            onChange={e => setFormData({...formData, website: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="www.sekolah.sch.id"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Email</label>
                        <input 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="info@sekolah.sch.id"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
                    Data Kepala Sekolah
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Nama Kepala Sekolah</label>
                        <input 
                            value={formData.principalName}
                            onChange={e => setFormData({...formData, principalName: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Nama lengkap dengan gelar"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase mb-1">NIP Kepala Sekolah</label>
                        <input 
                            value={formData.principalNip}
                            onChange={e => setFormData({...formData, principalNip: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="NIP 18 digit"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Logo Upload */}
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-gray-100 pb-3 mb-4">
                    Logo Instansi
                </h4>
                
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-40 h-40 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                        {formData.logoUrl ? (
                            <>
                                <img src={formData.logoUrl} alt="School Logo" className="w-full h-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">Ganti Logo</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 p-4">
                                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <span className="text-xs">Belum ada logo</span>
                            </div>
                        )}
                    </div>
                    
                    <label className="cursor-pointer">
                        <span className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm font-medium shadow-sm flex items-center gap-2 transition-colors">
                            <Upload className="w-4 h-4" /> Upload Logo
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <p className="text-[10px] text-gray-400 text-center px-4">
                        Format: PNG/JPG. Maksimal 500KB. Logo ini akan muncul pada Sidebar dan Kop Surat.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
