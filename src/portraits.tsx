/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArchetypeId, PhosphorColor } from './types';

interface PortraitProps {
  archetype: ArchetypeId;
  isEmergency?: boolean;
  phosphorColor?: PhosphorColor;
}

export const TerminalPortrait: React.FC<PortraitProps> = ({ archetype, isEmergency, phosphorColor = 'amber' }) => {
  const normalColor =
    phosphorColor === 'green' ? '#33ff33' : phosphorColor === 'mono' ? '#e5e7eb' : '#ffb000';
  const normalDim =
    phosphorColor === 'green' ? '#135213' : phosphorColor === 'mono' ? '#4b5563' : '#6e470b';
  const primaryColor = isEmergency ? '#ff2a00' : normalColor;
  const dimColor = isEmergency ? '#6e1000' : normalDim;
  const ditherBg = isEmergency ? 'url(#dither-red)' : 'url(#dither-amber)';
  const denseDither = isEmergency ? 'url(#dense-dither-red)' : 'url(#dense-dither-amber)';

  return (
    <div className="relative w-full h-full flex items-center justify-center p-0.5 overflow-hidden select-none">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-[210px] max-h-[210px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Amber/Theme dithering patterns */}
          <pattern id="dither-amber" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.45" fill={primaryColor} opacity="0.4" />
          </pattern>
          <pattern id="dense-dither-amber" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1" height="1" fill={primaryColor} opacity="0.75" />
          </pattern>
          <pattern id="hatch-amber" width="3" height="3" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="3" y2="3" stroke={primaryColor} strokeWidth="0.6" opacity="0.45" />
          </pattern>

          {/* Red emergency dithering patterns */}
          <pattern id="dither-red" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.45" fill="#ff2a00" opacity="0.45" />
          </pattern>
          <pattern id="dense-dither-red" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1" height="1" fill="#ff2a00" opacity="0.8" />
          </pattern>
        </defs>

        {/* Outer portrait coordinate frame */}
        <rect x="1" y="1" width="98" height="98" fill="none" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1.5 1.5" />
        <rect x="3" y="3" width="94" height="94" fill="#100b05" stroke={primaryColor} strokeWidth="1" />

        {/* Background dither fill */}
        <rect x="4" y="4" width="92" height="92" fill={ditherBg} />

        {/* Corner alignment marks */}
        <path d="M 6 9 L 6 6 L 9 6" stroke={primaryColor} strokeWidth="1" fill="none" />
        <path d="M 94 9 L 94 6 L 91 6" stroke={primaryColor} strokeWidth="1" fill="none" />
        <path d="M 6 91 L 6 94 L 9 94" stroke={primaryColor} strokeWidth="1" fill="none" />
        <path d="M 94 91 L 94 94 L 91 94" stroke={primaryColor} strokeWidth="1" fill="none" />

        {/* =================================================================== */}
        {/* ARCHETYPE: KGB GENERAL                                              */}
        {/* =================================================================== */}
        {archetype === 'kgb_general' && (
          <g>
            {/* Massive Shoulders & Tunic (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Epaulets (Погоны с генеральскими звездами) */}
            <polygon points="17,84 25,74 37,73 29,88" fill={denseDither} stroke={primaryColor} strokeWidth="0.8" />
            <circle cx="26" cy="80" r="1.5" fill={primaryColor} />
            <polygon points="83,84 75,74 63,73 71,88" fill={denseDither} stroke={primaryColor} strokeWidth="0.8" />
            <circle cx="74" cy="80" r="1.5" fill={primaryColor} />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#140d07" stroke={primaryColor} strokeWidth="1" />

            {/* Stand-up Military Collar (Стоячий ворот кителя) */}
            <path d="M 36 71 L 50 75 L 64 71 L 64 68 L 50 72 L 36 68 Z" fill="#1c130a" stroke={primaryColor} strokeWidth="1" />
            <line x1="50" y1="75" x2="50" y2="100" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="50" cy="82" r="1" fill={primaryColor} />
            <circle cx="50" cy="91" r="1" fill={primaryColor} />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 35 22, 65 22, 65 34 C 65 47, 61 58, 50 58 C 39 58, 35 47, 35 34 Z"
              fill="#191109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Ears */}
            <path d="M 35 36 C 33 36, 33 42, 35 42" stroke={primaryColor} strokeWidth="0.8" fill="#140d07" />
            <path d="M 65 36 C 67 36, 67 42, 65 42" stroke={primaryColor} strokeWidth="0.8" fill="#140d07" />

            {/* Stern facial features */}
            {/* Eyebrows */}
            <line x1="39" y1="36" x2="47" y2="38" stroke={primaryColor} strokeWidth="1.6" />
            <line x1="53" y1="38" x2="61" y2="36" stroke={primaryColor} strokeWidth="1.6" />
            {/* Cold eyes */}
            <rect x="41" y="39" width="4.5" height="1.8" fill={primaryColor} />
            <rect x="54.5" y="39" width="4.5" height="1.8" fill={primaryColor} />
            {/* Nose */}
            <path d="M 50 38 L 49 46 L 47 47 L 53 47 L 51 46" stroke={primaryColor} strokeWidth="0.9" fill="none" />
            {/* Mouth & Firm Jaw */}
            <line x1="44" y1="52" x2="56" y2="52" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="46" y1="54" x2="54" y2="54" stroke={primaryColor} strokeWidth="0.7" />

            {/* High Peaked Cap (Высокая фуражка КГБ) */}
            {/* Flared Cap Crown */}
            <path
              d="M 23 23 Q 50 8 77 23 Q 68 18 50 17 Q 32 18 23 23 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            <ellipse cx="50" cy="22" rx="26" ry="10" fill="#181109" stroke={primaryColor} strokeWidth="1" />
            {/* Cap band (Околыш) with Soviet Red Star Cockade */}
            <path d="M 31 28 L 33 36 L 67 36 L 69 28 Z" fill="#0d0804" stroke={primaryColor} strokeWidth="1" />
            <circle cx="50" cy="32" r="2.8" fill={primaryColor} />
            <polygon points="50,30 50.8,31.6 52.5,31.6 51.1,32.6 51.6,34.2 50,33.2 48.4,34.2 48.9,32.6 47.5,31.6 49.2,31.6" fill="#000" />
            {/* Visor (Козырек) */}
            <path d="M 32 35 Q 50 42 68 35 Q 50 38 32 35 Z" fill="#040201" stroke={primaryColor} strokeWidth="1.2" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: PARTY BOSS                                              */}
        {/* =================================================================== */}
        {archetype === 'party_boss' && (
          <g>
            {/* Massive Shoulders & Suit (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#160f08"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Suit Lapels & White Shirt Collar */}
            <polygon points="43,70 50,78 57,70 50,69" fill={primaryColor} opacity="0.3" stroke={primaryColor} strokeWidth="0.8" />
            {/* Red / Amber Nomenclature Tie */}
            <polygon points="48,77 52,77 54,98 46,98" fill={primaryColor} stroke={primaryColor} strokeWidth="0.6" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#130c06" stroke={primaryColor} strokeWidth="1" />
            {/* Double chin crease */}
            <path d="M 42 58 Q 50 63 58 58" stroke={primaryColor} strokeWidth="1" fill="none" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 34 35 C 34 22, 66 22, 66 35 C 66 48, 62 59, 50 59 C 38 59, 34 48, 34 35 Z"
              fill="#181008"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Slicked-back Soviet party hair */}
            <path
              d="M 34 33 Q 36 17 50 17 Q 64 17 66 33 Q 60 22 50 21 Q 40 22 34 33 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1"
            />
            <line x1="42" y1="20" x2="45" y2="28" stroke={primaryColor} strokeWidth="0.6" />
            <line x1="50" y1="18" x2="51" y2="27" stroke={primaryColor} strokeWidth="0.6" />
            <line x1="58" y1="20" x2="56" y2="28" stroke={primaryColor} strokeWidth="0.6" />

            {/* Massive Horn-rimmed glasses (Роговые очки) */}
            <rect x="36" y="34" width="11" height="8" rx="1.5" fill="#090503" stroke={primaryColor} strokeWidth="1.4" />
            <rect x="53" y="34" width="11" height="8" rx="1.5" fill="#090503" stroke={primaryColor} strokeWidth="1.4" />
            <line x1="47" y1="37" x2="53" y2="37" stroke={primaryColor} strokeWidth="1.6" />
            <line x1="33" y1="37" x2="36" y2="37" stroke={primaryColor} strokeWidth="1" />
            <line x1="64" y1="37" x2="67" y2="37" stroke={primaryColor} strokeWidth="1" />
            {/* Eyes behind lenses */}
            <circle cx="41.5" cy="38" r="1.5" fill={primaryColor} />
            <circle cx="58.5" cy="38" r="1.5" fill={primaryColor} />

            {/* Nose & Fleshy Mouth */}
            <path d="M 49 39 L 48 46 L 53 46" stroke={primaryColor} strokeWidth="0.9" fill="none" />
            <line x1="44" y1="52" x2="56" y2="52" stroke={primaryColor} strokeWidth="1.3" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: MINER                                                   */}
        {/* =================================================================== */}
        {archetype === 'miner' && (
          <g>
            {/* Massive Shoulders & Work Jacket (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#130d07"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Sturdy collar & work shirt */}
            <path d="M 38 70 L 50 82 L 62 70" stroke={primaryColor} strokeWidth="1.2" fill="none" />
            <line x1="50" y1="82" x2="50" y2="100" stroke={primaryColor} strokeWidth="1.2" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#150e08" stroke={primaryColor} strokeWidth="1" />

            {/* Rugged Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 36 C 35 24, 65 24, 65 36 C 65 48, 62 58, 50 58 C 38 58, 35 48, 35 36 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Coal dust smudges */}
            <rect x="38" y="44" width="5" height="5" fill={denseDither} />
            <rect x="58" y="47" width="5" height="4" fill={denseDither} />
            <rect x="47" y="53" width="6" height="3" fill={denseDither} />

            {/* Determined gaze, nose and mouth */}
            <line x1="39" y1="41" x2="46" y2="41" stroke={primaryColor} strokeWidth="1.5" />
            <line x1="54" y1="41" x2="61" y2="41" stroke={primaryColor} strokeWidth="1.5" />
            <circle cx="42.5" cy="43" r="1.3" fill={primaryColor} />
            <circle cx="57.5" cy="43" r="1.3" fill={primaryColor} />
            <path d="M 49 41 L 48 48 L 53 48" stroke={primaryColor} strokeWidth="1" fill="none" />
            <line x1="43" y1="54" x2="57" y2="54" stroke={primaryColor} strokeWidth="1.6" />

            {/* Miner Hard Hat (Каска шахтера) with central headlamp */}
            <path d="M 31 37 Q 50 17 69 37 Q 50 32 31 37 Z" fill="#22170b" stroke={primaryColor} strokeWidth="1.2" />
            <ellipse cx="50" cy="36" rx="20" ry="3.5" fill="#120c06" stroke={primaryColor} strokeWidth="1" />
            {/* Battery Headlamp */}
            <rect x="46" y="22" width="8" height="8" rx="1.5" fill={primaryColor} />
            <ellipse cx="50" cy="26" rx="2.5" ry="2.5" fill="#fff" />
            {/* Lamp beam rays */}
            <line x1="50" y1="21" x2="50" y2="12" stroke={primaryColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
            <line x1="45" y1="22" x2="38" y2="15" stroke={primaryColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
            <line x1="55" y1="22" x2="62" y2="15" stroke={primaryColor} strokeWidth="1" strokeDasharray="1.5 1.5" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: POPULAR FRONT                                           */}
        {/* =================================================================== */}
        {archetype === 'popular_front' && (
          <g>
            {/* Massive Shoulders & Knitted Sweater (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#140d06"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Knitted Sweater texture lines */}
            <line x1="28" y1="84" x2="28" y2="100" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="1 1" />
            <line x1="72" y1="84" x2="72" y2="100" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="1 1" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#171009" stroke={primaryColor} strokeWidth="1" />
            {/* Turtleneck collar */}
            <path d="M 38 68 Q 50 73 62 68 L 62 73 Q 50 78 38 73 Z" fill="#1f150a" stroke={primaryColor} strokeWidth="1" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 35 C 35 22, 65 22, 65 35 C 65 48, 62 59, 50 59 C 38 59, 35 48, 35 35 Z"
              fill="#170f08"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Unruly intellectual hair */}
            <path
              d="M 32 35 Q 29 18 50 16 Q 71 18 68 35 Q 63 22 50 21 Q 37 22 32 35 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1.2"
            />

            {/* Round Intellectual Glasses */}
            <circle cx="43" cy="37" r="4.5" fill="#090503" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="57" cy="37" r="4.5" fill="#090503" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="47.5" y1="37" x2="52.5" y2="37" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="43" cy="37" r="1.3" fill={primaryColor} />
            <circle cx="57" cy="37" r="1.3" fill={primaryColor} />

            {/* Full Dense Beard & Mustache (Y: 45..62) */}
            <path
              d="M 37 46 Q 50 67 63 46 Q 50 56 37 46 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1"
            />
            <path d="M 42 47 Q 50 52 58 47" stroke={primaryColor} strokeWidth="1.2" fill="none" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: FACTORY DIRECTOR                                        */}
        {/* =================================================================== */}
        {archetype === 'factory_director' && (
          <g>
            {/* Massive Shoulders & Wool Director Suit (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Order of Red Banner / Medal on chest */}
            <polygon points="26,82 29,78 33,82 31,87 27,87" fill={primaryColor} />
            <circle cx="29.5" cy="83" r="0.8" fill="#000" />

            {/* Shirt Collar & Tie */}
            <path d="M 43 70 L 50 78 L 57 70" stroke={primaryColor} strokeWidth="1" fill="none" />
            <polygon points="48,77 52,77 53,98 47,98" fill={primaryColor} />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#150e07" stroke={primaryColor} strokeWidth="1" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 35 22, 65 22, 65 34 C 65 47, 61 58, 50 58 C 39 58, 35 47, 35 34 Z"
              fill="#181008"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Graying temples hair */}
            <path
              d="M 34 35 Q 36 20 50 20 Q 64 20 66 35 Q 62 25 50 25 Q 38 25 34 35 Z"
              fill="#110b05"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            <path d="M 34 35 L 38 35 M 66 35 L 62 35" stroke={primaryColor} strokeWidth="1" strokeDasharray="1 1" />

            {/* Deep brow worry wrinkles & weary eyes */}
            <line x1="42" y1="28" x2="58" y2="28" stroke={primaryColor} strokeWidth="0.8" />
            <line x1="44" y1="31" x2="56" y2="31" stroke={primaryColor} strokeWidth="0.6" />
            <line x1="39" y1="36" x2="47" y2="37" stroke={primaryColor} strokeWidth="1.4" />
            <line x1="53" y1="37" x2="61" y2="36" stroke={primaryColor} strokeWidth="1.4" />
            <rect x="41" y="38" width="4" height="1.6" fill={primaryColor} />
            <rect x="55" y="38" width="4" height="1.6" fill={primaryColor} />
            {/* Tired mouth */}
            <path d="M 44 52 Q 50 50 56 52" stroke={primaryColor} strokeWidth="1.2" fill="none" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: COOPERATOR (BUSINESSMAN)                                */}
        {/* =================================================================== */}
        {archetype === 'cooperator' && (
          <g>
            {/* Massive Shoulders & 80s Leather Jacket (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#22160a"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Asymmetrical zipper & wide leather collar flaps */}
            <path d="M 28 78 L 39 88 L 49 88 M 72 78 L 61 88 L 51 88" stroke={primaryColor} strokeWidth="1.2" fill="none" />
            <line x1="50" y1="88" x2="50" y2="100" stroke={primaryColor} strokeWidth="1.5" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#160f08" stroke={primaryColor} strokeWidth="1" />
            {/* Thin chain */}
            <path d="M 43 66 Q 50 71 57 66" stroke={primaryColor} strokeWidth="0.8" fill="none" strokeDasharray="1.5 1" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 35 22, 65 22, 65 34 C 65 47, 61 58, 50 58 C 39 58, 35 47, 35 34 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* 80s Mullet / Pompadour Hairstyle */}
            <path
              d="M 33 34 Q 31 18 50 17 Q 69 18 67 34 Q 71 45 68 53 M 33 34 Q 29 45 32 53"
              stroke={primaryColor}
              strokeWidth="1.2"
              fill="none"
            />

            {/* 80s Aviator / Tinted Shades */}
            <polygon points="37,35 47,35 45,43 38,43" fill="#070402" stroke={primaryColor} strokeWidth="1.2" />
            <polygon points="53,35 63,35 62,43 55,43" fill="#070402" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="47" y1="36" x2="53" y2="36" stroke={primaryColor} strokeWidth="1.2" />

            {/* 80s Mustache */}
            <path d="M 43 50 Q 50 48 57 50 Q 50 54 43 50 Z" fill={primaryColor} />
            <line x1="45" y1="55" x2="55" y2="55" stroke={primaryColor} strokeWidth="1" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: MOSCOW INSPECTOR                                        */}
        {/* =================================================================== */}
        {archetype === 'moscow_inspector' && (
          <g>
            {/* Massive Shoulders & Winter Coat (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#140d07"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Heavy winter collar & red scarf */}
            <path d="M 30 78 L 50 90 L 70 78" stroke={primaryColor} strokeWidth="1.5" fill="#1e1309" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#160f09" stroke={primaryColor} strokeWidth="1" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 35 22, 65 22, 65 34 C 65 47, 61 58, 50 58 C 39 58, 35 47, 35 34 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Strict, cold eyes & thin lips */}
            <line x1="40" y1="39" x2="47" y2="38" stroke={primaryColor} strokeWidth="1.4" />
            <line x1="53" y1="38" x2="60" y2="39" stroke={primaryColor} strokeWidth="1.4" />
            <circle cx="43" cy="41" r="1.2" fill={primaryColor} />
            <circle cx="57" cy="41" r="1.2" fill={primaryColor} />
            <line x1="45" y1="52" x2="55" y2="52" stroke={primaryColor} strokeWidth="1.2" />

            {/* Soviet Fur Hat (Пыжиковая шапка-формовка) */}
            <rect x="30" y="18" width="40" height="19" rx="3" fill={denseDither} stroke={primaryColor} strokeWidth="1.2" />
            <line x1="30" y1="30" x2="70" y2="30" stroke={primaryColor} strokeWidth="1" />
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: WESTERN DIPLOMAT                                        */}
        {/* =================================================================== */}
        {archetype === 'western_diplomat' && (
          <g>
            {/* Massive Shoulders & Western Suit (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#160f09"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Crisp white shirt collar and slim European tie */}
            <polygon points="43,70 50,78 57,70 50,69" fill="#fff" opacity="0.35" stroke={primaryColor} strokeWidth="0.7" />
            <polygon points="49,76 51,76 52,98 48,98" fill={primaryColor} />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#150e08" stroke={primaryColor} strokeWidth="1" />

            {/* Head (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 35 22, 65 22, 65 34 C 65 47, 61 58, 50 58 C 39 58, 35 47, 35 34 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Neat side-part haircut */}
            <path
              d="M 34 35 Q 36 21 50 21 Q 64 21 66 35 Q 62 26 50 25 Q 38 26 34 35 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1.2"
            />

            {/* Thin wire glasses */}
            <rect x="38" y="36" width="9" height="6" rx="1" fill="none" stroke={primaryColor} strokeWidth="0.9" />
            <rect x="53" y="36" width="9" height="6" rx="1" fill="none" stroke={primaryColor} strokeWidth="0.9" />
            <line x1="47" y1="38" x2="53" y2="38" stroke={primaryColor} strokeWidth="0.9" />
            <circle cx="42.5" cy="39" r="1.2" fill={primaryColor} />
            <circle cx="57.5" cy="39" r="1.2" fill={primaryColor} />

            {/* Polite diplomatic smile */}
            <path d="M 45 52 Q 50 55 55 52" stroke={primaryColor} strokeWidth="1.1" fill="none" />
          </g>
        )}

        {/* =================================================================== */}
        {/* CRISIS: RADAR                                                       */}
        {/* =================================================================== */}
        {archetype === 'crisis_radar' && (
          <g>
            {/* Radar Grid Circles */}
            <circle cx="50" cy="50" r="40" fill="none" stroke={dimColor} strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="28" fill="none" stroke={primaryColor} strokeWidth="0.8" opacity="0.6" />
            <circle cx="50" cy="50" r="15" fill="none" stroke={primaryColor} strokeWidth="1" />
            {/* Crosshairs */}
            <line x1="10" y1="50" x2="90" y2="50" stroke={dimColor} strokeWidth="0.8" />
            <line x1="50" y1="10" x2="50" y2="90" stroke={dimColor} strokeWidth="0.8" />

            {/* Republic border outline */}
            <path
              d="M 25 35 L 40 25 L 65 28 L 80 43 L 75 65 L 60 78 L 38 73 L 23 58 Z"
              fill={ditherBg}
              stroke={primaryColor}
              strokeWidth="1.4"
            />

            {/* Blinking riot beacons */}
            <g className="animate-pulse">
              <circle cx="42" cy="40" r="7" fill="none" stroke={primaryColor} strokeWidth="1.2" strokeDasharray="1.5 1.5" />
              <circle cx="42" cy="40" r="2.5" fill={primaryColor} />
              <text x="44" y="36" fill={primaryColor} fontSize="5" fontWeight="bold">ОЧАГ-1</text>
            </g>

            <g className="animate-pulse" style={{ animationDelay: '0.3s' }}>
              <circle cx="63" cy="58" r="9" fill="none" stroke={primaryColor} strokeWidth="1.2" strokeDasharray="1.5 1.5" />
              <circle cx="63" cy="58" r="2.5" fill={primaryColor} />
              <text x="65" y="55" fill={primaryColor} fontSize="5" fontWeight="bold">СТАЧКА</text>
            </g>

            {/* Radar sweep line */}
            <line x1="50" y1="50" x2="78" y2="28" stroke={primaryColor} strokeWidth="1.4" />
            <text x="50" y="88" fill={primaryColor} fontSize="6" fontWeight="bold" letterSpacing="0.8" textAnchor="middle">
              [ ТАКТИЧЕСКАЯ КАРТА: ЧП ]
            </text>
          </g>
        )}

        {/* =================================================================== */}
        {/* CRISIS: DEFICIT                                                     */}
        {/* =================================================================== */}
        {archetype === 'crisis_deficit' && (
          <g>
            {/* Grid */}
            <line x1="10" y1="20" x2="90" y2="20" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1 2" />
            <line x1="10" y1="35" x2="90" y2="35" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1 2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1 2" />
            <line x1="10" y1="65" x2="90" y2="65" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1 2" />
            <line x1="10" y1="80" x2="90" y2="80" stroke={dimColor} strokeWidth="0.6" strokeDasharray="1 2" />

            {/* Crashing Supply Curve */}
            <polyline
              points="10,25 25,28 38,32 50,48 62,70 76,82 90,85"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
            />
            <circle cx="62" cy="70" r="2.5" fill={primaryColor} />
            <circle cx="76" cy="82" r="2.5" fill={primaryColor} />

            {/* Stamped Box «ДЕФИЦИТ» */}
            <g transform="rotate(-12 50 52)">
              <rect
                x="15"
                y="41"
                width="70"
                height="22"
                fill="#150a04"
                stroke={primaryColor}
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <text
                x="50"
                y="56"
                fill={primaryColor}
                fontSize="11"
                fontWeight="900"
                letterSpacing="3"
                textAnchor="middle"
              >
                ДЕФИЦИТ
              </text>
            </g>
            <text x="50" y="16" fill={primaryColor} fontSize="5.5" fontWeight="bold" textAnchor="middle">
              СНАБЖЕНИЕ: КРИТИЧЕСКИЙ СПАД
            </text>
          </g>
        )}

        {/* =================================================================== */}
        {/* CRISIS: TANK                                                        */}
        {/* =================================================================== */}
        {archetype === 'crisis_tank' && (
          <g>
            {/* Target Crosshair */}
            <circle cx="50" cy="48" r="34" fill="none" stroke={dimColor} strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="15" y1="48" x2="35" y2="48" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="65" y1="48" x2="85" y2="48" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="50" y1="13" x2="50" y2="33" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="50" y1="63" x2="50" y2="83" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="50" cy="48" r="1.8" fill={primaryColor} />

            {/* APC / Tank Silhouette */}
            <polygon points="18,58 26,46 72,46 84,58 80,67 20,67" fill="#1b1208" stroke={primaryColor} strokeWidth="1.4" />
            <polygon points="38,46 43,38 58,38 62,46" fill="#180f06" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="26" y1="40" x2="45" y2="41" stroke={primaryColor} strokeWidth="2" />
            {/* Wheels / Tracks */}
            <circle cx="28" cy="67" r="5" fill="#110b05" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="42" cy="67" r="5" fill="#110b05" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="58" cy="67" r="5" fill="#110b05" stroke={primaryColor} strokeWidth="1.2" />
            <circle cx="72" cy="67" r="5" fill="#110b05" stroke={primaryColor} strokeWidth="1.2" />

            {/* Warning ticker */}
            <text x="50" y="86" fill={primaryColor} fontSize="6" fontWeight="900" letterSpacing="1" textAnchor="middle">
              ТРЕВОГА: БРОНЕТЕХНИКА
            </text>
          </g>
        )}

        {/* =================================================================== */}
        {/* ARCHETYPE: YELTSIN (19 AUGUST 1991 WHITE HOUSE DEFENSE)            */}
        {/* =================================================================== */}
        {archetype === 'yeltsin' && (
          <g>
            {/* Massive Shoulders & Statesman Suit (Y: 70..100) */}
            <path
              d="M 10 100 L 18 78 L 38 70 L 62 70 L 82 78 L 90 100 Z"
              fill="#150e07"
              stroke={primaryColor}
              strokeWidth="1.3"
            />
            {/* White Shirt Collar */}
            <polygon
              points="41,70 50,80 59,70 50,69"
              fill="#ffffff"
              opacity="0.35"
              stroke={primaryColor}
              strokeWidth="0.8"
            />
            {/* Wide Statesman Tie */}
            <polygon points="47,78 53,78 52,84 48,84" fill={primaryColor} />
            <polygon points="48,82 52,82 54,100 46,100" fill={primaryColor} stroke={primaryColor} strokeWidth="0.6" />

            {/* Dense Solid Neck (Y: 52..74, X: 38..62) */}
            <path d="M 38 52 L 38 74 L 62 74 L 62 52 Z" fill="#140d07" stroke={primaryColor} strokeWidth="1" />
            <line x1="43" y1="56" x2="44" y2="72" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />
            <line x1="57" y1="56" x2="56" y2="72" stroke={primaryColor} strokeWidth="0.7" opacity="0.6" />

            {/* Powerful Head Contour (Centered at X=50, Y=38) */}
            <path
              d="M 34 35 C 33 22, 67 22, 66 35 C 66 48, 63 60, 50 60 C 37 60, 34 48, 34 35 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.3"
            />
            {/* Ears */}
            <path d="M 34 36 C 31 36, 31 44, 34 44" stroke={primaryColor} strokeWidth="1" fill="#130b05" />
            <path d="M 66 36 C 69 36, 69 44, 66 44" stroke={primaryColor} strokeWidth="1" fill="#130b05" />

            {/* High Voluminous Swept-Back Grey Hairstyle (Пышная зачесанная назад седая прическа) */}
            <path
              d="M 31 34 Q 28 12 50 10 Q 72 12 69 34 Q 64 19 50 17 Q 36 19 31 34 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1.4"
            />
            {/* Silvery hair texture sweeps */}
            <path d="M 33 25 Q 50 14 67 25" stroke={primaryColor} strokeWidth="1" fill="none" />
            <path d="M 36 21 Q 50 13 64 21" stroke={primaryColor} strokeWidth="0.8" fill="none" />
            <path d="M 38 17 Q 50 10 62 17" stroke={primaryColor} strokeWidth="0.8" fill="none" />
            <path d="M 42 14 Q 50 8 58 14" stroke={primaryColor} strokeWidth="0.8" fill="none" />
            <path d="M 32 30 Q 30 19 40 17" stroke={primaryColor} strokeWidth="0.7" fill="none" />
            <path d="M 68 30 Q 70 19 60 17" stroke={primaryColor} strokeWidth="0.7" fill="none" />

            {/* Forehead wrinkles of intense struggle */}
            <line x1="42" y1="27" x2="58" y2="27" stroke={primaryColor} strokeWidth="0.7" strokeDasharray="2 1" />
            <line x1="44" y1="30" x2="56" y2="30" stroke={primaryColor} strokeWidth="0.6" />

            {/* Determined Heavy Brow */}
            <line x1="38" y1="34" x2="47" y2="36" stroke={primaryColor} strokeWidth="1.6" />
            <line x1="53" y1="36" x2="62" y2="34" stroke={primaryColor} strokeWidth="1.6" />

            {/* Serious, Piercing Eyes (NO glasses, resolute gaze) */}
            <rect x="40" y="37" width="5.5" height="2" fill={primaryColor} />
            <rect x="54.5" y="37" width="5.5" height="2" fill={primaryColor} />
            <circle cx="42.7" cy="38" r="0.7" fill="#000" />
            <circle cx="57.2" cy="38" r="0.7" fill="#000" />
            <path d="M 39 41 Q 43 43 47 41" stroke={primaryColor} strokeWidth="0.6" fill="none" />
            <path d="M 53 41 Q 57 43 61 41" stroke={primaryColor} strokeWidth="0.6" fill="none" />

            {/* Broad Russian Nose */}
            <path d="M 50 35 L 49 46 L 46 47 L 54 47 L 51 46 Z" stroke={primaryColor} strokeWidth="1.1" fill="none" />
            <circle cx="47.5" cy="46.5" r="0.7" fill={primaryColor} />
            <circle cx="52.5" cy="46.5" r="0.7" fill={primaryColor} />

            {/* Deep Nasolabial Folds (Носогубные складки) */}
            <path d="M 44 44 Q 42 49 43 54" stroke={primaryColor} strokeWidth="0.9" fill="none" />
            <path d="M 56 44 Q 58 49 57 54" stroke={primaryColor} strokeWidth="0.9" fill="none" />

            {/* Resolute, Tightly Compressed Lips (NO smile, iron determination) */}
            <line x1="43" y1="52" x2="57" y2="52" stroke={primaryColor} strokeWidth="1.7" />
            <line x1="45" y1="54" x2="55" y2="54" stroke={primaryColor} strokeWidth="0.8" />

            {/* Prominent Square Chin */}
            <path d="M 45 57 Q 50 58.5 55 57" stroke={primaryColor} strokeWidth="1" fill="none" />
          </g>
        )}

        {/* 13. TECHNOCRAT-REFORMER (ТЕХНОКРАТ-РЕФОРМАТОР) */}
        {archetype === 'technocrat' && (
          <g>
            {/* Cybernetic schematic background traces */}
            <line x1="8" y1="20" x2="30" y2="20" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
            <line x1="30" y1="20" x2="30" y2="38" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
            <circle cx="30" cy="38" r="1.2" fill={primaryColor} opacity="0.5" />
            <line x1="92" y1="24" x2="70" y2="24" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
            <line x1="70" y1="24" x2="70" y2="42" stroke={primaryColor} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
            <circle cx="70" cy="42" r="1.2" fill={primaryColor} opacity="0.5" />

            {/* Massive Symmetric Shoulders (Y: 70..100) */}
            <polygon
              points="12,100 20,74 38,70 62,70 80,74 88,100"
              fill="#110c06"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Collar & Lapels */}
            <polygon points="38,70 50,86 42,76" fill="#181008" stroke={primaryColor} strokeWidth="0.8" />
            <polygon points="62,70 50,86 58,76" fill="#181008" stroke={primaryColor} strokeWidth="0.8" />
            {/* White Collar & Narrow Tie */}
            <polygon points="45,71 50,77 55,71" fill="#fff" opacity="0.85" />
            <polygon points="48,77 52,77 53,98 47,98" fill={primaryColor} stroke={primaryColor} strokeWidth="0.6" />
            {/* Breast pocket with fountain pens */}
            <line x1="26" y1="84" x2="35" y2="84" stroke={primaryColor} strokeWidth="0.8" />
            <line x1="28" y1="80" x2="28" y2="84" stroke={primaryColor} strokeWidth="1" />
            <line x1="31" y1="81" x2="31" y2="84" stroke={primaryColor} strokeWidth="0.9" />

            {/* Neck */}
            <path d="M 40 52 L 40 73 L 60 73 L 60 52 Z" fill="#140d07" stroke={primaryColor} strokeWidth="1" />
            <line x1="44" y1="56" x2="45" y2="70" stroke={primaryColor} strokeWidth="0.6" opacity="0.5" />
            <line x1="56" y1="56" x2="55" y2="70" stroke={primaryColor} strokeWidth="0.6" opacity="0.5" />

            {/* Head Contour (Centered at X=50, Y=38) */}
            <path
              d="M 35 34 C 34 22, 66 22, 65 34 C 65 48, 62 58, 50 58 C 38 58, 35 48, 35 34 Z"
              fill="#181109"
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            {/* Ears */}
            <path d="M 35 36 C 32 36, 32 44, 35 44" stroke={primaryColor} strokeWidth="0.9" fill="#130b05" />
            <path d="M 65 36 C 68 36, 68 44, 65 44" stroke={primaryColor} strokeWidth="0.9" fill="#130b05" />

            {/* Neat Side-Parted Intellectual Hairstyle */}
            <path
              d="M 34 32 C 34 16, 44 14, 52 14 C 64 14, 66 22, 66 32 C 60 21, 50 20, 42 22 C 38 23, 35 27, 34 32 Z"
              fill={denseDither}
              stroke={primaryColor}
              strokeWidth="1.2"
            />
            <path d="M 42 22 Q 44 14 52 14" stroke={primaryColor} strokeWidth="0.8" fill="none" />
            <path d="M 46 21 Q 48 16 54 16" stroke={primaryColor} strokeWidth="0.6" fill="none" />

            {/* Eyebrows */}
            <line x1="38" y1="33" x2="46" y2="34" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="54" y1="34" x2="62" y2="33" stroke={primaryColor} strokeWidth="1.2" />

            {/* Rectangular Cybernetics Spectacles (Очки кибернетика) */}
            <rect x="37" y="35" width="10" height="6" fill="#0d0905" stroke={primaryColor} strokeWidth="1.2" />
            <rect x="53" y="35" width="10" height="6" fill="#0d0905" stroke={primaryColor} strokeWidth="1.2" />
            <line x1="47" y1="37" x2="53" y2="37" stroke={primaryColor} strokeWidth="1.4" />
            <line x1="34" y1="37" x2="37" y2="37" stroke={primaryColor} strokeWidth="0.8" />
            <line x1="63" y1="37" x2="66" y2="37" stroke={primaryColor} strokeWidth="0.8" />

            {/* Eyes behind lenses */}
            <circle cx="42" cy="38" r="1.3" fill={primaryColor} />
            <circle cx="58" cy="38" r="1.3" fill={primaryColor} />
            <circle cx="42.4" cy="37.6" r="0.4" fill="#000" />
            <circle cx="58.4" cy="37.6" r="0.4" fill="#000" />

            {/* Intellectual Nose */}
            <path d="M 50 36 L 49 46 L 47 47 L 53 47 L 51 46 Z" stroke={primaryColor} strokeWidth="1" fill="none" />

            {/* Calm, Concentrated Mouth */}
            <line x1="44" y1="52" x2="56" y2="52" stroke={primaryColor} strokeWidth="1.3" />
            <line x1="47" y1="54" x2="53" y2="54" stroke={primaryColor} strokeWidth="0.7" />

            {/* Clean Shaven Chin */}
            <path d="M 46 56 Q 50 57 54 56" stroke={primaryColor} strokeWidth="0.8" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};
