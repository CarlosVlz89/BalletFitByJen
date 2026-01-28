import React, { useState, useEffect } from 'react';

// 1. Firestore
import { 
  collection, onSnapshot, doc, updateDoc, setDoc, 
  increment, arrayUnion, arrayRemove 
} from 'firebase/firestore';

// 2. Auth
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

// 3. Config
import { db, auth } from './services/firebase';
import { CheckCircle, XCircle, LogOut, ArrowLeft, Key, Home } from 'lucide-react'; // Agregamos Key y Home

// 4. Componentes
import LoginView from './features/auth/LoginView';
import AdminDashboard from './features/admin/AdminDashboard';
import TeacherDashboard from './features/teachers/TeacherDashboard';
import StudentDashboard from './features/students/StudentDashboard';
import GlassButton from './components/ui/GlassButton'; // Necesitamos el botón para el modal

// 5. Utils
import { 
  WEEKLY_SCHEDULE, 
  MOTIVATIONAL_QUOTES, 
  getHoursUntilClass, 
  isClassInPast 
} from './utils/data';

const APP_ID = "balletfitbyjen-6b36a"; 
const ADMIN_PASS = "JENNY2024";

// --- NAVBAR UNIFICADO (Ahora con botón de Clave) ---
const SystemNavbar = ({ user, onLogout, onGoHome, onChangePass }) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-white/40 shadow-sm h-16 transition-all">
      <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
        {/* Izquierda: Volver */}
        <button onClick={onGoHome} className="flex items-center gap-2 text-[#1A3A3E] hover:text-[#369EAD] transition-colors group">
          <div className="p-2 bg-gray-100 rounded-full group-hover:bg-[#EBF5F6] transition-colors">
            <ArrowLeft size={16} />
          </div>
          <span className="hidden md:inline text-[10px] font-sans font-bold uppercase tracking-widest">Volver al Sitio</span>
        </button>

        {/* Centro: Logo */}
        <div className="font-serif font-bold text-xl text-[#1A3A3E] italic">
          Ballet Fit <span className="text-[#369EAD]">System</span>
        </div>

        {/* Derecha: Acciones */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Botón Cambiar Clave (Solo si no es Admin, o según tu lógica) */}
              {user.role !== 'admin' && (
                <button 
                  onClick={onChangePass}
                  className="p-2 text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/10 rounded-full transition-all"
                  title="Cambiar Contraseña"
                >
                  <Key size={18} />
                </button>
              )}
              
              <div className="hidden md:flex flex-col items-end leading-none mr-2">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role === 'admin' ? 'Admin' : 'Hola'}</span>
                 <span className="text-xs font-bold text-[#369EAD] uppercase">{user.firstName}</span>
              </div>

              <button 
                onClick={onLogout} 
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-full transition-all"
                title="Cerrar Sesión"
              >
                 <LogOut size={18} />
              </button>
            </>
          ) : (
             <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center gap-1">
               <Home size={14} /> Portal
             </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  
  // Estados Globales
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [randomQuote, setRandomQuote] = useState("");

  // Estado para el Modal Global de Contraseña
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    const startApp = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Error Auth:", err); }
      onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) return;
        const unsubStudents = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas'), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubTeachers = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'maestros'), (snap) => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubSessions = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones'), (snap) => { const data = {}; snap.docs.forEach(d => data[d.id] = d.data()); setSessionsData(data); });
        setLoading(false);
        return () => { unsubStudents(); unsubTeachers(); unsubSessions(); };
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

  const handleGoHome = () => {
    if (window.toggleSystem) window.toggleSystem(false);
    else window.location.reload();
  };

  const handleLogin = (idInput, passwordInput) => {
    const cleanId = idInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim();
    setError(null);
    if (cleanId === 'ADMIN-JEN' || cleanId === 'JENNY') {
      if (cleanPass === ADMIN_PASS) { setUser({ firstName: 'JENNY', role: 'admin' }); setView('admin'); showNotification('Acceso Admin'); return; } 
      else { setError('Contraseña Admin incorrecta.'); return; }
    }
    const teacherFound = teachers.find(t => t.id.toUpperCase() === cleanId);
    if (teacherFound) {
      if (teacherFound.password === cleanPass) {
        if (teacherFound.status === 'inactive') { setError('Cuenta inactiva.'); return; }
        setUser({ ...teacherFound, firstName: teacherFound.name.split(' ')[0], role: 'teacher' }); setView('teacher'); showNotification('Acceso Maestra'); return;
      } else { setError('Contraseña incorrecta.'); return; }
    }
    const found = students.find(s => s.id.toUpperCase() === cleanId);
    if (found) {
      if (found.password && found.password !== cleanPass) { setError('Contraseña incorrecta.'); return; }
      if (found.status === 'inactive') { setError('Cuenta inactiva.'); return; }
      setUser({ ...found, firstName: found.name.split(' ')[0], role: 'student' }); setView('student');
    } else { setError('ID no encontrado.'); }
  };

  const handleLogout = () => { setUser(null); setView('login'); setError(null); };

// --- LÓGICA DE ALUMNAS: RESERVA ---
  const handleBooking = async (sessionId) => {
    if (!auth.currentUser) return;
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const sessionState = sessionsData[sessionId];
    
    if (isClassInPast(sessionConfig.dayIdx, sessionConfig.time)) { showNotification('Clase finalizada.', 'error'); return; }
    if (sessionState?.isClosed) { showNotification('Clase cerrada.', 'error'); return; }
    if (user.credits <= 0) { showNotification('Sin créditos.', 'error'); return; }
    
    try {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', user.id), { credits: increment(-1), history: arrayUnion(sessionId) });
      await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', sessionId), { booked: increment(1) }, { merge: true });
      showNotification('¡Clase reservada!');

      // --- NOTIFICACIÓN WHATSAPP (TÉCNICA ASCII SEGURA) ---
      const telefonoJen = "5213331844195"; 
      
      // Codificamos el texto normal para URL
      const parte1 = encodeURIComponent(`¡Hola Jen! `);
      const parte2 = encodeURIComponent(` Soy *${user.firstName}*.\nAcabo de reservar mi clase de *Ballet Fit* para el:\n`);
      const parte3 = encodeURIComponent(` *${sessionConfig.day}* a las *${sessionConfig.time}*.\n\n¡Nos vemos en el estudio! `);

      // Pegamos los códigos de emojis (Hexadecimal) manualmente entre el texto
      // %F0%9F%A9%B0 = Zapatillas
      // %F0%9F%97%93 = Calendario
      // %E2%9C%A8      = Brillos
      const urlWhatsApp = `https://wa.me/${telefonoJen}?text=${parte1}%F0%9F%A9%B0${parte2}%F0%9F%97%93${parte3}%E2%9C%A8`;
      
      setTimeout(() => {
        if(window.confirm("¿Enviar confirmación por WhatsApp?")) {
            window.open(urlWhatsApp, '_blank');
        }
      }, 500);

    } catch (err) { showNotification('Error al reservar', 'error'); }
  };

  // --- LÓGICA DE ALUMNAS: CANCELACIÓN ---
  const handleCancel = async (sessionId) => {
    if (!auth.currentUser) return;
    const sessionConfig = WEEKLY_SCHEDULE.find(s => s.id === sessionId);
    const hoursRemaining = getHoursUntilClass(sessionConfig.dayIdx, sessionConfig.time);
    const isLateCancellation = hoursRemaining < 6;
    
    if (isLateCancellation && !window.confirm("Faltan menos de 6h. El lugar se libera pero NO se te devuelve el crédito. ¿Deseas continuar?")) return;
    
    try {
      const studentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', user.id);
      
      if (!isLateCancellation) {
        await updateDoc(studentRef, { credits: increment(1), history: arrayRemove(sessionId) });
      } else {
        await updateDoc(studentRef, { history: arrayRemove(sessionId) });
      }
      
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', sessionId), { booked: increment(-1) });
      showNotification(isLateCancellation ? 'Cancelada (sin reembolso).' : 'Clase cancelada.');

      // --- NOTIFICACIÓN WHATSAPP (TÉCNICA ASCII SEGURA) ---
      const telefonoJen = "5213331844195"; 
      let urlWhatsApp = "";

      if (isLateCancellation) {
         // Emojis: Triste (%F0%9F%A5%BA) y Rezo (%F0%9F%99%8F)
         const t1 = encodeURIComponent(`Hola Jen `);
         const t2 = encodeURIComponent(` Soy *${user.firstName}*.\nTuve un imprevisto y no podré llegar a mi clase de hoy *${sessionConfig.day}* a las *${sessionConfig.time}*.\nSé que es tarde, libera mi lugar para alguien más. `);
         
         urlWhatsApp = `https://wa.me/${telefonoJen}?text=${t1}%F0%9F%A5%BA${t2}%F0%9F%99%8F`;

      } else {
         // Emojis: Saludo (%F0%9F%91%8B) y Brillos (%E2%9C%A8)
         const t1 = encodeURIComponent(`Hola Jen `);
         const t2 = encodeURIComponent(` Soy *${user.firstName}*.\nTe aviso que liberé mi lugar para la clase del *${sessionConfig.day}* a las *${sessionConfig.time}* para que alguien más pueda aprovecharlo. `);
         
         urlWhatsApp = `https://wa.me/${telefonoJen}?text=${t1}%F0%9F%91%8B${t2}%E2%9C%A8`;
      }
      
      setTimeout(() => {
        if(window.confirm("¿Notificar cancelación por WhatsApp?")) {
            window.open(urlWhatsApp, '_blank');
        }
      }, 500);

    } catch (err) { showNotification('Error al cancelar', 'error'); }
  };

  const handleGlobalUpdatePass = async () => {
    if(!newPass.trim()) return;
    const collectionName = user.role === 'teacher' ? 'maestros' : 'alumnas';
    try {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, user.id), { password: newPass.trim() });
      showNotification('Contraseña actualizada');
      setUser(prev => ({ ...prev, password: newPass.trim() }));
      setShowPassModal(false);
      setNewPass("");
    } catch (err) { showNotification('Error al actualizar', 'error'); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-serif text-[#369EAD] animate-pulse bg-gradient-to-br from-[#EBF5F6] to-white italic text-xl">Cargando Ballet Fit...</div>;

  return (
    <div className="font-serif text-[#1A3A3E] antialiased min-h-screen bg-gradient-to-br from-[#EBF5F6] via-[#d4e9ed] to-[#EBF5F6]">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#369EAD]/10 blur-[100px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#C5A059]/10 blur-[100px] pointer-events-none"></div>

      {/* NAVBAR GLOBAL */}
      <SystemNavbar 
        user={user} 
        onLogout={handleLogout} 
        onGoHome={handleGoHome} 
        onChangePass={() => setShowPassModal(true)} 
      />

      <div className="pt-20"> 
        {notification && (
          <div className={`fixed top-24 right-4 z-[150] px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 border ${notification.type === 'error' ? 'bg-red-500/90 text-white border-red-700' : 'bg-[#1A3A3E]/90 text-white border-[#369EAD]'}`}>
            {notification.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest">{notification.msg}</span>
          </div>
        )}

        {view === 'login' && <LoginView onLogin={handleLogin} error={error} />}
        
        {view === 'student' && (
          <StudentDashboard 
            user={user} quote={randomQuote} sessionsData={sessionsData} 
            onBook={handleBooking} onCancel={handleCancel} 
          />
        )}
        
        {view === 'admin' && <AdminDashboard onLogout={handleLogout} showNotification={showNotification} />}

        {view === 'teacher' && (
          <TeacherDashboard user={user} onLogout={handleLogout} showNotification={showNotification} />
        )}
      </div>

      {/* MODAL GLOBAL DE CAMBIO DE CONTRASEÑA */}
      {/* MODAL GLOBAL DE CAMBIO DE CONTRASEÑA */}
      {showPassModal && (
          // CAMBIOS: 
          // 1. z-[5000] para asegurar que esté POR ENCIMA del Navbar.
          // 2. h-screen w-screen fixed top-0 left-0 para forzar pantalla completa real.
          <div className="fixed top-0 left-0 h-screen w-screen z-[5000] flex items-center justify-center bg-[#1A3A3E]/80 backdrop-blur-md p-4">
            
            <div className="bg-white/90 w-full max-w-xs p-8 rounded-3xl shadow-2xl border border-white/50 text-center animate-in zoom-in duration-300 relative">
              
              <h3 className="text-xl font-serif italic mb-2 text-[#1A3A3E]">Cambiar mi clave</h3>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-6">Usuario: {user.firstName}</p>
              
              <input 
                type="text" 
                className="w-full p-4 bg-gray-50/50 rounded-xl border border-gray-200 outline-none text-center font-bold mb-6 text-[#1A3A3E] focus:border-[#369EAD] transition-colors" 
                placeholder="Nueva contraseña" 
                value={newPass} 
                onChange={e => setNewPass(e.target.value)} 
                autoFocus
              />                
              
              <GlassButton onClick={handleGlobalUpdatePass} className="w-full !py-4">
                Actualizar
              </GlassButton>
              
              <button 
                onClick={() => { setShowPassModal(false); setNewPass(""); }} 
                className="mt-4 text-[10px] uppercase font-bold text-gray-400 hover:text-red-400 transition-colors"
              >
                Cancelar
              </button>

            </div>
          </div>
        )}
    </div>
  );
}