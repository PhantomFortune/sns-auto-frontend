import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Activity,
  X,
  Play,
  Square,
  RefreshCw,
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  Zap,
  Video,
  Image as ImageIcon,
  FileVideo,
  Upload,
  FolderOpen,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// 視聴者データ生成
const generateViewerData = () => {
  const now = new Date();
  const data = [];
  let currentViewers = 120;
  const baseTrend = 250;
  
  let seed = 12345;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  for (let i = 60; i >= 0; i -= 2) {
    const minutesAgo = i;
    const time = new Date(now.getTime() - minutesAgo * 60 * 1000);
    
    const progress = (60 - minutesAgo) / 60;
    const trendBase = 120 + (baseTrend - 120) * progress;
    const variation = (random() - 0.5) * 80;
    const spike = random() > 0.9 ? (random() * 150 + 50) : 0;
    const drop = random() > 0.85 ? -(random() * 100 + 30) : 0;
    
    const target = trendBase + variation + spike + drop;
    const momentum = 0.3;
    currentViewers = currentViewers * momentum + target * (1 - momentum);
    const noise = (random() - 0.5) * 15;
    currentViewers += noise;
    currentViewers = Math.max(80, Math.min(600, Math.round(currentViewers)));
    
    data.push({
      time: time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      minutesAgo: minutesAgo,
      viewers: currentViewers,
    });
  }
  
  return data;
};

const chartData = generateViewerData();

const chartConfig = {
  viewers: {
    label: "同時接続数",
    color: "hsl(var(--primary))",
  },
};

function ConcurrentViewersChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fillViewers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="time"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <ChartTooltipContent>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium">{data.time}</div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-sm">
                        {data.viewers.toLocaleString()}人
                      </span>
                    </div>
                  </div>
                </ChartTooltipContent>
              );
            }
            return null;
          }}
        />
        <Area
          type="linear"
          dataKey="viewers"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#fillViewers)"
          dot={false}
          activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// サンプルデータ
const sampleComments = [
  "配信お疲れ様です！",
  "めっちゃ面白い！",
  "また来ます〜",
  "登録しました！",
  "次回も楽しみ",
  "ありがとうございます！",
];

const sampleUsers = [
  "視聴者A", "視聴者B", "視聴者C", "視聴者D", "視聴者E", "視聴者F",
];

const superChatAmounts = ["¥500", "¥1,000", "¥2,000", "¥5,000"];

interface Comment {
  id: string;
  user: string;
  comment: string;
  time: string;
}

interface SuperChat {
  id: string;
  user: string;
  amount: string;
  message: string;
  time: string;
}

interface StreamSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
}

interface StreamSource {
  id: string;
  name: string;
  type: "file" | "realtime";
  filePath?: string;
  fileName?: string;
}

interface BroadcastRoom {
  scheduleId: string;
  scheduleTitle: string;
  sources: StreamSource[];
  isReady: boolean;
  recordingEnabled: boolean;
}

export default function LiveMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [concurrentViewers, setConcurrentViewers] = useState(353);
  const [totalViews, setTotalViews] = useState(1234);
  const [totalLikes, setTotalLikes] = useState(456);
  const [totalComments, setTotalComments] = useState(2345);
  const [upcomingSchedule, setUpcomingSchedule] = useState<StreamSchedule | null>(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(true);
  const [timeUntilSchedule, setTimeUntilSchedule] = useState<string>("");
  const [autoStartTriggered, setAutoStartTriggered] = useState<string | null>(null);
  const [broadcastRoom, setBroadcastRoom] = useState<BroadcastRoom | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [realtimeRecording, setRealtimeRecording] = useState(false);
  const [streamSourceType, setStreamSourceType] = useState<"file" | "realtime">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [comments, setComments] = useState<Comment[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: `comment-${i}`,
      user: sampleUsers[i % sampleUsers.length],
      comment: sampleComments[i % sampleComments.length],
      time: `${i * 3}秒前`,
    }));
  });

  const [superChats, setSuperChats] = useState<SuperChat[]>(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      id: `sc-${i}`,
      user: sampleUsers[(i + 2) % sampleUsers.length],
      amount: superChatAmounts[i % superChatAmounts.length],
      message: "応援してます！",
      time: `${(i + 1) * 2}分前`,
    }));
  });

  // スケジュールを読み込む
  useEffect(() => {
    const loadSchedules = () => {
      try {
        const savedSchedules = localStorage.getItem('streamSchedules');
        if (savedSchedules) {
          const schedules: StreamSchedule[] = JSON.parse(savedSchedules);
          const now = new Date();
          
          // 次のスケジュールを探す（現在時刻より後の最も近いスケジュールのみ）
          const validSchedules = schedules
            .filter(s => s.date && s.time)
            .map(s => {
              const [year, month, day] = s.date.split('-').map(Number);
              const [hours, minutes] = s.time.split(':').map(Number);
              const scheduleDate = new Date(year, month - 1, day, hours, minutes);
              return { ...s, scheduleDate };
            })
            .filter(s => {
              // 現在時刻より後のスケジュールのみ（30分以内に開始したものも含める）
              const diff = s.scheduleDate.getTime() - now.getTime();
              return diff > -1800000; // 30分前まで許容
            })
            .sort((a, b) => a.scheduleDate.getTime() - b.scheduleDate.getTime());
          
          const upcoming = validSchedules[0];
          
          if (upcoming) {
            const schedule = {
              id: upcoming.id,
              title: upcoming.title,
              date: upcoming.date,
              time: upcoming.time,
              description: upcoming.description,
            };
            setUpcomingSchedule(schedule);
            
            // 放送待機室を自動生成
            const existingRoom = localStorage.getItem(`broadcastRoom_${upcoming.id}`);
            if (existingRoom) {
              setBroadcastRoom(JSON.parse(existingRoom));
            } else {
              // 新しい放送待機室を作成
              const newRoom: BroadcastRoom = {
                scheduleId: upcoming.id,
                scheduleTitle: upcoming.title,
                sources: [],
                isReady: false,
                recordingEnabled: false,
              };
              setBroadcastRoom(newRoom);
              localStorage.setItem(`broadcastRoom_${upcoming.id}`, JSON.stringify(newRoom));
            }
          } else {
            setUpcomingSchedule(null);
            setBroadcastRoom(null);
          }
        } else {
          // スケジュールがない場合もnullに設定
          setUpcomingSchedule(null);
          setBroadcastRoom(null);
        }
      } catch (error) {
        console.error('スケジュール読み込みエラー:', error);
        setUpcomingSchedule(null);
        setBroadcastRoom(null);
      }
    };

    loadSchedules();
    // 5秒ごとにスケジュールを更新
    const scheduleInterval = setInterval(loadSchedules, 5000);
    return () => clearInterval(scheduleInterval);
  }, []);

  // 残り時間の計算と表示
  useEffect(() => {
    if (!upcomingSchedule) {
      setTimeUntilSchedule("");
      return;
    }

    const updateTimeUntil = () => {
      const now = new Date();
      const [year, month, day] = upcomingSchedule.date.split('-').map(Number);
      const [scheduleHours, scheduleMinutes] = upcomingSchedule.time.split(':').map(Number);
      const scheduleDate = new Date(year, month - 1, day, scheduleHours, scheduleMinutes);
      const diff = scheduleDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilSchedule("開始時刻です");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeUntilSchedule(`${days}日${hours}時間${mins}分`);
      } else if (hours > 0) {
        setTimeUntilSchedule(`${hours}時間${mins}分${secs}秒`);
      } else if (mins > 0) {
        setTimeUntilSchedule(`${mins}分${secs}秒`);
      } else {
        setTimeUntilSchedule(`${secs}秒`);
      }
    };

    updateTimeUntil();
    const interval = setInterval(updateTimeUntil, 1000);
    return () => clearInterval(interval);
  }, [upcomingSchedule]);

  // 準備完了チェック関数
  const checkReadyStatus = useCallback(() => {
    if (!broadcastRoom) return false;
    if (streamSourceType === "file") {
      return broadcastRoom.sources.length > 0;
    } else {
      return broadcastRoom.recordingEnabled;
    }
  }, [broadcastRoom, streamSourceType, realtimeRecording]);

  const isReady = checkReadyStatus();

  // 準備完了状態を放送待機室に反映
  useEffect(() => {
    if (broadcastRoom) {
      const readyStatus = checkReadyStatus();
      if (broadcastRoom.isReady !== readyStatus) {
        const updatedRoom: BroadcastRoom = {
          ...broadcastRoom,
          isReady: readyStatus,
        };
        setBroadcastRoom(updatedRoom);
        localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
      }
    }
  }, [broadcastRoom, checkReadyStatus]);

  // 自動開始の監視
  useEffect(() => {
    if (!autoStartEnabled || !upcomingSchedule || isMonitoring) return;
    if (autoStartTriggered === upcomingSchedule.id) return; // 既に開始済み

    const checkAutoStart = () => {
      const now = new Date();
      const [year, month, day] = upcomingSchedule.date.split('-').map(Number);
      const [hours, minutes] = upcomingSchedule.time.split(':').map(Number);
      const scheduleDate = new Date(year, month - 1, day, hours, minutes);
      const diff = scheduleDate.getTime() - now.getTime();
      
      // 指定時刻になったら自動開始（5秒のマージン）
      if (diff <= 5000 && diff >= -30000) {
        // 準備完了チェック
        const readyStatus = checkReadyStatus();
        if (!readyStatus) {
          toast.warning("準備が完了していません", {
            description: "ファイルを選択するか、リアルタイム録画を有効にしてください",
          });
          return;
        }

        setIsMonitoring(true);
        setAutoStartTriggered(upcomingSchedule.id);
        
        // 放送待機室の準備完了状態を更新
        if (broadcastRoom) {
          const updatedRoom: BroadcastRoom = {
            ...broadcastRoom,
            isReady: true,
          };
          setBroadcastRoom(updatedRoom);
          localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
        }

        toast.success("自動配信開始", {
          description: `${upcomingSchedule.title} の配信を開始しました`,
        });
        console.log(`自動開始: ${upcomingSchedule.title}`, {
          sourceType: streamSourceType,
          sources: broadcastRoom?.sources,
          recordingEnabled: realtimeRecording,
        });
      }
    };

    const interval = setInterval(checkAutoStart, 1000);
    return () => clearInterval(interval);
  }, [upcomingSchedule, autoStartEnabled, isMonitoring, autoStartTriggered, broadcastRoom, streamSourceType, realtimeRecording, checkReadyStatus]);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setConcurrentViewers((prev) => prev + Math.floor(Math.random() * 20 - 10));
        setTotalViews((prev) => prev + Math.floor(Math.random() * 5));
        setTotalComments((prev) => prev + Math.floor(Math.random() * 3));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (videoFiles.length > 0 || imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // 放送待機室にソースを追加
      if (broadcastRoom) {
        const newSources: StreamSource[] = files.map((file, index) => ({
          id: `${Date.now()}_${index}`,
          name: file.name,
          type: "file",
          filePath: URL.createObjectURL(file),
          fileName: file.name,
        }));

        const updatedRoom: BroadcastRoom = {
          ...broadcastRoom,
          sources: [...broadcastRoom.sources, ...newSources],
        };
        setBroadcastRoom(updatedRoom);
        localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
        
        toast.success(`${files.length}個のファイルを追加しました`);
      }
    } else {
      toast.error("動画または画像ファイルを選択してください");
    }
  };

  // ファイル削除
  const handleRemoveFile = (sourceId: string) => {
    if (broadcastRoom) {
      const updatedSources = broadcastRoom.sources.filter(s => s.id !== sourceId);
      const updatedRoom: BroadcastRoom = {
        ...broadcastRoom,
        sources: updatedSources,
      };
      setBroadcastRoom(updatedRoom);
      localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
      toast.success("ファイルを削除しました");
    }
  };

  // リアルタイム録画の切り替え
  const handleRealtimeRecordingToggle = () => {
    setRealtimeRecording(!realtimeRecording);
    if (broadcastRoom) { 
      const updatedRoom: BroadcastRoom = {
        ...broadcastRoom,
        recordingEnabled: !realtimeRecording,
      };
      setBroadcastRoom(updatedRoom);
      localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
      toast.info(realtimeRecording ? "リアルタイム録画をOFFにしました" : "リアルタイム録画をONにしました");
    }
  };

  // 準備完了状態を放送待機室に反映
  useEffect(() => {
    if (broadcastRoom) {
      const readyStatus = checkReadyStatus();
      if (broadcastRoom.isReady !== readyStatus) {
        const updatedRoom: BroadcastRoom = {
          ...broadcastRoom,
          isReady: readyStatus,
        };
        setBroadcastRoom(updatedRoom);
        localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
      }
    }
  }, [broadcastRoom, checkReadyStatus]);

  // ソースタイプの切り替え
  const handleSourceTypeChange = (type: "file" | "realtime") => {
    setStreamSourceType(type);
    if (type === "realtime") {
      setRealtimeRecording(true);
      if (broadcastRoom) {
        const updatedRoom: BroadcastRoom = {
          ...broadcastRoom,
          recordingEnabled: true,
          sources: broadcastRoom.sources.filter(s => s.type === "realtime"),
        };
        setBroadcastRoom(updatedRoom);
        localStorage.setItem(`broadcastRoom_${broadcastRoom.scheduleId}`, JSON.stringify(updatedRoom));
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">ライブモニター</h1>
        </div>
        <Badge variant="destructive" className="flex items-center gap-1.5 px-2.5 py-1">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          配信中
        </Badge>
      </div>

      {/* リアルタイム放送スケジュール表示 */}
      {upcomingSchedule ? (
        <Card className="border border-primary/20 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold truncate">{upcomingSchedule.title}</span>
                    {autoStartEnabled && (
                      <Badge className="bg-green-600 text-white text-xs px-1.5 py-0 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5" />
                        自動
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {upcomingSchedule.date} {upcomingSchedule.time}
                    </span>
                    {timeUntilSchedule && (
                      <Badge variant="outline" className="font-mono text-xs px-1.5 py-0">
                        {timeUntilSchedule}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant={autoStartEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAutoStartEnabled(!autoStartEnabled);
                  toast.info(
                    autoStartEnabled ? "自動開始をOFFにしました" : "自動開始をONにしました"
                  );
                }}
                className={`h-7 px-2 text-xs ${autoStartEnabled ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              >
                {autoStartEnabled ? (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    ON
                  </>
                ) : (
                  "OFF"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>次の配信予定がありません</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 放送待機室 */}
      {upcomingSchedule && (
        <Card className="border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/5 to-blue-500/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-500" />
                放送待機室
              </CardTitle>
              {isReady && (
                <Badge className="bg-green-600 text-white flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  準備完了
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={streamSourceType} onValueChange={(v) => handleSourceTypeChange(v as "file" | "realtime")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <FileVideo className="h-4 w-4" />
                  ファイル選択
                </TabsTrigger>
                <TabsTrigger value="realtime" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  リアルタイム録画
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">配信コンテンツ</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      ファイルを選択
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="video/*,image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {broadcastRoom && broadcastRoom.sources.length > 0 ? (
                    <div className="space-y-2">
                      {broadcastRoom.sources.map((source) => (
                        <div
                          key={source.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group"
                        >
                          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {source.fileName?.match(/\.(mp4|avi|mov|webm)$/i) ? (
                              <Video className="h-5 w-5 text-primary" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-primary" />
                            )}
                </div>
                <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{source.name}</p>
                            <p className="text-xs text-muted-foreground">ファイルソース</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFile(source.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-lg">
                      <FolderOpen className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">ファイルが選択されていません</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        ファイルを選択
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="realtime" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">リアルタイム録画</Label>
                    <Button
                      variant={realtimeRecording ? "default" : "outline"}
                      size="sm"
                      onClick={handleRealtimeRecordingToggle}
                      className={realtimeRecording ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                    >
                      {realtimeRecording ? (
                        <>
                          <Video className="h-4 w-4 mr-1.5" />
                          録画中
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-1.5" />
                          録画開始
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">リアルタイム録画モード</p>
                        <p className="text-xs text-muted-foreground">
                          {realtimeRecording
                            ? "カメラや画面のリアルタイム映像を配信します"
                            : "録画を開始すると、リアルタイム映像が配信されます"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">準備状態:</span>
                  <Badge variant={isReady ? "default" : "outline"} className={isReady ? "bg-green-600" : ""}>
                    {isReady ? "準備完了" : "準備中"}
                  </Badge>
                </div>
                {isReady && (
                  <p className="text-xs text-muted-foreground">
                    指定時刻に自動的に配信が開始されます
                  </p>
                )}
              </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 放送待機室 */}
      {upcomingSchedule && (
        <Card className="border border-blue-500/20 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">放送待機室</span>
                {isReady && (
                  <Badge className="bg-green-600 text-white text-xs px-1.5 py-0 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    準備完了
                  </Badge>
                )}
                    </div>
              <Tabs value={streamSourceType} onValueChange={(v) => handleSourceTypeChange(v as "file" | "realtime")}>
                <TabsList className="h-7">
                  <TabsTrigger value="file" className="text-xs px-2 py-1">
                    <FileVideo className="h-3 w-3 mr-1" />
                    ファイル
                  </TabsTrigger>
                  <TabsTrigger value="realtime" className="text-xs px-2 py-1">
                    <Video className="h-3 w-3 mr-1" />
                    録画
                  </TabsTrigger>
                </TabsList>
              </Tabs>
                  </div>

            {streamSourceType === "file" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">配信コンテンツ</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    選択
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/*,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                {broadcastRoom && broadcastRoom.sources.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {broadcastRoom.sources.map((source) => (
                      <div
                        key={source.id}
                        className="flex items-center gap-2 p-2 rounded border border-border/50 bg-card hover:bg-accent/30 group"
                      >
                        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {source.fileName?.match(/\.(mp4|avi|mov|webm)$/i) ? (
                            <Video className="h-3 w-3 text-primary" />
                          ) : (
                            <ImageIcon className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs font-medium truncate flex-1">{source.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFile(source.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4 border border-dashed border-border/50 rounded text-xs text-muted-foreground">
                    ファイル未選択
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded border border-border/50 bg-card">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-500" />
                  <span className="text-xs">リアルタイム録画</span>
                </div>
                <Button
                  variant={realtimeRecording ? "default" : "outline"}
                  size="sm"
                  onClick={handleRealtimeRecordingToggle}
                  className={`h-7 px-2 text-xs ${realtimeRecording ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                >
                  {realtimeRecording ? "録画中" : "開始"}
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
      )}

      {/* コントロール */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStartMonitoring}
                disabled={isMonitoring}
                size="sm"
          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
          <Play className="h-3 w-3 mr-1" />
          開始
              </Button>
              <Button
                onClick={handleStopMonitoring}
                disabled={!isMonitoring}
                size="sm"
          className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
              >
          <Square className="h-3 w-3 mr-1" />
          停止
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="sm"
          className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          更新
              </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-2 grid-cols-4">
        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">同時接続</span>
              <Users className="h-3.5 w-3.5 text-primary" />
        </div>
            <div className="text-lg font-semibold">{concurrentViewers.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">ピーク: 567</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">総再生</span>
              <Eye className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-lg font-semibold">{totalViews.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">配信開始から</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">高評価</span>
              <Heart className="h-3.5 w-3.5 text-red-500" />
            </div>
            <div className="text-lg font-semibold">{totalLikes.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">98.5%</p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">コメント</span>
              <MessageCircle className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-semibold">{totalComments.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">6.9/分</p>
          </CardContent>
        </Card>
      </div>

      {/* グラフ */}
      <Card className="border border-border/60 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            同時接続数の推移
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ConcurrentViewersChart />
        </CardContent>
      </Card>

      {/* チャットとスーパーチャット */}
      <div className="grid gap-2 md:grid-cols-2">
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              ライブチャット
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-2 p-2 rounded hover:bg-accent/50 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <span className="text-[10px] font-semibold text-primary">
                      {comment.user.charAt(comment.user.length - 1)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold">{comment.user}</span>
                      <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed break-words">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              スーパーチャット
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {superChats.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-start gap-2 p-2 rounded border-l-2 border-amber-400 bg-card hover:bg-accent/30"
                >
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{sc.user}</span>
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold text-[10px]">
                        {sc.amount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">{sc.message}</p>
                    <span className="text-[10px] text-muted-foreground">{sc.time}</span>
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
