
import React, { useState } from 'react';
import { User, UserRole, SchoolData } from '../types';
import { StorageService } from '../services/storage';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  LogOut, 
  GraduationCap,
  Printer,
  ChevronDown,
  ChevronRight,
  Building2,
  Upload,
  PenTool,
  Settings,
  Files,
  Archive,
  CheckSquare,
  CloudOff,
  Cloud,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface LayoutProps {
  user: User;
  schoolData: SchoolData;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  academicYear: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, schoolData, currentView, onNavigate, onLogout, academicYear, children }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['nilai-rapor']);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success'>('idle');
  const isOnline = StorageService.isOnline();

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const handleManualSync = async () => {
      if(syncState !== 'idle') return;
      
      if(!isOnline) {
          alert("Koneksi Offline. Tidak dapat mengirim data ke server. Harap konfigurasikan API Key di Vercel.");
          return;
      }

      setSyncState('syncing');
      try {
          await StorageService.forcePushToCloud();
          setSyncState('success');
          // Revert back to idle after 3 seconds
          setTimeout(() => {
             setSyncState('idle');
          }, 3000);
      } catch (e) {
          alert("Gagal mengirim data. Pastikan koneksi internet stabil.");
          console.error(e);
          setSyncState('idle');
      }
  };
  
  const NavItem = ({ view, icon: Icon, label, indent = false }: { view: string, icon: any, label: string, indent?: boolean }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
          indent ? 'pl-11' : ''
        } ${
          isActive 
            ? 'bg-slate-800 text-white border-blue-500' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
        <span>{label}</span>
      </button>
    );
  };

  // Menu for Admin
  const renderAdminMenu = () => (
    <>
      <div className="mt-4 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Administrator
      </div>
      <NavItem view="school-data" icon={Building2} label="Data Sekolah" />
      <NavItem view="admin-settings" icon={Users} label="Manajemen User" />
      
      <div className="mt-4 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Akademik
      </div>
      <NavItem view="learning-objectives" icon={BookOpen} label="Tujuan Pembelajaran" />
      <div>
        <button 
          onClick={() => toggleMenu('nilai-rapor')}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-4 border-transparent"
        >
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-slate-500" />
            <span>Nilai Rapor</span>
          </div>
          {expandedMenus.includes('nilai-rapor') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {expandedMenus.includes('nilai-rapor') && (
          <div className="bg-slate-950/50 py-1">
            <NavItem view="grading-input" icon={PenTool} label="Input Nilai Rapor" indent />
            <NavItem view="grading-import" icon={Upload} label="Import Nilai Excel" indent />
          </div>
        )}
      </div>
      <NavItem view="student-data" icon={Users} label="Data Siswa" />
      
      <div className="mt-4 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Laporan
      </div>
      <NavItem view="student-extras" icon={CheckSquare} label="Data Lengkap Siswa" />
      <NavItem view="report-settings" icon={Settings} label="Atur Data Rapor" />
      <NavItem view="printing" icon={Printer} label="Cetak Rapor (PDF)" />
      <NavItem view="printing-v2" icon={Files} label="Cetak Rapor Jalur Dua" />
      <NavItem view="report-bank" icon={Archive} label="Bank Rapor (Arsip)" />
    </>
  );

  // Menu for Guru (Subject Teacher AND Wali Kelas)
  const renderGuruMenu = () => {
    const isWaliKelas = !!user.homeroomClass;

    return (
      <>
        <div className="mt-4 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Akademik
        </div>
        
        {/* Available for ALL Teachers */}
        <NavItem view="learning-objectives" icon={BookOpen} label="Tujuan Pembelajaran" />
        
        <div>
          <button 
            onClick={() => toggleMenu('nilai-rapor')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-4 border-transparent"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-slate-500" />
              <span>Nilai Rapor</span>
            </div>
            {expandedMenus.includes('nilai-rapor') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedMenus.includes('nilai-rapor') && (
            <div className="bg-slate-950/50 py-1">
              <NavItem view="grading-input" icon={PenTool} label="Input Nilai Rapor" indent />
              <NavItem view="grading-import" icon={Upload} label="Import Nilai Excel" indent />
            </div>
          )}
        </div>

        {/* Data Siswa: Available for ALL Teachers (But Read Only for Subject Teacher) */}
        <NavItem view="student-data" icon={Users} label={isWaliKelas ? "Data Siswa (Wali)" : "Data Siswa"} />

        {/* Wali Kelas ONLY Menus */}
        {isWaliKelas && (
          <>
             <div className="mt-4 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Laporan (Wali Kelas)
             </div>
             <NavItem view="student-extras" icon={CheckSquare} label="Data Lengkap Siswa" />
             <NavItem view="report-settings" icon={Settings} label="Atur Data Rapor" />
             <NavItem view="printing" icon={Printer} label="Cetak Rapor (PDF)" />
             <NavItem view="printing-v2" icon={Files} label="Cetak Rapor Jalur Dua" />
             <NavItem view="report-bank" icon={Archive} label="Bank Rapor (Arsip)" />
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar - Dark Blue Theme */}
      <aside className="w-64 bg-slate-900 fixed inset-y-0 left-0 z-30 no-print flex flex-col shadow-xl">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 bg-slate-950 border-b border-slate-800">
           <img 
             src={schoolData.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png"} 
             alt="Logo" 
             className="w-8 h-8 mr-3 object-contain bg-white/10 rounded-full p-0.5"
           />
           <div className="overflow-hidden">
             <h1 className="font-bold text-white text-base leading-tight truncate">e-Rapor SMA</h1>
             <p className="text-[10px] text-slate-400 truncate">{schoolData.name || 'Kurikulum Merdeka'}</p>
           </div>
        </div>

        {/* User Info in Sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-700">
                    {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">
                        {user.homeroomClass ? `Wali Kelas ${user.homeroomClass}` : user.role}
                    </p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          {user.role === UserRole.ADMIN ? renderAdminMenu() : renderGuruMenu()}
        </div>

        {/* Sidebar Footer - STATUS CONNECTION */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
           {isOnline ? (
               <div className="mb-3 px-3 py-2 rounded border border-emerald-800 bg-emerald-900/20 text-emerald-400 animate-in slide-in-from-bottom-2 relative overflow-hidden">
                   <div className="flex items-center gap-2 mb-1">
                       {/* Pulsing Dot Effect */}
                       <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                       <span className="text-[10px] font-bold">LIVE SYNC: AKTIF</span>
                   </div>
                   <p className="text-[9px] text-emerald-500 leading-tight">
                       Terhubung ke Vercel Cloud. Data otomatis terbaca di perangkat lain.
                   </p>
               </div>
           ) : (
               <div className="mb-3 px-3 py-2 rounded border border-red-800 bg-red-900/20 text-red-400">
                   <div className="flex items-center gap-2 mb-1">
                       <CloudOff className="w-4 h-4" />
                       <span className="text-[10px] font-bold">MODE OFFLINE</span>
                   </div>
                   <p className="text-[9px] text-red-300 leading-tight">
                       API Key belum terpasang di Vercel. Data tidak akan terbaca di komputer lain.
                   </p>
               </div>
           )}

            {/* MANUAL SYNC BUTTON WITH SUCCESS STATE */}
            {isOnline ? (
                <button
                    onClick={handleManualSync}
                    disabled={syncState !== 'idle'}
                    className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 mb-2 rounded text-xs font-bold transition-all shadow-sm ${
                        syncState === 'success' 
                         ? 'bg-green-600 text-white border border-green-500'
                         : 'bg-blue-800 hover:bg-blue-700 text-white border border-blue-700'
                    }`}
                >
                    {syncState === 'syncing' ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sinkronisasi...
                        </>
                    ) : syncState === 'success' ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> SUKSES!
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-3.5 h-3.5" /> Push Data ke Cloud
                        </>
                    )}
                </button>
            ) : (
                <div className="text-[9px] text-slate-500 text-center italic mb-2">
                    Fitur Sinkronisasi Nonaktif
                </div>
            )}

           <button 
             onClick={onLogout}
             className="flex items-center justify-center space-x-2 text-slate-400 hover:text-white hover:bg-red-600/20 w-full px-4 py-2 rounded transition-colors group"
           >
             <LogOut className="w-5 h-5 group-hover:text-red-500" />
             <span className="text-sm font-medium">Keluar</span>
           </button>
           <div className="mt-4 text-center">
             <p className="text-[10px] text-slate-600">v2.1.0 &copy; 2024</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col no-print-padding">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex justify-between items-center px-8 no-print border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
             <span className="font-medium text-gray-600">e-Rapor SMA</span>
             <span>/</span>
             <span className="text-blue-600 font-medium capitalize">
                {currentView.replace('-', ' ')}
             </span>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-800 uppercase">{user.subject || 'Administrator'}</div>
                <div className="text-xs text-gray-500">{academicYear}</div>
             </div>
             <div className="h-8 w-px bg-gray-200 mx-2"></div>
             <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                 <div className="h-8 w-8 rounded bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.substring(0,2).toUpperCase()}
                 </div>
                 <ChevronDown className="w-4 h-4 text-gray-400" />
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-gray-100">
           {/* Breadcrumb Title Area */}
           <div className="mb-6 flex justify-between items-end no-print">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight capitalize">
                  {currentView.replace('-', ' ')}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                   Kelola data dan aktivitas penilaian di halaman ini.
                </p>
              </div>
           </div>

           <div className="bg-white rounded shadow-sm border border-gray-200 min-h-[500px] p-6 print:shadow-none print:border-none print:p-0 print:w-full">
              {children}
           </div>
           
           <footer className="mt-8 text-center text-xs text-gray-400 no-print pb-4">
              e-Rapor Kurikulum Merdeka Jenjang SMA Version 2.0 <br/>
              Direktorat SMA - Kemendikbudristek
           </footer>
        </div>
      </main>
    </div>
  );
};
