import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Star, Send, Package, Store, Check, Image as ImageIcon, X, Truck } from 'lucide-react';
import { ordersApi, reviewsApi } from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';

export default function OrderReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'products' | 'merchants'>('products');
  
  const [reviews, setReviews] = useState<Record<number, { 
    rating: number; 
    comment: string; 
    submitted: boolean;
    images: File[];
    imagePreviews: string[];
  }>>({});

  const [merchantReviews, setMerchantReviews] = useState<Record<number, {
    rating: number;
    shipping_rating: number;
    comment: string;
    submitted: boolean;
  }>>({});

  useEffect(() => {
    ordersApi.detail(Number(id)).then((res) => {
      setOrder(res.data);
      
      // Initialize products reviews
      const initialReviews: any = {};
      res.data.items.forEach((item: any) => {
        initialReviews[item.id] = { 
          rating: 5, 
          comment: '', 
          submitted: !!item.is_rated, 
          images: [], 
          imagePreviews: [] 
        };
      });
      setReviews(initialReviews);

      // Initialize merchant reviews
      const initialMerchants: any = {};
      res.data.sub_orders?.forEach((sub: any) => {
        initialMerchants[sub.id] = { 
          rating: 5, 
          shipping_rating: 5, 
          comment: '', 
          submitted: !!sub.is_rated_by_buyer 
        };
      });
      setMerchantReviews(initialMerchants);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleRatingChange = (itemId: number, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating }
    }));
  };

  const handleImageChange = (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setReviews(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId], 
        images: [...prev[itemId].images, ...files],
        imagePreviews: [...prev[itemId].imagePreviews, ...newPreviews]
      }
    }));
  };

  const removeImage = (itemId: number, index: number) => {
    setReviews(prev => {
      const newImages = [...prev[itemId].images];
      const newPreviews = [...prev[itemId].imagePreviews];
      newImages.splice(index, 1);
      newPreviews.splice(index, 1);
      return {
        ...prev,
        [itemId]: { ...prev[itemId], images: newImages, imagePreviews: newPreviews }
      };
    });
  };

  const submitReview = async (itemId: number, productId: number) => {
    const reviewData = reviews[itemId];
    if (reviewData.submitted) return;

    try {
      await reviewsApi.create(productId, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        images: reviewData.images
      });
      setReviews(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], submitted: true }
      }));
      toast.success('تم إرسال تقييم المنتج بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال التقييم');
    }
  };

  const submitMerchantReview = async (subOrderId: number) => {
    const mData = merchantReviews[subOrderId];
    if (mData.submitted) return;

    try {
      await reviewsApi.rateMerchant(subOrderId, {
        rating: mData.rating,
        shipping_rating: mData.shipping_rating,
        comment: mData.comment
      });
      setMerchantReviews(prev => ({
        ...prev,
        [subOrderId]: { ...prev[subOrderId], submitted: true }
      }));
      toast.success('تم إرسال تقييم التاجر بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال تقييم التاجر');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  // Check if all product reviews are submitted
  const allProductsSubmitted = Object.values(reviews).every(r => r.submitted);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
            {step === 'products' ? 'تقييم المنتجات' : 'تقييم التاجر والشحن'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-1">للطلب #{order.order_number}</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center gap-4 mb-10 px-4">
        <div className={`flex-1 h-2 rounded-full transition-all ${step === 'products' ? 'bg-primary-500' : 'bg-green-500'}`} />
        <div className={`flex-1 h-2 rounded-full transition-all ${step === 'merchants' ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
      </div>

      {step === 'products' ? (
        <div className="space-y-8">
          {order.items.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm relative overflow-hidden">
              {reviews[item.id]?.submitted && (
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-in zoom-in">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-bold font-arabic">تم التقييم</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex gap-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 shrink-0">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-sm line-clamp-2">{item.product_name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic mt-1">{item.variant_name}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(item.id, star)}
                        className={`p-1 transition-all ${star <= reviews[item.id].rating ? 'text-yellow-400 scale-110' : 'text-gray-200 dark:text-gray-700'}`}
                      >
                        <Star className={`w-8 h-8 ${star <= reviews[item.id].rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviews[item.id].comment}
                    onChange={(e) => setReviews(prev => ({ ...prev, [item.id]: { ...prev[item.id], comment: e.target.value } }))}
                    placeholder="اكتب رأيك في المنتج هنا..."
                    className="w-full h-24 p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 resize-none dark:text-gray-200"
                  />

                  {/* Image Upload */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      {reviews[item.id].imagePreviews.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                          <img src={url} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removeImage(item.id, idx)}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviews[item.id].imagePreviews.length < 5 && (
                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-all">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[10px] font-arabic mt-1">أضف صورة</span>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageChange(item.id, e)} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => !reviews[item.id].submitted && submitReview(item.id, item.product_id)}
                      disabled={reviews[item.id].submitted}
                      className="px-6 py-2.5 bg-primary-400 text-white rounded-xl font-arabic font-bold hover:bg-primary-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviews[item.id].submitted ? (
                        <><Check className="w-4 h-4" /> تم الإرسال</>
                      ) : (
                        <><Send className="w-4 h-4" /> إرسال التقييم</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-8">
            <button 
              onClick={() => setStep('merchants')}
              disabled={!allProductsSubmitted}
              className="px-10 py-4 bg-primary-500 text-white rounded-2xl font-bold font-arabic hover:bg-primary-600 disabled:opacity-50 transition-all shadow-xl shadow-primary-500/20"
            >
              الخطوة التالية: تقييم التاجر والشحن
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left duration-300">
          {order.sub_orders?.map((sub: any) => (
            <div key={sub.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden">
              {merchantReviews[sub.id]?.submitted && (
                <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl">
                    <Check className="w-5 h-5" />
                    <span className="font-bold font-arabic">تم تقييم التاجر</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-8">
                <Store className="w-6 h-6 text-primary-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">التاجر: {sub.seller_username}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Merchant Rating */}
                <div className="space-y-4">
                  <p className="font-bold text-gray-700 dark:text-gray-300 font-arabic text-sm">كيف كانت تجربتك مع التاجر؟</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMerchantReviews(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], rating: star } }))}
                        className={`p-1 transition-all ${star <= merchantReviews[sub.id].rating ? 'text-yellow-400 scale-110' : 'text-gray-200 dark:text-gray-700'}`}
                      >
                        <Star className={`w-10 h-10 ${star <= merchantReviews[sub.id].rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shipping Rating */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary-500" />
                    <p className="font-bold text-gray-700 dark:text-gray-300 font-arabic text-sm">كيف كان الشحن والتوصيل؟</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMerchantReviews(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], shipping_rating: star } }))}
                        className={`p-1 transition-all ${star <= merchantReviews[sub.id].shipping_rating ? 'text-primary-500 scale-110' : 'text-gray-200 dark:text-gray-700'}`}
                      >
                        <Star className={`w-10 h-10 ${star <= merchantReviews[sub.id].shipping_rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <textarea
                  value={merchantReviews[sub.id].comment}
                  onChange={(e) => setMerchantReviews(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], comment: e.target.value } }))}
                  placeholder="أضف تعليقاً عن التاجر أو عملية الشحن..."
                  className="w-full h-24 p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 resize-none dark:text-gray-200"
                />
                
                <div className="flex justify-end">
                  <button
                    onClick={() => !merchantReviews[sub.id].submitted && submitMerchantReview(sub.id)}
                    disabled={merchantReviews[sub.id].submitted}
                    className="px-8 py-3 bg-primary-500 text-white rounded-xl font-bold font-arabic hover:bg-primary-600 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {merchantReviews[sub.id].submitted ? (
                      <><Check className="w-4 h-4" /> تم الإرسال</>
                    ) : (
                      <><Send className="w-4 h-4" /> إرسال تقييم التاجر</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-8">
            <button 
              onClick={() => setStep('products')}
              className="px-8 py-4 text-gray-500 font-bold font-arabic hover:text-gray-700 transition-all"
            >
              ← العودة لتقييم المنتجات
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="px-12 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl font-bold font-arabic hover:opacity-90 transition-all"
            >
              إنهاء والعودة للطلبات
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
