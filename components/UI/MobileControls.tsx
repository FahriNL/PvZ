
import React, { useRef, useState, useEffect } from 'react';
import { Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  opacity: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onMove, onShootStart, onShootEnd, opacity }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [touchId, setTouchId] = useState<number | null>(null);

  // Joystick Logic
  const handleStart = (e: React.TouchEvent) => {
    // Only accept if we aren't already tracking a touch
    if (touchId !== null) return;
    
    // Explicitly cast to React.Touch to avoid 'unknown' type errors
    const touch = e.changedTouches[0] as React.Touch;
    setTouchId(touch.identifier);
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleMove = (e: React.TouchEvent) => {
    if (touchId === null) return;
    
    // Find our touch - iterate manually to avoid issues with Array.from on TouchList
    let touch: React.Touch | undefined;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i] as React.Touch;
      if (t.identifier === touchId) {
        touch = t;
        break;
      }
    }
    
    if (!touch) return;
    
    updatePosition(touch.clientX, touch.clientY);
  };

  const handleEnd = (e: React.TouchEvent) => {
    if (touchId === null) return;
    
    let touch: React.Touch | undefined;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i] as React.Touch;
      if (t.identifier === touchId) {
        touch = t;
        break;
      }
    }

    if (touch) {
      setTouchId(null);
      setPosition({ x: 0, y: 0 });
      onMove(0, 0);
    }
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize if outside circle
    if (distance > maxRadius) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxRadius;
      dy = Math.sin(angle) * maxRadius;
    }

    setPosition({ x: dx, y: dy });
    
    // Send normalized -1 to 1 values
    onMove(dx / maxRadius, dy / maxRadius);
  };

  return (
    <>
      {/* JOYSTICK AREA (Bottom Left) */}
      <div 
        className="absolute bottom-10 left-10 w-40 h-40 z-40 touch-none select-none"
        style={{ opacity }}
        ref={joystickRef}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        {/* Base */}
        <div className="absolute inset-0 bg-white/20 rounded-full border-2 border-white/30 backdrop-blur-sm" />
        
        {/* Stick */}
        <div 
          className="absolute w-16 h-16 bg-white/50 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ 
            left: `calc(50% + ${position.x}px)`, 
            top: `calc(50% + ${position.y}px)`,
            transition: touchId === null ? 'all 0.1s ease-out' : 'none'
          }}
        />
      </div>

      {/* SHOOT BUTTON (Bottom Right) */}
      <div 
        className="absolute bottom-12 right-12 z-40 touch-none select-none"
        style={{ opacity }}
      >
        <button
          className="w-24 h-24 bg-red-500/80 rounded-full border-4 border-red-300 shadow-xl flex items-center justify-center active:scale-95 active:bg-red-600 transition-all backdrop-blur-sm"
          onTouchStart={(e) => { e.preventDefault(); onShootStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onShootEnd(); }}
          onMouseDown={onShootStart}
          onMouseUp={onShootEnd}
          onMouseLeave={onShootEnd}
        >
          <Crosshair className="w-10 h-10 text-white" />
        </button>
      </div>
    </>
  );
};
