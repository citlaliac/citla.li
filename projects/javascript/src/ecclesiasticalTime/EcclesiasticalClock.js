import React from 'react';
import { useEcclesiasticalTime } from './useEcclesiasticalTime';

function EcclesiasticalClock() {
  const { data, loading } = useEcclesiasticalTime();

  return (
    <p
      className="cec-ecclesiastical-season"
      aria-label={`Ecclesiastical time: ${data.season}`}
      aria-busy={loading}
    >
      Ecclesiastical time: {data.season}
    </p>
  );
}

export default EcclesiasticalClock;
