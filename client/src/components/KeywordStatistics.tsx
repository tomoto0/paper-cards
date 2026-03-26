import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#06b6d4", // cyan
  "#0ea5e9", // sky
];

export function KeywordStatistics() {
  const { data: statistics = [], isLoading } = trpc.keywords.statistics.useQuery();

  // Prepare data for bar chart
  const barChartData = useMemo(() => {
    return statistics.slice(0, 10).map((stat, index) => ({
      keyword: stat.keyword.length > 15 ? stat.keyword.substring(0, 12) + "..." : stat.keyword,
      fullKeyword: stat.keyword,
      count: stat.count,
      color: COLORS[index % COLORS.length],
    }));
  }, [statistics]);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    const total = statistics.reduce((sum, stat) => sum + stat.count, 0);
    return statistics.slice(0, 8).map((stat, index) => ({
      name: stat.keyword,
      value: stat.count,
      percentage: total > 0 ? ((stat.count / total) * 100).toFixed(1) : "0",
      color: COLORS[index % COLORS.length],
    }));
  }, [statistics]);

  // Calculate total statistics
  const totalStats = useMemo(() => {
    const total = statistics.reduce((sum, stat) => sum + stat.count, 0);
    const activeCount = statistics.filter(s => s.isActive).length;
    const avgPapers = statistics.length > 0 ? (total / statistics.length).toFixed(1) : "0";

    return { total, activeCount, avgPapers };
  }, [statistics]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            キーワード統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statistics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            キーワード統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">
            統計データはまだありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-indigo-600 font-medium mb-1">総論文数</p>
              <p className="text-3xl font-bold text-indigo-900">{totalStats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-purple-600 font-medium mb-1">アクティブキーワード</p>
              <p className="text-3xl font-bold text-purple-900">{totalStats.activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-pink-600 font-medium mb-1">平均論文数</p>
              <p className="text-3xl font-bold text-pink-900">{totalStats.avgPapers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>キーワード別論文数（上位10件）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="keyword" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value}件`, "論文数"]}
                labelFormatter={(label) => {
                  const stat = statistics.find(s => s.keyword.substring(0, 12) === label);
                  return stat ? stat.keyword : label;
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>論文数の分布（上位8件）</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}件`, "論文数"]}
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>全キーワード統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">キーワード</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">論文数</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">ステータス</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">割合</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((stat, index) => {
                  const total = statistics.reduce((sum, s) => sum + s.count, 0);
                  const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : "0";
                  
                  return (
                    <tr key={stat.keywordId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-900 font-medium">{stat.keyword}</td>
                      <td className="py-3 px-4 text-right text-slate-700 font-semibold">{stat.count}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          stat.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {stat.isActive ? "アクティブ" : "非アクティブ"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
