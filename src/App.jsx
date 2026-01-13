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
  query,
  where,
  writeBatch
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
  Loader2,
  ToggleLeft,
  ToggleRight,
  DollarSign, 
  TrendingUp,
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
  ShieldCheck,
  Tag
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

// --- COMPONENTES UI ---
const Card = ({ children, className = '' }) => (
  <div className={`rounded-sm shadow-md border-t-4 border-[#369EAD] p-6 bg-white transition-all hover:shadow-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-6 py-2 rounded-sm font-sans font-medium tracking-widest uppercase text-xs transition-all transform active:scale-95 flex items-center justify-center gap-2";
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

// --- UTILIDADES ---
const getHoursUntilClass = (dayIdx, timeStr) => {
  const now = new Date();
  const classTime = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  let daysToAdd = (dayIdx - now.getDay() + 7) % 7;
  if (daysToAdd === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const classMinutesTotal = hours * 60 + minutes;
    if (nowMinutes > classMinutesTotal) daysToAdd = 7;
  }
  classTime.setDate(now.getDate() + daysToAdd);
  classTime.setHours(hours, minutes, 0, 0);
  const diffMs = classTime - now;
  return diffMs / (1000 * 60 * 60);
};

const getISOWeekNumber = (date) => {
  const tdt = new Date(date.valueOf());
  // Ajuste para que el domingo sea el inicio del cambio de semana
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

  // RUTAS CONSTANTES (Regla 1 - Corregidas para segmentos pares)
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

        // Escuchar Alumnas
        const unsubStudents = onSnapshot(studentsCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setStudents(list);
          setLoading(false);
        });

        // Escuchar Maestras
        const unsubTeachers = onSnapshot(teachersCol, (snapshot) => {
          const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setTeachers(list);
        });

        // Escuchar Sesiones
        const unsubSessions = onSnapshot(sessionsCol, (snapshot) => {
          const data = {};
          snapshot.docs.forEach(d => data[d.id] = d.data());
          setSessionsData(data);
        });

        // Escuchar Configuración
        const unsubSettings = onSnapshot(settingsDoc, (snapshot) => {
          if (snapshot.exists()) {
            setSettings(snapshot.data());
          } else {
            setDoc(settingsDoc, { totalClassesTaught: 0, lastResetWeek: 0 }, { merge: true });
          }
        });

        // --- AQUÍ ESTABA EL ERROR: Sacamos el extraCol de adentro del otro ---
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
          unsubExtra(); // <-- Limpiamos la conexión al cerrar
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
      // Actualizamos el estado local del usuario para que se refleje el cambio
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

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#369EAD] animate-pulse bg-white italic text-xl">Ballet Fit...</div>;

  return (
    <div className="font-serif text-[#1A3A3E] antialiased bg-[#F8FAFC] min-h-screen">
      {notification && (
        <div className={`fixed top-4 right-4 z-[150] px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 border-l-4 ${notification.type === 'error' ? 'bg-red-500 text-white border-red-700' : 'bg-[#1A3A3E] text-white border-[#369EAD]'}`}>
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

// --- VISTAS ---

const LoginView = ({ onLogin, error }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative" 
         style={{ backgroundImage: 'linear-gradient(rgba(26, 58, 62, 0.7), rgba(26, 58, 62, 0.5)), url("https://images.unsplash.com/photo-1516515865486-4447488dc476?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-sm shadow-2xl border-t-8 border-[#369EAD]">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl text-[#1A3A3E] mb-1 italic font-bold">Ballet Fit</h1>
            <span className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#369EAD] font-bold font-black">Portal alumnas</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(id, password); }} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">ID o Usuario</label>
              <input type="text" required placeholder="Ingresa tu ID" className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-sans uppercase text-sm" value={id} onChange={e => setId(e.target.value)} />
            </div>
            <div className="space-y-1 relative">
              <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">Contraseña</label>
              <input type={showPass ? "text" : "password"} required placeholder="••••••••" className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-sans text-sm" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-gray-300 hover:text-[#369EAD]">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="text-red-500 font-sans text-[10px] text-center font-bold animate-pulse leading-tight bg-red-50 p-2 rounded-sm border border-red-100">{error}</div>}
            <button type="submit" className="w-full bg-[#1A3A3E] text-white py-5 font-sans uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[#369EAD] transition-all shadow-lg active:scale-95">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

//-----------------------------
// --- Panel de estudiantes ---
//-----------------------------

const StudentDashboard = ({ user, quote, sessions, sessionsData, onBook, onCancel, onLogout, onUpdatePassword }) => {
  const myHistory = user.history || [];
  const mySessions = sessions.filter(s => myHistory.includes(s.id));
  const nextClass = mySessions.length > 0 ? mySessions[0] : null;
  const currentMonth = getCurrentMonthName();
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");
  
  return (
    <div className="pb-20">
      <nav className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-2">
          <span className="text-2xl text-[#369EAD] font-serif font-black">BF</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPassModal(true)} className="text-gray-400 hover:text-[#369EAD] text-[10px] font-sans uppercase font-bold flex items-center gap-2 tracking-widest">
              <Key size={16} /> <span>Mi Clave</span>
            </button>
            <button onClick={onLogout} className="text-gray-400 hover:text-[#369EAD] text-[10px] font-sans uppercase font-bold flex items-center gap-2 tracking-widest">
              <span>Salir</span><LogOut size={16} />
            </button>
          </div>
          {showPassModal && (
            <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#369EAD] text-center">
                 <h3 className="text-xl font-serif italic mb-2">Mi Nueva Clave</h3>
                 <input type="text" className="w-full p-4 bg-gray-50 border-b border-gray-200 outline-none text-center font-bold mb-4" placeholder="Escribe aquí" value={newPass} onChange={e => setNewPass(e.target.value)} />
                 <Button onClick={() => { onUpdatePassword('alumnas', user.id, newPass); setShowPassModal(false); }} className="w-full !py-4">Actualizar</Button>
                 <button onClick={() => setShowPassModal(false)} className="mt-4 text-[10px] uppercase font-bold text-gray-300">Cerrar</button>
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
          <Card className="md:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-serif text-[#1A3A3E] italic">Resumen de {currentMonth}</h3>
              </div>
              <div className="p-3 rounded-full text-[#369EAD]">
                <Activity size={24} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#EBF5F6] px-6 py-4 rounded-sm border border-[#369EAD]/10">
                <span className="block text-[9px] font-sans uppercase tracking-widest text-gray-500 font-bold mb-1">Clases de la semana</span>
                <div className="flex items-baseline gap-1 font-sans">
                  <span className={`text-4xl font-bold ${user.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{user.credits}</span>
                  <span className="text-gray-300 text-lg">/ {user.maxCredits}</span>
                </div>
              </div>
              <div className="bg-[#1A3A3E] px-6 py-4 rounded-sm border border-[#C5A059]/20 text-white">
                <span className="block text-[9px] font-sans uppercase tracking-widest text-[#C5A059] font-bold mb-1 text-opacity-80">Total Histórico</span>
                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-4xl font-bold text-[#C5A059]">{user.totalAttendance || 0}</span>
                  <span className="text-[#C5A059] text-xs text-opacity-50 ml-1">Sesiones</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-[#1A3A3E] border-none text-white text-center flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
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
          </Card>
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
              <div key={s.id} className={`p-8 rounded-sm border transition-all duration-300 ${isBooked ? 'bg-[#EBF5F6] border-[#369EAD] ring-1 ring-[#369EAD]/20' : (isClosed || isPast) ? 'bg-gray-50 opacity-60 border-gray-200' : 'bg-white border-gray-100 hover:shadow-lg'}`}>
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
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-50 font-sans">
                  <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Users size={12} /> {sessionState.booked || 0}/{s.spots}</span>
                  {isBooked ? 
                    (isPast ? 
                      <span className="text-[9px] text-[#369EAD] font-bold uppercase italic opacity-60">Asistencia registrada</span> :
                      <button onClick={() => onCancel(s.id)} className="text-[10px] text-red-400 font-bold uppercase underline underline-offset-8 decoration-red-100">Cancelar</button>
                    ) :
                    <Button onClick={() => onBook(s.id)} disabled={!canBook} className="!px-4 !py-2 !text-[9px]">
                      {isClosed ? 'Cerrado' : isPast ? 'Pasada' : isFull ? 'Lleno' : 'Reservar'}
                    </Button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// ----------------------------------------
//---------- Panel de Jenny----------------
//-----------------------------------------
const AdminDashboard = ({ students, teachers, sessionsData, settings, db, appId, onLogout, showNotification, extraGuests = [] }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null); 
  const [showStaffPassModal, setShowStaffPassModal] = useState(null);
  const [newPassValue, setNewPassValue] = useState("");
  const [editingDateId, setEditingDateId] = useState(null);
  const [tempDate, setTempDate] = useState("");
  const [tempNotes, setTempNotes] = useState(""); // Agrega esta línea debajo de tempDate
  const [editingId, setEditingId] = useState(null); // Para saber qué alumna estamos editando
  const [tempName, setTempName] = useState("");     // Para guardar el nombre mientras se escribe
  const [newStudent, setNewStudent] = useState({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '',registrationDate: new Date().toISOString().split('T')[0] });
  const [newStaff, setNewStaff] = useState({ id: '', name: '', password: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [paymentAmount, setPaymentAmount] = useState(0);
  const currentMonth = getCurrentMonthName();
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraGuest, setExtraGuest] = useState({ name: '', type: 'Clase Suelta' });
  const activeStudents = students.filter(s => s.status !== 'inactive');
  const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'metadata');

  const getNextAvailableId = (list) => {
    const ids = list
      .map(s => s.id)
      .filter(id => id.startsWith('BF-'))
      .map(id => parseInt(id.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const nextNum = maxId + 1;
    return `BF-${String(nextNum).padStart(3, '0')}`;
  };

  useEffect(() => {
    if (showAddForm) {
      const nextId = getNextAvailableId(students);
      setNewStudent(prev => ({ ...prev, id: nextId }));
    }
  }, [showAddForm, students]);

  useEffect(() => {
    const checkWeeklyReset = async () => {
      if (!auth.currentUser) return;
      const currentWeek = getISOWeekNumber(new Date());
      
      try {
        const docSnap = await getDoc(settingsDocRef);
        let lastResetWeek = 0;
        
        if (docSnap.exists()) {
          lastResetWeek = docSnap.data().lastResetWeek || 0;
        }

        if (currentWeek !== lastResetWeek && students.length > 0) {
          const batch = writeBatch(db);
          
          activeStudents.forEach(s => {
            const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', s.id);
            batch.update(studentRef, {
              credits: s.maxCredits,
              history: []
            });
          });

          WEEKLY_SCHEDULE.forEach(session => {
            const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', session.id);
            batch.set(sessionRef, { booked: 0, isCounted: false }, { merge: true });
          });

          await setDoc(settingsDocRef, { lastResetWeek: currentWeek }, { merge: true });
          await batch.commit();
          showNotification('¡Semana reiniciada!', 'success');
        }
      } catch (err) {
        console.error("Error in auto-reset:", err);
      }
    };

    if (students.length > 0) {
      checkWeeklyReset();
    }
  }, [students.length]);

  const nextSession = getNextClassFromSchedule();
  const roster = students.filter(s => s.history?.includes(nextSession.id) && s.status !== 'inactive');
  const totalIncome = students.reduce((acc, s) => acc + (s.monthlyPayment || 0), 0);

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId), { isClosed: !currentStatus }, { merge: true });
    showNotification('Estado actualizado');
  };

  const handleMarkAttendance = async (studentId, sessionId) => {
    if (!auth.currentUser) return;
    if (!window.confirm("¿Confirmar asistencia?")) return;
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId);
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId);
      
      const sessionSnap = await getDoc(sessionRef);
      const sessionIsCounted = sessionSnap.exists() ? sessionSnap.data().isCounted : false;

      if (!sessionIsCounted) {
        await updateDoc(settingsDocRef, { totalClassesTaught: increment(1) });
        await setDoc(sessionRef, { isCounted: true }, { merge: true });
      }

      await updateDoc(studentRef, { 
        totalAttendance: increment(1),
        history: arrayRemove(sessionId) 
      });
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification('Asistencia confirmada');
    } catch (err) { console.error(err); }
  };

  const handleAddExtraGuest = async (sessionId) => {
    if (!extraGuest.name.trim()) return showNotification("Escribe un nombre", "error");
    
    try {
      // 1. Guardamos el registro de la invitada
      const extraRef = collection(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras');
      await setDoc(doc(extraRef), {
        sessionId,
        name: extraGuest.name.trim().toUpperCase(),
        type: extraGuest.type,
        date: new Date().toISOString()
      });

      // 2. Sumamos un lugar al cupo de la sesión actual
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId);
      await setDoc(sessionRef, { booked: increment(1) }, { merge: true });

      showNotification('Invitada agregada');
      setShowExtraModal(false);
      setExtraGuest({ name: '', type: 'Clase Suelta' });
    } catch (err) {
      showNotification('Error al agregar', 'error');
    }
  };

  const handleToggleStatus = async (collectionName, id, currentStatus) => {
    if (!auth.currentUser) return;
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    if (!window.confirm(`¿Cambiar estatus?`)) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { status: newStatus });
      showNotification('Estatus actualizado');
    } catch (err) { console.error(err); }
  };

  const handleUpdatePassword = async (collectionName, id) => {
    if (!auth.currentUser) return;
    if (!newPassValue.trim()) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, id), { password: newPassValue.trim() });
      showNotification('Contraseña actualizada');
      setShowPassModal(null);
      setShowStaffPassModal(null);
      setNewPassValue("");
    } catch (err) { console.error(err); }
  };

  const handleRegister = async (e) => {
    if (!auth.currentUser) return;
    e.preventDefault();
    const cleanId = newStudent.id.trim().toUpperCase();
    if (!cleanId || !newStudent.name || !newStudent.password) {
      showNotification('Completa los campos', 'error');
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        showNotification(`ID ya usado`, 'error');
        setSaving(false); return;
      }
      const max = parseInt(newStudent.plan.split(' ')[0]) || 2;
      await setDoc(docRef, {
        id: cleanId, 
        name: newStudent.name.trim().toUpperCase(),
        password: newStudent.password, 
        plan: newStudent.plan, 
        maxCredits: max, 
        credits: max,
        history: [], 
        monthlyPayment: 0, 
        totalAttendance: 0,
        notes: newStudent.notes.trim(),
        registrationDate: newStudent.registrationDate,
        status: 'active', 
      });
      showNotification('Registrada');
      setShowAddForm(false);
      setNewStudent({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleUpdateStudentData = async (studentId) => {
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId);
      await updateDoc(docRef, { 
        name: tempName.trim().toUpperCase(),
        registrationDate: tempDate,
        notes: tempNotes.trim() // <--- Agrega esta línea
      });
      showNotification('Datos actualizados');
      setEditingId(null);
    } catch (err) {
      showNotification('Error al actualizar', 'error');
    }
  };

  const handleRegisterStaff = async (e) => {
    if (!auth.currentUser) return;
    e.preventDefault();
    const cleanId = newStaff.id.trim().toUpperCase();
    if (!cleanId || !newStaff.name || !newStaff.password) {
      showNotification('Completa los campos', 'error');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maestros', cleanId), { 
        ...newStaff, 
        id: cleanId, 
        name: newStaff.name.trim().toUpperCase(), 
        status: 'active' 
      });
      showNotification('Staff registrado');
      setShowStaffForm(false);
      setNewStaff({ id: '', name: '', password: '', role: 'teacher' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handlePayment = async () => {
    if (!auth.currentUser || !showPaymentModal) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', showPaymentModal), {
        monthlyPayment: parseFloat(paymentAmount)
      });
      showNotification('Pago registrado');
      setShowPaymentModal(null);
      setPaymentAmount(0);
    } catch (err) { console.error(err); }
  };

  const resetCreditsManual = async (id, max) => {
    if (!auth.currentUser) return;
    if (window.confirm("¿Reiniciar semana?")) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', id), { credits: max, history: [] });
    }
  };

  const deleteStudent = async (id, name) => {
    if (!auth.currentUser) return;
    if (window.confirm(`¿Borrar a ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', id));
        showNotification('Eliminada');
      } catch (err) { showNotification('Error', 'error'); }
    }
  };

  const deleteTeacher = async (id, name) => {
    if (!auth.currentUser) return;
    if (window.confirm(`¿Borrar a ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'maestros', id));
        showNotification('Eliminado');
      } catch (err) { showNotification('Error', 'error'); }
    }
  };

  return (
    <div className="pb-20">
      <nav className="bg-[#1A3A3E] text-white p-5 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl font-serif font-black tracking-tight">BF ADMIN</span>
          <span className="bg-[#C5A059] text-[#1A3A3E] text-[9px] font-sans px-2 py-0.5 rounded font-black uppercase">{currentMonth}</span>
        </div>
        <button onClick={onLogout} className="text-[10px] font-sans uppercase font-bold opacity-60 hover:opacity-100 tracking-widest">Cerrar Sesión</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 bg-[#1A3A3E] !border-[#C5A059] text-white">
  {/* Cabecera del Roster separada para que el botón no se pierda */}
  <div className="mb-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2">
        <ClipboardList size={20} /> Roster
      </h3>
      <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest">
        {nextSession?.day} {nextSession?.time}
      </span>
    </div>

    {/* BOTÓN DORADO PRINCIPAL */}
    <button 
      onClick={() => setShowExtraModal(true)}
      className="w-full py-3 bg-[#C5A059] text-[#1A3A3E] text-[10px] font-black uppercase tracking-[0.2em] rounded-sm hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg"
    >
      <UserPlus size={14} /> + Invitada Extra
    </button>
  </div>
  
  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
    {/* 1. Alumnas Regulares */}
    {roster.length > 0 ? roster.map((alumna) => (
      <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-sm flex justify-between items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <span className="font-serif italic font-bold text-sm">{alumna.name}</span>
            <span className="text-[9px] font-sans text-[#C5A059] font-black uppercase tracking-tighter">{alumna.id}</span>
          </div>
        </div>
        <button 
          onClick={() => handleMarkAttendance(alumna.id, nextSession.id)}
          className="p-2 bg-[#369EAD] text-white rounded-full"
        >
          <Check size={18} />
        </button>
      </div>
    )) : null}

    {/* 2. Invitadas (Aparecen automáticamente en fondo dorado) */}
    {extraGuests.filter(g => g.sessionId === nextSession?.id).map((guest) => (
      <div key={guest.id} className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-sm flex justify-between items-center gap-4 border-l-4 border-l-[#C5A059]">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="font-serif italic font-bold text-sm text-[#C5A059]">{guest.name}</span>
              <span className="text-[8px] font-sans uppercase font-black opacity-60">
                {guest.type === 'Clase Suelta' ? '$ Suelta' : 'Prueba'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={async () => {
            if(window.confirm("¿Eliminar?")) {
              await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'asistencias_extras', guest.id));
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', nextSession.id), { booked: increment(-1) });
            }
          }}
          className="text-red-400 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ))}

    {roster.length === 0 && extraGuests.filter(g => g.sessionId === nextSession?.id).length === 0 && (
      <div className="text-center py-10 opacity-30 italic text-sm">Sin asistentes hoy</div>
    )}
  </div>
</Card>

           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <Card className="bg-[#1A3A3E] !border-[#C5A059] text-white flex items-center gap-6 group">
                <div className="p-4 bg-[#C5A059] rounded-sm text-[#1A3A3E] group-hover:rotate-6 transition-transform"><DollarSign size={28} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Caja {currentMonth}</p>
                  <p className="text-3xl font-bold text-[#C5A059]">${totalIncome.toLocaleString()}</p>
                </div>
              </Card>

              <Card className="bg-[#1A3A3E] border-none text-white text-center flex flex-col items-center justify-center relative overflow-hidden group">
                <PartyPopper className="text-[#C5A059] mx-auto mb-4 animate-bounce" size={40} />
                <h3 className="text-2xl font-serif italic mb-2">¡Sigue creciendo!</h3>
                <p className="text-[11px] uppercase font-bold tracking-[0.2em] opacity-60 px-4">Cada alumna nueva es un paso más hacia tu sueño</p>
              </Card>

              <Card className="flex items-center gap-6 border-[#369EAD] group">
                <div className="p-4 bg-[#369EAD] text-white rounded-sm group-hover:scale-110 transition-transform"><Trophy size={28} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Impacto Total</p>
                  <p className="text-3xl font-bold">{settings?.totalClassesTaught || 0} clases dadas</p>
                </div>
              </Card>
              <Card className="bg-[#EBF5F6] border-[#369EAD] flex items-center gap-6 md:col-span-2">
                <div className="p-4 bg-[#369EAD] rounded-sm text-white"><Users size={28} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Comunidad Activa</p>
                  <p className="text-3xl font-bold text-[#369EAD]">{activeStudents.length} Alumnas pagando</p>
                </div>
              </Card>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border-[#C5A059]">
              <h3 className="text-lg font-serif italic font-bold mb-4 flex items-center gap-2 text-[#1A3A3E]"><Info size={18} className="text-[#C5A059]" /> Tarifario</h3>
              <div className="space-y-3 font-sans text-[11px]">
                {PRICES.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-gray-400 uppercase font-bold">{p.plan}</span>
                    <span className="font-bold text-[#369EAD]">${p.price}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white border-[#369EAD]">
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
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden font-sans">
              <div className="p-6 border-b border-gray-50 bg-[#1A3A3E]/5 flex justify-between items-center">
                <h3 className="font-serif font-bold italic text-[#1A3A3E] flex items-center gap-2"><ShieldCheck size={20} className="text-[#369EAD]"/> Control Maestras</h3>
                <Button onClick={() => setShowStaffForm(true)} className="!px-4 !py-2 !text-[9px]">Nuevo Staff</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 font-black">
                    <tr><th className="px-6 py-4">Nombre</th><th className="px-6 py-4 text-center">Clave</th><th className="px-6 py-4 text-right pr-10">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teachers.map((t) => (
                      <tr key={t.id} className={`hover:bg-gray-50 text-sm ${t.status === 'inactive' ? 'opacity-40' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${t.role === 'admin' ? 'bg-[#C5A059]' : 'bg-[#369EAD]'}`}></div>
                            <div><div className="font-bold font-serif italic">{t.name}</div><div className="text-[9px] uppercase text-gray-400">{t.id} • {t.role}</div></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#C5A059]">{t.password}</td>
                        <td className="px-6 py-4 text-right pr-8 space-x-1">
                          <button onClick={() => setShowStaffPassModal(t.id)} className="p-2 text-gray-300 hover:text-[#C5A059]"><Key size={16}/></button>
                          <button onClick={() => handleToggleStatus('maestros', t.id, t.status)} className={`p-2 rounded-full ${t.status === 'inactive' ? 'text-green-500' : 'text-red-400'}`}>
                            {t.status === 'inactive' ? <UserCheck size={16}/> : <UserX size={16}/>}
                          </button>
                          <button onClick={() => deleteTeacher(t.id, t.name)} className="p-2 text-red-100 hover:text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

           
            <div className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden font-sans">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                <h3 className="font-serif font-bold italic text-[#1A3A3E]">Control Alumnas</h3>
                <Button onClick={() => setShowAddForm(true)} className="!px-4 !py-2 !text-[9px]">Registrar</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 font-black">
                    <tr>
                      <th className="px-6 py-5">Nombre</th>
                      <th className="px-6 py-5 text-center">Clave</th> {/* <-- Agrega esta línea */}
                      <th className="px-6 py-5 text-center">Créditos</th>
                      <th className="px-6 py-5 text-center">Asistencias</th>
                      <th className="px-6 py-5 text-center">Pago</th>
                      <th className="px-6 py-5 text-right pr-10">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.map((s) => {
                      const isInactive = s.status === 'inactive';
                      return (
                        <tr key={s.id} className={`hover:bg-gray-50 transition-all text-sm ${isInactive ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              {/* El ID siempre se queda igual */}
                            <span className="text-[10px] font-black text-[#369EAD] bg-[#EBF5F6] px-2 py-0.5 rounded-sm w-fit mb-1">{s.id}</span>
    
                            {editingId === s.id ? (
                            /* --- MODO EDICIÓN: Lo que Jenny ve cuando le da clic al lápiz --- */
                            <div className="space-y-2 bg-gray-50 p-2 rounded-sm border border-[#369EAD]/30 animate-in fade-in duration-300">
                            <div>
                              <label className="text-[8px] font-black text-gray-400 uppercase">Nombre</label>
                            <input 
                              type="text" 
                              className="w-full font-bold font-serif italic border-b border-[#369EAD] outline-none bg-transparent text-[#1A3A3E] uppercase"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                            />
                            </div>
                            <div>
                            <label className="text-[8px] font-black text-gray-400 uppercase">Fecha Inscripción</label>
                            <input 
                              type="date" 
                              className="w-full text-xs font-sans border-b border-gray-300 outline-none bg-transparent text-gray-600"
                              value={tempDate}
                              onChange={(e) => setTempDate(e.target.value)}
                              />
                            </div>
                        <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase">Notas Médicas</label>
                        <textarea 
                          className="w-full text-[10px] border-b border-gray-300 outline-none bg-transparent text-red-400 italic"
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                        />
                        </div>
                        <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => handleUpdateStudentData(s.id)} 
                          className="text-[8px] bg-[#369EAD] text-white px-3 py-1 font-black uppercase tracking-widest"
                        >
                        Guardar
                        </button>
                        <button 
                        onClick={() => setEditingId(null)} 
                        className="text-[8px] bg-gray-200 text-gray-500 px-3 py-1 font-black uppercase tracking-widest"
                        >
                        Cancelar
                        </button>
                        </div>
                        </div>
                        ) : (
                        /* --- MODO VISTA: Lo que se ve normalmente --- */
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
                            <button onClick={() => { setEditingId(s.id); setTempName(s.name); setTempDate(s.registrationDate || ""); setTempNotes(s.notes || ""); // <--- Agrega esta línea
                            }} 
                           className="p-2 text-gray-300 hover:text-[#369EAD]"
                           >
                          <UserPlus size={16} />
                          </button>
                            <button onClick={() => setShowPassModal(s.id)} className="p-2 text-gray-300 hover:text-[#C5A059]"><Key size={16} /></button>
                            <button onClick={() => handleToggleStatus('alumnas', s.id, s.status)} className={`p-2 rounded-full ${isInactive ? 'text-green-500' : 'text-gray-300'}`}>
                              {isInactive ? <UserCheck size={16}/> : <UserX size={16}/>}
                            </button>
                            <button onClick={() => resetCreditsManual(s.id, s.maxCredits)} className="p-2 text-[#C5A059]"><Clock size={16}/></button>
                            <button onClick={() => deleteStudent(s.id, s.name)} className="p-2 text-red-100 hover:text-red-500"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showPassModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#C5A059] text-center">
            <h3 className="text-xl font-serif italic mb-2">Clave Alumna</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-6">{showPassModal}</p>
            <div className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-50 border-b border-gray-200 outline-none text-center font-bold" placeholder="Nueva clave" value={newPassValue} onChange={e => setNewPassValue(e.target.value)} />
              <Button onClick={() => handleUpdatePassword('alumnas', showPassModal)} className="w-full !py-4 font-bold">Actualizar</Button>
              <button onClick={() => { setShowPassModal(null); setNewPassValue(""); }} className="text-[10px] uppercase font-bold text-gray-300 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showStaffPassModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#369EAD] text-center">
            <h3 className="text-xl font-serif italic mb-2">Clave Staff</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-6">{showStaffPassModal}</p>
            <div className="space-y-4">
              <input type="text" className="w-full p-4 bg-gray-50 border-b border-gray-200 outline-none text-center font-bold" placeholder="Nueva clave" value={newPassValue} onChange={e => setNewPassValue(e.target.value)} />
              <Button onClick={() => handleUpdatePassword('maestros', showStaffPassModal)} className="w-full !py-4 font-bold">Actualizar</Button>
              <button onClick={() => { setShowStaffPassModal(null); setNewPassValue(""); }} className="text-[10px] uppercase font-bold text-gray-300 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-sm shadow-2xl relative border-t-8 border-[#369EAD]">
            <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X size={28} /></button>
            <h3 className="text-2xl font-serif italic mb-6 border-b pb-2">Nueva Alumna</h3>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required className="w-full p-4 bg-gray-50 border-b outline-none uppercase text-sm font-bold text-[#369EAD]" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} placeholder="ID" />
                <input type="text" required placeholder="CLAVE" className="w-full p-4 bg-gray-50 border-b outline-none text-sm font-bold" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} />
              </div>
              <input type="text" required placeholder="NOMBRE COMPLETO" className="w-full p-4 bg-gray-50 border-b outline-none uppercase text-sm font-serif italic font-bold" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              <select className="w-full p-4 bg-gray-50 border-b outline-none text-sm" value={newStudent.plan} onChange={e => setNewStudent({...newStudent, plan: e.target.value})}>
                {PRICES.slice(0, 4).map((p, i) => <option key={i} value={p.plan}>{p.plan}</option>)}
              </select>
              <div className="space-y-1">
                <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">Fecha de Inscripción</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-4 bg-gray-50 border-b outline-none text-sm font-bold text-[#1A3A3E]" 
                    value={newStudent.registrationDate} 
                    onChange={e => setNewStudent({...newStudent, registrationDate: e.target.value})} 
                  />
              </div>
              <textarea placeholder="NOTAS MÉDICAS" className="w-full p-4 bg-gray-50 border-b outline-none text-xs h-24 italic" value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} />
              <Button disabled={saving} className="w-full !py-4 font-bold">{saving ? <Loader2 className="animate-spin mx-auto" /> : "Guardar Registro"}</Button>
            </form>
          </div>
        </div>
      )}

      {showStaffForm && (
        <div className="fixed inset-0 bg-[#1A3A3E]/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-sm shadow-2xl relative border-t-8 border-[#369EAD]">
            <button onClick={() => setShowStaffForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500"><X size={28} /></button>
            <h3 className="text-2xl font-serif italic mb-6 border-b pb-2">Nuevo Staff</h3>
            <form onSubmit={handleRegisterStaff} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="ID" className="p-4 bg-gray-50 outline-none uppercase text-xs font-bold border-b" value={newStaff.id} onChange={e => setNewStaff({...newStaff, id: e.target.value})} />
                <input type="text" required placeholder="CLAVE" className="p-4 bg-gray-50 outline-none text-xs font-bold border-b" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <input type="text" required placeholder="NOMBRE" className="w-full p-4 bg-gray-50 outline-none uppercase text-xs font-serif italic border-b" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              <select className="w-full p-4 bg-gray-50 outline-none text-xs border-b" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                <option value="teacher">Maestra</option>
                <option value="admin">Admin Secundario</option>
              </select>
              <Button disabled={saving} className="w-full !py-4 font-bold">{saving ? <Loader2 className="animate-spin mx-auto" /> : "Guardar Registro"}</Button>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#C5A059]">
            <h3 className="text-xl font-serif italic mb-6 text-center">Registrar Pago</h3>
            <div className="space-y-4 text-center">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="number" className="w-full p-4 pl-10 bg-gray-50 border-b outline-none text-xl font-bold" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              <Button onClick={handlePayment} className="w-full !py-4 font-bold">Confirmar</Button>
              <button onClick={() => setShowPaymentModal(null)} className="text-[10px] uppercase font-bold text-gray-300 hover:text-red-400">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Clase Suelta o Prueba */}
      {showExtraModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#C5A059]">
            <h3 className="text-xl font-serif italic mb-6 text-center text-[#1A3A3E]">Invitada Extra</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Nombre de la persona</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-gray-50 border-b border-gray-200 outline-none font-bold uppercase text-sm"
                  value={extraGuest.name}
                  onChange={e => setExtraGuest({...extraGuest, name: e.target.value})}
                  placeholder="Ej. MARIA LOPEZ"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase">Tipo de Clase</label>
                <select 
                  className="w-full p-3 bg-gray-50 border-b border-gray-200 outline-none font-bold text-sm"
                  value={extraGuest.type}
                  onChange={e => setExtraGuest({...extraGuest, type: e.target.value})}
                >
                  <option value="Clase Suelta">Clase Suelta ($)</option>
                  <option value="Clase de Prueba">Clase de Prueba (Muestra)</option>
                </select>
              </div>
              <Button onClick={() => handleAddExtraGuest(nextSession.id)} className="w-full !py-4 font-bold">Agregar a la lista</Button>
              <button onClick={() => setShowExtraModal(false)} className="w-full text-[10px] uppercase font-bold text-gray-300 hover:text-red-400 mt-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------
// ------- Panel maestras -------------------
//-------------------------------------------
const TeacherDashboard = ({ user, students, sessionsData, db, appId, onLogout, showNotification, onUpdatePassword }) => {
  const currentMonth = getCurrentMonthName();
  const teacherClasses = WEEKLY_SCHEDULE.filter(s => s.teacher.toUpperCase() === user.firstName.toUpperCase());
  const nextSession = getNextClassFromSchedule(user.firstName);
  const roster = students.filter(s => s.history?.includes(nextSession?.id) && s.status !== 'inactive');
  const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'metadata');
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");


  const handleMarkAttendance = async (studentId, sessionId) => {
    if (!auth.currentUser) return;
    if (!window.confirm("¿Confirmar asistencia?")) return;
    try {
      const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'alumnas', studentId);
      const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sesiones', sessionId);

      const sessionSnap = await getDoc(sessionRef);
      const sessionIsCounted = sessionSnap.exists() ? sessionSnap.data().isCounted : false;

      if (!sessionIsCounted) {
        await updateDoc(settingsDocRef, { totalClassesTaught: increment(1) });
        await setDoc(sessionRef, { isCounted: true }, { merge: true });
      }

      await updateDoc(studentRef, { totalAttendance: increment(1), history: arrayRemove(sessionId) });
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification('Asistencia marcada');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pb-20">
      <nav className="bg-[#1A3A3E] text-white p-5 flex justify-between items-center shadow-lg">
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
            <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#369EAD] text-center">
              <h3 className="text-xl font-serif italic mb-2">Cambiar mi clave</h3>
              <input type="text" className="w-full p-4 bg-gray-50 border-b outline-none text-center font-bold mb-6 text-[#1A3A3E]" value={newPass} onChange={e => setNewPass(e.target.value)} />               
              <Button onClick={() => { onUpdatePassword('maestros', user.id, newPass); setShowPassModal(false); setNewPass(""); }} className="w-full">Actualizar</Button>
              <button onClick={() => setShowPassModal(false)} className="mt-4 text-[10px] uppercase font-bold text-gray-400">Cerrar</button>
            </div>
          </div>
      )}      
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="mb-10 text-center md:text-left">
           <h2 className="text-4xl font-serif italic text-[#1A3A3E] font-bold">¡Hola, {user.firstName}!</h2>
           <p className="text-[#369EAD] text-sm font-sans uppercase tracking-widest">Tu pasión no solo mueve pesas, mueve vidas enteras. ¡Sigue inspirando!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white border-[#C5A059] flex items-center gap-6">
              <div className="p-4 bg-[#C5A059] text-[#1A3A3E] rounded-sm"><BookOpen size={28} /></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Disciplina</p><p className="text-2xl font-serif italic font-bold">Ballet Fit Master</p></div>
          </Card>
          <Card className="bg-[#EBF5F6] border-[#369EAD] flex items-center gap-6">
            <div className="p-4 bg-[#369EAD] text-white rounded-sm"><Trophy size={28} /></div>
            <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Impacto</p><p className="text-3xl font-bold text-[#369EAD]">Enseñando</p></div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 bg-[#1A3A3E] !border-[#C5A059] text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2"><ClipboardList size={20} /> Asistencia</h3>
                {nextSession && <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-bold uppercase">{nextSession.day} {nextSession.time}</span>}
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.length > 0 ? roster.map((alumna) => (
                  <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="font-serif italic font-bold text-sm">{alumna.name}</div>
                      {alumna.notes && <div className="mt-2 flex items-start gap-2 text-red-300"><Stethoscope size={12}/><p className="text-[10px] italic">{alumna.notes}</p></div>}
                    </div>
                    <button onClick={() => handleMarkAttendance(alumna.id, nextSession.id)} className="p-2 bg-[#369EAD] hover:bg-white hover:text-[#369EAD] text-white rounded-full transition-all shadow-lg"><Check size={18} /></button>
                  </div>
                )) : <div className="text-center py-10 opacity-30 italic text-sm">No hay inscritas</div>}
              </div>
           </Card>

           <div className="lg:col-span-2 space-y-8">
              <Card className="bg-white">
                <h3 className="text-xl font-serif italic font-bold mb-6 flex items-center gap-2 text-[#1A3A3E]"><Calendar size={20} className="text-[#369EAD]" /> Horario</h3>
                <div className="grid grid-cols-1 gap-4">
                   {teacherClasses.map(s => (
                      <div key={s.id} className="p-10 bg-gray-50 rounded-sm border-l-8 border-[#369EAD] flex flex-col justify-center">
                         <span className="text-xs font-black uppercase text-gray-400">{s.day}</span>
                         <p className="text-5xl font-bold text-[#1A3A3E] my-2">{s.time}</p>
                         <p className="text-sm text-[#369EAD] font-bold uppercase">{s.type}</p>
                      </div>
                   ))}
                </div>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
};