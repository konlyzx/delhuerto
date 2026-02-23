import React from 'react';
import { ShoppingBasket, ShoppingCart, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
    user: User | null;
    onLogout: () => void;
    cartCount: number;
    onOpenCart: () => void;
    onMenuClick: () => void;
    setView: (v: any) => void;
    scrolled: boolean;
}

import logoImg from '../assets/images/logo.png';

export const Navbar = ({ user, onLogout, cartCount, onOpenCart, onMenuClick, setView, scrolled }: NavbarProps) => (
    <nav
        className={`sticky top-0 z-50 mx-auto backdrop-blur-xl border-stone-800/20 px-6 transition-all duration-300 ease-out origin-top ${scrolled
            ? "w-[85%] translate-y-4 rounded-full bg-brand-cream/85 shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 border-b-2"
            : "w-full translate-y-0 rounded-none bg-brand-cream shadow-none py-4 border-b-4"
            }`}
    >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center flex-1">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('landing')}>
                    <img
                        src={logoImg}
                        alt="DelHuerto Logo"
                        className={`w-auto transition-all duration-300 ease-out origin-left ${scrolled ? "h-[60px] scale-[1.15]" : "h-[88px] scale-[1.6] translate-x-4"
                            }`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/delhuerto/100/100';
                        }}
                    />
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-600 md:ml-12 lg:ml-20">
                    <button onClick={() => setView('landing')} className="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                        Inicio
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                    </button>
                    <button onClick={() => setView('market')} className="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                        Catálogo
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                    </button>
                    {user?.role === 'producer' ? (
                        <button onClick={() => setView('dashboard')} className="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                            Mi Huerto (Panel)
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                        </button>
                    ) : (
                        <button onClick={() => setView('orders')} className="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                            Mis Pedidos
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-3">
                        {user.role === 'producer' ? (
                            <button className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors" title="Notificaciones">
                                <ShoppingBasket size={22} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        ) : (
                            <button
                                onClick={onOpenCart}
                                className="relative p-2 text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
                                title="Carrito de compras"
                            >
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-amber-400 border-2 border-stone-800 text-stone-800 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <div className="relative group">
                            <button className="flex items-center gap-2 p-1 pr-3 bg-white border-2 border-stone-800 rounded-full hover:bg-stone-50 transition-colors shadow-[2px_2px_0px_0px_rgba(41,37,36,0.3)]">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-sage/30 border border-stone-800/10">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt={user.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-bold text-stone-400 leading-none uppercase tracking-widest">{user.role === 'producer' ? 'Huerto' : 'Comprador'}</span>
                                    <span className="text-xs font-bold text-stone-800 leading-tight truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                                </div>
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(41,37,36,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50">
                                <div className="p-3 border-b-2 border-dashed border-stone-200">
                                    <p className="font-bold text-sm text-stone-800 truncate">{user.email}</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button onClick={() => setView(user.role === 'producer' ? 'dashboard' : 'orders')} className="w-full text-left px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-800 rounded-lg transition-colors">
                                        {user.role === 'producer' ? 'Mi Panel' : 'Historial de compras'}
                                    </button>
                                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <LogOut size={16} /> Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setView('login')} className="text-sm font-bold text-stone-600 px-4 py-2 hover:text-stone-800">Entrar</button>
                        <button onClick={() => setView('register')} className="sketch-button !py-2 !px-6 !text-sm">Unirse</button>
                    </div>
                )}
            </div>
        </div>
    </nav>
);
