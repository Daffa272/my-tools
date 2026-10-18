import React from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive, barCount = 18 }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2 py-1 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
      {Array.from({ length: barCount }).map((_, i) => {
        // Generate varied heights and animation delays
        const delay = (i * 0.08) % 0.8;
        const baseHeight = 20 + ((i * 17) % 60);

        return (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300 transition-all duration-150"
            style={{
              height: isActive ? `${baseHeight}%` : '20%',
              animation: isActive ? `waveBar 0.9s ease-in-out infinite alternate` : 'none',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes waveBar {
          0% { height: 18%; opacity: 0.4; }
          50% { height: 95%; opacity: 1; }
          100% { height: 35%; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
