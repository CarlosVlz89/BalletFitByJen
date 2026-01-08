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
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
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
  console.error("Error de inicialización:", e);
}

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

  // 1. GESTIÓN DE AUTENTICACIÓN FIREBASE
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHA DE DATOS (Solo si está logueado en la App y en Firebase)
  useEffect(() => {
    if (!user || !db || !isAuthenticated) return;

    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const unsubscribe = onSnapshot(studentsRef, 
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        studentList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setStudents(studentList);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, isAuthenticated]);

  // --- MANEJADORES ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'ballet2026') { // PUEDES CAMBIAR TU CLAVE AQUÍ
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Clave de acceso incorrecta");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!user || !db || !newStudent.name) return;
    
    setSaving(true);
    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      await addDoc(studentsRef, {
        ...newStudent,
        name: newStudent.name.trim().toUpperCase(),
        registrationDate: new Date().toISOString(),
        attendanceCount: 0
      });
      setNewStudent({ name: '', phone: '', plan: '2 clases x sem' });
      setView('dashboard');
      setSaving(false);
    } catch (err) {
      console.error("Error al guardar:", err);
      setError("No se pudo guardar la alumna. Revisa tu conexión.");
      setSaving(false);
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
    } catch (err) { console.error(err); }
  };

  const handleExit = () => {
    setIsAuthenticated(false);
    if (typeof window.toggleSystem === 'function') window.toggleSystem(false);
  };

  // --- VISTA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-serif p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-[#369EAD] animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="bg-[#EBF5F6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#369EAD] w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A3A3E] italic">Acceso al Portal</h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">Solo personal autorizado</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              required
              autoFocus
              className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-center text-xl tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs text-center font-bold italic">{error}</p>}
            <button className="w-full bg-[#1A3A3E] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#369EAD] transition-all shadow-lg">
              Entrar al Sistema
            </button>
            <button type="button" onClick={handleExit} className="w-full text-gray-400 text-[10px] uppercase font-bold tracking-widest">
              Volver al sitio público
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
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight">Admin Ballet Fit</h1>
            <span className="text-[10px] text-[#EBF5F6] opacity-60 uppercase tracking-widest">Jenny's Studio</span>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={() => setView('dashboard')} className={`text-[10px] uppercase tracking-widest font-bold ${view === 'dashboard' ? 'text-[#369EAD]' : 'text-gray-400'}`}>Panel</button>
             <button onClick={() => setView('add')} className={`text-[10px] uppercase tracking-widest font-bold ${view === 'add' ? 'text-[#369EAD]' : 'text-gray-400'}`}>+ Alumna</button>
             <button onClick={handleExit} className="p-2 text-gray-400 hover:text-white transition-colors">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Alumnas" value={students.length} icon={<Users />} color="bg-[#369EAD]" />
              <StatCard title="Asistencias" value={students.reduce((acc, s) => acc + (s.attendanceCount || 0), 0)} icon={<Calendar />} color="bg-[#1A3A3E]" />
              <StatCard title="Sistema" value="ONLINE" icon={<CheckCircle />} color="bg-[#C5A059]" />
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-brand-dark">Nombre de Alumna</th>
                      <th className="px-6 py-4 hidden sm:table-cell">Plan</th>
                      <th className="px-6 py-4 text-center">Clases</th>
                      <th className="px-6 py-4 text-right">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-blue-50/20 transition-all">
                        <td className="px-6 py-4 font-bold text-[#1A3A3E]">{student.name}</td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="px-2 py-1 bg-[#EBF5F6] text-[#369EAD] text-[10px] rounded font-bold">{student.plan}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-[#1A3A3E]">{student.attendanceCount || 0}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => markAttendance(student.id, student.attendanceCount)} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-all active:scale-90">
                            <CheckCircle size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="max-w-lg mx-auto bg-white p-10 rounded shadow-xl border-t-8 border-[#369EAD] animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-[#1A3A3E] mb-8 italic">Nueva Inscripción</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 text-sm"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  placeholder="EJ. MARÍA GARCÍA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp</label>
                  <input 
                    type="tel"
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 text-sm"
                    value={newStudent.phone}
                    onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                    placeholder="33..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Plan</label>
                  <select 
                    className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none bg-gray-50/30 text-sm"
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
              <button 
                type="submit"
                disabled={saving}
                className="w-full bg-[#1A3A3E] text-white py-5 rounded-lg font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#369EAD] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Guardando...
                  </>
                ) : "Confirmar Registro"}
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
    <div className="bg-white p-6 rounded shadow-sm border border-gray-100 flex items-center gap-6">
      <div className={`${color} p-4 rounded text-white shadow-inner`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-[#1A3A3E]">{value}</p>
      </div>
    </div>
  );
}