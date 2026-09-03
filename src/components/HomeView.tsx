import React, { useState, useMemo, useEffect } from 'react';
import { ActiveScreen, School } from '../types';
import {
  SCHOOLS,
  getAvailableStates,
  getCitiesForState,
  getSchoolsForStateAndCity,
} from '../data/schools';

interface HomeViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  activeSchool: School;
  onSelectSchool: (school: School) => void;
  onOpenSizeGuide: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  activeSchool,
  onSelectSchool,
  onOpenSizeGuide,
}) => {
  // Cascading Selector States initialized with activeSchool or first available
  const availableStates = useMemo(() => getAvailableStates(), []);

  const [selectedState, setSelectedState] = useState<string>(
    activeSchool?.state || availableStates[0] || 'Maharashtra'
  );

  const availableCities = useMemo(() => {
    return getCitiesForState(selectedState);
  }, [selectedState]);

  const [selectedCity, setSelectedCity] = useState<string>(
    activeSchool && activeSchool.state === selectedState && availableCities.includes(activeSchool.city)
      ? activeSchool.city
      : availableCities[0] || 'Mumbai'
  );

  const availableSchools = useMemo(() => {
    return getSchoolsForStateAndCity(selectedState, selectedCity);
  }, [selectedState, selectedCity]);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    activeSchool && activeSchool.city === selectedCity
      ? activeSchool.id
      : availableSchools[0]?.id || ''
  );

  // Quick Instant Search for any of the 100 schools
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Sync state if activeSchool changes externally
  useEffect(() => {
    if (activeSchool) {
      setSelectedState(activeSchool.state);
      setSelectedCity(activeSchool.city);
      setSelectedSchoolId(activeSchool.id);
    }
  }, [activeSchool]);

  // Handle State Change: Cascade City and School
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    const newCities = getCitiesForState(newState);
    const defaultCity = newCities[0] || '';
    setSelectedCity(defaultCity);

    const newSchools = getSchoolsForStateAndCity(newState, defaultCity);
    if (newSchools.length > 0) {
      setSelectedSchoolId(newSchools[0].id);
    } else {
      setSelectedSchoolId('');
    }
  };

  // Handle City Change: Cascade School
  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    const newSchools = getSchoolsForStateAndCity(selectedState, newCity);
    if (newSchools.length > 0) {
      setSelectedSchoolId(newSchools[0].id);
    } else {
      setSelectedSchoolId('');
    }
  };

  // Search Results across all 100 schools
  const searchResults = useMemo(() => {
    if (!schoolSearchQuery.trim()) return [];
    const q = schoolSearchQuery.toLowerCase();
    return SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.board.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [schoolSearchQuery]);

  // Handle selecting a school from direct search
  const handleSelectFromSearch = (school: School) => {
    setSelectedState(school.state);
    setSelectedCity(school.city);
    setSelectedSchoolId(school.id);
    setSchoolSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleStartShopping = () => {
    const found = SCHOOLS.find((s) => s.id === selectedSchoolId) || activeSchool || SCHOOLS[0];
    onSelectSchool(found);
    onNavigate('store');
  };

  const handleQuickSchoolSelect = (schoolId: string) => {
    const found = SCHOOLS.find((s) => s.id === schoolId) || SCHOOLS[0];
    onSelectSchool(found);
    setSelectedState(found.state);
    setSelectedCity(found.city);
    setSelectedSchoolId(found.id);
    onNavigate('store');
  };

  const currentSelectedSchool =
    SCHOOLS.find((s) => s.id === selectedSchoolId) || activeSchool || SCHOOLS[0];

  // Curated prominent schools across diverse Indian states
  const popularSchoolIds = [
    'DAIS-MUM', // Dhirubhai Ambani, Mumbai
    'MOD-BARA', // Modern School, New Delhi
    'DOON-DDN', // The Doon School, Dehradun
    'BIS', // The Bishop's School, Pune
    'COTTON-BOYS-BLR', // Bishop Cotton Boys, Bengaluru
    'LMB-KOL', // La Martiniere for Boys, Kolkata
    'HPS-BEG', // Hyderabad Public School
    'MAYO-BOYS', // Mayo College, Ajmer
  ];

  const popularSchools = useMemo(() => {
    return popularSchoolIds
      .map((id) => SCHOOLS.find((s) => s.id === id))
      .filter(Boolean) as School[];
  }, []);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Hero Section */}
      <section className="relative px-4 pt-4 pb-6 bg-surface-container-low overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface shadow-xs self-start">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">
              Academic Session 2025-26 • 100 Indian Schools
            </span>
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-extrabold text-primary tracking-tight leading-tight">
            Official School Uniforms,
            <br />
            Tailored & Delivered.
          </h1>

          <p className="text-[14px] text-on-surface-variant leading-relaxed max-w-md">
            Direct institutional uniform portal for 100 top private schools across India.
            Standardized fabrics, authorized patterns, and guaranteed doorstep delivery.
          </p>

          {/* Student Banner Image */}
          <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden shadow-sm my-1 bg-surface-container">
            <img
              className="w-full h-full object-cover"
              alt="Indian school students in official tailored school uniforms with crest blazer in campus setting"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkzMMkncgO2wEiooRlov03SYK58BDRJuVA0ste-EnHkxniFHtbwbm2LByS89nH0S9VmwGkNCbxRnj_1UmncJpr8FeykiYQ8kJo5fZKlw_7adH-tGka1cuDGB7s0wdGXEwVqIsBNMqJJIX525upRVBIpLKkMjWN9Fpfjv7_SIXolOTg96E4Wwq_m58fCaRYznRofClMZy8qakKSE1_hobYdyAgQQXQ49PdDMKia6WKP6StU6hesauIRcA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent flex items-end p-3.5">
              <div className="flex items-center gap-1.5 text-on-primary">
                <span
                  className="material-symbols-outlined text-secondary-fixed text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="text-[13px] font-semibold tracking-tight">
                  100% Institutional Uniform Pattern & Fabric Compliance
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
            <button
              onClick={() => {
                document
                  .getElementById('selectorSection')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:flex-1 h-12 bg-primary text-on-primary rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all relative overflow-hidden group cursor-pointer"
            >
              <span>Select Your School</span>
              <span className="material-symbols-outlined text-secondary-fixed text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary-fixed"></div>
            </button>

            <button
              onClick={() => onNavigate('track-order')}
              className="w-full sm:flex-1 h-12 bg-surface-container-lowest text-primary rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg text-secondary">
                local_shipping
              </span>
              <span>Track My Order</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto w-full">
        {/* Cascading School Selector */}
        <section className="px-4 py-6 bg-surface" id="selectorSection">
          <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-md flex flex-col gap-5 border border-surface-container/60">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <h2 className="text-[18px] sm:text-[20px] font-bold text-primary tracking-tight">
                    Find Your School Store
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-secondary bg-secondary-container/50 px-2 py-0.5 rounded-full">
                  100 Private Schools
                </span>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                Select your state and city to load authorized school uniforms, house kits, and blazers.
              </p>
            </div>

            {/* Quick Live School Search */}
            <div className="relative">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Or search by school name (e.g. Cathedral, Doon, Bishop, Cotton)..."
                  className="w-full h-11 pl-9.5 pr-4 bg-surface-container-low text-primary placeholder:text-on-surface-variant/70 rounded-xl text-[13px] border border-transparent focus:border-secondary focus:bg-surface focus:outline-none transition-all"
                />
                {schoolSearchQuery && (
                  <button
                    onClick={() => setSchoolSearchQuery('')}
                    className="absolute right-3 text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Instant Search Suggestions */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-40 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 bg-surface-container-low text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    <span>Matching Schools</span>
                    <span className="text-secondary">{searchResults.length} found</span>
                  </div>
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectFromSearch(s)}
                      className="w-full p-2.5 text-left flex items-start gap-2.5 hover:bg-surface-container transition-colors border-b border-surface-container/40 last:border-0"
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">
                        school
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[13px] text-primary truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate">
                          {s.city}, {s.state} • <span className="font-medium text-secondary">{s.board}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cascading Dropdowns: State -> City -> School */}
            <div className="flex flex-col gap-3.5 pt-1">
              {/* Step 1: State */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-secondary-fixed text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span>State</span>
                  </span>
                  <span className="text-secondary font-medium text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    {availableStates.length} States Available
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-container-low text-primary rounded-xl text-[14px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer border border-surface-container/60 hover:border-secondary/40 transition-colors"
                  >
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Step 2: City (Cascades dynamically from selected State) */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-secondary-fixed text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span>City</span>
                  </span>
                  <span className="text-secondary font-medium text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    {availableCities.length} {availableCities.length === 1 ? 'City' : 'Cities'} in {selectedState}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-container-low text-primary rounded-xl text-[14px] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer border border-surface-container/60 hover:border-secondary/40 transition-colors"
                  >
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Step 3: School Name (Cascades dynamically from selected State & City) */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary text-secondary-fixed text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    <span>Authorized Private School</span>
                  </span>
                  <span className="text-secondary font-semibold text-[10px] bg-secondary-fixed/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {availableSchools.length} {availableSchools.length === 1 ? 'School' : 'Schools'} in {selectedCity}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full h-12 px-3 bg-surface-container-low text-primary rounded-xl text-[14px] font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-secondary cursor-pointer border border-surface-container/60 hover:border-secondary/40 transition-colors"
                  >
                    {availableSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.board})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Active School Branded Preview Pill */}
            {currentSelectedSchool && (
              <div className="p-4 rounded-xl bg-surface-container flex flex-col gap-2.5 border border-secondary/20">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0 text-secondary-fixed shadow-sm">
                    <span className="material-symbols-outlined text-2xl">
                      {currentSelectedSchool.iconName || 'school'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-primary truncate">
                        {currentSelectedSchool.name}
                      </span>
                      <span className="material-symbols-outlined text-secondary text-base shrink-0">
                        verified
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {currentSelectedSchool.board} • {currentSelectedSchool.curriculum} • {currentSelectedSchool.grades}
                    </span>
                    <span className="text-[11px] text-secondary font-medium truncate mt-0.5">
                      📍 {currentSelectedSchool.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-high text-[11px] text-on-surface-variant">
                  <span>3 Institutional Uniforms Available</span>
                  <span className="text-secondary font-bold">2024-25 Authorized Pattern</span>
                </div>
              </div>
            )}

            {/* Start Shopping Button */}
            <button
              onClick={handleStartShopping}
              className="w-full h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center gap-2 text-[14px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all relative overflow-hidden group cursor-pointer"
            >
              <span>View School Uniform Catalog</span>
              <span className="material-symbols-outlined text-secondary-fixed text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-fixed"></div>
            </button>
          </div>
        </section>

        {/* 4 Trust Indicators (2x2 Grid) */}
        <section className="px-4 py-2 bg-surface">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 border border-surface-container">
              <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-0.5">
                <span className="material-symbols-outlined text-lg">domain</span>
              </div>
              <span className="text-[13px] font-bold text-primary">
                100 Private Schools
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                Authorized uniform partner across India
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 border border-surface-container">
              <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-0.5">
                <span className="material-symbols-outlined text-lg">
                  workspace_premium
                </span>
              </div>
              <span className="text-[13px] font-bold text-primary">
                Institutional Quality
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                Colorfast, anti-pilling & pre-shrunk
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 border border-surface-container">
              <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-0.5">
                <span className="material-symbols-outlined text-lg">
                  swap_horizontal_circle
                </span>
              </div>
              <span className="text-[13px] font-bold text-primary">
                Free Doorstep Swap
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                7-day hassle-free size replacement
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-xs flex flex-col gap-1 border border-surface-container">
              <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary mb-0.5">
                <span className="material-symbols-outlined text-lg">receipt_long</span>
              </div>
              <span className="text-[13px] font-bold text-primary">
                Official GST Invoices
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                School-accepted fee receipts & tax slips
              </span>
            </div>
          </div>
        </section>

        {/* Popular Private Schools Section */}
        <section className="px-4 py-5 bg-surface flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-primary">
                Featured Private Schools
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                Quick entry into verified school uniform kits
              </p>
            </div>
            <button
              onClick={() => {
                document
                  .getElementById('selectorSection')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[12px] font-bold text-secondary flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Explore All 100</span>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {popularSchools.map((school) => (
              <div
                key={school.id}
                className="bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container hover:border-secondary/40 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {school.iconName || 'school'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold text-primary truncate">
                      {school.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      {school.city}, {school.state} • {school.board}
                    </span>
                    <span className="text-[10px] text-secondary font-semibold">
                      3 Official Uniforms in Stock
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickSchoolSelect(school.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
                >
                  <span>Shop</span>
                  <span className="material-symbols-outlined text-xs text-secondary-fixed">
                    chevron_right
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* The Magnum Standard */}
        <section className="px-4 py-4 bg-surface">
          <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-secondary font-bold uppercase tracking-wider">
                The Magnum Standard
              </span>
              <h3 className="text-[18px] font-bold text-primary mt-0.5">
                Why Top Indian Schools Trust Us
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="bg-surface-container-lowest p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-lg">
                    verified
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-primary">
                    Certified Fabric Compliance
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Double-reinforced seams, pre-shrunk long staple cotton, and non-fading institutional dyes.
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-lg">straighten</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-primary">
                    Growth Expander Waistbands
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Internal concealed elastic adjusters allow trousers and skirts to comfortably fit growing children.
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-3 rounded-xl flex items-start gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-primary">
                    Direct Campus Coordinator Hotline
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Dedicated uniform liaison for every affiliated institution for sizing advice and custom alterations.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
