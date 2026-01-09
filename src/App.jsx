import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  Users, 
  Lock,
  AlertCircle,
  Clock,
  PartyPopper,
  Trash2,
  UserPlus,
  X,
  Loader2
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE (Llaves integradas) ---
const firebaseConfig = {
  apiKey: "AIzaSyBhGETYAZ4Vp6asoky3e9TGt80-wFiAqiE",
  authDomain: "balletfitbyjen-6b36a.firebaseapp.com",
  projectId: "balletfitbyjen-6b36a",
  storageBucket: "balletfitbyjen-6b36a.firebasestorage.app",
  messagingSenderId: "561979345720",
  appId: "1:561979345720:web:d656205cbba706c5f8cfcd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const BRAND = {
  teal: '#369EAD',
  dark: '#1A3A3E',
  gold: '#C5A059',
};

const WEEKLY_SCHEDULE = [
  { id: 'mon-19', day: 'Lunes', time: '19:00', type: 'Ballet Fit', spots: 10 },
  { id: 'wed-19', day: 'Miércoles', time: '19:00', type: 'Ballet Fit', spots: 10 },
  { id: 'fri-19', day: 'Viernes', time: '19:00', type: 'Ballet Fit', spots: 10 },
  { id: 'sat-09', day: 'Sábado', time: '09:00', type: 'Morning Flow', spots: 12 },
];

// --- COMPONENTES UI ---
const Card = ({ children, className = '' }) => (
  <div className={`rounded-sm shadow-md border-t-4 border-[#369EAD] p-6 bg-white transition-all hover:shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-6 py-2 rounded-sm font-medium tracking-widest uppercase text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#369EAD] text-white hover:bg-[#1A3A3E]",
    secondary: "border border-[#369EAD] text-[#369EAD] hover:bg-gray-50",
    disabled: "bg-gray-100 text-gray-300 cursor-not-allowed"
  };
  return (
    <button onClick={disabled ? null : onClick} className={`${baseStyle} ${disabled ? variants.disabled : variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Efecto de Sincronización Global
  useEffect(() => {
    const startApp = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Error Auth:", err); }

      // Escuchamos alumnas (Incluso antes del login para que la tabla esté lista)
      const unsubStudents = onSnapshot(collection(db, 'alumnas'), (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudents(list);
        setLoading(false); // Quitamos el loading cuando ya tenemos datos
      });

      // Escuchamos ocupación de sesiones
      const unsubSessions = onSnapshot(collection(db, 'sesiones'), (snapshot) => {
        const data = {};
        snapshot.docs.forEach(d => data[d.id] = d.data().booked || 0);
        setSessionsData(data);
      });

      return () => { unsubStudents(); unsubSessions(); };
    };

    startApp();
  }, []);

  // 2. Mantener al usuario actualizado si cambian sus créditos mientras está logueado
  useEffect(() => {
    if (user && user.role === 'student') {
      const me = students.find(s => s.id === user.id);
      if (me) {
        setUser(prev => ({ ...prev, ...me }));
      }
    }
  }, [students]);

  const handleLogin = (idInput, nameInput) => {
    const cleanId = idInput.trim().toUpperCase();
    const cleanName = nameInput.trim().toUpperCase();

    // Login Administradora
    if (cleanId === 'ADMIN-JEN' && cleanName === 'JENNY') {
      setUser({ firstName: 'JENNY', role: 'admin' });
      setView('admin');
      return;
    }

    // Login Alumna
    const found = students.find(s => {
      const dbId = s.id.toUpperCase();
      // Comparamos el ID y checamos si el nombre ingresado es parte del nombre registrado
      const dbFirstName = s.name.split(' ')[0].toUpperCase();
      return dbId === cleanId && (s.name.toUpperCase() === cleanName || dbFirstName === cleanName);
    });

    if (found) {
      setUser({ ...found, firstName: found.name.split(' ')[0], role: 'student' });
      setView('student');
      showNotification(`Bienvenida, ${found.name.split(' ')[0]}`);
    } else {
      showNotification('Datos incorrectos. Verifica ID y primer nombre.', 'error');
    }
  };

  const handleBooking = async (sessionId) => {
    if (user.credits <= 0) {
      showNotification('Sin créditos disponibles.', 'error');
      return;
    }
    try {
      const studentRef = doc(db, 'alumnas', user.id);
      const sessionRef = doc(db, 'sesiones', sessionId);
      await updateDoc(studentRef, { credits: increment(-1), history: arrayUnion(sessionId) });
      await setDoc(sessionRef, { booked: increment(1) }, { merge: true });
      showNotification('¡Clase reservada!');
    } catch (err) { showNotification('Error al reservar', 'error'); }
  };

  const handleCancel = async (sessionId) => {
    try {
      const studentRef = doc(db, 'alumnas', user.id);
      const sessionRef = doc(db, 'sesiones', sessionId);
      await updateDoc(studentRef, { credits: increment(1), history: arrayRemove(sessionId) });
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification('Clase cancelada.');
    } catch (err) { showNotification('Error al cancelar', 'error'); }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    if (typeof window.toggleSystem === 'function') window.toggleSystem(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#369EAD] animate-pulse bg-white italic">Sincronizando con el estudio...</div>;

  return (
    <div className="font-serif text-[#1A3A3E] antialiased">
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-sm shadow-xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#1A3A3E] text-white'}`}>
          {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}
      {view === 'login' && <LoginView onLogin={handleLogin} />}
      {view === 'student' && <StudentDashboard user={user} sessions={WEEKLY_SCHEDULE} sessionsData={sessionsData} onBook={handleBooking} onCancel={handleCancel} onLogout={handleLogout} />}
      {view === 'admin' && <AdminDashboard students={students} db={db} onLogout={handleLogout} />}
    </div>
  );
}

// --- VISTAS ---

const LoginView = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: 'linear-gradient(rgba(26, 58, 62, 0.7), rgba(26, 58, 62, 0.5)), url("https://images.unsplash.com/photo-1516515865486-4447488dc476?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-sm shadow-2xl border-t-8 border-[#369EAD]">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl text-[#1A3A3E] mb-1 italic font-bold">Ballet Fit</h1>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#369EAD] font-bold">Control de Asistencia</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(id, name); }} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">ID de Alumna (BF-XXX)</label>
              <div className="relative">
                <User className="absolute left-3 top-4 text-[#369EAD] w-5 h-5" />
                <input type="text" required placeholder="BF-001" className="w-full pl-10 pr-4 py-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-serif uppercase text-sm" value={id} onChange={e => setId(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Primer Nombre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-4 text-[#369EAD] w-5 h-5" />
                <input type="text" required placeholder="NOMBRE" className="w-full pl-10 pr-4 py-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-serif uppercase text-sm" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#1A3A3E] text-white py-5 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[#369EAD] transition-all shadow-lg active:scale-95">Ingresar al Portal</button>
          </form>
          <div className="mt-8 text-center"><p className="text-[10px] text-gray-400 uppercase tracking-widest italic font-sans">¿Olvidaste tu ID? Contacta a Jen.</p></div>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, sessions, sessionsData, onBook, onCancel, onLogout }) => {
  const myHistory = user.history || [];
  const mySessions = sessions.filter(s => myHistory.includes(s.id));
  const nextClass = mySessions.length > 0 ? mySessions[0] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-2xl text-[#369EAD] font-serif font-black">BF</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 border-l border-gray-200 pl-4">Alumna: {user.name}</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-400 hover:text-[#369EAD] text-[10px] uppercase tracking-widest font-bold transition-colors">
            <span>Salir</span><LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="md:col-span-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 transform translate-x-12 -translate-y-12"><PartyPopper size={200} color={BRAND.teal} /></div>
            <h2 className="text-3xl font-serif text-[#1A3A3E] mb-2 italic">Mi Resumen Semanal</h2>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-8">Tus clases activas para esta semana.</p>
            <div className="bg-[#EBF5F6] px-8 py-5 rounded-sm border border-[#369EAD]/10 inline-block">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Clases disponibles</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold font-serif ${user.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{user.credits}</span>
                <span className="text-gray-300 text-xl">/ {user.maxCredits}</span>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-center items-center text-center bg-[#1A3A3E] border-none text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A059]"></div>
            <Calendar className="w-10 h-10 text-[#C5A059] mb-4" />
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#C5A059] font-black mb-3">Próxima Clase</h3>
            {nextClass ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-2xl font-serif text-[#C5A059] font-bold italic">{nextClass.day}</p>
                <p className="text-4xl font-serif text-white font-bold my-2 tracking-tighter">{nextClass.time}</p>
              </div>
            ) : (
              <p className="text-[#EBF5F6] text-[10px] uppercase tracking-widest opacity-40">Sin reservas</p>
            )}
          </Card>
        </div>

        <h3 className="text-xl text-[#1A3A3E] mb-8 font-serif italic border-l-4 border-[#369EAD] pl-6">Programación Semanal</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sessions.map((s) => {
            const isBooked = myHistory.includes(s.id);
            const currentBooked = sessionsData[s.id] || 0;
            const isFull = currentBooked >= s.spots;
            const canBook = user.credits > 0 && !isBooked && !isFull;

            return (
              <div key={s.id} className={`relative p-8 rounded-sm border transition-all duration-300 ${isBooked ? 'bg-[#EBF5F6] border-[#369EAD] shadow-md ring-1 ring-[#369EAD]/20' : 'bg-white border-gray-100 hover:shadow-lg'}`}>
                {isBooked && (<div className="absolute top-4 right-4 text-[#369EAD] animate-in zoom-in"><CheckCircle size={24} /></div>)}
                <div className="mb-6">
                  <span className="block text-[10px] uppercase tracking-[0.3em] text-[#1A3A3E] font-black mb-2 opacity-50">{s.day}</span>
                  <h4 className="text-3xl font-serif text-[#1A3A3E] italic font-bold">{s.time}</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">{s.type}</p>
                </div>
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-50">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="opacity-30" />{currentBooked}/{s.spots}
                  </div>
                  {isBooked ? (
                    <button onClick={() => onCancel(s.id)} className="text-[10px] text-red-400 hover:text-red-600 font-bold uppercase tracking-widest underline underline-offset-8 transition-colors">Cancelar</button>
                  ) : (
                    <Button onClick={() => onBook(s.id)} disabled={!canBook} variant={canBook ? 'primary' : 'disabled'} className="!px-4 !py-2 !text-[9px]">
                      {isFull ? 'Lleno' : 'Reservar'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ students, db, onLogout }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', plan: '2 clases x sem' });
  const [saving, setSaving] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newStudent.id || !newStudent.name) return;
    setSaving(true);

    const max = parseInt(newStudent.plan.split(' ')[0]) || 2;
    const cleanId = newStudent.id.trim().toUpperCase();
    const cleanName = newStudent.name.trim().toUpperCase();

    try {
      await setDoc(doc(db, 'alumnas', cleanId), {
        id: cleanId,
        name: cleanName,
        plan: newStudent.plan,
        maxCredits: max,
        credits: max,
        history: [],
        registrationDate: new Date().toISOString()
      });
      setShowAddForm(false);
      setNewStudent({ id: '', name: '', plan: '2 clases x sem' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const resetCredits = async (id, max) => {
    if (window.confirm("¿Reiniciar créditos de la semana?")) {
      await updateDoc(doc(db, 'alumnas', id), { credits: max, history: [] });
    }
  };

  const deleteStudent = async (id, name) => {
    if (window.confirm(`¿BORRAR PERMANENTEMENTE A ${name}?`)) {
      await deleteDoc(doc(db, 'alumnas', id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-[#1A3A3E] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-xl font-serif font-black tracking-tighter">BF ADMIN</span>
            <span className="bg-[#C5A059] text-[#1A3A3E] text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em]">Master</span>
          </div>
          <button onClick={onLogout} className="text-gray-300 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors">Salir</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <h2 className="text-4xl font-serif italic text-[#1A3A3E] font-bold">Panel Administrativo</h2>
          <Button onClick={() => setShowAddForm(true)} className="!py-4 shadow-xl">
            <UserPlus size={18} /> Registrar Nueva Alumna
          </Button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-10 rounded-sm shadow-2xl relative border-t-8 border-[#369EAD] animate-in zoom-in duration-300">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={28} /></button>
              <h3 className="text-3xl font-serif italic mb-8 border-b border-gray-100 pb-4">Inscripción</h3>
              <form onSubmit={handleRegister} className="space-y-6">
                <input type="text" placeholder="ID (BF-001)" className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 outline-none focus:border-[#369EAD] font-serif uppercase text-sm" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} />
                <input type="text" placeholder="NOMBRE COMPLETO" className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 outline-none focus:border-[#369EAD] font-serif uppercase text-sm" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <select className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 outline-none focus:border-[#369EAD] font-serif text-sm" value={newStudent.plan} onChange={e => setNewStudent({...newStudent, plan: e.target.value})}>
                  <option>1 clase x sem</option>
                  <option>2 clases x sem</option>
                  <option>3 clases x sem</option>
                  <option>4 clases x sem</option>
                </select>
                <Button disabled={saving} className="w-full !py-5">{saving ? <Loader2 className="animate-spin" /> : "Guardar en Base de Datos"}</Button>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-sm shadow-xl overflow-hidden border border-gray-100 mt-12">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 tracking-[0.2em] font-bold">
              <tr>
                <th className="px-8 py-6">ID / Nombre</th>
                <th className="px-8 py-6 text-center">Créditos</th>
                <th className="px-8 py-6 text-right pr-12">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-8 py-6 font-serif">
                    <div className="font-bold text-[#1A3A3E] text-base italic">{s.name}</div>
                    <div className="text-[10px] text-gray-400 tracking-widest uppercase">{s.id}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-xl font-bold ${s.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{s.credits}</span>
                    <span className="text-gray-300 text-sm"> / {s.maxCredits}</span>
                  </td>
                  <td className="px-8 py-6 text-right pr-10">
                    <div className="flex justify-end gap-4">
                      <button onClick={() => resetCredits(s.id, s.maxCredits)} className="p-2 text-[#C5A059] hover:bg-amber-50 rounded-full transition-all"><Clock size={20}/></button>
                      <button onClick={() => deleteStudent(s.id, s.name)} className="p-2 text-red-200 hover:text-red-600 transition-all"><Trash2 size={20}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};