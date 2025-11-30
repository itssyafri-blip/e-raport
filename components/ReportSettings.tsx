
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { SchoolData, ReportCoverConfig, Student, StudentProfile, CLASSES } from '../types';
import { Save, BookOpen, Building2, User, Printer, Upload, Image as ImageIcon, FileDown, Loader2 } from 'lucide-react';
import { CoverTemplate, SchoolIdentityTemplate, StudentIdentityTemplate } from './ReportPrint';

// REMOVED: declare var html2pdf: any; (Defined globally in vite-env.d.ts)

export const ReportSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'cover' | 'profile' | 'student'>('cover');
    const [schoolData, setSchoolData] = useState<SchoolData>(StorageService.getSchoolData());
    const [coverConfig, setCoverConfig] = useState<ReportCoverConfig>(StorageService.getCoverConfig());
    
    // State for Student Bio Tab
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

    const [message, setMessage] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadType, setDownloadType] = useState<'cover'|'school'|'student'|null>(null);

    useEffect(() => {
        setSchoolData(StorageService.getSchoolData());
        setCoverConfig(StorageService.getCoverConfig());
        setStudents(StorageService.getStudents().filter(s => s.class === selectedClass));
    }, [selectedClass]);

    useEffect(() => {
        if (selectedStudentId) {
            const profile = StorageService.getStudentProfile(selectedStudentId);
            const student = students.find(s => s.id === selectedStudentId);
            // Sync NISN if available
            if (student && !profile.nisn) profile.nisn = student.nisn;
            setStudentProfile(profile);
        } else {
            setStudentProfile(null);
        }
    }, [selectedStudentId, students]);

    const handleSave = () => {
        StorageService.saveSchoolData(schoolData);
        StorageService.saveCoverConfig(coverConfig);
        
        if (studentProfile) {
            StorageService.saveStudentProfile(studentProfile);
        }

        setMessage('Pengaturan berhasil disimpan.');
        setTimeout(() => setMessage(''), 3000);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && studentProfile) {
          if (file.size > 500000) { 
            alert("Ukuran file terlalu besar (Max 500KB)");
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setStudentProfile({ ...studentProfile, photoUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
        }
    };

    const handleDownload = (type: 'cover' | 'school' | 'student') => {
        if (type === 'student' && !selectedStudentId) {
            alert("Silakan pilih siswa terlebih dahulu.");
            return;
        }

        // Save before download to ensure WYSIWYG
        if (type === 'student' && studentProfile) StorageService.saveStudentProfile(studentProfile);
        StorageService.saveSchoolData(schoolData);
        StorageService.saveCoverConfig(coverConfig);

        setDownloadType(type);
        setIsDownloading(true);

        setTimeout(() => {
            let elementId = '';
            let filename = '';
            let format = 'a4'; // Default
            let dimensions = null;

            if (type === 'cover') {
                elementId = 'hidden-cover-container';
                filename = 'Cover_Rapor.pdf';
            } else if (type === 'school') {
                elementId = 'hidden-school-container';
                filename = 'Identitas_Sekolah.pdf';
            } else if (type === 'student') {
                elementId = 'hidden-student-container';
                const studentName = students.find(s => s.id === selectedStudentId)?.name || 'Siswa';
                filename = `Biodata_${studentName.replace(/\s+/g, '_')}.pdf`;
                // Legal Size Config for HTML2PDF
                format = 'legal';
                // HTML2PDF doesn't support custom dimensions via string '215mm 330mm' easily in all versions,
                // but we can try to rely on the CSS of the container. 
                // However, for consistency, we often stick to standard formats.
                // Let's try to pass the dimensions if the library supports unit array
                dimensions = [215, 330]; 
            }

            const element = document.getElementById(elementId);
            if (element && typeof html2pdf !== 'undefined') {
                const opt: any = {
                    margin: 0,
                    filename: filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: dimensions ? dimensions : format, orientation: 'portrait' }
                };
                
                html2pdf().set(opt).from(element).save().then(() => {
                    setIsDownloading(false);
                    setDownloadType(null);
                });
            } else {
                alert("Gagal mengunduh. Library PDF belum siap.");
                setIsDownloading(false);
                setDownloadType(null);
            }
        }, 500);
    };

    return (
        <div className="space-y-6">
            {/* HIDDEN CONTAINERS FOR PDF GENERATION */}
            <div style={{ position: 'fixed', zIndex: -50, top: 0, left: 0, opacity: 0, pointerEvents: 'none' }}>
                <div id="hidden-cover-container">
                    <CoverTemplate coverConfig={coverConfig} school={schoolData} />
                </div>
                <div id="hidden-school-container">
                     <SchoolIdentityTemplate school={schoolData} />
                </div>
                {selectedStudentId && studentProfile && (
                     <div id="hidden-student-container">
                         <StudentIdentityTemplate 
                            profile={studentProfile} 
                            student={students.find(s => s.id === selectedStudentId)!} 
                            school={schoolData} 
                         />
                     </div>
                )}
            </div>

            {isDownloading && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="font-medium">Sedang mengunduh PDF...</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Printer className="w-6 h-6 text-blue-600" />
                    Atur Data Rapor
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Konfigurasi Halaman Depan, Identitas Sekolah, dan Biodata Siswa untuk Rapor.</p>
                </div>
                <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2 rounded shadow text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                    <Save className="w-4 h-4" /> Simpan Semua
                </button>
            </div>

            {message && (
                 <div className="bg-emerald-50 text-emerald-700 p-4 rounded border-l-4 border-emerald-500 text-sm">{message}</div>
            )}

            {/* TABS */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('cover')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'cover'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <BookOpen className="w-4 h-4 inline-block mr-2" />
                        Halaman Sampul (Cover)
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'profile'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Building2 className="w-4 h-4 inline-block mr-2" />
                        Identitas Sekolah
                    </button>
                    <button
                        onClick={() => setActiveTab('student')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'student'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <User className="w-4 h-4 inline-block mr-2" />
                        Data Diri Siswa (Biodata)
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[400px]">
                
                {/* 1. COVER CONFIG */}
                {activeTab === 'cover' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                             <h4 className="font-bold text-gray-800">Konten Halaman Sampul</h4>
                             <button onClick={() => handleDownload('cover')} className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                                 <FileDown className="w-4 h-4" /> Unduh PDF
                             </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kementerian (Baris 1)</label>
                                <input className="w-full border p-2 rounded text-sm" value={coverConfig.ministryNameLine1} onChange={e => setCoverConfig({...coverConfig, ministryNameLine1: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Kementerian (Baris 2)</label>
                                <input className="w-full border p-2 rounded text-sm" value={coverConfig.ministryNameLine2} onChange={e => setCoverConfig({...coverConfig, ministryNameLine2: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Laporan</label>
                                <input className="w-full border p-2 rounded text-sm" value={coverConfig.reportTitle} onChange={e => setCoverConfig({...coverConfig, reportTitle: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sub Judul</label>
                                <input className="w-full border p-2 rounded text-sm" value={coverConfig.subTitle} onChange={e => setCoverConfig({...coverConfig, subTitle: e.target.value})} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SCHOOL IDENTITY */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                             <h4 className="font-bold text-gray-800">Detail Alamat Sekolah (Untuk Halaman Identitas)</h4>
                             <button onClick={() => handleDownload('school')} className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
                                 <FileDown className="w-4 h-4" /> Unduh PDF
                             </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jalan / Alamat</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.street} onChange={e => setSchoolData({...schoolData, street: e.target.value})} placeholder="Jl. Raya..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelurahan / Desa</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.village} onChange={e => setSchoolData({...schoolData, village: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kecamatan</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.subDistrict} onChange={e => setSchoolData({...schoolData, subDistrict: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kabupaten / Kota</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.district} onChange={e => setSchoolData({...schoolData, district: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Provinsi</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.province} onChange={e => setSchoolData({...schoolData, province: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kode Pos</label>
                                <input className="w-full border p-2 rounded text-sm" value={schoolData.postalCode} onChange={e => setSchoolData({...schoolData, postalCode: e.target.value})} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. STUDENT IDENTITY */}
                {activeTab === 'student' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                             <div className="flex gap-4 items-center">
                                 <div>
                                     <label className="block text-[10px] font-bold text-gray-500 uppercase">Pilih Kelas</label>
                                     <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded text-sm">
                                         {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-gray-500 uppercase">Pilih Siswa</label>
                                     <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="border p-2 rounded text-sm min-w-[200px]">
                                         <option value="">-- Pilih Siswa --</option>
                                         {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                     </select>
                                 </div>
                             </div>
                             
                             <div className="flex gap-2">
                                 <button onClick={() => handleDownload('student')} disabled={!selectedStudentId} className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50">
                                     <FileDown className="w-4 h-4" /> Unduh PDF
                                 </button>
                             </div>
                        </div>

                        {selectedStudentId && studentProfile ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Bio Data */}
                                <div className="space-y-4">
                                     <h5 className="font-bold text-blue-800 text-sm border-b pb-1">Data Pribadi</h5>
                                     <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="lbl">Nama Lengkap</label>
                                            <div className="txt-display">{students.find(s => s.id === selectedStudentId)?.name}</div>
                                        </div>
                                        <div>
                                            <label className="lbl">NIS</label>
                                            <input className="inp" value={studentProfile.nis} onChange={e => setStudentProfile({...studentProfile, nis: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">NISN</label>
                                            <div className="txt-display">{studentProfile.nisn}</div>
                                        </div>
                                        <div>
                                            <label className="lbl">Tempat Lahir</label>
                                            <input className="inp" value={studentProfile.birthPlace} onChange={e => setStudentProfile({...studentProfile, birthPlace: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">Tanggal Lahir</label>
                                            <input type="date" className="inp" value={studentProfile.birthDate} onChange={e => setStudentProfile({...studentProfile, birthDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">Jenis Kelamin</label>
                                            <select className="inp" value={studentProfile.gender} onChange={e => setStudentProfile({...studentProfile, gender: e.target.value as any})}>
                                                <option value="Laki-laki">Laki-laki</option>
                                                <option value="Perempuan">Perempuan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="lbl">Agama</label>
                                            <select className="inp" value={studentProfile.religion} onChange={e => setStudentProfile({...studentProfile, religion: e.target.value})}>
                                                <option value="Islam">Islam</option>
                                                <option value="Kristen">Kristen</option>
                                                <option value="Katolik">Katolik</option>
                                                <option value="Hindu">Hindu</option>
                                                <option value="Buddha">Buddha</option>
                                                <option value="Khonghucu">Khonghucu</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="lbl">Status Keluarga</label>
                                            <input className="inp" value={studentProfile.familyStatus} onChange={e => setStudentProfile({...studentProfile, familyStatus: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">Anak Ke</label>
                                            <input className="inp" value={studentProfile.childOrder} onChange={e => setStudentProfile({...studentProfile, childOrder: e.target.value})} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="lbl">Alamat Peserta Didik</label>
                                            <textarea className="inp h-16" value={studentProfile.address} onChange={e => setStudentProfile({...studentProfile, address: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">No. Telepon</label>
                                            <input className="inp" value={studentProfile.phone} onChange={e => setStudentProfile({...studentProfile, phone: e.target.value})} />
                                        </div>
                                     </div>
                                </div>

                                {/* Academic & Parents */}
                                <div className="space-y-4">
                                     <h5 className="font-bold text-blue-800 text-sm border-b pb-1">Data Akademik & Orang Tua</h5>
                                     <div className="grid grid-cols-2 gap-3">
                                         <div className="col-span-2">
                                            <label className="lbl">Sekolah Asal</label>
                                            <input className="inp" value={studentProfile.originSchool} onChange={e => setStudentProfile({...studentProfile, originSchool: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">Diterima di Kelas</label>
                                            <select className="inp" value={studentProfile.acceptedClass} onChange={e => setStudentProfile({...studentProfile, acceptedClass: e.target.value})}>
                                                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="lbl">Tanggal Diterima</label>
                                            <input type="date" className="inp" value={studentProfile.acceptedDate} onChange={e => setStudentProfile({...studentProfile, acceptedDate: e.target.value})} />
                                        </div>
                                        <div className="col-span-2 mt-2 border-t pt-2"></div>
                                        <div>
                                            <label className="lbl">Nama Ayah</label>
                                            <input className="inp" value={studentProfile.fatherName} onChange={e => setStudentProfile({...studentProfile, fatherName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="lbl">Nama Ibu</label>
                                            <input className="inp" value={studentProfile.motherName} onChange={e => setStudentProfile({...studentProfile, motherName: e.target.value})} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="lbl">Pekerjaan Wali</label>
                                            <input className="inp" value={studentProfile.guardianJob} onChange={e => setStudentProfile({...studentProfile, guardianJob: e.target.value})} />
                                        </div>
                                        <div className="col-span-2 mt-4">
                                            <label className="lbl mb-2 block">Foto Peserta Didik (3x4)</label>
                                            <div className="flex gap-4 items-center">
                                                <div className="w-24 h-32 border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden rounded">
                                                    {studentProfile.photoUrl ? (
                                                        <img src={studentProfile.photoUrl} className="w-full h-full object-cover" alt="Foto" />
                                                    ) : (
                                                        <span className="text-xs text-gray-400 text-center">No Image</span>
                                                    )}
                                                </div>
                                                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2">
                                                    <Upload className="w-3 h-3" /> Upload Foto
                                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                                </label>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300 text-gray-400 text-sm">
                                Pilih siswa dari menu di atas untuk mengedit data diri.
                            </div>
                        )}
                    </div>
                )}

            </div>
            
            <style>{`
                .lbl { display: block; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 2px; }
                .inp { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 8px; font-size: 14px; outline: none; }
                .inp:focus { border-color: #3b82f6; ring: 1px; }
                .txt-display { padding: 6px 8px; background: #f3f4f6; border-radius: 4px; font-size: 14px; font-weight: 600; color: #374151; }
            `}</style>
        </div>
    );
};
