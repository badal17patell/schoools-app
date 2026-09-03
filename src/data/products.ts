import { UniformItem } from '../types';
import { SCHOOLS } from './schools';

// High resolution authentic uniform asset images
const IMG_SHIRT_WHITE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAPegsFvU5D5TQEr4WgomJcXTDUytvt7GJugPTreh_rTtEsBjjs59JfhFA6J2z5ZMcTEbF8ya16fB3XkDWUfx0IgAPugg33DIoH7HqFXy4SPI0FvAcK3gNt3Jdfh_cFsYWilzYk-tKbyVSOEFVJ2Yt6qcIuticFN-_aMZDF484bPT3PWt3tYUS0C35SUbMiiJ6IXTHcWSGMsVcygNmfw6vJVLu7_Vg5FnR4ni67FXue9ZXYenBr6PudXg';

const IMG_TROUSERS_NAVY =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuACVGcLN8Ex9sXzGEYDgRyY2mZ26ney8xOS_O9lRyBu2l1VYFiVuLFBJcZPCXegZ3Hcm7BDTcC8zCUt8T0DsZF4XOo7mppjR0i59vqTaWjqdY4QaflmRiOjSV4WSOhI830ud1_nekiURVXsHEm4hyyvnapHDZWx2LDbGDoD8PeQGnc-bDrEa13nlIsLvjHiHInMtcsYUIe6_olOUcP4_WWyARPp07pJpnGdbmP6NALHBl76zz1qVGk_8g';

const IMG_TROUSERS_GREY =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBuRNutfiXu8c18Uwo4R_ZPpcs_0MBHrL-N-06E0JDL6Y0pJ_cEiDn_d4vRx2gCqYa28D5dG1eHsysBmHyv-S3DAdUsWv9aNEmKCcIu3l0JV-DCkaoWPoBX2Py27NzvzXQupM9EUZRzQqJAlXBeCnQSRQvVDcT7nMfs0z3z2jgIcjBIwWXn1mK5b63FOzG7iXM9nSMRxLEr_fkCEb3bmeq5yowIIANXwR7H7cWzmWiIIXwxggZBkhaQuA';

const IMG_SKIRT_NAVY =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuApK5nQAkWXVOg74sW9SDKv-QvSFQI6_cqhsj56fXMv1BnsroIxw0rpsyooFvr6l-22mqS-hZ1D_wRkC5hj_sBeCsrqCK26SwWQ_FcQgyfx-TP4x6RrSNSNaPfgZLfiBLehm9MOqHTJ2McaDDY95M_0CSnedX2jmXNjCi3uuVd8C89XP3rAwx_eNL4S8hHSHQDssib8eSNCE-ih_EqMTQ8MZy6uWegkwGCW-yg1u9Zim-PKCH6YBI_Gxg';

const IMG_BLAZER_CREST =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhb2J4GHuchILK10ALzeBXV173kkr4RX2Rn_C4c6Ou1sjIQijsT_6_xYAD5AjoBpJMDOgmnlewgOWxUQDRa3WVpk2daNkmKQtV0ZfHMr9DF9AAXPVgmelFMPXP7W80Qh8wbYxTDkpzYIF1BWHJBZhkgHhflfMtTQUsHx23Wn9XLo2NeuHKS_h5wNmZ3qUU1ozGMNjUzjp8CIx0eZrj3UaelhzHVEFufo9XauwYllVA-WgfI5tI_U1P4Q';

const IMG_TRACKSUIT_NAVY =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA645TCtLLuXW8o2tKSPemtNVhHwSLjdP3C2sIcL5Um-pIF1iJg8VXEZyibrthqV_iPXMOCvfxQrjinbGhQRNWUQ4o0jay0-3nHz9TvR2AShjqIT_41HmVsLizDA9IdscBeL6hXzNqcuxS2-dT_vaEpkLg4sj9yjlZlnFftyAPjS1DipntYl6mTaHpHI06Jsn1HuIGPirCDvJpmZOqxXwa-DGSN4jf4Shcvy_bFBX3GjVE00aCU5oTdZA';

const IMG_TRACKSUIT_GREEN =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBtMFTSl9L-MckGigVxDcazwJRkPye49zIY5cIyqfeyXCQe9FjUuf9PTtXPeIGScHhcV_jpuBKQ3nqWhNtx6uR-fhNZ_r-k-Jl2Nszpt8lX_Ss4eHsZ4vg0fH9Feh32k3RX9A7zxGH3uUqHgRh1I5dHs_yaf78NOV_0RjyRYQ49PGKFgEx7oUJ7x3arUafnWHkC4trVWmH0_X0M25o0SMDA0tH-pWk3hSV7WvFOqLV8HHL-r0gl8uevFA';

// Generate 3 official uniform products for each of the 100 private schools in India (300 products total)
export const UNIFORM_ITEMS: UniformItem[] = SCHOOLS.flatMap((school, index) => {
  const sId = school.id;
  const sShort = school.name.split(' - ')[0].replace(/School|Academy|High|College/gi, '').trim();

  // 1. Official Uniform Shirt
  const shirtPrice = 749 + (index % 4) * 30;
  const product1: UniformItem = {
    id: `${sId.toLowerCase()}-shirt`,
    name: `${sShort} Official Monogram Oxford Shirt`,
    category: 'shirts',
    categoryLabel: 'Shirts · Formal Uniform',
    price: shirtPrice,
    originalPrice: shirtPrice + 150,
    image: IMG_SHIRT_WHITE,
    altText: `Official crisp tailored full sleeve white school uniform shirt for ${school.name} with embroidered chest crest on pocket`,
    badge: 'Official Pattern',
    badgeType: 'pattern',
    inStock: true,
    availableSizes: ['28', '30', '32', '34', '36', '38', '40'],
    defaultSize: '32',
    fabricBlend: '65% Premium Cotton • 35% Poly Breathable Blend',
    schoolId: sId,
    description: `Official standard uniform shirt strictly conforming to ${school.name} dress code regulations. Pre-shrunk, breathable weave with institutional crest embroidery and reinforced collars.`,
  };

  // 2. Official Uniform Bottoms (Tailored Trousers or Pleated Skirt)
  const isSkirt = index % 2 === 1;
  const bottomPrice = isSkirt ? 849 + (index % 3) * 30 : 899 + (index % 4) * 30;
  const product2: UniformItem = isSkirt
    ? {
        id: `${sId.toLowerCase()}-skirt`,
        name: `${sShort} Pleated Institutional Skirt`,
        category: 'skirts',
        categoryLabel: 'Skirts · Girls',
        price: bottomPrice,
        originalPrice: bottomPrice + 150,
        image: IMG_SKIRT_NAVY,
        altText: `Smart navy blue pleated girls school uniform skirt neatly tailored for ${school.name}`,
        badge: 'Stain Resistant',
        badgeType: 'stain',
        inStock: true,
        availableSizes: ['24', '26', '28', '30', '32'],
        defaultSize: '26',
        fabricBlend: 'High Durability Poly-Viscose Twill',
        schoolId: sId,
        description: `Precision box-pleated school skirt engineered with stain-resistant coating and adjustable concealed comfort waistband for students at ${school.name}.`,
      }
    : {
        id: `${sId.toLowerCase()}-trousers`,
        name: `${sShort} Formal Tailored Trousers`,
        category: 'trousers',
        categoryLabel: 'Trousers · Unisex Regular',
        price: bottomPrice,
        originalPrice: bottomPrice + 150,
        image: index % 4 === 0 ? IMG_TROUSERS_GREY : IMG_TROUSERS_NAVY,
        altText: `Classic tailored formal school uniform trousers with crisp creases for ${school.name}`,
        badge: 'Stain Resistant',
        badgeType: 'stain',
        inStock: true,
        availableSizes: ['28', '30', '32', '34', '36'],
        defaultSize: '30',
        fabricBlend: 'Reinforced Double-Weave Poly-Viscose Twill',
        schoolId: sId,
        description: `Institutional tailored formal trousers with double-stitched stress points and flexible expander waistband specified by ${school.name}.`,
      };

  // 3. Official Heritage Blazer or House Athletic Sports Kit
  const isBlazer = index % 3 !== 2;
  const blazerPrice = 2199 + (index % 5) * 50;
  const sportsPrice = 1299 + (index % 4) * 50;

  const product3: UniformItem = isBlazer
    ? {
        id: `${sId.toLowerCase()}-blazer`,
        name: `${sShort} Official Heritage Bullion Blazer`,
        category: 'blazers',
        categoryLabel: 'Blazers · Winter Formal',
        price: blazerPrice,
        originalPrice: blazerPrice + 300,
        image: IMG_BLAZER_CREST,
        altText: `Luxurious tailored official school blazer with bullion gold crest embroidery for ${school.name}`,
        badge: 'Wool Blend',
        badgeType: 'wool',
        inStock: true,
        availableSizes: ['32', '34', '36', '38', '40', '42'],
        defaultSize: '36',
        fabricBlend: 'Premium Worsted Wool-Poly Blend with Satin Lining',
        schoolId: sId,
        description: `Hand-finished formal blazer with metallic gold bullion thread institutional emblem embroidered on chest pocket, engraved brass buttons, and breathable inner lining for ${school.name}.`,
      }
    : {
        id: `${sId.toLowerCase()}-tracksuit`,
        name: `${sShort} House Athletic Tracksuit & Tee Set`,
        category: 'boys',
        categoryLabel: 'Sports · House Kit',
        price: sportsPrice,
        originalPrice: sportsPrice + 200,
        image: index % 2 === 0 ? IMG_TRACKSUIT_NAVY : IMG_TRACKSUIT_GREEN,
        altText: `Dynamic athletic school house track suit jacket, pants and tee set for ${school.name}`,
        badge: 'House Uniform',
        badgeType: 'house',
        inStock: true,
        availableSizes: ['S', 'M', 'L', 'XL'],
        defaultSize: 'M',
        fabricBlend: '100% Moisture-Wicking Micro Poly Performance Fabric',
        schoolId: sId,
        description: `Complete 3-piece physical education uniform with moisture management technology and contrast institutional stripes approved by ${school.name}.`,
      };

  return [product1, product2, product3];
});

// Helper functions for easy filtering
export const getProductsForSchool = (schoolId: string): UniformItem[] => {
  const items = UNIFORM_ITEMS.filter((item) => item.schoolId === schoolId);
  if (items.length > 0) return items;
  // Fallback to first 3 items if id not found
  return UNIFORM_ITEMS.slice(0, 3);
};

export const getProductById = (id: string): UniformItem => {
  return UNIFORM_ITEMS.find((p) => p.id === id) || UNIFORM_ITEMS[0];
};
