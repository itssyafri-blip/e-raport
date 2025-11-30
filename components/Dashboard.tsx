
import React, { useMemo, useState, useEffect } from 'react';
import { User, UserRole, SUBJECTS } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, UploadCloud, Loader2, Server, CheckCircle2, AlertTriangle, Wifi, RefreshCw, Clock } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [students, setStudents] = useState(StorageService.getStudents());
  const [users, setUsers] = useState(StorageService.getUsers());
  const [allGrades, setAllGrades] = useState(StorageService.getAllReportGrades());
  
  // Status Sync: 'idle', 'uploading', 'success', 'error'
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  // Realtime subscription
  useEffect(() => {
    const handleUpdate = () => {
        setStudents(StorageService.getStudents());
        setUsers(StorageService.getUsers());
        setAllGrades(StorageService.getAllReportGrades());
    };

    const unsubStudents = StorageService.subscribe(STORAGE_KEYS.STUDENTS, handleUpdate);
    const unsubUsers = StorageService.subscribe(STORAGE_KEYS.USERS, handleUpdate);
    const unsubGrades = StorageService.subscribe(STORAGE_KEYS.REPORT_GRADES, handleUpdate);
    
    return () => {
      unsubStudents();
      unsubUsers();
      unsubGrades();
    };
  }, []);
  
  const handleForceSync = async () => {
    if (syncStatus === 'uploading') return;
    
    const isOnline = StorageService.isOnline();
    if (!isOnline) {
        alert("Gagal: Komputer Offline. Pastikan API Key Firebase sudah dipasang di Vercel Environment Variables.");
        return;
    }

    if (!window.confirm("Kirim data terbaru (Data Sekolah, Nilai, Siswa, TP) ke Server Cloud? Ini akan menyinkronkan data untuk semua pengguna.")) {
        return;
    }

    setSyncStatus('uploading');
    
    try {
        await StorageService.forcePushToCloud();
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(timeString);

        // Tampilkan status SUKSES selama 5 detik
        setSyncStatus('success');
        setTimeout(() => {
            setSyncStatus('idle');
        }, 5000);

    } catch (e) {
        console.error(e);
        setSyncStatus('error');
        alert("Gagal mengirim data. Cek koneksi internet Anda.");
        setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const stats = useMemo(() => {
    return [
      { label: 'Total Siswa', value: students.length, color: 'bg-blue-500' },
      { label: 'Total Guru', value: users.filter(u => u.role === UserRole.GURU).length, color: 'bg-green-500' },
      { label: 'Total Nilai Masuk', value: allGrades.length, color: 'bg-orange-500', icon: Activity },
    ];
  }, [students, users, allGrades]);

  const chartData = [
    { name: 'X-A', students: students.filter(s => s.class === 'X-A').length },
    { name: 'X-B', students: students.filter(s => s.class === 'X-B').length },
    { name: 'XI-IPA', students: students.filter(s => s.class.includes('XI')).length },
    { name: 'XII-IPA', students: students.filter(s => s.class.includes('XII')).length },
  ];

  return (
    <div className="space-y-6">
      {/* PANEL SINKRONISASI - SATU DATA */}
      <div className={`rounded-xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-500 border-2 ${
          syncStatus === 'success' 
            ? 'bg-gradient-to-r from-emerald-600 to-green-500 border-emerald-400' 
            : 'bg-gradient-to-r from-indigo-700 to-blue-600 border-blue-500'
      }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Server className="w-48 h-48 -mr-10 -mt-10" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg backdrop-blur-sm shadow-md ${syncStatus === 'success' ? 'bg-white/30' : 'bg-white/20'}`}>
                          {syncStatus === 'success' ? (
                              <CheckCircle2 className="w-10 h-10 text-white animate-bounce" />
                          ) : (
                              <UploadCloud className="w-10 h-10 text-white" />
                          )}
                      </div>
                      <div>
                          <h2 className="text-2xl font-black tracking-tight uppercase">
                              {syncStatus === 'success' ? 'DATA BERHASIL TERKIRIM' : 'Pusat Sinkronisasi Satu Data'}
                          </h2>
                          <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-center gap-2 text-xs font-mono opacity-90 bg-black/20 px-2 py-1 rounded w-fit">
                                  <Wifi className="w-3 h-3" />
                                  {StorageService.isOnline() ? 'Server Terhubung (Online)' : 'Server Terputus (Offline)'}
                              </div>
                              {lastSyncTime && (
                                  <div className="flex items-center gap-2 text-xs font-mono opacity-90 bg-black/20 px-2 py-1 rounded w-fit animate-in fade-in">
                                      <Clock className="w-3 h-3" />
                                      Terakhir: {lastSyncTime}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  
                  {syncStatus === 'success' ? (
                      <div className="bg-white/20 p-3 rounded-lg border border-white/30 animate-in fade-in slide-in-from-bottom-2 mt-2">
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Sinkronisasi Selesai pada {lastSyncTime}
                          </p>
                          <p className="text-xs text-white/90 mt-1">
                              Data Sekolah, Nilai, Siswa, dan <b>Tujuan Pembelajaran (TP)</b> telah tersimpan di Cloud. 
                              Pengguna di komputer lain sekarang dapat melihat perubahan ini.
                          </p>
                      </div>
                  ) : (
                      <p className="text-blue-100 text-sm leading-relaxed max-w-3xl mt-2 font-medium">
                          Tekan tombol ini setelah input data (termasuk TP). Server akan menghubungkan data Anda ke seluruh pengguna (Satu Data) secara otomatis saat tombol ditekan.
                      </p>
                  )}
              </div>
              
              <button 
                  onClick={handleForceSync}
                  disabled={syncStatus !== 'idle'}
                  className={`px-8 py-5 rounded-xl font-bold shadow-xl flex items-center gap-3 transition-all min-w-[260px] justify-center group ring-4 ring-white/20 scale-100 hover:scale-105 active:scale-95 ${
                      syncStatus === 'success'
                        ? 'bg-white text-green-700 cursor-default ring-green-300'
                        : 'bg-white hover:bg-blue-50 text-blue-800'
                  }`}
              >
                  {syncStatus === 'uploading' ? (
                      <>
                         <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                         <span className="text-blue-600">Sedang Mengirim...</span>
                      </>
                  ) : syncStatus === 'success' ? (
                      <>
                         <CheckCircle2 className="w-8 h-8 text-green-600" />
                         <span className="text-lg">SUKSES!</span>
                      </>
                  ) : (
                      <>
                         <UploadCloud className="w-6 h-6 text-blue-700 group-hover:-translate-y-1 transition-transform" />
                         <span>KIRIM DATA SEKARANG</span>
                      </>
                  )}
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                {stat.icon ? <stat.icon className="w-6 h-6" /> : <div className="w-3 h-3 bg-white rounded-full"></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Siswa per Kelas</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
