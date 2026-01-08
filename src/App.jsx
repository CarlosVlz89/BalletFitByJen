import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
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
  Trash2,
  LogOut,
  AlertCircle
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE SEGURA ---
let db, auth;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? (typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config)
    : {};
    
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Error en configuración de Firebase:", e);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', plan: '2 clases' });

  // 1. GESTIÓN DE AUTENTICACIÓN
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error de autenticación:", err);
        setError("Error al conectar con el servicio de seguridad.");
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setError(null);
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHA DE DATOS EN TIEMPO REAL
  useEffect(() => {
    if (!user || !db) return;

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    
    const unsubscribe = onSnapshot(studentsRef, 
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Ordenamiento en memoria para cumplir con las reglas del entorno
        studentList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setStudents(studentList);
        setLoading(false);
      },
      (err) => {
        console.error("Error al obtener alumnas:", err);
        setError("No se pudieron cargar los datos de las alumnas.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- ACCIONES ---
  const handleBackToSite = useCallback(() => {
    if (typeof window.toggleSystem === 'function') {
      window.toggleSystem(false);
    }
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!user || !db || !newStudent.name) return;

    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      await addDoc(studentsRef, {
        ...newStudent,
        name: newStudent.name.trim().toUpperCase(),
        registrationDate: new Date().toISOString(),
        active: true,
        attendanceCount: 0
      });
      setNewStudent({ name: '', phone: '', plan: '2 clases' });
      setView('dashboard');
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  const markAttendance = async (studentId, currentCount) => {
    if (!user || !db) return;
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentId);
      await updateDoc(studentRef, {
        attendanceCount: (currentCount || 0) + 1,
        lastAttendance: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error al marcar asistencia:", err);
    }
  };

  const deleteStudent = async (id, name) => {
    if (!user || !db) return;
    if (window.confirm(`¿Estás seguro de eliminar a ${name}?`)) {
      try {
        const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', id);
        await deleteDoc(studentRef);
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-serif">
        <div className="text-[#369EAD] animate-pulse italic">Cargando Portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4 font-serif text-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Problema de conexión</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-[#369EAD] text-white px-6 py-2 rounded font-bold uppercase text-xs">Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-serif pb-20">
      {/* HEADER DEL PORTAL */}
      <header className="bg-[#1A3A3E] text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portal Administrativo</h1>
            <p className="text-[10px] text-[#EBF5F6] opacity-70 uppercase tracking-widest">Ballet Fit by Jen</p>
          </div>
          <div className="flex gap-4 items-center">
             <button onClick={() => setView('dashboard')} className={`p-2 rounded transition-colors ${view === 'dashboard' ? 'bg-[#369EAD]' : 'hover:bg-white/10'}`}>
                <Users className="w-6 h-6" />
             </button>
             <button onClick={() => setView('add')} className={`p-2 rounded transition-colors ${view === 'add' ? 'bg-[#369EAD]' : 'hover:bg-white/10'}`}>
                <Plus className="w-6 h-6" />
             </button>
             <button onClick={handleBackToSite} className="ml-4 p-2 text-gray-400 hover:text-white transition-colors" title="Cerrar Portal">
                <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 mt-6">
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <StatCard title="Total Alumnas" value={students.length} icon={<Users />} color="bg-[#369EAD]" />
              <StatCard title="Asistencias Mes" value={students.reduce((acc, s) => acc + (s.attendanceCount || 0), 0)} icon={<Calendar />} color="bg-[#1A3A3E]" />
              <StatCard title="Estado Datos" value="Sincronizado" icon={<CheckCircle />} color="bg-[#C5A059]" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-bold text-[#1A3A3E] italic px-2">Listado de Alumnas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nombre / Teléfono</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4 text-center">Clases</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#1A3A3E]">{student.name}</div>
                          <div className="text-xs text-gray-400 font-sans">{student.phone || 'Sin número'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-[#EBF5F6] text-[#369EAD] text-[10px] rounded-full font-bold uppercase tracking-tight">
                            {student.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#1A3A3E]">
                          {student.attendanceCount || 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 md:gap-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => markAttendance(student.id, student.attendanceCount)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all"
                              title="Marcar Asistencia"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => deleteStudent(student.id, student.name)}
                              className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="p-20 text-center flex flex-col items-center gap-2">
                    <Users className="w-12 h-12 text-gray-100" />
                    <p className="text-gray-300 italic">No hay alumnas registradas todavía.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-xl mx-auto border-t-8 border-[#369EAD] animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-[#1A3A3E] mb-8 italic">Nueva Inscripción</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 transition-all font-sans text-sm"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value.toUpperCase()})}
                  placeholder="EJ. MARÍA GARCÍA"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp</label>
                  <input 
                    type="tel"
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 font-sans text-sm"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    placeholder="33..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Plan Mensual</label>
                  <select 
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 font-sans text-sm appearance-none cursor-pointer"
                    value={newStudent.plan}
                    onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                  >
                    <option>1 clase x sem</option>
                    <option>2 clases x sem</option>
                    <option>3 clases x sem</option>
                    <option>4 clases x sem</option>
                    <option>Clase suelta</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-[#1A3A3E] text-white py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-[#369EAD] transition-all shadow-lg"
                >
                  Registrar Alumna
                </button>
                <button 
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="w-full mt-4 text-gray-400 text-[10px] uppercase tracking-widest font-bold hover:text-gray-600 transition-colors"
                >
                  Cancelar y volver al panel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all">
      <div className={`${color} p-4 rounded-xl text-white shadow-inner transition-transform group-hover:scale-110`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-[#1A3A3E]">{value}</p>
      </div>
    </div>
  );
}