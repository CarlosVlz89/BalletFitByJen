import React from 'react';

// Este componente recibe "children" (el contenido) y "className" extra si hace falta
const GlassCard = ({ children, className = "" }) => {
  return (
    <div className={`backdrop-blur-md bg-white/30 border border-white/20 shadow-xl rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;