
import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import { User, UserRole, SchoolData } from './types';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AdminSettings } from './components/AdminSettings';
import { LearningObjectives } from './components/LearningObjectives';
import { StudentData } from './components/StudentData';
import { Grading } from './components/Grading';
import { ReportPrint } from './components/ReportPrint';
import { SchoolDataSettings } from './components/SchoolData';
import { ReportSettings } from './components/ReportSettings';
import { ReportBank } from './components/ReportBank';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [academicYear, setAcademicYear] = useState<string>('Tahun Pelajaran 2025/2026 Ganjil');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);
  const [schoolData, setSchoolData] = useState<SchoolData>(StorageService.getSchoolData());

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode');
  const studentIdParam = searchParams.get('studentId');
  
  const isPrintMode = mode === 'print' || mode === 'print-profile';
  const currentSemester = academicYear.toLowerCase().includes('genap') ? '2' : '1';

  // Initial Sync and Load
  useEffect(() => {
      const initApp = async () => {
          // 1. Try to sync with cloud
          await StorageService.syncFromCloud();
          setIsSyncing(false);

          // 2. Check Session
          if (!isPrintMode) {
            const session = StorageService.getSession();
            if (session) {
              setUser(session.user);
              setAcademicYear(session.academicYear || 'Tahun Pelajaran 2025/2026 Ganjil');
            }
          }

          // 3. Load School Data
          setSchoolData(StorageService.getSchoolData());
          setIsLoading(false);
      };

      initApp();
  }, [isPrintMode]);

  const handleLogin = (loggedInUser: User, year: string) => {
    setUser(loggedInUser);
    setAcademicYear(year);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setCurrentView('dashboard');
  };

  const refreshSchoolData = () => {
    setSchoolData(StorageService.getSchoolData());
  };

  if (isSyncing || isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <div className="text-center">
                  <p className="font-bold text-lg">Menyiapkan Aplikasi...</p>
                  <p className="text-sm text-slate-400">Menyinkronkan data dengan server.</p>
              </div>
          </div>
      );
  }

  if (isPrintMode) {
      const session = StorageService.getSession();
      const printYear = session ? session.academicYear : 'Tahun Pelajaran 2025/2026 Ganjil';
      const printSemester = printYear.toLowerCase().includes('genap') ? '2' : '1';
      
      return (
        <ReportPrint 
            mode="preview" 
            academicYear={printYear}
            currentSemester={printSemester}
            previewStudentId={studentIdParam || undefined} 
        />
      );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} />;
      
      case 'school-data':
        return user.role === UserRole.ADMIN ? <SchoolDataSettings onUpdate={refreshSchoolData} /> : <div className="text-red-500">Akses Ditolak</div>;
      case 'admin-settings':
        return user.role === UserRole.ADMIN ? <AdminSettings /> : <div className="text-red-500">Akses Ditolak</div>;
      
      case 'learning-objectives':
        return (user.role === UserRole.GURU || user.role === UserRole.ADMIN) ? <LearningObjectives user={user} currentSemester={Number(currentSemester)} /> : <div className="text-red-500">Akses Ditolak</div>;
      
      case 'grading-input':
        return (user.role === UserRole.GURU || user.role === UserRole.ADMIN) ? <Grading user={user} mode="input" currentSemester={currentSemester} academicYear={academicYear} /> : <div className="text-red-500">Akses Ditolak</div>;
      
      case 'grading-import':
        return (user.role === UserRole.GURU || user.role === UserRole.ADMIN) ? <Grading user={user} mode="import" currentSemester={currentSemester} academicYear={academicYear} /> : <div className="text-red-500">Akses Ditolak</div>;
      
      case 'student-data':
        return <StudentData user={user} />;
      
      case 'report-settings':
        const canAccessSettings = user.role === UserRole.ADMIN || (user.role === UserRole.GURU && !!user.homeroomClass);
        return canAccessSettings ? <ReportSettings /> : <div className="text-red-500">Akses Ditolak</div>;

      case 'printing':
        const canPrint = user.role === UserRole.ADMIN || (user.role === UserRole.GURU && !!user.homeroomClass);
        return canPrint ? <ReportPrint mode="selection" academicYear={academicYear} currentSemester={currentSemester} title="Cetak Rapor Siswa" actionType="download" /> : <div className="text-red-500">Akses Ditolak</div>;

      case 'printing-v2':
        const canPrintV2 = user.role === UserRole.ADMIN || (user.role === UserRole.GURU && !!user.homeroomClass);
        return canPrintV2 ? <ReportPrint mode="selection" academicYear={academicYear} currentSemester={currentSemester} title="Cetak Rapor Jalur Dua" actionType="preview" /> : <div className="text-red-500">Akses Ditolak</div>;
      
      case 'report-bank':
        const canAccessBank = user.role === UserRole.ADMIN || (user.role === UserRole.GURU && !!user.homeroomClass);
        return canAccessBank ? <ReportBank /> : <div className="text-red-500">Akses Ditolak</div>;

      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <Layout 
      user={user} 
      schoolData={schoolData}
      currentView={currentView} 
      onNavigate={setCurrentView} 
      onLogout={handleLogout}
      academicYear={academicYear}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
