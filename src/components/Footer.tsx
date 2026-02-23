import React from 'react';
import logoImg from '../assets/images/logo.png';

interface FooterProps {
    setView: (v: any) => void;
}

export const Footer = ({ setView }: FooterProps) => (
    <footer className="bg-stone-900 text-white py-24 px-4 relative overflow-hidden text-center md:text-left">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 relative z-10">
            <div className="space-y-8">
                <div className="flex items-center gap-2">
                    <img
                        src={logoImg}
                        alt="DelHuerto Logo"
                        className="h-20 w-auto brightness-0 invert"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/delhuerto/100/100';
                        }}
                    />
                </div>
                <p className="text-stone-400 leading-relaxed">Transformando el comercio local a través de la tecnología y la confianza. Del campo a tu mesa, sin intermediarios.</p>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Plataforma</h4>
                <ul className="space-y-4 text-stone-400">
                    <li><button onClick={() => setView('landing')} className="hover:text-brand-leaf">Inicio</button></li>
                    <li><button onClick={() => setView('login')} className="hover:text-brand-leaf">Mercado</button></li>
                    <li><button onClick={() => setView('register')} className="hover:text-brand-leaf">Registrarse</button></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Comunidad</h4>
                <ul className="space-y-4 text-stone-400">
                    <li><a href="#" className="hover:text-brand-leaf">Productores</a></li>
                    <li><a href="#" className="hover:text-brand-leaf">Historias</a></li>
                    <li><a href="#" className="hover:text-brand-leaf">ODS</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-lg">Contacto</h4>
                <ul className="space-y-4 text-stone-400">
                    <li>hola@delhuerto.com</li>
                    <li>+57 300 123 4567</li>
                    <li>Bogotá, Colombia</li>
                </ul>
            </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-stone-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-500 text-sm relative z-10">
            <span>© 2026 DelHuerto. Todos los derechos reservados.</span>
            <div className="flex gap-6">
                <a href="#" className="hover:text-white">Privacidad</a>
                <a href="#" className="hover:text-white">Términos</a>
            </div>
        </div>

        {/* Large background text */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none opacity-[0.03]">
            <h2 className="text-[15vw] font-serif font-bold whitespace-nowrap leading-none">
                DelHuerto
            </h2>
        </div>
    </footer>
);
