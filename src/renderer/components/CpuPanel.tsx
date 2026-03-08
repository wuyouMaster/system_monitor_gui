import React, { useMemo, useRef } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { DeveloperBoard as CpuIcon } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface CpuPanelProps {
  cpu: {
    physicalCores: number;
    logicalCores: number;
    modelName: string;
    vendor: string;
    frequencyMhz: number;
  };
  cpuUsage: number[];
}

// 2 分钟历史 = 120 秒 / 1.5 秒采样间隔 ≈ 80 个点
const HISTORY_SIZE = 80;

const getUsageColor = (percent: number) => {
  if (percent < 60) return '#34C759';
  if (percent < 80) return '#FF9500';
  return '#FF3B30';
};

interface CpuCoreCardProps {
  coreIndex: number;
  usageHistory: number[];
  currentUsage: number;
}

const CpuCoreCard: React.FC<CpuCoreCardProps> = React.memo(({ coreIndex, usageHistory, currentUsage }) => {
  const chartData = useMemo(
    () => usageHistory.map((usage, index) => ({ index, usage })),
    [usageHistory]
  );

  const color = getUsageColor(currentUsage);

  return (
    <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" sx={{ color: 'rgba(235,235,245,0.5)', fontWeight: 500 }}>
            Core {coreIndex}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color, 
              fontWeight: 700, 
              fontSize: 14,
              minWidth: 40,
              textAlign: 'right'
            }}
          >
            {currentUsage.toFixed(1)}%
          </Typography>
        </Box>
        <Box sx={{ height: 48 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="usage"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

export const CpuPanel: React.FC<CpuPanelProps> = React.memo(({ cpu, cpuUsage }) => {
  // Filter out NaN/Infinity values
  const validUsage = useMemo(
    () => cpuUsage.filter((v) => Number.isFinite(v)),
    [cpuUsage],
  );

  // 使用 useRef 保存每个核心的历史记录
  const historyRef = useRef<number[][]>([]);
  
  // 使用 state 触发重新渲染
  const [, setTick] = React.useState(0);

  // 使用 useEffect 更新历史记录
  React.useEffect(() => {
    if (validUsage.length === 0) {
      return;
    }

    // 核心数量变化时重建历史，避免索引错位
    if (historyRef.current.length !== validUsage.length) {
      historyRef.current = validUsage.map((usage) => [usage]);
      setTick((t) => t + 1);
      return;
    }

    // 使用不可变更新，确保子组件能感知历史变化并刷新曲线
    historyRef.current = historyRef.current.map((history, index) => {
      const next = [...history, validUsage[index]];
      if (next.length > HISTORY_SIZE) {
        next.shift();
      }
      return next;
    });

    // 触发重新渲染
    setTick((t) => t + 1);
  }, [validUsage]);

  const avgUsage = useMemo(
    () => (validUsage.length > 0 ? validUsage.reduce((a, b) => a + b, 0) / validUsage.length : 0),
    [validUsage],
  );

  const color = getUsageColor(avgUsage);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2} gap={1} sx={{ pointerEvents: 'none' }}>
          <CpuIcon sx={{ fontSize: 20, color: '#007AFF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.3 }}>
            CPU
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pointerEvents: 'none' }}>
          {cpu.modelName}
        </Typography>

        {/* 平均利用率 */}
        <Box
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ pointerEvents: 'none', p: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            Average Usage
          </Typography>
          <Typography variant="h5" sx={{ color, fontWeight: 700, letterSpacing: -0.3 }}>
            {avgUsage.toFixed(1)}%
          </Typography>
        </Box>

        {/* 每个核心的卡片网格 */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))"
          gap={1.5}
          sx={{ maxHeight: 400, overflowY: 'auto' }}
        >
          {historyRef.current.map((history, index) => (
            <CpuCoreCard
              key={index}
              coreIndex={index}
              usageHistory={history}
              currentUsage={validUsage[index] || 0}
            />
          ))}
        </Box>

        {/* 核心数统计 */}
        <Box display="flex" gap={2} mt={2} sx={{ pointerEvents: 'none' }}>
          <Typography variant="caption" color="text.secondary">
            Physical: {cpu.physicalCores}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Logical: {cpu.logicalCores}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cpu.vendor}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});
