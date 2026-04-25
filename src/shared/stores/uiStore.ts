import { create } from 'zustand';

interface UIStore {
  isMobileMenuOpen: boolean;
  forceHideBottomNavbar: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setForceHideBottomNavbar: (hide: boolean) => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isMobileMenuOpen: false,
  forceHideBottomNavbar: false,
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setForceHideBottomNavbar: (hide) => set({ forceHideBottomNavbar: hide }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
