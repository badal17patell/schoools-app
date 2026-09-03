import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Building2,
  Factory,
  Users,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { MagnumLogo } from '../MagnumLogo';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'inventory'
  | 'schools'
  | 'production'
  | 'customers'
  | 'exchanges'
  | 'reports'
  | 'team'
  | 'settings';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminName: string;
  adminEmail: string;
  onLogout: () => void;
  onOpenSupport: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  adminName,
  adminEmail,
  onLogout,
  onOpenSupport,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
    { id: 'products', label: 'Products', icon: <Package size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Layers size={18} /> },
    { id: 'schools', label: 'Schools', icon: <Building2 size={18} /> },
    { id: 'production', label: 'Production', icon: <Factory size={18} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
    { id: 'exchanges', label: 'Exchanges & Returns', icon: <RefreshCw size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    { id: 'team', label: 'Team & Roles', icon: <ShieldCheck size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#0B0B0B] text-white flex flex-col shrink-0 border-r border-[#262626] h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#262626] flex items-center gap-3">
        <MagnumLogo variant="crest" size={36} />
        <div>
          <h1 className="font-bold text-sm tracking-widest text-[#C9A227] uppercase">MAGNUM</h1>
          <p className="text-[11px] text-zinc-400 tracking-wider">OPERATIONS CENTER</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-[#1C1C1C] text-[#C9A227] border-l-2 border-[#C9A227]'
                  : 'text-zinc-400 hover:text-white hover:bg-[#161616]'
              }`}
            >
              <span className={isActive ? 'text-[#C9A227]' : 'text-zinc-500'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#262626] bg-[#070707] space-y-3">
        <button
          onClick={onOpenSupport}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#1C1C1C] transition-colors"
        >
          <HelpCircle size={16} className="text-zinc-500" />
          <span>Help & Support</span>
        </button>

        <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">{adminName || 'Admin'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{adminEmail || 'admin@magnum.com'}</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 text-zinc-400 hover:text-[#C9A227] hover:bg-[#1C1C1C] rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
