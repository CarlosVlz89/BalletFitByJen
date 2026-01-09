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
  Loader2,
  CalendarX,
  ToggleLeft,
  ToggleRight
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

const BRAND = {
  teal: '#369EAD',
  dark: '#1A3A3E',
  gold: '#C5A059',
};

// --- CONFIGURACIÓN DE HORARIOS ACTUALIZADA ---
const WEEKLY_SCHEDULE = [
  { id: 'mon-19', day: 'Lunes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 1 },
  { id: 'wed-19', day: 'Miércoles', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 3 },
  { id: 'fri-19', day: 'Viernes', time: '19:00', type: 'Ballet Fit', spots: 10, teacher: 'Lucy', dayIdx: 5 },
  { id: 'sat-09', day: 'Sábado', time: '09:00', type: 'Ballet Fit', spots: 10, teacher: 'Jenny', dayIdx: 6 },
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

// --- UTILIDADES ---
// Función para calcular las horas restantes hasta la próxima clase
const getHoursUntilClass = (dayIdx, timeStr) => {
  const now = new Date();
  const classTime = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Ajustar al próximo día de la semana correspondiente
  let daysToAdd = (dayIdx - now.getDay() + 7) % 7;
  // Si es hoy pero la hora ya pasó, mover a la próxima semana
  if (daysToAdd === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const classMinutesTotal = hours * 60 + minutes;
    if (nowMinutes > classMinutesTotal) daysToAdd = 7;
  }
  
  classTime.setDate(now.getDate() + daysToAdd);
  classTime.setHours(hours, minutes, 0, 0);
  
  const diffMs = classTime - now;
  return diffMs / (1000 * 60 * 60); // Horas decimales
};

export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessionsData, setSessionsData] = useState({}); // booked, status, etc.
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const startApp = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Error Auth:", err); }

      const unsubStudents = onSnapshot(collection(db, 'alumnas'), (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setStudents(list);
        setLoading(false);
      });

      const unsubSessions = onSnapshot(collection(db, 'sesiones'), (snapshot) => {
        const data = {};
        snapshot.docs.forEach(d => data[d.id] = d.data());
        setSessionsData(data);
      });

      return () => { unsubStudents(); unsubSessions(); };
    };
    startApp();
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      const me = students.find(s => s.id === user.id);
      if (me) setUser(prev => ({ ...prev, ...me }));
    }
  }, [students]);

  const handleLogin = (idInput, nameInput) => {
    const cleanId = idInput.trim().toUpperCase();
    const cleanName = nameInput.trim().toUpperCase();
    setError(null);

    if (cleanId === 'ADMIN-JEN' && cleanName === 'JENNY') {
      setUser({ firstName: 'JENNY', role: 'admin' });
      setView('admin');
      return;
    }

    const found = students.find(s => {
      const dbId = s.id.toUpperCase();
      const dbFirstName = s.name.split(' ')[0].toUpperCase();
      return dbId === cleanId && (s.name.toUpperCase() === cleanName || dbFirstName === cleanName);
    });

    if (found) {
      setUser({ ...found, firstName: found.name.split(' ')[0], role: 'student' });
      setView('student');
      showNotification(`Bienvenida, ${found.name.split(' ')[0]}`);
    } else {
      setError('Datos incorrectos. Verifica ID y nombre.');
      showNotification('Datos incorrectos. Verifica ID y nombre.', 'error');
    }
  };

  const handleBooking = async (sessionId) => {
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const sessionState = sessionsData[sessionId];

    if (sessionState?.isClosed) {
      showNotification('Esta clase está cerrada por feriado.', 'error');
      return;
    }

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
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const hoursRemaining = getHoursUntilClass(sessionConfig.dayIdx, sessionConfig.time);
    const isLateCancellation = hoursRemaining < 6;

    if (isLateCancellation) {
      if (!window.confirm("Faltan menos de 6 horas para la clase. Puedes cancelar tu lugar, pero NO se te devolverá el crédito. ¿Deseas continuar?")) return;
    }

    try {
      const studentRef = doc(db, 'alumnas', user.id);
      const sessionRef = doc(db, 'sesiones', sessionId);

      // Si es cancelación a tiempo, devolvemos el crédito
      if (!isLateCancellation) {
        await updateDoc(studentRef, { credits: increment(1), history: arrayRemove(sessionId) });
      } else {
        // Si es tarde, solo quitamos de su historial (pierde el crédito)
        await updateDoc(studentRef, { history: arrayRemove(sessionId) });
      }
      
      await updateDoc(sessionRef, { booked: increment(-1) });
      showNotification(isLateCancellation ? 'Lugar liberado (Crédito no devuelto)' : 'Clase cancelada y crédito devuelto.');
    } catch (err) { showNotification('Error al cancelar', 'error'); }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
    setError(null);
    if (typeof window.toggleSystem === 'function') window.toggleSystem(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#369EAD] animate-pulse bg-white italic">Conectando...</div>;

  return (
    <div className="font-serif text-[#1A3A3E] antialiased">
      {notification && (
        <div className={`fixed top-4 right-4 z-[150] px-6 py-4 rounded-sm shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 border-l-4 ${notification.type === 'error' ? 'bg-red-500 text-white border-red-700' : 'bg-[#1A3A3E] text-white border-[#369EAD]'}`}>
          {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{notification.msg}</span>
        </div>
      )}
      {view === 'login' && <LoginView onLogin={handleLogin} error={error} />}
      {view === 'student' && <StudentDashboard user={user} sessions={WEEKLY_SCHEDULE} sessionsData={sessionsData} onBook={handleBooking} onCancel={handleCancel} onLogout={handleLogout} />}
      {view === 'admin' && <AdminDashboard students={students} sessionsData={sessionsData} db={db} onLogout={handleLogout} showNotification={showNotification} />}
    </div>
  );
}

// --- VISTAS ---

const LoginView = ({ onLogin, error }) => {
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
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#369EAD] font-bold">Portal de Alumnas</span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onLogin(id, name); }} className="space-y-6">
            <input type="text" required placeholder="ID (BF-001)" className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-serif uppercase text-sm" value={id} onChange={e => setId(e.target.value)} />
            <input type="text" required placeholder="NOMBRE" className="w-full p-4 bg-gray-50 border-b border-gray-100 focus:border-[#369EAD] outline-none font-serif uppercase text-sm" value={name} onChange={e => setName(e.target.value)} />
            {error && <div className="text-red-500 text-[10px] text-center font-bold animate-pulse">{error}</div>}
            <button type="submit" className="w-full bg-[#1A3A3E] text-white py-5 uppercase tracking-[0.3em] text-[11px] font-bold hover:bg-[#369EAD] transition-all shadow-lg active:scale-95">Ingresar</button>
          </form>
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
      <nav className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-2">
          <span className="text-2xl text-[#369EAD] font-serif font-black">BF</span>
          <button onClick={onLogout} className="text-gray-400 hover:text-[#369EAD] text-[10px] uppercase font-bold flex items-center gap-2"><span>Salir</span><LogOut size={16} /></button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="md:col-span-2 relative overflow-hidden">
            <h2 className="text-3xl font-serif text-[#1A3A3E] mb-2 italic">Mi Resumen Semanal</h2>
            <div className="bg-[#EBF5F6] px-8 py-5 rounded-sm border border-[#369EAD]/10 inline-block mt-4">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Clases disponibles</span>
              <div className="flex items-baseline gap-2 font-serif">
                <span className={`text-5xl font-bold ${user.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{user.credits}</span>
                <span className="text-gray-300 text-xl">/ {user.maxCredits}</span>
              </div>
            </div>
          </Card>
          <Card className="bg-[#1A3A3E] border-none text-white text-center flex flex-col items-center justify-center">
             <Calendar className="text-[#C5A059] mb-3" size={32} />
             <h3 className="text-[10px] uppercase tracking-widest text-[#C5A059] mb-2">Próxima Clase</h3>
             {nextClass ? <p className="text-xl italic font-bold">{nextClass.day} {nextClass.time}</p> : <p className="opacity-40 italic text-sm">Sin reservas</p>}
          </Card>
        </div>

        <h3 className="text-xl mb-8 font-serif italic border-l-4 border-[#369EAD] pl-6">Programación de Clases</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sessions.map((s) => {
            const isBooked = myHistory.includes(s.id);
            const sessionState = sessionsData[s.id] || { booked: 0, isClosed: false };
            const isFull = (sessionState.booked || 0) >= s.spots;
            const isClosed = sessionState.isClosed;
            const canBook = user.credits > 0 && !isBooked && !isFull && !isClosed;
            
            return (
              <div key={s.id} className={`p-8 rounded-sm border transition-all ${isBooked ? 'bg-[#EBF5F6] border-[#369EAD]' : isClosed ? 'bg-gray-50 opacity-60 border-gray-200' : 'bg-white border-gray-100 hover:shadow-lg'}`}>
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black opacity-40">{s.day}</span>
                    {isClosed && <span className="bg-red-100 text-red-600 text-[8px] px-2 py-0.5 rounded font-black uppercase">Feriado</span>}
                  </div>
                  <h4 className="text-3xl font-serif italic font-bold">{s.time}</h4>
                  <p className="text-[10px] text-[#369EAD] font-bold uppercase tracking-widest mt-1">Maestra: {s.teacher}</p>
                </div>
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase"><Users size={12} className="inline mr-1" />{sessionState.booked || 0}/{s.spots}</span>
                  {isBooked ? 
                    <button onClick={() => onCancel(s.id)} className="text-[10px] text-red-400 font-bold uppercase underline underline-offset-8">Cancelar</button> :
                    <Button onClick={() => onBook(s.id)} disabled={!canBook} className="!px-4 !py-2 !text-[9px]">
                      {isClosed ? 'Cerrado' : isFull ? 'Lleno' : 'Reservar'}
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

const AdminDashboard = ({ students, sessionsData, db, onLogout, showNotification }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ id: '', name: '', plan: '2 clases x sem' });
  const [saving, setSaving] = useState(false);

  const toggleSessionStatus = async (sessionId, currentStatus) => {
    const sessionRef = doc(db, 'sesiones', sessionId);
    try {
      await setDoc(sessionRef, { isClosed: !currentStatus }, { merge: true });
      showNotification(!currentStatus ? 'Clase marcada como Feriado' : 'Clase abierta nuevamente');
    } catch (err) { console.error(err); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanId = newStudent.id.trim().toUpperCase();
    if (!cleanId || !newStudent.name) return;
    setSaving(true);

    try {
      const docRef = doc(db, 'alumnas', cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        showNotification(`ID ${cleanId} ya usado por ${docSnap.data().name}`, 'error');
        setSaving(false);
        return;
      }
      const max = parseInt(newStudent.plan.split(' ')[0]) || 2;
      await setDoc(docRef, {
        id: cleanId,
        name: newStudent.name.trim().toUpperCase(),
        plan: newStudent.plan,
        maxCredits: max,
        credits: max,
        history: [],
        registrationDate: new Date().toISOString()
      });
      showNotification('Alumna registrada con éxito');
      setShowAddForm(false);
      setNewStudent({ id: '', name: '', plan: '2 clases x sem' });
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const deleteStudent = async (student) => {
    if (window.confirm(`¿BORRAR A ${student.name}? Se liberarán sus cupos.`)) {
      try {
        if (student.history?.length > 0) {
          for (const sessionId of student.history) {
            const sessionRef = doc(db, 'sesiones', sessionId);
            await updateDoc(sessionRef, { booked: increment(-1) });
          }
        }
        await deleteDoc(doc(db, 'alumnas', student.id));
        showNotification('Alumna eliminada');
      } catch (err) { console.error(err); }
    }
  };

  const resetCredits = async (id, max) => {
    if (window.confirm("¿Reiniciar créditos de la semana?")) {
      await updateDoc(doc(db, 'alumnas', id), { credits: max, history: [] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-[#1A3A3E] text-white p-5 flex justify-between items-center shadow-lg">
        <span className="text-xl font-serif font-black">BF ADMIN</span>
        <button onClick={onLogout} className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100 tracking-widest">Cerrar Sesión</button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* SECCIÓN DE GESTIÓN DE HORARIOS / FERIADOS */}
        <h3 className="text-xl font-serif italic font-bold mb-6 border-l-4 border-[#369EAD] pl-4">Gestión de Clases (Feriados)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {WEEKLY_SCHEDULE.map(s => {
            const isClosed = sessionsData[s.id]?.isClosed || false;
            return (
              <div key={s.id} className="bg-white p-4 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{s.day} {s.time}</p>
                  <p className="text-xs font-bold">{isClosed ? '🔴 Cerrado' : '🟢 Abierto'}</p>
                </div>
                <button onClick={() => toggleSessionStatus(s.id, isClosed)} className="text-[#369EAD] hover:scale-110 transition-transform">
                  {isClosed ? <ToggleLeft size={32} /> : <ToggleRight size={32} className="text-[#369EAD]" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <h2 className="text-3xl md:text-4xl font-serif italic font-bold">Base de Datos de Alumnas</h2>
          <Button onClick={() => setShowAddForm(true)} className="!py-4 shadow-xl"><UserPlus size={18} /> Registrar Alumna</Button>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-10 rounded-sm shadow-2xl relative border-t-8 border-[#369EAD] animate-in zoom-in duration-300">
              <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={28} /></button>
              <h3 className="text-3xl font-serif italic mb-8 border-b border-gray-100 pb-4 text-brand-dark">Nueva Inscripción</h3>
              <form onSubmit={handleRegister} className="space-y-6">
                <input type="text" required placeholder="ID (BF-001)" className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 focus:border-[#369EAD] uppercase text-sm outline-none transition-all text-brand-dark" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} />
                <input type="text" required placeholder="NOMBRE COMPLETO" className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 focus:border-[#369EAD] uppercase text-sm outline-none transition-all text-brand-dark" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                <select className="w-full p-4 bg-gray-50 border-b-2 border-gray-100 focus:border-[#369EAD] text-sm outline-none cursor-pointer text-brand-dark" value={newStudent.plan} onChange={e => setNewStudent({...newStudent, plan: e.target.value})}>
                  <option>1 clase x sem</option>
                  <option>2 clases x sem</option>
                  <option>3 clases x sem</option>
                  <option>4 clases x sem</option>
                </select>
                <Button disabled={saving} className="w-full !py-5 font-bold tracking-widest">{saving ? <Loader2 className="animate-spin" /> : "Guardar en la Nube"}</Button>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-sm shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 tracking-widest font-bold">
                <tr>
                  <th className="px-8 py-6">ID / Nombre</th>
                  <th className="px-8 py-6 text-center">Créditos</th>
                  <th className="px-8 py-6 text-right pr-12">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <span className="text-[11px] font-black text-[#369EAD] bg-[#EBF5F6] px-2 py-1 rounded-sm border border-[#369EAD]/10 uppercase tracking-tighter min-w-[70px] text-center">
                          {s.id}
                        </span>
                        <div className="font-bold text-[#1A3A3E] text-base font-serif italic">{s.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`text-xl font-bold font-serif ${s.credits === 0 ? 'text-red-400' : 'text-[#369EAD]'}`}>{s.credits}</span>
                        <span className="text-gray-300 text-sm italic"> / {s.maxCredits}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right pr-10">
                      <div className="flex justify-end gap-2 md:gap-4">
                        <button onClick={() => resetCredits(s.id, s.maxCredits)} className="p-3 text-[#C5A059] hover:bg-amber-50 rounded-full transition-all" title="Reiniciar Semana">
                          <Clock size={20}/>
                        </button>
                        <button onClick={() => deleteStudent(s)} className="p-3 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Eliminar Alumna">
                          <Trash2 size={20}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};