import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBasket, 
  User as UserIcon, 
  Store, 
  Plus, 
  LogOut, 
  Search, 
  MapPin, 
  ShoppingCart, 
  Trash2, 
  ChevronRight,
  Package,
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { User, Product, CartItem } from './types';

// --- Components ---

const Navbar = ({ user, onLogout, cartCount, onOpenCart, onMenuClick, setView, scrolled }: { user: User | null, onLogout: () => void, cartCount: number, onOpenCart: () => void, onMenuClick: () => void, setView: (v: any) => void, scrolled: boolean }) => (
  <motion.nav 
    initial={false}
    animate={{
      width: scrolled ? "80%" : "100%",
      y: scrolled ? 16 : 0,
      borderRadius: scrolled ? 100 : 0,
      backgroundColor: scrolled ? "rgba(253, 251, 230, 0.75)" : "rgba(253, 251, 230, 1)",
      boxShadow: scrolled ? "0 20px 40px rgba(0,0,0,0.1)" : "0 0 0 rgba(0,0,0,0)",
      paddingTop: scrolled ? "0.5rem" : "1rem",
      paddingBottom: scrolled ? "0.5rem" : "1rem",
      borderBottomWidth: scrolled ? 2 : 4,
    }}
    transition={{
      type: "spring",
      stiffness: 260,
      damping: 30,
      mass: 1
    }}
    className="sticky top-0 z-50 mx-auto backdrop-blur-xl border-stone-800/20 px-6"
  >
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('landing')}>
          <motion.img 
            animate={{ 
              height: scrolled ? 60 : 88,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 30
            }}
            src="https://pub-8e4f80fda01d48079fcf4471ddcf627f.r2.dev/logo.png" 
            alt="DelHuerto Logo" 
            className="w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/delhuerto/100/100';
            }}
          />
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-600">
          <button onClick={() => setView('landing')} className="hover:text-brand-leaf transition-colors relative group">
            Inicio
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
          </button>
          <button onClick={() => setView('market')} className="hover:text-brand-leaf transition-colors relative group">
            Mercado
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
          </button>
          <a href="#" className="hover:text-brand-leaf transition-colors relative group">
            Productores
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{user.role}</span>
              <span className="text-sm font-bold text-stone-800">{user.name}</span>
            </div>
            {user.role === 'consumer' && (
              <button 
                onClick={onOpenCart}
                className="relative p-2 text-stone-800"
              >
                <div className="w-10 h-10 bg-brand-sage sketch-border flex items-center justify-center">
                  <ShoppingCart size={24} />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 border-2 border-stone-800 text-stone-800 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={onLogout} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setView('login')} className="text-sm font-bold text-stone-600 px-4 py-2 hover:text-stone-800">Entrar</button>
            <button onClick={() => setView('register')} className="sketch-button !py-2 !px-6 !text-sm">Unirse</button>
          </div>
        )}
      </div>
    </div>
  </motion.nav>
);

const ProductCard = ({ product, onAddToCart, isProducer }: { product: Product, onAddToCart?: (p: Product) => void, isProducer?: boolean }) => (
  <motion.div 
    layout
    whileHover={{ y: -5 }}
    className="sketch-card flex flex-col gap-4"
  >
    <div className="aspect-square bg-stone-50 sketch-border overflow-hidden relative group">
      <img 
        src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`} 
        alt={product.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-2 right-2 bg-white border-2 border-stone-800 px-2 py-1 text-xs font-bold">
        ${product.price.toFixed(2)}
      </div>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-stone-800 leading-tight">{product.name}</h3>
        <span className="text-[10px] font-bold text-stone-400 uppercase">{product.category}</span>
      </div>
      <p className="text-xs text-stone-500 line-clamp-2">{product.description}</p>
    </div>
    {!isProducer && (
      <button 
        onClick={() => onAddToCart?.(product)}
        className="sketch-button !py-2 !text-sm w-full"
      >
        Añadir al carrito
      </button>
    )}
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'market' | 'dashboard'>('landing');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'producer' | 'consumer'>('consumer');

  useEffect(() => {
    fetchProducts();

    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          email: firebaseUser.email || '',
          role: 'consumer',
          location: 'Bogotá'
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setView('market');
    } catch (error: any) {
      alert('Error al entrar: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setView('market');
    } catch (error: any) {
      alert('Error con Google: ' + error.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      // In a real app, you'd save the role to Firestore
      // For now, we'll just update the local state
      setUser({
        id: userCredential.user.uid,
        name: authName || authEmail.split('@')[0],
        email: authEmail,
        role: authRole,
        location: 'Bogotá'
      });
      setView(authRole === 'producer' ? 'dashboard' : 'market');
    } catch (error: any) {
      alert('Error al registrarse: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
    } catch (error: any) {
      console.error('Error logging out', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setItemToDelete(id);
  };

  const confirmRemoveFromCart = () => {
    if (itemToDelete !== null) {
      setCart(prev => prev.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const checkout = async () => {
    if (!user) {
      setView('login');
      return;
    }
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_id: user.id,
        items: cart,
        total: cartTotal
      })
    });
    if (res.ok) {
      setCart([]);
      setIsCartOpen(false);
      setOrderSuccess(true);
      fetchProducts();
      setTimeout(() => setOrderSuccess(false), 5000);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.producer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter((c): c is string => !!c);
    return ['Todos', ...Array.from(new Set(cats)).filter(c => c !== 'Todos')];
  }, [products]);

  const renderContent = () => {
    if (view === 'landing') {
      return (
        <div className="flex flex-col">
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto w-full px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative overflow-hidden md:overflow-visible">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 z-10"
            >
              <h1 className="text-6xl md:text-7xl font-serif font-bold text-stone-800 leading-tight">
                Alimentos <span className="text-brand-leaf italic">reales</span> de manos locales.
              </h1>
              <p className="text-xl text-stone-600 max-w-lg leading-relaxed">
                Conectamos a pequeños productores con personas que buscan frescura, calidad y un impacto positivo en su comunidad.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setView('register')} className="sketch-button relative overflow-hidden group">
                  <span className="relative z-10">Empezar a comprar</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
                <button onClick={() => { setAuthRole('producer'); setView('register'); }} className="sketch-button-outline relative overflow-hidden group">
                  <span className="relative z-10">Soy productor</span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              {/* Gray background shape */}
              <div className="absolute -top-20 -right-20 w-[120%] h-[140%] bg-stone-200/50 -rotate-3 rounded-3xl -z-10 hidden md:block"></div>
              
              <div className="relative bg-white p-4 sketch-border shadow-2xl rotate-1">
                <div className="aspect-video bg-stone-100 overflow-hidden border-2 border-stone-800 rounded-sm">
                  <img 
                    src="https://pub-8e4f80fda01d48079fcf4471ddcf627f.r2.dev/delhuerto.gif" 
                    alt="DelHuerto Animación" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Hand-drawn frame details */}
                <div className="absolute -inset-2 border-4 border-stone-800 rounded-lg pointer-events-none opacity-20"></div>
              </div>

              <div className="absolute -bottom-10 -right-6 sketch-card rotate-3 bg-white p-4 hidden md:block shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-leaf rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="font-bold text-stone-800">100% Orgánico</span>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Featured Products Preview */}
          <section className="max-w-7xl mx-auto w-full px-4 py-24">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="section-title">Cosecha del día</h2>
                <p className="text-stone-500">Productos frescos que acaban de llegar de la huerta.</p>
              </div>
              <button onClick={() => setView('market')} className="text-brand-leaf font-bold flex items-center gap-2 hover:underline">
                Ver todo el mercado <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </section>

          {/* ODS Section */}
          <section className="bg-brand-sage/15 py-24 rounded-[60px] md:rounded-[100px] my-12 mx-4 shadow-[inset_0_12px_48px_rgba(0,0,0,0.08)] border-2 border-stone-800/5">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="section-title">Nuestra Misión</h2>
              <p className="text-stone-500 mb-12 max-w-2xl mx-auto">
                Trabajamos bajo los Objetivos de Desarrollo Sostenible para transformar la forma en que consumimos.
              </p>
              <div className="flex flex-wrap justify-center gap-12">
                <motion.div whileHover={{ y: -10 }} className="ods-circle">
                  <ShoppingBasket size={40} className="text-amber-600 mb-2" />
                  Soberanía Alimentaria
                </motion.div>
                <motion.div whileHover={{ y: -10 }} className="ods-circle">
                  <CheckCircle2 size={40} className="text-green-600 mb-2" />
                  Sostenibilidad Ambiental
                </motion.div>
                <motion.div whileHover={{ y: -10 }} className="ods-circle">
                  <UserIcon size={40} className="text-blue-600 mb-2" />
                  Reducción de Desigualdades
                </motion.div>
              </div>
            </div>
          </section>

          {/* How it Works */}
          <section className="max-w-7xl mx-auto w-full px-4 py-32 relative overflow-hidden">
            <div className="text-center mb-20">
              <h2 className="section-title">¿Cómo funciona?</h2>
              <p className="text-stone-500 max-w-xl mx-auto">Tres simples pasos para transformar tu alimentación y apoyar al campo local.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-16 relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-stone-300 -z-10 hidden md:block"></div>
              
              {[
                { step: "01", title: "Explora", desc: "Descubre productos frescos cultivados cerca de ti por productores locales.", icon: <Search size={32} className="text-brand-leaf" /> },
                { step: "02", title: "Pide", desc: "Añade lo que necesites a tu carrito y confirma tu pedido directamente.", icon: <ShoppingCart size={32} className="text-brand-leaf" /> },
                { step: "03", title: "Recibe", desc: "Coordina la entrega y paga directamente al productor al recibir tus productos.", icon: <MapPin size={32} className="text-brand-leaf" /> }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -10 }}
                  className="sketch-card relative pt-16 bg-white"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-brand-sage sketch-border flex items-center justify-center text-3xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-stone-50 rounded-full border-2 border-stone-800/10">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-stone-800">{item.title}</h3>
                    <p className="text-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Community CTA */}
          <section className="max-w-7xl mx-auto w-full px-4 py-24">
            <div className="sketch-card bg-brand-sage/20 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 border-dashed rounded-[60px] md:rounded-[100px]">
              <div className="space-y-6 max-w-xl">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800">¿Eres productor? Únete a nuestra red.</h2>
                <p className="text-lg text-stone-600">Llega a más clientes, gestiona tus pedidos de forma sencilla y sé parte de una comunidad que valora tu trabajo.</p>
                <button onClick={() => { setAuthRole('producer'); setView('register'); }} className="sketch-button">Registrar mi huerta</button>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-white sketch-border rotate-3 p-4">
                <img 
                  src="https://images.unsplash.com/photo-1595665593673-bf1ad72905c0?auto=format&fit=crop&q=80&w=800" 
                  alt="Productor local" 
                  className="w-full h-full object-cover sketch-border"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="max-w-7xl mx-auto w-full px-4 py-24">
            <div className="sketch-card bg-brand-olive text-white p-12 md:p-20 text-center relative overflow-hidden rounded-[60px] md:rounded-[100px]">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="grid grid-cols-6 grid-rows-6 h-full">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className="border border-white/20"></div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-5xl font-serif italic">"Desde que uso DelHuerto, mi familia come mejor y sé exactamente de dónde viene cada fruta."</h2>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden mb-4">
                    <img src="https://picsum.photos/seed/user1/100/100" alt="Usuario" referrerPolicy="no-referrer" />
                  </div>
                  <span className="font-bold text-xl">Elena Rodríguez</span>
                  <span className="text-brand-sage text-sm">Consumidora Consciente</span>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-stone-900 text-white py-24 px-4 rounded-t-[60px] md:rounded-t-[100px] relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 relative z-10">
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://pub-8e4f80fda01d48079fcf4471ddcf627f.r2.dev/logo.png" 
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
        </div>
      );
    }

    if (view === 'market') {
      return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
          {orderSuccess && (
            <div className="bg-green-100 border-2 border-green-800 p-4 rounded-xl text-green-800 font-bold text-center">
              ¡Pedido realizado con éxito!
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Filters & Map */}
            <div className="md:w-1/4 space-y-6">
              <div className="sketch-card space-y-4">
                <h3 className="font-bold text-lg">Filtros</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-stone-800 rounded-lg outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${categoryFilter === cat ? 'bg-brand-sage text-stone-800 border-2 border-stone-800' : 'hover:bg-stone-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sketch-card space-y-4">
                <h3 className="font-bold text-lg">Productores Cerca</h3>
                <div className="h-48 bg-stone-100 sketch-border relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 grid grid-cols-4 grid-rows-4">
                    {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border border-stone-300"></div>)}
                  </div>
                  <MapPin className="absolute top-1/4 left-1/3 text-red-500" size={20} />
                  <MapPin className="absolute top-1/2 left-2/3 text-orange-500" size={20} />
                </div>
              </div>
            </div>

            {/* Right: Catalog */}
            <div className="md:w-3/4 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-serif font-bold">Catálogo</h2>
                <span className="text-stone-500 text-sm font-bold">{filteredProducts.length} productos encontrados</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                ))}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20 sketch-card bg-stone-50">
                  <Package size={48} className="mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 font-bold">No encontramos lo que buscas.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      );
    }

    if (view === 'login' || view === 'register') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white sketch-border p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-stone-800">
                {view === 'login' ? 'Bienvenido' : 'Crea tu cuenta'}
              </h2>
            </div>

            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {view === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                    <input 
                      type="text" 
                      required 
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-stone-800 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Rol</label>
                    <select 
                      value={authRole}
                      onChange={e => setAuthRole(e.target.value as 'producer' | 'consumer')}
                      className="w-full px-4 py-2 border-2 border-stone-800 rounded-lg outline-none"
                    >
                      <option value="consumer">Consumidor</option>
                      <option value="producer">Productor</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-stone-800 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contraseña</label>
                <input 
                  type="password" 
                  required 
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-stone-800 rounded-lg outline-none"
                />
              </div>
              <button type="submit" className="w-full sketch-button py-3 text-lg mt-4">
                {view === 'login' ? 'Entrar' : 'Registrar'}
              </button>
            </form>

            <div className="mt-4 space-y-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-800 py-3 rounded-lg font-bold hover:bg-stone-50 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continuar con Google
              </button>

              <div className="text-center">
                <button 
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="text-sm font-bold underline"
                >
                  {view === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setView('landing')}
              className="mt-4 w-full text-stone-400 text-xs flex items-center justify-center gap-1"
            >
              <ArrowLeft size={12} /> Volver
            </button>
          </motion.div>
        </div>
      );
    }

    if (view === 'dashboard') {
      if (!user || user.role !== 'producer') {
        setView('landing');
        return null;
      }
      return (
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold">Panel de Productor</h2>
                <p className="text-stone-500">Gestiona tus productos</p>
              </div>
              <button className="sketch-button flex items-center gap-2">
                <Plus size={20} /> Nuevo Producto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="sketch-card flex items-center gap-4">
                <Package size={32} />
                <div>
                  <p className="text-sm text-stone-500">Productos</p>
                  <p className="text-2xl font-bold">{products.filter(p => p.producer_id === user?.id).length}</p>
                </div>
              </div>
            </div>

            <div className="sketch-border bg-white overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b-2 border-stone-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Producto</th>
                    <th className="px-6 py-4 font-bold">Precio</th>
                    <th className="px-6 py-4 font-bold">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {products.filter(p => p.producer_id === user?.id).map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 font-medium">{p.name}</td>
                      <td className="px-6 py-4 font-bold text-brand-leaf">${p.price}</td>
                      <td className="px-6 py-4">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={handleLogout}
              className="text-stone-400 text-sm flex items-center gap-2 hover:text-stone-600"
            >
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </main>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col overflow-x-hidden">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onMenuClick={() => setView(user ? (user.role === 'producer' ? 'dashboard' : 'market') : 'login')}
        setView={setView}
        scrolled={scrolled}
      />

      {renderContent()}

      <AnimatePresence>
        {itemToDelete !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white z-[60] sketch-card p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-stone-800">¿Eliminar producto?</h3>
                <p className="text-stone-500">¿Estás seguro de que quieres quitar este producto de tu carrito?</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 px-4 py-2 border-2 border-stone-800 font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmRemoveFromCart}
                  className="flex-1 px-4 py-2 bg-red-500 text-white border-2 border-stone-800 font-bold hover:bg-red-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </>
        )}

        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Carrito</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-stone-500">${item.price} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-8 h-8 border-2 border-stone-800 rounded flex items-center justify-center font-bold">-</button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-8 h-8 border-2 border-stone-800 rounded flex items-center justify-center font-bold">+</button>
                      <button onClick={() => removeFromCart(item.id)} className="ml-2 text-red-500"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-20 text-stone-400">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Tu carrito está vacío</p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-stone-100">
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={checkout} 
                  className="w-full sketch-button py-3 text-lg disabled:opacity-50"
                >
                  Confirmar Pedido
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
