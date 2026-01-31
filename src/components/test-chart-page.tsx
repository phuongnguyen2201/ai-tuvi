"use client";

import React, { useState, useEffect } from "react";
import TuViChartDisplay from "@/components/TuViChartDisplay";
import {
  createTuViChart,
  getChartSummary,
  getBirthHourName,
  type TuViChart,
  type BirthInfo,
} from "@/lib/tuvi/tuviChart";
import { solarToLunar, THIEN_CAN, DIA_CHI } from "@/lib/tuvi/lunarCalendar";
import { getNguHanhNapAm } from "@/lib/tuvi/nguHanh";

// Map star ID to Vietnamese name for Tu Hoa display
const STAR_NAMES: Record<string, string> = {
  "tu-vi": "Tử Vi",
  "liem-trinh": "Liêm Trinh",
  "thien-dong": "Thiên Đồng",
  "vu-khuc": "Vũ Khúc",
  "thai-duong": "Thái Dương",
  "thien-co": "Thiên Cơ",
  "thien-phu": "Thiên Phủ",
  "thai-am": "Thái Âm",
  "tham-lang": "Tham Lang",
  "cu-mon": "Cự Môn",
  "thien-tuong": "Thiên Tướng",
  "thien-luong": "Thiên Lương",
  "that-sat": "Thất Sát",
  "pha-quan": "Phá Quân",
  "van-xuong": "Văn Xương",
  "van-khuc": "Văn Khúc",
  "ta-phu": "Tả Phù",
  "huu-bat": "Hữu Bật",
};

export default function TestChartPage() {
  const [chart, setChart] = useState<TuViChart | null>(null);
  const [birthInfoDisplay, setBirthInfoDisplay] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [solarDay, setSolarDay] = useState(25);
  const [solarMonth, setSolarMonth] = useState(10);
  const [solarYear, setSolarYear] = useState(1979);
  const [birthHour, setBirthHour] = useState(1); // 1:30 AM
  const [gender, setGender] = useState<"male" | "female">("male");

  const generateChart = () => {
    try {
      setError(null);

      // Convert solar to lunar
      const solarDate = new Date(solarYear, solarMonth - 1, solarDay);
      const lunar = solarToLunar(solarDate);

      // Get birth hour index - now birthHour IS the index (0-11)
      const birthHourIndex = birthHour;

      // Calculate Can Chi indices
      const canNamIndex = (solarYear - 4) % 10;
      const chiNamIndex = (solarYear - 4) % 12;

      // Create birth info
      const birthInfo: BirthInfo = {
        lunarDay: lunar.day,
        lunarMonth: lunar.month,
        lunarYear: lunar.year,
        birthHourIndex,
        canNamIndex,
        chiNamIndex,
        gender,
      };

      // Generate chart
      const newChart = createTuViChart(birthInfo);
      setChart(newChart);

      // Get Ngu Hanh Nap Am
      const canName = THIEN_CAN[canNamIndex].name;
      const chiName = DIA_CHI[chiNamIndex].name;
      const napAm = getNguHanhNapAm(canName, chiName);
      const canChiName = `${canName} ${chiName}`;

      // Set display info
      setBirthInfoDisplay({
        canChi: canChiName,
        nguHanh: napAm?.name || "N/A",
        napAm: napAm?.napAm || "N/A",
        lunarDate: `${lunar.day}/${lunar.month}/${lunar.year}`,
        birthHour: `Giờ ${getBirthHourName(birthHourIndex)}`,
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
      console.error(err);
    }
  };

  // Generate on mount with default values
  useEffect(() => {
    generateChart();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-amber-400 mb-8">🔮 Test Lá Số Tử Vi</h1>

        {/* Input Form */}
        <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-amber-600/30">
          <h2 className="text-lg font-semibold text-amber-300 mb-4">Nhập thông tin ngày sinh</h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ngày (DL)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={solarDay}
                onChange={(e) => setSolarDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tháng (DL)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={solarMonth}
                onChange={(e) => setSolarMonth(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Năm (DL)</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={solarYear}
                onChange={(e) => setSolarYear(parseInt(e.target.value) || 1979)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Giờ sinh (âm lịch)</label>
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value={0}>Giờ Tý (23:00 - 00:59)</option>
                <option value={1}>Giờ Sửu (01:00 - 02:59)</option>
                <option value={2}>Giờ Dần (03:00 - 04:59)</option>
                <option value={3}>Giờ Mão (05:00 - 06:59)</option>
                <option value={4}>Giờ Thìn (07:00 - 08:59)</option>
                <option value={5}>Giờ Tỵ (09:00 - 10:59)</option>
                <option value={6}>Giờ Ngọ (11:00 - 12:59)</option>
                <option value={7}>Giờ Mùi (13:00 - 14:59)</option>
                <option value={8}>Giờ Thân (15:00 - 16:59)</option>
                <option value={9}>Giờ Dậu (17:00 - 18:59)</option>
                <option value={10}>Giờ Tuất (19:00 - 20:59)</option>
                <option value={11}>Giờ Hợi (21:00 - 22:59)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateChart}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
          >
            Lập Lá Số
          </button>
        </div>

        {/* Error */}
        {error && <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">{error}</div>}

        {/* Chart Summary */}
        {chart && (
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-amber-600/30">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Thông tin lá số</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-400">Cục:</span>
                <div className="font-semibold text-cyan-300">{chart.cucName}</div>
              </div>
              <div>
                <span className="text-gray-400">Cung Mệnh:</span>
                <div className="font-semibold text-yellow-300">{chart.cung.find((c) => c.isMenh)?.diaChi || "N/A"}</div>
              </div>
              <div>
                <span className="text-gray-400">Cung Thân:</span>
                <div className="font-semibold text-cyan-300">{chart.cung.find((c) => c.isThan)?.diaChi || "N/A"}</div>
              </div>
              <div>
                <span className="text-gray-400">Tử Vi tại:</span>
                <div className="font-semibold text-purple-300">
                  {chart.cung.find((c) => c.chinhTinh.some((s) => s.id === "tu-vi"))?.diaChi || "N/A"}
                </div>
              </div>
            </div>

            {/* Tứ Hóa */}
            <div className="border-t border-amber-600/30 pt-3 mt-3">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">Tứ Hóa</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-green-900/30 rounded p-2">
                  <span className="text-green-400 font-semibold">Hóa Lộc:</span>
                  <div className="text-green-300">{STAR_NAMES[chart.tuHoa.hoaLoc] || chart.tuHoa.hoaLoc}</div>
                </div>
                <div className="bg-blue-900/30 rounded p-2">
                  <span className="text-blue-400 font-semibold">Hóa Quyền:</span>
                  <div className="text-blue-300">{STAR_NAMES[chart.tuHoa.hoaQuyen] || chart.tuHoa.hoaQuyen}</div>
                </div>
                <div className="bg-purple-900/30 rounded p-2">
                  <span className="text-purple-400 font-semibold">Hóa Khoa:</span>
                  <div className="text-purple-300">{STAR_NAMES[chart.tuHoa.hoaKhoa] || chart.tuHoa.hoaKhoa}</div>
                </div>
                <div className="bg-red-900/30 rounded p-2">
                  <span className="text-red-400 font-semibold">Hóa Kỵ:</span>
                  <div className="text-red-300">{STAR_NAMES[chart.tuHoa.hoaKy] || chart.tuHoa.hoaKy}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Display */}
        {chart && birthInfoDisplay && (
          <TuViChartDisplay
            chart={chart}
            birthInfo={birthInfoDisplay}
            onCungClick={(cung) => console.log("Clicked cung:", cung)}
          />
        )}

        {/* Phu Tinh Stats */}
        {chart && (
          <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-amber-600/30">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Thống kê Phụ Tinh</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-900/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">
                  {chart.cung.reduce((sum, c) => sum + (c.phuTinh?.filter((pt) => pt.nature === "cát").length || 0), 0)}
                </div>
                <div className="text-sm text-green-300">Cát Tinh</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-400">
                  {chart.cung.reduce(
                    (sum, c) => sum + (c.phuTinh?.filter((pt) => pt.nature === "trung_tính").length || 0),
                    0,
                  )}
                </div>
                <div className="text-sm text-gray-300">Trung Tính</div>
              </div>
              <div className="bg-red-900/30 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">
                  {chart.cung.reduce(
                    (sum, c) => sum + (c.phuTinh?.filter((pt) => pt.nature === "hung").length || 0),
                    0,
                  )}
                </div>
                <div className="text-sm text-red-300">Hung Tinh</div>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {chart && (
          <details className="mt-8 bg-slate-800/30 rounded-lg p-4">
            <summary className="cursor-pointer text-gray-400 hover:text-white">Debug Info (Click to expand)</summary>
            <pre className="mt-4 text-xs text-gray-400 overflow-auto max-h-[400px]">
              {JSON.stringify({ chart, birthInfoDisplay }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
