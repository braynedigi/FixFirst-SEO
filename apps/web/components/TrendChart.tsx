'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface TrendData {
  date: string
  totalScore: number
  technical?: number
  onPage?: number
  structuredData?: number
  performance?: number
  localSeo?: number
}

interface TrendChartProps {
  data: TrendData[]
  showCategories?: boolean
  height?: number
  title?: string
}

export default function TrendChart({ data, showCategories = false, height = 300, title }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary">
        <div className="text-center">
          <p className="text-lg mb-2">No trend data available</p>
          <p className="text-sm">Run more audits to see trends over time</p>
        </div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM d'),
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2 text-text-primary">
            {format(new Date(payload[0].payload.date), 'MMM d, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8" 
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: '#f0f9ff', fontSize: '12px' }}
            iconType="line"
          />
          
          {/* Total Score - Always show */}
          <Line
            type="monotone"
            dataKey="totalScore"
            name="Total Score"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ fill: '#06b6d4', r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Category Scores - Optional */}
          {showCategories && (
            <>
              <Line
                type="monotone"
                dataKey="technical"
                name="Technical"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ fill: '#14b8a6', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="onPage"
                name="On-Page"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="performance"
                name="Performance"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: '#fbbf24', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="structuredData"
                name="Schema"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ fill: '#a78bfa', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="localSeo"
                name="Local SEO"
                stroke="#f472b6"
                strokeWidth={2}
                dot={{ fill: '#f472b6', r: 3 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Stats below chart */}
      {data.length > 1 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Latest Score"
            value={data[data.length - 1].totalScore}
            color="text-primary"
          />
          <StatCard
            label="Average"
            value={Math.round(data.reduce((sum, d) => sum + d.totalScore, 0) / data.length)}
            color="text-accent"
          />
          <StatCard
            label="Best"
            value={Math.max(...data.map(d => d.totalScore))}
            color="text-success"
          />
          <StatCard
            label="Change"
            value={data[data.length - 1].totalScore - data[0].totalScore}
            showSign
            color={
              data[data.length - 1].totalScore >= data[0].totalScore
                ? 'text-success'
                : 'text-error'
            }
          />
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  showSign = false,
}: {
  label: string
  value: number
  color: string
  showSign?: boolean
}) {
  return (
    <div className="bg-background-secondary rounded-lg p-3 border border-border">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {showSign && value > 0 && '+'}
        {value}
      </p>
    </div>
  )
}

