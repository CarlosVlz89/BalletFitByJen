import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app'; // Solo una vez
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
  WifiOff
} from 'lucide-react';

// =========================================================
// 1. CONFIGURACIÓN DE FIREBASE (Aquí pones tus llaves)
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyBhGETYAZ4Vp6asoky3e9TGt80-wFiAqiE",
  authDomain: "balletfitbyjen-6b36a.firebaseapp.com",
  projectId: "balletfitbyjen-6b36a",
  storageBucket: "balletfitbyjen-6b36a.firebasestorage.app",
  messagingSenderId: "561979345720",
  appId: "1:561979345720:web:d656205cbba706c5f8cfcd"
};

// --- INICIALIZACIÓN ÚNICA ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ballet-fit-estudio';

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

  // Autenticación silenciosa para conectar con Firestore
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error de sesión:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Escucha de datos en tiempo real
  useEffect(() => {
    if (!user || !db || !isAuthenticated) return;

    setLoading(true);
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    
    const unsubscribe = onSnapshot(studentsRef, 
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        studentList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setStudents(studentList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error de lectura:", err);
        setError("Error de permisos: Revisa que Firestore esté en 'Modo de Prueba'.");
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
    if (!user || !db || !newStudent.name) return;
    
    setSaving(true);
    setError(null);

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
      setError("No se pudo guardar. Revisa las reglas de Firestore.");
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

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 font-serif p-4 text-brand-dark">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-[#369EAD]">
          <div className="text-center mb-8">
            <div className="bg-[#EBF5F6] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#369EAD] w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold italic">Portal de Alumnas</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              required
              className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-center text-xl tracking-widest bg-transparent"
              placeholder="Clave"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
            <button className="w-full bg-[#1A3A3E] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#369EAD] transition-all">
              Entrar
            </button>
            <button type="button" onClick={handleExit} className="w-full text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-4">
              Cerrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-serif pb-20 text-brand-dark">
      <nav className="bg-[#1A3A3E] text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
          <h1 className="font-bold text-lg tracking-tight italic">Admin Ballet Fit</h1>
          <div className="flex items-center gap-6">
             <button onClick={() => setView('dashboard')} className={`text-[10px] uppercase font-bold ${view === 'dashboard' ? 'text-[#369EAD]' : 'text-gray-400'}`}>Panel</button>
             <button onClick={() => setView('add')} className={`text-[10px] uppercase font-bold ${view === 'add' ? 'text-[#369EAD]' : 'text-gray-400'}`}>+ Registro</button>
             <button onClick={handleExit} className="text-gray-400 hover:text-white"><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-6 mt-4">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-xs font-bold uppercase">
            {error}
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Alumnas" value={students.length} icon={<Users />} color="bg-[#369EAD]" />
              <StatCard title="Asistencias" value={students.reduce((acc, s) => acc + (s.attendanceCount || 0), 0)} icon={<Calendar />} color="bg-[#1A3A3E]" />
              <StatCard title="Status" value={user ? "ONLINE" : "CONECTANDO"} icon={<CheckCircle />} color="bg-[#C5A059]" />
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-400">
                  <tr>
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4 text-center">Clases</th>
                    <th className="px-6 py-4 text-right pr-10">Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/20">
                      <td className="px-6 py-4 font-bold">{student.name}</td>
                      <td className="px-6 py-4 text-center text-sm">{student.attendanceCount || 0}</td>
                      <td className="px-6 py-4 text-right pr-8">
                        <button onClick={() => markAttendance(student.id, student.attendanceCount)} className="p-2 text-green-500 hover:bg-green-100 rounded-full transition-all">
                          <CheckCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="p-10 text-center text-[#369EAD] animate-pulse italic">Cargando datos...</div>}
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="max-w-lg mx-auto bg-white p-10 rounded shadow-xl border-t-8 border-[#369EAD]">
            <h2 className="text-2xl font-bold text-[#1A3A3E] mb-8 italic text-center">Inscripción</h2>
            <form onSubmit={handleAddStudent} className="space-y-6">
              <input 
                type="text" 
                required
                className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50"
                value={newStudent.name}
                onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="NOMBRE COMPLETO"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="tel"
                  className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50"
                  value={newStudent.phone}
                  onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                  placeholder="WHATSAPP"
                />
                <select 
                  className="w-full p-4 border-b-2 border-gray-100 focus:border-[#369EAD] outline-none text-sm bg-gray-50/50"
                  value={newStudent.plan}
                  onChange={e => setNewStudent({...newStudent, plan: e.target.value})}
                >
                  <option>1 clase x sem</option>
                  <option>2 clases x sem</option>
                  <option>3 clases x sem</option>
                  <option>4 clases x sem</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={saving || !user}
                className={`w-full py-5 rounded font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2 ${(!user || saving) ? 'bg-gray-300' : 'bg-[#1A3A3E] text-white hover:bg-[#369EAD]'}`}
              >
                {saving ? "Guardando..." : !user ? <WifiOff size={16} /> : "Confirmar Registro"}
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
    <div className="bg-white p-6 rounded shadow-sm flex items-center gap-6 border border-gray-100">
      <div className={`${color} p-4 rounded text-white`}>{React.cloneElement(icon, { size: 24 })}</div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-[#1A3A3E]">{value}</p>
      </div>
    </div>
  );
}