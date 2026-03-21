const listeners = new Set()

const state = {
  authLoaded: false,
  user: null,
  view: 'landing',
  scrolled: false,
  selectedProductId: null,
  selectedProducerId: null,
  products: [],
  producerCache: {},
  cart: [],
  isCartOpen: false,
  searchTerm: '',
  categoryFilter: 'Todos',
  sortBy: 'latest', // Added: default sorting by latest
  orderSuccess: false,
  userOrders: [],
  dashboardView: 'products',
  editingProductId: null,
  showNewProductForm: false,
  editProfileName: '',
  editProfileLocation: '',
  editProfileDesc: '',
  np: {
    name: '',
    price: '',
    stock: '',
    category: 'Verduras',
    unit: 'kg',
    desc: '',
    image: '',
    isSearchingImage: false,
    isUploadingImage: false,
  },
  authForm: {
    email: '',
    password: '',
    name: '',
  },
  modal: {
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: null,
    onCancel: null,
  },
}

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setState(patch) {
  Object.assign(state, patch)
  for (const l of listeners) l(state)
}

export function updateState(mutator) {
  mutator(state)
  for (const l of listeners) l(state)
}

export function loadCart() {
  try {
    const raw = localStorage.getItem('delhuerto:cart')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) state.cart = parsed
  } catch {}
}

export function persistCart() {
  try {
    localStorage.setItem('delhuerto:cart', JSON.stringify(state.cart))
  } catch {}
}
