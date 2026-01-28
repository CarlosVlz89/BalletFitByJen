import React from 'react';

const GlassButton = ({ children, onClick, variant = 'primary', disabled = false, className = '' }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-sans font-bold tracking-widest uppercase text-[10px] transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm";
  const variants = {
    primary: "bg-[#369EAD]/90 text-white hover:bg-[#1A3A3E] border border-white/20",
    secondary: "bg-white/50 border border-[#369EAD] text-[#369EAD] hover:bg-white",
    disabled: "bg-gray-200/50 text-gray-400 cursor-not-allowed border border-gray-200"
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

export default GlassButton;