import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Youtube,
  Twitter,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";

// サンプルデータ生成
const generateYouTubeData = () => {
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      subscribers: 6000 + Math.floor(Math.random() * 500) + (6 - i) * 350,
      views: 5000 + Math.floor(Math.random() * 2000) + (6 - i) * 400,
    });
  }
  return data;
};

const generateXData = () => {
  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      followers: 8500 + Math.floor(Math.random() * 200) - i * 30,
      engagement: 3.5 + Math.random() * 1.5 + i * 0.3,
    });
  }
  return data;
};

const youtubeData = generateYouTubeData();
const xData = generateXData();

const chartConfig = {
  subscribers: {
    label: "登録者数",
    color: "hsl(0, 84%, 60%)",
  },
  views: {
    label: "視聴回数",
    color: "hsl(221, 83%, 53%)",
  },
  followers: {
    label: "フォロワー数",
    color: "hsl(210, 100%, 50%)",
  },
  engagement: {
    label: "エンゲージメント率",
    color: "hsl(340, 82%, 52%)",
  },
};

export default function Dashboard() {
  const kpiData = {
    youtube: {
      subscribers: 12345,
      subscribersChange: 12.5,
      avgViewers: 234,
      avgViewersChange: 8.2,
      totalViews: 456789,
      totalViewsChange: 15.3,
    },
    x: {
      followers: 8567,
      followersChange: -2.1,
      engagement: 4.2,
      engagementChange: 1.2,
      impressions: 123456,
      impressionsChange: 5.8,
    },
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">ダッシュボード</h1>
      </div>

      {/* 主要KPI - コンパクトに配置 */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* YouTube KPI */}
        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground font-medium">登録者</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {kpiData.youtube.subscribers.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400 mr-0.5" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{kpiData.youtube.subscribersChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground font-medium">平均視聴者</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {kpiData.youtube.avgViewers.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400 mr-0.5" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{kpiData.youtube.avgViewersChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground font-medium">総視聴回数</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {(kpiData.youtube.totalViews / 1000).toFixed(0)}K
            </div>
            <div className="flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400 mr-0.5" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{kpiData.youtube.totalViewsChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>

        {/* X KPI */}
        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground font-medium">フォロワー</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {kpiData.x.followers.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400 mr-0.5" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                {kpiData.x.followersChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-xs text-muted-foreground font-medium">エンゲージ</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {kpiData.x.engagement}%
            </div>
            <div className="flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400 mr-0.5" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{kpiData.x.engagementChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-500" />
                <span className="text-xs text-muted-foreground font-medium">インプレッション</span>
              </div>
            </div>
            <div className="text-2xl font-semibold mb-1">
              {(kpiData.x.impressions / 1000).toFixed(0)}K
            </div>
            <div className="flex items-center text-xs">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400 mr-0.5" />
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{kpiData.x.impressionsChange}%
              </span>
              <span className="text-muted-foreground ml-1">前週比</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* グラフセクション - 2列で配置 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* YouTube トレンド */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                YouTube トレンド
              </CardTitle>
              <Badge variant="outline" className="text-xs">過去7日間</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <AreaChart data={youtubeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSubscribers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <div className="text-xs text-muted-foreground mb-2">
                            {payload[0].payload.date}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                <span className="text-xs">登録者数</span>
                              </div>
                              <span className="text-xs font-semibold">
                                {payload[0].value?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fill="url(#fillSubscribers)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* X トレンド */}
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-400" />
                X トレンド
              </CardTitle>
              <Badge variant="outline" className="text-xs">過去7日間</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart data={xData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                          <div className="text-xs text-muted-foreground mb-2">
                            {payload[0].payload.date}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                                <span className="text-xs">フォロワー数</span>
                              </div>
                              <span className="text-xs font-semibold">
                                {payload[0].value?.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-pink-500" />
                                <span className="text-xs">エンゲージメント</span>
                              </div>
                              <span className="text-xs font-semibold">
                                {typeof payload[1]?.value === 'number' ? payload[1].value.toFixed(1) : payload[1]?.value}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(210, 100%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(340, 82%, 52%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* サマリー情報 - コンパクトに */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              最近の配信
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "雑談配信 #123", viewers: 245, date: "2時間前" },
                { title: "ゲーム実況 - Part 5", viewers: 312, date: "1日前" },
                { title: "歌枠配信", viewers: 567, date: "2日前" },
              ].map((stream, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{stream.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stream.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-4">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="font-medium">{stream.viewers}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Twitter className="h-4 w-4 text-blue-400" />
              X トレンドタグ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { tag: "#VTuber", count: 1234, trend: "up" },
                { tag: "#配信中", count: 567, trend: "up" },
                { tag: "#ゲーム実況", count: 432, trend: "stable" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.tag}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.trend === "up" ? "上昇中" : "安定"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-4">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="font-medium">{item.count.toLocaleString()}件</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
