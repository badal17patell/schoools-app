import React, { useState } from 'react';
import { UniformItem, School } from '../types';
import { ImageLightboxModal } from './ImageLightboxModal';

interface ProductDetailsViewProps {
  product: UniformItem;
  initialSize?: string;
  activeSchool: School;
  onBack: () => void;
  onAddToCart: (item: UniformItem, size: string, quantity?: number) => void;
  onBuyNow: (item: UniformItem, size: string) => void;
  onOpenSizeGuide: () => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  initialSize,
  activeSchool,
  onBack,
  onAddToCart,
  onBuyNow,
  onOpenSizeGuide,
}) => {
  const [selectedSize, setSelectedSize] = useState(
    initialSize || product.defaultSize
  );
  const [pinCode, setPinCode] = useState('411028');
  const [checkedPin, setCheckedPin] = useState(true);
  const [activeThumb, setActiveThumb] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Gallery images using authentic product images
  const galleryImages = [
    product.image,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAE-5zSC_xmc60ESiJsfMmwxhMB_h2GQ4thPC3z-5JoHiXge3J9cqvIWTmkkg2-jpWks93t0P4mwRlRZEEHST-71S56LambXp1RW1-imejfY05admnhAU3Nt9TqqieX0-wU2iTVvq5KkEX0RwdSglDMaOmKV1keEjtNcrYgoMVeb4i8vk4kfP4jctUqX8N_31o2TSqRMFt-D_-VVItv_UYjNESOV56JHnQR0rXHIAwOzOmL1dP2Wz9qdg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC743Kve81Jymp9LLz-G5oydfuv_G_Mtter3pHrP7KO0WPyIUmM3Lhc-OYQeGECeVcVnp8KrNjcjQVYsztGFhLvZ0dDi8k4Zr7PcLYUKpiXOfRVLaYFitJvEw4-cZv9_DpZGE7z2QCtKMpwbVUuarWlRw1INDsGGhRACQb9oF2MuzDGVOzdRZdIa3GUcRB2lIwDl9Q2WPmRn5rxf71oTMQvaZrLUag1y_p0RxkLZyFUXNtQ6a-BSeiB0Q',
  ];

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Product Details Header */}
      <div className="px-4 py-2.5 bg-surface-container-lowest shadow-xs border-b border-surface-container flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-primary hover:text-secondary font-bold text-[14px]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
          <span>School Store</span>
        </button>
        <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low px-2 py-0.5 rounded">
          Product Details
        </span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-3 flex flex-col gap-4">
        {/* School Context Bar */}
        <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container/60 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-secondary-fixed text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-bold text-primary truncate">
                {activeSchool.name}
              </h2>
              <p className="text-[11px] text-on-surface-variant truncate">
                Official Uniform Partner • {activeSchool.board} Affiliated
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-bold text-on-secondary-container bg-secondary-container/30 px-2 py-0.5 rounded-full uppercase">
            Authorized Spec
          </span>
        </div>

        {/* Main Product Showcase Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container/80 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
                Original Pattern
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-semibold">
                Wrinkle-Free Blend
              </span>
            </div>
            <span className="text-[10px] text-secondary font-bold px-2 py-0.5 bg-secondary-fixed/30 rounded-full">
              {product.fabricBlend || '65% Cotton • 35% Poly'}
            </span>
          </div>

          {/* Main Visual Frame */}
          <div
            onClick={() => setIsLightboxOpen(true)}
            className="relative w-full aspect-[4/5] max-w-sm rounded-xl overflow-hidden bg-surface-container-low shadow-inner cursor-zoom-in group"
          >
            <img
              src={galleryImages[activeThumb]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              title="Inspect tailoring detail"
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-xs flex items-center justify-center shadow-xs text-on-surface hover:text-secondary"
            >
              <span className="material-symbols-outlined text-base">
                zoom_in
              </span>
            </button>
          </div>

          {/* Thumbnails Strip */}
          <div className="flex items-center gap-2 mt-3">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveThumb(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  activeThumb === idx
                    ? 'border-secondary shadow-xs scale-105'
                    : 'border-surface-container opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Meta & Pricing */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-outline uppercase font-semibold">
              OFFICIAL UNIFORMS • BOYS GRADE 1–10
            </span>
            <span className="text-[11px] font-bold text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">bolt</span>
              Dispatches in 24 hrs
            </span>
          </div>

          <h1 className="text-[20px] sm:text-[22px] font-bold text-primary leading-tight">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-[24px] font-extrabold text-primary">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span className="text-[12px] text-outline">
              MRP (Incl. of all taxes)
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[13px] text-outline line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[12px] text-on-surface-variant pt-1 border-t border-surface-container/50">
            <span className="flex items-center gap-1 text-secondary font-bold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Ready in Stock
            </span>
            <span>•</span>
            <span>Standard Fit as per DPS Pune Guidelines</span>
          </div>
        </div>

        {/* Size Selection Section */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-primary">
                Select Size
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Chest measurement in inches
              </p>
            </div>
            <button
              onClick={onOpenSizeGuide}
              className="flex items-center gap-1 text-[12px] font-bold text-secondary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">
                straighten
              </span>
              <span>Size Guide</span>
            </button>
          </div>

          {/* Size Chips */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {product.availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-11 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-sm border-2 border-secondary'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border border-surface-container'
                  }`}
                >
                  <span>{size}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-xs text-secondary-fixed">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-base">
                info
              </span>
              <span>
                Selected: <strong>Size {selectedSize}</strong> (Approx. Age
                10-12 yrs, Chest {selectedSize}")
              </span>
            </div>
            <span className="text-secondary font-bold text-[11px] shrink-0">
              In Stock
            </span>
          </div>
        </div>

        {/* PIN Code Delivery Checker */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">
                local_shipping
              </span>
              <h3 className="text-[13px] font-bold text-primary">
                Delivery & Pickup Options
              </h3>
            </div>
            <span className="text-[10px] text-secondary font-bold uppercase bg-secondary-fixed/30 px-2 py-0.5 rounded">
              Express Available
            </span>
          </div>

          <p className="text-[11px] text-on-surface-variant">
            Enter school district PIN code for accurate shipping time
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="e.g. 411028"
              maxLength={6}
              className="flex-1 h-10 px-3 bg-surface-container-low rounded-lg text-[13px] font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <button
              onClick={() => setCheckedPin(true)}
              className="h-10 px-4 bg-primary text-on-primary rounded-lg text-[12px] font-bold shadow-xs hover:bg-primary-container"
            >
              Check
            </button>
          </div>

          {checkedPin && (
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mt-1">
              <span className="material-symbols-outlined text-secondary text-sm">
                check_circle
              </span>
              <span>
                Delivering to <strong>Pune, {pinCode}</strong>: Guaranteed delivery by{' '}
                <strong className="text-primary">Friday, 2 PM</strong>
              </span>
            </div>
          )}
        </div>

        {/* Fabric Performance & Tailoring (2x2 Grid) */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-primary">
            Fabric Performance & Tailoring
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
              <span className="material-symbols-outlined text-secondary text-xl">
                air
              </span>
              <span className="text-[12px] font-bold text-primary">
                Breathable Weave
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                Air-permeable long-staple cotton keeps students cool across Pune
                weather shifts.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
              <span className="material-symbols-outlined text-secondary text-xl">
                shield
              </span>
              <span className="text-[12px] font-bold text-primary">
                Reinforced Stitches
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                Double-needle hem and bar-tacked stress points resist playground
                wear.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
              <span className="material-symbols-outlined text-secondary text-xl">
                wash
              </span>
              <span className="text-[12px] font-bold text-primary">
                100+ Washes
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                Fade-resistant optical white dye certified against school-year
                wash cycles.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
              <span className="material-symbols-outlined text-secondary text-xl">
                iron
              </span>
              <span className="text-[12px] font-bold text-primary">
                Easy-Iron Fabric
              </span>
              <span className="text-[10px] text-on-surface-variant leading-tight">
                Wrinkle-rebound finish minimizes morning uniform prep time for
                parents.
              </span>
            </div>
          </div>
        </div>

        {/* Magnum Institutional Guarantee Box */}
        <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 border border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">
                workspace_premium
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-primary">
                Magnum Institutional Guarantee
              </span>
              <span className="text-[11px] text-on-surface-variant">
                100% compliant with Delhi Public School dress code and emblem
                specs.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container/60 text-[11px] text-on-surface font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">
                published_with_changes
              </span>
              <span>7-Day Hassle-Free Size Exchange</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">
                verified
              </span>
              <span>School-Inspected Batch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buying Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border-t border-surface-container">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[20px] font-extrabold text-primary leading-tight">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-secondary font-bold">
              Size: {selectedSize}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <button
              onClick={() => onAddToCart(product, selectedSize, 1)}
              className="flex-1 h-12 bg-surface-container text-primary rounded-lg text-[13px] font-bold flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-secondary">
                shopping_bag
              </span>
              <span>Add to Cart</span>
            </button>

            <button
              onClick={() => onBuyNow(product, selectedSize)}
              className="flex-1 h-12 bg-primary text-on-primary rounded-lg text-[13px] font-bold flex items-center justify-center gap-1 shadow-md hover:bg-primary-container transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base text-secondary-fixed">
                bolt
              </span>
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={galleryImages[activeThumb]}
        altText={product.name}
        title={product.name}
      />
    </div>
  );
};
