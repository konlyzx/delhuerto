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
  X,
  Upload,
  Archive,
  ArchiveRestore,
  Pencil,
  BarChart2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage } from './lib/firebase';
import { User, Product, CartItem } from './types';

import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { Footer } from './components/Footer';

import logoImg from './assets/images/logo.png';
import gifImg from './assets/images/delhuerto.gif';
import farmerImg from './assets/images/farmer.png';
import familyImg from './assets/images/family.png';

// --- Main App ---


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'market' | 'dashboard' | 'producer-profile' | 'onboarding' | 'orders' | 'product'>('landing');
  const [selectedProducerId, setSelectedProducerId] = useState<string | number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [dashboardView, setDashboardView] = useState<'products' | 'profile' | 'resume'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Profile Form States
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileLocation, setEditProfileLocation] = useState('');
  const [editProfileDesc, setEditProfileDesc] = useState('');

  // Product Form states
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [npName, setNpName] = useState('');
  const [npPrice, setNpPrice] = useState('');
  const [npStock, setNpStock] = useState('');
  const [npCategory, setNpCategory] = useState('Verduras');
  const [npUnit, setNpUnit] = useState('kg');
  const [npDesc, setNpDesc] = useState('');
  const [npImage, setNpImage] = useState('');
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'producer' | 'consumer'>('consumer');

  // URL Routing & Route Guard hook
  useEffect(() => {
    let path = '/';
    switch (view) {
      case 'market': path = '/catalogo'; break;
      case 'login': path = '/login'; break;
      case 'register': path = '/registro'; break;
      case 'dashboard': path = '/panel-productor'; break;
      case 'onboarding': path = '/onboarding'; break;
      case 'orders': path = '/mis-pedidos'; break;
      case 'product': path = selectedProduct ? `/producto/${selectedProduct.id}` : '/catalogo'; break;
      case 'producer-profile': path = window.location.pathname; break;
      case 'landing': default: path = '/'; break;
    }

    // Guard dashboard
    if (view === 'dashboard' && authLoaded) {
      if (!user || user.role !== 'producer') {
        setView('market');
        window.history.pushState({}, '', '/catalogo');
        return;
      }
    }

    // Don't modify path for producer profile to keep it simple or use ?producer=id
    if (view !== 'producer-profile') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    }
  }, [view, user, authLoaded, selectedProduct]);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/catalogo') setView('market');
      else if (p === '/login') setView('login');
      else if (p === '/registro') setView('register');
      else if (p === '/onboarding') setView('onboarding');
      else if (p === '/mis-pedidos') setView('orders');
      else if (p.startsWith('/producto/')) setView('product');
      else if (p === '/panel-productor') {
        if (authLoaded && (!user || user.role !== 'producer')) setView('market');
        else setView('dashboard');
      }
      else setView('landing');
    };
    window.addEventListener('popstate', handlePopState);

    // Initial load route
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, [authLoaded, user]);

  useEffect(() => {
    if (view === 'orders' && user) {
      const fetchOrders = async () => {
        try {
          const q = query(collection(db, "orders"), where("consumer_id", "==", user.id), orderBy("created_at", "desc"));
          const querySnapshot = await getDocs(q);
          const ordersData = await Promise.all(querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return { id: doc.id, ...data };
          }));
          setUserOrders(ordersData);
        } catch (e) {
          console.error("Error fetching orders", e);
        }
      };
      fetchOrders();
    }
  }, [view, user]);

  useEffect(() => {
    fetchProducts();

    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Firebase Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
              email: firebaseUser.email || '',
              role: data.role || 'consumer',
              location: data.location || 'Bogotá',
              description: data.description || '',
              image_url: data.image_url || ''
            });
          } else {
            const localRole = localStorage.getItem(`role_${firebaseUser.uid}`) as 'producer' | 'consumer' | null;
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
              email: firebaseUser.email || '',
              role: localRole || 'consumer',
              location: 'Bogotá'
            });
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          const localRole = localStorage.getItem(`role_${firebaseUser.uid}`) as 'producer' | 'consumer' | null;
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            role: localRole || 'consumer',
            location: 'Bogotá'
          });
        }
      } else {
        setUser(null);
      }
      setAuthLoaded(true);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setEditProfileName(user.name || '');
      setEditProfileLocation(user.location || '');
      setEditProfileDesc(user.description || '');
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const fbProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as Product);
      setProducts(fbProducts);
    } catch (fbErr) {
      console.warn("Could not fetch firebase products", fbErr);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      try {
        const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
        if (docSnap.exists()) {
          setView(docSnap.data().role === 'producer' ? 'dashboard' : 'market');
        } else {
          setView('onboarding');
        }
      } catch (err) {
        const localRole = localStorage.getItem(`role_${cred.user.uid}`);
        setView(localRole === 'producer' ? 'dashboard' : 'market');
      }
    } catch (error: any) {
      alert('Error al entrar: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          setView('onboarding');
        } else {
          setView(userDoc.data().role === 'producer' ? 'dashboard' : 'market');
        }
      } catch (fbErr) {
        console.error("Firebase read blocked, utilizing local fallback");
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
        const localRole = localStorage.getItem(`role_${result.user.uid}`);
        if (localRole) {
          setView(localRole === 'producer' ? 'dashboard' : 'market');
        } else {
          setView(isNewUser ? 'onboarding' : 'market');
        }
      }
    } catch (error: any) {
      alert('Error con Google: ' + error.message);
    }
  };

  const handleFetchProductInfo = async () => {
    if (!npName) return;
    setIsSearchingImage(true);
    try {
      const res = await fetch(`https://es.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(npName)}&format=json&pithumbsize=600&origin=*`);
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        if (page.thumbnail?.source) {
          setNpImage(page.thumbnail.source);
        }
        if (page.extract && !npDesc) {
          const desc = page.extract.split('.')[0] + '.';
          setNpDesc(desc);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNpImage(url);
    } catch (error: any) {
      alert('Error al subir la imagen: ' + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleActive = async (productId: string | number, currentStatus: boolean | undefined) => {
    try {
      const productRef = doc(db, 'products', productId.toString());
      await updateDoc(productRef, { isActive: !(currentStatus ?? true) });
      fetchProducts();
    } catch (e: any) {
      alert("Error actualizando producto: " + e.message);
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!window.confirm("¿Seguro que deseas eliminar definitivamente este producto?")) return;
    try {
      await deleteDoc(doc(db, 'products', productId.toString()));
      fetchProducts();
    } catch (e: any) {
      alert("Error al eliminar producto: " + e.message);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id.toString());
        await updateDoc(productRef, {
          name: npName,
          price: parseFloat(npPrice),
          stock: parseInt(npStock),
          unit: npUnit,
          category: npCategory,
          description: npDesc,
          image_url: npImage
        });
        setEditingProduct(null);
      } else {
        const newProduct = {
          producer_id: user.id,
          producer_name: user.name,
          producer_location: user.location,
          name: npName,
          price: parseFloat(npPrice),
          stock: parseInt(npStock),
          unit: npUnit,
          category: npCategory,
          description: npDesc,
          isActive: true,
          image_url: npImage || `https://picsum.photos/seed/${Date.now()}/600/600`
        };
        await addDoc(collection(db, 'products'), newProduct);
      }
      setShowNewProductForm(false);
      setNpName(''); setNpPrice(''); setNpStock(''); setNpDesc(''); setNpImage('');
      fetchProducts(); // Refresh list
    } catch (e: any) {
      alert("Error al guardar en Firebase: " + e.message);
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setNpName(p.name);
    setNpPrice(p.price.toString());
    setNpStock(p.stock.toString());
    setNpCategory(p.category || 'Verduras');
    setNpUnit(p.unit);
    setNpDesc(p.description || '');
    setNpImage(p.image_url || '');
    setDashboardView('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.id.toString()), {
        name: editProfileName,
        location: editProfileLocation,
        description: editProfileDesc
      });
      setUser({ ...user, name: editProfileName, location: editProfileLocation, description: editProfileDesc });
      alert("Perfil actualizado correctamente");
    } catch (error: any) {
      alert("Error al actualizar perfil: " + error.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);

      const newUserData = {
        name: authName || authEmail.split('@')[0],
        email: authEmail,
        role: authRole,
        location: 'Bogotá'
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUserData);

      setUser({
        id: userCredential.user.uid,
        ...newUserData
      } as User);

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
    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        consumer_id: user.id,
        items: cart,
        total: cartTotal,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      // Updating stock
      const promises = cart.map(item => {
        const productRef = doc(db, 'products', item.id.toString());
        return updateDoc(productRef, { stock: Math.max(0, item.stock - item.quantity) });
      });
      await Promise.all(promises);

      setCart([]);
      setIsCartOpen(false);
      setOrderSuccess(true);
      fetchProducts();
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (e) {
      console.error("Error order", e);
      alert("Hubo un error al procesar tu pedido");
    }
  };

  const filteredProducts = products.filter(p => {
    if (p.isActive === false) return false;
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
    if (view === 'landing' || view === 'product') {
      return (
        <div className="flex flex-col">
          {view === 'product' && selectedProduct ? (
            <section className="max-w-7xl mx-auto w-full px-4 py-16 md:py-24 grid md:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full aspect-square md:aspect-[4/5] bg-stone-50 border-2 border-stone-800 rounded-3xl overflow-hidden shadow-sm relative group"
              >
                <img
                  src={selectedProduct.image_url || `https://picsum.photos/seed/${selectedProduct.id}/800/800`}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-white sketch-border px-4 py-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-leaf animate-pulse"></span>
                  <span className="text-sm font-bold uppercase tracking-widest text-brand-leaf">Disponible</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">{selectedProduct.category}</span>
                  <h1 className="text-5xl md:text-7xl font-serif font-bold text-stone-800 leading-tight">
                    {selectedProduct.name}
                  </h1>
                  <p className="text-3xl font-medium text-stone-700">
                    ${selectedProduct.price.toFixed(2)} <span className="text-xl text-stone-500">/ {selectedProduct.unit}</span>
                  </p>
                </div>

                <p className="text-xl text-stone-600 leading-relaxed font-serif">
                  {selectedProduct.description || 'Este producto recién cosechado no cuenta con descripción detallada aún. Disfruta su frescura natural.'}
                </p>

                {!user || user?.role !== 'producer' ? (
                  <div className="pt-4 border-t border-stone-200 border-dashed">
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setIsCartOpen(true);
                      }}
                      className="sketch-button w-full md:w-auto px-12 py-4 bg-brand-leaf hover:bg-brand-leaf text-white flex justify-center gap-3 items-center border-[#3A5333]"
                    >
                      Añadir al carrito
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-stone-200 border-dashed text-stone-400 font-bold">
                    [Modo Productor - Compra deshabilitada]
                  </div>
                )}

                <div className="pt-8">
                  <div className="sketch-card !p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 group hover:-translate-y-1 transition-transform cursor-pointer bg-white"
                    onClick={() => { setView('producer-profile'); setSelectedProducerId(selectedProduct.producer_id); }}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-800 bg-brand-sage/20 shrink-0 shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedProduct.producer_id}`} alt="Productor" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow space-y-2">
                      <h3 className="font-serif font-bold text-2xl text-stone-800 leading-none">Conoce a quién lo cultiva</h3>
                      <div>
                        <span className="font-bold text-stone-800 block text-lg">{selectedProduct.producer_name || 'Don Jorge'}</span>
                        <span className="text-sm text-stone-500 flex items-center gap-1"><MapPin size={14} /> Finca San Miguel, a 10 km de ti.</span>
                      </div>
                      <span className="text-brand-leaf font-bold text-sm underline inline-block pt-1">Ver perfil completo.</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            </section>
          ) : (
            <>
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
                        src={gifImg}
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
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} onViewProducer={(id) => { setSelectedProducerId(id); setView('producer-profile'); }} onClickProduct={(p) => { setSelectedProduct(p); setView('product'); }} />
                  ))}
                </div>
              </section>
            </>
          )}

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

          {/* Stats & Trust */}
          <section className="max-w-7xl mx-auto w-full px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Productores Locales", value: "+120" },
                { label: "Alimentos Frescos", value: "+3K" },
                { label: "Familias Felices", value: "+500" },
                { label: "Emisiones Reducidas", value: "30%" }
              ].map((stat, i) => (
                <div key={i} className="sketch-card bg-brand-cream border-dashed text-center py-8">
                  <h3 className="text-4xl text-stone-800 font-serif font-black mb-1">{stat.value}</h3>
                  <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Social Proof (Testimonials) */}
          <section className="bg-brand-sage/10 py-32 rounded-t-[60px] md:rounded-t-[100px] border-t-2 border-stone-800/10 mt-12">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="section-title">Lo que dicen en la comunidad</h2>
                <p className="text-stone-600 max-w-xl mx-auto text-lg mt-4">Nuestra plataforma no sólo reparte vegetales, reparte confianza y calidad de vida. Conoce las historias de nuestra gente.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { name: "Elena R.", role: "Consumidora Consciente", img: 10, quote: "Desde que uso DelHuerto, mi familia come mejor y sé exactamente de dónde viene cada fruta. El sabor de los tomates de Doña Luz es inigualable, un verdadero regreso a lo natural." },
                  { name: "Carlos M.", role: "Chef Local", img: 14, quote: "Como dueño de un pequeño restaurante, buscar ingredientes frescos dictaba mi horario. Ahora recibo lo mejor directo de la tierra. Recomiendo increíblemente la plataforma." },
                  { name: "Familia C.", role: "Productores de Papa", img: 30, quote: "Llevamos tres generaciones cultivando. Antes nos compraban muy barato los revendedores. DelHuerto conectó nuestro trabajo con familias que lo aprecian pagando el valor justo." }
                ].map((t, i) => (
                  <div key={i} className={`sketch-card bg-white p-8 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 ${i === 1 ? 'md:-translate-y-6' : ''}`}>
                    <div className="space-y-4">
                      <span className="text-4xl text-brand-leaf font-serif opacity-30">"</span>
                      <p className="text-stone-700 italic font-medium leading-relaxed">{t.quote}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-200 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-stone-800 sketch-border bg-stone-100">
                        <img src={`https://picsum.photos/seed/${t.img}/100/100`} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-stone-800 block leading-tight">{t.name}</span>
                        <span className="text-xs text-stone-500 font-bold uppercase tracking-widest">{t.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Community CTA */}
          <section className="w-full bg-stone-900 border-t-4 border-stone-800 text-white pb-32 pt-24 rounded-t-[60px] md:rounded-t-[100px] -mt-10 relative z-10">
            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-block bg-brand-leaf/20 text-brand-leaf px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase outline outline-1 outline-brand-leaf/30">
                  Únete Hoy Mismo
                </div>
                <h2 className="text-5xl md:text-6xl font-serif font-bold leading-tight">Siembra tu futuro, <br /><span className="italic font-light">cosecha el cambio.</span></h2>
                <p className="text-lg text-stone-400 max-w-md">Llega a más clientes, gestiona tus pedidos fácilmente o empieza a alimentarte mejor hoy. Nuestra red te está esperando.</p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button onClick={() => setView('market')} className="sketch-button bg-brand-leaf border-brand-leaf text-stone-900 hover:bg-white transition-colors">Ver el Mercado</button>
                  <button onClick={() => { setAuthRole('producer'); setView('register'); }} className="sketch-button-outline !text-white !border-white hover:!bg-white hover:!text-stone-900 transition-colors">Quiero Vender</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="sketch-card overflow-hidden bg-brand-sage shrink-0 border-white rotate-2 p-2">
                  <img src={farmerImg} className="w-full aspect-[4/5] object-cover rounded-sm" alt="Granjero" />
                </div>
                <div className="sketch-card overflow-hidden bg-white shrink-0 -rotate-2 p-2 mt-8 border-stone-800">
                  <img src={familyImg} className="w-full aspect-[4/5] object-cover rounded-sm" alt="Familia" />
                </div>
              </div>
            </div>
          </section>

          <Footer setView={setView} />
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
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onViewProducer={(id) => { setSelectedProducerId(id); setView('producer-profile'); }} />
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-white sketch-border overflow-hidden flex flex-col md:flex-row shadow-[8px_8px_0px_0px_rgba(41,37,36,1)]"
          >
            {/* Left Side: Form */}
            <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
              <button onClick={() => setView('landing')} className="text-stone-400 hover:text-stone-800 text-sm font-bold flex items-center gap-1 mb-8 transition-colors w-max">
                <ArrowLeft size={16} /> Volver
              </button>

              <div className="mb-10">
                <h2 className="text-4xl font-serif font-bold text-stone-800 mb-2">
                  {view === 'login' ? 'Bienvenido de vuelta.' : 'Únete a la cosecha.'}
                </h2>
                <p className="text-stone-500">
                  {view === 'login' ? 'Inicia sesión para continuar comprando o vendiendo.' : 'Crea tu cuenta gratis en menos de un minuto.'}
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-800 py-3.5 mb-6 hover:bg-stone-50 transition-colors shadow-[4px_4px_0px_0px_rgba(41,37,36,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="font-bold text-stone-800">Continuar con Google</span>
              </button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t-2 border-dashed border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-stone-400 text-xs font-bold uppercase tracking-wider">o con email</span>
                <div className="flex-grow border-t-2 border-dashed border-stone-200"></div>
              </div>

              <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-5">
                {view === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors"
                      placeholder="Ej. Juan Pérez"
                    />
                  </motion.div>
                )}
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                {view === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Rol Inicial</label>
                    <select
                      value={authRole}
                      onChange={e => setAuthRole(e.target.value as 'producer' | 'consumer')}
                      className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors appearance-none cursor-pointer"
                    >
                      <option value="consumer">Quiero Comprar (Consumidor)</option>
                      <option value="producer">Quiero Vender (Productor)</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="w-full sketch-button py-3.5 text-lg mt-2">
                  {view === 'login' ? 'Entrar' : 'Registrar'}
                </button>
              </form>

              <p className="mt-8 text-center text-stone-500 text-sm">
                {view === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                <button
                  onClick={() => setView(view === 'login' ? 'register' : 'login')}
                  className="font-bold text-brand-leaf hover:underline"
                >
                  {view === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
                </button>
              </p>
            </div>

            {/* Right Side: Visual */}
            <div className="hidden md:flex w-1/2 bg-brand-olive relative flex-col justify-between p-14 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              </div>
              <div className="relative z-10 flex items-center gap-3 opacity-80">
                <Store size={32} />
                <span className="text-2xl font-serif font-bold tracking-tight">DelHuerto.</span>
              </div>
              <div className="relative z-10">
                <div className="text-brand-sage mb-4"><CheckCircle2 size={48} /></div>
                <h3 className="text-4xl font-serif italic leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-brand-sage mb-6">"El mejor marketplace para conectar verdaderamente tu campo con la ciudad"</h3>
                <p className="font-bold">Ana M.</p>
                <p className="text-brand-sage text-sm">Productora Local</p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (view === 'onboarding') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl bg-white sketch-border p-10 md:p-14 text-center shadow-[12px_12px_0px_0px_rgba(41,37,36,1)]"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4">¿Cómo participarás hoy?</h2>
            <p className="text-stone-500 mb-12 max-w-lg mx-auto text-lg">Para ofrecerte la mejor experiencia en DelHuerto, dinos qué rol prefieres tomar en nuestra comunidad.</p>
            <div className="grid md:grid-cols-2 gap-8">
              <button
                onClick={async () => {
                  if (auth.currentUser) {
                    const uid = auth.currentUser.uid;
                    const name = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuario';
                    const email = auth.currentUser.email || '';
                    try {
                      const userRef = doc(db, 'users', uid);
                      await setDoc(userRef, {
                        name,
                        email,
                        role: 'consumer',
                        location: 'Bogotá'
                      });
                      const ud = await getDoc(userRef);
                      if (ud.exists()) {
                        setUser({ id: uid, ...ud.data() } as User);
                      }
                    } catch (fbErr) {
                      console.warn("Firestore write permissions denied, falling back to local state");
                      localStorage.setItem(`role_${uid}`, 'consumer');
                      setUser({ id: uid, name, email, role: 'consumer', location: 'Bogotá' } as User);
                    }
                    setView('market');
                  }
                }}
                className="relative sketch-border bg-brand-sage/10 flex flex-col items-center justify-center p-10 gap-6 hover:-translate-y-2 hover:bg-brand-sage/20 transition-all group"
              >
                <div className="w-24 h-24 bg-white sketch-border rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBasket size={48} className="text-brand-leaf" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-2">Quiero Comprar</h3>
                  <p className="text-stone-500">Busco alimentos frescos, locales y de origen 100% conocido.</p>
                </div>
              </button>

              <button
                onClick={async () => {
                  if (auth.currentUser) {
                    const uid = auth.currentUser.uid;
                    const name = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuario';
                    const email = auth.currentUser.email || '';
                    try {
                      const userRef = doc(db, 'users', uid);
                      await setDoc(userRef, {
                        name,
                        email,
                        role: 'producer',
                        location: 'Bogotá'
                      });
                      const ud = await getDoc(userRef);
                      if (ud.exists()) {
                        setUser({ id: uid, ...ud.data() } as User);
                      }
                    } catch (fbErr) {
                      console.warn("Firestore write permissions denied, falling back to local state");
                      localStorage.setItem(`role_${uid}`, 'producer');
                      setUser({ id: uid, name, email, role: 'producer', location: 'Bogotá' } as User);
                    }
                    setView('dashboard');
                  }
                }}
                className="relative sketch-border bg-amber-50 flex flex-col items-center justify-center p-10 gap-6 hover:-translate-y-2 hover:bg-amber-100 transition-all group"
              >
                <div className="w-24 h-24 bg-white sketch-border rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Store size={48} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-stone-800 mb-2">Quiero Vender</h3>
                  <p className="text-stone-500">Soy agricultor o productor y quiero conectar con mis clientes.</p>
                </div>
              </button>
            </div>
          </motion.div >
        </div >
      );
    }

    if (view === 'orders') {
      if (!user || user.role !== 'consumer') {
        setView('landing');
        return null;
      }
      return (
        <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
          <button onClick={() => setView('market')} className="text-stone-500 hover:text-stone-800 flex items-center gap-2 font-bold mb-4">
            <ArrowLeft size={20} /> Volver al catálogo
          </button>
          <div>
            <h2 className="text-4xl font-serif font-bold text-stone-800">Mis Pedidos</h2>
            <p className="text-stone-500 mt-2">Historial de las cosechas que has comprado directamente.</p>
          </div>

          <div className="space-y-6">
            {userOrders.length === 0 ? (
              <div className="sketch-card text-center py-24 bg-white">
                <ShoppingBasket size={64} className="mx-auto text-stone-200 mb-6" />
                <h3 className="text-2xl font-bold text-stone-800 mb-2">Aún no tienes pedidos</h3>
                <p className="text-stone-500 max-w-sm mx-auto mb-8">Empieza a apoyar al campo local comprando directo al productor.</p>
                <button onClick={() => setView('market')} className="sketch-button">Explorar el catálogo</button>
              </div>
            ) : (
              userOrders.map((order, idx) => (
                <div key={idx} className="sketch-card bg-white p-6 md:p-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b-2 border-dashed border-stone-200">
                    <div>
                      <p className="text-sm font-bold text-stone-400">Pedido #{order.id}</p>
                      <p className="font-bold text-stone-800">{new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-amber-200">
                        {order.status === 'pending' ? 'En Preparación' : order.status}
                      </span>
                      <span className="text-2xl font-bold text-brand-leaf">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-stone-800">Artículos Comprados:</h4>
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      );
    }

    if (view === 'dashboard') {
      if (!user || user.role !== 'producer') {
        setView('landing');
        return null;
      }

      const producerProducts = products.filter(p => p.producer_id === user?.id);
      const totalStock = producerProducts.reduce((sum, p) => sum + p.stock, 0);

      return (
        <div className="bg-brand-cream min-h-screen pb-24 md:pb-0">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-brand-cream sticky top-0 z-40 border-b-2 border-stone-800">
            <img src={logoImg} alt="DelHuerto" className="h-8 object-contain" />
            <h1 className="font-bold text-stone-800 text-lg font-serif">Mi Huerto</h1>
            <div className="w-10 h-10 rounded-full border-2 border-stone-800 bg-white overflow-hidden shrink-0 sketch-border">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt={user.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <main className="max-w-7xl mx-auto px-4 py-6 md:py-12 flex flex-col md:flex-row gap-8">
            {/* Dashboard Sidebar (hidden on mobile) */}
            <aside className="hidden md:block w-full md:w-1/4 space-y-6">
              <div className="sketch-card bg-brand-sage/10 p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white sketch-border shrink-0">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email}`} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">{user.name}</h3>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{user.location || 'Local'}</span>
                </div>
              </div>

              <nav className="sketch-card p-4 space-y-2">
                <button onClick={() => setDashboardView('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${dashboardView === 'products' ? 'bg-brand-sage border-2 border-stone-800 text-stone-800' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'}`}>
                  <Package size={20} /> Mis Productos
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 hover:text-stone-800 rounded-xl font-bold transition-colors">
                  <Store size={20} /> Pedidos
                  <span className="ml-auto bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full text-xs">Próximamente</span>
                </button>
                <button onClick={() => setDashboardView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${dashboardView === 'profile' ? 'bg-brand-sage border-2 border-stone-800 text-stone-800' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'}`}>
                  <MapPin size={20} /> Editar Perfil
                </button>
              </nav>

              <div className="pt-4 border-t-2 border-dashed border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-500 rounded-xl font-bold transition-colors"
                >
                  <LogOut size={20} /> Cerrar Sesión
                </button>
              </div>
            </aside>

            {/* Dashboard Content */}
            <section className="w-full md:w-3/4 space-y-8">
              {dashboardView === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="sketch-card bg-white p-8 space-y-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold font-serif text-stone-800">Perfil de la Huerta</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Nombre del Negocio o Granja</label>
                      <input required value={editProfileName} onChange={e => setEditProfileName(e.target.value)} type="text" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="Huerta La Esperanza" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Ubicación</label>
                      <input required value={editProfileLocation} onChange={e => setEditProfileLocation(e.target.value)} type="text" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="Bogotá, Localidad de Usme" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Historia o Descripción</label>
                      <textarea required value={editProfileDesc} onChange={e => setEditProfileDesc(e.target.value)} className="w-full h-32 px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none resize-none" placeholder="Llevamos 3 generaciones cultivando sin químicos..."></textarea>
                    </div>
                  </div>
                  <button type="submit" className="sketch-button w-full py-4 !text-lg bg-stone-900 text-white border-2 border-stone-800 hover:bg-stone-800">
                    Guardar Cambios
                  </button>
                  <div className="pt-8 block md:hidden">
                    <button type="button" onClick={handleLogout} className="w-full py-4 text-red-500 hover:bg-red-50 border-2 border-red-500 rounded-xl font-bold transition-colors sketch-border flex items-center justify-center gap-2">
                      <LogOut size={20} /> Cerrar Sesión
                    </button>
                  </div>
                </form>
              )}

              {dashboardView === 'products' && (
                <>
                  {/* Desktop Version Top Actions */}
                  <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sketch-card p-8">
                    <div>
                      <h2 className="text-3xl font-serif font-bold">Gestión de Inventario</h2>
                      <p className="text-stone-500 mt-1">Administra tus alimentos frescos a la venta.</p>
                    </div>
                    <button onClick={() => setShowNewProductForm(!showNewProductForm)} className="sketch-button flex items-center gap-2 px-6">
                      <Plus size={20} /> {showNewProductForm ? 'Cerrar' : 'Nuevo Producto'}
                    </button>
                  </div>

                  {/* Mobile Version Big Top Add Button */}
                  <div className="md:hidden py-2 mb-2">
                    <button onClick={() => setShowNewProductForm(true)} className="w-full bg-[#4C7C3E] text-white py-4 px-6 rounded-full font-bold text-lg flex items-center justify-center gap-2 sketch-border border-2 border-stone-800 shadow-[2px_4px_0_rgba(41,37,36,1)]">
                      <Plus size={24} /> Añadir Producto
                    </button>
                  </div>

                  {(showNewProductForm || editingProduct) && (
                    <form onSubmit={handleCreateProduct} className="sketch-card bg-white p-8 space-y-6 relative">
                      {/* Close floating button for mobile */}
                      <div className="absolute top-2 right-2 md:hidden">
                        <button type="button" onClick={() => { setShowNewProductForm(false); setEditingProduct(null); }} className="p-2 text-stone-400 hover:text-stone-800">
                          <X size={24} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-serif text-stone-800">{editingProduct ? 'Editar Producto' : 'Detalles del Producto'}</h3>
                        {editingProduct && (
                          <button type="button" onClick={() => { setEditingProduct(null); setNpName(''); setNpPrice(''); setNpStock(''); setNpDesc(''); setNpImage(''); }} className="text-stone-500 hover:text-stone-800 font-bold text-sm underline">
                            Cancelar Edición
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Nombre del Alimento</label>
                          <div className="flex gap-2">
                            <input required value={npName} onChange={e => setNpName(e.target.value)} type="text" className="flex-grow px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none w-full" placeholder="Ej. Tomates Cherry" />
                            <button type="button" onClick={handleFetchProductInfo} disabled={isSearchingImage || !npName} className="px-4 py-3 bg-brand-leaf text-white border-2 border-stone-800 font-bold hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap outline-none flex items-center gap-2 sketch-button !py-2">
                              {isSearchingImage ? 'Buscando...' : 'Info Auto.'}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Categoría</label>
                          <select value={npCategory} onChange={e => setNpCategory(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none">
                            {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Precio</label>
                          <input required value={npPrice} onChange={e => setNpPrice(e.target.value)} type="number" step="0.01" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="0.00" />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-2/3 space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Stock Disponible</label>
                            <input required value={npStock} onChange={e => setNpStock(e.target.value)} type="number" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="10" />
                          </div>
                          <div className="w-1/3 space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Unidad</label>
                            <select value={npUnit} onChange={e => setNpUnit(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none">
                              <option value="kg">kg</option>
                              <option value="unidades">uds</option>
                              <option value="latas">latas</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Imagen (Sube una foto o busca Info Auto.)</label>
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden sketch-border shrink-0 bg-stone-100 relative">
                            {isUploadingImage ? (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400 font-bold bg-white text-center leading-none p-1">CARGANDO...</span>
                            ) : npImage ? (
                              <img src={npImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400 font-bold">VACÍO</span>
                            )}
                          </div>
                          <div className="flex-grow space-y-2">
                            <input value={npImage} onChange={e => setNpImage(e.target.value)} type="text" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none text-sm" placeholder="URL de imagen" />
                            <label className="sketch-button flex items-center justify-center gap-2 cursor-pointer !py-2 !text-sm w-full bg-stone-100 hover:bg-stone-200">
                              <Upload size={16} /> Subir desde tu equipo
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Descripción</label>
                        <textarea required value={npDesc} onChange={e => setNpDesc(e.target.value)} className="w-full h-32 px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none resize-none" placeholder="Describe cómo cultivaste o preparaste este producto..."></textarea>
                      </div>

                      <button type="submit" className="sketch-button w-full py-4 !text-lg bg-[#4C7C3E] text-white border-2 border-stone-800 hover:bg-[#3d6332]">
                        {editingProduct ? 'Actualizar Producto' : 'Guardar y Publicar'}
                      </button>
                    </form>
                  )}

                  {producerProducts.length > 0 && (
                    <div className="space-y-4 pt-4 md:pt-4">
                      <h3 className="hidden md:block text-xl font-bold font-serif text-stone-800 mb-6">Tus Productos (Catálogo Actual)</h3>
                      <div className="flex flex-col gap-3">
                        {producerProducts.map(p => (
                          <div key={p.id} className={`sketch-card flex items-stretch bg-stone-50 border-2 border-stone-800 rounded-xl relative overflow-hidden ${p.isActive === false ? 'opacity-60 grayscale' : ''}`}>
                            <div className="w-[100px] md:w-32 bg-stone-200 border-r-2 border-stone-800 shrink-0">
                              <img src={p.image_url || `https://picsum.photos/seed/${p.id}/200/200`} alt={p.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="p-3 md:p-4 flex-grow flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-stone-800 text-sm md:text-xl leading-tight md:mb-1">{p.name} - ${p.price.toFixed(2)}/{p.unit}</h4>
                                <p className="text-stone-600 text-[11px] md:text-sm mt-1">Stock: {p.stock} {p.unit}</p>
                              </div>

                              {/* Actions inline bottom right */}
                              <div className="self-end flex items-center gap-3 mt-2 md:mt-4">
                                <button onClick={(e) => { e.stopPropagation(); setShowNewProductForm(true); handleEditProductClick(p); }} title="Editar producto" className="text-green-700 hover:text-green-800 transition-colors">
                                  <Pencil size={18} fill="currentColor" strokeWidth={1} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id as number); }} title="Eliminar definitivamente" className="text-red-600 hover:text-red-700 transition-colors">
                                  <Trash2 size={18} fill="currentColor" strokeWidth={1} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {dashboardView !== 'products' && dashboardView !== 'profile' && (
                <>
                  <div className="md:hidden pt-4 pb-6">
                    <h2 className="text-3xl font-serif font-bold text-stone-800">Resumen y Estadísticas</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="sketch-card bg-amber-50 p-6 flex flex-col border-dashed">
                      <span className="text-stone-500 font-bold uppercase tracking-widest text-xs mb-2">Total Productos</span>
                      <span className="text-4xl font-serif font-bold text-stone-800">{producerProducts.length}</span>
                    </div>
                    <div className="sketch-card bg-green-50 p-6 flex flex-col border-dashed border-green-800">
                      <span className="text-green-800 font-bold uppercase tracking-widest text-xs mb-2">Unidades Totales</span>
                      <span className="text-4xl font-serif font-bold text-green-900">{totalStock}</span>
                    </div>
                  </div>
                </>
              )}
            </section>
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-800 flex justify-around p-3 z-50 !rounded-t-[32px] sketch-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button onClick={() => setDashboardView('resume')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${dashboardView === 'resume' ? 'text-[#4C7C3E]' : 'text-stone-500'}`}>
              <BarChart2 size={24} />
              <span className="text-[10px] font-bold">Resumen</span>
            </button>
            <button onClick={() => setDashboardView('products')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${dashboardView === 'products' ? 'text-[#4C7C3E]' : 'text-stone-500'}`}>
              <Package size={24} />
              <span className="text-[10px] font-bold">Inventario</span>
            </button>
            <button onClick={() => setDashboardView('profile')} className={`flex flex-col items-center gap-1 w-1/3 transition-colors ${dashboardView === 'profile' ? 'text-[#4C7C3E]' : 'text-stone-500'}`}>
              <UserIcon size={24} />
              <span className="text-[10px] font-bold">Perfil</span>
            </button>
          </div>
        </div>
      );
    }

    if (view === 'producer-profile') {
      const producerProducts = products.filter(p => p.producer_id === selectedProducerId);
      const producerInfo: any = producerProducts[0] || {};

      return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-12">
          <button onClick={() => setView('market')} className="text-stone-500 hover:text-stone-800 flex items-center gap-2 font-bold mb-4">
            <ArrowLeft size={20} /> Volver al catálogo
          </button>

          {/* Cover Profile */}
          <div className="sketch-card bg-brand-sage/10 relative overflow-hidden p-8 md:p-16 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white sketch-border overflow-hidden bg-white shrink-0">
              <img src={`https://picsum.photos/seed/${selectedProducerId}/200/200`} alt="Productor" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4 text-center md:text-left z-10 w-full">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800">{producerInfo.producer_name || 'Productor'}</h1>
                <p className="text-brand-leaf font-bold mt-1 flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={16} /> {producerInfo.producer_location || 'Ubicación local'}
                </p>
              </div>
              <p className="text-stone-600 max-w-2xl text-lg relative bg-white/60 p-4 rounded-xl items-center border border-stone-800/10">
                <span className="font-serif italic text-2xl text-stone-400 absolute -top-2 left-2">"</span>
                Cultivamos con amor y respeto por la tierra. Nuestros productos son 100% orgánicos, asegurando el mejor sabor y nutrición para tu familia, directamente del campo a tu hogar.
              </p>
            </div>
            {/* Background elements */}
            <Store className="absolute -bottom-10 -right-10 text-brand-leaf opacity-5" size={300} />
          </div>

          <div className="space-y-8">
            <h2 className="section-title">Nuestra Cosecha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {producerProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
            {producerProducts.length === 0 && (
              <div className="text-center py-20 bg-stone-50 rounded-2xl sketch-border">
                <Package size={48} className="mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-bold">Este productor no tiene productos disponibles.</p>
              </div>
            )}
          </div>
        </main>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <div className={view === 'dashboard' ? 'hidden md:block' : ''}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onMenuClick={() => setView(user ? (user.role === 'producer' ? 'dashboard' : 'market') : 'login')}
          setView={setView}
          scrolled={scrolled}
        />
      </div>

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
