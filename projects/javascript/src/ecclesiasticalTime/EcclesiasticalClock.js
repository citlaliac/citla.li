import React from 'react';
import { getCecSeasonTheme } from '../cec/cecSeasonTheme';
import { useEcclesiasticalTime } from './useEcclesiasticalTime';

function EcclesiasticalClock({ themeId }) {
  const { data, loading } = useEcclesiasticalTime();
  const activeId = themeId ?? data.themeId ?? 'ordinary';
  const theme = getCecSeasonTheme(activeId);
  const isPreview = themeId && themeId !== data.themeId;
  const seasonLine = isPreview ? `${theme.label} (preview)` : data.season;

  return (
    <p
      className="cec-ecclesiastical-season"
      aria-label={`Ecclesiastical time: ${seasonLine}`}
      aria-busy={loading}
    >
      Ecclesiastical time: {seasonLine}
    </p>
  );
}

export default EcclesiasticalClock;
