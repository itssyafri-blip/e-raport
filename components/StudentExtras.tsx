import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Student, CLASSES, ReportExtras, User } from '../types';
import { Save, Plus, Trash, User as UserIcon, Calendar, CheckSquare, Search, AlertTriangle, X, Layers } from 'lucide-react';

interface Props {
    user: User;
    currentSemester: string; // '1' or '2'
    academicYear: string;
}

export const StudentExtras: React.FC<Props> = ({ user, currentSemester, academicYear }) => {
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState<ReportExtras | null>(null);
    const [loading, setLoading] = useState(false);

    // Extract "2025/2026" from "Tahun Pelajaran 2025/2026 Ganjil"
    const getShortYear = () => {
        const parts = academicYear.replace("Tahun Pelajaran ", "").split(" ");
        return parts[0]; 
    };

    const shortYear = getShortYear();
    const isSemesterGenap = currentSemester === '2';

    useEffect(() => {
        setStudents(StorageService.getStudents().filter(s => s.class === selectedClass));
    }, [selectedClass]);

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        // Fetch existing extras. If none exist, StorageService now returns a template WITH shortYear injected.
        const extras = StorageService.getReportExtras(student.id, shortYear);
        setFormData(JSON.parse(JSON.stringify(extras))); 
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData || !editingStudent) return;
        setLoading(true);

        // FIX: FORCE the academic year into the data before saving.
        const dataToSave: ReportExtras = {
            ...formData,
            academicYear: shortYear
        };

        StorageService.saveReportExtras(dataToSave);
        
        setTimeout(() => {
            setLoading(false);
            setIsModalOpen(false);
        }, 500);
    };

    const handleAddExtracurricular = () => {
        if (!formData) return;
        setFormData({
            ...formData,
            extracurriculars: [...formData.extracurriculars, { name: '', description: '' }]
        });
    };

    const handleRemoveExtracurricular = (index: number) => {
        if (!formData) return;
        const updated = [...formData.extracurriculars];
        updated.splice(index, 1);
        setFormData({ ...formData, extracurriculars: updated });
    };

    const handleExtracurricularChange = (index: number, field: 'name' | 'description', value: string) => {
        if (!formData) return;
        const updated = [...formData.extracurriculars];
        updated[index][field] = value;
        setFormData({ ...formData, extracurriculars: updated });
    };

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                        Data Lengkap Siswa
                    </h3>
                    <p className="text-sm text-gray-500">Input Absensi, Ekstrakurikuler, Catatan Wali Kelas, dan Kenaikan Kelas.</p>
                </div>
                
                <div className="flex gap-4 items-center">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pilih Kelas</label>
                        <select 
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 bg-white min-w-[150px]"
                        >
                            {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                 <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Cari nama siswa..." 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                 </div>

                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">NISN</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nama Siswa</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase w-40">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.length > 0 ? filteredStudents.map(s => (
                            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{s.nisn}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                        onClick={() => handleEdit(s)}
                                        className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-xs font-bold hover:bg-blue-100 transition-colors shadow-sm"
                                    >
                                        <CheckSquare className="w-4 h-4" /> Kelola Data
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    Tidak ada siswa ditemukan di kelas ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}
            {isModalOpen && formData && editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-blue-600" />
                                    {editingStudent.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{editingStudent.class} | {editingStudent.nisn}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            {/* 1. ATTENDANCE */}
                            <section>
                                <h4 className="font-bold text-blue-800 text-sm uppercase mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Kehadiran (Semester Ini)
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Sakit</label>
                                        <input 
                                            type="number" min="0"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.attendance.sakit}
                                            onChange={e => setFormData({...formData, attendance: {...formData.attendance, sakit: Number(e.target.value)}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Izin</label>
                                        <input 
                                            type="number" min="0"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.attendance.izin}
                                            onChange={e => setFormData({...formData, attendance: {...formData.attendance, izin: Number(e.target.value)}})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tanpa Keterangan</label>
                                        <input 
                                            type="number" min="0"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.attendance.alpa}
                                            onChange={e => setFormData({...formData, attendance: {...formData.attendance, alpa: Number(e.target.value)}})}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* 2. EXTRACURRICULAR */}
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-blue-800 text-sm uppercase flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> Ekstrakurikuler
                                    </h4>
                                    <button onClick={handleAddExtracurricular} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Tambah
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.extracurriculars.map((ex, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="flex-1 space-y-2">
                                                <input 
                                                    placeholder="Nama Kegiatan (contoh: Pramuka)"
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                                    value={ex.name}
                                                    onChange={e => handleExtracurricularChange(idx, 'name', e.target.value)}
                                                />
                                                <input 
                                                    placeholder="Keterangan / Predikat (contoh: Sangat Baik)"
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                                                    value={ex.description}
                                                    onChange={e => handleExtracurricularChange(idx, 'description', e.target.value)}
                                                />
                                            </div>
                                            <button onClick={() => handleRemoveExtracurricular(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.extracurriculars.length === 0 && (
                                        <div className="text-center py-4 text-xs text-gray-400 italic border border-dashed rounded">
                                            Tidak ada kegiatan ekstrakurikuler.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 3. TEACHER NOTE */}
                            <section>
                                <h4 className="font-bold text-blue-800 text-sm uppercase mb-3">Catatan Wali Kelas</h4>
                                <textarea 
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 h-24"
                                    placeholder="Tuliskan catatan untuk motivasi siswa..."
                                    value={formData.teacherNote}
                                    onChange={e => setFormData({...formData, teacherNote: e.target.value})}
                                />
                            </section>

                            {/* 4. PROMOTION (ONLY GENAP) */}
                            {isSemesterGenap ? (
                                <section className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h4 className="font-bold text-yellow-800 text-sm uppercase mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Keputusan Kenaikan Kelas
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Status Keputusan</label>
                                            <select 
                                                className="w-full border border-yellow-300 rounded px-3 py-2 text-sm focus:ring-yellow-500 bg-white"
                                                value={formData.promotion?.status || ''}
                                                onChange={e => setFormData({
                                                    ...formData, 
                                                    promotion: { 
                                                        targetClass: formData.promotion?.targetClass || '', 
                                                        status: e.target.value as any 
                                                    }
                                                })}
                                            >
                                                <option value="">-- Pilih Keputusan --</option>
                                                <option value="NAIK">Naik Kelas</option>
                                                <option value="NAIK_PERTIMBANGAN">Naik (Pertimbangan)</option>
                                                <option value="TINGGAL">Tinggal Kelas</option>
                                                <option value="TINGGAL_PERBAIKAN">Tinggal (Perbaikan)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tujuan Kelas (contoh: XI, XII)</label>
                                            <input 
                                                className="w-full border border-yellow-300 rounded px-3 py-2 text-sm focus:ring-yellow-500"
                                                placeholder="Contoh: XI"
                                                value={formData.promotion?.targetClass || ''}
                                                onChange={e => setFormData({
                                                    ...formData, 
                                                    promotion: { 
                                                        status: formData.promotion?.status || 'NAIK', 
                                                        targetClass: e.target.value 
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <div className="text-xs text-gray-400 italic text-center border-t pt-4">
                                    * Menu Kenaikan Kelas hanya aktif pada Semester Genap.
                                </div>
                            )}

                            {/* 5. TANGGAL & TEMPAT */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tempat (Kota/Kabupaten)</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Contoh: Pulau Banyak Barat"
                                        value={formData.issuePlace || ''}
                                        onChange={e => setFormData({...formData, issuePlace: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Rapor</label>
                                    <input 
                                        type="text"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                        placeholder="Contoh: 20 Desember 2025"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded text-sm hover:bg-gray-100"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};