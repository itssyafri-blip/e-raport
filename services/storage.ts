/// <reference types="vite/client" />
import { User, Student, LearningObjective, Grade, UserRole, SUBJECTS, SchoolData, ReportGrade, ReportExtras, ReportCoverConfig, StudentProfile } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';

// --- KONFIGURASI FIREBASE ---
// Menggunakan Environment Variables Vercel agar aman
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "API_KEY_ANDA_DISINI",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "PROJECT_ID",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "SENDER_ID",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "APP_ID"
};

let db: any = null;
let isOnline = false;

// FAIL-SAFE INITIALIZATION
// Mencegah aplikasi crash jika config belum diisi di Vercel
try {
    // Cek sederhana apakah config valid (bukan placeholder default)
    const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "API_KEY_ANDA_DISINI";
    
    if (isConfigured) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isOnline = true;
        console.log("System Status: ONLINE (Connected to Firestore)");
    } else {
        console.warn("System Status: OFFLINE (Running in Local Mode - Missing Config)");
    }
} catch (e) {
    console.error("Firebase Init Failed (Switched to Offline Mode):", e);
    isOnline = false;
    db = null;
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', password: '123', name: 'Administrator', role: UserRole.ADMIN },
];

const INITIAL_STUDENTS: Student[] = [];

const INITIAL_TPS: LearningObjective[] = [
  { id: 'tp1', subject: 'Matematika (Umum)', description: 'Memahami konsep eksponen dan logaritma', semester: 1, phase: 'E', classTarget: 'X-A' },
  { id: 'tp2', subject: 'Matematika (Umum)', description: 'Menyelesaikan masalah sistem persamaan linear tiga variabel', semester: 1, phase: 'E', classTarget: 'X-A' },
];

const INITIAL_SCHOOL_DATA: SchoolData = {
  name: 'SMA NEGERI 1 PULAU BANYAK BARAT',
  npsn: '',
  address: '',
  street: '',
  village: '',
  subDistrict: '',
  district: '',
  province: '',
  postalCode: '',
  principalName: '',
  principalNip: '',
  website: '',
  email: '',
  logoUrl: '' 
};

const INITIAL_COVER_CONFIG: ReportCoverConfig = {
    ministryNameLine1: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,',
    ministryNameLine2: 'RISET, DAN TEKNOLOGI',
    reportTitle: 'LAPORAN HASIL BELAJAR',
    subTitle: '(RAPOR)',
    footerText: ''
};

const KEYS = {
  USERS: 'erapor_users',
  STUDENTS: 'erapor_students',
  STUDENT_PROFILES: 'erapor_student_profiles', 
  TPS: 'erapor_tps',
  GRADES: 'erapor_grades', 
  REPORT_GRADES: 'erapor_report_grades', 
  REPORT_EXTRAS: 'erapor_report_extras', 
  SESSION: 'erapor_session',
  SCHOOL: 'erapor_school_data',
  COVER_CONFIG: 'erapor_cover_config'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SessionData {
    user: User;
    academicYear: string;
}

// --- CLOUD HELPER FUNCTIONS ---
const syncCollectionFromCloud = async (collectionName: string, storageKey: string, initialData: any) => {
    if (!db || !isOnline) return;
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => doc.data());
            localStorage.setItem(storageKey, JSON.stringify(data));
        }
    } catch (e) {
        console.error(`Sync Fail (${collectionName}): Switched to local data.`);
    }
};

const saveToCloud = async (collectionName: string, docId: string, data: any) => {
    if (!db || !isOnline) return;
    try {
        await setDoc(doc(db, collectionName, docId), data);
    } catch (e) {
        // Silent fail is acceptable in offline/unstable network
        console.warn(`Cloud Save Fail (${collectionName}): Saved locally only.`);
    }
};

const deleteFromCloud = async (collectionName: string, docId: string) => {
    if (!db || !isOnline) return;
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (e) {
        console.warn(`Cloud Delete Fail (${collectionName}).`);
    }
};

export const StorageService = {
  syncFromCloud: async () => {
      // Always resolve true to prevent App white screen
      if (!isOnline) {
          console.log("Skipping cloud sync (Offline Mode)");
          return Promise.resolve();
      }
      
      try {
          await Promise.all([
              syncCollectionFromCloud('users', KEYS.USERS, INITIAL_USERS),
              syncCollectionFromCloud('students', KEYS.STUDENTS, INITIAL_STUDENTS),
              syncCollectionFromCloud('tps', KEYS.TPS, INITIAL_TPS),
              syncCollectionFromCloud('report_grades', KEYS.REPORT_GRADES, []),
              syncCollectionFromCloud('report_extras', KEYS.REPORT_EXTRAS, []),
              syncCollectionFromCloud('student_profiles', KEYS.STUDENT_PROFILES, []),
              (async () => {
                  if(!db) return;
                  try {
                      const settingsSnap = await getDocs(collection(db, 'settings'));
                      settingsSnap.forEach(doc => {
                          if(doc.id === 'school_data') localStorage.setItem(KEYS.SCHOOL, JSON.stringify(doc.data()));
                          if(doc.id === 'cover_config') localStorage.setItem(KEYS.COVER_CONFIG, JSON.stringify(doc.data()));
                      });
                  } catch(e) {}
              })()
          ]);
      } catch (e) {
          console.error("Critical Sync Error - Proceeding with local data", e);
      }
  },

  isOnline: () => isOnline,

  login: async (username: string, password: string, academicYear: string): Promise<User | null> => {
    await delay(500);
    const users = StorageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const sessionData: SessionData = { user, academicYear };
      localStorage.setItem(KEYS.SESSION, JSON.stringify(sessionData));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(KEYS.SESSION);
  },

  getSession: (): SessionData | null => {
    const session = localStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(KEYS.USERS);
    if (!data) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },

  updateUser: (updatedUser: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      saveToCloud('users', updatedUser.id, updatedUser);
    }
  },

  addUser: (newUser: User) => {
    const users = StorageService.getUsers();
    if (!newUser.id) newUser.id = Date.now().toString();
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    saveToCloud('users', newUser.id, newUser);
  },

  deleteUser: (userId: string) => {
    let users = StorageService.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    deleteFromCloud('users', userId);
  },

  getHomeroomTeacher: (className: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.homeroomClass === className);
  },

  getStudents: (): Student[] => {
    const data = localStorage.getItem(KEYS.STUDENTS);
    if (!data) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(data);
  },

  saveStudent: (student: Student) => {
    const students = StorageService.getStudents();
    if (student.id) {
        const index = students.findIndex(s => s.id === student.id);
        if (index !== -1) students[index] = student;
        else students.push(student);
    } else {
        student.id = Date.now().toString();
        students.push(student);
    }
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    saveToCloud('students', student.id, student);
  },

  deleteStudent: (studentId: string) => {
    let students = StorageService.getStudents();
    students = students.filter(s => s.id !== studentId);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
    deleteFromCloud('students', studentId);
  },

  getStudentProfile: (studentId: string): StudentProfile => {
      const data = localStorage.getItem(KEYS.STUDENT_PROFILES);
      const profiles: StudentProfile[] = data ? JSON.parse(data) : [];
      const found = profiles.find(p => p.studentId === studentId);
      
      return found || {
          studentId,
          nis: '', nisn: '', birthPlace: '', birthDate: '', gender: 'Laki-laki',
          religion: 'Islam', familyStatus: 'Anak Kandung', childOrder: '', address: '',
          phone: '', originSchool: '', acceptedClass: 'X', acceptedDate: '',
          fatherName: '', motherName: '', guardianJob: '', photoUrl: ''
      };
  },

  saveStudentProfile: (profile: StudentProfile) => {
      const data = localStorage.getItem(KEYS.STUDENT_PROFILES);
      let profiles: StudentProfile[] = data ? JSON.parse(data) : [];
      const index = profiles.findIndex(p => p.studentId === profile.studentId);
      if (index !== -1) profiles[index] = profile;
      else profiles.push(profile);
      localStorage.setItem(KEYS.STUDENT_PROFILES, JSON.stringify(profiles));
      saveToCloud('student_profiles', profile.studentId, profile);
  },

  getTPs: (subject?: string, phase?: string, classTarget?: string): LearningObjective[] => {
    const data = localStorage.getItem(KEYS.TPS);
    let tps: LearningObjective[] = data ? JSON.parse(data) : INITIAL_TPS;
    if (!data) localStorage.setItem(KEYS.TPS, JSON.stringify(INITIAL_TPS));
    
    if (subject) tps = tps.filter(tp => tp.subject === subject);
    if (phase) tps = tps.filter(tp => tp.phase === phase);
    return tps;
  },

  addTP: (tp: LearningObjective) => {
    const tps = StorageService.getTPs();
    const newTp = { ...tp, id: tp.id || Date.now().toString() };
    tps.push(newTp);
    localStorage.setItem(KEYS.TPS, JSON.stringify(tps));
    saveToCloud('tps', newTp.id, newTp);
  },
  
  deleteTP: (id: string) => {
    const tps = StorageService.getTPs();
    const newTps = tps.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TPS, JSON.stringify(newTps));
    deleteFromCloud('tps', id);
  },

  getGrades: (subject: string): Grade[] => { return []; },
  saveGrades: (newGrades: Grade[]) => {},

  getReportGrades: (subject: string, semester: string, academicYear?: string): ReportGrade[] => {
    const data = localStorage.getItem(KEYS.REPORT_GRADES);
    const grades: ReportGrade[] = data ? JSON.parse(data) : [];
    
    return grades.filter(g => {
        const matchesSubject = !subject || g.subject === subject;
        const matchesSemester = g.semester === semester;
        let matchesYear = true;
        if (academicYear) {
            if (g.academicYear) matchesYear = g.academicYear.includes(academicYear);
            else matchesYear = false; 
        }
        return matchesSubject && matchesSemester && matchesYear;
    });
  },

  saveReportGrades: (newGrades: ReportGrade[]) => {
    const data = localStorage.getItem(KEYS.REPORT_GRADES);
    let allGrades: ReportGrade[] = data ? JSON.parse(data) : [];
    
    newGrades.forEach(ng => {
      const tempId = ng.id || (Date.now().toString() + Math.random().toString().substr(2, 5));
      const entryToSave = { ...ng, id: tempId };

      const idx = allGrades.findIndex(g => 
          g.studentId === ng.studentId && 
          g.subject === ng.subject && 
          g.semester === ng.semester &&
          (g.academicYear === ng.academicYear || (!g.academicYear && !ng.academicYear))
      );
      
      if (idx !== -1) {
        allGrades[idx] = { ...entryToSave, id: allGrades[idx].id };
        saveToCloud('report_grades', allGrades[idx].id, allGrades[idx]);
      } else {
        allGrades.push(entryToSave);
        saveToCloud('report_grades', entryToSave.id, entryToSave);
      }
    });
    localStorage.setItem(KEYS.REPORT_GRADES, JSON.stringify(allGrades));
  },

  getReportExtras: (studentId: string, academicYear?: string): ReportExtras => {
    const data = localStorage.getItem(KEYS.REPORT_EXTRAS);
    const allExtras: ReportExtras[] = data ? JSON.parse(data) : [];
    
    const found = allExtras.find(e => {
        const matchesStudent = e.studentId === studentId;
        let matchesYear = true;
        if (academicYear) {
             if (e.academicYear) matchesYear = e.academicYear.includes(academicYear);
             else matchesYear = false;
        }
        return matchesStudent && matchesYear;
    });
    
    return found || {
      studentId,
      attendance: { sakit: 0, izin: 0, alpa: 0 },
      extracurriculars: [{ name: 'Pramuka', description: 'Baik' }],
      teacherNote: 'Tingkatkan terus semangat belajarmu.',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      promotion: { status: '', targetClass: '' }
    };
  },

  saveReportExtras: (extras: ReportExtras) => {
    const data = localStorage.getItem(KEYS.REPORT_EXTRAS);
    let allExtras: ReportExtras[] = data ? JSON.parse(data) : [];
    const idx = allExtras.findIndex(e => 
        e.studentId === extras.studentId && 
        (e.academicYear === extras.academicYear || (!e.academicYear && !extras.academicYear))
    );
    let docId = extras.studentId + '_' + (extras.academicYear || 'default').replace(/\//g, '-');
    if (idx !== -1) allExtras[idx] = extras;
    else allExtras.push(extras);
    
    localStorage.setItem(KEYS.REPORT_EXTRAS, JSON.stringify(allExtras));
    saveToCloud('report_extras', docId, extras);
  },

  getSchoolData: (): SchoolData => {
    const data = localStorage.getItem(KEYS.SCHOOL);
    if (!data) {
      localStorage.setItem(KEYS.SCHOOL, JSON.stringify(INITIAL_SCHOOL_DATA));
      return INITIAL_SCHOOL_DATA;
    }
    return JSON.parse(data);
  },

  saveSchoolData: (data: SchoolData) => {
    localStorage.setItem(KEYS.SCHOOL, JSON.stringify(data));
    saveToCloud('settings', 'school_data', data);
  },

  getCoverConfig: (): ReportCoverConfig => {
      const data = localStorage.getItem(KEYS.COVER_CONFIG);
      if (!data) {
          localStorage.setItem(KEYS.COVER_CONFIG, JSON.stringify(INITIAL_COVER_CONFIG));
          return INITIAL_COVER_CONFIG;
      }
      return JSON.parse(data);
  },

  saveCoverConfig: (config: ReportCoverConfig) => {
      localStorage.setItem(KEYS.COVER_CONFIG, JSON.stringify(config));
      saveToCloud('settings', 'cover_config', config);
  }
};