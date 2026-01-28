import React, { useState } from 'react';
import GlassButton from '../../components/ui/GlassButton';
import { 
  X, Shield, FileText, ArrowRight, 
  CreditCard, Clock, CalendarX, Footprints, ShieldCheck, Camera 
} from 'lucide-react';

const LandingPage = ({ onGoToLogin }) => {
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'rules' | null

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Fondo Animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EBF5F6] via-[#d4e9ed] to-[#EBF5F6] -z-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#369EAD]/10 blur-[100px] -z-10"></div>
      
      {/* Navbar Simple */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-serif font-bold text-[#1A3A3E] italic">Ballet Fit <span className="text-[#369EAD]">by Jen</span></div>
        <GlassButton onClick={onGoToLogin} className="!py-2 !px-4">
           Portal Alumnas <ArrowRight size={14} />
        </GlassButton>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-10 mb-20">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-[#1A3A3E] mb-6 tracking-tight">
          Fuerza & <br/><span className="italic text-[#369EAD]">Elegancia</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-md mb-10 font-sans tracking-wide">
          Descubre la mejor versión de ti misma a través de la fusión perfecta entre el ballet clásico y el fitness.
        </p>
        
        <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#369EAD] to-[#C5A059] rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <button 
                onClick={onGoToLogin}
                className="relative px-10 py-5 bg-[#1A3A3E] text-white text-sm font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#369EAD] transition-all shadow-2xl flex items-center gap-4"
            >
                Entrar al Portal
            </button>
        </div>
      </main>

      {/* Footer Legal */}
      <footer className="p-6 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest space-x-6 pb-10">
        <button onClick={() => setActiveModal('privacy')} className="hover:text-[#369EAD] transition-colors border-b border-transparent hover:border-[#369EAD]">Aviso de Privacidad</button>
        <span>•</span>
        <button onClick={() => setActiveModal('rules')} className="hover:text-[#369EAD] transition-colors border-b border-transparent hover:border-[#369EAD]">Reglamento</button>
      </footer>

      {/* --- MODALES --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-[#1A3A3E]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white/95 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl p-8 md:p-12 relative animate-in fade-in zoom-in duration-300 custom-scrollbar">
                <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                
                {/* --- AVISO DE PRIVACIDAD COMPLETO --- */}
                {activeModal === 'privacy' && (
                    <div className="space-y-6 text-gray-600 font-sans text-sm leading-relaxed text-justify">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <Shield className="text-[#369EAD]" size={32} />
                            <h2 className="text-3xl font-serif italic text-[#1A3A3E] font-bold">Aviso de Privacidad</h2>
                        </div>
                        
                        <p><strong>Ballet Fit by Jen</strong>, con domicilio en Guadalajara, Jalisco, es responsable del tratamiento de sus datos personales conforme a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
                        
                        <div>
                            <h3 class="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-2">1. Datos Recabados</h3>
                            <p>Para efectos de inscripción y seguimiento personalizado, recabamos: Nombre completo, número de WhatsApp, rango de edad, nivel de actividad física, hábitos diarios, objetivos personales y, en su caso, información sensible referente a lesiones o condiciones físicas previas que debamos conocer para su seguridad durante la práctica.</p>
                        </div>

                        <div>
                            <h3 class="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-2">2. Finalidad del Tratamiento</h3>
                            <p>Sus datos serán utilizados exclusivamente para: (a) Agendar y confirmar sus clases; (b) Adaptar los ejercicios a su condición física y prevenir lesiones; (c) Mantener comunicación sobre cambios en horarios o promociones; (d) Fines estadísticos internos sobre el origen de nuestras alumnas.</p>
                        </div>

                        <div>
                            <h3 class="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-2">3. Transferencia y Seguridad</h3>
                            <p>Le informamos que sus datos personales no serán compartidos, vendidos ni transferidos a terceros ajenos a la operación de <strong>Ballet Fit by Jen</strong>. Contamos con medidas de seguridad técnicas para proteger su información contra daño, pérdida o acceso no autorizado.</p>
                        </div>

                        <div>
                            <h3 class="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-2">4. Derechos ARCO</h3>
                            <p>Usted tiene derecho a conocer qué datos tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación); que la eliminemos de nuestros registros (Cancelación); o bien, oponerse al uso de sus datos para fines específicos (Oposición). Para ejercer estos derechos, puede contactarnos directamente vía WhatsApp.</p>
                        </div>

                        <p className="opacity-50 italic mt-4 text-xs border-t pt-4">Última actualización: Enero 2026</p>
                    </div>
                )}

                {/* --- REGLAMENTO COMPLETO CON ICONOS --- */}
                {activeModal === 'rules' && (
                    <div className="space-y-6 text-gray-600 font-sans text-sm leading-relaxed">
                         <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <FileText className="text-[#C5A059]" size={32} />
                            <h2 className="text-3xl font-serif italic text-[#1A3A3E] font-bold">Reglamento Interno</h2>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <CreditCard size={16} /> 1. Inscripción y pagos
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Todos los paquetes son mensuales y se pagan los primeros 5 días del mes.</li>
                                <li>La vigencia del paquete es mensual y no acumulable.</li>
                                <li>Las clases son personales e intransferibles.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <Clock size={16} /> 2. Asistencia y puntualidad
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Cupo máximo de 10 alumnas por horario.</li>
                                <li>Tolerancia máxima de 10 minutos.</li>
                                <li>Las clases no tomadas no se reponen ni se guardan.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <CalendarX size={16} /> 3. Cancelaciones y reposiciones
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Cancelaciones por parte de la alumna con mínimo 6 horas de anticipación.</li>
                                <li>Las clases canceladas por la alumna no son reponibles.</li>
                                <li>Si BalletFit cancela una clase, podrá reponerse dentro del mismo mes en otro horario disponible.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <Footprints size={16} /> 4. Indumentaria y material
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Uso obligatorio de calcetines.</li>
                                <li>Traer tapete personal.</li>
                                <li>Si se utiliza material del estudio, debe limpiarse y acomodarse al finalizar la clase.</li>
                                <li>Cuidar el material de uso común.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <ShieldCheck size={16} /> 5. Conducta y seguridad
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Respeto al cuerpo, al grupo y al espacio.</li>
                                <li>Evitar uso del celular durante la clase.</li>
                                <li>Informar cualquier lesión o condición física antes de iniciar.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-[#369EAD] uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                <Camera size={16} /> 6. Uso de la imagen
                            </h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Durante las clases, BalletFit podrá tomar fotografías o grabar videos con fines promocionales y de difusión en redes sociales.</li>
                                <li>Al inscribirse, la alumna autoriza el uso de su imagen sin remuneración alguna.</li>
                                <li>El material será utilizado de manera respetuosa y profesional.</li>
                                <li>En caso de no desear aparecer en medios, deberá comunicarlo previamente.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;