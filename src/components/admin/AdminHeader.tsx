import React, { useState } from 'react';
import { Search, Bell, Building2, ChevronDown, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { School } from '../../types';
import { SCHOOLS } from '../../data/schools';

interface AdminHeaderProps {
  activeSchool: School | null;
  onSelectSchool: (school: School | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  adminName: string;
  roleTitle?: string;
  onNavigateStore?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeSchool,
  onSelectSchool,
  searchQuery,
  onSearchChange,
  adminName,
  roleTitle = 'Administrator',
  onNavigateStore,
}) => {
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-[#E5E5E5] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search orders, products, SKU, customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#F8F6F0] border border-[#E5E5E5] rounded-lg pl-10 pr-4 py-2 text-xs font-medium text-[#171717] focus:outline-none focus:border-[#C9A227] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* School Context Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#F8F6F0] border border-[#E5E5E5] hover:border-[#C9A227] rounded-lg text-xs font-semibold text-[#171717] transition-all"
          >
            <Building2 size={15} className="text-[#C9A227]" />
            <span className="truncate max-w-[160px]">
              {activeSchool ? activeSchool.name : 'All Schools'}
            </span>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {isSchoolDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E5E5] rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-zinc-100 mb-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Institutional Context</p>
              </div>
              <button
                onClick={() => {
                  onSelectSchool(null);
                  setIsSchoolDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-[#F8F6F0] flex items-center justify-between ${
                  activeSchool === null ? 'text-[#C9A227] font-semibold bg-[#F8F6F0]/60' : 'text-zinc-700'
                }`}
              >
                <span>All Schools (Global Operations)</span>
                {activeSchool === null && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />}
              </button>
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-50">
                {SCHOOLS.map((school) => {
                  const isSelected = activeSchool?.id === school.id;
                  return (
                    <button
                      key={school.id}
                      onClick={() => {
                        onSelectSchool(school);
                        setIsSchoolDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-[#F8F6F0] flex items-center justify-between transition-colors ${
                        isSelected ? 'text-[#C9A227] font-semibold bg-[#F8F6F0]/60' : 'text-zinc-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium truncate">{school.name}</p>
                        <p className="text-[10px] text-zinc-400">{school.city}, {school.state}</p>
                      </div>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Storefront Switcher */}
        {onNavigateStore && (
          <button
            onClick={onNavigateStore}
            className="px-3 py-2 bg-[#0B0B0B] text-[#C9A227] hover:bg-[#1C1C1C] rounded-lg text-xs font-semibold transition-colors"
          >
            Customer Storefront →
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2.5 bg-[#F8F6F0] border border-[#E5E5E5] hover:border-[#C9A227] rounded-lg text-zinc-600 relative transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E5E5] rounded-xl shadow-xl py-3 z-50">
              <div className="px-4 pb-2 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-xs font-bold text-[#171717]">Operations Alerts</p>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Live Sync</span>
              </div>
              <div className="divide-y divide-zinc-50 max-h-72 overflow-y-auto">
                <div className="px-4 py-2.5 hover:bg-zinc-50 transition-colors flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">Firestore Connected</p>
                    <p className="text-[11px] text-zinc-500">Authoritative database synced successfully.</p>
                  </div>
                </div>
                <div className="px-4 py-2.5 hover:bg-zinc-50 transition-colors flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#C9A227] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">Inventory Threshold Check</p>
                    <p className="text-[11px] text-zinc-500">All active institutional items verified.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#E5E5E5]">
          <div className="w-9 h-9 rounded-full bg-[#0B0B0B] text-[#C9A227] flex items-center justify-center font-bold text-xs">
            {adminName ? adminName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-[#171717]">{adminName || 'Admin'}</p>
            <div className="flex items-center gap-1">
              <Shield size={10} className="text-[#C9A227]" />
              <span className="text-[10px] text-zinc-500 font-medium">{roleTitle}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
