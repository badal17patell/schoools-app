import React from 'react';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  cartCount,
}) => {
  const navItems: {
    screen: ActiveScreen;
    label: string;
    icon: string;
    badge?: number;
  }[] = [
    { screen: 'home', label: 'Home', icon: 'home' },
    { screen: 'store', label: 'School Store', icon: 'storefront' },
    { screen: 'cart', label: 'Cart', icon: 'shopping_bag', badge: cartCount },
    { screen: 'track-order', label: 'Track Order', icon: 'local_shipping' },
    { screen: 'account', label: 'Account', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.04)] border-t border-surface-container">
      <div className="h-16 max-w-4xl mx-auto flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.screen ||
            (item.screen === 'store' && currentScreen === 'product-details');

          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center justify-center min-w-[56px] h-12 relative transition-all active:scale-95 ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
              }`}
            >
              <div className="relative">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-secondary text-on-secondary text-[9px] leading-[16px] rounded-full text-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-secondary mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
