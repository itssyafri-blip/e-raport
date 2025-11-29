
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User, SchoolData } from '../types';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User, academicYear: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [semesterValue, setSemesterValue] = useState('20251'); // Default to 2025/2026 Ganjil
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolData>(StorageService.getSchoolData());

  useEffect(() => {
    // Refresh school data on mount
    setSchoolData(StorageService.getSchoolData());
  }, []);

  // Generate Semester Options for 30 Years starting 2025
  const semesterOptions = [];
  const startYear = 2025;
  for (let i = 0; i < 30; i++) {
      const currentYear = startYear + i;
      const nextYear = currentYear + 1;
      semesterOptions.push({
          value: `${currentYear}1`,
          label: `Tahun Pelajaran ${currentYear}/${nextYear} Ganjil`
      });
      semesterOptions.push({
          value: `${currentYear}2`,
          label: `Tahun Pelajaran ${currentYear}/${nextYear} Genap`
      });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Find the full label for the selected value
    const selectedOption = semesterOptions.find(opt => opt.value === semesterValue);
    const academicYearLabel = selectedOption ? selectedOption.label : 'Tahun Pelajaran 2025/2026 Ganjil';

    try {
      const user = await StorageService.login(username, password, academicYearLabel);
      if (user) {
        onLogin(user, academicYearLabel);
      } else {
        setError('Username atau Password tidak ditemukan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans overflow-hidden bg-white">
      {/* LEFT SIDE - Branding & Illustration */}
      <div className="hidden lg:flex lg:w-[60%] bg-[#e5e7eb] relative flex-col items-center justify-center p-12 text-center">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-gray-200 to-gray-300"></div>
        
        {/* Branding text removed as requested */}

        <div className="z-10 w-full max-w-4xl flex flex-col items-center">
           {/* Big Title */}
           <div className="mb-8 select-none">
              <h1 className="text-6xl font-black text-slate-700 tracking-tighter drop-shadow-sm mb-2">KURIKULUM</h1>
              <h1 className="text-6xl font-black text-slate-700 tracking-tighter drop-shadow-sm">MERDEKA</h1>
           </div>

           {/* Illustration / Mockup Area */}
           <div className="relative w-full max-w-2xl my-8">
              {/* This represents the devices shown in the reference image */}
              <div className="relative z-10">
                 <img 
                   src="https://img.freepik.com/free-vector/gradient-ui-ux-elements-background_23-2149056159.jpg?w=1380&t=st=1709999999~exp=1710000599~hmac=xyz" 
                   alt="Ilustrasi e-Rapor"
                   className="w-full rounded-xl shadow-2xl border-4 border-white"
                 />
                 {/* Floating Labels/Logos resembling the app screenshot */}
                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-lg shadow-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-600 rounded-md">
                         <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                         </svg>
                       </div>
                       <div className="text-left">
                          <p className="text-lg font-bold text-slate-800 leading-none">e-Rapor SMA</p>
                          <p className="text-xs text-slate-500">Terintegrasi Dapodik</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="mt-8 flex gap-4 text-slate-500">
               {/* Social Icons Placeholder */}
               <div className="flex gap-2 items-center text-xs font-medium bg-white/50 px-3 py-1 rounded-full">
                  <span>www.ditsma.kemdikbud.go.id</span>
               </div>
               <div className="flex gap-2 items-center text-xs font-medium bg-white/50 px-3 py-1 rounded-full">
                  <span>Direktorat SMA Kemdikbud</span>
               </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-12 md:px-20 bg-white shadow-2xl z-20 border-l border-gray-100">
         <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center lg:text-left">
               {/* Branding text removed as requested */}

               <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
               <p className="text-sm text-gray-500 mt-2">Silahkan login untuk masuk ke aplikasi e-Rapor.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start gap-2 rounded-r">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Sekolah</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                     <option>{schoolData.name || 'SMA NEGERI 1 PULAU BANYAK BARAT'} {schoolData.npsn ? `(NPSN: ${schoolData.npsn})` : ''}</option>
                  </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username / NIP</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Masukkan username anda"
                  />
               </div>
               
               <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors pr-10"
                    placeholder="Masukkan password anda"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pelajaran / Semester</label>
                  <select 
                    value={semesterValue}
                    onChange={(e) => setSemesterValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                     {semesterOptions.map(option => (
                         <option key={option.value} value={option.value}>{option.label}</option>
                     ))}
                  </select>
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded shadow-sm text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
               >
                  {loading ? 'Memproses...' : (
                      <>
                        <LogIn className="w-4 h-4" /> Masuk Aplikasi
                      </>
                  )}
               </button>
            </form>

            <div className="mt-8 text-center">
               <p className="text-xs text-gray-400">
                  &copy; 2024 Direktorat SMA - Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi
               </p>
               <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100 text-left text-xs text-blue-800 leading-relaxed italic">
                  <p>
                    Aplikasi e-raport dengan pendekatan deeplearning dibuat guru SMA Negeri 1 Pulau Banyak Barat, <span className="font-bold">Bapak Syafriadi, S.Pd,Gr</span> untuk membantu sekolah, wali kelas dan guru dalam melakukan evaluasi pembelajaran.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
