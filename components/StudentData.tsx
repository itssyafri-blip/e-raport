import React, { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { Student, CLASSES, User, UserRole, getPhaseFromClass } from '../types';
import { Plus, Search, Trash, AlertTriangle, Edit, Save, X, Layers } from 'lucide-react';

interface StudentDataProps {
  user: User;
}

export const StudentData: React.FC<StudentDataProps> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filterClass, setFilterClass] = useState(CLASSES[0]);
  const [formData, setFormData] = useState<Partial<Student>>({ class: CLASSES[0], phase: 'E' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Permission Check: Admin OR Wali Kelas of the specific class
  const canEdit = user.role === UserRole.ADMIN || (!!user.homeroomClass);

  useEffect(() => {
    setStudents(StorageService.getStudents());
    // Auto-select class for Wali Kelas
    if (user.role !== UserRole.ADMIN && user.homeroomClass) {
        setFilterClass(user.homeroomClass);
    }
    
    // Subscribe to changes
    const unsubscribe = StorageService.subscribe(STORAGE_KEYS.STUDENTS, () => {
        setStudents(StorageService.getStudents());
    });
    return unsubscribe;
  }, [user]);

  // When class changes in form, auto-update phase
  useEffect(() => {
      if (formData.class) {
          setFormData(prev => ({
              ...prev,
              phase: getPhaseFromClass(formData.class || 'X')
          }));
      }
  }, [formData.class]);

  const handleSave = () => {
    if (formData.name && formData.nisn && formData.class) {
      // If editing, preserve ID, otherwise StorageService will generate one
      const studentToSave = { 
          ...formData, 
          phase: formData.phase || getPhaseFromClass(formData.class),
          id: editingId ? editingId : undefined 
      };
      
      StorageService.saveStudent(studentToSave as Student);
      // Local state update handled by subscription or force refresh
      // Reset Form
      setIsAdding(false);
      setEditingId(null);
      setFormData({ class: filterClass, phase: getPhaseFromClass(filterClass) });
    } else {
        alert("Mohon lengkapi Nama dan NISN");
    }
  };

  const handleEdit = (student: Student) => {
      setFormData(student);
      setEditingId(student.id);
      setIsAdding(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Apakah Anda yakin ingin menghapus data siswa ini? Data nilai yang terkait mungkin akan hilang.")) {
          StorageService.deleteStudent(id);
      }
  };

  const handleCancel = () => {
      setIsAdding(false);
      setEditingId(null);
      setFormData({ class: filterClass, phase: getPhaseFromClass(filterClass) });
  };

  const filteredStudents = students.filter(s => s.class === filterClass);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-semibold">Data Peserta Didik</h3>
            <p className="text-sm text-gray-500">
                {canEdit ? "Kelola data siswa per kelas (Tambah/Edit/Hapus)." : "Daftar siswa terdaftar (Hanya Lihat)."}
            </p>
        </div>
        <div className="flex items-center gap-3">
             <select 
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                disabled={user.role !== UserRole.ADMIN && !!user.homeroomClass && user.homeroomClass !== filterClass} // Lock dropdown if Wali Kelas
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
             >
                {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
             </select>
             
             {canEdit && !isAdding && (
                 <button 
                   onClick={() => {
                       setFormData({ class: filterClass, phase: getPhaseFromClass(filterClass) });
                       setIsAdding(true);
                   }}
                   className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> Tambah Siswa
                 </button>
             )}
        </div>
      </div>

      {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Anda login sebagai <b>Guru Mata Pelajaran</b>. Anda hanya dapat melihat data siswa. Hubungi Admin atau Wali Kelas untuk perubahan data.</span>
          </div>
      )}

      {isAdding && canEdit && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? "Edit Data Siswa" : "Tambah Siswa Baru"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NISN</label>
                    <input 
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.nisn || ''}
                      onChange={e => setFormData({...formData, nisn: e.target.value})}
                      placeholder="Nomor Induk Siswa"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                    <input 
                      className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Nama Lengkap Siswa"
                    />
                </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                    <select 
                        className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.class || filterClass}
                        onChange={e => setFormData({...formData, class: e.target.value})}
                    >
                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Fase</label>
                    <select 
                        className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.phase || 'E'}
                        onChange={e => setFormData({...formData, phase: e.target.value as 'E' | 'F'})}
                    >
                        <option value="E">Fase E</option>
                        <option value="F">Fase F</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-200">
                <button onClick={handleCancel} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                    <X className="w-4 h-4" /> Batal
                </button>
                <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2">
                    <Save className="w-4 h-4" /> Simpan Data
                </button>
            </div>
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">NISN</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Kelas</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Fase</th>
              {canEdit && <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Aksi</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{student.nisn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">{student.class}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">Fase {student.phase || getPhaseFromClass(student.class)}</span>
                    </td>
                    {canEdit && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => handleEdit(student)}
                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
                                    title="Edit Data"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(student.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                                    title="Hapus Siswa"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    )}
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={canEdit ? 5 : 4} className="px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="w-8 h-8 text-gray-300" />
                            <p>Tidak ada data siswa untuk kelas <b>{filterClass}</b>.</p>
                            {canEdit && <p className="text-xs">Klik tombol "Tambah Siswa" untuk memulai input.</p>}
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-gray-400 text-right">
          Total: {filteredStudents.length} Siswa
      </div>
    </div>
  );
};