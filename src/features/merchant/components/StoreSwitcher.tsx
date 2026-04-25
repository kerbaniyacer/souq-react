import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Store, Plus, CheckCircle } from 'lucide-react';
import { useStoreStore, selectActiveStore } from '@shared/stores/storeStore';

export default function StoreSwitcher() {
  const navigate = useNavigate();
  const { stores, activeStoreId, setActiveStore } = useStoreStore();
  const activeStore = useStoreStore(selectActiveStore);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (stores.length === 0) {
    return (
      <button
        onClick={() => navigate('/merchant/store-management')}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-bold hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
      >
        <Plus className="w-4 h-4" />
        إنشاء متجرك الأول
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222222] transition-all shadow-sm"
      >
        {/* Logo / Initial */}
        <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
          {activeStore?.logo ? (
            <img src={activeStore.logo} alt={activeStore.name} className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <span className="text-xs font-black text-primary-500">
              {activeStore?.name?.[0]?.toUpperCase() ?? <Store className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
        <span className="max-w-[120px] truncate">{activeStore?.name ?? 'اختر متجراً'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Store list */}
          <div className="p-2 space-y-1">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => { setActiveStore(store.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-right ${
                  activeStoreId === store.id
                    ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-[#252525] text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  {store.logo ? (
                    <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-xl object-cover" />
                  ) : (
                    <span className="text-sm font-black text-primary-500">{store.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-sm font-bold truncate">{store.name}</p>
                  {store.category && (
                    <p className="text-[10px] text-gray-400 truncate">{store.category}</p>
                  )}
                </div>
                {activeStoreId === store.id && (
                  <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 mx-2" />

          {/* Create new store */}
          <div className="p-2">
            <button
              onClick={() => { setOpen(false); navigate('/merchant/store-management'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] text-gray-600 dark:text-gray-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#252525] flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">إنشاء متجر جديد</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
