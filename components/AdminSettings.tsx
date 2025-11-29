
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { User, UserRole, SUBJECTS, CLASSES } from '../types';
import { Save, UserCog, RefreshCw, UserPlus, X, Trash2, Shield, User as UserIcon, GraduationCap } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({ ...user });
    setIsAdding(false);
    setMessage('');
  };

  const handleStartAdd = () => {
    setFormData({ role: UserRole.GURU, password: '123' }); // Default password
    setIsAdding(true);
    setEditingId(null);
    setMessage('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      StorageService.deleteUser(id);
      loadUsers();
      setMessage('Pengguna berhasil dihapus.');
    }
  };

  const handleSave = () => {
    if (formData.username && formData.name && formData.role) {
      if (isAdding) {
          StorageService.addUser(formData as User);
          setMessage('Pengguna baru berhasil ditambahkan.');
      } else if (formData.id) {
          StorageService.updateUser(formData as User);
          setMessage('Data pengguna berhasil diperbarui.');
      }
      
      loadUsers();
      setEditingId(null);
      setIsAdding(false);
      
      setTimeout(() => setMessage(''), 3000);
    } else {
        alert("Mohon lengkapi username, nama, dan role.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-gray-200">
        <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <UserCog className="w-6 h-6 text-blue-600" />
            Manajemen Akun Pengguna
            </h3>
            <p className="text-sm text-gray-500 mt-1">Registrasi dan kelola akun Administrator & Guru Mata Pelajaran</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleStartAdd} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded shadow-sm text-sm font-semibold flex items-center gap-2 transition-colors"
            >
                <UserPlus className="w-4 h-4" /> Tambah Pengguna
            </button>
            <button onClick={loadUsers} className="text-gray-500 hover:text-blue-600 p-2.5 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded border-l-4 border-emerald-500 text-sm flex items-center gap-3 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          {message}
        </div>
      )}

      {isAdding && (
          <div className="bg-slate-50 p-6 rounded border border-slate-200 shadow-inner mb-6 animate-in slide-in-from-top-2">
              <h4 className="text-md font-bold text-slate-800 mb-5 flex items-center justify-between">
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Registrasi Pengguna Baru</span>
                  <button onClick={() => setIsAdding(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Nama Lengkap</label>
                      <input 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Nama Lengkap dengan Gelar"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Username / NIP</label>
                      <input 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={formData.username || ''}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        placeholder="Username atau NIP"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Password</label>
                      <input 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        type="text"
                        value={formData.password || ''}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="Password Default"
                      />
                  </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Peran (Role)</label>
                       <select 
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            value={formData.role || UserRole.GURU}
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                       >
                           <option value={UserRole.ADMIN}>Administrator</option>
                           <option value={UserRole.GURU}>Guru Mata Pelajaran</option>
                       </select>
                   </div>
                   {formData.role === UserRole.GURU && (
                        <>
                            <div className="lg:col-span-2 bg-white p-4 rounded border border-gray-200">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Mata Pelajaran yang Diampu</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    value={formData.subject || ''}
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                >
                                    <option value="">-- Pilih Mata Pelajaran --</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="lg:col-span-2 bg-white p-4 rounded border border-gray-200">
                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Tugas Tambahan (Wali Kelas)</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    value={formData.homeroomClass || ''}
                                    onChange={e => setFormData({...formData, homeroomClass: e.target.value})}
                                >
                                    <option value="">-- Tidak Ada --</option>
                                    {CLASSES.map(c => <option key={c} value={c}>Wali Kelas {c}</option>)}
                                </select>
                            </div>
                        </>
                   )}
              </div>
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button onClick={() => setIsAdding(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-gray-300 rounded shadow-sm">Batal</button>
                  <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-blue-700 shadow-md">Simpan Data</button>
              </div>
          </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[25%]">Identitas Pengguna</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Kredensial</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-[35%]">Hak Akses & Tugas</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-[20%]">Kontrol</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/50 transition-colors">
                {editingId === user.id ? (
                  <>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                          <input 
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.name || ''}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="Nama"
                          />
                          <input 
                            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={formData.username || ''}
                            onChange={e => setFormData({...formData, username: e.target.value})}
                            placeholder="Username"
                          />
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input 
                        className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        type="text"
                        value={formData.password || ''}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                       {user.role === UserRole.GURU ? (
                           <div className="space-y-2">
                               <select 
                                className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={formData.subject || ''}
                                onChange={e => setFormData({...formData, subject: e.target.value})}
                               >
                                 {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                               <select 
                                    className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formData.homeroomClass || ''}
                                    onChange={e => setFormData({...formData, homeroomClass: e.target.value})}
                                >
                                    <option value="">-- Bukan Wali Kelas --</option>
                                    {CLASSES.map(c => <option key={c} value={c}>Wali Kelas {c}</option>)}
                                </select>
                           </div>
                       ) : <span className="text-gray-400 text-sm italic">System Administrator</span>}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Save className="w-3 h-3" /> Simpan
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <X className="w-3 h-3" /> Batal
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                {user.role === UserRole.ADMIN ? <Shield className="w-5 h-5 text-purple-600" /> : <UserIcon className="w-5 h-5 text-blue-600" />}
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.username}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">
                           {user.password || '••••••'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === UserRole.ADMIN ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                Administrator
                            </span>
                        ) : (
                            <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Guru Mata Pelajaran
                                </span>
                                <span className="text-xs text-slate-500 font-medium">{user.subject}</span>
                                {user.homeroomClass && (
                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 gap-1">
                                         <GraduationCap className="w-3 h-3" /> Wali Kelas {user.homeroomClass}
                                     </span>
                                )}
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">Ubah Data</button>
                        {user.id !== '1' && ( // Prevent deleting main admin
                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center text-xs text-gray-400 mt-4">
          Total Pengguna Terdaftar: {users.length}
      </div>
    </div>
  );
};
