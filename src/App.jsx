import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  getDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  LogOut, 
  Users, 
  Clock,
  PartyPopper,
  Trash2,
  UserPlus,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  DollarSign, 
  Info,
  Trophy,
  Activity,
  Heart,
  Stethoscope,
  ClipboardList,
  Check,
  UserX,
  UserCheck,
  RefreshCw,
  BookOpen,
  Eye,
  EyeOff,
  Key,
  ShieldCheck
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
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
const appId = "balletfitbyjen-6b36a"; 

// --- SECRETOS DE ACCESO ---
const ADMIN_PASS = "JENNY2024";

const WEEKLY_SCHEDULE = [
  { id: 'mon-19', day: 'Lunes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 1 },
  { id: 'wed-19', day: 'Miércoles', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 3 },
  { id: 'fri-19', day: 'Viernes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Lucy', dayIdx: 5 },
  { id: 'sat-09', day: 'Sábado', time: '09:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 6 },
];

const PRICES = [
  { plan: "4 clases a la semana", price: 850 },
  { plan: "3 clases a la semana", price: 720 },
  { plan: "2 clases a la semana", price: 620 },
  { plan: "1 clase a la semana", price: 450 },
  { plan: "Clase suelta", price: 150 },
];

const MOTIVATIONAL_QUOTES = [
  "¡Qué gusto verte de nuevo!",
  "¡Lista para brillar en el estudio!",
  "Tu disciplina es tu mayor fuerza.",
  "Un día más cerca de tus objetivos.",
  "¡A darle con todo hoy!",
  "La elegancia se entrena con cada paso."
];

// --- COMPONENTES UI (LIQUID GLASS STYLE) ---

// 1. Tarjeta de Cristal
const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/40 shadow-xl bg-white/70 backdrop-blur-md p-6 transition-all hover:bg-white/80 hover:shadow-2xl hover:scale-[1.01] ${className}`}>
    {children}
  </div>
);

// 2. Botón de Cristal
const GlassButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-sans font-bold tracking-widest uppercase text-[10px] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm";
  const variants = {
    primary: "bg-[#369EAD]/90 text-white hover:bg-[#1A3A3E] border border-white/20",
    secondary: "bg-white/50 border border-[#369EAD] text-[#369EAD] hover:bg-white",
    disabled: "bg-gray-200/50 text-gray-400 cursor-not-allowed border border-gray-200"
  };
  return (
    <button onClick={disabled ? null : onClick} className={`${baseStyle} ${disabled ? variants.disabled : variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

// --- UTILIDADES ---
const getHoursUntilClass = (dayIdx, timeStr) => {
  const now = new Date();
  const classTime = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  let daysToAdd = (dayIdx - now.getDay() + 7) % 7;
  
  // LÓGICA DE LA VENTANA DE 2 HORAS:
  if (daysToAdd === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const classMinutesTotal = hours * 60 + minutes;
    if (nowMinutes > classMinutesTotal + 120) {
       daysToAdd = 7;
    }
  }
  classTime.setDate(now.getDate() + daysToAdd);
  classTime.setHours(hours, minutes, 0, 0);
  const diffMs = classTime - now;
  return diffMs / (1000 * 60 * 60);
};

const getISOWeekNumber = (date) => {
  const tdt = new Date(date.valueOf());
  const day = date.getDay(); 
  tdt.setDate(tdt.getDate() - day + 3);
  const firstThursday = tdt.valueOf();
  tdt.setMonth(0, 1);
  if (tdt.getDay() !== 4) {
    tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - tdt) / 604800000);
};

const isClassInPast = (dayIdx, timeStr) => {
  const now = new Date();
  const currentDay = now.getDay(); 
  const [hours, minutes] = timeStr.split(':').map(Number);
  const currentTimeInMin = now.getHours() * 60 + now.getMinutes();
  const classTimeInMin = hours * 60 + minutes;

  if (currentDay > dayIdx) return true;
  if (currentDay === dayIdx && currentTimeInMin >= classTimeInMin) return true;
  return false;
};

const getNextClassFromSchedule = (teacherName = null) => {
  let schedule = WEEKLY_SCHEDULE;
  if (teacherName) {
    schedule = WEEKLY_SCHEDULE.filter(s => s.teacher === teacherName);
  }
  const diffs = schedule.map(s => ({
    ...s,
    diff: getHoursUntilClass(s.dayIdx, s.time)
  }));
  return diffs.sort((a, b) => a.diff - b.diff)[0];
};

const getCurrentMonthName = () => {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date()).toUpperCase();
};

export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [settings, setSettings] = useState({ totalClassesTaught: 0 });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomQuote, setRandomQuote] = useState("");
  const [extraGuests, setExtraGuests] = useState([]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const studentsCol = collection(db, 'artifacts', appId, 'public', 'data', 'alumnas');
  const teachersCol = collection(db, 'artifacts', appId, 'public', 'data', 'maestros');
  const sessionsCol = collection(db, 'artifacts', appId, 'public', 'data', 'sesiones');
  const settingsDoc = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'metadata');

useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    
    const startApp = async () => {
      try { 
        await signInAnonymously(auth); 
      } catch (err) { 
        console.error("Error Auth:", err); 
      }

      onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) return;

        const unsubStudents = onSnapshot(studentsCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setStudents(list);
          setLoading(false);
        });

        const unsubTeachers = onSnapshot(teachersCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTeachers(list);
        });

        const unsubSessions = onSnapshot(sessionsCol, (snapshot) => {
          const data = {};
          snapshot.docs.forEach(d => data[d.id] = d.data());
          setSessionsData(data);
        });

        const unsubSettings = onSnapshot(settingsDoc, (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data());
          } else {
            setDoc(settingsDoc, { totalClassesTaught: 0, lastResetWeek: 0 }, { merge: true });
          }
        });

        const extraCol = collection(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras');
        const unsubExtra = onSnapshot(extraCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setExtraGuests(list);
        });

        return () => { 
          unsubStudents(); 
          unsubTeachers(); 
          unsubSessions(); 
          unsubSettings(); 
          unsubExtra();
        };
      });
    };
    startApp();
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      const me = students.find(s => s.id === user.id);
      if (me) setUser(prev => ({ ...prev, ...me }));
    }
  }, [students]);

  const handleLogin = (idInput, passwordInput) => {
    const cleanId = idInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim();
    setError(null);

    if (cleanId === 'ADMIN-JEN' || cleanId === 'JENNY') {
      if (cleanPass === ADMIN_PASS) {
        setUser({ firstName: 'JENNY', role: 'admin' });
        setView('admin');
        showNotification('Acceso Admin concedido');
        return;
      } else {
        setError('Contraseña de Admin incorrecta.');
        return;
      }
    }

    const teacherFound = teachers.find(t => t.id.toUpperCase() === cleanId);
    if (teacherFound) {
      if (teacherFound.password === cleanPass) {
        if (teacherFound.status === 'inactive') {
          setError('Cuenta de maestra inactiva.');
          return;
        }
        setUser({ ...teacherFound, firstName: teacherFound.name.split(' ')[0], role: 'teacher' });
        setView('teacher');
        showNotification('Acceso Maestra concedido');
        return;
      } else {
        setError('Contraseña de maestra incorrecta.');
        return;
      }
    }

    const found = students.find(s => s.id.toUpperCase() === cleanId);
    if (found) {
      if (found.password && found.password !== cleanPass) {
        setError('Contraseña incorrecta.');
        return;
      }
      if (found.status === 'inactive') {
        setError('Cuenta inactiva. Contacta a Jenny.');
        return;
      }
      setUser({ ...found, firstName: found.name.split(' ')[0], role: 'student' });
      setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
      setView('student');
    } else {
      setError('ID no encontrado o datos incorrectos.');
    }
  };

  const handleBooking = async (sessionId) => {
    if (!auth.currentUser) return;
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const sessionState = sessionsData[sessionId];
    
    if (isClassInPast(sessionConfig.dayIdx, sessionConfig.time)) {
      showNotification('Esta clase ya ocurrió.', 'error');
      return;
    }

    if (sessionState?.isClosed) { showNotification('Clase cerrada.', 'error'); return; }
    if (user.credits <= 0) { showNotification('Sin créditos.', 'error'); return; }

    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', user.id);
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId);
      await updateDoc(studentRef, { 
        credits: increment(-1), 
        history: arrayUnion(sessionId)
      });
      await setDoc(sessionRef, { booked: increment(1) }, { merge: true });
      showNotification('¡Clase reservada!');
    } catch (err) { showNotification('Error al reservar', 'error'); }
  };

  const handleUpdateOwnPassword = async (collectionName, id, newPassword) => {
    if (!newPassword.trim()) {
      showNotification('La contraseña no puede estar vacía', 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { 
        password: newPassword.trim() 
      });
      showNotification('Contraseña actualizada con éxito');
      setUser(prev => ({ ...prev, password: newPassword.trim() }));
    } catch (err) {
      showNotification('Error al actualizar contraseña', 'error');
    }
  };

  const handleCancel = async (sessionId) => {
    if (!auth.currentUser) return;
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    
    if (isClassInPast(sessionConfig.dayIdx, sessionConfig.time)) {
      showNotification('No se puede cancelar una clase que ya finalizó.', 'error');
      return;
    }

    const hoursRemaining = getHoursUntilClass(sessionConfig.dayIdx, sessionConfig.time);
    const isLateCancellation = hoursRemaining < 6;

    if (isLateCancellation && !window.confirm("Menos de 6h: El lugar se libera pero NO se devuelve crédito. ¿Continuar?")) return;

    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', user.id);
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId);
      if (!isLateCancellation) {
        await updateDoc(studentRef, { 
          credits: increment(1), 
          history: arrayRemove(sessionId)
        });
      } else {
        await updateDoc(studentRef, { history: arrayRemove(sessionId) });
      }
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification(isLateCancellation ? 'Lugar liberado (sin crédito)' : 'Clase cancelada.');
    } catch (err) { showNotification('Error al cancelar', 'error'); }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setError(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#369EAD] animate-pulse bg-gradient-to-br from-[#EBF5F6] to-[#white] italic text-xl">Cargando Ballet Fit...</div>;

  // FONDO PRINCIPAL CON DEGRADADO (LIQUID EFFECT)
  return (
    <div className="font-serif text-[#1A3A3E] antialiased min-h-screen bg-gradient-to-br from-[#EBF5F6] via-[#d4e9ed] to-[#EBF5F6]">
      {/* Círculos decorativos de fondo (Blobs) */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#369EAD]/10 blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#C5A059]/10 blur-[100px] pointer-events-none"></div>

      {notification && (
        <div className={`fixed top-4 right-4 z-[150] px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 border ${notification.type === 'error' ? 'bg-red-500/90 text-white border-red-700' : 'bg-[#1A3A3E]/90 text-white border-[#369EAD]'}`}>
          {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}
      {view === 'login' && <LoginView onLogin={handleLogin} error={error} />}
      {view === 'student' && <StudentDashboard user={user} quote={randomQuote} sessions={WEEKLY_SCHEDULE} sessionsData={sessionsData} onBook={handleBooking} onCancel={handleCancel} onLogout={handleLogout} onUpdatePassword={handleUpdateOwnPassword} />}
      {view === 'admin' && <AdminDashboard students={students} teachers={teachers} sessionsData={sessionsData} settings={settings} db={db} appId={appId} onLogout={handleLogout} showNotification={showNotification} extraGuests={extraGuests} />}
      {view === 'teacher' && <TeacherDashboard user={user} students={students} sessionsData={sessionsData} db={db} appId={appId} onLogout={handleLogout} showNotification={showNotification} onUpdatePassword={handleUpdateOwnPassword} />}
    </div>
  );
}

// --- VISTAS ACTUALIZADAS (LIQUID GLASS) ---

const LoginView = ({ onLogin, error }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516515865486-4447488dc476?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
      <div className="absolute inset-0 bg-[#1A3A3E]/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/40">
          <div className="text-center mb-10">
            <h1 className="font-serif text-5xl text-[#1A3A3E] mb-2 italic font-bold">Ballet Fit</h1>
            <span className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#369EAD] font-black">Portal alumnas</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(id, password); }} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-sans font-black uppercase text-gray-500 tracking-widest ml-1">ID o Usuario</label>
              <input type="text" required placeholder="Ingresa tu ID" className="w-full p-4 bg-white/50 border border-white/50 rounded-xl focus:border-[#369EAD] focus:bg-white/80 outline-none font-sans uppercase text-sm transition-all shadow-inner" value={id} onChange={e => setId(e.target.value)} />
            </div>
            <div className="space-y-1 relative">
              <label className="text-[9px] font-sans font-black uppercase text-gray-500 tracking-widest ml-1">Contraseña</label>
              <input type={showPass ? "text" : "password"} required placeholder="••••••••" className="w-full p-4 bg-white/50 border border-white/50 rounded-xl focus:border-[#369EAD] focus:bg-white/80 outline-none font-sans text-sm transition-all shadow-inner" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-gray-400 hover:text-[#369EAD]">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="text-red-500 font-sans text-[10px] text-center font-bold animate-pulse leading-tight bg-red-50/80 p-3 rounded-xl border border-red-100">{error}</div>}
            <button type="submit" className="w-full bg-[#1A3A3E]/90 hover:bg-[#369EAD] text-white py-5 rounded-xl font-sans uppercase tracking-[0.3em] text-[11px] font-bold transition-all shadow-lg active:scale-95 border border-white/20 backdrop-blur-sm">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, quote, sessions, sessionsData, onBook, onCancel, onLogout, onUpdatePassword }) => {
  const myHistory = user.history || [];
  const mySessions = sessions.filter(s => myHistory.includes(s.id));
  const nextClass = mySessions.length > 0 ? mySessions[0] : null;
  const currentMonth = getCurrentMonthName();
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");
  
  return (
    <div className="pb-20 relative z-10">
      <nav className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/40 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-2">
          <span className="text-2xl text-[#369EAD] font-serif font-black">BF</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPassModal(true)} className="text-gray-500 hover:text-[#369EAD] text-[10px] font-sans uppercase font-bold flex items-center gap-2 tracking-widest transition-colors">
              <Key size={16} /> <span>Mi Clave</span>
            </button>
            <button onClick={onLogout} className="text-gray-500 hover:text-[#369EAD] text-[10px] font-sans uppercase font-bold flex items-center gap-2 tracking-widest transition-colors">
              <span>Salir</span><LogOut size={16} />
            </button>
          </div>
          {showPassModal && (
            <div className="fixed inset-0 bg-[#1A3A3E]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50 text-center">
                 <h3 className="text-xl font-serif italic mb-2">Mi Nueva Clave</h3>
                 <input type="text" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-center font-bold mb-4" placeholder="Escribe aquí" value={newPass} onChange={e => setNewPass(e.target.value)} />
                 <GlassButton onClick={() => { onUpdatePassword('alumnas', user.id, newPass); setShowPassModal(false); }} className="w-full !py-4">Actualizar</GlassButton>
                 <button onClick={() => setShowPassModal(false)} className="mt-4 text-[10px] uppercase font-bold text-gray-400">Cerrar</button>
              </div>
          </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 text-center md:text-left">
           <h2 className="text-4xl md:text-5xl font-serif italic text-[#1A3A3E] font-bold mb-2">¡Hola, {user.firstName}!</h2>
           <p className="text-[#369EAD] text-sm md:text-base font-sans uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
             <Heart size={16} fill="#369EAD" /> {quote}
           </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <GlassCard className="md:col-span-2 flex flex-col justify-between !border-t border-white/40">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif text-[#1A3A3E] italic">Resumen de {currentMonth}</h3>
              </div>
              <div className="p-3 rounded-full bg-white/50 text-[#369EAD] shadow-sm">
                <Activity size={24} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#EBF5F6]/50 backdrop-blur-sm px-6 py-4 rounded-xl border border-[#369EAD]/10">
                <span className="block text-[9px] font-sans uppercase tracking-widest text-gray-500 font-bold mb-1">Clases de la semana</span>
                <div className="flex items-baseline gap-1 font-sans">
                  <span className={`text-4xl font-bold ${user.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{user.credits}</span>
                  <span className="text-gray-400 text-lg">/ {user.maxCredits}</span>
                </div>
              </div>
              <div className="bg-[#1A3A3E]/90 backdrop-blur-sm px-6 py-4 rounded-xl border border-white/10 text-white shadow-lg">
                <span className="block text-[9px] font-sans uppercase tracking-widest text-[#C5A059] font-bold mb-1 text-opacity-80">Total Histórico</span>
                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-4xl font-bold text-[#C5A059]">{user.totalAttendance || 0}</span>
                  <span className="text-[#C5A059] text-xs text-opacity-50 ml-1">Sesiones</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="!bg-[#1A3A3E]/90 border-none text-white text-center flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-2 opacity-5"><Calendar size={120} /></div>
             <Calendar className="text-[#C5A059] mb-3 animate-pulse" size={32} />
             <h3 className="text-[10px] font-sans uppercase tracking-widest text-[#C5A059] mb-2 font-black">Próximo Entrenamiento</h3>
             {nextClass ? (
                <div className="animate-in fade-in duration-500">
                  <p className="text-2xl italic font-bold text-[#C5A059]">{nextClass.day}</p>
                  <p className="text-4xl font-sans font-bold my-1 tracking-tighter">{nextClass.time}</p>
                  <p className="text-[9px] font-sans uppercase opacity-40 tracking-widest">Maestra: {nextClass.teacher}</p>
                </div>
             ) : <p className="opacity-40 italic text-sm">Sin clases pendientes</p>}
          </GlassCard>
        </div>

        <h3 className="text-xl mb-8 font-serif italic border-l-4 border-[#369EAD] pl-6">Cartelera de Clases</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sessions.map((s) => {
            const isBooked = myHistory.includes(s.id);
            const sessionState = sessionsData[s.id] || { booked: 0, isClosed: false };
            const isFull = (sessionState.booked || 0) >= s.spots;
            const isClosed = sessionState.isClosed;
            const isPast = isClassInPast(s.dayIdx, s.time); 
            
            const canBook = user.credits > 0 && !isBooked && !isFull && !isClosed && !isPast;
            
            return (
              <GlassCard key={s.id} className={`!p-8 transition-all duration-300 ${isBooked ? '!bg-[#EBF5F6]/80 !border-[#369EAD]/50' : (isClosed || isPast) ? 'opacity-50 grayscale' : 'hover:!bg-white/90'}`}>
                <div className="mb-6">
                  <div className="flex justify-between items-start font-sans">
                    <span className="text-[10px] uppercase font-black opacity-40">{s.day}</span>
                    {isClosed ? (
                      <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Feriado</span>
                    ) : isPast ? (
                      <span className="bg-gray-200 text-gray-500 text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest">Finalizada</span>
                    ) : null}
                  </div>
                  <h4 className="text-3xl font-sans italic font-bold">{s.time}</h4>
                  <p className="text-[10px] font-sans text-[#369EAD] font-bold uppercase tracking-widest mt-1">{s.teacher}</p>
                </div>
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100/50 font-sans">
                  <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={12} /> {sessionState.booked || 0}/{s.spots}</span>
                  {isBooked ? 
                    (isPast ? 
                      <span className="text-[9px] text-[#369EAD] font-bold uppercase italic opacity-60">Asistencia registrada</span> :
                      <button onClick={() => onCancel(s.id)} className="text-[10px] text-red-400 font-bold uppercase underline underline-offset-8 decoration-red-100">Cancelar</button>
                    ) :
                    <GlassButton onClick={() => onBook(s.id)} disabled={!canBook} className="!px-4 !py-2 !text-[9px]">
                      {isClosed ? 'Cerrado' : isPast ? 'Pasada' : isFull ? 'Lleno' : 'Reservar'}
                    </GlassButton>
                  }
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ students, teachers, sessionsData, settings, db, appId, onLogout, showNotification, extraGuests = [] }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null); 
  const [showStaffPassModal, setShowStaffPassModal] = useState(null);
  const [newPassValue, setNewPassValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempNotes, setTempNotes] = useState("");
  const [newStudent, setNewStudent] = useState({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '',registrationDate: new Date().toISOString().split('T')[0] });
  const [newStaff, setNewStaff] = useState({ id: '', name: '', password: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [paymentAmount, setPaymentAmount] = useState(0);
  const currentMonth = getCurrentMonthName();
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraGuest, setExtraGuest] = useState({ name: '', type: 'Clase Suelta' });
  const activeStudents = students.filter(s => s.status !== 'inactive');
  const [showCreditModal, setShowCreditModal] = useState(null);
  const [manualCredits, setManualCredits] = useState(1);

  // ... (HELPERS: getNextAvailableId, handleRegister, etc. se mantienen igual, solo cambia el return visual) ...
  // NOTA: Para no repetir código gigante, aquí uso las mismas funciones que ya tienes, pero 
  // asegúrate de que estén definidas dentro de este componente o fuera si son puras. 
  // Como están definidas en el original, aquí solo renderizo la vista actualizada.

  const getNextAvailableId = (list) => {
    const ids = list.map(s => s.id).filter(id => id.startsWith('BF-')).map(id => parseInt(id.split('-')[1])).filter(num => !isNaN(num));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `BF-${String(maxId + 1).padStart(3, '0')}`;
  };

  useEffect(() => { if (showAddForm) { const nextId = getNextAvailableId(students); setNewStudent(prev => ({ ...prev, id: nextId })); } }, [showAddForm, students]);
  const nextSession = getNextClassFromSchedule();
  const roster = students.filter(s => s.history?.includes(nextSession.id) && s.status !== 'inactive');
  const totalAlumnas = students.reduce((acc, s) => acc + (s.monthlyPayment || 0), 0);
  const totalExtras = extraGuests ? extraGuests.reduce((acc, g) => acc + (g.totalPaid || 0), 0) : 0;
  const totalIncome = totalAlumnas + totalExtras;

  // Handlers minificados para el ejemplo visual (usa los tuyos completos)
  const toggleSessionStatus = async (sessionId, currentStatus) => { if (!auth.currentUser) return; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId), { isClosed: !currentStatus }, { merge: true }); showNotification('Estado actualizado'); };
  const handleManualCreditUpdate = async () => { if (!auth.currentUser || !showCreditModal) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', showCreditModal), { credits: increment(parseInt(manualCredits)) }); showNotification(`Se agregaron ${manualCredits} créditos`); setShowCreditModal(null); setManualCredits(1); } catch (err) { showNotification('Error', 'error'); } };
  const handleMarkAttendance = async (studentId, sessionId) => { if (!auth.currentUser) return; if (!window.confirm("¿Confirmar asistencia?")) return; try { const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId); const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId); const sessionSnap = await getDoc(sessionRef); const sessionIsCounted = sessionSnap.exists() ? sessionSnap.data().isCounted : false; if (!sessionIsCounted) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'metadata'), { totalClassesTaught: increment(1) }); await setDoc(sessionRef, { isCounted: true }, { merge: true }); } await updateDoc(studentRef, { totalAttendance: increment(1), history: arrayRemove(sessionId) }); await updateDoc(sessionRef, { booked: increment(-1) }); showNotification('Asistencia confirmada'); } catch (err) { console.error(err); } };
  const handleAddExtraGuest = async (sessionId) => { if (!extraGuest.name.trim()) return showNotification("Escribe un nombre", "error"); try { const nameKey = extraGuest.name.trim().toUpperCase(); const guestRef = doc(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras', nameKey); const guestSnap = await getDoc(guestRef); if (guestSnap.exists()) { await updateDoc(guestRef, { totalVisits: increment(1), lastSessionId: sessionId, lastDate: new Date().toISOString(), totalPaid: increment(extraGuest.type === 'Clase Suelta' ? 150 : 0) }); } else { await setDoc(guestRef, { name: nameKey, type: extraGuest.type, totalVisits: 1, totalPaid: extraGuest.type === 'Clase Suelta' ? 150 : 0, firstVisit: new Date().toISOString(), lastSessionId: sessionId, status: 'prospect' }); } const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId); await setDoc(sessionRef, { booked: increment(1) }, { merge: true }); showNotification(guestSnap.exists() ? 'Visita recurrente' : 'Nueva invitada'); setShowExtraModal(false); setExtraGuest({ name: '', type: 'Clase Suelta' }); } catch (err) { showNotification('Error', 'error'); } };
  const handleToggleStatus = async (collectionName, id, currentStatus) => { if (!auth.currentUser) return; const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'; if (!window.confirm(`¿Cambiar estatus?`)) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { status: newStatus }); showNotification('Estatus actualizado'); } catch (err) { console.error(err); } };
  const handleUpdatePassword = async (collectionName, id) => { if (!auth.currentUser) return; if (!newPassValue.trim()) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { password: newPassValue.trim() }); showNotification('Contraseña actualizada'); setShowPassModal(null); setShowStaffPassModal(null); setNewPassValue(""); } catch (err) { console.error(err); } };
  const handleRegister = async (e) => { if (!auth.currentUser) return; e.preventDefault(); const cleanId = newStudent.id.trim().toUpperCase(); if (!cleanId || !newStudent.name || !newStudent.password) { showNotification('Completa los campos', 'error'); return; } setSaving(true); try { const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', cleanId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { showNotification(`ID ya usado`, 'error'); setSaving(false); return; } const max = parseInt(newStudent.plan.split(' ')[0]) || 2; await setDoc(docRef, { id: cleanId, name: newStudent.name.trim().toUpperCase(), password: newStudent.password, plan: newStudent.plan, maxCredits: max, credits: max, history: [], monthlyPayment: 0, totalAttendance: 0, notes: newStudent.notes.trim(), registrationDate: newStudent.registrationDate, status: 'active', }); showNotification('Registrada'); setShowAddForm(false); setNewStudent({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '' }); } catch (err) { console.error(err); } setSaving(false); };
  const handleUpdateStudentData = async (studentId) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId), { name: tempName.trim().toUpperCase(), registrationDate: tempDate, notes: tempNotes.trim() }); showNotification('Datos actualizados'); setEditingId(null); } catch (err) { showNotification('Error', 'error'); } };
  const handleRegisterStaff = async (e) => { if (!auth.currentUser) return; e.preventDefault(); const cleanId = newStaff.id.trim().toUpperCase(); if (!cleanId || !newStaff.name || !newStaff.password) { showNotification('Completa los campos', 'error'); return; } setSaving(true); try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maestros', cleanId), { ...newStaff, id: cleanId, name: newStaff.name.trim().toUpperCase(), status: 'active' }); showNotification('Staff registrado'); setShowStaffForm(false); setNewStaff({ id: '', name: '', password: '', role: 'teacher' }); } catch (err) { console.error(err); } setSaving(false); };
  const handlePayment = async () => { if (!auth.currentUser || !showPaymentModal) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', showPaymentModal), { monthlyPayment: parseFloat(paymentAmount) }); showNotification('Pago registrado'); setShowPaymentModal(null); setPaymentAmount(0); } catch (err) { console.error(err); } };
  const deleteStudent = async (id, name) => { if (!auth.currentUser) return; if (window.confirm(`¿Borrar a ${name}?`)) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', id)); showNotification('Eliminada'); } catch (err) { showNotification('Error', 'error'); } } };
  const deleteTeacher = async (id, name) => { if (!auth.currentUser) return; if (window.confirm(`¿Borrar a ${name}?`)) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maestros', id)); showNotification('Eliminado'); } catch (err) { showNotification('Error', 'error'); } } };

  return (
    <div className="pb-20 relative z-10">
      <nav className="bg-[#1A3A3E]/90 backdrop-blur-md text-white p-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-serif font-black tracking-tight">BF ADMIN</span>
          <span className="bg-[#C5A059] text-[#1A3A3E] text-[9px] font-sans px-2 py-0.5 rounded font-black uppercase">{currentMonth}</span>
        </div>
        <button onClick={onLogout} className="text-[10px] font-sans uppercase font-bold opacity-60 hover:opacity-100 tracking-widest">Cerrar Sesión</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <GlassCard className="lg:col-span-1 !bg-[#1A3A3E]/90 !border-[#C5A059] text-white">
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2">
                    <ClipboardList size={20} /> Roster
                  </h3>
                  <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest">
                    {nextSession?.day} {nextSession?.time}
                  </span>
                </div>
                <button 
                  onClick={() => setShowExtraModal(true)}
                  className="w-full py-3 bg-[#C5A059] text-[#1A3A3E] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <UserPlus size={14} /> + Invitada Extra
                </button>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.map((alumna) => (
                  <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-serif italic font-bold text-sm">{alumna.name}</span>
                        <span className="text-[9px] font-sans text-[#C5A059] font-black uppercase tracking-tighter">{alumna.id}</span>
                      </div>
                    </div>
                    <button onClick={() => handleMarkAttendance(alumna.id, nextSession.id)} className="p-2 bg-[#369EAD] text-white rounded-full hover:bg-white hover:text-[#369EAD] transition-all"><Check size={18} /></button>
                  </div>
                ))}
                {extraGuests && extraGuests.filter(g => g.sessionId === nextSession?.id).map((guest) => (
                  <div key={guest.id} className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl flex justify-between items-center gap-4 border-l-4 border-l-[#C5A059]">
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <span className="font-serif italic font-bold text-sm text-[#C5A059]">{guest.name}</span>
                        <span className="text-[8px] font-sans uppercase font-black opacity-60">{guest.type}</span>
                      </div>
                    </div>
                    <button onClick={async () => { if(window.confirm("¿Eliminar?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras', guest.id)); const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', nextSession.id); await updateDoc(sessionRef, { booked: increment(-1) }); showNotification("Eliminada"); }}} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
                {roster.length === 0 && (!extraGuests || extraGuests.filter(g => g.sessionId === nextSession?.id).length === 0) && (
                  <div className="text-center py-10 opacity-30 italic text-sm">No hay nadie anotado</div>
                )}
              </div>
           </GlassCard>

           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <GlassCard className="!bg-[#1A3A3E]/90 !border-[#C5A059] text-white flex items-center gap-6 group">
                <div className="p-4 bg-[#C5A059] rounded-xl text-[#1A3A3E] group-hover:rotate-6 transition-transform">
                  <DollarSign size={28} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1 flex justify-between">
                    <span>Caja {currentMonth}</span>
                    <span className="text-[#C5A059] opacity-70">Incluye ${totalExtras} de extras</span>
                  </p>
                  <p className="text-3xl font-bold text-[#C5A059]">${totalIncome.toLocaleString()}</p>
                </div>
              </GlassCard>

              <GlassCard className="!bg-[#1A3A3E]/90 border-none text-white text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <PartyPopper className="text-[#C5A059] mx-auto mb-4 animate-bounce" size={40} />
                <h3 className="text-2xl font-serif italic mb-2">¡Sigue creciendo!</h3>
                <p className="text-[11px] uppercase font-bold tracking-[0.2em] opacity-60 px-4">Cada alumna nueva es un paso más</p>
              </GlassCard>

              <GlassCard className="flex items-center gap-6 !border-[#369EAD] group">
                <div className="p-4 bg-[#369EAD] text-white rounded-xl group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Impacto Total</p>
                  <p className="text-3xl font-bold">{settings?.totalClassesTaught || 0} clases dadas</p>
                </div>
              </GlassCard>
              <GlassCard className="!bg-[#EBF5F6]/50 border-white flex items-center gap-6 md:col-span-2">
                <div className="p-4 bg-[#369EAD] rounded-xl text-white"><Users size={28} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Comunidad Activa</p>
                  <p className="text-3xl font-bold text-[#369EAD]">{activeStudents.length} Alumnas pagando</p>
                </div>
              </GlassCard>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="border-[#C5A059]">
              <h3 className="text-lg font-serif italic font-bold mb-4 flex items-center gap-2 text-[#1A3A3E]"><Info size={18} className="text-[#C5A059]" /> Tarifario</h3>
              <div className="space-y-3 font-sans text-[11px]">
                {PRICES.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-100/50 pb-2">
                    <span className="text-gray-400 uppercase font-bold">{p.plan}</span>
                    <span className="font-bold text-[#369EAD]">${p.price}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="border-[#369EAD]">
              <h3 className="text-lg font-serif italic font-bold mb-4">Estatus Clases</h3>
              <div className="space-y-4 font-sans text-xs">
                {WEEKLY_SCHEDULE.map(s => {
                  const isClosed = sessionsData[s.id]?.isClosed || false;
                  return (
                    <div key={s.id} className="flex justify-between items-center">
                      <span className="font-bold opacity-60 uppercase">{s.day}</span>
                      <button onClick={() => toggleSessionStatus(s.id, isClosed)}>
                        {isClosed ? <ToggleLeft size={30} className="text-red-300" /> : <ToggleRight size={30} className="text-[#369EAD]" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden font-sans">
              <div className="p-6 border-b border-gray-100/50 bg-[#1A3A3E]/5 flex justify-between items-center">
                <h3 className="font-serif font-bold italic text-[#1A3A3E] flex items-center gap-2"><ShieldCheck size={20} className="text-[#369EAD]"/> Control Maestras</h3>
                <GlassButton onClick={() => setShowStaffForm(true)} className="!px-4 !py-2 !text-[9px]">Nuevo Staff</GlassButton>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[9px] uppercase text-gray-400 font-black">
                    <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4 text-center">Clave</th><th className="px-6 py-4 text-right pr-10">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {teachers.map((t) => (
                      <tr key={t.id} className={`hover:bg-white/50 text-sm ${t.status === 'inactive' ? 'opacity-40' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${t.role === 'admin' ? 'bg-[#C5A059]' : 'bg-[#369EAD]'}`}></div>
                            <div><div className="font-bold font-serif italic">{t.name}</div><div className="text-[9px] uppercase text-gray-400">{t.id} • {t.role}</div></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#C5A059]">{t.password}</td>
                        <td className="px-6 py-4 text-right pr-8 space-x-1">
                          <button onClick={() => setShowStaffPassModal(t.id)} className="p-2 text-gray-400 hover:text-[#C5A059]"><Key size={16}/></button>
                          <button onClick={() => handleToggleStatus('maestros', t.id, t.status)} className={`p-2 rounded-full ${t.status === 'inactive' ? 'text-green-500' : 'text-red-400'}`}>
                            {t.status === 'inactive' ? <UserCheck size={16}/> : <UserX size={16}/>}
                          </button>
                          <button onClick={() => deleteTeacher(t.id, t.name)} className="p-2 text-red-200 hover:text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden font-sans">
              <div className="p-6 border-b border-gray-100/50 bg-gray-50/30 flex justify-between items-center">
                <h3 className="font-serif font-bold italic text-[#1A3A3E]">Control Alumnas</h3>
                <GlassButton onClick={() => setShowAddForm(true)} className="!px-4 !py-2 !text-[9px]">Registrar</GlassButton>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[9px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="px-6 py-5">Nombre</th>
                      <th className="px-6 py-5 text-center">Clave</th>
                      <th className="px-6 py-5 text-center">Créditos</th>
                      <th className="px-6 py-5 text-center">Asis.</th>
                      <th className="px-6 py-5 text-center">Pago</th>
                      <th className="px-6 py-5 text-right pr-10">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {students.map((s) => {
                      const isInactive = s.status === 'inactive';
                      return (
                        <tr key={s.id} className={`hover:bg-white/50 transition-all text-sm ${isInactive ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#369EAD] bg-[#EBF5F6]/80 px-2 py-0.5 rounded-sm w-fit mb-1">{s.id}</span>
                            {editingId === s.id ? (
                            <div className="space-y-2 bg-gray-50/80 p-2 rounded-xl border border-[#369EAD]/30 animate-in fade-in duration-300">
                            <div>
                              <label className="text-[8px] font-black text-gray-400 uppercase">Nombre</label>
                            <input type="text" className="w-full font-bold font-serif italic border-b border-[#369EAD] outline-none bg-transparent text-[#1A3A3E] uppercase" value={tempName} onChange={(e) => setTempName(e.target.value)} />
                            </div>
                            <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase">Fecha Inscripción</label>
                            <input type="date" className="w-full text-xs font-sans border-b border-gray-300 outline-none bg-transparent text-gray-600" value={tempDate} onChange={(e) => setTempDate(e.target.value)} />
                            </div>
                            <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase">Notas Médicas</label>
                            <textarea className="w-full text-[10px] border-b border-gray-300 outline-none bg-transparent text-red-400 italic" value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} />
                            </div>
                            <div className="flex gap-2 pt-1">
                            <button onClick={() => handleUpdateStudentData(s.id)} className="text-[8px] bg-[#369EAD] text-white px-3 py-1 font-black uppercase tracking-widest rounded-md">Guardar</button>
                            <button onClick={() => setEditingId(null)} className="text-[8px] bg-gray-200 text-gray-500 px-3 py-1 font-black uppercase tracking-widest rounded-md">Cancelar</button>
                            </div>
                            </div>
                            ) : (
                              <>
                              <div className="font-bold font-serif italic text-[#1A3A3E] text-base">{s.name}</div>
                              <div className="text-[9px] text-gray-400 font-sans uppercase tracking-tighter flex items-center gap-1 mt-1">
                              <Calendar size={10} /> Inscrita: {s.registrationDate || 'Sin fecha'}
                              </div>
                              {s.notes && (
                              <div className="text-[10px] text-red-400 italic flex items-center gap-1 mt-1 bg-red-50/50 w-fit px-1 rounded-sm">
                              <Stethoscope size={10}/> {s.notes}
                        </div>
                      )}
                    </>
                    )}
                  </div>
                  </td>
                            <td className="px-6 py-5 text-center font-mono text-xs font-bold text-[#369EAD]">
                                {s.password}
                            </td>
                          <td className="px-6 py-5 text-center font-bold">
                            <span className={s.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}>{s.credits}</span> / {s.maxCredits}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-xs bg-[#1A3A3E] text-white px-2 py-1 rounded-sm font-bold">{s.totalAttendance || 0}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button onClick={() => { setShowPaymentModal(s.id); setPaymentAmount(s.monthlyPayment || 0); }}
                              className={`font-bold px-3 py-1 rounded text-xs transition-colors ${s.monthlyPayment > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                              ${s.monthlyPayment || 0}
                            </button>
                          </td>
                          <td className="px-6 py-5 text-right pr-8 space-x-1">
                            <button onClick={() => { setEditingId(s.id); setTempName(s.name); setTempDate(s.registrationDate || ""); setTempNotes(s.notes || ""); }} className="p-2 text-gray-400 hover:text-[#369EAD]">
                           <UserPlus size={16} />
                           </button>
                            <button onClick={() => setShowPassModal(s.id)} className="p-2 text-gray-400 hover:text-[#C5A059]"><Key size={16} /></button>
                            <button onClick={() => handleToggleStatus('alumnas', s.id, s.status)} className={`p-2 rounded-full ${isInactive ? 'text-green-500' : 'text-gray-300'}`}>
                              {isInactive ? <UserCheck size={16}/> : <UserX size={16}/>}
                            </button>
                            <button onClick={() => {setShowCreditModal(s.id);setManualCredits(1); }} className="p-2 text-[#369EAD] hover:bg-[#EBF5F6] rounded-full transition-all" title="Sumar créditos"> <RefreshCw size={16}/></button>
                            <button onClick={() => deleteStudent(s.id, s.name)} className="p-2 text-red-200 hover:text-red-500"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden font-sans mt-12">
            <div className="p-6 border-b border-[#C5A059]/20 bg-[#C5A059]/5 flex justify-between items-center">
              <h3 className="font-serif font-bold italic text-[#1A3A3E] flex items-center gap-2">
                <Users size={20} className="text-[#C5A059]"/> Historial de Invitadas
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-black">Recaudación Sueltas</p>
                <p className="text-xl font-bold text-[#C5A059]">
                  ${extraGuests ? extraGuests.reduce((acc, g) => acc + (g.totalPaid || 0), 0).toLocaleString() : 0}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[9px] uppercase text-gray-400 font-black">
                  <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4 text-center">Visitas</th><th className="px-6 py-4 text-center">Tipo</th><th className="px-6 py-4 text-center">$$</th><th className="px-6 py-4 text-right pr-10">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50">
                  {extraGuests && extraGuests.length > 0 ? extraGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-white/50 text-sm">
                      <td className="px-6 py-4">
                        <div className="font-bold font-serif italic text-[#1A3A3E]">{guest.name}</div>
                        <div className="text-[9px] text-gray-400 uppercase">{guest.firstVisit ? `Desde: ${new Date(guest.firstVisit).toLocaleDateString()}` : 'Registro antiguo'}</div>
                      </td>
                      <td className="px-6 py-4 text-center"><span className="bg-[#1A3A3E] text-white px-2 py-0.5 rounded-full text-xs font-bold">{guest.totalVisits || 1}</span></td>
                      <td className="px-6 py-4 text-center text-[10px] font-black uppercase">{guest.type}</td>
                      <td className="px-6 py-4 text-center"><span className="text-green-600 font-bold">${guest.totalPaid || 0}</span></td>
                      <td className="px-6 py-4 text-right pr-8 space-x-2">
                        <button onClick={() => { if(window.confirm(`¿Convertir a ${guest.name}?`)) { setNewStudent({ ...newStudent, name: guest.name }); setShowAddForm(true); } }} className="p-2 text-[#369EAD] hover:bg-[#EBF5F6] rounded-full transition-all"><UserCheck size={18} /></button>
                        <button onClick={async () => { if(window.confirm("¿Borrar historial?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras', guest.id)); showNotification("Borrado"); } }} className="p-2 text-red-200 hover:text-red-500 rounded-full transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )) : (<tr><td colSpan="5" className="text-center py-10 opacity-30 italic text-sm">No hay registro</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        </div>
      </div>
      
      {/* MODALES ESTILO CRISTAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-md p-10 rounded-3xl shadow-2xl relative border border-white/50">
            <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X size={28} /></button>
            <h3 className="text-2xl font-serif italic mb-6 border-b pb-2">Nueva Alumna</h3>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none uppercase text-sm font-bold text-[#369EAD]" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} placeholder="ID" />
                <input type="text" required placeholder="CLAVE" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-sm font-bold" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
              </div>
              <input type="text" required placeholder="NOMBRE COMPLETO" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none uppercase text-sm font-serif italic font-bold" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              <select className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-sm" value={newStudent.plan} onChange={e => setNewStudent({...newStudent, plan: e.target.value})}>
                {PRICES.slice(0, 4).map((p, i) => <option key={i} value={p.plan}>{p.plan}</option>)}
              </select>
              <div className="space-y-1">
                <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">Fecha de Inscripción</label>
                  <input type="date" required className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-sm font-bold text-[#1A3A3E]" value={newStudent.registrationDate} onChange={e => setNewStudent({...newStudent, registrationDate: e.target.value})} />
              </div>
              <textarea placeholder="NOTAS MÉDICAS" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-xs h-24 italic" value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
              <GlassButton disabled={saving} className="w-full !py-4">{saving ? <Loader2 className="animate-spin mx-auto" /> : "Guardar Registro"}</GlassButton>
            </form>
          </div>
        </div>
      )}
      {/* (Agrega el resto de modales (staff, password, pago, extra, credit) siguiendo el mismo patrón de bg-white/90 y rounded-3xl) */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-md p-10 rounded-3xl shadow-2xl relative border border-white/50">
            <button onClick={() => setShowStaffForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X size={28} /></button>
            <h3 className="text-2xl font-serif italic mb-6 border-b pb-2">Nuevo Staff</h3>
            <form onSubmit={handleRegisterStaff} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="ID" className="p-4 bg-gray-50/50 rounded-xl outline-none uppercase text-xs font-bold border border-gray-200" value={newStaff.id} onChange={e => setNewStaff({...newStaff, id: e.target.value})} />
                <input type="text" required placeholder="CLAVE" className="p-4 bg-gray-50/50 rounded-xl outline-none text-xs font-bold border border-gray-200" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <input type="text" required placeholder="NOMBRE" className="w-full p-4 bg-gray-50/50 rounded-xl outline-none uppercase text-xs font-serif italic border border-gray-200" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              <select className="w-full p-4 bg-gray-50/50 rounded-xl outline-none text-xs border border-gray-200" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                <option value="teacher">Maestra</option>
                <option value="admin">Admin Secundario</option>
              </select>
              <GlassButton disabled={saving} className="w-full !py-4">{saving ? <Loader2 className="animate-spin mx-auto" /> : "Guardar Registro"}</GlassButton>
            </form>
          </div>
        </div>
      )}
      
      {(showPassModal || showStaffPassModal) && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50 text-center">
            <h3 className="text-xl font-serif italic mb-2">Nueva Clave</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-6">{showPassModal || showStaffPassModal}</p>
            <div className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-center font-bold" placeholder="Nueva clave" value={newPassValue} onChange={e => setNewPassValue(e.target.value)} />
              <GlassButton onClick={() => handleUpdatePassword(showPassModal ? 'alumnas' : 'maestros', showPassModal || showStaffPassModal)} className="w-full !py-4">Actualizar</GlassButton>
              <button onClick={() => { setShowPassModal(null); setShowStaffPassModal(null); setNewPassValue(""); }} className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50">
            <h3 className="text-xl font-serif italic mb-6 text-center">Registrar Pago</h3>
            <div className="space-y-4 text-center">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="number" className="w-full p-4 pl-10 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-xl font-bold" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              <GlassButton onClick={handlePayment} className="w-full !py-4">Confirmar</GlassButton>
              <button onClick={() => setShowPaymentModal(null)} className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showExtraModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50">
            <h3 className="text-xl font-serif italic mb-6 text-center text-[#1A3A3E]">Invitada Extra</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Nombre Completo</label>
                <input type="text" className="w-full p-3 bg-gray-50/50 rounded-xl border border-gray-200 outline-none font-bold uppercase text-sm" value={extraGuest.name} onChange={e => setExtraGuest({...extraGuest, name: e.target.value})} placeholder="Ingresa nombre" autoFocus />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Tipo de Ingreso</label>
                <select className="w-full p-3 bg-gray-50/50 rounded-xl border border-gray-200 outline-none font-bold text-sm" value={extraGuest.type} onChange={e => setExtraGuest({...extraGuest, type: e.target.value})}>
                  <option value="Clase Suelta">Clase Suelta ($)</option>
                  <option value="Clase de Prueba">Clase de Prueba (Gratis)</option>
                </select>
              </div>
              <GlassButton onClick={() => handleAddExtraGuest(nextSession.id)} className="w-full !py-4">Registrar Asistencia</GlassButton>
              <button onClick={() => setShowExtraModal(false)} className="w-full text-[10px] uppercase font-bold text-gray-400 hover:text-red-400 mt-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50">
            <h3 className="text-xl font-serif italic mb-2 text-center text-[#1A3A3E]">Ajuste de Créditos</h3>
            <p className="text-[10px] text-center text-gray-400 uppercase font-black mb-6">ID: {showCreditModal}</p>
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setManualCredits(Math.max(1, manualCredits - 1))} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:bg-gray-50"> - </button>
                <span className="text-4xl font-sans font-bold text-[#369EAD]">{manualCredits}</span>
                <button onClick={() => setManualCredits(manualCredits + 1)} className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:bg-gray-50"> + </button>
              </div>
              <p className="text-[9px] text-center text-gray-400 italic">Esto sumará los créditos a los que la alumna ya tenga disponibles actualmente.</p>
              <GlassButton onClick={handleManualCreditUpdate} className="w-full !py-4">Confirmar y Sumar</GlassButton>
              <button onClick={() => setShowCreditModal(null)} className="w-full text-[10px] uppercase font-bold text-gray-400 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Teacher Dashboard (Similares cambios visuales: bg-white/70, rounded-2xl, backdrop-blur)
const TeacherDashboard = ({ user, students, sessionsData, db, appId, onLogout, showNotification, onUpdatePassword }) => {
  const currentMonth = getCurrentMonthName();
  const teacherClasses = WEEKLY_SCHEDULE.filter(s => s.teacher.toUpperCase() === user.firstName.toUpperCase());
  const nextSession = getNextClassFromSchedule(user.firstName);
  const roster = students.filter(s => s.history?.includes(nextSession?.id) && s.status !== 'inactive');
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");
  const handleMarkAttendance = async (studentId, sessionId) => { if (!auth.currentUser) return; if (!window.confirm("¿Confirmar asistencia?")) return; try { const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId); const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId); const sessionSnap = await getDoc(sessionRef); const sessionIsCounted = sessionSnap.exists() ? sessionSnap.data().isCounted : false; if (!sessionIsCounted) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'metadata'), { totalClassesTaught: increment(1) }); await setDoc(sessionRef, { isCounted: true }, { merge: true }); } await updateDoc(studentRef, { totalAttendance: increment(1), history: arrayRemove(sessionId) }); await updateDoc(sessionRef, { booked: increment(-1) }); showNotification('Asistencia marcada'); } catch (err) { console.error(err); } };

  return (
    <div className="pb-20 relative z-10">
      <nav className="bg-[#1A3A3E]/90 backdrop-blur-md text-white p-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl font-serif font-black tracking-tight uppercase">Portal Maestras</span>
          <span className="bg-[#369EAD] text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">{user.firstName}</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowPassModal(true)} className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100 tracking-widest flex items-center gap-2"><Key size={14}/> Clave</button>
          <button onClick={onLogout} className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100 tracking-widest">Cerrar Sesión</button>
        </div>
        {showPassModal && (
          <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50 text-center">
              <h3 className="text-xl font-serif italic mb-2 text-[#1A3A3E]">Cambiar mi clave</h3>
              <input type="text" className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-center font-bold mb-6 text-[#1A3A3E]" value={newPass} onChange={e => setNewPass(e.target.value)} />                
              <GlassButton onClick={() => { onUpdatePassword('maestros', user.id, newPass); setShowPassModal(false); setNewPass(""); }} className="w-full">Actualizar</GlassButton>
              <button onClick={() => setShowPassModal(false)} className="mt-4 text-[10px] uppercase font-bold text-gray-400">Cerrar</button>
            </div>
          </div>
        )}      
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="mb-10 text-center md:text-left">
           <h2 className="text-4xl font-serif italic text-[#1A3A3E] font-bold">¡Hola, {user.firstName}!</h2>
           <p className="text-[#369EAD] text-sm font-sans uppercase tracking-widest">Tu pasión no solo mueve pesas, mueve vidas enteras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <GlassCard className="border-[#C5A059] flex items-center gap-6">
              <div className="p-4 bg-[#C5A059] text-[#1A3A3E] rounded-xl"><BookOpen size={28} /></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Disciplina</p><p className="text-2xl font-serif italic font-bold">Ballet Fit Master</p></div>
          </GlassCard>
          <GlassCard className="!bg-[#EBF5F6]/50 border-[#369EAD] flex items-center gap-6">
            <div className="p-4 bg-[#369EAD] text-white rounded-xl"><Trophy size={28} /></div>
            <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Impacto</p><p className="text-3xl font-bold text-[#369EAD]">Enseñando</p></div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <GlassCard className="lg:col-span-1 !bg-[#1A3A3E]/90 !border-[#C5A059] text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2"><ClipboardList size={20} /> Asistencia</h3>
                {nextSession && <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-bold uppercase">{nextSession.day} {nextSession.time}</span>}
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.length > 0 ? roster.map((alumna) => (
                  <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="font-serif italic font-bold text-sm">{alumna.name}</div>
                      {alumna.notes && <div className="mt-2 flex items-start gap-2 text-red-300"><Stethoscope size={12}/><p className="text-[10px] italic">{alumna.notes}</p></div>}
                    </div>
                    <button onClick={() => handleMarkAttendance(alumna.id, nextSession.id)} className="p-2 bg-[#369EAD] hover:bg-white hover:text-[#369EAD] text-white rounded-full transition-all shadow-lg"><Check size={18} /></button>
                  </div>
                )) : <div className="text-center py-10 opacity-30 italic text-sm">No hay inscritas</div>}
              </div>
           </GlassCard>

           <div className="lg:col-span-2 space-y-8">
              <GlassCard>
                <h3 className="text-xl font-serif italic font-bold mb-6 flex items-center gap-2 text-[#1A3A3E]"><Calendar size={20} className="text-[#369EAD]" /> Horario</h3>
                <div className="grid grid-cols-1 gap-4">
                   {teacherClasses.map(s => (
                      <div key={s.id} className="p-10 bg-gray-50/50 rounded-2xl border-l-8 border-[#369EAD] flex flex-col justify-center">
                         <span className="text-xs font-black uppercase text-gray-400">{s.day}</span>
                         <p className="text-5xl font-bold text-[#1A3A3E] my-2">{s.time}</p>
                         <p className="text-sm text-[#369EAD] font-bold uppercase">{s.type}</p>
                      </div>
                   ))}
                </div>
              </GlassCard>
           </div>
        </div>
      </div>
    </div>
  );
};