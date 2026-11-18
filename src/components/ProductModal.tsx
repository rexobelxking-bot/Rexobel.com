import { Bookmark, Check, ShieldCheck, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { GarmentSize, Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  defaultSize?: GarmentSize;
  isWishlisted: boolean;
  onClose: () => void;
  onAddToBag: (product: Product, size: GarmentSize) => void;
  onToggleWishlist: (productId: string) => void;
}

export function ProductModal({
  product,
  defaultSize,
  isWishlisted,
  onClose,
  onAddToBag,
  onToggleWishlist,
}: ProductModalProps) {
  const [selectedSize, setSelectedSize] = useState<GarmentSize>('M');
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (defaultSize && product.sizes.includes(defaultSize)) {
      setSelectedSize(defaultSize);
    } else {
      setSelectedSize(product.sizes[0]);
    }
    setAddedFeedback(false);
  }, [product, defaultSize]);

  if (!product) return null;

  function handleAdd() {
    if (!product) return;
    onAddToBag(product, selectedSize);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#101319] border border-[#232A36] rounded-lg shadow-2xl overflow-hidden my-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close garment details"
          className="absolute top-4 right-4 z-10 w-10 h-10 inline-flex items-center justify-center rounded-md bg-[#090B0E]/85 border border-[#232A36] text-[#F3F5F8] hover:border-[#19E6FF] hover:text-[#19E6FF] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="bg-[#151922] relative min-h-[320px] lg:min-h-[500px] border-b lg:border-b-0 lg:border-r border-[#1E2430]">
            <img
              src={product.image}
              alt={`${product.name} in ${product.colorName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono-num uppercase tracking-[0.1em]">
                <span className="text-[#19E6FF]">{product.category}</span>
                <span aria-hidden="true" className="text-[#5B6474]">·</span>
                <span className="text-[#8892A2]">{product.sku}</span>
                <span aria-hidden="true" className="text-[#5B6474]">·</span>
                <span className="text-[#A2ACBC]">{product.availability}</span>
              </div>

              <div>
                <h2 id="pdp-modal-title" className="text-2xl font-semibold text-[#F3F5F8] tracking-tight">
                  {product.name}
                </h2>
                <p className="text-xl font-mono-num font-medium text-[#19E6FF] mt-1.5">${product.price}</p>
              </div>

              <p className="text-sm text-[#A2ACBC] leading-relaxed">{product.description}</p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1E2430] text-xs">
                <div>
                  <span className="text-[#6E7787] block">Colorway</span>
                  <span className="text-[#F3F5F8] font-medium">{product.colorName}</span>
                </div>
                <div>
                  <span className="text-[#6E7787] block">Fabric Weight</span>
                  <span className="text-[#19E6FF] font-medium font-mono-num">{product.fabricWeight}</span>
                </div>
                <div>
                  <span className="text-[#6E7787] block">Silhouette</span>
                  <span className="text-[#F3F5F8] font-medium">{product.fit}</span>
                </div>
                <div>
                  <span className="text-[#6E7787] block">Provenance</span>
                  <span className="text-[#F3F5F8] font-medium">{product.origin}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#F3F5F8]">Select Size</span>
                  <span className="text-xs text-[#8892A2]">{product.composition}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[48px] px-3 text-xs font-mono-num font-medium rounded-md border transition-colors ${
                        selectedSize === size
                          ? 'bg-[#19E6FF] text-[#090B0E] border-[#19E6FF] font-semibold'
                          : 'bg-[#090B0E] text-[#A2ACBC] border-[#232A36] hover:border-[#19E6FF] hover:text-[#F3F5F8]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E2430]">
                <p className="text-xs font-mono-num uppercase tracking-[0.1em] text-[#A2ACBC] mb-1.5">Garment Care</p>
                <p className="text-xs text-[#8892A2] leading-relaxed">{product.care.join(' · ')}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 h-11 px-5 bg-[#19E6FF] text-[#090B0E] text-xs font-mono-num font-semibold uppercase tracking-[0.12em] rounded-md hover:bg-[#52EEFF] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {addedFeedback ? (
                    <>
                      <Check className="w-4 h-4" />
                      ADDED TO BAG
                    </>
                  ) : (
                    `ADD TO BAG — $${product.price}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  aria-label={isWishlisted ? 'Remove from saved items' : 'Save item'}
                  className={`h-11 w-11 inline-flex items-center justify-center rounded-md border transition-colors shrink-0 ${
                    isWishlisted
                      ? 'bg-[#19E6FF] text-[#090B0E] border-[#19E6FF]'
                      : 'bg-[#090B0E] text-[#A2ACBC] border-[#232A36] hover:border-[#19E6FF] hover:text-[#19E6FF]'
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8892A2]">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#19E6FF]" />
                  Complimentary shipping over $350
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#19E6FF]" />
                  30-day atelier returns
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
