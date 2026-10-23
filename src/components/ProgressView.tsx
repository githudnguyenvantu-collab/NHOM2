import React, { useState } from 'react';
import { BodyMetricRecord, WorkoutSessionLog, UserProfile } from '../types';
import { TrendingUp, Scale, HeartPulse, CheckCircle2, Calendar, FileDown, Trash2, AlertTriangle } from 'lucide-react';

interface ProgressViewProps {
  metrics: BodyMetricRecord[];
  workoutLogs: WorkoutSessionLog[];
  profile: UserProfile;
  onOpenQuickMetrics: () => void;
  onOpenPdfModal: () => void;
  onDeleteMetric: (id: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  metrics,
  workoutLogs,
  profile,
  onOpenQuickMetrics,
  onOpenPdfModal,
  onDeleteMetric
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Stats calculation
  const totalWorkouts = workoutLogs.length;
  const totalMinutes = workoutLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const avgCompletionRate = totalWorkouts > 0
    ? Math.round(workoutLogs.reduce((sum, l) => sum + l.completionRatePercent, 0) / totalWorkouts)
    : 100;

  // Chart data: Chronological order (oldest to newest)
  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Simple SVG Line Chart for Weight
  const weights = sortedMetrics.map(m => m.weightKg);
  const minWeight = Math.min(...weights, 60) - 1;
  const maxWeight = Math.max(...weights, 70) + 1;
  const range = maxWeight - minWeight || 1;

  const chartWidth = 500;
  const chartHeight = 150;
  const padding = 20;

  const points = sortedMetrics.map((m, i) => {
    const x = padding + (i / Math.max(sortedMetrics.length - 1, 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((m.weightKg - minWeight) / range) * (chartHeight - 2 * padding);
    return { x, y, weight: m.weightKg, date: new Date(m.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) };
  });

  const svgPath = points.length > 1
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Nhật ký & Biểu đồ tiến độ thực tế
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Tiến độ & Biến động thể trạng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu được lưu trữ cục bộ, không tự tạo xu hướng giả khi chưa đủ dữ liệu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPdfModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Xuất báo cáo PDF</span>
          </button>
          <button
            onClick={onOpenQuickMetrics}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
          >
            + Nhập số đo mới
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng số buổi tập</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalWorkouts} buổi
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Hoàn thành theo lịch</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Tỷ lệ hoàn thành</span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {avgCompletionRate}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Đo lường kỷ luật cá nhân</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Thời lượng tích lũy</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalMinutes} phút
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Tập luyện thực tế</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Cân nặng hiện tại</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {metrics[0]?.weightKg || profile.weightKg} kg
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Mục tiêu: {profile.targetWeightKg || 68} kg</span>
        </div>
      </div>

      {/* Interactive Trend Chart for Weight */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Biểu đồ biến động cân nặng & thể trạng
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đường biểu diễn qua các lần đo ghi nhận thực tế (đơn vị: kg)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? '7 ngày' : r === '30d' ? '30 ngày' : 'Tất cả'}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart */}
        {sortedMetrics.length >= 2 ? (
          <div className="overflow-x-auto py-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeDasharray="4" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeDasharray="4" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f1f5f9" strokeDasharray="4" />

              {/* Line */}
              <path
                d={svgPath}
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-800 font-mono"
                  >
                    {p.weight}kg
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400 font-mono"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400">
            Chưa đủ từ 2 lần đo trở lên để vẽ biểu đồ xu hướng. Hãy bấm nút "Nhập số đo mới" ở trên để ghi nhận thêm.
          </div>
        )}
      </div>

      {/* Metrics History Table (Section 10) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base">
            Lịch sử các lần nhập chỉ số
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng: {metrics.length} lần đo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Thời điểm đo</th>
                <th className="py-2.5 px-3">Cân nặng</th>
                <th className="py-2.5 px-3">BMI</th>
                <th className="py-2.5 px-3">Huyết áp</th>
                <th className="py-2.5 px-3">Nhịp tim nghỉ</th>
                <th className="py-2.5 px-3">Trạng thái an toàn</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {new Date(m.date).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-3 font-bold font-mono text-slate-900">
                    {m.weightKg} kg
                    {m.flaggedWeightJump && (
                      <span className="ml-1 text-[10px] text-amber-600 font-semibold" title="Thay đổi > 2kg">
                        (Lưu ý &gt;2kg)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.bmi}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.systolicBp ? `${m.systolicBp}/${m.diastolicBp} mmHg` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {m.restingHeartRate ? `${m.restingHeartRate} bpm` : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.safetyTier === 'high_alert'
                          ? 'bg-red-100 text-red-800'
                          : m.safetyTier === 'caution'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.safetyTier === 'high_alert' ? 'Cảnh báo cao' : m.safetyTier === 'caution' ? 'Cần theo dõi' : 'Bình thường'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onDeleteMetric(m.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                      title="Xóa bản ghi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
