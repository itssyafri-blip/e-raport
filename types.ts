

export enum UserRole {
  ADMIN = 'admin',
  GURU = 'guru'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  subject?: string; // Only for teachers
  homeroomClass?: string; // New: If assigned as Wali Kelas
  password?: string; // For mock data management
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  class: string;
  phase: 'E' | 'F'; // New: Phase field
}

// New: Detailed Student Profile for Report Identity Page
export interface StudentProfile {
  studentId: string;
  nis: string;
  nisn: string; // Redundant but good for form binding
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'Laki-laki' | 'Perempuan';
  religion: string;
  familyStatus: string; // e.g. Anak Kandung
  childOrder: string; // e.g. 1
  address: string;
  phone: string;
  originSchool: string;
  acceptedClass: string;
  acceptedDate: string; // YYYY-MM-DD
  fatherName: string;
  motherName: string;
  guardianJob: string;
  photoUrl?: string; // Base64
}

export interface LearningObjective {
  id: string;
  subject: string;
  description: string;
  semester: number;
  phase: 'E' | 'F';     // New: Phase E (Class X) or F (Class XI/XII)
  classTarget: string;  // New: Specific class (e.g., 'X-A') or 'Semua'
}

// Deprecated old Grade interface in favor of ReportGrade for new requirements
export interface Grade {
  id: string;
  studentId: string;
  subject: string;
  tpId: string;
  score: number;
}

// New Interface for the requested "Nilai + TP Tuntas/Tidak Tuntas" system
export interface ReportGrade {
  id: string;
  studentId: string;
  subject: string;
  finalScore: number;
  achievedTpIds: string[]; // IDs of Tuntas
  improvementTpIds: string[]; // IDs of Tidak Tuntas
  semester: string; // "1" (Ganjil) or "2" (Genap)
  academicYear?: string; // New: For Bank Rapor (e.g., "2025/2026")
}

// New Interface for Report Card Extras (Page 2 data)
export interface ReportExtras {
  studentId: string;
  attendance: {
    sakit: number;
    izin: number;
    alpa: number;
  };
  extracurriculars: {
    name: string;
    description: string; // Predikat/Keterangan
  }[];
  teacherNote: string;
  date: string; // Date of report distribution
  
  // New: Promotion Decision (Only for Genap)
  promotion?: {
      status: 'NAIK' | 'TINGGAL' | 'NAIK_PERCOBAAN' | 'TINGGAL_PERCOBAAN' | '';
      targetClass: string; // e.g., "XI", "XII", "X"
  };
  academicYear?: string; // New: For Bank Rapor
}

export interface SchoolData {
  name: string;
  npsn: string;
  address: string; // Full string (legacy support)
  
  // Detailed Address Fields for Report Profile
  street?: string;
  village?: string; // Kelurahan
  subDistrict?: string; // Kecamatan
  district?: string; // Kabupaten/Kota
  province?: string;
  postalCode?: string;

  principalName: string;
  principalNip: string;
  website: string;
  email: string;
  logoUrl?: string; // Base64 string
  provinceLogoUrl?: string;
}

// New Interface for Report Cover Configuration
export interface ReportCoverConfig {
    ministryNameLine1: string; // "KEMENTERIAN PENDIDIKAN, KEBUDAYAAN,"
    ministryNameLine2: string; // "RISET, DAN TEKNOLOGI"
    reportTitle: string;       // "LAPORAN HASIL BELAJAR"
    subTitle: string;          // "(RAPOR)"
    footerText: string;        // "TAHUN PELAJARAN 2025/2026" (Usually dynamic, but can be configured)
}

export const SUBJECTS = [
  "Pendidikan Agama Islam dan Budi Pekerti",
  "Pendidikan Agama Kristen dan Budi Pekerti",
  "Pendidikan Agama Katolik dan Budi Pekerti",
  "Pendidikan Agama Hindu dan Budi Pekerti",
  "Pendidikan Agama Buddha dan Budi Pekerti",
  "Pendidikan Agama Khonghucu dan Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika (Umum)",
  "Matematika (Tingkat Lanjut)",
  "Bahasa Inggris",
  "Bahasa Inggris (Tingkat Lanjut)",
  "Ilmu Pengetahuan Alam (IPA)",
  "Fisika",
  "Kimia",
  "Biologi",
  "Informatika",
  "Ilmu Pengetahuan Sosial (IPS)",
  "Sejarah",
  "Geografi",
  "Ekonomi",
  "Sosiologi",
  "Antropologi",
  "Seni Budaya",
  "Seni Musik",
  "Seni Rupa",
  "Seni Teater",
  "Seni Tari",
  "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  "Prakarya dan Kewirausahaan",
  "Bahasa Arab",
  "Bahasa Jepang",
  "Bahasa Jerman",
  "Bahasa Korea",
  "Bahasa Mandarin",
  "Bahasa Prancis",
  "Muatan Lokal"
];

export const CLASSES = [
  "X", 
  "X-A", 
  "X-B", 
  "XI", 
  "XI-A", 
  "XI-B", 
  "XII", 
  "XII-A", 
  "XII-B"
];

// Helper to determine Phase from Class Name
export const getPhaseFromClass = (className: string): 'E' | 'F' => {
  if (className.startsWith('X')) return 'E';
  return 'F'; // XI and XII
};
