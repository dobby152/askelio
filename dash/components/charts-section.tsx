"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

const monthlyData = [
  { month: "Led", documents: 245 },
  { month: "Úno", documents: 312 },
  { month: "Bře", documents: 189 },
  { month: "Dub", documents: 398 },
  { month: "Kvě", documents: 456 },
  { month: "Čer", documents: 523 },
]

const documentTypes = [
  { name: "Faktury", value: 45, color: "#3b82f6" },
  { name: "Smlouvy", value: 25, color: "#10b981" },
  { name: "Doklady", value: 20, color: "#f59e0b" },
  { name: "Ostatní", value: 10, color: "#ef4444" },
]

const accuracyData = [
  { month: "Led", accuracy: 96.2 },
  { month: "Úno", accuracy: 97.1 },
  { month: "Bře", accuracy: 96.8 },
  { month: "Dub", accuracy: 98.2 },
  { month: "Kvě", accuracy: 98.5 },
  { month: "Čer", accuracy: 98.7 },
]

const limits = [
  { name: "Měsíční limit", current: 2847, max: 5000, percentage: 57 },
  { name: "API volání", current: 12450, max: 20000, percentage: 62 },
  { name: "Úložiště", current: 3.2, max: 10, percentage: 32, unit: "GB" },
]

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Měsíční využití</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="documents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Document Types Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Typy dokumentů</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {documentTypes.map((type, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {type.name}: {type.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Trend přesnosti</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[95, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Limity využití</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {limits.map((limit, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{limit.name}</span>
                <span className="font-medium">
                  {limit.current.toLocaleString()}
                  {limit.unit && ` ${limit.unit}`} / {limit.max.toLocaleString()}
                  {limit.unit && ` ${limit.unit}`}
                </span>
              </div>
              <Progress value={limit.percentage} className="h-2" />
              <div className="text-xs text-gray-500 dark:text-gray-400">{limit.percentage}% využito</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
