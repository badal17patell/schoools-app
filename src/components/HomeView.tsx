import React, { useState, useMemo, useEffect } from 'react';
import { ActiveScreen, School } from '../types';
import { MagnumLogo } from './MagnumLogo';
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

  return (
    <div className="flex flex-col w-full pb-20">
      <div className="max-w-2xl mx-auto w-full pt-2">


        {/* Cascading School Selector */}
        <section className="px-4 py-4 bg-surface" id="selectorSection">
          <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-md flex flex-col gap-5 border border-surface-container/60">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <h2 className="text-[18px] sm:text-[20px] font-bold text-primary tracking-tight">
                    Find Your School Store
                  </h2>
                </div>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="text-[12px] font-bold text-primary hover:text-secondary flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-lg border border-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-secondary">
                    local_shipping
                  </span>
                  <span>Track Order</span>
                </button>
              </div>
              <p className="text-[13px] text-on-surface-variant">
                Select your state and city to load authorized school uniforms, house kits, ties, socks, and shoes.
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
                  <span className="font-semibold text-primary">Authorized Uniform Catalog Ready</span>
                  <span className="text-secondary font-bold">Institution-Approved Patterns</span>
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
      </div>
    </div>
  );
};
