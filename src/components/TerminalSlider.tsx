/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback } from 'react';
import { terminalAudio } from '../audio';

interface TerminalSliderProps {
  value: number; // 0..100 with step 10
  onChange: (newValue: number) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const TerminalSlider: React.FC<TerminalSliderProps> = ({
  value,
  onChange,
  disabled = false,
  label,
  className = '',
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  const clampedValue = Math.max(0, Math.min(100, Math.round(value / 10) * 10));
  const filledCount = Math.round(clampedValue / 10); // 0..10

  const handleDecrement = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || clampedValue <= 0) return;
      const next = Math.max(0, clampedValue - 10);
      terminalAudio.playKeyClick();
      onChange(next);
    },
    [disabled, clampedValue, onChange]
  );

  const handleIncrement = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled || clampedValue >= 100) return;
      const next = Math.min(100, clampedValue + 10);
      terminalAudio.playKeyClick();
      onChange(next);
    },
    [disabled, clampedValue, onChange]
  );

  const handleBarInteraction = useCallback(
    (clientX: number) => {
      if (disabled || !barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const ratio = relativeX / rect.width;
      const step = Math.round(ratio * 10);
      const next = Math.max(0, Math.min(100, step * 10));
      if (next !== clampedValue) {
        terminalAudio.playKeyClick();
        onChange(next);
      }
    },
    [disabled, clampedValue, onChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleBarInteraction(e.clientX);
    },
    [handleBarInteraction]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        handleBarInteraction(e.touches[0].clientX);
      }
    },
    [handleBarInteraction]
  );

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 border border-[#3d2607] bg-[#0d0904] font-mono text-xs ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {label && (
        <span className="font-bold text-[#ffb000] tracking-wide shrink-0">
          {label}
        </span>
      )}

      <div className="flex items-center space-x-2 select-none">
        {/* Decrement Button [-] */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || clampedValue <= 0}
          aria-label="Уменьшить"
          className="w-8 h-8 flex items-center justify-center border border-[#6e470b] bg-[#160f08] text-[#ffb000] font-black hover:border-[#ffb000] hover:bg-[#ffb000]/15 active:bg-[#ffb000] active:text-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          [-]
        </button>

        {/* Pseudo-graphic 10-segment Bar [■■■■■■□□□□] */}
        <div
          ref={barRef}
          onClick={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedValue}
          tabIndex={0}
          className="px-2 py-1 border border-[#6e470b] bg-[#070503] hover:border-[#ffb000]/70 cursor-pointer flex items-center justify-center font-mono tracking-widest text-[#ffb000] text-sm md:text-base transition"
          title={`Шкала: ${clampedValue}% (кликните для выбора)`}
        >
          <span className="text-[#8c5b0f] mr-0.5">[</span>
          {Array.from({ length: 10 }).map((_, idx) => {
            const isFilled = idx < filledCount;
            return (
              <span
                key={idx}
                className={
                  isFilled
                    ? 'text-[#ffb000] font-bold drop-shadow-[0_0_4px_rgba(255,176,0,0.6)]'
                    : 'text-[#4a341b]'
                }
              >
                {isFilled ? '■' : '□'}
              </span>
            );
          })}
          <span className="text-[#8c5b0f] ml-0.5">]</span>
        </div>

        {/* Increment Button [+] */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || clampedValue >= 100}
          aria-label="Увеличить"
          className="w-8 h-8 flex items-center justify-center border border-[#6e470b] bg-[#160f08] text-[#ffb000] font-black hover:border-[#ffb000] hover:bg-[#ffb000]/15 active:bg-[#ffb000] active:text-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          [+]
        </button>

        {/* Percentage Label */}
        <span className="font-extrabold text-[#ffb000] w-12 text-right tracking-wider">
          {clampedValue}%
        </span>
      </div>
    </div>
  );
};
