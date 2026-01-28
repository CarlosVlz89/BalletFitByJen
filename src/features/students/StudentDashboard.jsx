import React, { useState } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import { 
  Key, LogOut, Heart, Activity, Calendar, Users 
} from 'lucide-react';
// Importamos las funciones desde nuestro nuevo archivo de utilidades
import { 
  getCurrentMonthName, 
  isClassInPast, 
  WEEKLY_SCHEDULE // Importamos el horario global 
} from '../../utils/data';

const StudentDashboard = ({ user, quote, sessionsData, onBook, onCancel, onLogout, onUpdatePassword }) => {
  // Usamos el horario global importado
  const sessions = WEEKLY_SCHEDULE; 
  
  const myHistory = user.history || [];
  const mySessions = sessions.filter(s => myHistory.includes(s.id));
  const nextClass = mySessions.length > 0 ? mySessions[0] : null;
  const currentMonth = getCurrentMonthName();
  
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");
  
  return (
    <div className="pb-20 relative z-10">

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

export default StudentDashboard;