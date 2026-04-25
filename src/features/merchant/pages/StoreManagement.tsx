import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Plus, Edit2, CheckCircle, Package, Star, LayoutDashboard, Trash2, AlertCircle, X } from 'lucide-react';
import { useStoreStore } from '@shared/stores/storeStore';
import { productsApi } from '@shared/services/api';
import type { Store as StoreType, Product } from '@shared/types';

interface StoreFormData {
  name: string;
  description: string;
  category: string;
}

const emptyForm: StoreFormData = { name: '', description: '', category: '' };

export default function StoreManagement() {
  const { stores, isLoading, loadStores, createStore, updateStore, deleteStore, setActiveStore, activeStoreId } =
    useStoreStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StoreFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; storeId: number; storeName: string; products: Product[]; loading: boolean } | null>(null);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleOpenCreate = () => {
    setShowCreateForm(true);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleOpenEdit = (store: StoreType) => {
    setEditingId(store.id);
    setShowCreateForm(false);
    setForm({ name: store.name, description: '', category: store.category });
    setError('');
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('اسم المتجر مطلوب');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createStore({ name: form.name.trim(), description: form.description, category: form.category });
      setShowCreateForm(false);
      setForm(emptyForm);
    } catch {
      setError('حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!form.name.trim()) {
      setError('اسم المتجر مطلوب');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateStore(id, { name: form.name.trim(), description: form.description, category: form.category });
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      setError('حدث خطأ أثناء تحديث المتجر. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setDeleteModal({ isOpen: true, storeId: id, storeName: name, products: [], loading: true });
    try {
      const res = await productsApi.myProducts({ store: String(id) });
      const storeProducts = (res.data as Product[]).filter(p => String(p.store?.id) === String(id));
      setDeleteModal(prev => prev ? { ...prev, products: storeProducts, loading: false } : null);
    } catch {
      setDeleteModal(prev => prev ? { ...prev, loading: false } : null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteStore(deleteModal.storeId);
      setDeleteModal(null);
    } catch {
      setError('حدث خطأ أثناء حذف المتجر.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0A] font-arabic" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">إدارة المتاجر</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">متاجري</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">أنشئ متاجر متعددة وأدر منتجاتك بكفاءة</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" />
            متجر جديد
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-6 animate-in slide-in-from-top-2 duration-300">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-400" />
              إنشاء متجر جديد
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">اسم المتجر *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="مثال: متجر الإلكترونيات"
                  className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">التصنيف</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="مثال: إلكترونيات، ملابس..."
                  className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">الوصف</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="وصف مختصر عن متجرك..."
                className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400 transition-colors resize-none"
              />
            </div>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
              >
                {saving ? 'جاري الإنشاء...' : 'إنشاء المتجر'}
              </button>
              <button
                onClick={handleCancelForm}
                className="px-6 py-2.5 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Stores List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-50 dark:border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : stores.length === 0 && !showCreateForm ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/10 rounded-[2rem] flex items-center justify-center mb-6">
              <Store className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">لا يوجد متاجر بعد</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs">أنشئ متجرك الأول لتبدأ في إضافة المنتجات وإدارة مبيعاتك</p>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              إنشاء متجرك الأول
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map(store => (
              <div
                key={store.id}
                className={`bg-white dark:bg-[#1A1A1A] rounded-[2rem] border transition-all ${
                  activeStoreId === store.id
                    ? 'border-primary-400/50 shadow-lg shadow-primary-400/10'
                    : 'border-gray-100 dark:border-gray-800 shadow-sm'
                }`}
              >
                {editingId === store.id ? (
                  /* Edit Form */
                  <div className="p-6">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-primary-400" />
                      تعديل المتجر
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">اسم المتجر *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">التصنيف</label>
                        <input
                          type="text"
                          value={form.category}
                          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-primary-400 transition-colors"
                        />
                      </div>
                    </div>
                    {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdate(store.id)}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </button>
                      <button
                        onClick={handleCancelForm}
                        className="px-6 py-2.5 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Store Card */
                  <div className="p-6 flex items-center gap-5">
                    {/* Logo / Initials */}
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center shrink-0">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-14 h-14 rounded-2xl object-cover" />
                      ) : (
                        <span className="text-xl font-black text-primary-500">{store.name[0]?.toUpperCase()}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{store.name}</h3>
                        {activeStoreId === store.id && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full">
                            نشط
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            store.status === 'active'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {store.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                      </div>
                      {store.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{store.category}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Package className="w-3.5 h-3.5" />
                          {store.products_count ?? 0} منتج
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {Number(store.rating).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {activeStoreId !== store.id && (
                        <button
                          onClick={() => setActiveStore(store.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          تعيين كنشط
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(store)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        تعديل
                      </button>
                      <Link
                        to={`/merchant/stores/${store.id}/dashboard`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        لوحة التحكم
                      </Link>
                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg rounded-3xl p-8 border border-gray-100 dark:border-[#2E2E2E] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <button onClick={() => setDeleteModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2">
              تأكيد حذف المتجر "{deleteModal.storeName}"
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mb-6 shrink-0">
              سيتم حذف هذا المتجر وجميع المنتجات المرتبطة به نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </p>

            <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic mb-3">المنتجات التي سيتم حذفها:</h4>
              {deleteModal.loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 font-arabic">
                  <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  جاري تحميل قائمة المنتجات...
                </div>
              ) : deleteModal.products.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic bg-gray-50 dark:bg-[#252525] p-4 rounded-xl border border-gray-100 dark:border-[#2E2E2E]">لا توجد منتجات في هذا المتجر.</p>
              ) : (
                <div className="space-y-2">
                  {deleteModal.products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                      <div className="w-10 h-10 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-100 dark:border-[#2E2E2E] overflow-hidden shrink-0">
                        {p.main_image || p.images?.[0]?.image ? (
                          <img src={p.main_image || p.images?.[0]?.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#252525]">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">SKU: {p.sku}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-auto shrink-0">
              <button 
                onClick={confirmDelete} 
                disabled={deleteModal.loading}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-bold font-arabic shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                نعم، احذف المتجر والمنتجات
              </button>
              <button 
                onClick={() => setDeleteModal(null)} 
                className="flex-1 py-3.5 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-2xl font-bold font-arabic hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
