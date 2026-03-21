import { fetchProducts, fetchProducers, fetchOrdersByConsumer, fetchWikipediaInfo, listenAuth, loginWithEmail, loginWithGoogle, logout, registerWithEmail, setUserDoc, updateProduct, updateProductStock, createOrder, createProduct, deleteProduct, getUserDoc, updateUserDoc, uploadProductImage } from './api.js'
import { initRedirectFrom404, getRouteFromLocation, navigate } from './router.js'
import { getState, loadCart, persistCart, setState, subscribe, updateState } from './store.js'
import { renderCartDrawer, renderFooter, renderModal, renderNavbar } from './templates.js'
import { renderAuth, renderDashboard, renderLanding, renderMarket, renderOrders, renderProducerProfile, renderProduct } from './views.js'

function findProductById(state, id) {
  return state.products.find((p) => String(p.id) === String(id)) || null
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
}

function closeModal() {
  updateState((s) => {
    s.modal.isOpen = false
    s.modal.onConfirm = null
    s.modal.onCancel = null
  })
}

function showAlert(message, type = 'alert', title) {
  return new Promise((resolve) => {
    updateState((s) => {
      s.modal.isOpen = true
      s.modal.type = type
      s.modal.title = title || (type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Atención')
      s.modal.message = message
      s.modal.confirmText = 'Aceptar'
      s.modal.cancelText = 'Cancelar'
      s.modal.onCancel = null
      s.modal.onConfirm = () => {
        closeModal()
        resolve()
      }
    })
  })
}

function showConfirm(message, title = 'Confirmar') {
  return new Promise((resolve) => {
    updateState((s) => {
      s.modal.isOpen = true
      s.modal.type = 'confirm'
      s.modal.title = title
      s.modal.message = message
      s.modal.confirmText = 'Aceptar'
      s.modal.cancelText = 'Cancelar'
      s.modal.onCancel = () => {
        closeModal()
        resolve(false)
      }
      s.modal.onConfirm = () => {
        closeModal()
        resolve(true)
      }
    })
  })
}

async function ensureProducerCached(ids) {
  const state = getState()
  const toFetch = ids.filter((id) => id && !state.producerCache[String(id)])
  if (!toFetch.length) return
  await Promise.all(
    toFetch.map(async (id) => {
      try {
        const doc = await getUserDoc(String(id))
        if (doc) {
          updateState((s) => {
            s.producerCache[String(id)] = doc
          })
        }
      } catch {}
    }),
  )
}

async function refreshProducts() {
  try {
    const products = await fetchProducts()
    const producers = await fetchProducers()
    
    // Update cache with all producers
    const cache = {}
    producers.forEach(p => {
      cache[String(p.id)] = p
    })

    setState({ products, producerCache: cache })
  } catch (e) {
    console.warn('Could not fetch products', e)
  }
}

async function refreshOrdersIfNeeded() {
  const state = getState()
  if (state.view !== 'orders') return
  if (!state.user || state.user.role !== 'consumer') return
  try {
    const orders = await fetchOrdersByConsumer(state.user.id)
    setState({ userOrders: orders })
  } catch (e) {
    console.warn('Could not fetch orders', e)
  }
}

function guardView(state) {
  if (!state.authLoaded) return
  if (state.view === 'orders' && (!state.user || state.user.role !== 'consumer')) {
    navigate('/')
  }
  if (state.view === 'dashboard' && (!state.user || state.user.role !== 'producer')) {
    navigate('/catalogo')
  }
  if (state.view === 'product' && !state.selectedProductId) {
    navigate('/catalogo')
  }
  if (state.view === 'producer-profile' && !state.selectedProducerId) {
    navigate('/catalogo')
  }
}

function render() {
  const state = getState()
  guardView(state)

  let content = ''

  if (state.view === 'landing') {
    content = renderLanding(state) + renderFooter()
  } else if (state.view === 'market') {
    content = renderMarket(state)
  } else if (state.view === 'login') {
    content = renderAuth(state, 'login')
  } else if (state.view === 'register') {
    content = renderAuth(state, 'register')
  } else if (state.view === 'orders') {
    content = renderOrders(state)
  } else if (state.view === 'dashboard') {
    content = renderDashboard(state)
  } else if (state.view === 'product') {
    const product = findProductById(state, state.selectedProductId)
    if (!product) {
      content = renderMarket(state)
    } else {
      const producer = state.producerCache[String(product.producer_id)]
      content = renderProduct(state, product, producer)
    }
  } else if (state.view === 'producer-profile') {
    const producerId = state.selectedProducerId
    const producerInfo = state.producerCache[String(producerId)] || {}
    const producerProducts = state.products.filter((p) => String(p.producer_id) === String(producerId))
    content = renderProducerProfile(state, producerId, producerInfo, producerProducts)
  }

  const hideNavbar = state.view === 'dashboard' ? 'hidden md:block' : ''
  const root = document.getElementById('root')
  root.innerHTML = `
    <div class="min-h-screen bg-brand-cream flex flex-col">
      <div class="${hideNavbar}">
        ${renderNavbar(state)}
      </div>
      ${content}
      ${renderCartDrawer(state)}
      ${renderModal(state)}
    </div>
  `

  if (window.lucide?.createIcons) {
    try {
      window.lucide.createIcons()
    } catch {}
  }
}

function setRouteStateFromLocation() {
  const route = getRouteFromLocation()
  updateState((s) => {
    s.view = route.view
    s.selectedProductId = route.productId || null
    s.selectedProducerId = route.producerId || null
    s.isCartOpen = false
  })
  const state = getState()
  if (route.view === 'product' && route.productId) {
    const product = findProductById(state, route.productId)
    if (!product) {
      setTimeout(() => {
        const p2 = findProductById(getState(), route.productId)
        if (!p2) navigate('/catalogo')
      }, 0)
    } else {
      ensureProducerCached([product.producer_id])
    }
  }
  if (route.view === 'producer-profile' && route.producerId) {
    ensureProducerCached([route.producerId])
  }
  refreshOrdersIfNeeded()
}

function addToCart(product) {
  updateState((s) => {
    const existing = s.cart.find((i) => String(i.id) === String(product.id))
    if (existing) {
      existing.quantity = Math.min(Number(existing.stock || 999999), Number(existing.quantity || 0) + 1)
    } else {
      s.cart.push({ ...product, quantity: 1 })
    }
  })
  persistCart()
}

function updateCartQuantity(productId, delta) {
  updateState((s) => {
    for (const item of s.cart) {
      if (String(item.id) === String(productId)) {
        const next = Math.max(1, Math.min(Number(item.stock || 999999), Number(item.quantity || 1) + delta))
        item.quantity = next
      }
    }
  })
  persistCart()
}

async function removeFromCart(productId) {
  const ok = await showConfirm('¿Estás seguro de que quieres quitar este producto de tu carrito?', '¿Eliminar producto?')
  if (!ok) return
  updateState((s) => {
    s.cart = s.cart.filter((i) => String(i.id) !== String(productId))
  })
  persistCart()
}

async function checkout() {
  const state = getState()
  if (!state.user) {
    navigate('/login')
    return
  }
  try {
    const items = state.cart.map((i) => ({ ...i }))
    const total = cartTotal(items)
    await createOrder({ consumerId: state.user.id, items, total })
    await Promise.all(
      items.map((item) => updateProductStock(item.id, Math.max(0, Number(item.stock || 0) - Number(item.quantity || 0)))),
    )
    updateState((s) => {
      s.cart = []
      s.isCartOpen = false
      s.orderSuccess = true
    })
    persistCart()
    refreshProducts()
    setTimeout(() => setState({ orderSuccess: false }), 5000)
  } catch (e) {
    console.error('Error order', e)
    showAlert('Hubo un error al procesar tu pedido', 'error')
  }
}

async function handleUpgradeRole() {
  const state = getState()
  if (!state.user) {
    navigate('/login')
    return
  }
  try {
    await updateUserDoc(String(state.user.id), { role: 'producer' })
    updateState((s) => {
      s.user = { ...s.user, role: 'producer' }
    })
    navigate('/panel-productor')
    showAlert('¡Felicidades! Ahora tienes tu huerto habilitado.', 'success')
  } catch (e) {
    showAlert('Error al actualizar rol.', 'error')
  }
}

async function handleLoginSubmit() {
  const state = getState()
  try {
    const cred = await loginWithEmail(state.authForm.email, state.authForm.password)
    try {
      const doc = await getUserDoc(cred.user.uid)
      if (doc?.role === 'producer') navigate('/panel-productor')
      else navigate('/catalogo')
    } catch {
      const localRole = localStorage.getItem(`role_${cred.user.uid}`)
      navigate(localRole === 'producer' ? '/panel-productor' : '/catalogo')
    }
  } catch (e) {
    showAlert('Error al entrar.', 'error')
  }
}

async function handleGoogleLogin() {
  try {
    const result = await loginWithGoogle()
    const uid = result.user.uid
    try {
      const userDoc = await getUserDoc(uid)
      if (!userDoc) {
        const newUserData = {
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuario',
          email: result.user.email || '',
          role: 'consumer',
          location: 'Bogotá',
        }
        await setUserDoc(uid, newUserData)
        navigate('/catalogo')
      } else {
        navigate(userDoc.role === 'producer' ? '/panel-productor' : '/catalogo')
      }
    } catch {
      const localRole = localStorage.getItem(`role_${uid}`)
      navigate(localRole === 'producer' ? '/panel-productor' : '/catalogo')
    }
  } catch (e) {
    showAlert('Error con Google.', 'error')
  }
}

async function handleRegisterSubmit() {
  const state = getState()
  try {
    const userCredential = await registerWithEmail(state.authForm.email, state.authForm.password)
    const newUserData = {
      name: state.authForm.name || state.authForm.email.split('@')[0],
      email: state.authForm.email,
      role: 'consumer',
      location: 'Bogotá',
    }
    await setUserDoc(userCredential.user.uid, newUserData)
    navigate('/catalogo')
  } catch (e) {
    showAlert('Error al registrarse.', 'error')
  }
}

async function handleLogout() {
  try {
    await logout()
    navigate('/')
  } catch {}
}

async function handleProfileUpdate() {
  const state = getState()
  if (!state.user) return
  try {
    await updateUserDoc(String(state.user.id), {
      name: state.editProfileName,
      location: state.editProfileLocation,
      description: state.editProfileDesc,
    })
    updateState((s) => {
      s.user = { ...s.user, name: s.editProfileName, location: s.editProfileLocation, description: s.editProfileDesc }
    })
    showAlert('Perfil actualizado correctamente', 'success')
  } catch {
    showAlert('Error al actualizar perfil.', 'error')
  }
}

async function handleNpAutoInfo() {
  const state = getState()
  if (!state.user) return
  if (!state.np.name) return
  updateState((s) => {
    s.np.isSearchingImage = true
  })
  try {
    const data = await fetchWikipediaInfo(state.np.name)
    const pages = data.query?.pages
    if (pages) {
      const pageId = Object.keys(pages)[0]
      const page = pages[pageId]
      updateState((s) => {
        if (page.thumbnail?.source) s.np.image = page.thumbnail.source
        if (page.extract && !s.np.desc) s.np.desc = String(page.extract).split('.')[0] + '.'
      })
    }
  } catch {} finally {
    updateState((s) => {
      s.np.isSearchingImage = false
    })
  }
}

async function handleNpFileUpload(file) {
  updateState((s) => {
    s.np.isUploadingImage = true
  })
  try {
    const url = await uploadProductImage(file)
    updateState((s) => {
      s.np.image = url
    })
  } catch {
    showAlert('Error al subir la imagen.', 'error')
  } finally {
    updateState((s) => {
      s.np.isUploadingImage = false
    })
  }
}

async function handleSubmitProduct() {
  const state = getState()
  const user = state.user
  if (!user) return
  const np = state.np
  try {
    if (state.editingProductId) {
      await updateProduct(state.editingProductId, {
        name: np.name,
        price: parseFloat(np.price),
        stock: parseInt(np.stock, 10),
        unit: np.unit,
        category: np.category,
        description: np.desc,
        image_url: np.image,
      })
      updateState((s) => {
        s.editingProductId = null
      })
    } else {
      await createProduct({
        producer_id: user.id,
        producer_name: user.name,
        producer_location: user.location,
        name: np.name,
        price: parseFloat(np.price),
        stock: parseInt(np.stock, 10),
        unit: np.unit,
        category: np.category,
        description: np.desc,
        isActive: true,
        image_url: np.image || `https://picsum.photos/seed/${Date.now()}/600/600`,
      })
    }

    updateState((s) => {
      s.showNewProductForm = false
      s.np = { ...s.np, name: '', price: '', stock: '', desc: '', image: '' }
    })
    await refreshProducts()
  } catch {
    showAlert('Error al guardar en Firebase.', 'error')
  }
}

async function handleDeleteProduct(productId) {
  const ok = await showConfirm('¿Seguro que deseas eliminar definitivamente este producto?')
  if (!ok) return
  try {
    await deleteProduct(productId)
    refreshProducts()
  } catch {
    showAlert('Error al eliminar producto.', 'error')
  }
}

function startEditingProduct(productId) {
  const state = getState()
  const p = findProductById(state, productId)
  if (!p) return
  updateState((s) => {
    s.editingProductId = p.id
    s.showNewProductForm = true
    s.dashboardView = 'products'
    s.np.name = p.name || ''
    s.np.price = String(p.price ?? '')
    s.np.stock = String(p.stock ?? '')
    s.np.category = p.category || 'Verduras'
    s.np.unit = p.unit || 'kg'
    s.np.desc = p.description || ''
    s.np.image = p.image_url || ''
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditing() {
  updateState((s) => {
    s.showNewProductForm = false
    s.editingProductId = null
    s.np.name = ''
    s.np.price = ''
    s.np.stock = ''
    s.np.desc = ''
    s.np.image = ''
  })
}

function wireEvents() {
  const root = document.getElementById('root')

  root.addEventListener('click', async (e) => {
    const nav = e.target.closest('[data-nav]')
    if (nav) {
      e.preventDefault()
      navigate(nav.getAttribute('data-nav'))
      return
    }

    const el = e.target.closest('[data-action]')
    if (!el) return
    const action = el.getAttribute('data-action')

    if (action === 'open-cart') updateState((s) => (s.isCartOpen = true))
    else if (action === 'close-cart') updateState((s) => (s.isCartOpen = false))
    else if (action === 'logout') handleLogout()
    else if (action === 'upgrade-role') handleUpgradeRole()
    else if (action === 'go-register') navigate('/registro')
    else if (action === 'go-dashboard') navigate('/panel-productor')
    else if (action === 'google-login') handleGoogleLogin()
    else if (action === 'modal-close' || action === 'modal-backdrop') {
      const s = getState()
      if (s.modal.onCancel) s.modal.onCancel()
      else if (s.modal.onConfirm) s.modal.onConfirm()
    } else if (action === 'modal-cancel') {
      const s = getState()
      if (s.modal.onCancel) s.modal.onCancel()
    } else if (action === 'modal-confirm') {
      const s = getState()
      if (s.modal.onConfirm) s.modal.onConfirm()
    } else if (action === 'open-product') {
      const id = el.getAttribute('data-product-id')
      navigate(`/producto/${id}`)
    } else if (action === 'open-producer') {
      const id = el.getAttribute('data-producer-id')
      navigate(`/productor/${id}`)
    } else if (action === 'add-to-cart') {
      e.preventDefault()
      const id = el.getAttribute('data-product-id')
      const p = findProductById(getState(), id)
      if (p) addToCart(p)
    } else if (action === 'add-to-cart-open') {
      const id = el.getAttribute('data-product-id')
      const p = findProductById(getState(), id)
      if (p) addToCart(p)
      updateState((s) => (s.isCartOpen = true))
    } else if (action === 'cart-qty') {
      const id = el.getAttribute('data-product-id')
      const delta = Number(el.getAttribute('data-delta') || 0)
      updateCartQuantity(id, delta)
    } else if (action === 'cart-remove') {
      const id = el.getAttribute('data-product-id')
      removeFromCart(id)
    } else if (action === 'checkout') {
      checkout()
    } else if (action === 'set-category') {
      const cat = el.getAttribute('data-category')
      updateState((s) => {
        s.categoryFilter = cat
      })
    } else if (action === 'set-sort') {
      updateState((s) => {
        s.sortBy = el.value
      })
    } else if (action === 'dash-tab') {
      const tab = el.getAttribute('data-tab')
      updateState((s) => {
        s.dashboardView = tab
      })
    } else if (action === 'toggle-new-product') {
      updateState((s) => {
        s.showNewProductForm = !s.showNewProductForm
      })
    } else if (action === 'cancel-editing') {
      cancelEditing()
    } else if (action === 'edit-product') {
      const id = el.getAttribute('data-product-id')
      startEditingProduct(id)
    } else if (action === 'delete-product') {
      const id = el.getAttribute('data-product-id')
      handleDeleteProduct(id)
    } else if (action === 'np-auto') {
      handleNpAutoInfo()
    }
  })

  root.addEventListener('input', (e) => {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const action = el.getAttribute('data-action')
    if (action === 'set-search') {
      updateState((s) => {
        s.searchTerm = el.value
      })
    } else if (action === 'auth-email') {
      updateState((s) => (s.authForm.email = el.value))
    } else if (action === 'auth-pass') {
      updateState((s) => (s.authForm.password = el.value))
    } else if (action === 'auth-name') {
      updateState((s) => (s.authForm.name = el.value))
    } else if (action === 'profile-name') {
      updateState((s) => (s.editProfileName = el.value))
    } else if (action === 'profile-location') {
      updateState((s) => (s.editProfileLocation = el.value))
    } else if (action === 'profile-desc') {
      updateState((s) => (s.editProfileDesc = el.value))
    } else if (action === 'np-name') {
      updateState((s) => (s.np.name = el.value))
    } else if (action === 'np-price') {
      updateState((s) => (s.np.price = el.value))
    } else if (action === 'np-stock') {
      updateState((s) => (s.np.stock = el.value))
    } else if (action === 'np-image') {
      updateState((s) => (s.np.image = el.value))
    } else if (action === 'np-desc') {
      updateState((s) => (s.np.desc = el.value))
    }
  })

  root.addEventListener('change', (e) => {
    const el = e.target.closest('[data-action]')
    if (!el) return
    const action = el.getAttribute('data-action')
    if (action === 'np-category') updateState((s) => (s.np.category = el.value))
    else if (action === 'np-unit') updateState((s) => (s.np.unit = el.value))
    else if (action === 'np-file') {
      const file = el.files?.[0]
      if (file) handleNpFileUpload(file)
    }
  })

  root.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-action]')
    if (!form) return
    e.preventDefault()
    const action = form.getAttribute('data-action')
    if (action === 'submit-login') handleLoginSubmit()
    else if (action === 'submit-register') handleRegisterSubmit()
    else if (action === 'update-profile') handleProfileUpdate()
    else if (action === 'submit-product') handleSubmitProduct()
  })
}

function boot() {
  initRedirectFrom404()
  loadCart()

  subscribe(render)
  window.addEventListener('popstate', () => setRouteStateFromLocation())
  window.addEventListener(
    'scroll',
    () => {
      const v = window.scrollY > 50
      const s = getState()
      if (s.scrolled !== v) setState({ scrolled: v })
    },
    { passive: true },
  )

  wireEvents()
  setRouteStateFromLocation()

  listenAuth(async (user) => {
    if (user) {
      setState({
        user: {
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          role: user.role || 'consumer',
          location: user.location || 'Bogotá',
          description: user.description || '',
          image_url: user.image_url || '',
        },
      })
    } else {
      setState({ user: null })
    }

    const st = getState()
    if (st.user) {
      setState({
        editProfileName: st.user.name || '',
        editProfileLocation: st.user.location || '',
        editProfileDesc: st.user.description || '',
      })
    }

    setState({ authLoaded: true })
    refreshProducts()
    refreshOrdersIfNeeded()
  })

  refreshProducts()
}

boot()
