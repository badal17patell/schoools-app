import React from 'react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
  title: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full flex flex-col items-center animate-in zoom-in-95 duration-150"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-2 max-h-[80vh] flex flex-col items-center">
          <img
            src={imageUrl}
            alt={altText}
            className="w-auto max-h-[70vh] object-contain rounded-xl"
          />
          <div className="py-2 px-3 text-center">
            <h4 className="text-[14px] font-bold text-gray-900">{title}</h4>
            <p className="text-[11px] text-gray-500">
              Institutional Certified Fabric • High-Density Embroidery Crest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
