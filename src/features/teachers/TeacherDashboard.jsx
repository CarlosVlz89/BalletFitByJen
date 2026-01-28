import React, { useState, useEffect } from 'react';
import { doc, updateDoc, setDoc, getDoc, increment, arrayRemove, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; // Usamos la config centralizada
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
import { 
  Key, LogOut, BookOpen, Trophy, ClipboardList, Stethoscope, Check, Calendar 
} from 'lucide-react';
import { 
  WEEKLY_SCHEDULE, 
  getNextClassFromSchedule, 
  getCurrentMonthName 
} from '../../utils/data';

const APP_ID = "balletfitbyjen-6b36a"; // Tu ID de proyecto

const TeacherDashboard = ({ user, onLogout, showNotification, onUpdatePassword }) => {
  const [students, setStudents] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState("");

  // Este componente busca sus propios datos
  useEffect(() => {
     const unsubStudents = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas'), (snap) => {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
     });
     const unsubSessions = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones'), (snap) => {
        const data = {}; snap.docs.forEach(d => data[d.id] = d.data());
        setSessionsData(data);
     });
     return () => { unsubStudents(); unsubSessions(); };
  }, []);

  const currentMonth = getCurrentMonthName();
  const teacherClasses = WEEKLY_SCHEDULE.filter(s => s.teacher.toUpperCase() === user.firstName.toUpperCase());
  const nextSession = getNextClassFromSchedule(user.firstName);
  const roster = students.filter(s => s.history?.includes(nextSession?.id) && s.status !== 'inactive');

  const handleMarkAttendance = async (studentId, sessionId) => { 
      if (!auth.currentUser) return; 
      if (!window.confirm("¿Confirmar asistencia?")) return; 
      try { 
          const studentRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', studentId); 
          const sessionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', sessionId); 
          const sessionSnap = await getDoc(sessionRef); 
          const sessionIsCounted = sessionSnap.exists() ? sessionSnap.data().isCounted : false; 
          
          if (!sessionIsCounted) { 
              await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'metadata'), { totalClassesTaught: increment(1) }); 
              await setDoc(sessionRef, { isCounted: true }, { merge: true }); 
          } 
          await updateDoc(studentRef, { totalAttendance: increment(1), history: arrayRemove(sessionId) }); 
          await updateDoc(sessionRef, { booked: increment(-1) }); 
          showNotification('Asistencia marcada'); 
      } catch (err) { console.error(err); } 
  };

  return (
    <div className="pb-20 relative z-10">

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

export default TeacherDashboard;