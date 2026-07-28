import { Box, Stack, Typography, useTheme } from '@mui/material';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
}

/** Lightweight responsive bar chart built with SVG — no external chart dependency. */
export function BarChart({ data, height = 180, formatValue }: BarChartProps) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height, display: 'flex', alignItems: 'flex-end', gap: 1.5, px: 1 }}>
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 28);
          return (
            <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                {formatValue ? formatValue(d.value) : d.value.toLocaleString()}
              </Typography>
              <Box sx={{
                width: '100%',
                maxWidth: 44,
                height: Math.max(2, h),
                borderRadius: '6px 6px 0 0',
                backgroundColor: d.color ?? theme.palette.primary.main,
                transition: 'height 0.3s ease',
              }} />
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" sx={{ mt: 1, px: 1 }} flexWrap="wrap">
        {data.map((d, i) => (
          <Box key={i} sx={{ flex: 1, minWidth: 60, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{d.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

/** SVG donut chart with center label. */
export function DonutChart({ data, size = 160, thickness = 22, centerLabel, centerValue }: DonutChartProps) {
  const theme = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const palette = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];
  const segments = data.reduce<{ value: number; offset: number }[]>((acc, d) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].value : 0;
    acc.push({ value: (d.value / total) * circumference, offset: prevOffset });
    return acc;
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.palette.divider} strokeWidth={thickness} />
          {data.map((d, i) => {
            const { value, offset } = segments[i];
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color ?? palette[i % palette.length]}
                strokeWidth={thickness}
                strokeDasharray={`${value} ${circumference - value}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            return seg;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {centerValue && <Typography variant="h5" fontWeight={800} color="text.primary">{centerValue}</Typography>}
            {centerLabel && <Typography variant="caption" color="text.secondary">{centerLabel}</Typography>}
          </Box>
        )}
      </Box>
      <Stack spacing={1}>
        {data.map((d, i) => (
          <Stack key={i} direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: d.color ?? palette[i % palette.length] }} />
            <Typography variant="body2" color="text.secondary">{d.label}</Typography>
            <Typography variant="body2" fontWeight={700} color="text.primary">{d.value.toLocaleString()}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

/** SVG line/area chart for trend visualization. */
export function LineChart({ data, height = 180, color, formatValue }: LineChartProps) {
  const theme = useTheme();
  const stroke = color ?? theme.palette.primary.main;
  const width = 600;
  const pad = 8;
  const max = Math.max(1, ...data.map(d => d.value));
  const min = Math.min(0, ...data.map(d => d.value));
  const range = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (d.value - min) / range);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points[points.length - 1]?.x.toFixed(1) ?? 0} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <Box sx={{ width: '100%' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
        ))}
      </svg>
      <Stack direction="row" sx={{ mt: 1 }} flexWrap="wrap">
        {data.map((d, i) => (
          <Box key={i} sx={{ flex: 1, minWidth: 50, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{d.label}</Typography>
            {formatValue && <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', fontSize: '0.7rem' }}>{formatValue(d.value)}</Typography>}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
