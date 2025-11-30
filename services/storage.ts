import { User, Student, LearningObjective, Grade, UserRole, SUBJECTS, SchoolData, ReportGrade, ReportExtras, ReportCoverConfig, StudentProfile } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

// --- KONFIGURASI FIREBASE ---
const getEnv = (key: string) => (import.meta as any).env?.[key];

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || "API_KEY_ANDA_DISINI",
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || "PROJECT_ID.firebaseapp.com",
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || "PROJECT_ID",
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "PROJECT_ID.appspot.com",
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || "SENDER_ID",
  appId: getEnv("VITE_FIREBASE_APP_ID") || "APP_ID"
};

let db: any = null;
let isOnline = false;

try {
    const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "API_KEY_ANDA_DISINI";
    if (isConfigured) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        isOnline = true;
        console.log("System Status: ONLINE (Cloud Mode Active)");
    } else {
        console.warn("System Status: LOKAL (Offline Mode - Config Missing)");
    }
} catch (e) {
    console.error("Firebase Init Failed:", e);
    isOnline = false;
    db = null;
}

// Initial Mock Data (Fallback)
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', password: '123', name: 'Administrator', role: UserRole.ADMIN },
];

const INITIAL_STUDENTS: Student[] = [];

const INITIAL_TPS: LearningObjective[] = [
  { id: 'tp1', subject: 'Matematika (Umum)', description: 'Memahami konsep eksponen dan logaritma', semester: 1, phase: 'E', classTarget: 'X-A' },
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

export const STORAGE_KEYS = {
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

// --- SUBSCRIPTION SYSTEM ---
const listeners: { [key: string]: Function[] } = {};
// Store Firebase Unsubscribes to prevent duplicates
let cloudUnsubscribes: Unsubscribe[] = [];

const emitChange = (key: string) => {
    if (listeners[key]) {
        listeners[key].forEach(cb => cb());
    }
};

// --- CLOUD HELPER FUNCTIONS ---
const syncCollectionFromCloud = async (collectionName: string, storageKey: string, initialData: any) => {
    if (!db || !isOnline) return;
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        if (!snapshot.empty) {
            const data = snapshot.docs.map(doc => doc.data());
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`Synced ${collectionName}: ${data.length} records.`);
        } else {
             if (!localStorage.getItem(storageKey)) {
                 localStorage.setItem(storageKey, JSON.stringify(initialData));
             }
        }
    } catch (e) {
        console.error(`Sync Fail (${collectionName}): Keeping local data.`);
    }
};

const saveToCloud = async (collectionName: string, docId: string, data: any) => {
    if (!db || !isOnline) return;
    try {
        await setDoc(doc(db, collectionName, docId), data);
    } catch (e) {
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
  // New: Subscribe to changes
  subscribe: (keys: string | string[], callback: () => void) => {
      const keysToWatch = Array.isArray(keys) ? keys : [keys];
      keysToWatch.forEach(k => {
          if (!listeners[k]) listeners[k] = [];
          listeners[k].push(callback);
      });
      
      return () => {
          keysToWatch.forEach(k => {
              if(listeners[k]) listeners[k] = listeners[k].filter(c => c !== callback);
          });
      };
  },

  // New: Init Realtime Listeners
  initRealtime: () => {
      if (!isOnline || !db) return;
      
      // Clear existing listeners to prevent duplicates
      if (cloudUnsubscribes.length > 0) {
          cloudUnsubscribes.forEach(unsub => unsub());
          cloudUnsubscribes = [];
      }

      console.log("Initializing One Data Realtime Listeners...");

      const collections = [
          { name: 'users', key: STORAGE_KEYS.USERS },
          { name: 'students', key: STORAGE_KEYS.STUDENTS },
          { name: 'tps', key: STORAGE_KEYS.TPS },
          { name: 'report_grades', key: STORAGE_KEYS.REPORT_GRADES },
          { name: 'report_extras', key: STORAGE_KEYS.REPORT_EXTRAS },
          { name: 'student_profiles', key: STORAGE_KEYS.STUDENT_PROFILES }
      ];

      collections.forEach(col => {
          const unsub = onSnapshot(collection(db, col.name), (snapshot) => {
              const data = snapshot.docs.map(doc => doc.data());
              // Update Local Storage ("Cache")
              localStorage.setItem(col.key, JSON.stringify(data));
              // Notify UI
              emitChange(col.key);
          }, (error) => console.error(`Realtime Error (${col.name}):`, error));
          cloudUnsubscribes.push(unsub);
      });

      // Settings Documents
      const unsubSchool = onSnapshot(doc(db, 'settings', 'school_data'), (snap) => {
          if(snap.exists()) {
               localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(snap.data()));
               emitChange(STORAGE_KEYS.SCHOOL);
          }
      });
      cloudUnsubscribes.push(unsubSchool);
      
      const unsubCover = onSnapshot(doc(db, 'settings', 'cover_config'), (snap) => {
          if(snap.exists()) {
               localStorage.setItem(STORAGE_KEYS.COVER_CONFIG, JSON.stringify(snap.data()));
               emitChange(STORAGE_KEYS.COVER_CONFIG);
          }
      });
      cloudUnsubscribes.push(unsubCover);
  },

  syncFromCloud: async () => {
      if (!isOnline) {
          console.log("Mode Lokal: Menggunakan data browser.");
          return Promise.resolve();
      }
      
      console.log("Mode Online: Menyinkronkan data awal...");
      try {
          // Initial Fetch (Blocking) to prevent empty flash
          await Promise.all([
              syncCollectionFromCloud('users', STORAGE_KEYS.USERS, INITIAL_USERS),
              syncCollectionFromCloud('students', STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
              syncCollectionFromCloud('tps', STORAGE_KEYS.TPS, INITIAL_TPS),
              syncCollectionFromCloud('report_grades', STORAGE_KEYS.REPORT_GRADES, []),
              syncCollectionFromCloud('report_extras', STORAGE_KEYS.REPORT_EXTRAS, []),
              syncCollectionFromCloud('student_profiles', STORAGE_KEYS.STUDENT_PROFILES, []),
              (async () => {
                  if(!db) return;
                  try {
                      const settingsSnap = await getDocs(collection(db, 'settings'));
                      settingsSnap.forEach(doc => {
                          if(doc.id === 'school_data') localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(doc.data()));
                          if(doc.id === 'cover_config') localStorage.setItem(STORAGE_KEYS.COVER_CONFIG, JSON.stringify(doc.data()));
                      });
                  } catch(e) {}
              })()
          ]);
      } catch (e) {
          console.error("Sync Error - Continuing with local data", e);
      }
  },

  isOnline: () => isOnline,

  login: async (username: string, password: string, academicYear: string): Promise<User | null> => {
    await delay(500);
    const users = StorageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const sessionData: SessionData = { user, academicYear };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getSession: (): SessionData | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },

  updateUser: (updatedUser: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      saveToCloud('users', updatedUser.id, updatedUser);
      emitChange(STORAGE_KEYS.USERS);
    }
  },

  addUser: (newUser: User) => {
    const users = StorageService.getUsers();
    if (!newUser.id) newUser.id = Date.now().toString();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    saveToCloud('users', newUser.id, newUser);
    emitChange(STORAGE_KEYS.USERS);
  },

  deleteUser: (userId: string) => {
    let users = StorageService.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    deleteFromCloud('users', userId);
    emitChange(STORAGE_KEYS.USERS);
  },

  getHomeroomTeacher: (className: string): User | undefined => {
    const users = StorageService.getUsers();
    return users.find(u => u.homeroomClass === className);
  },

  getStudents: (): Student[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
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
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    saveToCloud('students', student.id, student);
    emitChange(STORAGE_KEYS.STUDENTS);
  },

  deleteStudent: (studentId: string) => {
    let students = StorageService.getStudents();
    students = students.filter(s => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    deleteFromCloud('students', studentId);
    emitChange(STORAGE_KEYS.STUDENTS);
  },

  getStudentProfile: (studentId: string): StudentProfile => {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES);
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
      const data = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILES);
      let profiles: StudentProfile[] = data ? JSON.parse(data) : [];
      const index = profiles.findIndex(p => p.studentId === profile.studentId);
      if (index !== -1) profiles[index] = profile;
      else profiles.push(profile);
      localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILES, JSON.stringify(profiles));
      saveToCloud('student_profiles', profile.studentId, profile);
      emitChange(STORAGE_KEYS.STUDENT_PROFILES);
  },

  getTPs: (subject?: string, phase?: string, classTarget?: string): LearningObjective[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TPS);
    let tps: LearningObjective[] = data ? JSON.parse(data) : INITIAL_TPS;
    if (!data) localStorage.setItem(STORAGE_KEYS.TPS, JSON.stringify(INITIAL_TPS));
    
    if (subject) tps = tps.filter(tp => tp.subject === subject);
    if (phase) tps = tps.filter(tp => tp.phase === phase);
    return tps;
  },

  addTP: (tp: LearningObjective) => {
    const tps = StorageService.getTPs();
    const newTp = { ...tp, id: tp.id || Date.now().toString() };
    tps.push(newTp);
    localStorage.setItem(STORAGE_KEYS.TPS, JSON.stringify(tps));
    saveToCloud('tps', newTp.id, newTp);
    emitChange(STORAGE_KEYS.TPS);
  },
  
  deleteTP: (id: string) => {
    const tps = StorageService.getTPs();
    const newTps = tps.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TPS, JSON.stringify(newTps));
    deleteFromCloud('tps', id);
    emitChange(STORAGE_KEYS.TPS);
  },

  getGrades: (subject: string): Grade[] => { return []; },
  saveGrades: (newGrades: Grade[]) => {},

  getReportGrades: (subject: string, semester: string, academicYear?: string): ReportGrade[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORT_GRADES);
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

  // Helper for One Data: Get ALL grades to calculate statistics
  getAllReportGrades: (): ReportGrade[] => {
      const data = localStorage.getItem(STORAGE_KEYS.REPORT_GRADES);
      return data ? JSON.parse(data) : [];
  },

  saveReportGrades: (newGrades: ReportGrade[]) => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORT_GRADES);
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
    localStorage.setItem(STORAGE_KEYS.REPORT_GRADES, JSON.stringify(allGrades));
    emitChange(STORAGE_KEYS.REPORT_GRADES);
  },

  getReportExtras: (studentId: string, academicYear?: string): ReportExtras => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORT_EXTRAS);
    const allExtras: ReportExtras[] = data ? JSON.parse(data) : [];
    
    const found = allExtras.find(e => {
        const matchesStudent = e.studentId === studentId;
        let matchesYear = true;
        if (academicYear) {
             if (e.academicYear) matchesYear = e.academicYear.trim() === academicYear.trim();
             else matchesYear = false; 
        }
        return matchesStudent && matchesYear;
    });
    
    return found || {
      studentId,
      academicYear: academicYear || '', 
      attendance: { sakit: 0, izin: 0, alpa: 0 },
      extracurriculars: [],
      teacherNote: '',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      issuePlace: '', 
      promotion: { status: '', targetClass: '' }
    };
  },

  // Helper for One Data: Get ALL extras to show status lists
  getAllReportExtras: (): ReportExtras[] => {
      const data = localStorage.getItem(STORAGE_KEYS.REPORT_EXTRAS);
      return data ? JSON.parse(data) : [];
  },

  saveReportExtras: (extras: ReportExtras) => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORT_EXTRAS);
    let allExtras: ReportExtras[] = data ? JSON.parse(data) : [];
    
    const idx = allExtras.findIndex(e => 
        e.studentId === extras.studentId && 
        (e.academicYear === extras.academicYear || (!e.academicYear && !extras.academicYear))
    );
    
    let docId = extras.studentId + '_' + (extras.academicYear || 'default').replace(/[\/\s]/g, '-');
    
    if (idx !== -1) {
        allExtras[idx] = extras;
    } else {
        allExtras.push(extras);
    }
    
    localStorage.setItem(STORAGE_KEYS.REPORT_EXTRAS, JSON.stringify(allExtras));
    saveToCloud('report_extras', docId, extras);
    emitChange(STORAGE_KEYS.REPORT_EXTRAS);
  },

  getSchoolData: (): SchoolData => {
    const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(INITIAL_SCHOOL_DATA));
      return INITIAL_SCHOOL_DATA;
    }
    return JSON.parse(data);
  },

  saveSchoolData: (data: SchoolData) => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(data));
    saveToCloud('settings', 'school_data', data);
    emitChange(STORAGE_KEYS.SCHOOL);
  },

  getCoverConfig: (): ReportCoverConfig => {
      const data = localStorage.getItem(STORAGE_KEYS.COVER_CONFIG);
      if (!data) {
          localStorage.setItem(STORAGE_KEYS.COVER_CONFIG, JSON.stringify(INITIAL_COVER_CONFIG));
          return INITIAL_COVER_CONFIG;
      }
      return JSON.parse(data);
  },

  saveCoverConfig: (config: ReportCoverConfig) => {
      localStorage.setItem(STORAGE_KEYS.COVER_CONFIG, JSON.stringify(config));
      saveToCloud('settings', 'cover_config', config);
      emitChange(STORAGE_KEYS.COVER_CONFIG);
  }
};