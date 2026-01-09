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
  Lock,
  Loader2,
  WifiOff,
  AlertCircle
} from 'lucide-react';

// =========================================================
// 1. CONFIGURACIÓN DE FIREBASE (Tus llaves reales)
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyBhGETYAZ4Vp6asoky3e9TGt80-wFiAqiE",
  authDomain: "balletfitbyjen-6b36a.firebaseapp.com",
  projectId: "balletfitbyjen-6b36a",
  storageBucket: "balletfitbyjen-6b36a.firebasestorage.app",
  messagingSenderId: "561979345720",
  appId: "1:561979345720:web:d656205cbba706c5f8cfcd"
};

// --- INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', plan: '2 clases x sem' });

  // 1. Autenticación Anónima (Para que Firebase te deje escribir)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // En tu GitHub Pages, esto usará signInAnonymously
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error de sesión Firebase:", err);
        setError("Error de conexión con la base de datos.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Escucha de datos (Colección simplificada: 'alumnas')
  useEffect(() => {
    // Solo cargamos datos si el usuario pasó la clave del portal y está autenticado en Firebase
    if (!isAuthenticated || !user) return;

    setLoading(true);
    const studentsRef = collection(db, 'alumnas');
    
    const unsubscribe = onSnapshot(studentsRef, 
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Ordenamos por nombre (¡Muy útil para Jenny!)
        studentList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setStudents(studentList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error de lectura Firestore:", err);
        setError("Error de permisos: Asegúrate de que Firestore esté en 'Modo de Prueba'.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'ballet2026') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Clave incorrecta");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!user || !newStudent.name) return;
    
    setSaving(true);
    setError(null);

    try {
      const studentsRef = collection(db, 'alumnas');
      await addDoc(studentsRef, {
        name: newStudent.name.trim().toUpperCase(),
        phone: newStudent.phone,
        plan: newStudent.plan,
        registrationDate: new Date().toISOString(),
        attendanceCount: 0
      });
      setNewStudent({ name: '', phone: '', plan: '2 clases x sem' });
      setView('dashboard');
      setSaving(false);
    } catch (err) {
      console.error("Error al guardar:", err);
      setError("No se pudo guardar. Verifica que Firestore esté activo.");
      setSaving(false);
    }
  };

  const markAttendance = async (studentId, currentCount) => {
    if (!user) return;
    try {
      const studentRef = doc(db, 'alumnas', studentId);
      await updateDoc(studentRef, {
        attendanceCount: (currentCount || 0) + 1,
        lastAttendance: new Date().toISOString()
      });
    } catch (err) { console.error(err); }
  };

  const deleteStudent = async (id, name) => {
    if (!user) return;
    if (window.confirm(`¿Estás seguro de eliminar a ${name}?`)) {
      try {
        const studentRef = doc(db, 'alumnas', id);
        await deleteDoc(studentRef);
      } catch (err) { console.error(err); }
    }
  };

  const handleExit = () => {
    setIsAuthenticated(false);
    if (typeof window.toggleSystem === 'function') window.toggleSystem(false);
  };

  // --- VISTA DE ACCESO ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-serif p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-[#369EAD] animate-in fade-in duration-500">
          <div className="text-center mb-8">
            <div className="bg-[#EBF5F6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#369EAD] w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold italic text-[#1A3A3E]">Acceso al Portal</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              required
              className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-center text-xl tracking-widest bg-transparent text-[#1A3A3E]"
              placeholder="Clave"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
            <button className="w-full bg-[#1A3A3E] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#369EAD] transition-all shadow-md">
              Entrar al Panel
            </button>
            <button type="button" onClick={handleExit} className="w-full text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-4">
              Volver al Inicio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-serif pb-20">
      <nav className="bg-[#1A3A3E] text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
          <h1 className="font-bold text-lg tracking-tight italic">Admin Ballet Fit</h1>
          <div className="flex items-center gap-6">
             <button onClick={() => setView('dashboard')} className={`text-[10px] uppercase font-bold transition-colors ${view === 'dashboard' ? 'text-[#369EAD]' : 'text-gray-400'}`}>Alumnas</button>
             <button onClick={() => setView('add')} className={`text-[10px] uppercase font-bold transition-colors ${view === 'add' ? 'text-[#369EAD]' : 'text-gray-400'}`}>+ Nuevo</button>
             <button onClick={handleExit} className="text-gray-400 hover:text-white transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold uppercase flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Alumnas" value={students.length} icon={<Users />} color="bg-[#369EAD]" />
              <StatCard title="Asistencias" value={students.reduce((acc, s) => acc + (s.attendanceCount || 0), 0)} icon={<Calendar />} color="bg-[#1A3A3E]" />
              <StatCard title="Base de Datos" value={user ? "ONLINE" : "OFFLINE"} icon={<CheckCircle />} color="bg-[#C5A059]" />
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Información</th>
                      <th className="px-6 py-4 text-center">Clases</th>
                      <th className="px-6 py-4 text-right pr-10">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#1A3A3E]">{student.name}</div>
                          <div className="text-[10px] text-gray-400 font-sans tracking-wide">{student.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#1A3A3E]">{student.attendanceCount || 0}</td>
                        <td className="px-6 py-4 text-right pr-8 flex justify-end gap-2">
                          <button onClick={() => markAttendance(student.id, student.attendanceCount)} className="p-2 text-green-500 hover:bg-green-100 rounded-full transition-all active:scale-90" title="Marcar Asistencia">
                            <CheckCircle size={20} />
                          </button>
                          <button onClick={() => deleteStudent(student.id, student.name)} className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading && (
                  <div className="p-20 text-center text-[#369EAD] flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin w-8 h-8" />
                    <span className="italic">Sincronizando con la nube...</span>
                  </div>
                )}
                {!loading && students.length === 0 && (
                  <div className="p-20 text-center text-gray-300 italic">No hay alumnas registradas.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="max-w-lg mx-auto bg-white p-10 rounded shadow-xl border-t-8 border-[#369EAD] animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-[#1A3A3E] mb-8 italic text-center underline underline-offset-8 decoration-[#369EAD]/30">Nueva Inscripción</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50 text-[#1A3A3E] font-sans"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value.toUpperCase()})}
                  placeholder="NOMBRE DE LA ALUMNA"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp</label>
                  <input 
                    type="tel"
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50 text-[#1A3A3E] font-sans"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    placeholder="33..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Plan</label>
                  <select 
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50 text-[#1A3A3E] font-sans"
                    value={newStudent.plan}
                    onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                  >
                    <option>1 clase x sem</option>
                    <option>2 clases x sem</option>
                    <option>3 clases x sem</option>
                    <option>4 clases x sem</option>
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={saving || !user}
                  className={`w-full py-5 rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg flex items-center justify-center gap-2 ${(!user || saving) ? 'bg-gray-300' : 'bg-[#1A3A3E] text-white hover:bg-[#369EAD] active:scale-95'}`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Guardando Alumna...
                    </>
                  ) : !user ? (
                    <>
                      <WifiOff size={16} />
                      Conectando...
                    </>
                  ) : "Confirmar Registro"}
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
    <div className="bg-white p-6 rounded shadow-sm flex items-center gap-6 border border-gray-100 group hover:shadow-md transition-all">
      <div className={`${color} p-4 rounded text-white shadow-inner transition-transform group-hover:scale-110`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-[#1A3A3E]">{value}</p>
      </div>
    </div>
  );
}