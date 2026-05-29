import type { CharacterId } from '../../types';

interface Props {
  characterId: CharacterId;
  size?: number;
  className?: string;
}

export function AvatarIcon({ characterId, size = 40, className = '' }: Props) {
  const colors: Record<CharacterId, { fill: string; accent: string }> = {
    char_1: { fill: '#FF6B6B', accent: '#C0392B' },
    char_2: { fill: '#FFD93D', accent: '#F39C12' },
    char_3: { fill: '#6BCB77', accent: '#27AE60' },
    char_4: { fill: '#4D96FF', accent: '#2980B9' },
    char_5: { fill: '#C77DFF', accent: '#8E44AD' },
    char_6: { fill: '#FF9F43', accent: '#E67E22' },
  };
  const { fill, accent } = colors[characterId];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 90"
      className={className}
      aria-hidden
    >
      {characterId === 'char_1' && (
        <>
          <ellipse cx="40" cy="48" rx="28" ry="30" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="22" cy="28" r="10" fill={fill} stroke={accent} strokeWidth="3" />
          <circle cx="58" cy="28" r="10" fill={fill} stroke={accent} strokeWidth="3" />
          <circle cx="30" cy="46" r="4" fill={accent} />
          <circle cx="50" cy="46" r="4" fill={accent} />
          <path d="M32 58 Q40 66 48 58" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {characterId === 'char_2' && (
        <>
          <ellipse cx="40" cy="52" rx="26" ry="28" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 20 L28 8 L36 22 L44 6 L52 20 L60 10 L68 24" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="30" cy="50" r="4" fill={accent} />
          <circle cx="50" cy="50" r="4" fill={accent} />
        </>
      )}
      {characterId === 'char_3' && (
        <>
          <ellipse cx="40" cy="50" rx="28" ry="30" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 18 Q40 8 52 18 Q48 28 40 26 Q32 28 28 18" fill={fill} stroke={accent} strokeWidth="3" />
          <circle cx="30" cy="48" r="4" fill={accent} />
          <circle cx="50" cy="48" r="4" fill={accent} />
          <path d="M34 60 Q40 68 46 60" fill="none" stroke={accent} strokeWidth="2" />
        </>
      )}
      {characterId === 'char_4' && (
        <>
          <ellipse cx="40" cy="50" rx="28" ry="30" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <rect x="22" y="38" width="14" height="10" rx="2" fill="none" stroke={accent} strokeWidth="3" />
          <rect x="44" y="38" width="14" height="10" rx="2" fill="none" stroke={accent} strokeWidth="3" />
          <line x1="36" y1="43" x2="44" y2="43" stroke={accent} strokeWidth="2" />
          <circle cx="30" cy="54" r="3" fill={accent} />
          <circle cx="50" cy="54" r="3" fill={accent} />
        </>
      )}
      {characterId === 'char_5' && (
        <>
          <ellipse cx="40" cy="52" rx="26" ry="28" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <line x1="32" y1="12" x2="28" y2="0" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="12" x2="52" y2="0" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="50" r="4" fill={accent} />
          <circle cx="50" cy="50" r="4" fill={accent} />
        </>
      )}
      {characterId === 'char_6' && (
        <>
          <ellipse cx="40" cy="52" rx="26" ry="28" fill={fill} stroke={accent} strokeWidth="3" strokeLinejoin="round" />
          <rect x="28" y="8" width="24" height="8" rx="2" fill={accent} stroke={accent} strokeWidth="2" />
          <circle cx="30" cy="50" r="4" fill={accent} />
          <circle cx="50" cy="50" r="4" fill={accent} />
          <path d="M34 62 Q40 70 46 62" fill="none" stroke={accent} strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
