"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { formatCompactNumber } from '@/lib/utils';

interface RawTrafficData {
  key: string;
  hits: number;
}

export function BlastRadiusChart({ data }: { data: RawTrafficData[] }) {
  // 🚀 Sort by hits descending to show the 'hottest' flags first
  const chartData = [...data]
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 8); // Top 8 for visual clarity

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="4 4" 
            vertical={false} 
            stroke="#1e293b" 
            opacity={0.5} 
          />
          <XAxis 
            dataKey="key" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#94a3b8', fontWeight: 600 }}
            dy={10}
            // Capitalize for the UI
            tickFormatter={(str) => str.split('_').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tick={{ fill: '#64748b' }}
            tickFormatter={(value) => formatCompactNumber(value)} 
          />
          <Tooltip 
            cursor={{ fill: '#1e293b', opacity: 0.4 }}
            content={<CustomTooltip />}
          />
          <Bar 
            dataKey="hits" 
            radius={[6, 6, 0, 0]} 
            barSize={32}
            animationDuration={1500}
          >
            {chartData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? '#6366f1' : '#4f46e5'} 
                fillOpacity={1 - (index * 0.1)} // Gradient fade for lower-traffic bars
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 🕵️ Custom Tooltip
 * Matches the GitGuardian AI Detail Modal aesthetic.
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Feature Key</p>
        <p className="text-sm font-bold text-white mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-xs font-mono text-indigo-400">
            {payload[0].value.toLocaleString()} Total Hits
          </p>
        </div>
      </div>
    );
  }
  return null;
}