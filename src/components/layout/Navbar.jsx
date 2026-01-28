import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react'; // Asumiendo que usas lucide-react

const Navbar = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Este useEffect reemplaza tu script de window.addEventListener scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'h-16 shadow-md bg-white/90 backdrop-blur-md' : 'h-20 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="font-serif font-bold text-2xl text-[#1A3A3E]">
          Ballet Fit <span className="text-[#369EAD] italic">by Jen</span>
        </div>

        {/* Menú Desktop (Ejemplo) */}
        <div className="hidden md:flex gap-6">
            <button onClick={() => onNavigate('home')}>Inicio</button>
            <button onClick={() => onNavigate('admin')}>Soy Jen (Admin)</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;