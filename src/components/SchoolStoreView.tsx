import React, { useState, useMemo } from 'react';
import { School, UniformItem } from '../types';
import { UNIFORM_ITEMS } from '../data/products';

interface SchoolStoreViewProps {
  activeSchool: School;
  onOpenSchoolModal: () => void;
  onSelectProduct: (product: UniformItem, selectedSize: string) => void;
  onAddToCart: (item: UniformItem, size: string, quantity?: number) => void;
  onOpenSizeGuide: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SchoolStoreView: React.FC<SchoolStoreViewProps> = ({
  activeSchool,
  onOpenSchoolModal,
  onSelectProduct,
  onAddToCart,
  onOpenSizeGuide,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    'dps-shirt-boys': '32',
    'dps-skirt-girls': '26',
    'dps-trousers-navy': '30',
    'dps-blazer-crest': '36',
    'dps-tie-belt-combo': 'Standard One Size',
    'dps-tracksuit-set': 'M',
  });
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'boys', label: 'Boys' },
    { id: 'girls', label: 'Girls' },
    { id: 'shirts', label: 'Shirts' },
    { id: 'trousers', label: 'Trousers' },
    { id: 'skirts', label: 'Skirts' },
    { id: 'blazers', label: 'Blazers' },
    { id: 'accessories', label: 'Ties & Belts' },
    { id: 'socks', label: 'Socks' },
    { id: 'sweaters', label: 'Sweaters' },
    { id: 'shoes', label: 'Shoes' },
  ];

  const filteredProducts = useMemo(() => {
    // Filter items specific to this active school (each school has 3 authorized products)
    const schoolSpecificItems = UNIFORM_ITEMS.filter((item) => item.schoolId === activeSchool.id);
    const baseItems = schoolSpecificItems.length > 0 ? schoolSpecificItems : UNIFORM_ITEMS.slice(0, 3);

    return baseItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'boys' && item.category !== 'boys' && item.category !== 'shirts' && item.category !== 'trousers') return false;
        if (selectedCategory === 'girls' && item.category !== 'girls' && item.category !== 'skirts') return false;
        if (selectedCategory === 'shirts' && item.category !== 'shirts') return false;
        if (selectedCategory === 'trousers' && item.category !== 'trousers') return false;
        if (selectedCategory === 'skirts' && item.category !== 'skirts') return false;
        if (selectedCategory === 'blazers' && item.category !== 'blazers') return false;
        if (selectedCategory === 'accessories' && item.category !== 'accessories') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.categoryLabel.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.originalPrice - a.originalPrice;
      return 0; // recommended
    });
  }, [activeSchool.id, selectedCategory, searchQuery, sortBy]);

  const handleSizeSelect = (itemId: string, size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSizes((prev) => ({ ...prev, [itemId]: size }));
  };

  const handleToggleWishlist = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuickAdd = (item: UniformItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const size = selectedSizes[item.id] || item.defaultSize;
    onAddToCart(item, size, 1);

    // Feedback animation
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* School Store Institutional Header Banner */}
      <section className="w-full bg-surface-container-low px-4 py-3.5 shadow-xs border-b border-surface-container/50">
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* School Crest / Shield */}
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-gradient-to-tr from-secondary to-transparent"></div>
              <span
                className="material-symbols-outlined text-secondary-fixed text-2xl font-bold"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {activeSchool.iconName || 'local_library'}
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-[18px] sm:text-[20px] font-bold text-on-surface tracking-tight truncate leading-tight">
                  {activeSchool.name}
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] uppercase font-bold tracking-wide">
                  {activeSchool.board}
                </span>
              </div>
              <p className="text-[12px] text-on-surface-variant truncate">
                Official school uniform collection
              </p>
              <div className="flex items-center gap-1 mt-0.5 text-secondary">
                <span className="material-symbols-outlined text-xs">location_on</span>
                <span className="text-[11px] font-semibold text-secondary truncate">
                  {activeSchool.city}, {activeSchool.state}
                </span>
              </div>
            </div>
          </div>

          {/* Change School Button */}
          <button
            onClick={onOpenSchoolModal}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs active:scale-95 transition-all hover:bg-surface-container-high border border-surface-container"
          >
            <span className="material-symbols-outlined text-sm text-secondary font-bold">
              swap_horiz
            </span>
            <span className="text-[11px] font-bold tracking-tight">Change</span>
          </button>
        </div>

        {/* Verification Sub-Bar */}
        <div className="max-w-2xl mx-auto mt-2.5 pt-2 flex items-center justify-between gap-2 bg-surface-container-lowest px-3 py-2 rounded-lg shadow-xs border border-surface-container/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="material-symbols-outlined text-secondary text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-[12px] text-on-surface truncate font-semibold">
              Authorized Magnum Partner Store
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-bold text-on-secondary-container bg-secondary-container/40 px-2 py-0.5 rounded-full">
            {activeSchool.approvedYear}
          </span>
        </div>
      </section>

      <div className="max-w-2xl mx-auto w-full">
        {/* Scoped Search & Filter Bar */}
        <section className="w-full px-4 pt-3.5 pb-2 bg-surface sticky top-16 z-30 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          {/* Search Field */}
          <div className="relative w-full mb-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search uniforms for ${activeSchool.name.replace(' - ', ' ')}...`}
              className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest rounded-xl text-[14px] text-on-surface placeholder:text-outline shadow-xs border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>

          {/* Filter & Sort Action Strip */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSizeGuide}
                className="h-8 px-2.5 bg-surface-container-lowest rounded-lg shadow-xs border border-surface-container flex items-center gap-1 text-on-surface text-[11px] font-semibold active:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-xs text-secondary font-bold">
                  tune
                </span>
                <span>Filters</span>
                <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] flex items-center justify-center font-bold">
                  3
                </span>
              </button>

              <button
                onClick={onOpenSizeGuide}
                className="h-8 px-2.5 bg-surface-container-lowest rounded-lg shadow-xs border border-surface-container flex items-center gap-1 text-on-surface text-[11px] font-semibold active:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-xs">
                  straighten
                </span>
                <span>Size</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <label
                htmlFor="sortSelector"
                className="text-[10px] text-outline uppercase font-bold"
              >
                Sort:
              </label>
              <select
                id="sortSelector"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 bg-surface-container-lowest rounded-lg shadow-xs border border-surface-container px-2 text-on-surface text-[11px] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Ordered</option>
              </select>
            </div>
          </div>
        </section>

        {/* Horizontally Scrolling Category Pills */}
        <section className="w-full pt-1 pb-3 bg-surface overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-4 min-w-max">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container border border-surface-container/60'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Approved Mandatory Kit Notice */}
        <section className="px-4 mb-3">
          <div className="bg-surface-container-lowest rounded-xl p-3 shadow-xs border border-surface-container flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-base">
                  checklist
                </span>
              </span>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] font-bold text-on-surface truncate leading-tight">
                  Class I-X Mandatory Kit
                </p>
                <p className="text-[11px] text-outline truncate">
                  Includes 2 regular sets + 1 house uniform
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const shirt = UNIFORM_ITEMS[0];
                const skirt = UNIFORM_ITEMS[1];
                onAddToCart(shirt, '32', 2);
                onAddToCart(skirt, '26', 1);
              }}
              className="shrink-0 px-2.5 py-1.5 bg-primary text-on-primary rounded text-[11px] font-bold shadow-xs active:scale-95 transition-transform"
            >
              View Bundle
            </button>
          </div>
        </section>

        {/* 2-Column Responsive Product Grid */}
        <section className="px-4 pb-8">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center bg-surface-container-lowest rounded-xl border border-surface-container">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">
                search_off
              </span>
              <h3 className="text-[16px] font-bold text-primary">
                No matching uniforms found
              </h3>
              <p className="text-[12px] text-on-surface-variant mt-1">
                Try clearing your search or category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-lg text-[12px] font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((item) => {
                const activeSize =
                  selectedSizes[item.id] || item.defaultSize;
                const isWishlisted = wishlist[item.id] || false;
                const isAdded = addedItems[item.id] || false;

                return (
                  <article
                    key={item.id}
                    onClick={() => onSelectProduct(item, activeSize)}
                    className="flex flex-col bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container/70 overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* Media Container */}
                    <div className="relative w-full aspect-[4/5] bg-surface-container overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={item.image}
                        alt={item.altText}
                        loading="lazy"
                      />

                      {/* Badge */}
                      {item.badge && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-primary text-on-primary text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          <span>{item.badge}</span>
                        </div>
                      )}

                      {/* Stock Indicator */}
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-surface-container-lowest/90 backdrop-blur-xs text-secondary text-[10px] font-bold shadow-xs">
                        In Stock
                      </div>

                      {/* Wishlist Toggle */}
                      <button
                        onClick={(e) => handleToggleWishlist(item.id, e)}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-surface-container-lowest/90 backdrop-blur-xs flex items-center justify-center active:scale-90 transition-transform ${
                          isWishlisted ? 'text-error' : 'text-outline hover:text-error'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-sm"
                          style={
                            isWishlisted
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          favorite
                        </span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] text-outline uppercase font-semibold">
                          {item.categoryLabel}
                        </span>
                        <h2 className="text-[13px] font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-secondary transition-colors">
                          {item.name}
                        </h2>
                      </div>

                      {/* Size Selection Matrix */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-outline uppercase font-semibold">
                            Size:
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSizeGuide();
                            }}
                            className="text-[10px] font-bold text-secondary cursor-pointer hover:underline"
                          >
                            Guide
                          </button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.availableSizes.slice(0, 5).map((size) => {
                            const isSelected = activeSize === size;
                            return (
                              <button
                                key={size}
                                onClick={(e) => handleSizeSelect(item.id, size, e)}
                                className={`size-chip px-1.5 min-w-[24px] h-6 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-primary text-on-primary shadow-xs'
                                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="pt-1 mt-0.5 flex items-center justify-between gap-1 border-t border-surface-container/50">
                        <div>
                          <span className="text-[15px] font-extrabold text-on-surface">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          {item.originalPrice > item.price && (
                            <span className="block text-[9px] text-outline line-through">
                              ₹{item.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleQuickAdd(item, e)}
                          className="h-8 px-2.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all hover:bg-primary-container"
                        >
                          {isAdded ? (
                            <>
                              <span className="material-symbols-outlined text-xs text-secondary">
                                check
                              </span>
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-xs text-secondary">
                                add_shopping_cart
                              </span>
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Trust & Assurance Badges Footer Section */}
          <div className="mt-6 pt-4 grid grid-cols-3 gap-2">
            <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-xs border border-surface-container flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-secondary text-xl mb-1">
                verified_user
              </span>
              <span className="text-[10px] font-bold text-on-surface leading-tight">
                100% Authorized
              </span>
              <span className="text-[9px] text-outline mt-0.5">
                School Verified Pattern
              </span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-xs border border-surface-container flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-secondary text-xl mb-1">
                sync_alt
              </span>
              <span className="text-[10px] font-bold text-on-surface leading-tight">
                Easy Size Swap
              </span>
              <span className="text-[9px] text-outline mt-0.5">
                7-Day Free Replacement
              </span>
            </div>
            <div className="bg-surface-container-lowest p-2.5 rounded-xl shadow-xs border border-surface-container flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-secondary text-xl mb-1">
                inventory_2
              </span>
              <span className="text-[10px] font-bold text-on-surface leading-tight">
                Direct School Drop
              </span>
              <span className="text-[9px] text-outline mt-0.5">
                Campus Desk Pickup
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
