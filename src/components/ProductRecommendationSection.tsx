import React, { useState } from 'react';
import { ShoppingBag, Filter, ArrowUpDown, ShieldCheck, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { ProductItem, UserProfile, HealthSafetyAssessment } from '../types';
import { recommendProducts } from '../utils/rules';
import { PRODUCT_CATALOG } from '../data/mockData';

interface ProductRecommendationSectionProps {
  profile: UserProfile;
  safety: HealthSafetyAssessment;
  onAddToCart: (product: ProductItem) => void;
  onNavigateToCostComparison: () => void;
}

export const ProductRecommendationSection: React.FC<ProductRecommendationSectionProps> = ({
  profile,
  safety,
  onAddToCart,
  onNavigateToCostComparison
}) => {
  const [sortOrder, setSortOrder] = useState<'price_asc' | 'price_desc' | 'priority'>('price_asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // Apply safety & budget recommendation algorithm
  const { recommendedList, filteredOutList, totalInvestmentVnd } = recommendProducts(
    PRODUCT_CATALOG,
    profile,
    safety,
    null,
    sortOrder
  );

  const filteredProducts = recommendedList.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const handleAdd = (product: ProductItem) => {
    onAddToCart(product);
    setAddedIds(ids => [...ids, product.id]);
    setTimeout(() => {
      setAddedIds(ids => ids.filter(id => id !== product.id));
    }, 1500);
  };

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Header Required by Section 23 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Giải pháp trang bị tiết kiệm cho người dùng Việt Nam
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            Gợi ý sản phẩm phù hợp với bạn
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Tự động lọc theo mục tiêu ({profile.workoutGoal === 'muscle_gain' ? 'Tăng cơ' : profile.workoutGoal === 'fat_loss' ? 'Giảm mỡ' : 'Sức bền'}), ngân sách và mức an toàn sức khỏe của bạn.
          </p>
        </div>

        {/* Total Investment & Cost Comparison Quick Link */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 px-4">
          <div>
            <div className="text-[10px] text-emerald-800 font-semibold uppercase">
              Tổng đầu tư tối thiểu
            </div>
            <div className="text-base font-extrabold text-emerald-900 font-mono">
              {formatVnd(totalInvestmentVnd)}
            </div>
          </div>
          <button
            onClick={onNavigateToCostComparison}
            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition-colors whitespace-nowrap shadow-xs"
          >
            So sánh với phòng Gym
          </button>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pills (Functional filter buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'band', label: 'Dây kháng lực' },
            { id: 'mat', label: 'Thảm tập' },
            { id: 'pullup', label: 'Xà đơn' },
            { id: 'dumbbell', label: 'Tạ tay' },
            { id: 'support', label: 'Hỗ trợ phục hồi' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Order Selector (Mặc định: Giá thấp đến cao) */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-medium">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as any)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-emerald-500"
          >
            <option value="price_asc">Giá thấp đến cao (Mặc định)</option>
            <option value="price_desc">Giá cao đến thấp</option>
            <option value="priority">Mức độ cần thiết</option>
          </select>
        </div>
      </div>

      {/* Filtered Out Safety Warning if active */}
      {filteredOutList.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Hệ thống đã ẩn {filteredOutList.length} sản phẩm theo quy tắc an toàn hoặc sở hữu:</span>
          </div>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
            {filteredOutList.map((item, idx) => (
              <li key={idx}>
                <span className="font-semibold text-slate-800">{item.product.name}:</span> {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(product => {
          const isAdded = addedIds.includes(product.id);
          const isEssential = product.necessityLevel === 'essential';
          const isRecommended = product.necessityLevel === 'recommended';

          return (
            <div
              key={product.id}
              className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md bg-white group"
            >
              <div className="space-y-3">
                {/* Product Image & Badges */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
                        isEssential
                          ? 'bg-emerald-600 text-white'
                          : isRecommended
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {isEssential ? 'Cực kỳ cần thiết' : isRecommended ? 'Nên có' : 'Tùy chọn thêm'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded">
                    [Dữ liệu minh họa VN]
                  </div>
                </div>

                {/* Name & Pricing */}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {product.name}
                  </h3>
                  <div className="text-base font-black text-emerald-700 font-mono mt-1">
                    {formatVnd(product.priceVnd)}
                  </div>
                </div>

                {/* Description & Recommendation reason */}
                <p className="text-xs text-slate-600 line-clamp-2">
                  {product.description}
                </p>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  <div>
                    <span className="font-semibold text-emerald-800">Lý do gợi ý: </span>
                    <span className="text-slate-700">{product.recommendationReason}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Lưu ý an toàn: </span>
                    <span className="text-slate-500">{product.safetyNotes}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  Cập nhật: {product.updatedDate}
                </span>

                <button
                  onClick={() => handleAdd(product)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAdded
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã thêm</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Thêm vào giỏ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
