import React, { useMemo, useState, useEffect } from 'react';
import { User, UserRole, SUBJECTS } from '../types';
import { StorageService, STORAGE_KEYS } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [students, setStudents] = useState(StorageService.getStudents());
  const [users, setUsers] = useState(StorageService.getUsers());
  const [allGrades, setAllGrades] = useState(StorageService.getAllReportGrades());
  
  // Realtime subscription
  useEffect(() => {
    const handleUpdate = () => {
        setStudents(StorageService.getStudents());
        setUsers(StorageService.getUsers());
        setAllGrades(StorageService.getAllReportGrades());
    };

    const unsubStudents = StorageService.subscribe(STORAGE_KEYS.STUDENTS, handleUpdate);
    const unsubUsers = StorageService.subscribe(STORAGE_KEYS.USERS, handleUpdate);
    const unsubGrades = StorageService.subscribe(STORAGE_KEYS.REPORT_GRADES, handleUpdate);
    
    return () => {
      unsubStudents();
      unsubUsers();
      unsubGrades();
    };
  }, []);
  
  const stats = useMemo(() => {
    return [
      { label: 'Total Siswa', value: students.length, color: 'bg-blue-500' },
      { label: 'Total Guru', value: users.filter(u => u.role === UserRole.GURU).length, color: 'bg-green-500' },
      { label: 'Total Nilai Masuk', value: allGrades.length, color: 'bg-orange-500', icon: Activity },
    ];
  }, [students, users, allGrades]);

  const chartData = [
    { name: 'X-A', students: students.filter(s => s.class === 'X-A').length },
    { name: 'X-B', students: students.filter(s => s.class === 'X-B').length },
    { name: 'XI-IPA', students: students.filter(s => s.class.includes('XI')).length },
    { name: 'XII-IPA', students: students.filter(s => s.class.includes('XII')).length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
            <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center text-white`}>
                {stat.icon ? <stat.icon className="w-5 h-5" /> : <div className="w-3 h-3 bg-white rounded-full"></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistik Siswa per Kelas</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {user.role === UserRole.GURU && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Informasi Penting</h3>
          <p className="text-blue-700 text-sm">
            Batas waktu penginputan nilai rapor semester ganjil tahun ajaran 2024/2025 adalah tanggal <strong>20 Desember 2024</strong>. 
            Pastikan seluruh Tujuan Pembelajaran (TP) telah diinput sebelum memasukkan nilai siswa.
          </p>
        </div>
      )}
    </div>
  );
};