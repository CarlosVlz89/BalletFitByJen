import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginView = ({ onLogin, error }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    await onLogin(id, password);
    setIsLoggingIn(false);
  };

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
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <button type="submit" disabled={isLoggingIn} className="w-full bg-[#1A3A3E]/90 hover:bg-[#369EAD] text-white py-5 rounded-xl font-sans uppercase tracking-[0.3em] text-[11px] font-bold transition-all shadow-lg active:scale-95 border border-white/20 backdrop-blur-sm flex justify-center items-center gap-2">
               {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : "ENTRAR"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;