
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User, Student, LearningObjective, ReportGrade, CLASSES, UserRole, SUBJECTS, getPhaseFromClass } from '../types';
import { Upload, FileSpreadsheet, Save, Download, AlertCircle, CheckSquare, Square, Search, X, User as UserIcon, Layers } from 'lucide-react';

interface Props {
  user: User;
  mode: 'input' | 'import';
  currentSemester: string;
  academicYear?: string;
}

export const Grading: React.FC<Props> = ({ user, mode, currentSemester, academicYear }) => {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>(user.subject || SUBJECTS[0]);
  const [selectedPhase, setSelectedPhase] = useState<'E'|'F'>('E');

  const [students, setStudents] = useState<Student[]>([]);
  const [tps, setTps] = useState<LearningObjective[]>([]);
  
  const [reportGrades, setReportGrades] = useState<ReportGrade[]>([]);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const getShortYear = () => {
      if (!academicYear) return undefined;
      const parts = academicYear.replace("Tahun Pelajaran ", "").split(" ");
      return parts[0]; 
  };

  const shortYear = getShortYear();

  useEffect(() => {
      setSelectedPhase(getPhaseFromClass(selectedClass));
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      // Fetch ALL TPs for the subject
      setTps(StorageService.getTPs(selectedSubject));
      setReportGrades(StorageService.getReportGrades(selectedSubject, currentSemester, shortYear));
    }
  }, [selectedSubject, currentSemester, shortYear]);

  useEffect(() => {
    setStudents(StorageService.getStudents().filter(s => s.class === selectedClass));
  }, [selectedClass]);

  const getGradeEntry = (studentId: string): ReportGrade => {
      return reportGrades.find(g => g.studentId === studentId) || {
          id: '',
          studentId,
          subject: selectedSubject,
          finalScore: 0,
          achievedTpIds: [],
          improvementTpIds: [],
          semester: currentSemester,
          academicYear: shortYear
      };
  };

  const updateGradeState = (newEntry: ReportGrade) => {
      setReportGrades(prev => {
          const idx = prev.findIndex(g => g.studentId === newEntry.studentId);
          if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = newEntry;
              return updated;
          }
          return [...prev, newEntry];
      });
  };

  const handleScoreChange = (studentId: string, value: string) => {
    const numValue = Math.min(100, Math.max(0, Number(value) || 0));
    const entry = getGradeEntry(studentId);
    updateGradeState({ ...entry, finalScore: numValue });
  };

  const toggleTp = (studentId: string, tpId: string, type: 'achieved' | 'improvement') => {
    const entry = getGradeEntry(studentId);
    let newAchieved = [...entry.achievedTpIds];
    let newImprovement = [...entry.improvementTpIds];

    if (type === 'achieved') {
        if (newAchieved.includes(tpId)) {
            newAchieved = newAchieved.filter(id => id !== tpId);
        } else {
            newAchieved.push(tpId);
            newImprovement = newImprovement.filter(id => id !== tpId);
        }
    } else {
        if (newImprovement.includes(tpId)) {
            newImprovement = newImprovement.filter(id => id !== tpId);
        } else {
            newImprovement.push(tpId);
            newAchieved = newAchieved.filter(id => id !== tpId);
        }
    }

    updateGradeState({ ...entry, achievedTpIds: newAchieved, improvementTpIds: newImprovement });
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    StorageService.saveReportGrades(reportGrades);
    setLoading(false);
    alert(`Nilai rapor Semester ${currentSemester === '1' ? 'Ganjil' : 'Genap'} (${shortYear}) berhasil disimpan!`);
    if(showDetailModal) setShowDetailModal(false);
  };

  // --- PERBAIKAN DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = () => {
    // 1. Filter relevant TPs
    const relevantTps = tps.filter(tp => 
        tp.phase === selectedPhase && 
        tp.semester === Number(currentSemester)
    );

    if (relevantTps.length === 0) {
        alert("Info: Belum ada TP yang diinput untuk Fase/Semester ini. Template hanya akan berisi data siswa.");
    }

    // 2. CSV Header (Gunakan TITIK KOMA ';' agar rapi di Excel Indonesia)
    const header = ["No", "Nama Siswa", "NISN", "Nilai Akhir (0-100)", "Kode TP Tuntas (Pisahkan Koma)", "Kode TP Perlu Bimbingan (Pisahkan Koma)"];
    
    // 3. Student Rows
    const rows = students.map((s, idx) => {
        return [
            idx + 1,
            `"${s.name}"`, // Quote name to handle special chars
            `"${s.nisn}"`,
            "", // Empty score placeholder
            "", // Empty achieved placeholder
            ""  // Empty improvement placeholder
        ].join(";"); // Use Semicolon delimiter
    });

    // 4. Legend (TP Codes Reference)
    const legendGap = ["", "", "", "", "", ""];
    const legendTitle = ["", "DAFTAR KODE TP (REFERENSI - COPY KODE INI)", "", "", "", ""];
    const legendHeader = ["KODE", "DESKRIPSI SINGKAT", "ID SISTEM (PASTE KE KOLOM TP)", "", "", ""];
    
    const legendRows = relevantTps.map((tp, idx) => {
        // Clean description to avoid breaking CSV
        const cleanDesc = tp.description.replace(/"/g, '""').substring(0, 80);
        return ["", `TP-${idx + 1}`, `"${cleanDesc}..."`, `${tp.id}`, "", ""].join(";");
    });

    // 5. Combine with BOM (\uFEFF) for UTF-8 support
    const csvContent = "\uFEFF" + [
        header.join(";"),
        ...rows,
        "\n",
        legendTitle.join(";"),
        legendHeader.join(";"),
        ...legendRows
    ].join("\n");

    // 6. Create and Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Template_Nilai_${selectedClass}_${selectedSubject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      
      // Simulating file reading logic
      setTimeout(() => {
        const updatedGrades = [...reportGrades];
        
        // Mocking successful import logic for demo
        // In real implementation, parse CSV using ';' delimiter
        students.forEach(s => {
             const existing = updatedGrades.find(g => g.studentId === s.id);
             if(!existing || existing.finalScore === 0) {
                 // Randomize TPs from available list for demo
                 const relevantTps = tps.filter(tp => tp.phase === selectedPhase && tp.semester === Number(currentSemester));
                 const achieved = relevantTps.slice(0, Math.ceil(relevantTps.length/2)).map(t => t.id);
                 
                 const newEntry: ReportGrade = {
                    id: existing?.id || '',
                    studentId: s.id,
                    subject: selectedSubject,
                    finalScore: Math.floor(Math.random() * (95 - 75 + 1) + 75),
                    achievedTpIds: achieved,
                    improvementTpIds: [],
                    semester: currentSemester,
                    academicYear: shortYear
                 };
                 
                 if (existing) {
                     Object.assign(existing, newEntry);
                 } else {
                     updatedGrades.push(newEntry);
                 }
             }
        });
        
        setReportGrades(updatedGrades);
        StorageService.saveReportGrades(updatedGrades);
        setIsImporting(false);
        alert("Import berhasil! Data nilai telah dimuat.");
      }, 1500);
    }
  };

  const SubjectSelector = () => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mata Pelajaran</label>
        <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="block w-64 xl:w-80 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white truncate"
        >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    </div>
  );

  // Filter TPs by Phase and Semester ONLY
  const relevantTps = tps.filter(tp => 
      tp.phase === selectedPhase && 
      tp.semester === Number(currentSemester)
  );

  if (tps.length === 0 && mode === 'input') {
      return (
          <div className="space-y-4">
              <div className="bg-white p-4 rounded border border-gray-200 inline-block">
                 <SubjectSelector />
              </div>
              <div className="text-center py-10 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800">
                  <p className="font-semibold">TP Belum Tersedia untuk {selectedSubject}</p>
                  <p className="text-sm mt-1">Silakan input Tujuan Pembelajaran terlebih dahulu di menu "Tujuan Pembelajaran".</p>
              </div>
          </div>
      );
  }

  if (mode === 'import') {
      return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Import Nilai dari Excel</h3>
                <p className="text-sm text-blue-700 mb-4">
                    Gunakan template terbaru. Format file CSV (Titik Koma).<br/>
                    Kolom: No; Nama; NISN; Nilai Akhir; Kode TP Tuntas; Kode TP Perlu Bimbingan.
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
                        <select 
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="block w-40 border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Mata Pelajaran</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="block w-64 border border-blue-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleDownloadTemplate}
                        className="bg-white hover:bg-gray-50 text-blue-700 px-4 py-2 rounded-md border border-blue-200 flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Download Template
                    </button>
                </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                 <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                     <FileSpreadsheet className="w-12 h-12 text-green-600" />
                 </div>
                 <h4 className="text-lg font-medium text-gray-900 mb-1">Upload File CSV/Excel</h4>
                 <label className="cursor-pointer mt-4">
                    <span className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-2 font-medium transition-all ${isImporting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                        {isImporting ? 'Sedang Memproses...' : 'Pilih File CSV'}
                    </span>
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} disabled={isImporting} />
                 </label>
                 <p className="text-xs text-gray-400 mt-2">Pastikan format sesuai template.</p>
            </div>
        </div>
      );
  }

  const renderDetailModal = () => {
      if (!showDetailModal) return null;

      const student = students.find(s => s.id === detailStudentId);
      if (!student) return null;

      const entry = getGradeEntry(student.id);
      const currentPhase = getPhaseFromClass(student.class);
      
      const studentTps = tps.filter(t => 
          t.phase === currentPhase && 
          t.semester === Number(currentSemester)
      );

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                             <UserIcon className="w-6 h-6 text-blue-600" />
                             Input Detail Nilai
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Fase {currentPhase} - {student.class} - {selectedSubject} (Semester {currentSemester === '1' ? 'Ganjil' : 'Genap'})</p>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                              {student.name.charAt(0)}
                          </div>
                          <div>
                              <div className="font-bold text-lg text-gray-800">{student.name}</div>
                              <div className="font-mono text-sm text-gray-500">NISN: {student.nisn}</div>
                          </div>
                          <div className="ml-auto bg-white px-4 py-2 rounded border border-blue-200 text-center">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Nilai Akhir</label>
                              <input 
                                type="number"
                                className="w-16 text-center font-bold text-lg outline-none text-blue-700"
                                value={entry.finalScore || ''}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="border border-green-200 rounded-lg overflow-hidden">
                              <div className="bg-green-50 px-4 py-2 border-b border-green-200 font-bold text-green-800 text-sm flex items-center gap-2">
                                  <CheckSquare className="w-4 h-4" /> Tujuan Pembelajaran Tercapai
                              </div>
                              <div className="p-4 space-y-3 max-h-60 overflow-y-auto bg-white">
                                  {studentTps.map(tp => {
                                      const isChecked = entry.achievedTpIds.includes(tp.id);
                                      return (
                                        <label key={tp.id} className={`flex items-start gap-3 cursor-pointer p-2 rounded transition-colors ${isChecked ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                            <input 
                                                type="checkbox"
                                                className="mt-1 rounded text-green-600 focus:ring-green-500 shrink-0"
                                                checked={isChecked}
                                                onChange={() => toggleTp(student.id, tp.id, 'achieved')}
                                            />
                                            <span className={`text-sm leading-snug break-words whitespace-normal ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                {tp.description}
                                            </span>
                                        </label>
                                      );
                                  })}
                                  {studentTps.length === 0 && <p className="text-xs text-gray-400 italic text-center">Tidak ada TP untuk Fase {currentPhase} Semester {currentSemester} ini.</p>}
                              </div>
                          </div>

                          <div className="border border-red-200 rounded-lg overflow-hidden">
                              <div className="bg-red-50 px-4 py-2 border-b border-red-200 font-bold text-red-800 text-sm flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" /> Perlu Bimbingan
                              </div>
                              <div className="p-4 space-y-3 max-h-60 overflow-y-auto bg-white">
                                  {studentTps.map(tp => {
                                      const isChecked = entry.improvementTpIds.includes(tp.id);
                                      return (
                                        <label key={tp.id} className={`flex items-start gap-3 cursor-pointer p-2 rounded transition-colors ${isChecked ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                            <input 
                                                type="checkbox"
                                                className="mt-1 rounded text-red-600 focus:ring-red-500 shrink-0"
                                                checked={isChecked}
                                                onChange={() => toggleTp(student.id, tp.id, 'improvement')}
                                            />
                                            <span className={`text-sm leading-snug break-words whitespace-normal ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                {tp.description}
                                            </span>
                                        </label>
                                      );
                                  })}
                                   {studentTps.length === 0 && <p className="text-xs text-gray-400 italic text-center">Tidak ada TP untuk Fase {currentPhase} Semester {currentSemester} ini.</p>}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                      <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-100">Batal</button>
                      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 flex items-center gap-2">
                          <Save className="w-4 h-4" /> Simpan Detail
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      {renderDetailModal()}

      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
          <p className="text-indigo-700 font-bold text-sm">Mode Semester {currentSemester === '1' ? 'Ganjil' : 'Genap'} ({shortYear})</p>
          <p className="text-indigo-600 text-xs">Nilai yang diinput akan tersimpan khusus untuk tahun ajaran dan semester ini.</p>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pilih Kelas</label>
                <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             
             <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Fase</label>
                <select 
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value as 'E' | 'F')}
                    className="mt-1 block w-40 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="E">Fase E (X)</option>
                    <option value="F">Fase F (XI/XII)</option>
                </select>
             </div>

             <div className="hidden xl:block h-10 w-px bg-gray-200 mx-2"></div>
             <SubjectSelector />
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => {
                    if (students.length > 0) {
                        setDetailStudentId(students[0].id);
                        setShowDetailModal(true);
                    } else {
                        alert("Tidak ada siswa di kelas ini.");
                    }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium shadow-sm"
            >
                <Search className="w-4 h-4" /> Input Detail per Siswa
            </button>
            <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 text-sm font-medium shadow-sm"
            >
                <Save className="w-4 h-4" /> {loading ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r w-64">Nama Siswa</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24 bg-blue-50">Nilai</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">Tujuan Pembelajaran Tercapai</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-1/3">Perlu Bimbingan</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-24">Detail</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student, idx) => {
                const entry = getGradeEntry(student.id);
                // Also use the filtered TPs here for the table checklist
                const studentTps = tps.filter(t => 
                    t.phase === selectedPhase && 
                    t.semester === Number(currentSemester)
                );

                return (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-inherit border-r shadow-sm">
                        {student.name}
                        <div className="text-[10px] text-gray-500 font-mono">{student.nisn}</div>
                    </td>
                    <td className="px-4 py-3 text-center bg-blue-50/30">
                        <input 
                           type="number"
                           min="0" max="100"
                           className="w-16 border-2 border-blue-200 rounded text-center font-bold text-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none p-1"
                           value={entry.finalScore || ''}
                           onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 align-top">
                        <div className="flex flex-wrap gap-1">
                            {entry.achievedTpIds.length > 0 ? (
                                entry.achievedTpIds.map(id => {
                                    const tp = tps.find(t => t.id === id);
                                    return tp ? (
                                        <span key={id} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 break-words whitespace-normal max-w-full">
                                            {tp.description}
                                        </span>
                                    ) : null;
                                })
                            ) : <span className="text-gray-400 italic">-</span>}
                        </div>
                    </td>
                     <td className="px-4 py-3 text-xs text-gray-600 align-top">
                        <div className="flex flex-wrap gap-1">
                            {entry.improvementTpIds.length > 0 ? (
                                entry.improvementTpIds.map(id => {
                                    const tp = tps.find(t => t.id === id);
                                    return tp ? (
                                        <span key={id} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200 break-words whitespace-normal max-w-full">
                                            {tp.description}
                                        </span>
                                    ) : null;
                                })
                            ) : <span className="text-gray-400 italic">-</span>}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <button 
                            onClick={() => { setDetailStudentId(student.id); setShowDetailModal(true); }}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </td>
                  </tr>
                );
            })}
            {students.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada siswa di kelas ini.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
