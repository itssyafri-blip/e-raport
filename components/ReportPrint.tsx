import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CLASSES, SUBJECTS, User, ReportExtras, getPhaseFromClass, Student, SchoolData, ReportCoverConfig, StudentProfile, ReportGrade, LearningObjective } from '../types';
import { Search, FileDown, Edit, X, Loader2, AlertTriangle, Printer, Layers, Eye } from 'lucide-react';

// Declare html2pdf globally
declare var html2pdf: any;

interface ReportPrintProps {
  mode?: 'selection' | 'preview';
  academicYear?: string;
  currentSemester?: string; 
  previewStudentId?: string;
  title?: string;
  actionType?: 'download' | 'preview';
}

// --- EXPORTED TEMPLATES FOR REUSE IN SETTINGS ---

// 1. COVER TEMPLATE
export const CoverTemplate = ({
    student,
    coverConfig,
    school
}: {
    student?: Student,
    coverConfig: ReportCoverConfig,
    school?: SchoolData
}) => {
    return (
        <div id="cover-content" className="bg-white w-[210mm] h-[297mm] text-black text-[12pt] mx-auto shadow-none box-border relative" style={{ fontFamily: '"Times New Roman", Times, serif', padding: '2cm' }}>
             <div className="text-center mt-10">
                 <div className="flex justify-center mb-8">
                    <img src={school?.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png"} className="h-32 w-auto object-contain" alt="Logo" />
                 </div>
                 <h2 className="text-xl font-bold uppercase mb-2 leading-tight">{coverConfig.reportTitle}</h2>
                 <h3 className="text-lg font-bold uppercase leading-tight">{coverConfig.subTitle}</h3>
             </div>

             <div className="absolute top-[35%] left-0 w-full text-center px-10">
                 <p className="mb-4 text-sm uppercase">Nama Peserta Didik</p>
                 <div className="border border-black px-6 py-3 rounded inline-block min-w-[350px] bg-white">
                     <p className="text-xl font-bold uppercase">{student?.name || 'NAMA PESERTA DIDIK'}</p>
                 </div>
                 <p className="mt-8 mb-2 text-sm uppercase">NISN</p>
                 <div className="border border-black px-6 py-2 rounded inline-block min-w-[250px] bg-white">
                     <p className="text-lg font-bold">{student?.nisn || '0000000000'}</p>
                 </div>
             </div>

             <div className="absolute bottom-[2cm] left-0 w-full text-center px-10">
                 <h3 className="text-xl font-bold uppercase mb-1 leading-tight">{coverConfig.ministryNameLine1}</h3>
                 <h3 className="text-xl font-bold uppercase mb-6 leading-tight">{coverConfig.ministryNameLine2}</h3>
                 <p className="font-bold text-lg uppercase">REPUBLIK INDONESIA</p>
             </div>
        </div>
    );
};

// 2. SCHOOL IDENTITY TEMPLATE
export const SchoolIdentityTemplate = ({ school }: { school: SchoolData }) => {
    return (
         <div id="school-profile-content" className="bg-white w-[210mm] h-[297mm] text-black text-[12pt] mx-auto shadow-none box-border" style={{ fontFamily: '"Times New Roman", Times, serif', padding: '2cm' }}>
             <div className="text-center mb-16 mt-10">
                 <h3 className="text-lg font-bold uppercase">IDENTITAS SEKOLAH MENENGAH ATAS</h3>
             </div>
             <table className="w-full text-sm leading-loose">
                 <tbody>
                     <tr><td className="w-[35%] py-2 align-top">1. Nama Sekolah</td><td className="w-[2%] py-2 align-top">:</td><td className="py-2 align-top font-bold">{school.name}</td></tr>
                     <tr><td className="py-2 align-top">2. NPSN</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.npsn}</td></tr>
                     <tr><td className="py-2 align-top">3. Alamat Sekolah</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.street}</td></tr>
                     <tr><td className="pl-6 py-2 align-top">Kelurahan / Desa</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.village}</td></tr>
                     <tr><td className="pl-6 py-2 align-top">Kecamatan</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.subDistrict}</td></tr>
                     <tr><td className="pl-6 py-2 align-top">Kabupaten / Kota</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.district}</td></tr>
                     <tr><td className="pl-6 py-2 align-top">Provinsi</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.province}</td></tr>
                     <tr><td className="py-2 align-top">4. Kode Pos</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.postalCode}</td></tr>
                     <tr><td className="py-2 align-top">5. Website</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.website}</td></tr>
                     <tr><td className="py-2 align-top">6. Email</td><td className="py-2 align-top">:</td><td className="py-2 align-top">{school.email}</td></tr>
                 </tbody>
             </table>
         </div>
    );
};

// 3. STUDENT IDENTITY TEMPLATE (LEGAL/F4 SIZE)
export const StudentIdentityTemplate = ({
    profile,
    student,
    school
}: {
    profile: StudentProfile,
    student: Student,
    school: SchoolData
}) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div id="identity-content" className="bg-white text-black text-[12pt] mx-auto shadow-none box-border relative" 
             style={{ 
                 width: '215mm', 
                 height: '330mm', 
                 fontFamily: '"Times New Roman", Times, serif', 
                 padding: '2.5cm' 
             }}>
            
            <div className="text-center mb-8">
                <h3 className="font-bold text-lg uppercase">KETERANGAN TENTANG DIRI PESERTA DIDIK</h3>
            </div>

            <table className="w-full text-left align-top leading-snug">
                 <colgroup>
                    <col style={{width: '5%'}} />
                    <col style={{width: '35%'}} />
                    <col style={{width: '2%'}} />
                    <col style={{width: '58%'}} />
                </colgroup>
                <tbody>
                    <tr><td className="py-1">1.</td><td className="py-1">Nama Peserta Didik (Lengkap)</td><td className="py-1">:</td><td className="py-1 font-bold uppercase">{student?.name || profile.studentId}</td></tr>
                    <tr><td className="py-1">2.</td><td className="py-1">Nomor Induk Siswa Nasional</td><td className="py-1">:</td><td className="py-1">{profile.nisn}</td></tr>
                    <tr><td className="py-1">3.</td><td className="py-1">Tempat dan Tanggal Lahir</td><td className="py-1">:</td><td className="py-1">{profile.birthPlace}, {formatDate(profile.birthDate)}</td></tr>
                    <tr><td className="py-1">4.</td><td className="py-1">Jenis Kelamin</td><td className="py-1">:</td><td className="py-1">{profile.gender}</td></tr>
                    <tr><td className="py-1">5.</td><td className="py-1">Agama</td><td className="py-1">:</td><td className="py-1">{profile.religion}</td></tr>
                    <tr><td className="py-1">6.</td><td className="py-1">Status dalam Keluarga</td><td className="py-1">:</td><td className="py-1">{profile.familyStatus}</td></tr>
                    <tr><td className="py-1">7.</td><td className="py-1">Anak ke</td><td className="py-1">:</td><td className="py-1">{profile.childOrder}</td></tr>
                    <tr><td className="py-1">8.</td><td className="py-1">Alamat Peserta Didik</td><td className="py-1">:</td><td className="py-1">{profile.address}</td></tr>
                    <tr><td className="py-1"></td><td className="py-1">Nomor Telepon Rumah</td><td className="py-1">:</td><td className="py-1">{profile.phone}</td></tr>
                    <tr><td className="py-1">9.</td><td className="py-1">Diterima di sekolah ini</td><td className="py-1"></td><td className="py-1"></td></tr>
                    <tr><td className="py-1"></td><td className="py-1 pl-4">a. Di kelas</td><td className="py-1">:</td><td className="py-1">{profile.acceptedClass}</td></tr>
                    <tr><td className="py-1"></td><td className="py-1 pl-4">b. Pada tanggal</td><td className="py-1">:</td><td className="py-1">{formatDate(profile.acceptedDate)}</td></tr>
                    <tr><td className="py-1">10.</td><td className="py-1">Sekolah Asal</td><td className="py-1">:</td><td className="py-1">{profile.originSchool}</td></tr>
                    <tr><td className="py-1">11.</td><td className="py-1">Nama Orang Tua</td><td className="py-1"></td><td className="py-1"></td></tr>
                    <tr><td className="py-1"></td><td className="py-1 pl-4">a. Ayah</td><td className="py-1">:</td><td className="py-1">{profile.fatherName}</td></tr>
                    <tr><td className="py-1"></td><td className="py-1 pl-4">b. Ibu</td><td className="py-1">:</td><td className="py-1">{profile.motherName}</td></tr>
                    <tr><td className="py-1">12.</td><td className="py-1">Pekerjaan Orang Tua / Wali</td><td className="py-1">:</td><td className="py-1">{profile.guardianJob}</td></tr>
                </tbody>
            </table>

            <div style={{ position: 'absolute', bottom: '2.5cm', left: '2.5cm', right: '2.5cm' }}>
                <table className="w-full">
                    <tbody>
                        <tr>
                            <td className="align-bottom w-[30%]">
                                <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center overflow-hidden bg-gray-50">
                                    {profile.photoUrl ? (
                                        <img src={profile.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-xs text-gray-400">Pas Foto<br/>3 x 4</div>
                                    )}
                                </div>
                            </td>
                            <td className="w-[30%]"></td>
                            <td className="align-bottom w-[40%] text-left pl-4">
                                <p className="mb-1">{school.district || '.............'}, {formatDate(profile.acceptedDate || new Date().toISOString())}</p>
                                <p className="mb-20">Kepala Sekolah</p>
                                
                                <p className="font-bold underline uppercase">{school.principalName || '.........................'}</p>
                                <p>NIP. {school.principalNip || '.........................'}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- MAIN REPORT TEMPLATE (ACADEMIC) ---
const ReportTemplate = ({ 
    student, 
    school, 
    grades, 
    extras, 
    phase,
    homeroomTeacher,
    academicYear,
    coverConfig,
    tps
}: { 
    student: Student, 
    school: SchoolData, 
    grades: ReportGrade[], 
    extras: ReportExtras, 
    phase: string,
    homeroomTeacher?: User,
    academicYear?: string,
    coverConfig: ReportCoverConfig,
    tps: LearningObjective[]
}) => {
    const fontStyle = { 
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        lineHeight: '1.2'
    };

    let displayYear = "2024/2025";
    let displaySemester = "1 (Ganjil)";
    if (academicYear) {
        const parts = academicYear.replace("Tahun Pelajaran ", "").split(" ");
        if (parts.length >= 1) displayYear = parts[0];
        if (parts.length >= 2) {
            const sem = parts[1];
            displaySemester = sem === "Ganjil" ? "1 (Ganjil)" : "2 (Genap)";
        }
    }

    const generateDescription = (grade: ReportGrade) => {
        if (!grade) return "-";
        
        // INTEGRATION FIX: 
        // Use the global 'tps' list passed to this component to find descriptions.
        // This ensures that even if a TP was created in another class/context, 
        // as long as the ID matches (which it does in the DB), it will print correctly.
        const achievedDesc = tps.filter(tp => grade.achievedTpIds?.includes(tp.id)).map(tp => tp.description);
        const improvementDesc = tps.filter(tp => grade.improvementTpIds?.includes(tp.id)).map(tp => tp.description);
        
        let parts = [];
        if (achievedDesc.length > 0) {
            parts.push(`Menunjukkan penguasaan yang baik dalam: ${achievedDesc.join(", ")}.`);
        }
        if (improvementDesc.length > 0) {
            parts.push(`Perlu bimbingan dalam: ${improvementDesc.join(", ")}.`);
        }
        
        return parts.length > 0 ? parts.join(" ") : "Deskripsi belum tersedia (Input TP diperlukan).";
    };
    
    const getPromotionText = () => {
        if (!extras.promotion || !extras.promotion.status) return null;
        const { status, targetClass } = extras.promotion;
        
        if (status === 'NAIK') return `Naik ke Kelas ${targetClass}`;
        if (status === 'TINGGAL') return `Tinggal di Kelas ${targetClass}`;
        if (status === 'NAIK_PERCOBAAN') return `Naik Percobaan ke Kelas ${targetClass}`;
        if (status === 'TINGGAL_PERCOBAAN') return `Tinggal Percobaan di Kelas ${targetClass}`;
        return '';
    };

    const promoText = getPromotionText();

    // STRICT FILTERING LOGIC (INTEGRATION CHECK):
    // Only show subjects that have:
    // 1. A Final Score > 0 (Number check)
    // 2. AND (At least one TP Achieved OR At least one TP Needs Improvement)
    const subjectsToPrint = SUBJECTS.filter(subject => {
        const grade = grades.find(g => g.subject === subject);
        if (!grade) return false;

        const score = Number(grade.finalScore);
        const hasScore = !isNaN(score) && score > 0;
        
        const hasTps = (grade.achievedTpIds && grade.achievedTpIds.length > 0) || 
                       (grade.improvementTpIds && grade.improvementTpIds.length > 0);
        
        return hasScore && hasTps;
    });

    return (
        <div id={`report-${student.id}`} className="bg-white w-[210mm] min-h-[297mm] text-black text-[11pt] mx-auto shadow-none box-border" style={fontStyle}>
            
            {/* PAGE 1: COVER */}
            <div className="page-break-after">
                <CoverTemplate student={student} coverConfig={coverConfig} school={school} />
            </div>

            <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: '0px', display: 'block' }}></div>

             {/* PAGE 2: SCHOOL IDENTITY */}
             <div className="page-break-after">
                <SchoolIdentityTemplate school={school} />
             </div>

             <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: '0px', display: 'block' }}></div>

            {/* PAGE 3: ACADEMIC GRADES */}
            <div className="w-full min-h-[297mm] p-[1.5cm] relative">
                <div className="flex items-center justify-center border-b-[3px] border-double border-black pb-4 mb-6 gap-4">
                    <div className="flex-shrink-0">
                         {school.logoUrl ? (
                            <img src={school.logoUrl} className="h-24 w-24 object-contain" alt="Logo" />
                        ) : (
                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png" className="h-24 w-auto object-contain" alt="Logo" />
                        )}
                    </div>
                    
                    <div className="text-center flex-grow">
                        <h1 className="text-lg font-bold uppercase tracking-wider leading-tight">{coverConfig.ministryNameLine1}</h1>
                        <h1 className="text-lg font-bold uppercase tracking-wider mb-1 leading-tight">{coverConfig.ministryNameLine2}</h1>
                        <h2 className="text-2xl font-black uppercase leading-tight">{school.name}</h2>
                        <p className="text-sm font-medium italic mt-1">{school.street || school.address}, {school.subDistrict}, {school.district}</p>
                        <p className="text-xs mt-0.5">Website: {school.website || '-'} | Email: {school.email || '-'}</p>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold uppercase underline tracking-wide">LAPORAN HASIL BELAJAR</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                    <table className="w-full">
                        <tbody>
                            <tr><td className="w-32 py-1 align-top">Nama Peserta Didik</td><td className="py-1 align-top font-bold">: {student.name}</td></tr>
                            <tr><td className="py-1 align-top">NISN</td><td className="py-1 align-top">: {student.nisn}</td></tr>
                            <tr><td className="py-1 align-top">Sekolah</td><td className="py-1 align-top">: {school.name}</td></tr>
                            <tr><td className="py-1 align-top">Alamat Sekolah</td><td className="py-1 align-top">: {school.street}</td></tr>
                        </tbody>
                    </table>
                    <table className="w-full">
                        <tbody>
                            <tr><td className="w-24 py-1 align-top">Kelas</td><td className="py-1 align-top">: {student.class}</td></tr>
                            <tr><td className="py-1 align-top">Fase</td><td className="py-1 align-top">: {phase}</td></tr>
                            <tr><td className="py-1 align-top">Semester</td><td className="py-1 align-top">: {displaySemester}</td></tr>
                            <tr><td className="py-1 align-top">Tahun Pelajaran</td><td className="py-1 align-top">: {displayYear}</td></tr>
                        </tbody>
                    </table>
                </div>

                <table className="w-full border-collapse border border-black text-sm mb-4">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-black px-2 py-2 w-10 text-center font-bold">No</th>
                            <th className="border border-black px-3 py-2 text-left font-bold w-1/4">Mata Pelajaran</th>
                            <th className="border border-black px-2 py-2 w-14 text-center font-bold">Nilai Akhir</th>
                            <th className="border border-black px-4 py-2 text-left font-bold">Capaian Kompetensi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectsToPrint.length > 0 ? (
                            subjectsToPrint.map((subject, idx) => {
                                const grade = grades.find(g => g.subject === subject);
                                return (
                                    <tr key={subject}>
                                        <td className="border border-black px-2 py-2 text-center align-top">{idx + 1}</td>
                                        <td className="border border-black px-3 py-2 align-top">{subject}</td>
                                        <td className="border border-black px-2 py-2 text-center align-top font-bold">
                                            {grade ? grade.finalScore : '-'}
                                        </td>
                                        <td className="border border-black px-4 py-2 align-top text-justify">
                                            {grade ? generateDescription(grade) : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="border border-black px-4 py-8 text-center italic text-gray-500">
                                    Belum ada mata pelajaran yang dinilai lengkap (Nilai &gt; 0 DAN TP terisi).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* PAGE 4: EXTRAS & SIGNATURES */}
                <div className="mt-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                             <h4 className="font-bold text-sm mb-2">A. Ketidakhadiran</h4>
                             <table className="w-full border-collapse border border-black text-sm">
                                 <tbody>
                                     <tr><td className="border border-black px-3 py-1 w-2/3">Sakit</td><td className="border border-black px-3 py-1 text-center">{extras.attendance.sakit} hari</td></tr>
                                     <tr><td className="border border-black px-3 py-1">Izin</td><td className="border border-black px-3 py-1 text-center">{extras.attendance.izin} hari</td></tr>
                                     <tr><td className="border border-black px-3 py-1">Tanpa Keterangan</td><td className="border border-black px-3 py-1 text-center">{extras.attendance.alpa} hari</td></tr>
                                 </tbody>
                             </table>
                        </div>

                        <div>
                             <h4 className="font-bold text-sm mb-2">B. Ekstrakurikuler</h4>
                             <table className="w-full border-collapse border border-black text-sm">
                                 <thead>
                                     <tr className="bg-gray-100">
                                         <th className="border border-black px-2 py-1 text-left">Kegiatan</th>
                                         <th className="border border-black px-2 py-1 text-left">Keterangan</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {extras.extracurriculars && extras.extracurriculars.length > 0 ? (
                                         extras.extracurriculars.map((ex, i) => (
                                             <tr key={i}>
                                                 <td className="border border-black px-2 py-1">{ex.name}</td>
                                                 <td className="border border-black px-2 py-1">{ex.description}</td>
                                             </tr>
                                         ))
                                     ) : (
                                         <tr><td colSpan={2} className="border border-black px-2 py-1 text-center">-</td></tr>
                                     )}
                                 </tbody>
                             </table>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-bold text-sm mb-2">C. Catatan Wali Kelas</h4>
                        <div className="border border-black p-4 min-h-[80px] text-sm italic">
                            {extras.teacherNote || "Tetap semangat dalam belajar."}
                        </div>
                    </div>
                    
                    {promoText && (
                        <div className="mt-6">
                             <h4 className="font-bold text-sm mb-2">D. Keterangan Kenaikan Kelas</h4>
                             <div className="border border-black p-4 text-sm font-bold">
                                 {promoText}
                             </div>
                        </div>
                    )}

                    <div className="mt-12 w-full">
                        <table className="w-full text-center">
                            <tbody>
                                <tr>
                                    <td className="w-1/3 align-top">
                                        <p>Mengetahui,</p>
                                        <p className="mb-20">Orang Tua/Wali,</p>
                                        <p>(...........................................)</p>
                                    </td>
                                    <td className="w-1/3 align-top">
                                        <p>Mengetahui,</p>
                                        <p className="mb-20">Kepala Sekolah,</p>
                                        <p className="font-bold underline">{school.principalName}</p>
                                        <p>NIP. {school.principalNip}</p>
                                    </td>
                                    <td className="w-1/3 align-top">
                                        <p>{school.district || '................'}, {extras.date || new Date().toLocaleDateString('id-ID')}</p>
                                        <p className="mb-20">Wali Kelas,</p>
                                        <p className="font-bold underline">{homeroomTeacher?.name || '...........................................'}</p>
                                        <p>NIP. {homeroomTeacher?.username || '.....................'}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: REPORT PRINT ---

export const ReportPrint: React.FC<ReportPrintProps> = ({ 
    mode = 'selection', 
    academicYear = 'Tahun Pelajaran 2025/2026 Ganjil',
    currentSemester = '1',
    previewStudentId,
    title = 'Cetak Rapor',
    actionType = 'download'
}) => {
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [selectedPhase, setSelectedPhase] = useState<'E' | 'F'>(getPhaseFromClass(CLASSES[0]));
    
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [schoolData, setSchoolData] = useState(StorageService.getSchoolData());
    const [coverConfig, setCoverConfig] = useState(StorageService.getCoverConfig());
    const [tps, setTps] = useState<LearningObjective[]>([]);
    
    const [selectedStudentForPreview, setSelectedStudentForPreview] = useState<string | null>(previewStudentId || null);

    // Initial Fetch for all components (Global TPs, School Data)
    useEffect(() => {
        setSchoolData(StorageService.getSchoolData());
        setCoverConfig(StorageService.getCoverConfig());
        // Fetch all TPs. Descriptions for report rely on mapping IDs to these objects.
        // TPs are global in storage, so we fetch all to be safe for matching IDs.
        setTps(StorageService.getTPs()); 
    }, []);

    useEffect(() => {
        const newPhase = getPhaseFromClass(selectedClass);
        setSelectedPhase(newPhase);
    }, [selectedClass]);

    useEffect(() => {
        setStudents(StorageService.getStudents().filter(s => s.class === selectedClass));
    }, [selectedClass]);

    useEffect(() => {
        if (previewStudentId) {
            setSelectedStudentForPreview(previewStudentId);
            const student = StorageService.getStudents().find(s => s.id === previewStudentId);
            if(student) setSelectedClass(student.class);
        }
    }, [previewStudentId]);

    const handlePrint = (studentId: string) => {
        setLoading(true);
        setSelectedStudentForPreview(studentId);
        
        setTimeout(() => {
            const element = document.getElementById(`report-${studentId}`);
            if (element && typeof html2pdf !== 'undefined') {
                const student = students.find(s => s.id === studentId);
                const opt = {
                    margin: 0,
                    filename: `Rapor_${student?.name}_${academicYear}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                
                html2pdf().set(opt).from(element).save().then(() => {
                    setLoading(false);
                    if (mode !== 'preview') setSelectedStudentForPreview(null);
                });
            } else {
                alert("Library PDF belum siap atau elemen tidak ditemukan.");
                setLoading(false);
            }
        }, 1000); // 1s wait to ensure TPs and images load
    };

    const handlePrintPreview = (studentId: string) => {
        setLoading(true);
        setSelectedStudentForPreview(studentId);
        
        // Wait for DOM to render the hidden report (ensure TPs are loaded)
        setTimeout(() => {
            const reportContent = document.getElementById(`report-${studentId}`);
            if (reportContent) {
                const printWindow = window.open('', '', 'width=800,height=600');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Cetak Preview Raport - ${students.find(s => s.id === studentId)?.name}</title>
                                <script src="https://cdn.tailwindcss.com"></script>
                                <style>
                                    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                                    @page { size: A4; margin: 0; }
                                    body { 
                                        margin: 0; 
                                        padding: 0; 
                                        background: white; 
                                        font-family: 'Times New Roman', serif;
                                    }
                                    .page-break-after { page-break-after: always; }
                                </style>
                            </head>
                            <body>
                                ${reportContent.innerHTML}
                                <script>
                                    // Auto print after a moment
                                    setTimeout(() => {
                                        window.print();
                                        // Optional: window.close() after print. Kept open for review.
                                    }, 1000);
                                </script>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            } else {
                alert("Gagal memuat preview. Silakan coba lagi.");
            }
            setLoading(false);
            if (mode !== 'preview') setSelectedStudentForPreview(null);
        }, 1500); // Longer wait for preview to ensure descriptions generate
    };

    const getStudentReportData = (studentId: string) => {
        const student = StorageService.getStudents().find(s => s.id === studentId);
        if (!student) return null;
        
        const parts = academicYear.replace("Tahun Pelajaran ", "").split(" ");
        const shortYear = parts[0]; 

        // Fix: getReportGrades with empty subject now returns ALL grades due to storage update
        const grades = StorageService.getReportGrades("", currentSemester, shortYear).filter(g => g.studentId === studentId);
        const extras = StorageService.getReportExtras(studentId, shortYear);
        const homeroomTeacher = StorageService.getHomeroomTeacher(student.class);
        const phase = selectedPhase;

        return { student, grades, extras, homeroomTeacher, phase };
    };

    return (
        <div className="space-y-6">
            {/* HIDDEN CONTAINER FOR PDF GENERATION AND PRINT PREVIEW CAPTURE */}
            {(loading || selectedStudentForPreview) && (
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
                    {(() => {
                         const idToRender = selectedStudentForPreview;
                         if(!idToRender) return null;

                         const data = getStudentReportData(idToRender);
                         if(!data) return null;
                         return (
                            <ReportTemplate 
                                student={data.student}
                                school={schoolData}
                                grades={data.grades}
                                extras={data.extras}
                                phase={data.phase}
                                homeroomTeacher={data.homeroomTeacher}
                                academicYear={academicYear}
                                coverConfig={coverConfig}
                                tps={tps}
                            />
                         );
                    })()}
                </div>
            )}
            
            {loading && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="font-medium">Sedang memproses...</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Printer className="w-6 h-6 text-blue-600" />
                    {title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Pilih siswa untuk mencetak atau melihat rapor.</p>
                </div>
                
                <div className="flex gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Kelas</label>
                        <select 
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                        >
                            {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Fase</label>
                        <select 
                            value={selectedPhase}
                            onChange={(e) => setSelectedPhase(e.target.value as 'E' | 'F')}
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                        >
                            <option value="E">Fase E</option>
                            <option value="F">Fase F</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">NISN</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Siswa</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length > 0 ? students.map(s => (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{s.nisn}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {actionType === 'download' ? (
                                        <button 
                                            onClick={() => handlePrint(s.id)}
                                            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            <FileDown className="w-4 h-4" /> Unduh PDF
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handlePrintPreview(s.id)}
                                            className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-100 transition-colors"
                                        >
                                            <Printer className="w-4 h-4" /> Cetak Preview Raport
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    Tidak ada data siswa ditemukan untuk kelas ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};