import React, { useState } from 'react';
import { CartItem, OrderRecord } from '../types';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2, ArrowRight, QrCode, Truck, ShieldCheck, Clock } from 'lucide-react';

interface CartOrderViewProps {
  cartItems: CartItem[];
  orders: OrderRecord[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutOrder: (order: OrderRecord) => void;
  onNavigateToCatalog: () => void;
}

export const CartOrderView: React.FC<CartOrderViewProps> = ({
  cartItems,
  orders,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutOrder,
  onNavigateToCatalog
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [fullName, setFullName] = useState('Nguyễn Văn Tú');
  const [phone, setPhone] = useState('0987654321');
  const [address, setAddress] = useState('Số 1 Đại Cồ Việt, Hai Bà Trưng');
  const [city, setCity] = useState('Hà Nội');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vietqr' | 'momo'>('cod');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.priceVnd * item.quantity, 0);
  // Free shipping policy from Section 31: Free >= 500.000 VNĐ
  const FREE_SHIPPING_THRESHOLD = 500000;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 30000;
  const total = Math.max(subtotal + shippingFee - appliedDiscount, 0);

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountCode.trim().toUpperCase() === 'DISCI10') {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      alert(`Đã áp dụng mã giảm giá 10% (-${formatVnd(discount)})!`);
    } else {
      alert('Mã giảm giá không hợp lệ. Bạn có thể thử mã "DISCI10" cho đơn đầu tiên.');
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setIsCheckingOut(true);

    const newOrder: OrderRecord = {
      id: `DISCI_${Date.now().toString().slice(-6)}`,
      items: [...cartItems],
      subtotalVnd: subtotal,
      shippingFeeVnd: shippingFee,
      totalVnd: total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      deliveryStatus: 'processing',
      shippingAddress: {
        fullName,
        phone,
        address,
        city
      },
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      onCheckoutOrder(newOrder);
      setCreatedOrder(newOrder);
      setIsCheckingOut(false);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Trang bị thể thao đối tác
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
              Phân hệ mở rộng sau MVP
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Giỏ hàng & Đơn hàng thiết bị
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dụng cụ chính hãng giá rẻ từ các đối tác liên kết của DISCI
          </p>
        </div>

        {/* Tab switcher: Giỏ hàng vs Lịch sử đơn */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('cart'); setCreatedOrder(null); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'cart' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Giỏ hàng ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Lịch sử đơn ({orders.length})
          </button>
        </div>
      </div>

      {activeTab === 'cart' ? (
        createdOrder ? (
          /* Order success confirmation */
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900">
              Đặt hàng thành công! Mã đơn #{createdOrder.id}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cảm ơn bạn đã lựa chọn trang bị tại DISCI. Đơn hàng đang được chuẩn bị và chuyển cho đối tác vận chuyển giao tới địa chỉ của bạn.
            </p>

            {createdOrder.paymentMethod === 'vietqr' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Mã thanh toán VietQR (Demo chuyển khoản):
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <div>Ngân hàng: <span className="font-semibold text-slate-800">MB Bank (Quân Đội)</span></div>
                  <div>Số tài khoản: <span className="font-mono font-bold text-slate-900">0987654321</span></div>
                  <div>Số tiền: <span className="font-mono font-bold text-emerald-700">{formatVnd(createdOrder.totalVnd)}</span></div>
                  <div>Nội dung: <span className="font-mono font-bold text-slate-900">{createdOrder.id}</span></div>
                </div>
                <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg">
                  Lưu ý: Môi trường Demo. Hệ thống tự động ghi nhận trạng thái đơn và lưu vào lịch sử.
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveTab('orders')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
            >
              Xem trạng thái đơn hàng của tôi
            </button>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty cart */
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Giỏ hàng của bạn đang trống</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bạn chưa thêm dụng cụ thể thao nào. Hãy xem danh mục gợi ý sản phẩm phù hợp dưới báo cáo thể trạng.
            </p>
            <button
              onClick={onNavigateToCatalog}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Khám phá dụng cụ tiết kiệm
            </button>
          </div>
        ) : (
          /* Active cart & Checkout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Sản phẩm trong giỏ ({cartItems.length})
                  </h3>
                  {subtotal < FREE_SHIPPING_THRESHOLD ? (
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Mua thêm {formatVnd(FREE_SHIPPING_THRESHOLD - subtotal)} để được MIỄN PHÍ VẬN CHUYỂN
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      ✓ Đủ điều kiện MIỄN PHÍ VẬN CHUYỂN
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {cartItems.map(item => (
                    <div key={item.productId} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {item.product.name}
                          </h4>
                          <div className="text-emerald-700 font-bold font-mono text-xs mt-0.5">
                            {formatVnd(item.product.priceVnd)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 font-mono font-bold text-xs text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voucher Code Box */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
                <input
                  type="text"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  placeholder="Nhập mã giảm giá (thử mã DISCI10)"
                  className="flex-1 h-10 px-3 text-xs rounded-xl border border-slate-200 uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Checkout & Delivery Form */}
            <div className="space-y-4">
              <form onSubmit={handlePlaceOrder} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Thông tin nhận hàng
                </h3>

                <div className="space-y-2">
                  <div>
                    <label className="text-slate-600 block mb-1">Họ tên người nhận</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Địa chỉ nhận hàng (phòng trọ / nhà)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block mb-1">Tỉnh / Thành phố</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="font-bold text-slate-800 block">Phương thức thanh toán:</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-emerald-600"
                      />
                      <span className="font-semibold text-slate-800">Thanh toán khi nhận hàng (COD)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'vietqr'}
                        onChange={() => setPaymentMethod('vietqr')}
                        className="text-emerald-600"
                      />
                      <span className="font-semibold text-slate-800">Chuyển khoản QR (VietQR)</span>
                    </label>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền hàng:</span>
                    <span className="font-mono text-slate-800">{formatVnd(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-mono text-slate-800">{shippingFee === 0 ? 'Miễn phí' : formatVnd(shippingFee)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Mã giảm giá:</span>
                      <span className="font-mono">-{formatVnd(appliedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Tổng thanh toán:</span>
                    <span className="font-mono text-emerald-700 text-base">{formatVnd(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs"
                >
                  {isCheckingOut ? 'Đang gửi đơn hàng...' : 'Xác nhận đặt hàng ngay'}
                </button>
              </form>
            </div>
          </div>
        )
      ) : (
        /* Orders History Tab */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-xs text-slate-500">
              Bạn chưa có đơn hàng nào trước đây.
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Đơn hàng #{order.id}</span>
                    <div className="text-[11px] text-slate-400">
                      Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {order.deliveryStatus === 'processing' ? 'Đang đóng gói' : order.deliveryStatus === 'shipping' ? 'Đang giao' : 'Đã giao'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {order.items.map(item => (
                    <div key={item.productId} className="flex justify-between text-slate-600">
                      <span>{item.product.name} (x{item.quantity})</span>
                      <span className="font-mono font-semibold text-slate-800">{formatVnd(item.product.priceVnd * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
                  <span className="text-slate-800">Tổng thanh toán ({order.paymentMethod.toUpperCase()}):</span>
                  <span className="text-emerald-700 font-mono text-sm">{formatVnd(order.totalVnd)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
