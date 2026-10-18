import React from 'react';
import {
  RotateCcw,
  Printer,
  History,
  CheckCircle2,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Target,
  Clock,
  ShieldCheck,
  ChevronRight,
  Divide,
  BarChart3,
  Flame,
} from 'lucide-react';
import { PsychometricAnalysis, SessionResult, TestConfig } from '../types';

interface ResultViewProps {
  config: TestConfig;
  sessionResults: SessionResult[];
  analysis: PsychometricAnalysis;
  onRetake: () => void;
  onOpenHistory: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  config,
  sessionResults,
  analysis,
  onRetake,
  onOpenHistory,
}) => {
  // SVG Work Curve calculations
  const answers = sessionResults.map((s) => s.answered);
  const maxVal = Math.max(...answers, 10);
  const chartHeight = 180;
  const chartWidth = 560;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getX = (index: number) => {
    if (sessionResults.length <= 1) return chartWidth / 2;
    return paddingX + (index / (sessionResults.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / (maxVal * 1.15)) * usableHeight;
  };

  const points = sessionResults.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.answered),
    val: s.answered,
    session: s.sessionNumber,
    wrong: s.wrong,
  }));

  const pathD =
    points.length > 0
      ? points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
      : '';

  const avgY = getY(analysis.totalAnswered / (sessionResults.length || 1));

  const curvePatternBadge = {
    Ascending: { label: 'Menanjak (Ascending)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    Steady: { label: 'Stabil (Steady)', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    Descending: { label: 'Menurun (Descending)', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    Fluctuating: { label: 'Fluktuatif (Saddle)', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  }[analysis.curvePattern];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-12 space-y-5 sm:space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 no-print">
        <div>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600">
            Laporan Hasil Evaluasi Psikometrik Resmi
          </span>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hasil {config.testType === 'pauli' ? 'Tes Pauli' : 'Tes Kraepelin'}
            {config.answerMode === 'parity' ? ' — Mode Genap/Ganjil' : ''}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Peserta: <strong>{config.name || 'Peserta Mandiri'}</strong> · Tanggal:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak PDF</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={onRetake}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tes Ulang</span>
          </button>
        </div>
      </div>

      {/* Hero Grade Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-3 text-center md:text-left flex-1 w-full">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
              <Award className="w-3.5 h-3.5" />
              <span>{analysis.overallGrade}</span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${curvePatternBadge.color}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{curvePatternBadge.label}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Akurasi Pengerjaan {analysis.totalAccuracy}%
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {analysis.summaryDescription}
          </p>

          <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs text-slate-500 text-left">
            <div>
              Total: <strong className="text-slate-900">{analysis.totalAnswered}</strong> soal
            </div>
            <div>
              Benar: <strong className="text-emerald-600">{analysis.totalCorrect}</strong>
            </div>
            <div>
              Salah: <strong className="text-rose-600">{analysis.totalWrong}</strong>
            </div>
            <div>
              Tempo: <strong className="text-slate-900">{analysis.averageSpeedPerMin}</strong>/mnt
            </div>
          </div>
        </div>

        {/* Large Stanine & Accuracy Cluster */}
        <div className="shrink-0 flex items-center justify-center gap-2.5 sm:gap-3 w-full md:w-auto">
          {/* Stanine Score Card */}
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center w-auto sm:w-32 h-28 sm:h-36 rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-indigo-100 p-2 sm:p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Norma Stanine
            </span>
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono my-0.5 sm:my-1">
              {analysis.stanineScore} <span className="text-xs text-slate-400 font-normal">/ 9</span>
            </span>
            <span className="text-[10px] text-indigo-700 font-semibold">
              Persentil {analysis.percentileRank}%
            </span>
          </div>

          {/* Accuracy Card */}
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center w-auto sm:w-32 h-28 sm:h-36 rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-slate-200 p-2 sm:p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Akurasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono my-0.5 sm:my-1">
              {Math.round(analysis.totalAccuracy)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {analysis.totalCorrect} benar
            </span>
          </div>
        </div>
      </div>

      {/* Dedicated Parity Breakdown Card if in Genap / Ganjil Mode */}
      {analysis.parityBreakdown && (
        <div className="p-6 sm:p-8 rounded-3xl bg-indigo-50/40 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Divide className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Analisis Ketelitian: Genap vs Ganjil
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700">
              Total {analysis.parityBreakdown.evenTotal + analysis.parityBreakdown.oddTotal} Soal Paritas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Genap Stats */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-indigo-900">Hasil Genap (A / 0)</span>
                <span className="font-mono text-base font-extrabold text-indigo-600">
                  {analysis.parityBreakdown.evenAccuracy}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Benar {analysis.parityBreakdown.evenCorrect} dari {analysis.parityBreakdown.evenTotal} soal berpenjumlahan genap.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${analysis.parityBreakdown.evenAccuracy}%` }}
                />
              </div>
            </div>

            {/* Ganjil Stats */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-900">Hasil Ganjil (B / 1)</span>
                <span className="font-mono text-base font-extrabold text-amber-600">
                  {analysis.parityBreakdown.oddAccuracy}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Benar {analysis.parityBreakdown.oddCorrect} dari {analysis.parityBreakdown.oddTotal} soal berpenjumlahan ganjil.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${analysis.parityBreakdown.oddAccuracy}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Work Curve Graph */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Kurva Kerja Pauli / Kraepelin (Work Curve)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik kuantitas pengerjaan per interval waktu untuk mengamati fluktuasi ritme dan kelelahan mental.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
              <span className="text-slate-600">Output Soal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-slate-400 inline-block" />
              <span className="text-slate-500">Rata-rata ({Math.round(analysis.totalAnswered / (sessionResults.length || 1))})</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Container */}
        <div className="w-full overflow-x-auto py-2">
          <div className="min-w-[500px]">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 select-none"
            >
              {/* Background horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = chartHeight - paddingY - pct * usableHeight;
                const labelVal = Math.round(pct * maxVal * 1.15);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      className="font-mono"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Mean Line */}
              <line
                x1={paddingX}
                y1={avgY}
                x2={chartWidth - paddingX}
                y2={avgY}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Area under curve */}
              {points.length > 1 && (
                <path
                  d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`}
                  fill="rgba(99, 102, 241, 0.08)"
                />
              )}

              {/* Line path */}
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#4f46e5"
                    strokeWidth="3"
                  />
                  {/* Point value label */}
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#1e1b4b"
                    className="font-mono"
                  >
                    {pt.val}
                  </text>
                  {/* Session label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    S{pt.session}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          <strong>Klasifikasi Karakter Kurva:</strong> {analysis.curvePatternDescription}
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-100">
          <span>
            Variasi Simpangan Baku (Deviasi):{' '}
            <strong className="text-slate-800">{analysis.stabilityStdDev} soal</strong>
          </span>
          <span>
            Rasio Paruh Akhir vs Awal:{' '}
            <strong className="text-slate-800">{analysis.enduranceRatio}%</strong>
          </span>
          <span>
            Indeks Kelelahan:{' '}
            <strong className="text-slate-800">{analysis.fatigueIndex}%</strong>
          </span>
        </div>
      </div>

      {/* 4 Psychometric Core Pillars */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <span>4 Aspek Psikogram Kerja</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Speed Pillar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {analysis.characteristics.speed.title}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                {analysis.characteristics.speed.level}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.characteristics.speed.description}
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.characteristics.speed.score}%` }}
              />
            </div>
          </div>

          {/* Accuracy Pillar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {analysis.characteristics.accuracy.title}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                {analysis.characteristics.accuracy.level}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.characteristics.accuracy.description}
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.characteristics.accuracy.score}%` }}
              />
            </div>
          </div>

          {/* Stability Pillar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {analysis.characteristics.stability.title}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                {analysis.characteristics.stability.level}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.characteristics.stability.description}
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.characteristics.stability.score}%` }}
              />
            </div>
          </div>

          {/* Endurance Pillar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-900 text-sm">
                  {analysis.characteristics.endurance.title}
                </span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
                {analysis.characteristics.endurance.level}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.characteristics.endurance.description}
            </p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.characteristics.endurance.score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3">
          Rincian Performa Tiap Sesi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Sesi</th>
                <th className="py-2.5 px-3">Terjawab</th>
                <th className="py-2.5 px-3">Benar</th>
                <th className="py-2.5 px-3">Salah</th>
                <th className="py-2.5 px-3">Akurasi</th>
                <th className="py-2.5 px-3">Tempo (Soal/Menit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessionResults.map((s) => (
                <tr key={s.sessionNumber} className="hover:bg-slate-50/60 font-mono">
                  <td className="py-2.5 px-3 font-bold text-slate-800">Sesi {s.sessionNumber}</td>
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{s.answered}</td>
                  <td className="py-2.5 px-3 text-emerald-600">{s.correct}</td>
                  <td className="py-2.5 px-3 text-rose-600">{s.wrong}</td>
                  <td className="py-2.5 px-3 text-slate-700">{s.accuracy}%</td>
                  <td className="py-2.5 px-3 text-slate-700">{s.speedPerMin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Card */}
      <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 space-y-3">
        <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <span>Saran & Rekomendasi Latihan Khusus</span>
        </h4>
        <ul className="space-y-2 text-xs text-indigo-900">
          {analysis.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimers & Notes */}
      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong>Catatan Evaluasi:</strong> Skor simulasi ini dihitung berdasarkan norma Pauli/Kraepelin psikologi modern dengan skala Stanine 1–9. Pada seleksi resmi instansi (BUMN/Kedinasan), hasil dikombinasikan dengan tes baterai kepribadian dan wawancara psikolog.
      </div>
    </div>
  );
};
