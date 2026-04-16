'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
}

export default function CountdownTimer({ seconds: initialSeconds }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);
  
  useEffect(() => {
    if (seconds <= 0) return;
    
    const interval = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [seconds]);
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return (
    <div className="text-2xl font-mono text-gray-300">
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {secs.toString().padStart(2, '0')}
    </div>
  );
}
