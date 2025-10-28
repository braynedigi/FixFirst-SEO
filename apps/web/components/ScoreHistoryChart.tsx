'use client';

import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

interface AuditHistory {
  id: string;
  url: string;
  totalScore: number;
  technicalScore: number;
  onPageScore: number;
  structuredDataScore: number;
  performanceScore: number;
  localSeoScore: number;
  startedAt: string;
  completedAt: string;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
}

interface ScoreHistoryChartProps {
  data: AuditHistory[];
  projectName: string;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';
type ChartType = 'line' | 'area';

export default function ScoreHistoryChart({ data, projectName }: ScoreHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['totalScore', 'performanceScore', 'technicalScore']);

  // Filter data by time range
  const filterDataByTimeRange = (data: AuditHistory[], range: TimeRange) => {
    if (range === 'all') return data;

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter((item) => new Date(item.completedAt) >= cutoffDate);
  };

  const filteredData = filterDataByTimeRange(data, timeRange);

  // Format data for charts
  const chartData = filteredData.map((item) => ({
    date: new Date(item.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(item.completedAt).toLocaleString(),
    totalScore: item.totalScore,
    technicalScore: item.technicalScore,
    onPageScore: item.onPageScore,
    structuredDataScore: item.structuredDataScore,
    performanceScore: item.performanceScore,
    localSeoScore: item.localSeoScore,
    criticalIssues: item.criticalIssues,
    warningIssues: item.warningIssues,
    infoIssues: item.infoIssues,
  })).reverse(); // Oldest to newest

  // Calculate trend
  const calculateTrend = (data: AuditHistory[]) => {
    if (data.length < 2) return { direction: 'neutral', value: 0 };

    const oldest = data[data.length - 1].totalScore;
    const newest = data[0].totalScore;
    const change = newest - oldest;
    const percentage = ((change / oldest) * 100).toFixed(1);

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      value: Math.abs(parseFloat(percentage)),
      rawChange: change,
    };
  };

  const trend = calculateTrend(filteredData);

  // Metric options
  const metrics = [
    { key: 'totalScore', label: 'Overall Score', color: '#8b5cf6' },
    { key: 'performanceScore', label: 'Performance', color: '#3b82f6' },
    { key: 'technicalScore', label: 'Technical', color: '#10b981' },
    { key: 'onPageScore', label: 'On-Page', color: '#f59e0b' },
    { key: 'structuredDataScore', label: 'Structured Data', color: '#ec4899' },
    { key: 'localSeoScore', label: 'Local SEO', color: '#6366f1' },
  ];

  const toggleMetric = (key: string) => {
    if (selectedMetrics.includes(key)) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((m) => m !== key));
      }
    } else {
      setSelectedMetrics([...selectedMetrics, key]);
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-card border border-border rounded-lg p-4 shadow-lg">
          <p className="text-sm text-text-secondary mb-2">{payload[0].payload.fullDate}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
              <span className="text-sm" style={{ color: entry.color }}>
                {metrics.find((m) => m.key === entry.name)?.label || entry.name}:
              </span>
              <span className="font-bold text-sm" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-background-card border border-border rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <p className="text-text-secondary">No audit history available yet.</p>
        <p className="text-sm text-text-tertiary mt-2">Run more audits to see trends over time.</p>
      </div>
    );
  }

  return (
    <div className="bg-background-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary">SEO Score History</h3>
          <p className="text-sm text-text-secondary mt-1">{projectName}</p>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2">
          {trend.direction === 'up' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
              <div>
                <div className="text-sm font-bold text-success">+{trend.value}%</div>
                <div className="text-xs text-success/80">Improving</div>
              </div>
            </div>
          )}
          {trend.direction === 'down' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-error/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-error" />
              <div>
                <div className="text-sm font-bold text-error">-{trend.value}%</div>
                <div className="text-xs text-error/80">Declining</div>
              </div>
            </div>
          )}
          {trend.direction === 'neutral' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-text-tertiary/10 rounded-lg">
              <Minus className="w-5 h-5 text-text-tertiary" />
              <div>
                <div className="text-sm font-bold text-text-secondary">No Change</div>
                <div className="text-xs text-text-tertiary">Stable</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Time Range Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Time Range:</span>
          <div className="flex gap-1 bg-background-secondary rounded-lg p-1">
            {[
              { value: '7d' as TimeRange, label: '7 Days' },
              { value: '30d' as TimeRange, label: '30 Days' },
              { value: '90d' as TimeRange, label: '90 Days' },
              { value: 'all' as TimeRange, label: 'All Time' },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  timeRange === range.value
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Chart Type:</span>
          <div className="flex gap-1 bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                chartType === 'area'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Metric Selectors */}
      <div className="mb-6">
        <span className="text-sm text-text-secondary mb-2 block">Select Metrics:</span>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                selectedMetrics.includes(metric.key)
                  ? 'border-current text-white'
                  : 'border-border text-text-secondary hover:border-text-secondary'
              }`}
              style={{
                backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : 'transparent',
                borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map((metricKey) => {
                const metric = metrics.find((m) => m.key === metricKey);
                return (
                  <Area
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric?.color}
                    fill={metric?.color}
                    fillOpacity={0.3}
                    name={metric?.label}
                  />
                );
              })}
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedMetrics.map((metricKey) => {
                const metric = metrics.find((m) => m.key === metricKey);
                return (
                  <Line
                    key={metricKey}
                    type="monotone"
                    dataKey={metricKey}
                    stroke={metric?.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={metric?.label}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div>
          <p className="text-sm text-text-secondary">Average Score</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {(chartData.reduce((sum, item) => sum + item.totalScore, 0) / chartData.length).toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Best Score</p>
          <p className="text-2xl font-bold text-success mt-1">
            {Math.max(...chartData.map((item) => item.totalScore))}
          </p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Total Audits</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{chartData.length}</p>
        </div>
      </div>
    </div>
  );
}

