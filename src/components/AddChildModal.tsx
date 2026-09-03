import React, { useState } from 'react';
import { ChildProfile, School } from '../types';
import { SCHOOLS } from '../data/schools';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSchool: School;
  onAddChild: (newChild: ChildProfile) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  activeSchool,
  onAddChild,
}) => {
  const [name, setName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [grade, setGrade] = useState('Grade 4');
  const [gender, setGender] = useState<'boys' | 'girls'>('boys');
  const [selectedSchool, setSelectedSchool] = useState(activeSchool.name);
  const [height, setHeight] = useState('134');
  const [weight, setWeight] = useState('30');

  if (!isOpen) return null;

  const calculateSize = (h: number) => {
    if (h < 120) return '26';
    if (h < 130) return '28';
    if (h < 140) return '30';
    if (h < 150) return '32';
    if (h < 160) return '34';
    return '36';
  };

  const currentRecommendedSize = calculateSize(parseInt(height, 10) || 134);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ST';

    const hNum = parseInt(height, 10) || 134;
    const wNum = parseInt(weight, 10) || 30;

    const newProfile: ChildProfile = {
      id: `child-${Date.now()}`,
      name: name.trim(),
      initials,
      school: selectedSchool,
      grade,
      board: 'CBSE',
      session: 'Session 2025-26',
      height: `${hNum} cm`,
      heightInches: `${Math.floor(hNum / 30.48)}' ${Math.round((hNum % 30.48) / 2.54)}"`,
      weight: `${wNum} kg`,
      weightCategory: 'Regular',
      age: Math.max(5, Math.min(18, parseInt(grade.replace(/\D/g, ''), 10) + 5 || 10)),
      growthBuffer: '+1.5" (Annual)',
      active: true,
      measurements: {
        chest: (parseInt(currentRecommendedSize, 10) - 2).toString(),
        waist: '26',
        inseam: '28',
      },
      sizes: {
        shirt: `Size ${currentRecommendedSize}`,
        trousers: `Size ${Math.max(26, parseInt(currentRecommendedSize, 10) - 2)}`,
        blazer: `Size ${parseInt(currentRecommendedSize, 10) + 2}`,
        sportsKit: 'Size M',
        shoes: 'UK Size 4',
      },
    };

    onAddChild(newProfile);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl border border-surface-container max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-base">person_add</span>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-primary leading-tight">
                Enroll Student Profile
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Auto-sync official curriculum sizing & house gear
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diya Sharma"
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
              required
            />
          </div>

          {/* Admission Number */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Admission / Roll Number
            </label>
            <input
              type="text"
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              placeholder="e.g. DPS-2024-5120 (optional)"
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-[13px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          {/* Institution & Grade */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                School
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full h-11 px-2.5 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
              >
                {SCHOOLS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-1">
                Class / Grade
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-11 px-2.5 bg-surface-container-low rounded-xl text-[12px] font-semibold text-primary border border-surface-container focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
              >
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-1">
              Uniform Category
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender('boys')}
                className={`flex-1 h-10 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  gender === 'boys'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">boy</span>
                <span>Boys Collection</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('girls')}
                className={`flex-1 h-10 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  gender === 'girls'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">girl</span>
                <span>Girls Collection</span>
              </button>
            </div>
          </div>

          {/* Measurements */}
          <div className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase">
                Height & Weight Sizer
              </span>
              <span className="text-[11px] font-bold text-secondary">
                Auto-fit Size {currentRecommendedSize}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-outline uppercase font-semibold mb-0.5">
                  Height: {height} cm
                </label>
                <input
                  type="range"
                  min="100"
                  max="180"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] text-outline uppercase font-semibold mb-0.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-8 px-2 bg-surface-container-lowest rounded text-[12px] font-bold text-primary border border-surface-container"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 h-12 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Save Student Profile</span>
              <span className="material-symbols-outlined text-secondary-fixed text-base">
                check
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-4 bg-surface-container text-on-surface-variant rounded-xl text-[13px] font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
