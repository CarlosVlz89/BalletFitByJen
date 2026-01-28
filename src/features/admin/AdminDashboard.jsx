import React, { useState, useEffect } from 'react';
import { 
  doc, setDoc, updateDoc, deleteDoc, getDoc, 
  increment, arrayRemove, collection, onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; 
import GlassCard from '../../components/ui/GlassCard';
import { 
  Calendar, Check, UserPlus, Trash2, DollarSign, 
  PartyPopper, Users, Info, ToggleLeft, ToggleRight, 
  ShieldCheck, Key, UserCheck, UserX, Loader2, X,
  ClipboardList, Stethoscope, RefreshCw, Trophy 
} from 'lucide-react';

// --- IMPORTAMOS LA LÓGICA REAL AQUÍ ---
import { 
  WEEKLY_SCHEDULE, 
  getNextClassFromSchedule, 
  getCurrentMonthName 
} from '../../utils/data';

const APP_ID = "balletfitbyjen-6b36a"; 

const PRICES = [
  { plan: '4 clases x sem', price: 850 },
  { plan: '3 clases x sem', price: 720 },
  { plan: '2 clases x sem', price: 620 },
  { plan: '1 clase x sem', price: 450 },
  { plan: 'Clase Suelta', price: 150 },
];

// Pequeño componente local para botones
const GlassButton = ({ children, onClick, className = "", disabled }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-6 py-3 bg-[#369EAD] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-[#369EAD] transition-all shadow-lg btn-shine disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

// --- COMPONENTE PRINCIPAL ---
const AdminDashboard = ({ onLogout, showNotification }) => {
  // 1. Estados de Datos
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessionsData, setSessionsData] = useState({});
  const [extraGuests, setExtraGuests] = useState([]);
  const [settings, setSettings] = useState({});

  // 2. Estados de UI
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null); 
  const [showStaffPassModal, setShowStaffPassModal] = useState(null);
  const [newPassValue, setNewPassValue] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempNotes, setTempNotes] = useState("");
  const [newStudent, setNewStudent] = useState({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '', registrationDate: new Date().toISOString().split('T')[0] });
  const [newStaff, setNewStaff] = useState({ id: '', name: '', password: '', role: 'teacher' });
  const [saving, setSaving] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // Usamos la función importada real
  const currentMonth = getCurrentMonthName(); 
  
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraGuest, setExtraGuest] = useState({ name: '', type: 'Clase Suelta' });
  const [showCreditModal, setShowCreditModal] = useState(null);
  const [manualCredits, setManualCredits] = useState(1);

  // 3. CONEXIÓN A FIREBASE
  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(list);
    });
    const unsubTeachers = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'maestros'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachers(list);
    });
    const unsubSessions = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones'), (snap) => {
      const data = {};
      snap.docs.forEach(d => { data[d.id] = d.data(); });
      setSessionsData(data);
    });
    const unsubExtras = onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'asistencias_extras'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setExtraGuests(list);
    });
    const unsubConfig = onSnapshot(doc(db, 'artifacts', APP_ID, 'public', 'data', 'config', 'metadata'), (doc) => {
        if(doc.exists()) setSettings(doc.data());
    });

    return () => { 
      unsubStudents(); unsubTeachers(); unsubSessions(); unsubExtras(); unsubConfig(); 
    };
  }, []);

  // 4. HELPERS INTERNOS
  const getNextAvailableId = (list) => {
    const ids = list.map(s => s.id).filter(id => id.startsWith('BF-')).map(id => parseInt(id.split('-')[1])).filter(num => !isNaN(num));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `BF-${String(maxId + 1).padStart(3, '0')}`;
  };

  useEffect(() => { 
    if (showAddForm) { 
        const nextId = getNextAvailableId(students); 
        setNewStudent(prev => ({ ...prev, id: nextId })); 
    } 
  }, [showAddForm, students]);

  // AQUI LLAMAMOS A LA LÓGICA REAL (CALCULA EL DÍA MÁS CERCANO)
  const nextSession = getNextClassFromSchedule(); 
  
  const activeStudents = students.filter(s => s.status !== 'inactive');
  const roster = students.filter(s => s.history?.includes(nextSession?.id) && s.status !== 'inactive');
  const totalAlumnas = students.reduce((acc, s) => acc + (s.monthlyPayment || 0), 0);
  const totalExtras = extraGuests ? extraGuests.reduce((acc, g) => acc + (g.totalPaid || 0), 0) : 0;
  const totalIncome = totalAlumnas + totalExtras;

  // 5. HANDLERS
  const toggleSessionStatus = async (sessionId, currentStatus) => { 
    if (!auth.currentUser) return; 
    await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', sessionId), { isClosed: !currentStatus }, { merge: true }); 
    showNotification('Estado actualizado'); 
  };
  
  const handleManualCreditUpdate = async () => { 
      if (!auth.currentUser || !showCreditModal) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', showCreditModal), { credits: increment(parseInt(manualCredits)) }); 
          showNotification(`Se agregaron ${manualCredits} créditos`); 
          setShowCreditModal(null); 
          setManualCredits(1); 
        } catch (err) { showNotification('Error', 'error'); } 
  };

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
            showNotification('Asistencia confirmada'); 
        } catch (err) { console.error(err); } 
    };

  const handleAddExtraGuest = async (sessionId) => { 
      if (!extraGuest.name.trim()) return showNotification("Escribe un nombre", "error"); 
      try { 
          const nameKey = extraGuest.name.trim().toUpperCase(); 
          const guestRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'asistencias_extras', nameKey); 
          const guestSnap = await getDoc(guestRef); 
          if (guestSnap.exists()) { 
              await updateDoc(guestRef, { totalVisits: increment(1), lastSessionId: sessionId, lastDate: new Date().toISOString(), totalPaid: increment(extraGuest.type === 'Clase Suelta' ? 150 : 0) }); 
            } else { 
                await setDoc(guestRef, { name: nameKey, type: extraGuest.type, totalVisits: 1, totalPaid: extraGuest.type === 'Clase Suelta' ? 150 : 0, firstVisit: new Date().toISOString(), lastSessionId: sessionId, status: 'prospect' }); 
            } 
            const sessionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', sessionId); 
            await setDoc(sessionRef, { booked: increment(1) }, { merge: true }); 
            showNotification(guestSnap.exists() ? 'Visita recurrente' : 'Nueva invitada'); 
            setShowExtraModal(false); 
            setExtraGuest({ name: '', type: 'Clase Suelta' }); 
        } catch (err) { showNotification('Error', 'error'); } 
    };

  const handleToggleStatus = async (collectionName, id, currentStatus) => { 
      if (!auth.currentUser) return; 
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive'; 
      if (!window.confirm(`¿Cambiar estatus?`)) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, id), { status: newStatus }); 
          showNotification('Estatus actualizado'); 
        } catch (err) { console.error(err); } 
    };

  const handleUpdatePassword = async (collectionName, id) => { 
      if (!auth.currentUser) return; 
      if (!newPassValue.trim()) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, id), { password: newPassValue.trim() }); 
          showNotification('Contraseña actualizada'); 
          setShowPassModal(null); 
          setShowStaffPassModal(null); 
          setNewPassValue(""); 
        } catch (err) { console.error(err); } 
    };

  const handleRegister = async (e) => { 
      if (!auth.currentUser) return; e.preventDefault(); 
      const cleanId = newStudent.id.trim().toUpperCase(); 
      if (!cleanId || !newStudent.name || !newStudent.password) { showNotification('Completa los campos', 'error'); return; } 
      setSaving(true); 
      try { 
          const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', cleanId); 
          const docSnap = await getDoc(docRef); 
          if (docSnap.exists()) { showNotification(`ID ya usado`, 'error'); setSaving(false); return; } 
          const max = parseInt(newStudent.plan.split(' ')[0]) || 2; 
          await setDoc(docRef, { id: cleanId, name: newStudent.name.trim().toUpperCase(), password: newStudent.password, plan: newStudent.plan, maxCredits: max, credits: max, history: [], monthlyPayment: 0, totalAttendance: 0, notes: newStudent.notes.trim(), registrationDate: newStudent.registrationDate, status: 'active', }); 
          showNotification('Registrada'); 
          setShowAddForm(false); 
          setNewStudent({ id: '', name: '', password: '', plan: '2 clases x sem', notes: '' }); 
        } catch (err) { console.error(err); } 
        setSaving(false); 
    };

  const handleUpdateStudentData = async (studentId) => { 
      try { 
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', studentId), { name: tempName.trim().toUpperCase(), registrationDate: tempDate, notes: tempNotes.trim() }); 
          showNotification('Datos actualizados'); 
          setEditingId(null); 
        } catch (err) { showNotification('Error', 'error'); } 
    };

  const handleRegisterStaff = async (e) => { 
      if (!auth.currentUser) return; e.preventDefault(); 
      const cleanId = newStaff.id.trim().toUpperCase(); 
      if (!cleanId || !newStaff.name || !newStaff.password) { showNotification('Completa los campos', 'error'); return; } 
      setSaving(true); 
      try { 
          await setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'maestros', cleanId), { ...newStaff, id: cleanId, name: newStaff.name.trim().toUpperCase(), status: 'active' }); 
          showNotification('Staff registrado'); 
          setShowStaffForm(false); 
          setNewStaff({ id: '', name: '', password: '', role: 'teacher' }); 
        } catch (err) { console.error(err); } 
        setSaving(false); 
    };

  const handlePayment = async () => { 
      if (!auth.currentUser || !showPaymentModal) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', showPaymentModal), { monthlyPayment: parseFloat(paymentAmount) }); 
          showNotification('Pago registrado'); 
          setShowPaymentModal(null); 
          setPaymentAmount(0); 
        } catch (err) { console.error(err); } 
    };

  const deleteStudent = async (id, name) => { 
      if (!auth.currentUser) return; 
      if (window.confirm(`¿Borrar a ${name}?`)) { 
          try { 
              await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'alumnas', id)); 
              showNotification('Eliminada'); 
            } catch (err) { showNotification('Error', 'error'); } 
        } 
    };

  const deleteTeacher = async (id, name) => { 
      if (!auth.currentUser) return; 
      if (window.confirm(`¿Borrar a ${name}?`)) { 
          try { 
              await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'maestros', id)); 
              showNotification('Eliminado'); 
            } catch (err) { showNotification('Error', 'error'); } 
        } 
    };

  // --- RENDERIZADO DEL DASHBOARD ---
  return (
    <div className="pb-20 relative z-10">

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <GlassCard className="lg:col-span-1 !bg-[#1A3A3E]/90 !border-[#C5A059] text-white">
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif italic text-[#C5A059] flex items-center gap-2">
                    <ClipboardList size={20} /> Roster
                  </h3>
                  {/* Aquí se mostrará la sesión REAL calculada */}
                  <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest">
                    {nextSession?.day || 'Sin clase'} {nextSession?.time || ''}
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
                    {/* Botón de asistencia que usa el ID de la sesión real */}
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
                    <button onClick={async () => { if(window.confirm("¿Eliminar?")) { await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'asistencias_extras', guest.id)); const sessionRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'sesiones', nextSession.id); await updateDoc(sessionRef, { booked: increment(-1) }); showNotification("Eliminada"); }}} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
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
                {/* Usamos el WEEKLY_SCHEDULE importado del utils/data.js */}
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
                        <button onClick={async () => { if(window.confirm("¿Borrar historial?")) { await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'asistencias_extras', guest.id)); showNotification("Borrado"); } }} className="p-2 text-red-200 hover:text-red-500 rounded-full transition-all"><Trash2 size={16} /></button>
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
      {/* RESTO DE MODALES */}
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

export default AdminDashboard;