"use client";

/* ---------- Bar ---------- */
export function Bar({
  pct,
  color = "bg-primary-container",
  track = "bg-surface-container-high",
  h = "h-1",
  glow = false,
  shimmer = false,
}: {
  pct: number;
  color?: string;
  track?: string;
  h?: string;
  glow?: boolean;
  shimmer?: boolean;
}) {
  return (
    <div className={"w-full " + h + " " + track + " rounded-full overflow-hidden"}>
      <div
        className={"h-full " + color + " relative " + (glow ? "neon-glow " : "")}
        style={{ width: Math.min(100, pct) + "%" }}
      >
        {shimmer && (
          <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ---------- AreaChart ---------- */
export function AreaChart({
  data,
  w = 640,
  h = 150,
  stroke = "#00f0ff",
  fill = "rgba(0,240,255,0.12)",
  className = "",
}: {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.15 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const X = (i: number) => (i / (data.length - 1)) * w;
  const Y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const line = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = "g_area_chart";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height: h }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(0,240,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle
        cx={X(data.length - 1)}
        cy={Y(data[data.length - 1])}
        r="3.5"
        fill={stroke}
      />
    </svg>
  );
}

/* ---------- Spark ---------- */
export function Spark({
  data,
  w = 120,
  h = 32,
  stroke = "#34e0a1",
}: {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const X = (i: number) => (i / (data.length - 1)) * w;
  const Y = (v: number) => h - ((v - min) / (max - min || 1)) * h;
  const line = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: w, height: h }}
    >
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Donut ---------- */
export function Donut({
  segments,
  size = 168,
  thickness = 18,
}: {
  segments: Array<{ pct: number; color: string }>;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1d2026"
        strokeWidth={thickness}
      />
      {segments.map((s, i) => {
        const len = (s.pct / 100) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
