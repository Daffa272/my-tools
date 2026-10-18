import { PsychometricAnalysis, SessionResult, WorkCurvePattern } from '../types';

export function calculatePsychometrics(
  sessionResults: SessionResult[],
  sessionDurationSec: number
): PsychometricAnalysis {
  if (sessionResults.length === 0) {
    return getEmptyAnalysis();
  }

  const totalAnswered = sessionResults.reduce((acc, s) => acc + s.answered, 0);
  const totalCorrect = sessionResults.reduce((acc, s) => acc + s.correct, 0);
  const totalWrong = sessionResults.reduce((acc, s) => acc + s.wrong, 0);
  const totalSkipped = sessionResults.reduce((acc, s) => acc + s.skipped, 0);

  const totalAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const totalTestDurationMin = (sessionResults.length * sessionDurationSec) / 60;
  const averageSpeedPerMin = totalTestDurationMin > 0 ? totalAnswered / totalTestDurationMin : 0;

  // Answers array across sessions
  const answersPerSession = sessionResults.map((s) => s.answered);
  const meanAnswers = totalAnswered / sessionResults.length;

  // Standard deviation
  const variance =
    answersPerSession.reduce((acc, val) => acc + Math.pow(val - meanAnswers, 2), 0) /
    (sessionResults.length || 1);
  const stabilityStdDev = Math.sqrt(variance);

  // Stability Score (0 - 100): lower CV (coef of variation) gives higher stability
  const cv = meanAnswers > 0 ? stabilityStdDev / meanAnswers : 0;
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - cv * 120)));

  // Endurance Ratio: 2nd half vs 1st half
  const mid = Math.floor(sessionResults.length / 2);
  let firstHalfSum = 0;
  let secondHalfSum = 0;

  if (sessionResults.length >= 2) {
    for (let i = 0; i < mid; i++) {
      firstHalfSum += sessionResults[i].answered;
    }
    const secondHalfStart = sessionResults.length % 2 === 0 ? mid : mid + 1;
    for (let i = secondHalfStart; i < sessionResults.length; i++) {
      secondHalfSum += sessionResults[i].answered;
    }
    const countFirst = mid;
    const countSecond = sessionResults.length - secondHalfStart;
    const avgFirst = countFirst > 0 ? firstHalfSum / countFirst : 1;
    const avgSecond = countSecond > 0 ? secondHalfSum / countSecond : 1;
    var enduranceRatio = avgFirst > 0 ? (avgSecond / avgFirst) * 100 : 100;
  } else {
    var enduranceRatio = 100;
  }

  // Fatigue index: percentage decrease from peak session to final session
  const maxSessionAnswer = Math.max(...answersPerSession, 1);
  const lastSessionAnswer = answersPerSession[answersPerSession.length - 1];
  const fatigueIndex = Math.max(0, Math.round(((maxSessionAnswer - lastSessionAnswer) / maxSessionAnswer) * 100));

  // Determine Work Curve Pattern using linear regression slope
  let curvePattern: WorkCurvePattern = 'Steady';
  let curvePatternDescription = '';

  if (sessionResults.length >= 3) {
    const n = sessionResults.length;
    const xMean = (n - 1) / 2;
    let numerator = 0;
    let denominator = 0;

    answersPerSession.forEach((y, x) => {
      numerator += (x - xMean) * (y - meanAnswers);
      denominator += Math.pow(x - xMean, 2);
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;

    if (slope > 0.6) {
      curvePattern = 'Ascending';
      curvePatternDescription =
        'Kurva Menanjak (Ascending): Menunjukkan adaptasi cepat terhadap tugas monoton, motivasi kerja yang semakin bertambah seiring berjalannya tes, dan daya juang positif.';
    } else if (slope < -0.7) {
      curvePattern = 'Descending';
      curvePatternDescription =
        'Kurva Menurun (Descending): Menandakan adanya kelelahan mental (fatigue) pada paruh kedua. Stamina kognitif perlu dilatih agar tidak mudah drop saat tes panjang.';
    } else if (stabilityStdDev > 4.5) {
      curvePattern = 'Fluctuating';
      curvePatternDescription =
        'Kurva Fluktuatif (Saddle / Bergelombang): Ritme kerja mengalami pasang-surut yang tajam. Mengindikasikan fluktuasi konsentrasi atau gampang terdistraksi.';
    } else {
      curvePattern = 'Steady';
      curvePatternDescription =
        'Kurva Stabil (Steady / Metronomik): Pengendalian emosi sangat matang, konsisten di setiap babak tanpa lonjakan atau penurunan drastis.';
    }
  } else {
    curvePattern = 'Steady';
    curvePatternDescription = 'Kurva stabil dalam durasi latihan singkat.';
  }

  // Standardized Psychological Stanine (1 to 9) and Percentile Estimation
  // Psychological norming composite: 55% accuracy weight, 45% speed weight
  const speedNormalized = Math.min(100, (averageSpeedPerMin / 45) * 100);
  const compositeIndex = totalAccuracy * 0.55 + speedNormalized * 0.45;

  let stanineScore = 5;
  let percentileRank = 50;

  if (compositeIndex >= 93) {
    stanineScore = 9; // Very Superior
    percentileRank = 97;
  } else if (compositeIndex >= 86) {
    stanineScore = 8; // Superior
    percentileRank = 89;
  } else if (compositeIndex >= 79) {
    stanineScore = 7; // High Average
    percentileRank = 77;
  } else if (compositeIndex >= 72) {
    stanineScore = 6; // Above Average
    percentileRank = 60;
  } else if (compositeIndex >= 64) {
    stanineScore = 5; // Average
    percentileRank = 50;
  } else if (compositeIndex >= 55) {
    stanineScore = 4; // Below Average
    percentileRank = 40;
  } else if (compositeIndex >= 45) {
    stanineScore = 3; // Low Average
    percentileRank = 23;
  } else if (compositeIndex >= 35) {
    stanineScore = 2; // Poor
    percentileRank = 11;
  } else {
    stanineScore = 1; // Very Poor
    percentileRank = 4;
  }

  // Speed Characteristic
  let speedLevel: 'Sangat Tinggi' | 'Tinggi' | 'Cukup / Rata-rata' | 'Perlu Latihan' = 'Cukup / Rata-rata';
  let speedScore = Math.min(100, Math.round((averageSpeedPerMin / 50) * 100));
  if (averageSpeedPerMin >= 45) {
    speedLevel = 'Sangat Tinggi';
  } else if (averageSpeedPerMin >= 32) {
    speedLevel = 'Tinggi';
  } else if (averageSpeedPerMin >= 20) {
    speedLevel = 'Cukup / Rata-rata';
  } else {
    speedLevel = 'Perlu Latihan';
  }

  // Accuracy Characteristic
  let accuracyLevel: 'Sangat Tinggi' | 'Tinggi' | 'Cukup / Rata-rata' | 'Perlu Latihan' = 'Cukup / Rata-rata';
  if (totalAccuracy >= 95) {
    accuracyLevel = 'Sangat Tinggi';
  } else if (totalAccuracy >= 88) {
    accuracyLevel = 'Tinggi';
  } else if (totalAccuracy >= 75) {
    accuracyLevel = 'Cukup / Rata-rata';
  } else {
    accuracyLevel = 'Perlu Latihan';
  }

  // Stability Characteristic
  let stabilityLevel: 'Sangat Tinggi' | 'Tinggi' | 'Cukup / Rata-rata' | 'Perlu Latihan' = 'Cukup / Rata-rata';
  if (stabilityScore >= 85) {
    stabilityLevel = 'Sangat Tinggi';
  } else if (stabilityScore >= 70) {
    stabilityLevel = 'Tinggi';
  } else if (stabilityScore >= 50) {
    stabilityLevel = 'Cukup / Rata-rata';
  } else {
    stabilityLevel = 'Perlu Latihan';
  }

  // Endurance Characteristic
  let enduranceLevel: 'Sangat Tinggi' | 'Tinggi' | 'Cukup / Rata-rata' | 'Perlu Latihan' = 'Cukup / Rata-rata';
  let enduranceScore = Math.max(0, Math.min(100, Math.round(enduranceRatio)));
  if (enduranceRatio >= 100) {
    enduranceLevel = 'Sangat Tinggi';
  } else if (enduranceRatio >= 90) {
    enduranceLevel = 'Tinggi';
  } else if (enduranceRatio >= 75) {
    enduranceLevel = 'Cukup / Rata-rata';
  } else {
    enduranceLevel = 'Perlu Latihan';
  }

  // Overall Grade
  let overallGrade = 'Baik (Lulus Kriteria Seleksi)';
  if (totalAccuracy >= 92 && stabilityScore >= 75 && averageSpeedPerMin >= 30) {
    overallGrade = 'Sangat Unggul (Sangat Direkomendasikan)';
  } else if (totalAccuracy >= 85 && averageSpeedPerMin >= 22) {
    overallGrade = 'Kompeten (Memenuhi Standar)';
  } else if (totalAccuracy < 75) {
    overallGrade = 'Perlu Perbaikan Ketelitian';
  } else {
    overallGrade = 'Cukup (Perlu Peningkatan Tempo)';
  }

  // Detailed summary
  let summaryDescription = '';
  if (totalAccuracy >= 90 && enduranceRatio >= 95) {
    summaryDescription =
      'Grafik kurva kerja Anda menunjukkan ketahanan konsentrasi prima dengan tingkat ketelitian sangat baik. Tempo kerja stabil dan tidak mudah terdistraksi oleh tekanan waktu maupun pergantian sesi.';
  } else if (totalAccuracy >= 85 && enduranceRatio < 85) {
    summaryDescription =
      'Ketelitian awal Anda sangat tinggi, namun terjadi penurunan kuantitas pengerjaan di sesi-sesi akhir akibat faktor kelelahan kognitif. Latihan bertahap akan meningkatkan daya tahan.';
  } else if (totalAccuracy < 80) {
    summaryDescription =
      'Kecepatan pengerjaan sudah cukup aktif, namun rasio kesalahan masih memerlukan perhatian. Di psikotes resmi Pauli/Kraepelin, ketelitian berbobot lebih krusial dibandingkan memaksakan kecepatan berlebih.';
  } else {
    summaryDescription =
      'Performa pengerjaan berada dalam batas standar yang wajar. Peningkatan kontinuitas ritme dan pembiasaan kalkulasi modulo 10 akan mempercepat kalkulasi spontan Anda.';
  }

  // Parity specific calculation (even vs odd)
  let evenTotal = 0;
  let evenCorrect = 0;
  let oddTotal = 0;
  let oddCorrect = 0;

  sessionResults.forEach((s) => {
    if (s.evenAnswered !== undefined) evenTotal += s.evenAnswered;
    if (s.evenCorrect !== undefined) evenCorrect += s.evenCorrect;
    if (s.oddAnswered !== undefined) oddTotal += s.oddAnswered;
    if (s.oddCorrect !== undefined) oddCorrect += s.oddCorrect;
  });

  const parityBreakdown =
    evenTotal + oddTotal > 0
      ? {
          evenTotal,
          evenCorrect,
          evenAccuracy: evenTotal > 0 ? Math.round((evenCorrect / evenTotal) * 1000) / 10 : 0,
          oddTotal,
          oddCorrect,
          oddAccuracy: oddTotal > 0 ? Math.round((oddCorrect / oddTotal) * 1000) / 10 : 0,
        }
      : undefined;

  // Tailored recommendations
  const recommendations: string[] = [];
  if (totalAccuracy < 88) {
    recommendations.push(
      'Fokus pada ketepatan kalkulasi terlebih dahulu. Jangan tergesa-gesa berpindah angka sebelum yakin dengan digit satuan.'
    );
  }
  if (curvePattern === 'Descending') {
    recommendations.push(
      'Kurva menunjukkan kelelahan di akhir sesi. Latih stamina kognitif dengan berlatih 5–10 menit bertahap setiap hari.'
    );
  }
  if (stabilityStdDev > 4) {
    recommendations.push(
      'Pertahankan ritme metronomik yang stabil. Hindari lonjakan pengerjaan di satu sesi yang memicu penurunan drastis di sesi berikutnya.'
    );
  }
  if (parityBreakdown && Math.abs(parityBreakdown.evenAccuracy - parityBreakdown.oddAccuracy) > 10) {
    const weaker = parityBreakdown.evenAccuracy < parityBreakdown.oddAccuracy ? 'Genap' : 'Ganjil';
    recommendations.push(
      `Perhatikan ketelitian pada hasil ${weaker}. Data mendeteksi akurasi pada angka ${weaker} lebih rendah dibandingkan lawannya.`
    );
  }
  if (averageSpeedPerMin < 28) {
    recommendations.push(
      'Latih refleks kombinasi angka sering (seperti 8+7=5, 6+9=5, 9+8=7) agar respon jari menjadi otomatis tanpa jeda berpikir.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Performa Anda berada di level atas (Stanine ' + stanineScore + '). Pertahankan ritme ini saat tes psikotes sebenarnya!'
    );
  }

  return {
    totalAnswered,
    totalCorrect,
    totalWrong,
    totalSkipped,
    totalAccuracy: Math.round(totalAccuracy * 10) / 10,
    averageSpeedPerMin: Math.round(averageSpeedPerMin * 10) / 10,
    stabilityScore,
    stabilityStdDev: Math.round(stabilityStdDev * 10) / 10,
    enduranceRatio: Math.round(enduranceRatio * 10) / 10,
    fatigueIndex,
    stanineScore,
    percentileRank,
    curvePattern,
    curvePatternDescription,
    overallGrade,
    summaryDescription,
    characteristics: {
      speed: {
        score: speedScore,
        level: speedLevel,
        title: 'Tempo & Kecepatan Kerja',
        description: `Rata-rata ${averageSpeedPerMin.toFixed(1)} soal/menit. Menggambarkan kapasitas output energi mental saat dihadapkan pada tugas monoton berulang.`,
      },
      accuracy: {
        score: Math.round(totalAccuracy),
        level: accuracyLevel,
        title: 'Ketelitian & Kecermatan',
        description: `Akurasi ${totalAccuracy.toFixed(1)}% (${totalWrong} salah dari ${totalAnswered} terjawab). Menilai kehati-hatian dan minimnya resiko kelalaian kerja.`,
      },
      stability: {
        score: stabilityScore,
        level: stabilityLevel,
        title: 'Stabilitas & Kestabilan Ritme',
        description: `Indeks stabilitas ${stabilityScore}/100 (simpangan baku: ${stabilityStdDev.toFixed(1)}). Menunjukkan konsistensi pengendalian diri di bawah tekanan.`,
      },
      endurance: {
        score: enduranceScore,
        level: enduranceLevel,
        title: 'Daya Tahan Kerja (Endurance)',
        description: `Rasio paruh akhir ${enduranceRatio.toFixed(1)}% dari paruh awal. Menggambarkan ketahanan terhadap kebosanan dan kelelahan mental jangka panjang.`,
      },
    },
    parityBreakdown,
    recommendations,
  };
}

function getEmptyAnalysis(): PsychometricAnalysis {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalSkipped: 0,
    totalAccuracy: 0,
    averageSpeedPerMin: 0,
    stabilityScore: 0,
    stabilityStdDev: 0,
    enduranceRatio: 0,
    fatigueIndex: 0,
    stanineScore: 5,
    percentileRank: 50,
    curvePattern: 'Steady',
    curvePatternDescription: 'Data tes tidak mencukupi untuk analisis psikometrik.',
    overallGrade: 'Belum Selesai',
    summaryDescription: 'Data tes tidak mencukupi untuk analisis psikometrik.',
    characteristics: {
      speed: { score: 0, level: 'Perlu Latihan', title: 'Tempo & Kecepatan Kerja', description: '-' },
      accuracy: { score: 0, level: 'Perlu Latihan', title: 'Ketelitian & Kecermatan', description: '-' },
      stability: { score: 0, level: 'Perlu Latihan', title: 'Stabilitas & Kestabilan Ritme', description: '-' },
      endurance: { score: 0, level: 'Perlu Latihan', title: 'Daya Tahan Kerja', description: '-' },
    },
    recommendations: ['Lakukan simulasi tes minimal 1 sesi untuk memperoleh analisis lengkap.'],
  };
}
