
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { CLASSES, getPhaseFromClass, Student } from '../types';
import { Archive, Search, FileText, Layers, Calendar, Printer } from 'lucide-react';
import { ReportPrint } from './ReportPrint';

export const ReportBank: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState<string>('2025/2026');
    const [selectedSemester, setSelectedSemester] = useState<string>('2'); // 1=Ganjil, 2=Genap
    const [selectedClass, setSelectedClass] = useState<string>(CLASSES[0]);
    const [selectedPhase, setSelectedPhase] = useState<'E' | 'F'>('E');
    const [students, setStudents] = useState<Student[]>([]);
    
    // State to handle viewing/printing a report
    const [viewingStudent, setViewingStudent] = useState<string | null>(null);

    // Generate 30 Years of Academic Years starting 2025
    const yearOptions = [];
    const startYear = 2025;
    for (let i = 0; i < 30; i++) {
        const current = startYear + i;
        const next = current + 1;
        yearOptions.push(`${current}/${next}`);
    }

    // Auto-update Phase when class changes
    useEffect(() => {
        setSelectedPhase(getPhaseFromClass(selectedClass));
    }, [selectedClass]);

    // Fetch Students (Note: Students are persistent, grades are what change by year)
    useEffect(() => {
        // In a real app, you might fetch "Students enrolled in Class X during Year Y"
        // For this demo, we assume the student list is current, but we will fetch their *grades* from the archive
        const allStudents = StorageService.getStudents();
        setStudents(allStudents.filter(s => s.class === selectedClass));
    }, [selectedClass]);

    const handleViewReport = (studentId: string) => {
        setViewingStudent(studentId);
    };

    const handleCloseView = () => {
        setViewingStudent(null);
    };

    // Construct full academic year string for ReportPrint component
    const academicYearString = `Tahun Pelajaran ${selectedYear} ${selectedSemester === '1' ? 'Ganjil' : 'Genap'}`;

    return (
        <div className="space-y-6">
            {/* Modal for Viewing Report */}
            {viewingStudent && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-900 p-4 flex justify-between items-center text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <Archive className="w-5 h-5 text-yellow-400" />
                            <div>
                                <h3 className="font-bold text-lg">Arsip Rapor</h3>
                                <p className="text-xs text-slate-400">{academicYearString}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleCloseView}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
                        >
                            Tutup Preview
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                        <div className="bg-white shadow-2xl">
                             {/* Reuse ReportPrint component in Preview Mode, but inject specific context */}
                             <ReportPrint 
                                mode="selection" // Renders the list normally, but we are hacking it to show PDF button
                                academicYear={academicYearString} 
                                currentSemester={selectedSemester} 
                                actionType="preview"
                                title={`Arsip Rapor ${selectedYear}`}
                            />
                            {/* 
                                Note: ReportPrint by default renders a LIST of students. 
                                Since we want to view a SPECIFIC student immediately, we can use the "Preview" logic 
                                or simply let the user click "Print Preview" from the list inside the modal 
                                (which is filtered to the class anyway).
                                
                                A better UX for "Bank" might be to render the ReportTemplate directly here, 
                                but ReportPrint handles data fetching logic.
                            */}
                            
                            <div className="p-8 text-center bg-yellow-50 border border-yellow-200 m-4 rounded">
                                <p className="font-bold text-yellow-800 mb-2">Mode Arsip Rapor</p>
                                <p className="text-sm text-yellow-700">
                                    Anda sedang melihat data untuk <b>Tahun Pelajaran {selectedYear} Semester {selectedSemester === '1' ? 'Ganjil' : 'Genap'}</b>.
                                    <br/>Silakan klik tombol "Cetak Preview" pada siswa yang diinginkan di bawah ini.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-lg">
                        <Archive className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900">Bank Rapor Siswa</h2>
                        <p className="text-indigo-700 text-sm mt-1">
                            Akses arsip penilaian dan rapor siswa berdasarkan tahun ajaran. 
                            Data tersimpan hingga 30 tahun mendatang (2025 - 2055).
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-500" /> Filter Arsip
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Tahun Pelajaran
                        </label>
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(e.target.value)}
                            className="w-full border p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Semester
                        </label>
                        <select 
                            value={selectedSemester} 
                            onChange={e => setSelectedSemester(e.target.value)}
                            className="w-full border p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="1">Semester 1 (Ganjil)</option>
                            <option value="2">Semester 2 (Genap)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                        <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full border p-2.5 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fase</label>
                        <div className="w-full border p-2.5 rounded text-sm bg-gray-50 text-gray-500 font-medium">
                            Fase {selectedPhase}
                        </div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="font-bold text-gray-700">Daftar Siswa - {selectedClass} ({selectedYear})</h4>
                    <span className="text-xs font-mono bg-white border px-2 py-1 rounded">
                        Total: {students.length}
                    </span>
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
                        {students.length > 0 ? students.map(s => (
                            <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{s.nisn}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button 
                                        onClick={() => handleViewReport(s.id)}
                                        className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                                    >
                                        <FileText className="w-4 h-4" /> Buka Arsip
                                    </button>
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
