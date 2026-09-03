import React, { useState, useMemo, useEffect } from 'react';
import { School } from '../types';
import {
  SCHOOLS,
  getAvailableStates,
  getCitiesForState,
  getSchoolsForStateAndCity,
} from '../data/schools';

interface ModalsProps {
  isSchoolModalOpen: boolean;
  onCloseSchoolModal: () => void;
  activeSchool: School;
  onSelectSchool: (school: School) => void;
  isPolicyModalOpen: boolean;
  onClosePolicyModal: () => void;
  isSizeGuideOpen: boolean;
  onCloseSizeGuide: () => void;
  isFitQuizOpen: boolean;
  onCloseFitQuiz: () => void;
  onApplyFitRecommendation?: (studentName: string, height: number, weight: number, recommendedSize: string) => void;
  toastMessage: string | null;
  onCloseToast: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  isSchoolModalOpen,
  onCloseSchoolModal,
  activeSchool,
  onSelectSchool,
  isPolicyModalOpen,
  onClosePolicyModal,
  isSizeGuideOpen,
  onCloseSizeGuide,
  isFitQuizOpen,
  onCloseFitQuiz,
  onApplyFitRecommendation,
  toastMessage,
  onCloseToast,
}) => {
  // Cascading states for School Modal
  const availableStates = useMemo(() => getAvailableStates(), []);
  const [selectedState, setSelectedState] = useState(activeSchool.state || availableStates[0]);

  const availableCities = useMemo(() => {
    return getCitiesForState(selectedState);
  }, [selectedState]);

  const [selectedCity, setSelectedCity] = useState(
    activeSchool.state === selectedState && availableCities.includes(activeSchool.city)
      ? activeSchool.city
      : availableCities[0] || ''
  );

  const availableSchools = useMemo(() => {
    return getSchoolsForStateAndCity(selectedState, selectedCity);
  }, [selectedState, selectedCity]);

  const [tempSchoolId, setTempSchoolId] = useState(activeSchool.id);
  const [schoolModalSearch, setSchoolModalSearch] = useState('');

  // Sync with activeSchool whenever modal opens
  useEffect(() => {
    if (isSchoolModalOpen && activeSchool) {
      setSelectedState(activeSchool.state);
      setSelectedCity(activeSchool.city);
      setTempSchoolId(activeSchool.id);
      setSchoolModalSearch('');
    }
  }, [isSchoolModalOpen, activeSchool]);

  const handleModalStateChange = (newState: string) => {
    setSelectedState(newState);
    const newCities = getCitiesForState(newState);
    const defaultCity = newCities[0] || '';
    setSelectedCity(defaultCity);
    const newSchools = getSchoolsForStateAndCity(newState, defaultCity);
    setTempSchoolId(newSchools[0]?.id || '');
  };

  const handleModalCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    const newSchools = getSchoolsForStateAndCity(selectedState, newCity);
    setTempSchoolId(newSchools[0]?.id || '');
  };

  const modalSearchResults = useMemo(() => {
    if (!schoolModalSearch.trim()) return [];
    const q = schoolModalSearch.toLowerCase();
    return SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        s.board.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [schoolModalSearch]);

  const handleSelectFromModalSearch = (school: School) => {
    setSelectedState(school.state);
    setSelectedCity(school.city);
    setTempSchoolId(school.id);
    setSchoolModalSearch('');
  };

  // Fit Quiz State
  const [quizStudent, setQuizStudent] = useState('Aarav Sharma');
  const [quizHeight, setQuizHeight] = useState('142');
  const [quizWeight, setQuizWeight] = useState('34');
  const [quizGrade, setQuizGrade] = useState('Grade 6');

  const calculateRecommendedSize = (h: number) => {
    if (h < 120) return '26';
    if (h < 130) return '28';
    if (h < 140) return '30';
    if (h < 150) return '32';
    if (h < 160) return '34';
    if (h < 170) return '36';
    return '38';
  };

  const handleConfirmSchool = () => {
    const found = SCHOOLS.find((s) => s.id === tempSchoolId) || SCHOOLS[0];
    onSelectSchool(found);
    onCloseSchoolModal();
  };

  const handleFinishQuiz = () => {
    const h = parseInt(quizHeight, 10) || 142;
    const w = parseInt(quizWeight, 10) || 34;
    const size = calculateRecommendedSize(h);
    if (onApplyFitRecommendation) {
      onApplyFitRecommendation(quizStudent, h, w, size);
    }
    onCloseFitQuiz();
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <aside className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-primary text-on-primary rounded-full shadow-2xl flex items-center gap-2 transition-all animate-bounce">
          <span
            className="material-symbols-outlined text-secondary-container text-base"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <span className="text-[13px] font-semibold tracking-tight">
            {toastMessage}
          </span>
          <button
            onClick={onCloseToast}
            className="ml-1 text-on-primary/70 hover:text-on-primary"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        </aside>
      )}

      {/* School Selection Modal */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-surface-container animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary-fixed text-base">
                    school
                  </span>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface leading-tight">
                    Select School
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Cascading Institutional Directory
                  </span>
                </div>
              </div>
              <button
                onClick={onCloseSchoolModal}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-3">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={schoolModalSearch}
                  onChange={(e) => setSchoolModalSearch(e.target.value)}
                  placeholder="Quick search any of the 100 schools..."
                  className="w-full h-10 pl-8.5 pr-3 bg-surface-container-low text-primary placeholder:text-on-surface-variant text-[13px] rounded-lg border border-transparent focus:border-secondary focus:outline-none"
                />
                {schoolModalSearch && (
                  <button
                    onClick={() => setSchoolModalSearch('')}
                    className="absolute right-2 text-on-surface-variant hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown for modal */}
              {modalSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {modalSearchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectFromModalSearch(s)}
                      className="w-full p-2.5 text-left flex items-start gap-2 hover:bg-surface-container transition-colors border-b border-surface-container/40 last:border-0"
                    >
                      <span className="material-symbols-outlined text-secondary text-base mt-0.5 shrink-0">
                        school
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12px] text-primary truncate">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate">
                          {s.city}, {s.state} • {s.board}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-outline uppercase font-bold mb-1">
                  1. State ({availableStates.length} States)
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleModalStateChange(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface text-[14px] focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-outline uppercase font-bold mb-1">
                  2. City ({availableCities.length} {availableCities.length === 1 ? 'City' : 'Cities'})
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleModalCityChange(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface text-[14px] focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-outline uppercase font-bold mb-1">
                  3. Approved Institution ({availableSchools.length} {availableSchools.length === 1 ? 'School' : 'Schools'})
                </label>
                <select
                  value={tempSchoolId}
                  onChange={(e) => setTempSchoolId(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-on-surface text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                >
                  {availableSchools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.board})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected school preview in modal */}
            {(() => {
              const preview = SCHOOLS.find((s) => s.id === tempSchoolId);
              if (!preview) return null;
              return (
                <div className="mt-3 p-3 bg-surface-container-low rounded-xl border border-secondary/20 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5">
                    {preview.iconName || 'school'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[13px] text-primary truncate">
                      {preview.name}
                    </div>
                    <div className="text-[11px] text-on-surface-variant truncate">
                      {preview.city}, {preview.state} • {preview.board} • {preview.grades}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleConfirmSchool}
                className="flex-1 h-12 bg-primary text-on-primary rounded-xl text-[14px] font-bold shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Confirm School Store</span>
                <span className="material-symbols-outlined text-secondary-fixed text-base">
                  check
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Policy Rule Modal */}
      {isPolicyModalOpen && (
        <div
          onClick={onClosePolicyModal}
          className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-xl max-w-sm w-full p-6 flex flex-col gap-4 shadow-2xl border border-surface-container"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[28px]">
                verified_user
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[18px] font-bold text-primary">
                Institutional Policy
              </h3>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                Magnum ensures strict color-tone uniformity and official
                batch-certified cresting. To avoid logistics discrepancies,
                uniforms from separate institutions cannot be dispatched under a
                shared consignment.
              </p>
            </div>
            <button
              onClick={onClosePolicyModal}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-[14px] font-bold hover:bg-primary-container transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Sizing Guide Modal */}
      {isSizeGuideOpen && (
        <div
          onClick={onCloseSizeGuide}
          className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-surface-container max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  straighten
                </span>
                <h3 className="text-[18px] font-bold text-primary">
                  Official Sizing Matrix
                </h3>
              </div>
              <button
                onClick={onCloseSizeGuide}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-[12px] text-on-surface-variant">
              Measurements conform to Delhi Public School specification code
              DPS-PUN-2025. Standard fits include 1.5 inch growth buffer.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface font-bold">
                    <th className="p-2 rounded-l">Size</th>
                    <th className="p-2">Chest (Inches)</th>
                    <th className="p-2">Age Group</th>
                    <th className="p-2 rounded-r">Height (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  <tr>
                    <td className="p-2 font-bold text-primary">26</td>
                    <td className="p-2 text-on-surface-variant">24" - 26"</td>
                    <td className="p-2 text-on-surface-variant">5-6 Yrs</td>
                    <td className="p-2 text-on-surface-variant">110-120</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-primary">28</td>
                    <td className="p-2 text-on-surface-variant">26" - 28"</td>
                    <td className="p-2 text-on-surface-variant">7-8 Yrs</td>
                    <td className="p-2 text-on-surface-variant">120-130</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-primary">30</td>
                    <td className="p-2 text-on-surface-variant">28" - 30"</td>
                    <td className="p-2 text-on-surface-variant">9-10 Yrs</td>
                    <td className="p-2 text-on-surface-variant">130-140</td>
                  </tr>
                  <tr className="bg-secondary-container/20 font-bold">
                    <td className="p-2 text-secondary flex items-center gap-1">
                      32{' '}
                      <span className="material-symbols-outlined text-[12px]">
                        star
                      </span>
                    </td>
                    <td className="p-2 text-primary">30" - 32"</td>
                    <td className="p-2 text-primary">10-12 Yrs</td>
                    <td className="p-2 text-primary">140-148</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-primary">34</td>
                    <td className="p-2 text-on-surface-variant">32" - 34"</td>
                    <td className="p-2 text-on-surface-variant">12-14 Yrs</td>
                    <td className="p-2 text-on-surface-variant">148-155</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-primary">36</td>
                    <td className="p-2 text-on-surface-variant">34" - 36"</td>
                    <td className="p-2 text-on-surface-variant">14-16 Yrs</td>
                    <td className="p-2 text-on-surface-variant">155-165</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-primary">38</td>
                    <td className="p-2 text-on-surface-variant">36" - 38"</td>
                    <td className="p-2 text-on-surface-variant">16+ Yrs</td>
                    <td className="p-2 text-on-surface-variant">165+</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2 text-[11px] text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                info
              </span>
              <span>
                Tip: If your child is between sizes, choose the larger size. All
                Magnum uniforms include tailored side seam hems for easy 1.5"
                alteration.
              </span>
            </div>

            <button
              onClick={onCloseSizeGuide}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-[13px] font-bold hover:bg-primary-container transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Fit Quiz Modal */}
      {isFitQuizOpen && (
        <div
          onClick={onCloseFitQuiz}
          className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-surface-container"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  auto_fix_high
                </span>
                <h3 className="text-[18px] font-bold text-primary">
                  Magnum Precision Fit™ Quiz
                </h3>
              </div>
              <button
                onClick={onCloseFitQuiz}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="text-[12px] text-on-surface-variant">
              Enter student measurements to auto-calculate the verified DPS
              uniform size matrix with growth allowance:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={quizStudent}
                  onChange={(e) => setQuizStudent(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-[13px] font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                    Grade Band
                  </label>
                  <select
                    value={quizGrade}
                    onChange={(e) => setQuizGrade(e.target.value)}
                    className="w-full h-10 px-2.5 bg-surface-container-low rounded-lg text-[13px] font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    <option>Grade 2</option>
                    <option>Grade 4</option>
                    <option>Grade 6</option>
                    <option>Grade 8</option>
                    <option>Grade 10</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={quizWeight}
                    onChange={(e) => setQuizWeight(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-[13px] font-semibold text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-primary uppercase">
                    Height: {quizHeight} cm
                  </label>
                  <span className="text-[11px] text-secondary font-bold">
                    Recommended: Size {calculateRecommendedSize(parseInt(quizHeight, 10) || 142)}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="180"
                  value={quizHeight}
                  onChange={(e) => setQuizHeight(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-secondary-container/20 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-secondary block">
                  Recommended Fit
                </span>
                <span className="text-[15px] font-bold text-primary">
                  Size {calculateRecommendedSize(parseInt(quizHeight, 10) || 142)} (With +1.5" growth room)
                </span>
              </div>
              <span
                className="material-symbols-outlined text-secondary text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFinishQuiz}
                className="flex-1 h-11 bg-primary text-on-primary rounded-lg text-[13px] font-bold hover:bg-primary-container transition-all"
              >
                Apply to Profile
              </button>
              <button
                onClick={onCloseFitQuiz}
                className="h-11 px-4 bg-surface-container rounded-lg text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
