import React, { useState, useEffect, useCallback } from 'react';
import { ManagedProduct, ProductImage, ProductSizeInventory, School } from '../../types';
import { SCHOOLS } from '../../data/schools';
import { uploadProductImageToStorage } from '../../services/dbService';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: ManagedProduct | null;
  activeSchool: School;
  onSave: (product: Partial<ManagedProduct>) => Promise<void>;
  onShowToast: (msg: string) => void;
  userEmail?: string;
}

const CATEGORIES = [
  { id: 'shirts', label: 'Shirts & Tops' },
  { id: 'trousers', label: 'Trousers & Bottoms' },
  { id: 'skirts', label: 'Skirts & Pinafores' },
  { id: 'blazers', label: 'Blazers & Crest Jackets' },
  { id: 'sweaters', label: 'Sweaters & Knitwear' },
  { id: 'ties', label: 'Ties & Belts' },
  { id: 'socks', label: 'Socks & Hosiery' },
  { id: 'shoes', label: 'Shoes & Footwear' },
  { id: 'accessories', label: 'Accessories & Kits' },
];

const STANDARD_APPAREL_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
const JUNIOR_SIZES = ['22', '24', '26', '28', '30'];
const SHOE_SIZES = ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  activeSchool,
  onSave,
  onShowToast,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'sizes' | 'images' | 'preview'>('info');

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(activeSchool.id);
  const [category, setCategory] = useState('shirts');
  const [subcategory, setSubcategory] = useState('Uniform Apparel');
  const [gender, setGender] = useState<'boys' | 'girls' | 'unisex'>('unisex');
  const [ageGroup, setAgeGroup] = useState('All Grades');
  const [season, setSeason] = useState('All Season');
  const [description, setDescription] = useState('');
  const [fabricBlend, setFabricBlend] = useState('65% Poly / 35% Combed Cotton, Easy-Iron');
  const [badge, setBadge] = useState('Pattern Approved');
  const [badgeType, setBadgeType] = useState<ManagedProduct['badgeType']>('pattern');

  // Pricing
  const [price, setPrice] = useState<number>(850);
  const [mrp, setMrp] = useState<number>(999);
  const [status, setStatus] = useState<ManagedProduct['status']>('active');

  // Sizes & Inventory
  const [sizes, setSizes] = useState<ProductSizeInventory[]>([
    { size: '28', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
    { size: '30', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
    { size: '32', stock: 60, reserved: 0, sold: 0, lowStockThreshold: 15 },
    { size: '34', stock: 55, reserved: 0, sold: 0, lowStockThreshold: 15 },
    { size: '36', stock: 40, reserved: 0, sold: 0, lowStockThreshold: 15 },
  ]);
  const [newCustomSize, setNewCustomSize] = useState('');

  // Media
  const [images, setImages] = useState<ProductImage[]>([
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPegsFvU5D5TQEr4WgomJcXTDUytvt7GJugPTreh_rTtEsBjjs59JfhFA6J2z5ZMcTEbF8ya16fB3XkDWUfx0IgAPugg33DIoH7HqFXy4SPI0FvAcK3gNt3Jdfh_cFsYWilzYk-tKbyVSOEFVJ2Yt6qcIuticFN-_aMZDF484bPT3PWt3tYUS0C35SUbMiiJ6IXTHcWSGMsVcygNmfw6vJVLu7_Vg5FnR4ni67FXue9ZXYenBr6PudXg',
      isPrimary: true,
      name: 'Default Specification Front',
    },
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const generateSku = useCallback((schoolId: string, cat: string) => {
    const sCode = (schoolId || 'SCH').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    const cCode = (cat || 'UNI').slice(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    const autoSku = `${sCode}_${cCode}_${rand}`;
    setSku(autoSku);
    return autoSku;
  }, []);

  // Initialize or populate when productToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setSelectedSchoolId(productToEdit.schoolId || activeSchool.id);
      setCategory(productToEdit.category || 'shirts');
      setSubcategory(productToEdit.subcategory || 'Uniform Apparel');
      setGender(productToEdit.gender || 'unisex');
      setAgeGroup(productToEdit.ageGroup || 'All Grades');
      setSeason(productToEdit.season || 'All Season');
      setDescription(productToEdit.description || '');
      setFabricBlend(productToEdit.fabricBlend || 'Poly-Cotton Blend');
      setBadge(productToEdit.badge || '');
      setBadgeType(productToEdit.badgeType || 'pattern');
      setPrice(productToEdit.price !== undefined ? productToEdit.price : 850);
      setMrp(
        productToEdit.mrp !== undefined
          ? productToEdit.mrp
          : Math.round((productToEdit.price || 850) * 1.18)
      );
      setStatus(productToEdit.status || 'active');
      setSizes(
        productToEdit.sizes && productToEdit.sizes.length > 0
          ? productToEdit.sizes
          : [
              { size: '28', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
              { size: '30', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
              { size: '32', stock: 60, reserved: 0, sold: 0, lowStockThreshold: 15 },
            ]
      );
      setImages(
        productToEdit.images && productToEdit.images.length > 0
          ? productToEdit.images
          : [
              {
                url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPegsFvU5D5TQEr4WgomJcXTDUytvt7GJugPTreh_rTtEsBjjs59JfhFA6J2z5ZMcTEbF8ya16fB3XkDWUfx0IgAPugg33DIoH7HqFXy4SPI0FvAcK3gNt3Jdfh_cFsYWilzYk-tKbyVSOEFVJ2Yt6qcIuticFN-_aMZDF484bPT3PWt3tYUS0C35SUbMiiJ6IXTHcWSGMsVcygNmfw6vJVLu7_Vg5FnR4ni67FXue9ZXYenBr6PudXg',
                isPrimary: true,
              },
            ]
      );
    } else {
      // Reset form for fresh SKU
      const initialSchool = activeSchool.id;
      setSelectedSchoolId(initialSchool);
      setName('');
      generateSku(initialSchool, 'shirts');
      setCategory('shirts');
      setSubcategory('Uniform Apparel');
      setGender('unisex');
      setAgeGroup('All Grades');
      setSeason('All Season');
      setDescription('');
      setFabricBlend('65% Poly / 35% Combed Cotton, Easy-Iron');
      setBadge('Pattern Approved');
      setBadgeType('pattern');
      setPrice(850);
      setMrp(999);
      setStatus('active');
      setSizes([
        { size: '28', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
        { size: '30', stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
        { size: '32', stock: 60, reserved: 0, sold: 0, lowStockThreshold: 15 },
        { size: '34', stock: 55, reserved: 0, sold: 0, lowStockThreshold: 15 },
        { size: '36', stock: 40, reserved: 0, sold: 0, lowStockThreshold: 15 },
      ]);
    }
  }, [productToEdit, activeSchool.id, isOpen, generateSku]);

  const handleApplyPresetSizes = (preset: 'standard' | 'junior' | 'shoes' | 'onesize') => {
    let sizeList: string[] = [];
    if (preset === 'standard') sizeList = STANDARD_APPAREL_SIZES;
    else if (preset === 'junior') sizeList = JUNIOR_SIZES;
    else if (preset === 'shoes') sizeList = SHOE_SIZES;
    else sizeList = ['Standard / One Size'];

    setSizes(
      sizeList.map((sz) => ({
        size: sz,
        stock: 50,
        reserved: 0,
        sold: 0,
        lowStockThreshold: 15,
      }))
    );
    onShowToast(`Applied ${preset} size preset`);
  };

  const handleAddCustomSize = () => {
    if (!newCustomSize.trim()) return;
    const clean = newCustomSize.trim().toUpperCase();
    if (sizes.some((s) => s.size.toUpperCase() === clean)) {
      onShowToast('Size already exists');
      return;
    }
    setSizes((prev) => [
      ...prev,
      { size: clean, stock: 50, reserved: 0, sold: 0, lowStockThreshold: 15 },
    ]);
    setNewCustomSize('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    if (sizes.length <= 1) {
      onShowToast('At least one size is required');
      return;
    }
    setSizes((prev) => prev.filter((s) => s.size !== sizeToRemove));
  };

  const handleUpdateSizeStock = (sizeName: string, field: 'stock' | 'lowStockThreshold', val: number) => {
    setSizes((prev) =>
      prev.map((s) => (s.size === sizeName ? { ...s, [field]: Math.max(0, val) } : s))
    );
  };

  // Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const tempProdId = productToEdit?.id || `new_prod_${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await uploadProductImageToStorage(file, tempProdId, (p) => {
          setUploadProgress(p);
        });

        setImages((prev) => [
          ...prev,
          {
            url: res.url,
            storagePath: res.storagePath,
            isPrimary: prev.length === 0,
            name: file.name,
          },
        ]);
        onShowToast(`Uploaded ${file.name}`);
      } catch (err) {
        console.error('Upload failed:', err);
        onShowToast('Failed to upload image file');
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: imageUrlInput.trim(),
        isPrimary: prev.length === 0,
        name: 'Custom Asset URL',
      },
    ]);
    setImageUrlInput('');
    onShowToast('Image URL added');
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
    onShowToast('Primary image updated');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      onShowToast('Product requires at least one display image');
      return;
    }
    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (!filtered.some((img) => img.isPrimary) && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const calculateDiscount = () => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const totalStockCount = sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);
  const targetSchool = SCHOOLS.find((s) => s.id === selectedSchoolId) || activeSchool;

  const handleSubmit = async (publishImmediate: boolean) => {
    if (!name.trim()) {
      onShowToast('Please enter a product title');
      setActiveTab('info');
      return;
    }
    if (!sku.trim()) {
      onShowToast('Please specify a product SKU');
      setActiveTab('info');
      return;
    }
    if (price <= 0) {
      onShowToast('Please specify a valid price');
      setActiveTab('pricing');
      return;
    }
    if (sizes.length === 0) {
      onShowToast('Please add at least one size specification');
      setActiveTab('sizes');
      return;
    }
    if (images.length === 0) {
      onShowToast('Please add at least one product image');
      setActiveTab('images');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<ManagedProduct> = {
        id: productToEdit?.id,
        name: name.trim(),
        sku: sku.trim(),
        schoolId: selectedSchoolId,
        schoolName: targetSchool.name,
        category,
        subcategory,
        gender,
        ageGroup,
        season,
        description:
          description.trim() ||
          `Official approved uniform specification for ${targetSchool.name}. Tailored to institutional specifications with reinforced seams and authorized embroidery.`,
        fabricBlend: fabricBlend || 'Poly-Cotton Blend',
        badge: badge?.trim() || '',
        badgeType: badgeType || 'pattern',
        price: Math.max(0, Math.round(Number(price) || 0)),
        mrp: Math.max(
          Math.max(0, Math.round(Number(price) || 0)),
          Math.round(Number(mrp) || Math.round(Number(price) * 1.18))
        ),
        discount: calculateDiscount(),
        sizes,
        images,
        status: publishImmediate ? 'active' : 'draft',
        isPublished: publishImmediate,
        totalStock: totalStockCount,
      };

      await onSave(payload);
      onShowToast(
        productToEdit
          ? `Product ${sku} updated successfully!`
          : `New SKU ${sku} added to ${targetSchool.name} catalog!`
      );
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      onShowToast('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const primaryImage = images.find((i) => i.isPrimary) || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl border border-surface-container flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-primary text-on-primary flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary-fixed text-2xl">
              {productToEdit ? 'edit_note' : 'add_box'}
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-white leading-tight">
                {productToEdit ? `Edit SKU: ${productToEdit.sku}` : 'Add New Uniform SKU'}
              </h2>
              <span className="text-[11px] text-white/70">
                Institutional Catalog Specification & Real-Time Inventory
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-surface-container bg-surface-container-low/40 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-secondary text-primary font-extrabold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">info</span>
            <span>1. Basic Info</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-secondary text-primary font-extrabold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>2. Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('sizes')}
            className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sizes'
                ? 'border-secondary text-primary font-extrabold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">straighten</span>
            <span>3. Sizes & Stock ({totalStockCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'images'
                ? 'border-secondary text-primary font-extrabold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">photo_library</span>
            <span>4. Media ({images.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 text-[12px] font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-secondary text-primary font-extrabold'
                : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>5. Live Preview</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Target School *
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value);
                      generateSku(e.target.value, category);
                    }}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {SCHOOLS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      generateSku(selectedSchoolId, e.target.value);
                    }}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Official Oxford Weave Full Sleeve Uniform Shirt"
                  className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-outline uppercase">
                      SKU Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => generateSku(selectedSchoolId, category)}
                      className="text-[10px] text-secondary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[12px]">refresh</span>
                      Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="DAIS_SHIRT_01"
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-mono font-bold focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Grade / Age Group
                  </label>
                  <input
                    type="text"
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    placeholder="All Grades / Senior High"
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Fabric Blend & Technical Spec
                  </label>
                  <input
                    type="text"
                    value={fabricBlend}
                    onChange={(e) => setFabricBlend(e.target.value)}
                    placeholder="65% Poly / 35% Combed Cotton, Easy-Iron"
                    className="w-full h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                    Quality Badge
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Pattern Approved / 100% Wool"
                      className="flex-1 h-10 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary font-semibold focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                    <select
                      value={badgeType}
                      onChange={(e) => setBadgeType(e.target.value as any)}
                      className="h-10 px-2 bg-surface-container-low border border-surface-container rounded-xl text-[11px] font-bold text-primary"
                    >
                      <option value="pattern">Pattern</option>
                      <option value="stain">Stain</option>
                      <option value="wool">Wool</option>
                      <option value="house">House</option>
                      <option value="cotton">Cotton</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-outline uppercase block mb-1">
                  Product Description & Care
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official approved uniform specification tailored with reinforced seams, anti-pilling fabric, and official school crest..."
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-[13px] text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-outline uppercase">
                    Selling Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] font-bold text-primary">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full h-11 pl-8 pr-3 bg-surface-container-lowest border border-surface-container rounded-xl text-[18px] font-extrabold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant">
                    Authoritative customer checkout price in Indian Rupees.
                  </span>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-outline uppercase">
                    Original MRP (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] font-bold text-outline">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={mrp}
                      onChange={(e) => setMrp(Number(e.target.value))}
                      className="w-full h-11 pl-8 pr-3 bg-surface-container-lowest border border-surface-container rounded-xl text-[18px] font-extrabold text-outline focus:outline-none focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-on-surface-variant">Computed Discount:</span>
                    <span className="font-bold text-secondary">
                      {calculateDiscount()}% OFF
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[13px] font-bold text-primary block">
                    Product Status & Visibility
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Only Active products are shown in the customer school store.
                  </span>
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="h-10 px-3 bg-surface-container-lowest border border-surface-container rounded-xl text-[12px] font-bold text-primary cursor-pointer"
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: SIZES & INVENTORY */}
          {activeTab === 'sizes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-bold text-primary">
                    Size Matrix & Inventory Allocation
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Total In Stock: <strong>{totalStockCount} units</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-outline uppercase font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetSizes('standard')}
                    className="px-2 py-1 bg-surface-container text-primary rounded-lg text-[10px] font-bold hover:bg-surface-container-high cursor-pointer"
                  >
                    Apparel (28-40)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetSizes('junior')}
                    className="px-2 py-1 bg-surface-container text-primary rounded-lg text-[10px] font-bold hover:bg-surface-container-high cursor-pointer"
                  >
                    Junior (22-30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetSizes('shoes')}
                    className="px-2 py-1 bg-surface-container text-primary rounded-lg text-[10px] font-bold hover:bg-surface-container-high cursor-pointer"
                  >
                    Shoes (4-10)
                  </button>
                </div>
              </div>

              {/* Size Table */}
              <div className="border border-surface-container rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-surface-container-low px-3 py-2 text-[11px] font-bold text-outline uppercase">
                  <div className="col-span-4">Size</div>
                  <div className="col-span-4">Stock Units</div>
                  <div className="col-span-3">Low Alert</div>
                  <div className="col-span-1 text-right">Del</div>
                </div>

                <div className="divide-y divide-surface-container/60 max-h-[300px] overflow-y-auto">
                  {sizes.map((s) => (
                    <div
                      key={s.size}
                      className="grid grid-cols-12 items-center px-3 py-2 bg-surface-container-lowest text-[13px] hover:bg-surface-container-low/40"
                    >
                      <div className="col-span-4 font-bold text-primary flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-md bg-surface-container flex items-center justify-center text-[11px]">
                          {s.size}
                        </span>
                        <span>Size {s.size}</span>
                      </div>

                      <div className="col-span-4 pr-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateSizeStock(s.size, 'stock', (s.stock || 0) - 5)}
                            className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary font-bold hover:bg-surface-container-high"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={s.stock}
                            onChange={(e) => handleUpdateSizeStock(s.size, 'stock', Number(e.target.value))}
                            className="w-16 h-7 text-center font-bold bg-surface-container-low rounded border border-surface-container text-[12px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateSizeStock(s.size, 'stock', (s.stock || 0) + 10)}
                            className="w-7 h-7 rounded bg-primary text-on-primary flex items-center justify-center text-[12px] font-bold hover:bg-primary-container"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          value={s.lowStockThreshold || 15}
                          onChange={(e) =>
                            handleUpdateSizeStock(s.size, 'lowStockThreshold', Number(e.target.value))
                          }
                          className="w-14 h-7 text-center font-semibold bg-surface-container-low rounded border border-surface-container text-[11px]"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(s.size)}
                          className="w-6 h-6 rounded text-error hover:bg-error-container/30 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Size Strip */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newCustomSize}
                  onChange={(e) => setNewCustomSize(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSize()}
                  placeholder="Add custom size (e.g. 42, XXL, Custom)"
                  className="h-9 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary font-semibold flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3.5 h-9 bg-primary text-on-primary rounded-xl text-[12px] font-bold flex items-center gap-1 cursor-pointer hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Size</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div className="border-2 border-dashed border-surface-container-high rounded-2xl p-6 text-center bg-surface-container-low/40 hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-3xl text-secondary mb-2 block">
                  cloud_upload
                </span>
                <p className="text-[13px] font-bold text-primary">
                  Upload Official Uniform Photography
                </p>
                <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto mt-1 mb-3">
                  Upload high-resolution front, back, and crest close-up photos. Files will be saved to Firebase Storage.
                </p>

                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold shadow-xs hover:bg-primary-container cursor-pointer">
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Browse Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {isUploading && (
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-secondary h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block mt-1">
                      Uploading to Firebase Storage... {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>

              {/* URL Input Fallback */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Or paste external high-res image URL (e.g. Google Cloud / Unsplash)"
                  className="h-9 px-3 bg-surface-container-low border border-surface-container rounded-xl text-[12px] text-primary flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 h-9 bg-surface-container text-primary rounded-xl text-[12px] font-bold hover:bg-surface-container-high cursor-pointer"
                >
                  Add URL
                </button>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden border-2 bg-surface-container p-1 group flex flex-col ${
                      img.isPrimary ? 'border-secondary shadow-sm' : 'border-surface-container'
                    }`}
                  >
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-white">
                      <img
                        src={img.url}
                        alt={img.name || `Image ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                          img.isPrimary
                            ? 'bg-secondary text-primary'
                            : 'text-outline hover:text-primary'
                        }`}
                      >
                        {img.isPrimary ? 'Primary' : 'Set Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-error hover:opacity-80 p-0.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
                  Live Customer Preview
                </span>
                <p className="text-[12px] text-on-surface-variant">
                  This is how this uniform SKU will appear to parents in the {targetSchool.name} Store.
                </p>
              </div>

              <div className="max-w-xs mx-auto bg-surface-container-lowest rounded-2xl border border-surface-container p-3 shadow-md">
                <div className="relative aspect-4/5 rounded-xl bg-surface-container overflow-hidden mb-3">
                  {primaryImage && (
                    <img
                      src={primaryImage.url}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-secondary-fixed text-[10px] font-bold">
                    {badge || 'Pattern Approved'}
                  </span>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-white/90 text-primary text-[10px] font-extrabold shadow-xs">
                    {sku}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-outline uppercase font-semibold block truncate">
                    {targetSchool.name} • {category.toUpperCase()}
                  </span>
                  <h4 className="text-[14px] font-bold text-primary leading-tight line-clamp-2">
                    {name || 'Uniform Item Title'}
                  </h4>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-[16px] font-extrabold text-primary">
                      ₹{price}
                    </span>
                    {mrp > price && (
                      <span className="text-[12px] text-outline line-through">
                        ₹{mrp}
                      </span>
                    )}
                    {calculateDiscount() > 0 && (
                      <span className="text-[10px] font-bold text-secondary">
                        ({calculateDiscount()}% OFF)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {sizes.slice(0, 5).map((s) => (
                      <span
                        key={s.size}
                        className="px-2 py-0.5 bg-surface-container text-primary text-[10px] font-bold rounded"
                      >
                        {s.size}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm text-secondary-fixed">
                        shopping_bag
                      </span>
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-surface-container-low border-t border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-on-surface-variant font-medium">
              Persists directly to Cloud Firestore
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSaving}
              className="px-4 py-2 bg-surface-container text-primary rounded-xl text-[12px] font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSaving}
              className="px-5 py-2 bg-primary text-on-primary rounded-xl text-[12px] font-bold shadow-sm hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">
                    progress_activity
                  </span>
                  <span>Saving to Firestore...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm text-secondary-fixed">
                    publish
                  </span>
                  <span>{productToEdit ? 'Save & Publish' : 'Publish SKU to Store'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
