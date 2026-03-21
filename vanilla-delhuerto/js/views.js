import { escapeHtml, formatMoney, renderProductCard } from './templates.js'

export function renderLanding(state) {
  const featured = state.products.filter((p) => p.isActive !== false).slice(0, 4)
  const user = state.user
  const producerBtnLabel = user?.role === 'producer' ? 'Mi Panel' : 'Soy productor'
  const producerBtnAction = user
    ? user.role === 'producer'
      ? 'go-dashboard'
      : 'upgrade-role'
    : 'go-register'

  return `
    <div class="flex flex-col">
      <section class="max-w-7xl mx-auto w-full px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center relative overflow-hidden md:overflow-visible">
        <div class="space-y-8 z-10">
          <h1 class="text-6xl md:text-7xl font-serif font-bold text-stone-800 leading-tight">
            Alimentos <span class="text-brand-leaf italic">reales</span> de manos locales.
          </h1>
          <p class="text-xl text-stone-600 max-w-lg leading-relaxed">
            Conectamos a pequeños productores con personas que buscan frescura, calidad y un impacto positivo en su comunidad.
          </p>
          <div class="flex flex-wrap gap-4">
            <button data-nav="/catalogo" class="sketch-button relative overflow-hidden group">
              <span class="relative z-10">Empezar a comprar</span>
              <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
            <button data-action="${producerBtnAction}" class="sketch-button-outline relative overflow-hidden group">
              <span class="relative z-10">${escapeHtml(producerBtnLabel)}</span>
              <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </div>
        </div>
        <div class="relative z-10">
          <div class="absolute -top-20 -right-20 w-[120%] h-[140%] bg-stone-200/50 -rotate-3 rounded-3xl -z-10 hidden md:block"></div>
          <div class="relative bg-white p-4 sketch-border shadow-2xl rotate-1">
            <div class="aspect-video bg-stone-100 overflow-hidden border-2 border-stone-800 rounded-sm">
              <img src="./assets/images/delhuerto.gif" alt="DelHuerto Animación" class="w-full h-full object-cover" loading="eager" referrerpolicy="no-referrer" />
            </div>
            <div class="absolute -inset-2 border-4 border-stone-800 rounded-lg pointer-events-none opacity-20"></div>
          </div>
          <div class="absolute -bottom-10 -right-6 sketch-card rotate-3 bg-white p-4 hidden md:block shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-brand-leaf rounded-full flex items-center justify-center text-white">
                <i data-lucide="check-circle-2" style="width:20px;height:20px"></i>
              </div>
              <span class="font-bold text-stone-800">100% Orgánico</span>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-7xl mx-auto w-full px-4 py-24">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="section-title">Cosecha del día</h2>
            <p class="text-stone-500">Productos frescos que acaban de llegar de la huerta.</p>
          </div>
          <button data-nav="/catalogo" class="text-brand-leaf font-bold flex items-center gap-2 hover:underline">
            Ver todo el mercado <i data-lucide="chevron-right" style="width:20px;height:20px"></i>
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          ${featured
            .map((product) =>
              renderProductCard({
                product,
                producerImage: state.producerCache[String(product.producer_id)]?.image_url,
                isProducer: false,
              }),
            )
            .join('')}
        </div>
      </section>
    </div>
  `
}

export function renderMarket(state) {
  const categories = ['Todos', ...Array.from(new Set(state.products.map((p) => p.category).filter(Boolean)))]
  const filtered = state.products.filter((p) => {
    if (p.isActive === false) return false
    const s = state.searchTerm.toLowerCase()
    const matchesSearch =
      String(p.name || '').toLowerCase().includes(s) ||
      String(p.producer_name || '').toLowerCase().includes(s)
    const matchesCategory = state.categoryFilter === 'Todos' || p.category === state.categoryFilter
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    if (state.sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
    if (state.sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0)
    if (state.sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0)
    // Default: latest (using id or created_at if exists)
    return (b.id || '').localeCompare(a.id || '')
  })

  return `
    <main class="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
      ${
        state.orderSuccess
          ? `<div class="bg-green-100 border-2 border-green-800 p-4 rounded-xl text-green-800 font-bold text-center">¡Pedido realizado con éxito!</div>`
          : ''
      }

      <div class="flex flex-col md:flex-row gap-8">
        <div class="md:w-1/4 space-y-6">
          <div class="sketch-card space-y-4">
            <h3 class="font-bold text-lg">Filtros</h3>
            <div class="relative">
              <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" style="width:18px;height:18px"></i>
              <input
                type="text"
                placeholder="Buscar..."
                value="${escapeHtml(state.searchTerm)}"
                data-action="set-search"
                class="w-full pl-10 pr-4 py-2 border-2 border-stone-800 rounded-lg outline-none text-sm"
              />
            </div>
            <div class="space-y-2">
              ${categories
                .map((cat) => {
                  const active =
                    state.categoryFilter === cat
                      ? 'bg-brand-sage text-stone-800 border-2 border-stone-800'
                      : 'hover:bg-stone-100'
                  return `<button data-action="set-category" data-category="${escapeHtml(cat)}" class="w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors ${active}">${escapeHtml(cat)}</button>`
                })
                .join('')}
            </div>
          </div>

          <div class="sketch-card space-y-4">
            <h3 class="font-bold text-lg">Productores Cerca</h3>
            <div class="h-48 bg-stone-100 sketch-border relative overflow-hidden">
              <div class="absolute inset-0 opacity-20 grid grid-cols-4 grid-rows-4">
                ${Array.from({ length: 16 })
                  .map(() => `<div class="border border-stone-300"></div>`)
                  .join('')}
              </div>
              <i data-lucide="map-pin" class="absolute top-1/4 left-1/3 text-red-500" style="width:20px;height:20px"></i>
              <i data-lucide="map-pin" class="absolute top-1/2 left-2/3 text-orange-500" style="width:20px;height:20px"></i>
            </div>
          </div>
        </div>

        <div class="md:w-3/4 space-y-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 class="text-3xl font-serif font-bold">Catálogo</h2>
            <div class="flex items-center gap-4 w-full sm:w-auto">
              <span class="text-stone-500 text-xs font-bold hidden md:inline uppercase tracking-widest">${filtered.length} productos</span>
              <select data-action="set-sort" class="px-3 py-2 border-2 border-stone-800 rounded-lg text-sm font-bold bg-white outline-none cursor-pointer">
                <option value="latest" ${state.sortBy === 'latest' ? 'selected' : ''}>Más recientes</option>
                <option value="name-asc" ${state.sortBy === 'name-asc' ? 'selected' : ''}>Nombre (A-Z)</option>
                <option value="price-asc" ${state.sortBy === 'price-asc' ? 'selected' : ''}>Menor precio</option>
                <option value="price-desc" ${state.sortBy === 'price-desc' ? 'selected' : ''}>Mayor precio</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${filtered
              .map((product) =>
                renderProductCard({
                  product,
                  producerImage: state.producerCache[String(product.producer_id)]?.image_url,
                  isProducer: false,
                }),
              )
              .join('')}
          </div>
          ${
            filtered.length === 0
              ? `
                <div class="text-center py-20 sketch-card bg-stone-50">
                  <i data-lucide="package" class="mx-auto text-stone-300 mb-4" style="width:48px;height:48px"></i>
                  <p class="text-stone-500 font-bold">No encontramos lo que buscas.</p>
                </div>
              `
              : ''
          }
        </div>
      </div>
    </main>
  `
}

export function renderAuth(state, mode) {
  const title = mode === 'login' ? 'Bienvenido de vuelta.' : 'Únete a la cosecha.'
  const subtitle =
    mode === 'login'
      ? 'Inicia sesión para continuar comprando o vendiendo.'
      : 'Crea tu cuenta gratis en menos de un minuto.'

  return `
    <div class="min-h-screen flex items-center justify-center bg-brand-cream p-4">
      <div class="w-full max-w-4xl bg-white sketch-border overflow-hidden flex flex-col md:flex-row shadow-[8px_8px_0px_0px_rgba(41,37,36,1)]">
        <div class="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
          <button data-nav="/" class="text-stone-400 hover:text-stone-800 text-sm font-bold flex items-center gap-1 mb-8 transition-colors w-max">
            <i data-lucide="arrow-left" style="width:16px;height:16px"></i> Volver
          </button>
          <div class="mb-10">
            <h2 class="text-4xl font-serif font-bold text-stone-800 mb-2">${title}</h2>
            <p class="text-stone-500">${subtitle}</p>
          </div>
          <button data-action="google-login" class="w-full flex items-center justify-center gap-3 bg-white border-2 border-stone-800 py-3.5 mb-6 hover:bg-stone-50 transition-colors shadow-[4px_4px_0px_0px_rgba(41,37,36,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5" />
            <span class="font-bold text-stone-800">Continuar con Google</span>
          </button>
          <div class="relative flex py-5 items-center">
            <div class="flex-grow border-t-2 border-dashed border-stone-200"></div>
            <span class="flex-shrink-0 mx-4 text-stone-400 text-xs font-bold uppercase tracking-wider">o con email</span>
            <div class="flex-grow border-t-2 border-dashed border-stone-200"></div>
          </div>

          <form data-action="${mode === 'login' ? 'submit-login' : 'submit-register'}" class="space-y-5">
            ${
              mode === 'register'
                ? `
                  <div>
                    <label class="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Nombre</label>
                    <input type="text" required value="${escapeHtml(state.authForm.name)}" data-action="auth-name" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors" placeholder="Ej. Juan Pérez" />
                  </div>
                `
                : ''
            }
            <div>
              <label class="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Email</label>
              <input type="email" required value="${escapeHtml(state.authForm.email)}" data-action="auth-email" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors" placeholder="tucorreo@ejemplo.com" />
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Contraseña</label>
              <input type="password" required value="${escapeHtml(state.authForm.password)}" data-action="auth-pass" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 focus:bg-white rounded-none outline-none transition-colors" placeholder="••••••••" />
            </div>
            <button type="submit" class="w-full sketch-button py-3.5 text-lg mt-2">
              ${mode === 'login' ? 'Entrar' : 'Registrar'}
            </button>
          </form>

          <p class="mt-8 text-center text-stone-500 text-sm">
            ${mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button data-nav="${mode === 'login' ? '/registro' : '/login'}" class="font-bold text-brand-leaf hover:underline">
              ${mode === 'login' ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
        </div>

        <div class="hidden md:flex w-1/2 bg-brand-olive relative flex-col justify-between p-14 text-white overflow-hidden">
          <div class="absolute inset-0 opacity-20 pointer-events-none">
            <div class="w-full h-full" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
          </div>
          <div class="relative z-10 flex items-center gap-3 opacity-80">
            <i data-lucide="store" style="width:32px;height:32px"></i>
            <span class="text-2xl font-serif font-bold tracking-tight">DelHuerto.</span>
          </div>
          <div class="relative z-10">
            <div class="text-brand-sage mb-4">
              <i data-lucide="check-circle-2" style="width:48px;height:48px"></i>
            </div>
            <h3 class="text-4xl font-serif italic leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-brand-sage mb-6">
              "El mejor marketplace para conectar verdaderamente tu campo con la ciudad"
            </h3>
            <p class="font-bold">Ana M.</p>
            <p class="text-brand-sage text-sm">Productora Local</p>
          </div>
        </div>
      </div>
    </div>
  `
}

export function renderProduct(state, product, producer) {
  return `
    <section class="max-w-7xl mx-auto w-full px-4 py-16 md:py-24 grid md:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
      <div class="w-full aspect-square md:aspect-[4/5] bg-stone-50 border-2 border-stone-800 rounded-3xl overflow-hidden shadow-sm relative group">
        <img src="${escapeHtml(product.image_url || `https://picsum.photos/seed/${product.id}/800/800`)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div class="absolute top-4 left-4 bg-white sketch-border px-4 py-1 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-brand-leaf animate-pulse"></span>
          <span class="text-sm font-bold uppercase tracking-widest text-brand-leaf">Disponible</span>
        </div>
      </div>

      <div class="space-y-8">
        <div class="space-y-4">
          <span class="text-sm font-bold text-stone-400 uppercase tracking-widest">${escapeHtml(product.category || '')}</span>
          <h1 class="text-5xl md:text-7xl font-serif font-bold text-stone-800 leading-tight">${escapeHtml(product.name)}</h1>
          <p class="text-3xl font-medium text-stone-700">
            ${formatMoney(product.price)} <span class="text-xl text-stone-500">/ ${escapeHtml(product.unit || '')}</span>
          </p>
        </div>

        <p class="text-xl text-stone-600 leading-relaxed font-serif">
          ${escapeHtml(
            product.description ||
              'Este producto recién cosechado no cuenta con descripción detallada aún. Disfruta su frescura natural.',
          )}
        </p>

        ${
          !state.user || state.user.role !== 'producer'
            ? `
              <div class="pt-4 border-t border-stone-200 border-dashed">
                <button data-action="add-to-cart-open" data-product-id="${escapeHtml(product.id)}" class="sketch-button w-full md:w-auto px-12 py-4 bg-brand-leaf hover:bg-brand-leaf text-white flex justify-center gap-3 items-center border-[#3A5333]">
                  Añadir al carrito
                </button>
              </div>
            `
            : `<div class="pt-4 border-t border-stone-200 border-dashed text-stone-400 font-bold">[Modo Productor - Compra deshabilitada]</div>`
        }

        <div class="pt-8">
          <div class="sketch-card !p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 group hover:-translate-y-1 transition-transform cursor-pointer bg-white" data-action="open-producer" data-producer-id="${escapeHtml(product.producer_id)}">
            <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-stone-800 bg-brand-sage/20 shrink-0 shadow-sm">
              <img src="${escapeHtml(producer?.image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${product.producer_id}`)}" alt="Productor" class="w-full h-full object-cover" />
            </div>
            <div class="flex-grow space-y-2">
              <h3 class="font-serif font-bold text-2xl text-stone-800 leading-none">Conoce a quién lo cultiva</h3>
              <div>
                <span class="font-bold text-stone-800 block text-lg">${escapeHtml(producer?.name || product.producer_name || 'Productor Local')}</span>
                <span class="text-sm text-stone-500 flex items-center gap-1">
                  <i data-lucide="map-pin" style="width:14px;height:14px"></i> ${escapeHtml(producer?.location || product.producer_location || 'Ubicación local')}
                </span>
              </div>
              <span class="text-brand-leaf font-bold text-sm underline inline-block pt-1">Ver perfil completo.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

export function renderProducerProfile(state, producerId, producerInfo, products) {
  return `
    <main class="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-12">
      <button data-nav="/catalogo" class="text-stone-500 hover:text-stone-800 flex items-center gap-2 font-bold mb-4 cursor-pointer">
        <i data-lucide="arrow-left" style="width:20px;height:20px"></i> Volver al catálogo
      </button>

      <div class="sketch-card bg-brand-sage/10 relative overflow-hidden p-8 md:p-16 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div class="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white sketch-border overflow-hidden bg-white shrink-0">
          <img src="${escapeHtml(producerInfo.image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${producerId}`)}" alt="Productor" class="w-full h-full object-cover" />
        </div>
        <div class="space-y-4 text-center md:text-left z-10 w-full">
          <div>
            <h1 class="text-4xl md:text-5xl font-serif font-bold text-stone-800">${escapeHtml(producerInfo.name || producerInfo.producer_name || 'Productor')}</h1>
            <p class="text-brand-leaf font-bold mt-1 flex items-center justify-center md:justify-start gap-1">
              <i data-lucide="map-pin" style="width:16px;height:16px"></i> ${escapeHtml(producerInfo.location || producerInfo.producer_location || 'Ubicación local')}
            </p>
          </div>
          <p class="text-stone-600 max-w-2xl text-lg relative bg-white/60 p-4 rounded-xl items-center border border-stone-800/10">
            <span class="font-serif italic text-2xl text-stone-400 absolute -top-2 left-2">"</span>
            ${escapeHtml(
              producerInfo.description ||
                'Cultivamos con amor y respeto por la tierra. Nuestros productos son 100% orgánicos, asegurando el mejor sabor y nutrición para tu familia, directamente del campo a tu hogar.',
            )}
          </p>
        </div>
        <i data-lucide="store" class="absolute -bottom-10 -right-10 text-brand-leaf opacity-5" style="width:300px;height:300px"></i>
      </div>

      <div class="space-y-8">
        <h2 class="section-title">Nuestra Cosecha</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${products.map((p) => renderProductCard({ product: p, isProducer: false })).join('')}
        </div>
        ${
          products.length === 0
            ? `
              <div class="text-center py-20 bg-stone-50 rounded-2xl sketch-border">
                <i data-lucide="package" class="mx-auto text-stone-300 mb-4" style="width:48px;height:48px"></i>
                <p class="text-stone-500 font-bold">Este productor no tiene productos disponibles.</p>
              </div>
            `
            : ''
        }
      </div>
    </main>
  `
}

export function renderOrders(state) {
  const orders = state.userOrders || []
  return `
    <main class="flex-grow max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
      <button data-nav="/catalogo" class="text-stone-500 hover:text-stone-800 flex items-center gap-2 font-bold mb-4">
        <i data-lucide="arrow-left" style="width:20px;height:20px"></i> Volver al catálogo
      </button>
      <div>
        <h2 class="text-4xl font-serif font-bold text-stone-800">Mis Pedidos</h2>
        <p class="text-stone-500 mt-2">Historial de las cosechas que has comprado directamente.</p>
      </div>

      <div class="space-y-6">
        ${
          orders.length === 0
            ? `
              <div class="sketch-card text-center py-24 bg-white">
                <i data-lucide="shopping-basket" class="mx-auto text-stone-200 mb-6" style="width:64px;height:64px"></i>
                <h3 class="text-2xl font-bold text-stone-800 mb-2">Aún no tienes pedidos</h3>
                <p class="text-stone-500 max-w-sm mx-auto mb-8">Empieza a apoyar al campo local comprando directo al productor.</p>
                <button data-nav="/catalogo" class="sketch-button">Explorar el catálogo</button>
              </div>
            `
            : orders
                .map((order) => {
                  const date = new Date(order.created_at)
                  const dateStr = Number.isFinite(date.getTime())
                    ? date.toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''

                  const status = order.status === 'pending' ? 'En Preparación' : String(order.status || '')

                  return `
                    <div class="sketch-card bg-white p-6 md:p-8 relative overflow-hidden">
                      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b-2 border-dashed border-stone-200">
                        <div>
                          <p class="text-sm font-bold text-stone-400">Pedido #${escapeHtml(order.id)}</p>
                          <p class="font-bold text-stone-800">${escapeHtml(dateStr)}</p>
                        </div>
                        <div class="flex gap-4 items-center">
                          <span class="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-amber-200">${escapeHtml(status)}</span>
                          <span class="text-2xl font-bold text-brand-leaf">${formatMoney(order.total)}</span>
                        </div>
                      </div>

                      <div class="space-y-4">
                        <h4 class="font-bold text-stone-800">Artículos Comprados:</h4>
                        ${(order.items || [])
                          .map(
                            (item) => `
                              <div class="flex justify-between items-center text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-200">
                                <span class="font-medium">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</span>
                                <span>${formatMoney(item.price)}</span>
                              </div>
                            `,
                          )
                          .join('')}
                      </div>
                    </div>
                  `
                })
                .join('')
        }
      </div>
    </main>
  `
}

export function renderDashboard(state) {
  const user = state.user
  const producerProducts = state.products.filter((p) => String(p.producer_id) === String(user.id))
  const categories = ['Verduras', 'Frutas', 'Granos', 'Lácteos', 'Otros']
  const np = state.np

  const editing = state.editingProductId
  const showForm = state.showNewProductForm || !!editing

  const view = state.dashboardView

  const tabs = `
    <nav class="sketch-card p-4 space-y-2">
      <button data-action="dash-tab" data-tab="products" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
        view === 'products'
          ? 'bg-brand-sage border-2 border-stone-800 text-stone-800'
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
      }">
        <i data-lucide="package" style="width:20px;height:20px"></i> Mis Productos
      </button>
      <button data-action="dash-tab" data-tab="profile" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
        view === 'profile'
          ? 'bg-brand-sage border-2 border-stone-800 text-stone-800'
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
      }">
        <i data-lucide="map-pin" style="width:20px;height:20px"></i> Editar Perfil
      </button>
      <button data-action="dash-tab" data-tab="resume" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
        view === 'resume'
          ? 'bg-brand-sage border-2 border-stone-800 text-stone-800'
          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
      }">
        <i data-lucide="bar-chart-2" style="width:20px;height:20px"></i> Resumen
      </button>
    </nav>
  `

  const profileForm = `
    <form data-action="update-profile" class="sketch-card bg-white p-8 space-y-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-2xl font-bold font-serif text-stone-800">Perfil de la Huerta</h3>
      </div>
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Nombre del Negocio o Granja</label>
          <input required value="${escapeHtml(state.editProfileName || '')}" data-action="profile-name" type="text" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="Huerta La Esperanza" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Ubicación</label>
          <input required value="${escapeHtml(state.editProfileLocation || '')}" data-action="profile-location" type="text" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="Bogotá, Localidad de Usme" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Historia o Descripción</label>
          <textarea required data-action="profile-desc" class="w-full h-32 px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none resize-none" placeholder="Llevamos 3 generaciones cultivando sin químicos...">${escapeHtml(
            state.editProfileDesc || '',
          )}</textarea>
        </div>
      </div>
      <button type="submit" class="sketch-button w-full py-4 !text-lg bg-stone-900 text-white border-2 border-stone-800 hover:bg-stone-800">Guardar Cambios</button>
      <div class="pt-8">
        <button type="button" data-action="logout" class="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 border-2 border-red-500 rounded-xl font-bold transition-colors">
          <i data-lucide="log-out" style="width:20px;height:20px"></i> Cerrar Sesión
        </button>
      </div>
    </form>
  `

  const productsView = `
    <div class="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sketch-card p-8">
      <div>
        <h2 class="text-3xl font-serif font-bold">Gestión de Inventario</h2>
        <p class="text-stone-500 mt-1">Administra tus alimentos frescos a la venta.</p>
      </div>
      <button data-action="toggle-new-product" class="sketch-button flex items-center gap-2 px-6">
        <i data-lucide="plus" style="width:20px;height:20px"></i> ${state.showNewProductForm ? 'Cerrar' : 'Nuevo Producto'}
      </button>
    </div>

    ${
      showForm
        ? `
          <form data-action="submit-product" class="sketch-card bg-white p-8 space-y-6 relative">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-2xl font-bold font-serif text-stone-800">${editing ? 'Editar Producto' : 'Detalles del Producto'}</h3>
              ${
                editing
                  ? `<button type="button" data-action="cancel-editing" class="text-stone-500 hover:text-stone-800 font-bold text-sm underline">Cancelar Edición</button>`
                  : ''
              }
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Nombre del Alimento</label>
                <div class="flex gap-2">
                  <input required value="${escapeHtml(np.name)}" data-action="np-name" type="text" class="flex-grow px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none w-full" placeholder="Ej. Tomates Cherry" />
                  <button type="button" data-action="np-auto" ${np.isSearchingImage || !np.name ? 'disabled' : ''} class="px-4 py-3 bg-brand-leaf text-white border-2 border-stone-800 font-bold hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap outline-none flex items-center gap-2 sketch-button !py-2">
                    ${np.isSearchingImage ? 'Buscando...' : 'Info Auto.'}
                  </button>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Categoría</label>
                <select data-action="np-category" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none">
                  ${categories
                    .map((c) => `<option value="${escapeHtml(c)}" ${np.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`)
                    .join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Precio</label>
                <input required value="${escapeHtml(np.price)}" data-action="np-price" type="number" step="0.01" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="0.00" />
              </div>
              <div class="flex gap-4">
                <div class="w-2/3 space-y-2">
                  <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Stock Disponible</label>
                  <input required value="${escapeHtml(np.stock)}" data-action="np-stock" type="number" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none" placeholder="10" />
                </div>
                <div class="w-1/3 space-y-2">
                  <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Unidad</label>
                  <select data-action="np-unit" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none">
                    <option value="kg" ${np.unit === 'kg' ? 'selected' : ''}>kg</option>
                    <option value="uds" ${np.unit === 'uds' ? 'selected' : ''}>uds</option>
                    <option value="litros" ${np.unit === 'litros' ? 'selected' : ''}>litros</option>
                    <option value="manojo" ${np.unit === 'manojo' ? 'selected' : ''}>manojo</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Imagen (Sube una foto o busca Info Auto.)</label>
              <div class="flex gap-4 items-center">
                <div class="w-16 h-16 rounded-xl overflow-hidden sketch-border shrink-0 bg-stone-100 relative">
                  ${
                    np.isUploadingImage
                      ? `<span class="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400 font-bold bg-white text-center leading-none p-1">CARGANDO...</span>`
                      : np.image
                        ? `<img src="${escapeHtml(np.image)}" alt="Preview" class="w-full h-full object-cover" />`
                        : `<span class="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400 font-bold">VACÍO</span>`
                  }
                </div>
                <div class="flex-grow space-y-2">
                  <input value="${escapeHtml(np.image)}" data-action="np-image" type="text" class="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none text-sm" placeholder="URL de imagen" />
                  <label class="sketch-button flex items-center justify-center gap-2 cursor-pointer !py-2 !text-sm w-full bg-stone-100 hover:bg-stone-200">
                    <i data-lucide="upload" style="width:16px;height:16px"></i> Subir desde tu equipo
                    <input data-action="np-file" type="file" accept="image/*" class="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-widest">Descripción</label>
              <textarea required data-action="np-desc" class="w-full h-32 px-4 py-3 bg-stone-50 border-2 border-stone-200 focus:border-stone-800 outline-none resize-none" placeholder="Describe cómo cultivaste o preparaste este producto...">${escapeHtml(
                np.desc,
              )}</textarea>
            </div>

            <button type="submit" class="sketch-button w-full py-4 !text-lg bg-[#4C7C3E] text-white border-2 border-stone-800 hover:bg-[#3d6332]">
              ${editing ? 'Actualizar Producto' : 'Guardar y Publicar'}
            </button>
          </form>
        `
        : ''
    }

    ${
      producerProducts.length
        ? `
          <div class="space-y-4 pt-4">
            <h3 class="text-xl font-bold font-serif text-stone-800 mb-6">Tus Productos (Catálogo Actual)</h3>
            <div class="flex flex-col gap-3">
              ${producerProducts
                .map((p) => {
                  const faded = p.isActive === false ? 'opacity-60 grayscale' : ''
                  return `
                    <div class="sketch-card flex items-stretch bg-stone-50 border-2 border-stone-800 rounded-xl relative overflow-hidden ${faded}">
                      <div class="w-[100px] md:w-32 bg-stone-200 border-r-2 border-stone-800 shrink-0">
                        <img src="${escapeHtml(p.image_url || `https://picsum.photos/seed/${p.id}/200/200`)}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover" />
                      </div>
                      <div class="p-3 md:p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h4 class="font-bold text-stone-800 text-sm md:text-xl leading-tight md:mb-1">${escapeHtml(p.name)} - ${formatMoney(p.price)}/${escapeHtml(p.unit || '')}</h4>
                          <p class="text-stone-600 text-[11px] md:text-sm mt-1">Stock: ${escapeHtml(p.stock)} ${escapeHtml(p.unit || '')}</p>
                        </div>
                        <div class="self-end flex items-center gap-3 mt-2 md:mt-4">
                          <button data-action="edit-product" data-product-id="${escapeHtml(p.id)}" title="Editar producto" class="text-green-700 hover:text-green-800 transition-colors">
                            <i data-lucide="pencil" style="width:18px;height:18px"></i>
                          </button>
                          <button data-action="delete-product" data-product-id="${escapeHtml(p.id)}" title="Eliminar definitivamente" class="text-red-600 hover:text-red-700 transition-colors">
                            <i data-lucide="trash-2" style="width:18px;height:18px"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `
                })
                .join('')}
            </div>
          </div>
        `
        : ''
    }
  `

  const resumeView = (() => {
    const totalStock = producerProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0)
    return `
      <div class="grid grid-cols-2 gap-4">
        <div class="sketch-card bg-amber-50 p-6 flex flex-col border-dashed">
          <span class="text-stone-500 font-bold uppercase tracking-widest text-xs mb-2">Total Productos</span>
          <span class="text-4xl font-serif font-bold text-stone-800">${producerProducts.length}</span>
        </div>
        <div class="sketch-card bg-green-50 p-6 flex flex-col border-dashed border-green-800">
          <span class="text-green-800 font-bold uppercase tracking-widest text-xs mb-2">Unidades Totales</span>
          <span class="text-4xl font-serif font-bold text-green-900">${totalStock}</span>
        </div>
      </div>
    `
  })()

  return `
    <div class="bg-brand-cream min-h-screen pb-24">
      <main class="max-w-7xl mx-auto px-4 py-6 md:py-12 flex flex-col md:flex-row gap-8">
        <aside class="hidden md:block w-full md:w-1/4 space-y-6">
          <div class="sketch-card bg-brand-sage/10 p-6 flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-white sketch-border shrink-0">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.email || user.id)}" alt="${escapeHtml(user.name || '')}" class="w-full h-full object-cover" />
            </div>
            <div>
              <h3 class="font-bold text-xl leading-tight">${escapeHtml(user.name || '')}</h3>
              <span class="text-xs font-bold text-stone-500 uppercase tracking-widest">${escapeHtml(user.location || 'Local')}</span>
            </div>
          </div>

          ${tabs}

          <div class="pt-4 border-t-2 border-dashed border-stone-200">
            <button data-action="logout" class="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-500 rounded-xl font-bold transition-colors">
              <i data-lucide="log-out" style="width:20px;height:20px"></i> Cerrar Sesión
            </button>
          </div>
        </aside>

        <section class="w-full md:w-3/4 space-y-8">
          ${view === 'profile' ? profileForm : view === 'products' ? productsView : resumeView}
        </section>
      </main>
    </div>
  `
}
