
import React, { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { User, LearningObjective, UserRole, SUBJECTS, CLASSES } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Plus, Trash2, Sparkles, Loader2, Book, Layers, GraduationCap, CloudUpload, CheckCircle2 } from 'lucide-react';

interface Props {
  user: User;
  currentSemester: number;
}

export const LearningObjectives: React.FC<Props> = ({ user, currentSemester }) => {
  const [tps, setTps] = useState<LearningObjective[]>([]);
  const [newTp, setNewTp] = useState('');
  const [semester, setSemester] = useState(currentSemester);
  const [phase, setPhase] = useState<'E' | 'F'>('E');
  const [targetClass, setTargetClass] = useState<string>(CLASSES[0]);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  
  const [selectedSubject, setSelectedSubject] = useState<string>(user.subject || SUBJECTS[0]);

  useEffect(() => {
      setSemester(currentSemester);
  }, [currentSemester]);

  const loadTPs = () => {
    if (selectedSubject) {
      const allTps = StorageService.getTPs(selectedSubject);
      setTps(allTps);
    }
  };

  useEffect(() => {
    loadTPs();
    const unsubscribe = StorageService.subscribe(STORAGE_KEYS.TPS, loadTPs);
    return unsubscribe;
  }, [selectedSubject, phase, targetClass, semester]);

  const handleAdd = () => {
    if (!newTp.trim() || !selectedSubject) return;
    const objective: LearningObjective = {
      id: '',
      subject: selectedSubject,
      description: newTp,
      semester: semester,
      phase: phase,
      classTarget: targetClass
    };
    StorageService.addTP(objective);
    setNewTp('');
  };

  const handleDelete = (id: string) => {
    StorageService.deleteTP(id);
  };

  const handleManualSync = async () => {
      if (syncStatus === 'uploading') return;
      setSyncStatus('uploading');
      try {
          await StorageService.forcePushToCloud();
          setSyncStatus('success');
          setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (e) {
          console.error(e);
          alert("Gagal sinkronisasi. Cek koneksi internet.");
          setSyncStatus('idle');
      }
  };

  const generateWithGemini = async () => {
    if (!selectedSubject) return;
    
    // PERBAIKAN: Akses environment variable dengan casting 'any' untuk keamanan tipe di Vercel/Vite
    const env = (import.meta as any).env;
    const apiKey = (env?.VITE_API_KEY || '') as string;

    if (!apiKey) {
        alert("API Key tidak ditemukan. Fitur AI tidak dapat digunakan pada demo ini tanpa konfigurasi environment variable VITE_API_KEY.");
        return;
    }

    setLoadingAi(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const prompt = `Buatkan 3 Tujuan Pembelajaran (TP) singkat dan padat untuk mata pelajaran ${selectedSubject} Fase ${phase} (Kelas ${targetClass}) semester ${semester}. Format output JSON array of strings only.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const textResponse = response.text || '[]';
        const generatedTps: string[] = JSON.parse(textResponse);
        
        generatedTps.forEach(desc => {
             const objective: LearningObjective = {
                id: '',
                subject: selectedSubject,
                description: desc,
                semester: semester,
                phase: phase,
                classTarget: targetClass
            };
            StorageService.addTP(objective);
        });
        
    } catch (e) {
        console.error("Gemini Error", e);
        alert("Gagal mengenerate TP. Silakan input manual atau cek kuota API.");
    } finally {
        setLoadingAi(false);
    }
  };

  const displayedTps = tps.filter(t => 
      t.semester === semester && 
      t.phase === phase && 
      t.classTarget === targetClass
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
           <h3 className="text-lg font-semibold text-gray-900">Input Tujuan Pembelajaran (TP)</h3>
           <p className="text-sm text-gray-500">Kelola deskripsi kompetensi dasar Fase {phase}, Kelas {targetClass}, Semester {semester}</p>
        </div>
        
        {/* Cloud Sync Button directly on Page */}
        <button 
            onClick={handleManualSync}
            disabled={syncStatus !== 'idle'}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm shadow-sm transition-all ${
                syncStatus === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
            {syncStatus === 'uploading' ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                </>
            ) : syncStatus === 'success' ? (
                <>
                    <CheckCircle2 className="w-4 h-4" /> TP Terkirim!
                </>
            ) : (
                <>
                    <CloudUpload className="w-4 h-4" /> Kirim TP ke Server Cloud
                </>
            )}
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Book className="w-3 h-3" /> Mata Pelajaran</label>
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Layers className="w-3 h-3" /> Fase</label>
                 <select 
                    value={phase} 
                    onChange={(e) => setPhase(e.target.value as 'E' | 'F')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                 >
                    <option value="E">Fase E (Kelas X)</option>
                    <option value="F">Fase F (Kelas XI/XII)</option>
                 </select>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Target Kelas</label>
                 <select 
                    value={targetClass} 
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                 >
                    {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                 </select>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Semester</label>
                 <select 
                    value={semester} 
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 bg-white"
                >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                </select>
            </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
         <div className="flex flex-col gap-4">
             <label className="text-xs font-bold text-gray-500 uppercase">Deskripsi TP (Tanpa Batas Karakter)</label>
             <textarea 
               className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[100px]"
               placeholder="Tuliskan deskripsi Tujuan Pembelajaran secara lengkap..."
               value={newTp}
               onChange={(e) => setNewTp(e.target.value)}
             />
             <div className="flex gap-3">
                <button 
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                >
                    <Plus className="w-4 h-4" /> Tambah Manual
                </button>
                
                <button 
                    onClick={generateWithGemini}
                    disabled={loadingAi}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-md flex items-center gap-2 font-medium border border-purple-200 disabled:opacity-50"
                >
                    {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate AI
                </button>
             </div>
         </div>
         <p className="text-xs text-gray-500 italic mt-3">
           * TP yang ditambahkan akan tersimpan khusus untuk Mata Pelajaran <b>{selectedSubject}</b>, <b>Fase {phase}</b>, <b>Kelas {targetClass}</b>, <b>Semester {semester}</b>.
         </p>
      </div>

      <div className="space-y-2">
         {displayedTps.map((tp, idx) => (
             <div key={tp.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-lg hover:border-blue-200 transition-colors">
                 <div className="flex items-start gap-4 w-full">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded mt-0.5 whitespace-nowrap">TP {idx + 1}</span>
                    <div className="space-y-1 w-full">
                        <p className="text-gray-700 text-sm font-medium whitespace-pre-wrap break-words">{tp.description}</p>
                        <div className="flex gap-2 text-[10px] text-gray-400">
                            <span className="bg-gray-100 px-1.5 rounded">Fase {tp.phase}</span>
                            <span className="bg-gray-100 px-1.5 rounded">Kls {tp.classTarget}</span>
                            <span className="bg-gray-100 px-1.5 rounded">Sem {tp.semester}</span>
                        </div>
                    </div>
                 </div>
                 <button 
                    onClick={() => handleDelete(tp.id)}
                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full shrink-0"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
             </div>
         ))}

         {displayedTps.length === 0 && (
             <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                 Belum ada TP yang diinput untuk filter ini.
             </div>
         )}
      </div>
    </div>
  );
};
