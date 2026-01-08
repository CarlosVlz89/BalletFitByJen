import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  List, 
  LogOut, 
  Users, 
  Lock,
  AlertCircle,
  Clock,
  PartyPopper
} from 'lucide-react';

// --- CONFIGURACIÓN Y MOCK DATA ---
const BRAND = {
  teal: '#369EAD',
  tealLight: '#EBF5F6',
  dark: '#1A3A3E',
  gold: '#C5A059',
  white: '#FFFFFF'
};

// Base de datos simulada
const MOCK_USERS = [
  { id: 'BF-001', firstName: 'JENNY', plan: 'Elite', credits: 4, maxCredits: 4, history: [], role: 'student' },
  { id: 'BF-002', firstName: 'MARIA', plan: 'Standard', credits: 2, maxCredits: 2, history: [], role: 'student' },
  { id: 'BF-003', firstName: 'ANA', plan: 'Basic', credits: 0, maxCredits: 1, history: [], role: 'student' },
  { id: 'ADMIN-JEN', firstName: 'JEN', role: 'admin' }
];

// Horario semanal base
const WEEKLY_SCHEDULE = [
  { id: 'mon-19', day: 'Lunes', time: '19:00', type: 'Ballet Fit', spots: 10, booked: 0 },
  { id: 'wed-19', day: 'Miércoles', time: '19:00', type: 'Ballet Fit', spots: 10, booked: 2 },
  { id: 'fri-19', day: 'Viernes', time: '19:00', type: 'Ballet Fit', spots: 10, booked: 5 },
  { id: 'sat-09', day: 'Sábado', time: '09:00', type: 'Morning Flow', spots: 12, booked: 8 },
];

// --- COMPONENTES UI REUTILIZABLES ---
const Card = ({ children, className = '' }) => {
  const hasBg = className.includes('bg-');
  const baseClasses = `rounded-sm shadow-md border-t-4 border-[#369EAD] p-6 transition-all hover:shadow-lg ${hasBg ? '' : 'bg-white'}`;
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-6 py-2 rounded-sm font-medium tracking-widest uppercase text-xs transition-all duration-300 transform active:scale-95";
  const variants = {
    primary: "bg-[#369EAD] text-white hover:bg-[#1A3A3E] shadow-sm",
    secondary: "border border-[#369EAD] text-[#369EAD] hover:bg-[#EBF5F6]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
    disabled: "bg-gray-200 text-gray-400 cursor-not-allowed"
  };

  return (
    <button 
      onClick={disabled ? null : onClick} 
      className={`${baseStyle} ${disabled ? variants.disabled : variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [dbUsers, setDbUsers] = useState(MOCK_USERS);
  const [sessions, setSessions] = useState(WEEKLY_SCHEDULE);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (id, name) => {
    const cleanId = id.trim().toUpperCase();
    const cleanName = name.trim().toUpperCase();

    if (cleanId === 'ADMIN' && cleanName === 'JEN') {
      setUser({ firstName: 'Jen', role: 'admin' });
      setView('admin');
      return;
    }

    const foundUser = dbUsers.find(u => u.id === cleanId && u.firstName === cleanName);

    if (foundUser) {
      setUser(foundUser);
      setView(foundUser.role === 'admin' ? 'admin' : 'student');
    } else {
      showNotification('Credenciales no encontradas. Verifica tu ID.', 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  const handleBooking = (sessionId) => {
    if (!user || user.credits <= 0) {
      showNotification('¡Sin créditos suficientes! Renueva tu paquete.', 'error');
      return;
    }

    const updatedUsers = dbUsers.map(u => {
      if (u.id === user.id) {
        return { 
          ...u, 
          credits: u.credits - 1, 
          history: [...u.history, sessionId] 
        };
      }
      return u;
    });

    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, booked: s.booked + 1 };
      }
      return s;
    });

    setDbUsers(updatedUsers);
    setSessions(updatedSessions);
    setUser(updatedUsers.find(u => u.id === user.id));
    showNotification('¡Reserva confirmada! Nos vemos en clase.');
  };

  const handleCancel = (sessionId) => {
    const updatedUsers = dbUsers.map(u => {
      if (u.id === user.id) {
        return { 
          ...u, 
          credits: u.credits + 1, 
          history: u.history.filter(id => id !== sessionId) 
        };
      }
      return u;
    });

    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        return { ...s, booked: Math.max(0, s.booked - 1) };
      }
      return s;
    });

    setDbUsers(updatedUsers);
    setSessions(updatedSessions);
    setUser(updatedUsers.find(u => u.id === user.id));
    showNotification('Clase cancelada. Tu crédito ha sido devuelto.');
  };

  const LoginView = () => {
    const [inputId, setInputId] = useState('');
    const [inputName, setInputName] = useState('');

    return (
      <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative" 
           style={{ backgroundImage: 'linear-gradient(rgba(26, 58, 62, 0.6), rgba(26, 58, 62, 0.4)), url("https://images.unsplash.com/photo-1516515865486-4447488dc476?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")' }}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-sm shadow-2xl border-t-4 border-[#369EAD]">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-[#1A3A3E] mb-1">Ballet Fit</h1>
              <span className="text-xs uppercase tracking-[0.3em] text-[#369EAD]">Portal de Alumnas</span>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">ID de Alumna</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-[#369EAD] w-5 h-5" />
                  <input type="text" placeholder="Ej. BF-001" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#369EAD] focus:ring-1 focus:ring-[#369EAD] outline-none transition-all rounded-sm font-serif" value={inputId} onChange={(e) => setInputId(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Primer Nombre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-[#369EAD] w-5 h-5" />
                  <input type="text" placeholder="Ej. Jenny" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-[#369EAD] focus:ring-1 focus:ring-[#369EAD] outline-none transition-all rounded-sm font-serif" value={inputName} onChange={(e) => setInputName(e.target.value)} />
                </div>
              </div>
              <button onClick={() => handleLogin(inputId, inputName)} className="w-full bg-[#1A3A3E] text-white py-3 uppercase tracking-widest text-xs font-bold hover:bg-[#369EAD] transition-colors shadow-lg">Ingresar</button>
            </div>
            <div className="mt-6 text-center"><p className="text-xs text-gray-400 italic">¿Problemas para acceder? Contacta a Jen.</p></div>
          </div>
        </div>
      </div>
    );
  };

  const StudentDashboard = () => {
    const mySessions = sessions.filter(s => user.history.includes(s.id));
    const nextClass = mySessions.length > 0 ? mySessions[0] : null;
    
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl text-[#369EAD] font-serif font-bold">BF</span>
              <span className="hidden sm:inline text-xs uppercase tracking-widest text-gray-500 border-l border-gray-300 pl-2 ml-2">Hola, {user.firstName}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-[#369EAD] text-xs uppercase tracking-widest transition-colors"><span>Salir</span><LogOut className="w-4 h-4" /></button>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="md:col-span-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10"><PartyPopper size={150} color={BRAND.teal} /></div>
              <h2 className="text-2xl font-serif text-[#1A3A3E] mb-2">Mi Resumen Semanal</h2>
              <p className="text-gray-500 mb-6">Gestiona tus clases y mantén tu ritmo.</p>
              <div className="flex items-end gap-4">
                <div className="bg-[#EBF5F6] px-6 py-4 rounded-sm border border-[#369EAD]/20">
                  <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Créditos Disponibles</span>
                  <div className="flex items-baseline gap-1"><span className="text-4xl font-bold text-[#369EAD] font-serif">{user.credits}</span><span className="text-gray-400">/ {user.maxCredits}</span></div>
                </div>
                {user.credits === 0 && (<div className="pb-2 text-amber-500 flex items-center gap-2 animate-pulse"><AlertCircle className="w-5 h-5" /><span className="text-sm font-medium">Límite alcanzado</span></div>)}
              </div>
            </Card>
            <Card className="flex flex-col justify-center items-center text-center bg-[#1A3A3E] !border-none text-white transition-colors duration-500">
              <div className="w-16 h-16 rounded-full bg-[#369EAD] flex items-center justify-center mb-4 shadow-lg border-2 border-[#C5A059]"><Calendar className="w-8 h-8 text-white" /></div>
              <h3 className="text-sm uppercase tracking-widest text-[#C5A059] font-bold mb-2">Próxima Clase</h3>
              {nextClass ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-2xl font-serif text-[#C5A059] font-bold leading-tight">{nextClass.day}</p>
                  <p className="text-3xl font-serif text-white font-bold my-1">{nextClass.time}</p>
                  <p className="text-[#EBF5F6] text-xs opacity-80 mt-1">{nextClass.type}</p>
                </div>
              ) : (
                <div className="opacity-70">
                  <p className="text-[#EBF5F6] text-sm italic">No tienes reservas activas</p>
                  <p className="text-[#EBF5F6] text-[10px] mt-1 uppercase tracking-wider">¡Reserva abajo!</p>
                </div>
              )}
            </Card>
          </div>
          <h3 className="text-xl text-[#1A3A3E] mb-6 font-serif border-l-4 border-[#369EAD] pl-4">Programación Semanal</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sessions.map((session) => {
              const isBooked = user.history.includes(session.id);
              const isFull = session.booked >= session.spots;
              const canBook = user.credits > 0 && !isBooked && !isFull;
              return (
                <div key={session.id} className={`relative p-6 rounded-sm border transition-all ${isBooked ? 'bg-[#EBF5F6] border-[#369EAD] ring-1 ring-[#369EAD]' : 'bg-white border-gray-100 hover:shadow-md'}`}>
                  {isBooked && (<div className="absolute top-3 right-3 text-[#369EAD]"><CheckCircle className="w-5 h-5" /></div>)}
                  <div className="mb-4">
                    <span className="block text-xs uppercase tracking-widest text-[#1A3A3E] font-bold mb-1">{session.day}</span>
                    <h4 className="text-2xl font-serif text-[#1A3A3E]">{session.time}</h4>
                    <p className="text-xs text-gray-400 mt-1">{session.type}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-4 h-4" />{session.booked}/{session.spots}</div>
                    {isBooked ? (
                      <button onClick={() => handleCancel(session.id)} className="text-xs text-red-500 hover:text-red-700 underline underline-offset-4 decoration-red-200 transition-colors">Cancelar</button>
                    ) : (
                      <Button onClick={() => handleBooking(session.id)} disabled={!canBook} variant={canBook ? 'primary' : 'disabled'} className="!px-4 !py-1 !text-[10px]">{isFull ? 'Lleno' : 'Reservar'}</Button>
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

  const AdminDashboard = () => (
    <div className="min-h-screen bg-gray-50"><nav className="bg-[#1A3A3E] text-white shadow-lg sticky top-0 z-20"><div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-xl font-serif font-bold">Admin Panel</span><span className="bg-[#C5A059] text-[#1A3A3E] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Master</span></div><button onClick={handleLogout} className="text-gray-300 hover:text-white text-sm">Salir</button></div></nav><div className="max-w-7xl mx-auto px-6 py-10"><div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"><div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-[#369EAD]"><span className="text-gray-400 text-xs uppercase tracking-widest">Total Alumnas</span><div className="text-3xl font-serif text-[#1A3A3E] mt-2">{dbUsers.filter(u => u.role === 'student').length}</div></div><div className="bg-white p-6 rounded-sm shadow-sm border-l-4 border-[#C5A059]"><span className="text-gray-400 text-xs uppercase tracking-widest">Asistencia Semanal</span><div className="text-3xl font-serif text-[#1A3A3E] mt-2">{sessions.reduce((acc, curr) => acc + curr.booked, 0)}<span className="text-sm text-gray-400 font-sans ml-2">reservas</span></div></div></div><div className="bg-white rounded-sm shadow-sm overflow-hidden"><div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-serif text-lg text-[#1A3A3E]">Gestión de Alumnas</h3><Button variant="secondary" className="!text-[10px] !px-4">Descargar CSV</Button></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs font-medium"><tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Nombre</th><th className="px-6 py-4">Plan</th><th className="px-6 py-4 text-center">Créditos</th><th className="px-6 py-4">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{dbUsers.filter(u => u.role === 'student').map((student) => (<tr key={student.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-mono text-gray-400">{student.id}</td><td className="px-6 py-4 font-medium text-[#1A3A3E]">{student.firstName}</td><td className="px-6 py-4"><span className="px-2 py-1 bg-[#EBF5F6] text-[#369EAD] rounded-full text-xs font-bold">{student.plan}</span></td><td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-2"><span className={`font-bold ${student.credits === 0 ? 'text-red-400' : 'text-green-600'}`}>{student.credits}</span><span className="text-gray-300">/</span><span className="text-gray-400">{student.maxCredits}</span></div></td><td className="px-6 py-4"><button className="text-[#369EAD] hover:underline text-xs font-bold uppercase tracking-widest">Editar</button></td></tr>))}</tbody></table></div></div></div></div>
  );

  return (
    <div className="font-serif text-[#1A3A3E] antialiased">
      {notification && (<div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-sm shadow-xl flex items-center gap-3 animate-bounce ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#1A3A3E] text-white'}`}>{notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}<span className="text-sm font-medium tracking-wide">{notification.msg}</span></div>)}
      {view === 'login' && <LoginView />}
      {view === 'student' && <StudentDashboard />}
      {view === 'admin' && <AdminDashboard />}
    </div>
  );
}