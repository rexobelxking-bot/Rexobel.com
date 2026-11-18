import { ArrowRight, Bookmark, Camera, Check, Search, ShoppingBag, SlidersHorizontal, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { Avatar } from './components/Avatar';
import { CartDrawer } from './components/CartDrawer';
import { ProductModal } from './components/ProductModal';
import { ProfileModal } from './components/ProfileModal';
import { SupportModal } from './components/SupportModal';
import { api, getStoredToken } from './lib/api';
import type { CartItem, GarmentSize, MemberProfile, Order, Product, ProductCategory } from './types';

const HERO_IMAGE = '/src/assets/images/veltron_dark_hero_1795022707121.jpg';
const CATEGORIES: Array<'All' | ProductCategory> = ['All', 'Outerwear', 'Knitwear', 'Trousers', 'Accessories'];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [user, setUser] = useState<MemberProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [activeCategory, setActiveCategory] = useState<'All' | ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, GarmentSize>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('veltron_cart');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'wishlist' | 'orders'>('profile');
  const [cartOpen, setCartOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('veltron_cart', JSON.stringify(cart));
    } catch {
      // Ignore storage failures
    }
  }, [cart]);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const prodRes = await api.getProducts();
        if (active) {
          setProducts(prodRes.products);
          setProductsError(null);
        }
      } catch (err) {
        if (active) {
          setProductsError(err instanceof Error ? err.message : 'Unable to load REXOBEL collection.');
        }
      } finally {
        if (active) setLoadingProducts(false);
      }

      if (getStoredToken()) {
        try {
          const meRes = await api.getMe();
          if (active) setUser(meRes.user);
        } catch {
          // Session expired or invalid
        }
      } else {
        try {
          const meRes = await api.getMe();
          if (active) setUser(meRes.user);
        } catch {
          // Guest session
        }
      }
      if (active) setAuthReady(true);
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 2600);
  }

  function getSizeForProduct(product: Product): GarmentSize {
    const explicit = selectedSizes[product.id];
    if (explicit && product.sizes.includes(explicit)) return explicit;
    if (user && product.sizes.includes(user.preferredSize)) return user.preferredSize;
    return product.sizes.includes('M') ? 'M' : product.sizes[0];
  }

  function handleAddToBag(product: Product, size: GarmentSize) {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId((cur) => (cur === product.id ? null : cur)), 1500);
    showToast(`${product.name} (${size}) added to bag`);
  }

  function handleUpdateCartQty(productId: string, size: GarmentSize, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId && item.size === size
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemoveCartItem(productId: string, size: GarmentSize) {
    setCart((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)));
  }

  async function handleToggleWishlist(productId: string) {
    if (!user) {
      setAuthInitialMode('signin');
      setAuthModalOpen(true);
      showToast('Sign in to save garments to your member profile');
      return;
    }
    try {
      const res = await api.toggleWishlist(productId);
      setUser({ ...user, wishlist: res.wishlist });
      const saved = res.wishlist.includes(productId);
      showToast(saved ? 'Saved to member wishlist' : 'Removed from saved items');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update wishlist');
    }
  }

  function handleOrderCompleted(_order: Order, updatedUser: MemberProfile | null) {
    setCart([]);
    if (updatedUser) {
      setUser(updatedUser);
    }
  }

  function openAuth(mode: 'signin' | 'signup') {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  }

  function openProfile(tab: 'profile' | 'wishlist' | 'orders' = 'profile') {
    setProfileInitialTab(tab);
    setProfileModalOpen(true);
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = products.filter((p) => {
      const matchesCat = activeCategory === 'All' || p.category === activeCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.colorName.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, activeCategory, searchQuery, sortBy]);

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#090B0E] text-[#F3F5F8]">
      {/* Top Bar Contract: Zone 1 Brand — Zone 2 Nav Links — Zone 3 Primary Action */}
      <header className="sticky top-0 z-40 bg-[#090B0E]/92 backdrop-blur-md border-b border-[#1A1F29]">
        <div className="max-w-[1320px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-base font-bold tracking-[0.28em] text-[#F3F5F8] whitespace-nowrap shrink-0"
          >
            REXOBEL
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono-num uppercase tracking-[0.18em] text-[#8892A2]">
            <a
              href="#collection"
              onClick={() => setActiveCategory('All')}
              className="hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
            >
              Collection
            </a>
            <a
              href="#atelier"
              className="hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
            >
              Atelier
            </a>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
            >
              Support
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Bag</span>
              <span className="text-[#19E6FF]">({totalBagCount})</span>
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag (${totalBagCount} items)`}
              className="md:hidden h-10 px-3 inline-flex items-center gap-1.5 border border-[#232A36] rounded-md text-xs font-mono-num text-[#F3F5F8] bg-[#101319] whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#19E6FF]" />
              <span>{totalBagCount}</span>
            </button>

            {authReady && user ? (
              <button
                type="button"
                onClick={() => openProfile('profile')}
                className="h-10 pl-1.5 pr-3.5 inline-flex items-center gap-2.5 bg-[#101319] border border-[#232A36] hover:border-[#19E6FF] rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="xs" />
                <span className="text-xs font-mono-num tracking-[0.06em] text-[#F3F5F8] max-w-[130px] truncate">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="h-10 px-4 inline-flex items-center gap-2 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Section 1: Brutalist Dark Cyber-Tech Hero */}
        <section className="relative overflow-hidden border-b border-[#1A1F29]">
          <div className="absolute inset-0">
            {!brokenImages['hero'] ? (
              <img
                src={HERO_IMAGE}
                alt="REXOBEL technical outerwear editorial campaign in dark brutalist gallery"
                referrerPolicy="no-referrer"
                onError={() => setBrokenImages((prev) => ({ ...prev, hero: true }))}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-[#0D1016]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#090B0E] via-[#090B0E]/82 to-[#090B0E]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090B0E] via-transparent to-[#090B0E]/60" />
          </div>

          <div className="relative max-w-[1320px] mx-auto px-6 py-12 sm:py-20 lg:py-24">
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#252C38]/80 mb-10 sm:mb-14">
              <p className="text-xs font-mono-num tracking-[0.22em] uppercase text-[#19E6FF]">
                SS/26 — Technical System
              </p>
              <p className="text-xs font-mono-num tracking-[0.2em] uppercase text-[#8892A2]">
                Release 01 / 06 Pieces
              </p>
            </div>

            <div className="max-w-2xl space-y-6">
              <h1
                className="font-display font-bold uppercase tracking-tight leading-[0.96] text-[#F3F5F8]"
                style={{ fontSize: 'clamp(2.75rem, 6vw, 5rem)', textWrap: 'balance' }}
              >
                Engineered <br />
                For <span className="text-[#19E6FF]">Motion.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#B6BFCB] leading-relaxed max-w-lg">
                A closed system of six technical garments. Cut for the city, built for weather, released in limited
                runs. Browse the archive, then enquire.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-6">
                <a
                  href="#collection"
                  className="h-12 px-7 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.16em] rounded-xs hover:bg-[#52EEFF] transition-colors inline-flex items-center gap-3 whitespace-nowrap shrink-0"
                >
                  Enter The Collection
                  <ArrowRight className="w-4 h-4" />
                </a>

                {user ? (
                  <button
                    type="button"
                    onClick={() => openProfile('profile')}
                    className="h-12 inline-flex items-center gap-2.5 text-xs font-mono-num uppercase tracking-[0.16em] text-[#A2ACBC] hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Avatar src={user.avatarUrl} name={user.name} size="xs" />
                    <span>Member Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth('signup')}
                    className="h-12 text-xs font-mono-num uppercase tracking-[0.18em] text-[#A2ACBC] hover:text-[#19E6FF] transition-colors whitespace-nowrap shrink-0"
                  >
                    Create Member Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4-Column Technical Specification Strip */}
        <section className="max-w-[1320px] mx-auto px-6 py-6 border-b border-[#1A1F29]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#101319] border border-[#1E2430] rounded-md px-5 py-4">
              <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#8892A2]">Loopback Fleece</p>
              <p className="text-base font-mono-num font-semibold text-[#19E6FF] mt-1">520 GSM</p>
            </div>
            <div className="bg-[#101319] border border-[#1E2430] rounded-md px-5 py-4">
              <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#8892A2]">Italian Gabardine</p>
              <p className="text-base font-mono-num font-semibold text-[#19E6FF] mt-1">100% Virgin Wool</p>
            </div>
            <div className="bg-[#101319] border border-[#1E2430] rounded-md px-5 py-4">
              <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#8892A2]">Complimentary Courier</p>
              <p className="text-base font-mono-num font-semibold text-[#19E6FF] mt-1">Orders $350+</p>
            </div>
            <div className="bg-[#101319] border border-[#1E2430] rounded-md px-5 py-4">
              <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#8892A2]">Atelier Guarantee</p>
              <p className="text-base font-mono-num font-semibold text-[#19E6FF] mt-1">30-Day Returns</p>
            </div>
          </div>
        </section>

        {/* Section 2: Featured Collection Grid */}
        <section id="collection" className="max-w-[1320px] mx-auto px-6 py-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-mono-num tracking-[0.18em] uppercase text-[#19E6FF]">Archive Index</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F3F5F8] tracking-tight mt-1">
                Technical <span className="text-[#19E6FF]">Collection</span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#6E7787] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search garments or fabrics"
                  aria-label="Search garments or fabrics"
                  className="w-full sm:w-64 h-10 pl-10 pr-3.5 text-sm bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] placeholder:text-[#5B6474] focus:outline-none focus:border-[#19E6FF]"
                />
              </div>

              <div className="relative inline-flex items-center">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#19E6FF] absolute left-3 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')}
                  aria-label="Sort garments"
                  className="h-10 pl-8 pr-8 text-sm bg-[#101319] border border-[#232A36] rounded-md text-[#F3F5F8] focus:outline-none focus:border-[#19E6FF]"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#101319] rounded-md border border-[#1E2430] w-fit max-w-full overflow-x-auto mb-8">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`h-9 px-4 text-xs font-mono-num uppercase tracking-[0.1em] rounded-sm transition-colors whitespace-nowrap shrink-0 ${
                  activeCategory === category
                    ? 'bg-[#19E6FF] text-[#090B0E] font-semibold'
                    : 'text-[#8892A2] hover:text-[#F3F5F8]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-[#101319] border border-[#1E2430] rounded-lg p-4 animate-pulse space-y-4">
                  <div className="aspect-[4/3] bg-[#161B24] rounded-md" />
                  <div className="h-4 bg-[#161B24] rounded w-1/2" />
                  <div className="h-5 bg-[#161B24] rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="p-8 bg-[#101319] border border-[#1E2430] rounded-lg text-center space-y-2">
              <p className="text-sm font-medium text-[#F3F5F8]">Unable to load collection</p>
              <p className="text-xs text-[#8892A2]">{productsError}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 bg-[#101319] border border-[#1E2430] rounded-lg text-center space-y-3">
              <p className="text-base font-medium text-[#F3F5F8]">No garments match your filter</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                className="h-10 px-4 text-xs font-mono-num uppercase bg-[#19E6FF] text-[#090B0E] font-semibold rounded-md"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const chosenSize = getSizeForProduct(product);
                const isWishlisted = Boolean(user?.wishlist.includes(product.id));
                const isAdded = addedProductId === product.id;

                return (
                  <article
                    key={product.id}
                    className="group bg-[#101319] border border-[#1E2430] hover:border-[#2F3B4F] rounded-lg overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[4/3] bg-[#161B24] overflow-hidden border-b border-[#1E2430]">
                      <button
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="w-full h-full block text-left focus-visible:outline-2 focus-visible:outline-[#19E6FF]"
                      >
                        {!brokenImages[product.id] ? (
                          <img
                            src={product.image}
                            alt={`${product.name} — ${product.colorName}`}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [product.id]: true }))}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#161B24]">
                            <span className="text-xs font-mono-num text-[#19E6FF]">{product.sku}</span>
                            <span className="text-sm font-medium text-[#F3F5F8] mt-1">{product.name}</span>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleWishlist(product.id)}
                        aria-label={isWishlisted ? `Remove ${product.name} from saved items` : `Save ${product.name}`}
                        className={`absolute top-3 right-3 w-10 h-10 rounded-full inline-flex items-center justify-center border transition-colors ${
                          isWishlisted
                            ? 'bg-[#19E6FF] text-[#090B0E] border-[#19E6FF]'
                            : 'bg-[#090B0E]/80 text-[#F3F5F8] border-[#262E3D] hover:border-[#19E6FF] hover:text-[#19E6FF]'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-mono-num">
                          <span className="text-[#19E6FF] uppercase tracking-[0.06em]">{product.category}</span>
                          <span aria-hidden="true" className="text-[#5B6474]">·</span>
                          <span className="text-[#8892A2]">{product.fabricWeight}</span>
                          <span aria-hidden="true" className="text-[#5B6474]">·</span>
                          <span className="text-[#A2ACBC]">{product.availability}</span>
                        </div>

                        <div className="flex items-baseline justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveProduct(product)}
                            className="text-base font-semibold text-[#F3F5F8] text-left hover:text-[#19E6FF] transition-colors leading-snug"
                          >
                            {product.name}
                          </button>
                          <span className="text-[15px] font-mono-num font-medium text-[#19E6FF] shrink-0">
                            ${product.price}
                          </span>
                        </div>
                        <p className="text-xs text-[#8892A2]">{product.colorName}</p>
                      </div>

                      <div className="pt-3 border-t border-[#1E2430] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSizes((prev) => ({ ...prev, [product.id]: size }))}
                              className={`h-8 min-w-[30px] px-1.5 text-[11px] font-mono-num font-medium rounded-sm border transition-colors ${
                                chosenSize === size
                                  ? 'bg-[#19E6FF] text-[#090B0E] border-[#19E6FF] font-semibold'
                                  : 'bg-[#090B0E] text-[#8892A2] border-[#1E2430] hover:border-[#19E6FF] hover:text-[#F3F5F8]'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToBag(product, chosenSize)}
                          className={`h-9 px-3.5 text-xs font-mono-num uppercase tracking-[0.08em] font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            isAdded
                              ? 'bg-[#F3F5F8] text-[#090B0E]'
                              : 'bg-[#19E6FF] text-[#090B0E] hover:bg-[#52EEFF]'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Added
                            </>
                          ) : (
                            'Add to Bag'
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Craftsmanship & Member Profile Spotlight */}
        <section id="atelier" className="max-w-[1320px] mx-auto px-6 py-12 border-t border-[#1A1F29]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-[#101319] border border-[#1E2430] rounded-lg p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-mono-num tracking-[0.18em] uppercase text-[#19E6FF]">The Atelier</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F3F5F8] tracking-tight" style={{ textWrap: 'balance' }}>
                  Technical textiles engineered for <span className="text-[#19E6FF]">structural drape.</span>
                </h2>
                <p className="text-sm sm:text-base text-[#A2ACBC] leading-relaxed">
                  Every REXOBEL garment begins at partner mills in Biella, Barcelos, and Osaka. We cut numbered
                  capsules with reinforced bar-tack seams, matte anodized hardware, and weather-sealed membranes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#1E2430]">
                <div>
                  <p className="text-sm font-mono-num font-semibold text-[#19E6FF]">01. Biella Weaving</p>
                  <p className="text-xs text-[#8892A2] mt-1.5 leading-relaxed">
                    High-twist virgin wool gabardine treated for natural rain resistance.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono-num font-semibold text-[#19E6FF]">02. Barcelos Knit</p>
                  <p className="text-xs text-[#8892A2] mt-1.5 leading-relaxed">
                    Custom 520gsm organic cotton loopback spun for zero torque twist.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-mono-num font-semibold text-[#19E6FF]">03. Lifetime Care</p>
                  <p className="text-xs text-[#8892A2] mt-1.5 leading-relaxed">
                    Complimentary hardware replacement and seam restoration at our studios.
                  </p>
                </div>
              </div>
            </div>

            {/* Member Profile & Profile Picture Card */}
            <div className="lg:col-span-5 bg-[#0D1016] border border-[#232A36] rounded-lg p-8 sm:p-10 flex flex-col justify-between space-y-6">
              {user ? (
                <>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-mono-num tracking-[0.16em] uppercase text-[#19E6FF]">
                        Member Identity
                      </p>
                      <span className="text-xs font-mono-num text-[#8892A2]">SIZE {user.preferredSize}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <Avatar src={user.avatarUrl} name={user.name} size="xl" />
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold text-[#F3F5F8] truncate">{user.name}</h3>
                        <p className="text-xs font-mono-num text-[#8892A2] truncate">
                          @{user.handle} · {user.email}
                        </p>
                        <button
                          type="button"
                          onClick={() => openProfile('profile')}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-mono-num text-[#19E6FF] underline underline-offset-4 hover:text-[#52EEFF]"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Update Profile Picture
                        </button>
                      </div>
                    </div>

                    {user.bio && <p className="text-sm text-[#A2ACBC] leading-relaxed">{user.bio}</p>}
                  </div>

                  <div className="pt-6 border-t border-[#1E2430] flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openProfile('profile')}
                      className="h-10 px-4 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.1em] rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => openProfile('wishlist')}
                      className="h-10 px-4 bg-[#151922] border border-[#232A36] text-[#F3F5F8] text-xs font-mono-num uppercase rounded-md hover:border-[#19E6FF] transition-colors whitespace-nowrap"
                    >
                      Saved ({user.wishlist.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => openProfile('orders')}
                      className="h-10 px-4 bg-[#151922] border border-[#232A36] text-[#F3F5F8] text-xs font-mono-num uppercase rounded-md hover:border-[#19E6FF] transition-colors whitespace-nowrap"
                    >
                      Orders ({user.orders.length})
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <p className="text-xs font-mono-num tracking-[0.16em] uppercase text-[#19E6FF]">
                      REXOBEL Access
                    </p>
                    <h3 className="text-2xl font-semibold text-[#F3F5F8] tracking-tight" style={{ textWrap: 'balance' }}>
                      Personalize your <span className="text-[#19E6FF]">profile & photo.</span>
                    </h3>
                    <p className="text-sm text-[#A2ACBC] leading-relaxed">
                      Create an account with a custom profile picture to save your preferred garment size, curate your
                      archive wishlist, and speed through express checkout.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-[#1E2430] flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openAuth('signup')}
                      className="h-11 px-5 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors whitespace-nowrap"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth('signin')}
                      className="h-11 px-5 bg-[#151922] border border-[#232A36] text-[#F3F5F8] text-xs font-mono-num uppercase tracking-[0.12em] rounded-md hover:border-[#19E6FF] hover:text-[#19E6FF] transition-colors whitespace-nowrap"
                    >
                      Sign In
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Section 4: Quiet Footer */}
      <footer className="border-t border-[#1A1F29] bg-[#090B0E]">
        <div className="max-w-[1320px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-sm font-bold tracking-[0.24em] text-[#F3F5F8]">REXOBEL</span>
            <span className="text-xs font-mono-num text-[#19E6FF]">REXOBEL.com · LONDON · MILAN · OSAKA</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-mono-num text-[#8892A2]">
            <a href="#collection" className="hover:text-[#19E6FF] transition-colors">
              COLLECTION
            </a>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="hover:text-[#19E6FF] transition-colors"
            >
              SUPPORT
            </button>
            <a href="tel:+971589855251" className="text-[#19E6FF] hover:text-[#52EEFF] transition-colors">
              +971 58 985 5251
            </a>
            <button
              type="button"
              onClick={() => (user ? openProfile('profile') : openAuth('signin'))}
              className="hover:text-[#19E6FF] transition-colors"
            >
              {user ? 'MEMBER PROFILE' : 'SIGN IN'}
            </button>
            <button type="button" onClick={() => setCartOpen(true)} className="hover:text-[#19E6FF] transition-colors">
              BAG ({totalBagCount})
            </button>
            <span>© {new Date().getFullYear()} REXOBEL ATELIER</span>
          </div>
        </div>
      </footer>

      {/* Subtle Action Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-[#101319] text-[#19E6FF] text-xs font-mono-num rounded-md shadow-xl border border-[#19E6FF]/50"
        >
          {toastMessage}
        </div>
      )}

      {/* Modals & Drawers */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
          showToast(`Welcome back, ${authenticatedUser.name}`);
        }}
      />

      {user && (
        <ProfileModal
          isOpen={profileModalOpen}
          user={user}
          products={products}
          initialTab={profileInitialTab}
          onClose={() => setProfileModalOpen(false)}
          onUserUpdated={(updated) => setUser(updated)}
          onSignedOut={() => {
            setUser(null);
            showToast('Signed out of REXOBEL');
          }}
          onAddToBag={handleAddToBag}
          onOpenSupport={() => setSupportOpen(true)}
        />
      )}

      <ProductModal
        product={activeProduct}
        defaultSize={user?.preferredSize}
        isWishlisted={Boolean(activeProduct && user?.wishlist.includes(activeProduct.id))}
        onClose={() => setActiveProduct(null)}
        onAddToBag={handleAddToBag}
        onToggleWishlist={handleToggleWishlist}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cart}
        user={user}
        onClose={() => setCartOpen(false)}
        onRequireAuth={(mode) => openAuth(mode)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onOrderCompleted={handleOrderCompleted}
      />

      <SupportModal
        isOpen={supportOpen}
        user={user}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}
