import React from 'react';
import { Building2, MapPin, Package, ShoppingCart } from 'lucide-react';
import { School } from '../../types';
import { SCHOOLS } from '../../data/schools';

interface AdminSchoolsViewProps {
  onSelectSchoolContext: (school: School) => void;
}

export const AdminSchoolsView: React.FC<AdminSchoolsViewProps> = ({ onSelectSchoolContext }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
        <h2 className="text-lg font-bold text-[#171717]">Institutional Schools Directory</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Select a school to manage its dedicated catalogue, uniform rules, and student orders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCHOOLS.map((school) => (
          <div key={school.id} className="bg-white p-5 rounded-2xl border border-[#E5E5E5] hover:border-[#C9A227] transition-all flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8F6F0] border border-[#E5E5E5] flex items-center justify-center text-[#C9A227] font-bold">
                  {school.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171717]">{school.name}</h3>
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {school.city}, {school.state}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 line-clamp-2 mt-2">{school.address}</p>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active Catalogue</span>
              <button
                onClick={() => onSelectSchoolContext(school)}
                className="px-3 py-1.5 bg-[#0B0B0B] text-[#C9A227] hover:bg-[#1C1C1C] rounded-lg text-xs font-semibold transition-colors"
              >
                Manage School →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
