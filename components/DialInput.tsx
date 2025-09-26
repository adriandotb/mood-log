import React from 'react';

interface DialInputProps {
  label: string;
  name: string;
  value: number | '';
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  size?: number;
}

// Helper to clamp value
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function DialInput({
  label,
  name,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  color = '#6366f1', // Tailwind indigo-500
  size = 64,
}: DialInputProps) {
  // Responsive: shrink dial on small screens
  const actualSize = typeof window !== 'undefined' && window.innerWidth < 400 ? 44 : size;
  const stroke = actualSize / 8;
  const radius = (actualSize - stroke) / 2;
  const center = actualSize / 2;
  const angleRange = 270; // degrees
  const startAngle = 135; // degrees
  const endAngle = startAngle + angleRange;
  const steps = Math.floor((max - min) / step) + 1;
  const current = typeof value === 'number' ? value : min;
  // Use (max - min) for correct spread (so 1-10 covers full arc)
  const percent = (current - min) / (max - min);
  const angle = startAngle + percent * angleRange;

  // Convert angle to SVG coordinates
  function angleToXY(a: number) {
    const rad = (a * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  }

  // Mouse/touch event handler
  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    if (e.type === 'pointerdown') {
      try { svg.setPointerCapture(e.pointerId); } catch {}
    }
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    // Angle in degrees (0 at +X axis, increasing counter‑clockwise)
    let deg = (Math.atan2(y, x) * 180) / Math.PI; // -180..180
    deg = (deg + 360) % 360; // 0..360
    // Compute sweep from startAngle going forward; wrap so sweep is 0..360
    let sweep = (deg - startAngle + 360) % 360; // 0..360
    if (sweep > angleRange) sweep = angleRange; // clamp to dial arc span
    const pct = sweep / angleRange; // 0..1
    let raw = min + pct * (max - min);
    // Snap to step
    raw = Math.round(raw / step) * step;
    const v = clamp(raw, min, max);
    if (v !== value) onChange(v);
  }

  // Keyboard support
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      onChange(clamp(current - step, min, max));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      onChange(clamp(current + step, min, max));
    }
  }

  // Arc for filled value
  const arcStart = angleToXY(startAngle);
  const arcEnd = angleToXY(angle);
  // Only draw arc if value > min
  const drawArc = current > min;
  // For SVG arc sweep, largeArc=1 if angle covers more than 180deg
  const sweep = angle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  const arcPath = drawArc
    ? `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`
    : '';

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* No label here, label is in table row */}
      <svg
        width={actualSize}
        height={actualSize}
        tabIndex={0}
        role="slider"
        aria-valuenow={current}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        onPointerDown={handlePointer}
        onPointerMove={e => e.buttons === 1 && handlePointer(e)}
        onKeyDown={handleKey}
        className="cursor-pointer touch-none outline-none focus:ring-2 focus:ring-brand-500"
        style={{ display: 'block' }}
      >
        {/* Track */}
        <path
          d={`M ${angleToXY(startAngle).x} ${angleToXY(startAngle).y} A ${radius} ${radius} 0 1 1 ${angleToXY(endAngle).x} ${angleToXY(endAngle).y}`}
          stroke="#334155"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {drawArc && (
          <path
            d={arcPath}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Knob */}
        <circle
          cx={arcEnd.x}
          cy={arcEnd.y}
          r={stroke / 1.5}
          fill={color}
          stroke="#fff"
          strokeWidth={2}
        />
        {/* Center value */}
        <text
          x={center}
          y={center + (actualSize / 18)}
          textAnchor="middle"
          fontSize={actualSize / 3.2}
          fill="#fff"
          fontWeight="bold"
        >
          {current}
        </text>
      </svg>
      <input type="hidden" name={name} value={current} />
    </div>
  );
}
