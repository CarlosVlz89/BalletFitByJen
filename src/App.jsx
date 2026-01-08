import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Plus,
  CheckCircle,
  Trash2
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', phone: '', plan: '2 clases' });

  // 1. GESTIÓN DE AUTENTICACIÓN
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error de autenticación:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHA DE DATOS EN TIEMPO REAL
  useEffect(() => {
    if (!user) return;

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    
    const unsubscribe = onSnapshot(studentsRef, 
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentList);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener alumnas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- ACCIONES ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!user || !newStudent.name) return;

    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      await addDoc(studentsRef, {
        ...newStudent,
        registrationDate: new Date().toISOString(),
        active: true,
        attendanceCount: 0
      });
      setNewStudent({ name: '', email: '', phone: '', plan: '2 clases' });
      setView('dashboard');
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const markAttendance = async (studentId, currentCount) => {
    if (!user) return;
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId);
      await updateDoc(studentRef, {
        attendanceCount: (currentCount || 0) + 1,
        lastAttendance: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al marcar asistencia:", error);
    }
  };

  const deleteStudent = async (id) => {
    if (!user) return;
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', id);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-[#369EAD] animate-pulse italic">Cargando Portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-serif pb-20">
      {/* HEADER DEL PORTAL */}
      <header className="bg-[#1A3A3E] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portal Administrativo</h1>
            <p className="text-xs text-[#EBF5F6] opacity-70">Sesión: {user.uid.substring(0,8)}...</p>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setView('dashboard')} className={`p-2 rounded ${view === 'dashboard' ? 'bg-[#369EAD]' : ''}`}>
                <Users className="w-6 h-6" />
             </button>
             <button onClick={() => setView('add')} className={`p-2 rounded ${view === 'add' ? 'bg-[#369EAD]' : ''}`}>
                <Plus className="w-6 h-6" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 mt-6">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total Alumnas" value={students.length} icon={<Users />} color="bg-[#369EAD]" />
              <StatCard title="Asistencias Mes" value={students.reduce((acc, s) => acc + (s.attendanceCount || 0), 0)} icon={<Calendar />} color="bg-[#1A3A3E]" />
              <StatCard title="ID Proyecto" value={appId.substring(0,5)} icon={<DollarSign />} color="bg-[#C5A059]" />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-[#1A3A3E] italic">Listado de Alumnas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3">Clases</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#1A3A3E]">{student.name}</div>
                          <div className="text-xs text-gray-400">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-[#EBF5F6] text-[#369EAD] text-xs rounded-full font-bold">
                            {student.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {student.attendanceCount || 0}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => markAttendance(student.id, student.attendanceCount)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Asistencia"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteStudent(student.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="p-10 text-center text-gray-400 italic">No hay alumnas registradas.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-xl mx-auto border-t-4 border-[#369EAD]">
            <h2 className="text-2xl font-bold text-[#1A3A3E] mb-6 italic">Registrar Nueva Alumna</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-3 border border-gray-200 rounded focus:ring-2 focus:ring-[#369EAD] outline-none"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  placeholder="Ej. María García"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp</label>
                  <input 
                    type="tel"
                    className="w-full p-3 border border-gray-200 rounded outline-none"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Plan</label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded outline-none bg-white"
                    value={newStudent.plan}
                    onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                  >
                    <option>1 clase</option>
                    <option>2 clases</option>
                    <option>3 clases</option>
                    <option>4 clases</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-[#369EAD] text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-[#1A3A3E] transition-all mt-4"
              >
                Guardar Alumna
              </button>
              <button 
                type="button"
                onClick={() => setView('dashboard')}
                className="w-full text-gray-400 text-sm py-2"
              >
                Cancelar
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`${color} p-3 rounded-lg text-white`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-[#1A3A3E]">{value}</p>
      </div>
    </div>
  );
}