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
  ShieldAlert,
  GraduationCap,
  Settings
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
  const day = (date.getDay() + 6) % 7;
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
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomQuote, setRandomQuote] = useState("");

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    const startApp = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Error Auth:", err); }

      const unsubStudents = onSnapshot(collection(db, 'alumnas'), (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudents(list);
        setLoading(false);
      }, (err) => showNotification("Error al cargar alumnas", "error"));

      const unsubTeachers = onSnapshot(collection(db, 'maestros'), (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTeachers(list);
      });

      const unsubSessions = onSnapshot(collection(db, 'sesiones'), (snapshot) => {
        const data = {};
        snapshot.docs.forEach(d => data[d.id] = d.data());
        setSessionsData(data);
      });

      // Crear Admin por defecto si no existen maestros
      const checkAndInitAdmin = async () => {
        const adminDoc = await getDoc(doc(db, 'maestros', 'JENNY'));
        if (!adminDoc.exists()) {
          await setDoc(doc(db, 'maestros', 'JENNY'), {
            id: 'JENNY',
            name: 'JENNY',
            password: 'JENNY2024',
            role: 'admin',
            status: 'active'
          });
          await setDoc(doc(db, 'maestros', 'LUCY'), {
            id: 'LUCY',
            name: 'LUCY',
            password: 'LUCY2024',
            role: 'teacher',
            status: 'active'
          });
        }
      };
      checkAndInitAdmin();

      return () => { unsubStudents(); unsubTeachers(); unsubSessions(); };
    };
    startApp();
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      const me = students.find(s => s.id === user.id);
      if (me) setUser(prev => ({ ...prev, ...me }));
    } else if (user && (user.role === 'teacher' || user.role === 'admin')) {
        const staffMe = teachers.find(t => t.id === user.id);
        if (staffMe) setUser(prev => ({ ...prev, ...staffMe }));
    }
  }, [students, teachers]);

  const handleLogin = (idInput, passwordInput) => {
    const cleanId = idInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim();
    setError(null);

    const teacherFound = teachers.find(t => t.id === cleanId || t.name.toUpperCase() === cleanId);
    if (teacherFound) {
      if (teacherFound.password === cleanPass) {
        if (teacherFound.status === 'inactive') {
          setError('Cuenta de staff desactivada.');
          return;
        }
        setUser({ 
          ...teacherFound,
          firstName: teacherFound.name.split(' ')[0], 
          role: teacherFound.role 
        });
        setView(teacherFound.role === 'admin' ? 'admin' : 'teacher');
        showNotification(`Bienvenida, ${teacherFound.name}`);
        return;
      } else {
        setError('Contraseña de staff incorrecta.');
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
      showNotification(`¡Hola, ${found.name}!`);
    } else {
      setError('ID no encontrado o datos incorrectos.');
    }
  };

  const handleBooking = async (sessionId) => {
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const sessionState = sessionsData[sessionId];
    
    if (isClassInPast(sessionConfig.dayIdx, sessionConfig.time)) {
      showNotification('Esta clase ya ocurrió.', 'error');
      return;
    }

    if (sessionState?.isClosed) { showNotification('Clase cerrada.', 'error'); return; }
    if (user.credits <= 0) { showNotification('Sin créditos.', 'error'); return; }

    try {
      const studentRef = doc(db, 'alumnas', user.id);
      const sessionRef = doc(db, 'sesiones', sessionId);
      await updateDoc(studentRef, { 
        credits: increment(-1), 
        history: arrayUnion(sessionId)
      });
      await setDoc(sessionRef, { booked: increment(1) }, { merge: true });
      showNotification('¡Clase reservada!');
    } catch (err) { showNotification('Error al reservar', 'error'); }
  };

  const handleCancel = async (sessionId) => {
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const hoursRemaining = getHoursUntilClass(sessionConfig.dayIdx, sessionConfig.time);
    const isLateCancellation = hoursRemaining < 6;

    if (isLateCancellation && !window.confirm("Menos de 6h: El lugar se libera pero NO se devuelve crédito. ¿Continuar?")) return;

    try {
      const studentRef = doc(db, 'alumnas', user.id);
      const sessionRef = doc(db, 'sesiones', sessionId);
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

  const handleSelfPasswordUpdate = async (newPass) => {
      if (!user) return;
      const collectionName = user.role === 'student' ? 'alumnas' : 'maestros';
      try {
          await updateDoc(doc(db, collectionName, user.id), {
              password: newPass
          });
          showNotification('Tu contraseña ha sido actualizada');
          return true;
      } catch (err) {
          showNotification('Error al actualizar contraseña', 'error');
          return false;
      }
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
      {view === 'student' && <StudentDashboard user={user} quote={randomQuote} sessions={WEEKLY_SCHEDULE} sessionsData={sessionsData} onBook={handleBooking} onCancel={handleCancel} onLogout={handleLogout} onUpdatePass={handleSelfPasswordUpdate} />}
      {view === 'admin' && <AdminDashboard students={students} teachers={teachers} sessionsData={sessionsData} db={db} onLogout={handleLogout} showNotification={showNotification} />}
      {view === 'teacher' && <TeacherDashboard user={user} students={students} sessionsData={sessionsData} db={db} onLogout={handleLogout} showNotification={showNotification} onUpdatePass={handleSelfPasswordUpdate} />}
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
            <span className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#369EAD] font-bold font-black">Portal de alumnas</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(id, password); }} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">ID o Usuario</label>
              <input 
                type="text" 
                required 
                placeholder="Código de estudiante" 
                className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-sans uppercase text-sm" 
                value={id} 
                onChange={e => setId(e.target.value)} 
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-[9px] font-sans font-black uppercase text-gray-400 tracking-widest ml-1">Contraseña</label>
              <input type={showPass ? "text" : "password"} required placeholder="••••••••" className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-sans text-sm" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-gray-300 hover:text-[#369EAD]">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <div className="text-red-500 font-sans text-[10px] text-center font-bold animate-pulse leading-tight bg-red-50 p-2 rounded-sm border border-red-100">{error}</div>}
            <div className="space-y-4">
                <button type="submit" className="w-full bg-[#1A3A3E] text-white py-5 font-sans uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[#369EAD] transition-all shadow-lg active:scale-95">Entrar</button>
                <p className="text-[9px] text-center text-gray-400 uppercase tracking-widest font-bold px-4 leading-relaxed">En caso de no poder ingresar, contactar a Jenny</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, quote, sessions, sessionsData, onBook, onCancel, onLogout, onUpdatePass }) => {
  const [showPassModal, setShowPassModal] = useState(false);
  const myHistory = user.history || [];
  const mySessions = sessions.filter(s => myHistory.includes(s.id));
  const nextClass = mySessions.length > 0 ? mySessions[0] : null;
  const currentMonth = getCurrentMonthName();

  return (
    <div className="pb-20">
      <nav className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
             <span className="text-2xl text-[#369EAD] font-serif font-black">BF</span>
             <button onClick={() => setShowPassModal(true)} className="text-gray-400 hover:text-[#369EAD] text-[9px] font-sans uppercase font-bold flex items-center gap-1 tracking-widest transition-colors"><Key size={14}/><span>Clave</span></button>
          </div>
          <button onClick={onLogout} className="text-gray-400 hover:text-[#369EAD] text-[10px] font-sans uppercase font-bold flex items-center gap-2 tracking-widest transition-colors"><span>Salir</span><LogOut size={16} /></button>
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
                <span className="block text-[9px] font-sans uppercase tracking-widest text-gray-500 font-bold mb-1">Clases del Mes</span>
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
                    <button onClick={() => onCancel(s.id)} className="text-[10px] text-red-400 font-bold uppercase underline underline-offset-8 decoration-red-100">Cancelar</button> :
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
      {showPassModal && <SelfChangePassModal onClose={() => setShowPassModal(false)} onSave={onUpdatePass} />}
    </div>
  );
};

// --- MODAL DE CAMBIO DE CONTRASEÑA AUTÓNOMO ---
const SelfChangePassModal = ({ onClose, onSave }) => {
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);
    return (
        <div className="fixed inset-0 bg-[#1A3A3E]/90 backdrop-blur-md z-[600] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs p-8 rounded-sm shadow-2xl border-t-8 border-[#369EAD] animate-in zoom-in font-sans text-center">
                <h3 className="text-xl font-serif italic mb-2">Cambiar mi contraseña</h3>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-6 italic">Define una clave que puedas recordar</p>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        className="w-full p-4 bg-gray-50 border-b border-gray-100 outline-none text-center font-bold font-sans text-sm" 
                        placeholder="Escribe tu nueva clave" 
                        value={newPass} 
                        onChange={e => setNewPass(e.target.value)} 
                    />
                    <Button 
                        disabled={loading || !newPass.trim()} 
                        onClick={async () => {
                            setLoading(true);
                            const success = await onSave(newPass);
                            if (success) onClose();
                            setLoading(false);
                        }} 
                        className="w-full !py-4"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : "Guardar nueva clave"}
                    </Button>
                    <button onClick={onClose} className="text-[10px] uppercase font-bold text-gray-300 tracking-widest hover:text-red-400 transition-colors">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = ({ students, teachers, sessionsData, db, onLogout, showNotification }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null); 
  const [showStaffPassModal, setShowStaffPassModal] = useState(null);
  const [newPassValue, setNewPassValue] = useState("");
  const [newStudent, setNewStudent] = useState({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '' });
  const [newStaff, setNewStaff] = useState({ id: '', name: '', password: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [paymentAmount, setPaymentAmount] = useState(0);
  const currentMonth = getCurrentMonthName();

  const activeStudents = students.filter(s => s.status !== 'inactive');

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
      const metadataRef = doc(db, 'artifacts', appId, 'public', 'metadata', 'settings');
      const currentWeek = getISOWeekNumber(new Date());
      
      try {
        const docSnap = await getDoc(metadataRef);
        let lastResetWeek = 0;
        
        if (docSnap.exists()) {
          lastResetWeek = docSnap.data().lastResetWeek || 0;
        }

        if (currentWeek !== lastResetWeek && students.length > 0) {
          const batch = writeBatch(db);
          activeStudents.forEach(s => {
            const studentRef = doc(db, 'alumnas', s.id);
            batch.update(studentRef, {
              credits: s.maxCredits,
              history: []
            });
          });
          await setDoc(metadataRef, { lastResetWeek: currentWeek }, { merge: true });
          await batch.commit();
          showNotification('¡Créditos reiniciados!', 'success');
        }
      } catch (err) { console.error(err); }
    };
    if (students.length > 0) checkWeeklyReset();
  }, [students.length]);

  const nextSession = getNextClassFromSchedule();
  const roster = students.filter(s => s.history?.includes(nextSession.id) && s.status !== 'inactive');
  const totalIncome = students.reduce((acc, s) => acc + (s.monthlyPayment || 0), 0);

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    await setDoc(doc(db, 'sesiones', sessionId), { isClosed: !currentStatus }, { merge: true });
    showNotification('Estado actualizado');
  };

  const handleMarkAttendance = async (studentId, sessionId) => {
    if (!window.confirm("¿Confirmar asistencia?")) return;
    try {
      const studentRef = doc(db, 'alumnas', studentId);
      const sessionRef = doc(db, 'sesiones', sessionId);
      await updateDoc(studentRef, { 
        totalAttendance: increment(1),
        history: arrayRemove(sessionId) 
      });
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification('Asistencia confirmada');
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (collectionName, id, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    if (!window.confirm(`¿Cambiar estatus de este registro?`)) return;
    try {
      await updateDoc(doc(db, collectionName, id), { status: newStatus });
      showNotification('Estatus actualizado');
    } catch (err) { console.error(err); }
  };

  const handleUpdatePassword = async (collectionName, id) => {
    if (!newPassValue.trim()) return;
    try {
      await updateDoc(doc(db, collectionName, id), {
        password: newPassValue.trim()
      });
      showNotification('Contraseña actualizada');
      setShowPassModal(null);
      setShowStaffPassModal(null);
      setNewPassValue("");
    } catch (err) { console.error(err); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanId = newStudent.id.trim().toUpperCase();
    if (!cleanId || !newStudent.name || !newStudent.password) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'alumnas', cleanId), {
        ...newStudent,
        id: cleanId,
        name: newStudent.name.trim().toUpperCase(),
        maxCredits: parseInt(newStudent.plan.split(' ')[0]) || 2,
        credits: parseInt(newStudent.plan.split(' ')[0]) || 2,
        history: [],
        monthlyPayment: 0,
        totalAttendance: 0,
        status: 'active',
        registrationDate: new Date().toISOString()
      });
      showNotification('Alumna registrada');
      setShowAddForm(false);
      setNewStudent({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    const cleanId = newStaff.id.trim().toUpperCase();
    if (!cleanId || !newStaff.name || !newStaff.password) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'maestros', cleanId), {
        ...newStaff,
        id: cleanId,
        name: newStaff.name.trim().toUpperCase(),
        status: 'active'
      });
      showNotification('Maestro registrado');
      setShowStaffForm(false);
      setNewStaff({ id: '', name: '', password: '', role: 'teacher' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handlePayment = async () => {
    try {
      await updateDoc(doc(db, 'alumnas', showPaymentModal), {
        monthlyPayment: parseFloat(paymentAmount)
      });
      showNotification('Pago registrado');
      setShowPaymentModal(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pb-20">
      <nav className="bg-[#1A3A3E] text-white p-5 flex justify-between items-center shadow-lg sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <span className="text-xl font-serif font-black tracking-tight">BF ADMIN</span>
          <span className="bg-[#C5A059] text-[#1A3A3E] text-[9px] font-sans px-2 py-0.5 rounded font-black uppercase">{currentMonth}</span>
        </div>
        <button onClick={onLogout} className="text-[10px] font-sans uppercase font-bold opacity-60 hover:opacity-100 tracking-widest transition-opacity">Cerrar Sesión</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          <Card className="bg-[#1A3A3E] !border-[#C5A059] text-white flex items-center gap-6 group">
            <div className="p-4 bg-[#C5A059] rounded-sm text-[#1A3A3E] transition-transform group-hover:rotate-6"><DollarSign size={28} /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Caja {currentMonth}</p>
              <p className="text-3xl font-bold text-[#C5A059]">${totalIncome.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-6 border-[#369EAD] group">
            <div className="p-4 bg-[#369EAD] text-white rounded-sm transition-transform group-hover:scale-110"><Trophy size={28} /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Impacto</p>
              <p className="text-3xl font-bold">{students.reduce((a,b) => a + (b.totalAttendance || 0), 0)} clases</p>
            </div>
          </Card>
          <Card className="bg-[#EBF5F6] border-[#369EAD] flex items-center gap-6 lg:col-span-2">
            <div className="p-4 bg-[#369EAD] rounded-sm text-white"><Users size={28} /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Activas / Staff</p>
              <p className="text-3xl font-bold text-[#369EAD]">{activeStudents.length} Alumnas / {teachers.length} Staff</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 bg-[#1A3A3E] !border-[#C5A059] text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2">
                  <ClipboardList size={20} /> Roster: Próxima Clase
                </h3>
                <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest">
                  {nextSession.day} {nextSession.time}
                </span>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.length > 0 ? roster.map((alumna) => (
                  <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-serif italic font-bold text-sm">{alumna.name}</span>
                        <span className="text-[9px] font-sans text-[#C5A059] font-black uppercase tracking-tighter">{alumna.id}</span>
                      </div>
                      {alumna.notes && (
                        <div className="mt-2 flex items-start gap-2 text-red-300">
                          <Stethoscope size={12} className="mt-1 flex-shrink-0" />
                          <p className="text-[10px] italic font-sans opacity-90 leading-tight">{alumna.notes}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleMarkAttendance(alumna.id, nextSession.id)} className="p-2 bg-[#369EAD] hover:bg-white hover:text-[#369EAD] text-white rounded-full transition-all shadow-lg">
                      <Check size={18} />
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-30 italic text-sm">Sin inscritas todavía</div>
                )}
              </div>
           </Card>

           <div className="lg:col-span-2">
              <div className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden font-sans mb-8">
                <div className="p-6 border-b border-gray-50 bg-[#1A3A3E]/5 flex justify-between items-center">
                  <h3 className="font-serif font-bold italic text-[#1A3A3E] flex items-center gap-2"><ShieldCheck size={20} className="text-[#369EAD]"/> Gestión de Staff</h3>
                  <Button onClick={() => setShowStaffForm(true)} className="!px-4 !py-2 !text-[9px]">Nuevo Maestro</Button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 font-black">
                        <tr>
                          <th className="px-6 py-4">Maestro / Rol</th>
                          <th className="px-6 py-4 text-center">Clave</th>
                          <th className="px-6 py-4 text-center">Clases</th>
                          <th className="px-6 py-4 text-right pr-10">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {teachers.map((t) => (
                          <tr key={t.id} className={`hover:bg-gray-50 text-sm ${t.status === 'inactive' ? 'opacity-40 grayscale' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${t.role === 'admin' ? 'bg-[#C5A059]' : 'bg-[#369EAD]'}`}></div>
                                <div>
                                  <div className="font-bold font-serif italic">{t.name}</div>
                                  <div className="text-[9px] font-sans uppercase font-black text-gray-400">{t.role === 'admin' ? 'Dueña / Admin' : 'Instructora'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-sans font-bold text-[#C5A059]">{t.password}</td>
                            <td className="px-6 py-4 text-center font-sans text-xs">
                               {WEEKLY_SCHEDULE.filter(s => s.teacher.toUpperCase() === t.name.toUpperCase()).length} clases/sem
                            </td>
                            <td className="px-6 py-4 text-right pr-8 space-x-1">
                              <button onClick={() => setShowStaffPassModal(t.id)} className="p-2 text-gray-300 hover:text-[#C5A059]"><Key size={16}/></button>
                              <button onClick={() => handleToggleStatus('maestros', t.id, t.status)} className={`p-2 rounded-full ${t.status === 'inactive' ? 'text-green-500' : 'text-red-400'}`}>
                                {t.status === 'inactive' ? <UserCheck size={16}/> : <UserX size={16}/>}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden font-sans">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <h3 className="font-serif font-bold italic text-[#1A3A3E]">Control de Alumnas</h3>
                  <Button onClick={() => setShowAddForm(true)} className="!px-4 !py-2 !text-[9px]">Nueva Alumna</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[9px] uppercase text-gray-400 font-black">
                      <tr>
                        <th className="px-6 py-4">Nombre / Clave</th>
                        <th className="px-6 py-4 text-center">Créditos</th>
                        <th className="px-6 py-4 text-center">Pago</th>
                        <th className="px-6 py-4 text-right pr-10">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {students.map((s) => (
                        <tr key={s.id} className={`hover:bg-gray-50 text-sm ${s.status === 'inactive' ? 'opacity-40 grayscale' : ''}`}>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold font-serif italic">{s.name}</div>
                              <div className="text-[9px] text-gray-400 uppercase font-black">ID: {s.id} • Pass: <span className="text-[#C5A059]">{s.password}</span></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-sans font-bold text-[#369EAD]">{s.credits} <span className="text-[10px] text-gray-300">/ {s.maxCredits}</span></td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => { setShowPaymentModal(s.id); setPaymentAmount(s.monthlyPayment || 0); }} className="font-sans font-bold text-green-600 bg-green-50 px-3 py-1 rounded text-xs transition-colors hover:bg-green-100">
                              ${s.monthlyPayment || 0}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right pr-8 space-x-1">
                            <button onClick={() => setShowPassModal(s.id)} className="p-2 text-gray-300 hover:text-[#C5A059] transition-colors"><Key size={16}/></button>
                            <button onClick={() => handleToggleStatus('alumnas', s.id, s.status)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                               {s.status === 'inactive' ? <UserCheck size={16}/> : <UserX size={16}/>}
                            </button>
                            <button onClick={() => { if(window.confirm(`¿Borrar a ${s.name}?`)) deleteDoc(doc(db, 'alumnas', s.id)) }} className="p-2 text-red-100 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        </div>
      </div>

      {(showAddForm || showStaffForm) && (
        <div className="fixed inset-0 bg-[#1A3A3E]/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-sm shadow-2xl relative border-t-8 border-[#369EAD] animate-in zoom-in font-sans">
            <button onClick={() => { setShowAddForm(false); setShowStaffForm(false); }} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={28} /></button>
            <h3 className="text-2xl font-serif italic mb-6 border-b pb-2">{showAddForm ? 'Nueva Alumna' : 'Nuevo Maestro'}</h3>
            <form onSubmit={showAddForm ? handleRegister : handleRegisterStaff} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="ID / USUARIO" className="p-4 bg-gray-50 outline-none uppercase text-xs font-bold border-b border-gray-100 focus:border-[#369EAD]" value={showAddForm ? newStudent.id : newStaff.id} onChange={e => showAddForm ? setNewStudent({...newStudent, id: e.target.value}) : setNewStaff({...newStaff, id: e.target.value})} />
                <input type="text" required placeholder="CONTRASEÑA" className="p-4 bg-gray-50 outline-none text-xs font-bold border-b border-gray-100 focus:border-[#369EAD]" value={showAddForm ? newStudent.password : newStaff.password} onChange={e => showAddForm ? setNewStudent({...newStudent, password: e.target.value}) : setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <input type="text" required placeholder="NOMBRE COMPLETO" className="w-full p-4 bg-gray-50 outline-none uppercase text-xs font-serif italic border-b border-gray-100 focus:border-[#369EAD]" value={showAddForm ? newStudent.name : newStaff.name} onChange={e => showAddForm ? setNewStudent({...newStudent, name: e.target.value}) : setNewStaff({...newStaff, name: e.target.value})} />
              {showAddForm ? (
                <select className="w-full p-4 bg-gray-50 outline-none text-xs border-b border-gray-100 focus:border-[#369EAD]" value={newStudent.plan} onChange={e => setNewStudent({...newStudent, plan: e.target.value})}>
                  {PRICES.slice(0, 4).map((p, i) => <option key={i} value={p.plan}>{p.plan}</option>)}
                </select>
              ) : (
                <select className="w-full p-4 bg-gray-50 outline-none text-xs border-b border-gray-100 focus:border-[#369EAD]" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                  <option value="teacher">MAESTRA</option>
                  <option value="admin">ADMINISTRADORA</option>
                </select>
              )}
              <Button disabled={saving} className="w-full !py-4 font-bold">{saving ? <Loader2 className="animate-spin" /> : "Guardar Registro"}</Button>
            </form>
          </div>
        </div>
      )}

      {(showPassModal || showStaffPassModal) && (
        <div className="fixed inset-0 bg-[#1A3A3E]/90 z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm text-center font-sans border-t-8 border-[#C5A059] shadow-2xl">
            <h3 className="text-xl font-serif italic mb-6">Actualizar Clave</h3>
            <input type="text" className="w-full p-4 bg-gray-50 outline-none text-center font-bold mb-6 border-b border-gray-100" placeholder="Nueva Clave" value={newPassValue} onChange={e => setNewPassValue(e.target.value)} />
            <Button onClick={() => handleUpdatePassword(showPassModal ? 'alumnas' : 'maestros', showPassModal || showStaffPassModal)} className="w-full mb-2">Guardar</Button>
            <button onClick={() => { setShowPassModal(null); setShowStaffPassModal(null); }} className="text-[10px] uppercase font-bold text-gray-300 hover:text-red-400 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/90 z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-8 rounded-sm text-center font-sans border-t-8 border-green-500 shadow-2xl">
            <h3 className="text-xl font-serif italic mb-6">Registrar Pago</h3>
            <input type="number" className="w-full p-4 bg-gray-50 outline-none text-center font-bold mb-6 border-b border-gray-100" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            <Button onClick={handlePayment} className="w-full mb-2">Confirmar</Button>
            <button onClick={() => setShowPaymentModal(null)} className="text-[10px] uppercase font-bold text-gray-300 hover:text-red-400 transition-colors">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- VISTA MAESTRA (LUCY / STAFF) ---
const TeacherDashboard = ({ user, students, sessionsData, db, onLogout, showNotification, onUpdatePass }) => {
  const [showPassModal, setShowPassModal] = useState(false);
  const currentMonth = getCurrentMonthName();
  const teacherClasses = WEEKLY_SCHEDULE.filter(s => s.teacher.toUpperCase() === user.firstName.toUpperCase());
  const nextSession = getNextClassFromSchedule(user.firstName);
  const roster = students.filter(s => s.history?.includes(nextSession?.id) && s.status !== 'inactive');

  const handleMarkAttendance = async (studentId, sessionId) => {
    if (!window.confirm("¿Confirmar asistencia?")) return;
    try {
      const studentRef = doc(db, 'alumnas', studentId);
      const sessionRef = doc(db, 'sesiones', sessionId);
      await updateDoc(studentRef, { 
        totalAttendance: increment(1),
        history: arrayRemove(sessionId) 
      });
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification('Asistencia marcada');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pb-20">
      <nav className="bg-[#1A3A3E] text-white p-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-xl font-serif font-black tracking-tight uppercase">Staff</span>
          <button onClick={() => setShowPassModal(true)} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-[8px] font-sans font-black uppercase tracking-widest flex items-center gap-1 transition-colors"><Key size={10}/><span>Mi Clave</span></button>
        </div>
        <div className="flex items-center gap-3">
            <span className="bg-[#369EAD] text-white text-[9px] font-sans px-2 py-0.5 rounded font-black uppercase">{user.firstName}</span>
            <button onClick={onLogout} className="text-[10px] font-sans uppercase font-bold opacity-60 hover:opacity-100 tracking-widest transition-opacity">Cerrar Sesión</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="mb-10 text-center md:text-left">
           <h2 className="text-4xl font-serif italic text-[#1A3A3E] font-bold">¡Hola, {user.firstName}!</h2>
           <p className="text-[#369EAD] text-sm font-sans uppercase tracking-widest">Lista para tu próxima clase</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white border-[#C5A059] flex items-center gap-6">
              <div className="p-4 bg-[#C5A059] text-[#1A3A3E] rounded-sm"><BookOpen size={28} /></div>
              <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Disciplina</p>
              <p className="text-2xl font-serif italic font-bold">Ballet Fit Master</p>
            </div>
          </Card>
          <Card className="bg-[#EBF5F6] border-[#369EAD] flex items-center gap-6">
            <div className="p-4 bg-[#369EAD] text-white rounded-sm"><Trophy size={28} /></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Impacto</p>
              <p className="text-3xl font-bold text-[#369EAD] font-sans">Enseñando este mes</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 bg-[#1A3A3E] !border-[#C5A059] text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2">
                  <ClipboardList size={20} /> Asistencia: Próxima Clase
                </h3>
                {nextSession && (
                  <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest">
                    {nextSession.day} {nextSession.time}
                  </span>
                )}
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {roster.length > 0 ? roster.map((alumna) => (
                  <div key={alumna.id} className="p-4 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition-all flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <div className="font-serif italic font-bold text-sm">{alumna.name}</div>
                      {alumna.notes && (
                        <div className="mt-2 flex items-start gap-2 text-red-300">
                          <Stethoscope size={12} className="mt-1 flex-shrink-0" />
                          <p className="text-[10px] italic font-sans opacity-90 leading-tight">{alumna.notes}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleMarkAttendance(alumna.id, nextSession.id)} className="p-2 bg-[#369EAD] hover:bg-white hover:text-[#369EAD] text-white rounded-full transition-all shadow-lg">
                      <Check size={18} />
                    </button>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-30 italic text-sm">No hay alumnas inscritas aún</div>
                )}
              </div>
           </Card>

           <div className="lg:col-span-2 space-y-8">
              <Card className="bg-white">
                <h3 className="text-xl font-serif italic font-bold mb-6 flex items-center gap-2 text-[#1A3A3E]">
                  <Calendar size={20} className="text-[#369EAD]" /> Horario de Clases
                </h3>
                <div className="grid grid-cols-1 gap-4">
                   {teacherClasses.map(s => (
                      <div key={s.id} className="p-8 bg-gray-50 rounded-sm border-l-8 border-[#369EAD] flex flex-col justify-center">
                         <span className="text-xs font-sans font-black uppercase text-gray-400 tracking-widest">{s.day}</span>
                         <p className="text-4xl font-sans font-bold text-[#1A3A3E] my-1">{s.time}</p>
                         <p className="text-sm text-[#369EAD] font-bold uppercase tracking-[0.2em]">{s.type}</p>
                      </div>
                   ))}
                </div>
              </Card>
           </div>
        </div>
      </div>
      {showPassModal && <SelfChangePassModal onClose={() => setShowPassModal(false)} onSave={onUpdatePass} />}
    </div>
  );
};