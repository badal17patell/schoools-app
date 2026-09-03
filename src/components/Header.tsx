import React from 'react';
import { ActiveScreen, School, UserAccount } from '../types';
import { MagnumLogo } from './MagnumLogo';

interface HeaderProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  cartCount: number;
  activeSchool: School;
  onOpenSearch: () => void;
  onOpenSupport: () => void;
  user?: UserAccount;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
  activeSchool,
  onOpenSearch,
  onOpenSupport,
  user,
}) => {
  const isAdminBadal = Boolean(
    user?.isLoggedIn &&
    user?.email?.trim().toLowerCase() === 'badal17patell@gmail.com'
  );

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-4xl mx-auto px-4 flex items-center justify-between gap-2">
        {/* Brand & Institution Info */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
        >
          <MagnumLogo variant="crest" size={36} className="shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-[17px] text-primary tracking-tight leading-none truncate">
              MAGNUM
            </span>
          </div>
        </button>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Support / Helpdesk Trigger */}
          <button
            onClick={onOpenSupport}
            aria-label="Support & Helpdesk"
            title="School Uniform Coordinator Support"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">
              help_outline
            </span>
          </button>

          {/* Admin Tailor Console Quick Switcher - strictly visible only to admin badal17patell@gmail.com */}
          {isAdminBadal && (
            <button
              aria-label="Master Tailor Console"
              onClick={() => onNavigate('admin')}
              title="Master Catalog & Inventory Console"
              className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                currentScreen === 'admin'
                  ? 'bg-primary text-secondary-fixed shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                admin_panel_settings
              </span>
              <span className="hidden sm:inline">Tailor Console</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            aria-label="Search uniform store"
            onClick={onOpenSearch}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          {/* Cart Icon with Live Counter */}
          <button
            aria-label={`Shopping Cart with ${cartCount} items`}
            onClick={() => onNavigate('cart')}
            className="w-9 h-9 relative flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-secondary text-on-secondary text-[9px] leading-[16px] rounded-full text-center font-bold shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile / Login Trigger */}
          {user?.isLoggedIn ? (
            <button
              onClick={() => onNavigate('account')}
              aria-label="Parent Account"
              title={`Logged in as ${user.name}`}
              className="w-9 h-9 flex items-center justify-center pl-1 shrink-0 group"
            >
              <img
                alt={user.name || 'Parent'}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent group-hover:ring-secondary transition-all"
                src={
                  user.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida/AEtjO1WdqKYFtNkOBysM4Y6KvU8SkPiXYGwzzrxfu5XdFg1MmmpSuxRaKjJXDDVqUw05mPCNIvZJ7rBGTHy0cqnUePCIuwGroE4jgLW8BQ4T_4Aswi9Td61Bj8nPCmv2GHuwjB7TxagLd4dqBnasGe2GNhsJvVAfBY9JbFzSzeOXoFD8urFIkT_DEOZN8_Dyj2KCBNCILm5eBIx9lHXpDCZgnpVsNAKXe_lmp7wdkPmUfJYRyn7-7rUOFX2-q4UQr29MGJVQOv2cjuc0rg'
                }
              />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-bold shadow-xs hover:bg-primary-container transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs text-secondary-fixed">
                login
              </span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
