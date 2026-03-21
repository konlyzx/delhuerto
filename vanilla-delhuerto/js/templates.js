export function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatMoney(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '$0.00'
  return `$${v.toFixed(2)}`
}

export function renderNavbar(state) {
  const scrolledClass = state.scrolled
    ? 'w-[85%] translate-y-4 rounded-full bg-brand-cream/85 shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 border-b-2'
    : 'w-full translate-y-0 rounded-none bg-brand-cream shadow-none py-4 border-b-4'

  const cartCount = state.cart.reduce((a, b) => a + (b.quantity || 0), 0)
  const user = state.user

  return `
    <nav class="sticky top-0 z-50 mx-auto backdrop-blur-xl border-stone-800/20 px-6 transition-all duration-300 ease-out origin-top ${scrolledClass}">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center flex-1">
          <div class="flex items-center gap-2 cursor-pointer group" data-nav="/">
            <img
              src="./assets/images/logo.png"
              alt="DelHuerto Logo"
              class="${state.scrolled ? 'h-[60px] scale-[1.15]' : 'h-[88px] scale-[1.6] translate-x-4'} w-auto transition-all duration-300 ease-out origin-left"
              onerror="this.src='https://picsum.photos/seed/delhuerto/100/100'"
            />
          </div>

          <div class="hidden md:flex items-center gap-8 text-sm font-bold text-stone-600 md:ml-12 lg:ml-20">
            <button data-nav="/" class="cursor-pointer hover:text-brand-leaf transition-colors relative group">
              Inicio
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
            </button>
            <button data-nav="/catalogo" class="cursor-pointer hover:text-brand-leaf transition-colors relative group">
              Catálogo
              <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
            </button>
            ${
              user?.role === 'producer'
                ? `
                  <button data-nav="/panel-productor" class="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                    Mi Huerto (Panel)
                    <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                  </button>
                `
                : user
                  ? `
                    <button data-nav="/mis-pedidos" class="cursor-pointer hover:text-brand-leaf transition-colors relative group">
                      Mis Pedidos
                      <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                    </button>
                    <button data-action="upgrade-role" class="cursor-pointer text-brand-leaf font-bold hover:text-green-700 transition-colors relative group flex items-center gap-1">
                      <i data-lucide="store" style="width:16px;height:16px"></i> Tener mi Huerto
                      <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-leaf transition-all group-hover:w-full"></span>
                    </button>
                  `
                  : ''
            }
          </div>
        </div>

        <div class="flex items-center gap-4">
          ${
            user
              ? `
                <div class="flex items-center gap-3">
                  ${
                    user.role === 'producer'
                      ? `
                        <button class="relative p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Notificaciones">
                          <i data-lucide="shopping-basket" style="width:22px;height:22px"></i>
                          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                      `
                      : `
                        <button data-action="open-cart" class="relative p-2 text-stone-800 hover:bg-stone-100 rounded-full transition-colors cursor-pointer" title="Carrito de compras">
                          <i data-lucide="shopping-cart" style="width:22px;height:22px"></i>
                          ${
                            cartCount > 0
                              ? `<span class="absolute top-0 right-0 bg-amber-400 border-2 border-stone-800 text-stone-800 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">${cartCount}</span>`
                              : ''
                          }
                        </button>
                      `
                  }

                  <div class="relative group">
                    <button class="flex items-center gap-2 p-1 pr-3 bg-white border-2 border-stone-800 rounded-full hover:bg-stone-50 transition-colors shadow-[2px_2px_0px_0px_rgba(41,37,36,0.3)] cursor-pointer">
                      <div class="w-8 h-8 rounded-full overflow-hidden bg-brand-sage/30 border border-stone-800/10">
                        <img src="${escapeHtml(user.image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`)}" alt="${escapeHtml(user.name)}" class="w-full h-full object-cover" />
                      </div>
                      <div class="flex flex-col text-left">
                        <span class="text-[10px] font-bold text-stone-400 leading-none uppercase tracking-widest">${user.role === 'producer' ? 'Huerto' : 'Comprador'}</span>
                        <span class="text-xs font-bold text-stone-800 leading-tight truncate max-w-[100px]">${escapeHtml(String(user.name || '').split(' ')[0] || 'Usuario')}</span>
                      </div>
                    </button>

                    <div class="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(41,37,36,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50">
                      <div class="p-3 border-b-2 border-dashed border-stone-200">
                        <p class="font-bold text-sm text-stone-800 truncate">${escapeHtml(user.email || '')}</p>
                      </div>
                      <div class="p-2 space-y-1">
                        <button data-nav="${user.role === 'producer' ? '/panel-productor' : '/mis-pedidos'}" class="w-full text-left px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-800 rounded-lg transition-colors cursor-pointer">
                          ${user.role === 'producer' ? 'Mi Panel' : 'Historial de compras'}
                        </button>
                        <button data-action="logout" class="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <i data-lucide="log-out" style="width:16px;height:16px"></i> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `
              : `
                <div class="flex items-center gap-2">
                  <button data-nav="/login" class="text-sm font-bold text-stone-600 px-4 py-2 hover:text-stone-800 cursor-pointer">Entrar</button>
                  <button data-nav="/registro" class="sketch-button !py-2 !px-6 !text-sm cursor-pointer">Unirse</button>
                </div>
              `
          }
        </div>
      </div>
    </nav>
  `
}

export function renderFooter() {
  return `
    <footer class="bg-stone-900 text-white py-24 px-4 relative overflow-hidden text-center md:text-left">
      <div class="max-w-7xl mx-auto grid md:grid-cols-4 gap-16 relative z-10">
        <div class="space-y-8">
          <div class="flex items-center gap-2">
            <img
              src="./assets/images/logo.png"
              alt="DelHuerto Logo"
              class="h-20 w-auto brightness-0 invert"
              onerror="this.src='https://picsum.photos/seed/delhuerto/100/100'"
            />
          </div>
          <p class="text-stone-400 leading-relaxed">Transformando el comercio local a través de la tecnología y la confianza. Del campo a tu mesa, sin intermediarios.</p>
        </div>
        <div>
          <h4 class="font-bold mb-6 text-lg">Plataforma</h4>
          <ul class="space-y-4 text-stone-400">
            <li><button data-nav="/" class="hover:text-brand-leaf cursor-pointer">Inicio</button></li>
            <li><button data-nav="/catalogo" class="hover:text-brand-leaf cursor-pointer">Mercado</button></li>
            <li><button data-nav="/registro" class="hover:text-brand-leaf cursor-pointer">Registrarse</button></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-6 text-lg">Comunidad</h4>
          <ul class="space-y-4 text-stone-400">
            <li><a href="#" class="hover:text-brand-leaf cursor-pointer">Productores</a></li>
            <li><a href="#" class="hover:text-brand-leaf cursor-pointer">Historias</a></li>
            <li><a href="#" class="hover:text-brand-leaf cursor-pointer">ODS</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-6 text-lg">Contacto</h4>
          <ul class="space-y-4 text-stone-400">
            <li>hola@delhuerto.com</li>
            <li>+57 300 123 4567</li>
            <li>Bogotá, Colombia</li>
          </ul>
        </div>
      </div>

      <div class="max-w-7xl mx-auto border-t border-stone-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-stone-500 text-sm relative z-10">
        <span>© 2026 DelHuerto. Todos los derechos reservados.</span>
        <div class="flex gap-6">
          <a href="#" class="hover:text-white cursor-pointer">Privacidad</a>
          <a href="#" class="hover:text-white cursor-pointer">Términos</a>
        </div>
      </div>
      <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none opacity-[0.03]">
        <h2 class="text-[15vw] font-serif font-bold whitespace-nowrap leading-none">DelHuerto</h2>
      </div>
    </footer>
  `
}

export function renderProductCard({ product, producerImage, isProducer }) {
  const img = product.image_url || `https://picsum.photos/seed/${product.id}/400/400`
  return `
    <div class="sketch-card flex flex-col gap-4 group cursor-pointer" data-action="open-product" data-product-id="${escapeHtml(product.id)}">
      <div class="aspect-square bg-stone-50 sketch-border overflow-hidden relative">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerpolicy="no-referrer" />
        <div class="absolute top-2 right-2 bg-white border-2 border-stone-800 px-3 py-1.5 text-xs font-bold rounded-full shadow-[2px_2px_0px_0px_rgba(41,37,36,0.2)]">
          ${formatMoney(product.price)}
        </div>
      </div>
      <div class="space-y-1 relative">
        <div class="flex justify-between items-start pr-2">
          <h3 class="font-bold text-stone-800 text-lg leading-tight group-hover:text-brand-leaf transition-colors">${escapeHtml(product.name)}</h3>
        </div>
        <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">${escapeHtml(product.category || '')}</span>
        ${
          product.producer_name && !isProducer
            ? `
              <div class="text-xs text-stone-500 font-bold hover:text-brand-leaf hover:underline cursor-pointer flex items-center gap-2 mt-1 block mb-1" data-action="open-producer" data-producer-id="${escapeHtml(product.producer_id)}">
                <div class="w-6 h-6 rounded-full overflow-hidden border border-stone-800/20 bg-stone-100">
                  <img src="${escapeHtml(producerImage || `https://api.dicebear.com/7.x/notionists/svg?seed=${product.producer_id}`)}" alt="${escapeHtml(product.producer_name)}" class="w-full h-full object-cover" />
                </div>
                <span>${escapeHtml(product.producer_name)}</span>
              </div>
            `
            : ''
        }
        <p class="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed opacity-0 hidden group-hover:opacity-100 group-hover:block transition-all">${escapeHtml(product.description || '')}</p>
      </div>
      ${
        isProducer
          ? ''
          : `
            <button class="sketch-button !py-2.5 !text-sm w-full mt-auto" data-action="add-to-cart" data-product-id="${escapeHtml(product.id)}">
              Comprar / Simular
            </button>
          `
      }
    </div>
  `
}

export function renderCartDrawer(state) {
  const cart = state.cart
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  return `
    <div class="${state.isCartOpen ? '' : 'hidden'}" id="cart-root">
      <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" data-action="close-cart"></div>
      <div class="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div class="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 class="text-2xl font-bold">Carrito</h2>
          <button class="p-2 hover:bg-stone-100 rounded-full transition-colors" data-action="close-cart">
            <i data-lucide="x" style="width:24px;height:24px"></i>
          </button>
        </div>
        <div class="flex-grow overflow-y-auto p-6 space-y-4">
          ${
            cart.length
              ? cart
                  .map(
                    (item) => `
                      <div class="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <div>
                          <p class="font-bold">${escapeHtml(item.name)}</p>
                          <p class="text-xs text-stone-500">
                            ${formatMoney(item.price)} x ${escapeHtml(item.quantity)}
                          </p>
                        </div>
                        <div class="flex items-center gap-2">
                          <button class="w-8 h-8 border-2 border-stone-800 rounded flex items-center justify-center font-bold cursor-pointer" data-action="cart-qty" data-product-id="${escapeHtml(item.id)}" data-delta="-1">-</button>
                          <span class="text-sm font-bold w-4 text-center">${escapeHtml(item.quantity)}</span>
                          <button class="w-8 h-8 border-2 border-stone-800 rounded flex items-center justify-center font-bold cursor-pointer" data-action="cart-qty" data-product-id="${escapeHtml(item.id)}" data-delta="1">+</button>
                          <button class="ml-2 text-red-500 cursor-pointer" data-action="cart-remove" data-product-id="${escapeHtml(item.id)}">
                            <i data-lucide="trash-2" style="width:18px;height:18px"></i>
                          </button>
                        </div>
                      </div>
                    `,
                  )
                  .join('')
              : `
                <div class="text-center py-20 text-stone-400">
                  <i data-lucide="shopping-cart" style="width:48px;height:48px" class="mx-auto mb-4 opacity-20"></i>
                  <p>Tu carrito está vacío</p>
                </div>
              `
          }
        </div>
        <div class="p-6 border-t border-stone-100">
          <div class="flex justify-between mb-4">
            <span class="font-bold">Total</span>
            <span class="font-bold text-xl">${formatMoney(total)}</span>
          </div>
          <button ${cart.length ? '' : 'disabled'} data-action="checkout" class="w-full sketch-button py-3 text-lg disabled:opacity-50">
            Confirmar Pedido
          </button>
        </div>
      </div>
    </div>
  `
}

export function renderModal(state) {
  const m = state.modal
  if (!m.isOpen) return ''
  const type = m.type || 'alert'
  const icon =
    type === 'error'
      ? 'alert-circle'
      : type === 'success'
        ? 'check-circle-2'
        : type === 'confirm'
          ? 'help-circle'
          : 'alert-circle'

  const confirmClass =
    type === 'error'
      ? 'bg-red-600 hover:bg-red-700'
      : type === 'success'
        ? 'bg-brand-leaf hover:bg-green-700'
        : 'bg-stone-900 hover:bg-stone-800'

  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" id="modal-root">
      <div class="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" data-action="modal-backdrop"></div>
      <div class="relative w-full max-w-md bg-white p-8 sketch-card z-10">
        <button class="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-800 transition-colors" data-action="modal-close">
          <i data-lucide="x" style="width:20px;height:20px"></i>
        </button>
        <div class="flex flex-col items-center text-center space-y-4">
          <div class="p-3 rounded-full border-2 border-stone-800 ${
            type === 'error'
              ? 'bg-red-50 text-red-600'
              : type === 'success'
                ? 'bg-green-50 text-green-600'
                : type === 'confirm'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-amber-50 text-amber-600'
          }">
            <i data-lucide="${icon}" style="width:32px;height:32px"></i>
          </div>
          ${
            m.title
              ? `<h3 class="text-2xl font-serif font-bold text-stone-800">${escapeHtml(m.title)}</h3>`
              : ''
          }
          <p class="text-stone-600 font-medium leading-relaxed">${escapeHtml(m.message)}</p>
          <div class="flex flex-wrap gap-4 w-full pt-4">
            ${
              m.onCancel
                ? `<button class="flex-1 px-6 py-3 border-2 border-stone-800 font-bold text-stone-800 hover:bg-stone-50 transition-colors rounded-xl cursor-pointer" data-action="modal-cancel">${escapeHtml(m.cancelText || 'Cancelar')}</button>`
                : ''
            }
            <button class="flex-1 sketch-button !py-3 !px-6 !shadow-none hover:!translate-y-[-2px] active:!translate-y-[0px] cursor-pointer ${confirmClass}" data-action="modal-confirm">
              ${escapeHtml(m.confirmText || 'Aceptar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}
