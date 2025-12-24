import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  ComposedChart,
  Area,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Youtube,
  Twitter,
  TrendingUp,
  Calendar,
  Download,
  Play,
  Square,
  Heart,
  Repeat2,
  MessageCircle,
  Clock,
  BarChart3,
  Target,
  Sparkles,
  RefreshCw,
  Search,
  Eye,
  Users,
  Share2,
  Hash,
  Loader2,
  Volume2,
  VolumeX,
  UserCheck,
  MessageSquare,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Types for YouTube Analytics
// Note: YouTube Analytics API cannot fetch data for the past 3 days
type YouTubePeriod = "1week" | "1month";

interface YouTubeAnalyticsData {
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number; // seconds
  impressions: number; // Deprecated: Always 0, not available via API. Use viewerRetentionRate instead.
  subscribersGained: number;
  subscribersLost: number;
  shares: number;
  impressionClickThroughRate?: number; // Deprecated: Always undefined, not available via API
  viewerRetentionRate?: number; // percentage: (averageViewDuration / averageVideoDuration) * 100
  topVideoViews?: number;
  topVideoSubscribersGained?: number;
  averageVideoDuration?: number; // seconds
  previousPeriodViews?: number;
  previousPeriodEstimatedMinutesWatched?: number;
  previousPeriodAverageViewDuration?: number;
  previousPeriodImpressions?: number; // Deprecated: Always 0
  previousPeriodViewerRetentionRate?: number; // percentage
  previousPeriodNetSubscribers?: number;
  previousPeriodShares?: number;
  dailyData?: {
    date: string;
    views: number;
    estimatedMinutesWatched: number;
    netSubscribers: number;
    averageViewDuration: number;
    postClickQualityScore?: number; // Post-Click Quality Score (0-100)
  }[];
}

// Types for X Analytics
type XPeriod = "2hours" | "1day" | "1week" | "1month";

interface XAnalyticsData {
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  impressions_count: number;
  followers_count: number;
  engagement_trend: {
    time: string;
    engagement: number;
    impressions: number;
  }[];
  hashtag_analysis: {
    tag: string;
    likes: number;
    data: { time: string; likes: number }[];
  }[];
  is_cached?: boolean;
  data_age_minutes?: number;
  api_timeout?: boolean;
  retry_after_seconds?: number;
  message?: string;
}

interface ImprovementSuggestion {
  summary: string;
  key_insights: string[];
  recommendations: string[];
  best_posting_time: string;
  hashtag_recommendations: string[];
}

export default function Analytics() {
  // Active tab state
  const [activeTab, setActiveTab] = useState<"youtube" | "twitter">("youtube");

  // YouTube analysis state
  // Note: YouTube Analytics API cannot fetch data for the past 3 days
  const [youtubePeriod, setYoutubePeriod] = useState<YouTubePeriod>("1week");
  const [youtubeAnalyticsData, setYoutubeAnalyticsData] = useState<YouTubeAnalyticsData | null>(null);
  const [isYoutubeAnalyzing, setIsYoutubeAnalyzing] = useState(false);

  // X Analytics state
  const [xPeriod, setXPeriod] = useState<XPeriod>("1day");
  const [xAnalyticsData, setXAnalyticsData] = useState<XAnalyticsData | null>(null);
  const [isXAnalyzing, setIsXAnalyzing] = useState(false);
  const [improvementSuggestion, setImprovementSuggestion] = useState<ImprovementSuggestion | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [youtubeImprovementSuggestion, setYoutubeImprovementSuggestion] = useState<ImprovementSuggestion | null>(null);
  const [isGeneratingYoutubeSuggestions, setIsGeneratingYoutubeSuggestions] = useState(false);
  const [retryTimeoutId, setRetryTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRY_COUNT = 2; // Maximum number of retries for rate limit errors
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingYoutube, setIsSpeakingYoutube] = useState(false);
  const [cevioCast, setCevioCast] = useState<string>("フィーちゃん");
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechSynthesisYoutubeRef = useRef<SpeechSynthesisUtterance | null>(null);

  // YouTube Analytics handlers
  const handleYoutubeAnalyze = async () => {
    setIsYoutubeAnalyzing(true);
    const controller = new AbortController();
    const fetchTimeoutId = setTimeout(() => controller.abort(), 60000); // 60秒のタイムアウト
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/youtube/analyze?period=${youtubePeriod}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(fetchTimeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "データ取得に失敗しました" }));
        // Handle both string and object error details
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : errorData.detail?.message || errorData.message || "データ取得に失敗しました";
        throw new Error(errorMessage);
      }

      const data: YouTubeAnalyticsData = await response.json();
      
      // Validate data - always accept data from API, even if all values are 0
      // This matches the behavior of 1week period and ensures data is always displayed
      if (!data) {
        toast.warning("YouTube分析データが取得できませんでした。期間を変更するか、後でもう一度お試しください。");
        setYoutubeAnalyticsData(null);
        return;
      }
      
      // Always accept data, even if all metrics are 0
      // This ensures consistent behavior with 1week period
      // The API returns data structure even when values are 0, which is valid
      setYoutubeAnalyticsData(data);
      toast.success("YouTube分析データを取得しました");
    } catch (error) {
      clearTimeout(fetchTimeoutId);
      console.error("YouTube分析エラー:", error);
      let errorMessage = "分析に失敗しました";
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          errorMessage = "リクエストがタイムアウトしました（60秒）。YouTube Analytics APIの処理に時間がかかっている可能性があります。しばらく待ってから再度お試しください。";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
      setYoutubeAnalyticsData(null);
    } finally {
      setIsYoutubeAnalyzing(false);
    }
  };


  // Format helpers for YouTube
  const formatYouTubeNumber = (num: number) => num.toLocaleString("ja-JP");
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}分`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}時間${mins}分`;
  };
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  const formatPercentageChange = (current: number, previous: number) => {
    const change = calculatePercentageChange(current, previous);
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  // X Analytics handlers
  const handleXAnalyze = async (isRetry: boolean = false) => {
    setIsXAnalyzing(true);

    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      setRetryTimeoutId(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/x/analyze?period=${xPeriod}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "データ取得に失敗しました" }));
        setIsXAnalyzing(false);

        // Handle 429 (Rate Limit) errors specifically
        if (response.status === 429) {
          // 429エラーはレート制限なので、リトライしても同じエラーが発生する可能性が高い
          // リトライ回数に制限を設ける
          if (isRetry && retryCount >= MAX_RETRY_COUNT) {
            toast.error("X APIのレート制限に達しました。しばらく待ってから再度お試しください。");
            setRetryCount(0);
            setXAnalyticsData(null);
            return;
          }
          
          // 初回の429エラーまたはリトライ回数が上限未満の場合
          if (errorData.api_timeout && errorData.retry_after_seconds) {
            const retrySeconds = errorData.retry_after_seconds;
            const currentRetryCount = isRetry ? retryCount + 1 : 1;
            
            if (currentRetryCount <= MAX_RETRY_COUNT) {
              toast.warning(`X APIのレート制限に達しました。${retrySeconds}秒後に再試行します（${currentRetryCount}/${MAX_RETRY_COUNT}）`);

              const timeoutId = setTimeout(() => {
                setRetryCount(currentRetryCount);
                handleXAnalyze(true);
              }, retrySeconds * 1000);

              setRetryTimeoutId(timeoutId);
              return;
            } else {
              toast.error("X APIのレート制限に達しました。最大リトライ回数に達したため、しばらく待ってから再度お試しください。");
              setRetryCount(0);
              setXAnalyticsData(null);
              return;
            }
          } else {
            // 429エラーだが、retry_after_secondsがない場合
            toast.error("X APIのレート制限に達しました。しばらく待ってから再度お試しください。");
            setRetryCount(0);
            setXAnalyticsData(null);
            return;
          }
        }

        // Handle other timeout errors (503, etc.)
        if (errorData.api_timeout && errorData.retry_after_seconds && response.status !== 429) {
          const retrySeconds = errorData.retry_after_seconds;
          toast.warning(`X APIがタイムアウトしました。${retrySeconds}秒後に自動的に再試行します。`);

          const timeoutId = setTimeout(() => {
            handleXAnalyze(true);
          }, retrySeconds * 1000);

          setRetryTimeoutId(timeoutId);
          return;
        }

        throw new Error(errorData.detail?.message || errorData.detail || errorData.message || "データ取得に失敗しました");
      }

      // Success - reset retry count
      setRetryCount(0);

      const data: XAnalyticsData = await response.json();
      setIsXAnalyzing(false);
      setRetryCount(0); // Reset retry count on success

      // Validate data quality: check if we have meaningful data
      const hasData = data.engagement_trend && data.engagement_trend.length > 0;
      const totalEngagement = (data.likes_count || 0) + (data.retweets_count || 0) + (data.replies_count || 0);

      // For 2hours period, be more lenient - show data even if engagement is 0
      // (user might have tweeted but got no engagement yet, or no tweets in the period)
      if (xPeriod === "2hours") {
        if (!hasData) {
          toast.warning(data.message || "指定期間内にデータが見つかりませんでした。");
          setXAnalyticsData(null);
          return;
        }
        // For 2hours, show data even if engagement is 0 (might be recent tweets or no tweets)
        // Show message if provided (e.g., no tweets found in the period)
        if (data.message) {
          toast.info(data.message);
        } else if (totalEngagement === 0) {
          // If no engagement but data exists, it means tweets exist but no engagement yet
          toast.info("過去2時間の期間内にツイートは見つかりましたが、エンゲージメントはまだありません。");
        }
        // Always set data for 2hours period if hasData is true
        setXAnalyticsData(data);
        if (!data.message && totalEngagement > 0) {
          toast.success("最新の分析データを取得しました");
        }
      } else {
        // For 1day and 1week, require some engagement
        if (!hasData || totalEngagement === 0) {
          toast.warning(data.message || "指定期間内にデータが見つかりませんでした。しばらく待ってから再試行してください。");
          setXAnalyticsData(null);
          return;
        }
        setXAnalyticsData(data);
        if (data.is_cached) {
          toast.info(`キャッシュデータを表示中（${data.data_age_minutes || 0}分前）`);
        } else {
          toast.success("最新の分析データを取得しました");
        }
      }

    } catch (error) {
      setIsXAnalyzing(false);

      console.error("X分析エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "分析に失敗しました";
      toast.error(`${errorMessage}。X APIのレート制限に達している可能性があります。しばらく待ってから再試行してください。`);
      // Don't generate mock data - show error state instead
      // Clear existing data to show empty state
      setXAnalyticsData(null);
    }
  };

  // Generate mock data for demonstration (DEPRECATED - only for development/testing)
  // NOTE: This function is kept for potential future use but is no longer called automatically
  const generateMockData = () => {
    const now = new Date();
    const engagementTrend: XAnalyticsData["engagement_trend"] = [];
    const points = xPeriod === "2hours" ? 12 : xPeriod === "1day" ? 24 : xPeriod === "1week" ? 7 : 30;
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      let timeLabel: string;
      
      if (xPeriod === "2hours") {
        date.setMinutes(date.getMinutes() - i * 10);
        timeLabel = date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      } else if (xPeriod === "1day") {
        date.setHours(date.getHours() - i);
        timeLabel = date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      } else if (xPeriod === "1week") {
        date.setDate(date.getDate() - i);
        timeLabel = date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
      } else {
        // 1month: 30日分のデータポイント
        date.setDate(date.getDate() - i);
        timeLabel = date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
      }
      
      engagementTrend.push({
        time: timeLabel,
        engagement: Math.floor(Math.random() * 500 + 100),
        impressions: Math.floor(Math.random() * 5000 + 1000),
      });
    }

    const hashtags = ["VTuber", "配信", "ゲーム実況"];
    const hashtagAnalysis: XAnalyticsData["hashtag_analysis"] = hashtags.map((tag) => ({
      tag,
      likes: Math.floor(Math.random() * 300 + 50),
      data: engagementTrend.map((item) => ({
        time: item.time,
        likes: Math.floor(Math.random() * 100 + 10),
      })),
    }));

    setXAnalyticsData({
      likes_count: Math.floor(Math.random() * 5000 + 1000),
      retweets_count: Math.floor(Math.random() * 1000 + 200),
      replies_count: Math.floor(Math.random() * 500 + 100),
      impressions_count: Math.floor(Math.random() * 50000 + 10000),
      followers_count: Math.floor(Math.random() * 10000 + 5000),
      engagement_trend: engagementTrend,
      hashtag_analysis: hashtagAnalysis,
    });
    
    toast.info("デモデータを表示しています");
  };

  // Generate YouTube improvement suggestions
  const handleGenerateYoutubeImprovements = async () => {
    if (!youtubeAnalyticsData) {
      toast.error("先に分析を実行してください");
      return;
    }

    setIsGeneratingYoutubeSuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/youtube/improvements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          views: youtubeAnalyticsData.views,
          estimatedMinutesWatched: youtubeAnalyticsData.estimatedMinutesWatched,
          averageViewDuration: youtubeAnalyticsData.averageViewDuration,
          subscribersGained: youtubeAnalyticsData.subscribersGained,
          subscribersLost: youtubeAnalyticsData.subscribersLost,
          viewerRetentionRate: youtubeAnalyticsData.viewerRetentionRate,
          averageVideoDuration: youtubeAnalyticsData.averageVideoDuration,
          previousPeriodViews: youtubeAnalyticsData.previousPeriodViews,
          previousPeriodEstimatedMinutesWatched: youtubeAnalyticsData.previousPeriodEstimatedMinutesWatched,
          previousPeriodAverageViewDuration: youtubeAnalyticsData.previousPeriodAverageViewDuration,
          previousPeriodViewerRetentionRate: youtubeAnalyticsData.previousPeriodViewerRetentionRate,
          previousPeriodNetSubscribers: youtubeAnalyticsData.previousPeriodNetSubscribers,
          dailyData: youtubeAnalyticsData.dailyData || [],
        }),
      });

      if (!response.ok) {
        throw new Error("改善提案の取得に失敗しました");
      }

      const data = await response.json();
      setYoutubeImprovementSuggestion(data);
      toast.success("改善提案を生成しました");
    } catch (error) {
      console.error("改善提案生成エラー:", error);
      toast.error("改善提案の生成に失敗しました");
    } finally {
      setIsGeneratingYoutubeSuggestions(false);
    }
  };

  // Generate improvement suggestions
  const handleGenerateImprovements = async () => {
    if (!xAnalyticsData) {
      toast.error("先に分析を実行してください");
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analytics/x/improvements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likes_count: xAnalyticsData.likes_count,
          retweets_count: xAnalyticsData.retweets_count,
          replies_count: xAnalyticsData.replies_count,
          impressions_count: xAnalyticsData.impressions_count,
          followers_count: xAnalyticsData.followers_count,
          hashtag_analysis: xAnalyticsData.hashtag_analysis,
          period: xPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error("改善提案の取得に失敗しました");
      }

      const data = await response.json();
      setImprovementSuggestion(data);
      toast.success("改善提案を生成しました");
    } catch (error) {
      console.error("改善提案生成エラー:", error);
      // Generate mock suggestion for demo
      generateMockSuggestion();
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Generate mock suggestion for demonstration
  const generateMockSuggestion = () => {
    const topHashtags = xAnalyticsData?.hashtag_analysis
      ?.sort((a, b) => b.likes - a.likes)
      .slice(0, 3)
      .map((h) => h.tag) || ["VTuber", "配信"];

    setImprovementSuggestion({
      summary: `分析期間中、インプレッション数${formatNumber(xAnalyticsData?.impressions_count || 0)}、エンゲージメント数${formatNumber((xAnalyticsData?.likes_count || 0) + (xAnalyticsData?.retweets_count || 0) + (xAnalyticsData?.replies_count || 0))}を記録しました。`,
      key_insights: [
        "エンゲージメント率は業界平均を上回っています",
        "特に20:00-22:00の時間帯にインタラクションが集中しています",
        `#${topHashtags[0]}を使用した投稿が最も高いパフォーマンスを記録`,
      ],
      recommendations: [
        "画像付きツイートの割合を増やすことで、インプレッション数の向上が期待できます",
        "フォロワーとの対話を増やすため、質問形式の投稿を週2-3回取り入れてください",
        "リツイートを促進するため、共感を呼ぶコンテンツや有益な情報の共有を心がけてください",
      ],
      best_posting_time: "20:00-22:00",
      hashtag_recommendations: topHashtags.length > 0 
        ? [`#${topHashtags[0]}`, "#新人VTuber", "#Vtuber好きと繋がりたい"]
        : ["#VTuber", "#配信", "#ゲーム実況"],
    });
    toast.info("デモの改善提案を表示しています");
  };

  // Text-to-speech handler for X using CeVIO AI
  const handleSpeakSuggestion = async () => {
    if (!improvementSuggestion) return;

    if (isSpeaking) {
      // Stop speech
      try {
        await fetch(`${API_BASE_URL}/api/v1/cevio/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("CeVIO AI停止エラー:", error);
      }
      setIsSpeaking(false);
      return;
    }

    const text = `
      ${improvementSuggestion.summary}
      主要なインサイト: ${improvementSuggestion.key_insights.join("。")}
      改善推奨事項: ${improvementSuggestion.recommendations.join("。")}
      推奨投稿時間帯: ${improvementSuggestion.best_posting_time}
      推奨ハッシュタグ: ${improvementSuggestion.hashtag_recommendations.join("、")}
    `;

    try {
      setIsSpeaking(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/cevio/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          cast: cevioCast,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "音声読み上げに失敗しました" }));
        throw new Error(errorData.detail || "音声読み上げに失敗しました");
      }

      const data = await response.json();
      toast.success(data.message || "音声読み上げを開始しました");
      
      // Note: CeVIO AIは非同期で再生するため、完了を検知するにはポーリングが必要
      // 簡易実装として、一定時間後に自動的にisSpeakingをfalseにする
      setTimeout(() => {
        setIsSpeaking(false);
      }, text.length * 100); // おおよその読み上げ時間（文字数 * 100ms）
      
    } catch (error) {
      console.error("CeVIO AI読み上げエラー:", error);
      toast.error(error instanceof Error ? error.message : "音声読み上げに失敗しました");
      setIsSpeaking(false);
    }
  };

  // Text-to-speech handler for YouTube using CeVIO AI
  const handleSpeakYoutubeSuggestion = async () => {
    if (!youtubeImprovementSuggestion) return;

    if (isSpeakingYoutube) {
      // Stop speech
      try {
        await fetch(`${API_BASE_URL}/api/v1/cevio/stop`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("CeVIO AI停止エラー:", error);
      }
      setIsSpeakingYoutube(false);
      return;
    }

    const text = `
      ${youtubeImprovementSuggestion.summary}
      主要なインサイト: ${youtubeImprovementSuggestion.key_insights.join("。")}
      改善推奨事項: ${youtubeImprovementSuggestion.recommendations.join("。")}
      ${youtubeImprovementSuggestion.best_posting_time ? `推奨投稿時間帯: ${youtubeImprovementSuggestion.best_posting_time}` : ""}
      ${youtubeImprovementSuggestion.hashtag_recommendations && youtubeImprovementSuggestion.hashtag_recommendations.length > 0 
        ? `推奨ハッシュタグ: ${youtubeImprovementSuggestion.hashtag_recommendations.join("、")}` 
        : ""}
    `;

    try {
      setIsSpeakingYoutube(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/cevio/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          cast: cevioCast,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "音声読み上げに失敗しました" }));
        throw new Error(errorData.detail || "音声読み上げに失敗しました");
      }

      const data = await response.json();
      toast.success(data.message || "音声読み上げを開始しました");
      
      // Note: CeVIO AIは非同期で再生するため、完了を検知するにはポーリングが必要
      // 簡易実装として、一定時間後に自動的にisSpeakingYoutubeをfalseにする
      setTimeout(() => {
        setIsSpeakingYoutube(false);
      }, text.length * 100); // おおよその読み上げ時間（文字数 * 100ms）
      
    } catch (error) {
      console.error("CeVIO AI読み上げエラー:", error);
      toast.error(error instanceof Error ? error.message : "音声読み上げに失敗しました");
      setIsSpeakingYoutube(false);
    }
  };

  // Excel export handler for X
  const handleExportExcel = () => {
    if (!xAnalyticsData || !improvementSuggestion) {
      toast.error("レポートを出力するには、分析と改善提案が必要です");
      return;
    }

    try {
      const now = new Date();
      const timestamp = now.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/[\/\s:]/g, "_");

      const periodLabel = xPeriod === "2hours" ? "過去2時間" : xPeriod === "1day" ? "過去1日" : xPeriod === "1week" ? "過去1週間" : "過去1ヶ月間";

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: KPI Summary
      const kpiData = [
        ["X分析レポート"],
        [""],
        ["生成日時", now.toLocaleString("ja-JP")],
        ["分析期間", periodLabel],
        [""],
        ["KPI サマリー"],
        ["指標", "値"],
        ["いいね数", xAnalyticsData.likes_count],
        ["リツイート数", xAnalyticsData.retweets_count],
        ["返信数", xAnalyticsData.replies_count],
        ["インプレッション数", xAnalyticsData.impressions_count],
        ["フォロワー数", xAnalyticsData.followers_count],
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
      
      // Set column widths
      wsKPI["!cols"] = [{ wch: 20 }, { wch: 25 }];
      
      XLSX.utils.book_append_sheet(wb, wsKPI, "KPIサマリー");

      // Sheet 2: Hashtag Analysis
      const hashtagData = [
        ["ハッシュタグ分析"],
        [""],
        ["ハッシュタグ", "いいね数"],
        ...xAnalyticsData.hashtag_analysis?.slice(0, 3).map((h) => [`#${h.tag}`, h.likes]) || [],
      ];
      const wsHashtag = XLSX.utils.aoa_to_sheet(hashtagData);
      wsHashtag["!cols"] = [{ wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsHashtag, "ハッシュタグ分析");

      // Sheet 3: Trend Data
      const trendHeader = ["時間", "エンゲージメント", "インプレッション"];
      const trendRows = xAnalyticsData.engagement_trend?.map((item) => [
        item.time,
        item.engagement,
        item.impressions,
      ]) || [];
      const wsTrend = XLSX.utils.aoa_to_sheet([["トレンドデータ"], [""], trendHeader, ...trendRows]);
      wsTrend["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsTrend, "トレンドデータ");

      // Sheet 4: Improvement Suggestions
      const suggestionsData = [
        ["AI改善提案"],
        [""],
        ["サマリー"],
        [improvementSuggestion.summary],
        [""],
        ["主要インサイト"],
        ...improvementSuggestion.key_insights.map((insight, i) => [`${i + 1}. ${insight}`]),
        [""],
        ["改善推奨事項"],
        ...improvementSuggestion.recommendations.map((rec, i) => [`${i + 1}. ${rec}`]),
        [""],
        ["推奨投稿時間", improvementSuggestion.best_posting_time],
        [""],
        ["推奨ハッシュタグ", improvementSuggestion.hashtag_recommendations.join(", ")],
      ];
      const wsSuggestions = XLSX.utils.aoa_to_sheet(suggestionsData);
      wsSuggestions["!cols"] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsSuggestions, "改善提案");

      // Save Excel file (ensure UTF-8 / Japanese characters are preserved)
      // NOTE: Some versions of Excel on Windows expect explicit UTF-8 metadata.
      // The xlsx format is Unicode-safe, but we still pass options for maximum compatibility.
      XLSX.writeFile(wb, `X_Analytics_Report_${timestamp}.xlsx`, {
        bookType: "xlsx",
        compression: true,
        ...({ codepage: 65001 } as any), // UTF-8 - codepage is supported by SheetJS but not in types
      });
      toast.success("Excelレポートをダウンロードしました");
    } catch (error) {
      console.error("Excel出力エラー:", error);
      toast.error("Excelの出力に失敗しました");
    }
  };

  // Excel export handler for YouTube
  const handleExportYoutubeExcel = () => {
    if (!youtubeAnalyticsData || !youtubeImprovementSuggestion) {
      toast.error("レポートを出力するには、分析と改善提案が必要です");
      return;
    }

    try {
      const now = new Date();
      const timestamp = now.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/[\/\s:]/g, "_");

      const periodLabel = youtubePeriod === "1week" ? "過去1週間" : "過去1ヶ月間";

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: KPI Summary
      const kpiData = [
        ["YouTube分析レポート"],
        [""],
        ["生成日時", now.toLocaleString("ja-JP")],
        ["分析期間", periodLabel],
        [""],
        ["KPI サマリー"],
        ["指標", "値"],
        ["再生回数", youtubeAnalyticsData.views],
        ["総再生時間（分）", Math.round(youtubeAnalyticsData.estimatedMinutesWatched)],
        ["平均視聴時間（秒）", Math.round(youtubeAnalyticsData.averageViewDuration)],
        ["視聴継続率（%）", youtubeAnalyticsData.viewerRetentionRate?.toFixed(1) || "-"],
        ["登録者増加", youtubeAnalyticsData.subscribersGained],
        ["登録者減少", youtubeAnalyticsData.subscribersLost],
        ["純増登録者数", youtubeAnalyticsData.subscribersGained - youtubeAnalyticsData.subscribersLost],
        ["共有数", youtubeAnalyticsData.shares],
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
      
      // Set column widths
      wsKPI["!cols"] = [{ wch: 25 }, { wch: 25 }];
      
      XLSX.utils.book_append_sheet(wb, wsKPI, "KPIサマリー");

      // Sheet 2: Daily Trend Data
      if (youtubeAnalyticsData.dailyData && youtubeAnalyticsData.dailyData.length > 0) {
        const trendHeader = ["日付", "再生回数", "総再生時間（分）", "純増登録者数", "平均視聴時間（秒）"];
        const trendRows = youtubeAnalyticsData.dailyData.map((item) => [
          item.date,
          item.views,
          Math.round(item.estimatedMinutesWatched),
          item.netSubscribers,
          Math.round(item.averageViewDuration),
        ]);
        const wsTrend = XLSX.utils.aoa_to_sheet([["日次トレンドデータ"], [""], trendHeader, ...trendRows]);
        wsTrend["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsTrend, "日次トレンド");
      }

      // Sheet 3: Improvement Suggestions
      const suggestionsData = [
        ["AI改善提案"],
        [""],
        ["サマリー"],
        [youtubeImprovementSuggestion.summary],
        [""],
        ["主要インサイト"],
        ...youtubeImprovementSuggestion.key_insights.map((insight, i) => [`${i + 1}. ${insight}`]),
        [""],
        ["改善推奨事項"],
        ...youtubeImprovementSuggestion.recommendations.map((rec, i) => [`${i + 1}. ${rec}`]),
      ];
      
      if (youtubeImprovementSuggestion.best_posting_time) {
        suggestionsData.push([""], ["推奨投稿時間", youtubeImprovementSuggestion.best_posting_time]);
      }
      
      if (youtubeImprovementSuggestion.hashtag_recommendations && youtubeImprovementSuggestion.hashtag_recommendations.length > 0) {
        suggestionsData.push([""], ["推奨ハッシュタグ", youtubeImprovementSuggestion.hashtag_recommendations.join(", ")]);
      }
      
      const wsSuggestions = XLSX.utils.aoa_to_sheet(suggestionsData);
      wsSuggestions["!cols"] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsSuggestions, "改善提案");

      // Save Excel file
      XLSX.writeFile(wb, `YouTube_Analytics_Report_${timestamp}.xlsx`, {
        bookType: "xlsx",
        compression: true,
        ...({ codepage: 65001 } as any), // UTF-8
      });
      toast.success("Excelレポートをダウンロードしました");
    } catch (error) {
      console.error("Excel出力エラー:", error);
      toast.error("Excelの出力に失敗しました");
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
      if (isSpeakingYoutube) {
        window.speechSynthesis.cancel();
      }
    };
  }, [retryTimeoutId, isSpeaking, isSpeakingYoutube]);

  // Format helpers
  const formatNumber = (num: number) => num.toLocaleString("ja-JP");
  const formatPercent = (num: number) => `${num.toFixed(1)}%`;

  // Chart configs
  const engagementChartConfig = {
    engagement: {
      label: "エンゲージメント",
      color: "hsl(210, 100%, 50%)",
    },
    impressions: {
      label: "インプレッション",
      color: "hsl(280, 100%, 60%)",
    },
  };

  const hashtagChartConfig = {
    likes: {
      label: "いいね数",
      color: "hsl(340, 82%, 52%)",
    },
  };

  // Get top 3 hashtags
  const topHashtags = xAnalyticsData?.hashtag_analysis
    ?.sort((a, b) => b.likes - a.likes)
    .slice(0, 3) || [];

  // Combine hashtag data for chart - using real data only
  const getHashtagChartData = () => {
    if (!xAnalyticsData?.engagement_trend || topHashtags.length === 0) return [];
    
    return xAnalyticsData.engagement_trend.map((item, index) => {
      const dataPoint: Record<string, string | number> = { time: item.time };
      topHashtags.forEach((hashtag) => {
        // Use actual data from API, default to 0 if not available
        dataPoint[hashtag.tag] = hashtag.data?.[index]?.likes ?? 0;
      });
      return dataPoint;
    });
  };

  const hashtagColors = ["hsl(340, 82%, 52%)", "hsl(210, 100%, 50%)", "hsl(150, 80%, 40%)"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">データ分析</h1>
        <p className="text-muted-foreground mt-2">
          YouTubeとXの詳細な分析データを確認できます
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "youtube" | "twitter")} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube分析
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              X分析
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "youtube" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">期間選択:</label>
                <Select value={youtubePeriod} onValueChange={(value: YouTubePeriod) => setYoutubePeriod(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">過去1週間</SelectItem>
                    <SelectItem value="1month">過去1ヶ月間</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleYoutubeAnalyze}
                disabled={isYoutubeAnalyzing}
                size="sm"
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                {isYoutubeAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    分析
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="youtube" className="space-y-4">

          {/* YouTube KPI Cards */}
          {youtubeAnalyticsData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* 1. 再生回数 */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">再生回数</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{formatYouTubeNumber(youtubeAnalyticsData.views)}</div>
                    {youtubeAnalyticsData.previousPeriodViews !== undefined && (
                      <p className={`text-xs mt-1 ${calculatePercentageChange(youtubeAnalyticsData.views, youtubeAnalyticsData.previousPeriodViews) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercentageChange(youtubeAnalyticsData.views, youtubeAnalyticsData.previousPeriodViews)} 前期間比
                      </p>
                    )}
                    {youtubeAnalyticsData.topVideoViews && (
                      <p className="text-xs text-muted-foreground mt-1">
                        上位動画: {formatYouTubeNumber(youtubeAnalyticsData.topVideoViews)}回
                      </p>
                    )}
              </CardContent>
            </Card>

                {/* 2. 総再生時間 */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総再生時間</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{formatMinutes(youtubeAnalyticsData.estimatedMinutesWatched)}</div>
                    {youtubeAnalyticsData.previousPeriodEstimatedMinutesWatched !== undefined && (
                      <p className={`text-xs mt-1 ${calculatePercentageChange(youtubeAnalyticsData.estimatedMinutesWatched, youtubeAnalyticsData.previousPeriodEstimatedMinutesWatched) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercentageChange(youtubeAnalyticsData.estimatedMinutesWatched, youtubeAnalyticsData.previousPeriodEstimatedMinutesWatched)} 前期間比
                      </p>
                    )}
                    {youtubeAnalyticsData.views > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        1再生あたり: {formatDuration(Math.round((youtubeAnalyticsData.estimatedMinutesWatched * 60) / youtubeAnalyticsData.views))}
                      </p>
                    )}
              </CardContent>
            </Card>

                {/* 3. 平均視聴時間 */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均視聴時間</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">{formatDuration(youtubeAnalyticsData.averageViewDuration)}</div>
                    {youtubeAnalyticsData.previousPeriodAverageViewDuration !== undefined && (
                      <p className={`text-xs mt-1 ${calculatePercentageChange(youtubeAnalyticsData.averageViewDuration, youtubeAnalyticsData.previousPeriodAverageViewDuration) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercentageChange(youtubeAnalyticsData.averageViewDuration, youtubeAnalyticsData.previousPeriodAverageViewDuration)} 前期間比
                      </p>
                    )}
                    {youtubeAnalyticsData.averageVideoDuration && (
                      <p className="text-xs text-muted-foreground mt-1">
                        平均動画長に対する割合: {((youtubeAnalyticsData.averageViewDuration / youtubeAnalyticsData.averageVideoDuration) * 100).toFixed(1)}%
                      </p>
                    )}
              </CardContent>
            </Card>

                {/* 4. シェア数 */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">シェア数</CardTitle>
                    <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">
                      {formatYouTubeNumber(youtubeAnalyticsData.shares)}
                    </div>
                    {youtubeAnalyticsData.previousPeriodShares !== undefined && (
                      <p
                        className={`text-xs mt-1 ${
                          calculatePercentageChange(
                            youtubeAnalyticsData.shares,
                            youtubeAnalyticsData.previousPeriodShares
                          ) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercentageChange(
                          youtubeAnalyticsData.shares,
                          youtubeAnalyticsData.previousPeriodShares
                        )}{" "}
                        前期間比
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      分析期間中にコンテンツが何回共有されたかを示します
                    </p>
              </CardContent>
            </Card>

                {/* 5. 純増登録者数 */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">純増登録者数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                    <div className="text-2xl font-bold">
                      {youtubeAnalyticsData.subscribersGained - youtubeAnalyticsData.subscribersLost >= 0 ? "+" : ""}
                      {formatYouTubeNumber(youtubeAnalyticsData.subscribersGained - youtubeAnalyticsData.subscribersLost)}
                    </div>
                    {youtubeAnalyticsData.previousPeriodNetSubscribers !== undefined && (
                      <p className={`text-xs mt-1 ${calculatePercentageChange(youtubeAnalyticsData.subscribersGained - youtubeAnalyticsData.subscribersLost, youtubeAnalyticsData.previousPeriodNetSubscribers) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatPercentageChange(youtubeAnalyticsData.subscribersGained - youtubeAnalyticsData.subscribersLost, youtubeAnalyticsData.previousPeriodNetSubscribers)} 前期間比
                      </p>
                    )}
                    {youtubeAnalyticsData.topVideoSubscribersGained && (
                      <p className="text-xs text-muted-foreground mt-1">
                        上位動画: +{formatYouTubeNumber(youtubeAnalyticsData.topVideoSubscribersGained)}人
                      </p>
                    )}
              </CardContent>
            </Card>

          </div>
            </>
          ) : (
          <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-red-500/10">
                      <Youtube className="h-10 w-10 text-red-500" />
                      </div>
                      </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      期間を選択して「分析」ボタンを押してください
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      YouTube Analytics APIからデータを取得して分析を開始します
                    </p>
                    </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Charts Section */}
          {youtubeAnalyticsData && (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Graph A: Time Series Trend */}
              <Card className="border-border shadow-sm">
            <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      時系列トレンド
              </CardTitle>
                  </div>
            </CardHeader>
            <CardContent>
                  <ChartContainer
                    config={{
                      views: { label: "再生回数", color: "hsl(210, 100%, 50%)" },
                      estimatedMinutesWatched: { label: "総再生時間", color: "hsl(280, 100%, 60%)" },
                      netSubscribers: { label: "純増登録者数", color: "hsl(150, 80%, 40%)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ComposedChart
                      data={youtubeAnalyticsData.dailyData || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                                <div className="text-xs text-muted-foreground mb-2">
                                  {payload[0].payload.date}
                    </div>
                                <div className="space-y-1">
                                  {payload.map((item, index) => {
                                    // Get the correct label based on dataKey
                                    const dataKey = item.dataKey as string;
                                    let label = "純増登録者数";
                                    if (dataKey === "views") {
                                      label = "再生回数";
                                    } else if (dataKey === "estimatedMinutesWatched") {
                                      label = "総再生時間";
                                    } else if (dataKey === "netSubscribers") {
                                      label = "純増登録者数";
                                    }
                                    
                                    return (
                                      <div key={index} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                          />
                                          <span className="text-xs">{label}</span>
                  </div>
                                        <span className="text-xs font-semibold">
                                          {dataKey === "estimatedMinutesWatched"
                                            ? formatMinutes(item.value as number)
                                            : formatYouTubeNumber(item.value as number)}
                                        </span>
                </div>
                                    );
                                  })}
                    </div>
                  </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="views"
                        fill="hsl(210, 100%, 50%)"
                        fillOpacity={0.2}
                        stroke="hsl(210, 100%, 50%)"
                        strokeWidth={2}
                        name="再生回数"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="estimatedMinutesWatched"
                        stroke="hsl(280, 100%, 60%)"
                        strokeWidth={2}
                        dot={{ fill: "hsl(280, 100%, 60%)", r: 3 }}
                        name="総再生時間"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="netSubscribers"
                        stroke="hsl(150, 80%, 40%)"
                        strokeWidth={2}
                        dot={{ fill: "hsl(150, 80%, 40%)", r: 3 }}
                        name="純増登録者数"
                      />
                      <Legend />
                    </ComposedChart>
                  </ChartContainer>
            </CardContent>
          </Card>

              {/* Graph B: 日別平均視聴時間の推移 */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    日別平均視聴時間の推移
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      averageViewDuration: { label: "平均視聴時間(秒)", color: "hsl(25, 95%, 53%)" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <LineChart
                      data={youtubeAnalyticsData.dailyData || []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 10,
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const mins = Math.floor(value / 60);
                          const secs = Math.round(value % 60);
                          return `${mins}:${secs.toString().padStart(2, '0')}`;
                        }}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const value = payload[0].value as number;
                            const mins = Math.floor(value / 60);
                            const secs = Math.round(value % 60);
                            return (
                              <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                                <div className="text-xs text-muted-foreground mb-2">
                                  {payload[0].payload.date}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: "hsl(25, 95%, 53%)" }}
                                      />
                                      <span className="text-xs">
                                        平均視聴時間
                                      </span>
                                    </div>
                                    <span className="text-xs font-semibold">
                                      {`${mins}分${secs}秒`}
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
                        type="monotone"
                        dataKey="averageViewDuration"
                        stroke="hsl(25, 95%, 53%)"
                        strokeWidth={3}
                        dot={{ fill: "hsl(25, 95%, 53%)", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="平均視聴時間"
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* YouTube Improvement Suggestions Button */}
          {youtubeAnalyticsData && (
            <Card className="border-border shadow-sm">
              <CardContent className="py-6">
                <div className="flex items-center justify-center">
                  <Button
                    onClick={handleGenerateYoutubeImprovements}
                    disabled={isGeneratingYoutubeSuggestions}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isGeneratingYoutubeSuggestions ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        改善提案
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* YouTube Improvement Suggestions Display */}
          {youtubeImprovementSuggestion && (
            <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-emerald-500/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    AI改善提案
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={cevioCast} onValueChange={setCevioCast}>
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="フィーちゃん">フィーちゃん</SelectItem>
                        <SelectItem value="ユニちゃん">ユニちゃん</SelectItem>
                        <SelectItem value="夏色花梨">夏色花梨</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSpeakYoutubeSuggestion}
                      className="h-8 px-3"
                    >
                      {isSpeakingYoutube ? (
                        <>
                          <VolumeX className="h-4 w-4 mr-1.5" />
                          停止
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 mr-1.5" />
                          読み上げ
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-lg bg-card/80 p-4 border border-border">
                    <p className="text-sm text-foreground leading-relaxed">
                      {youtubeImprovementSuggestion.summary}
                    </p>
                  </div>

                  {/* Key Insights */}
                  <div className="rounded-lg bg-card/80 p-4 border border-border">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      主要インサイト
                    </h4>
                    <ul className="space-y-2">
                      {youtubeImprovementSuggestion.key_insights.map((insight, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="rounded-lg bg-card/80 p-4 border border-border">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      改善推奨事項
                    </h4>
                    <ul className="space-y-2">
                      {youtubeImprovementSuggestion.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">{index + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Info Row (if available) */}
                  {(youtubeImprovementSuggestion.best_posting_time || 
                    (youtubeImprovementSuggestion.hashtag_recommendations && youtubeImprovementSuggestion.hashtag_recommendations.length > 0)) && (
                    <div className="grid grid-cols-2 gap-4">
                      {youtubeImprovementSuggestion.best_posting_time && (
                        <div className="rounded-lg bg-card/80 p-4 border border-border">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            推奨投稿時間
                          </h4>
                          <p className="text-lg font-semibold text-amber-500">
                            {youtubeImprovementSuggestion.best_posting_time}
                          </p>
                        </div>
                      )}
                      {youtubeImprovementSuggestion.hashtag_recommendations && youtubeImprovementSuggestion.hashtag_recommendations.length > 0 && (
                        <div className="rounded-lg bg-card/80 p-4 border border-border">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-pink-500" />
                            推奨ハッシュタグ
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {youtubeImprovementSuggestion.hashtag_recommendations.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* YouTube Report Export Button - Fixed Position */}
          {youtubeImprovementSuggestion && (
            <div className="fixed bottom-6 right-6 z-50">
              <Button
                onClick={handleExportYoutubeExcel}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 gap-2"
              >
                <FileText className="h-5 w-5" />
                レポート出力 (Excel)
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="twitter" className="space-y-4">
          {/* Period Selector and Analyze Button */}
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm font-medium">期間選択:</label>
                  <Select value={xPeriod} onValueChange={(value: XPeriod) => setXPeriod(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2hours">過去2時間</SelectItem>
                      <SelectItem value="1day">過去1日</SelectItem>
                      <SelectItem value="1week">過去1週間</SelectItem>
                      <SelectItem value="1month">過去1ヶ月間</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => handleXAnalyze(false)}
                  disabled={isXAnalyzing}
                  size="sm"
                  className="h-9 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
                >
                  {isXAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                      分析
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          {xAnalyticsData ? (
            <>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">いいね数</CardTitle>
                    <Heart className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(xAnalyticsData.likes_count)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">期間内の総いいね</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">リツイート数</CardTitle>
                    <Repeat2 className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(xAnalyticsData.retweets_count)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">期間内の総RT</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">返信数</CardTitle>
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(xAnalyticsData.replies_count)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">期間内の総返信</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">インプレッション</CardTitle>
                    <Eye className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(xAnalyticsData.impressions_count)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">総露出数</p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">フォロワー推移</CardTitle>
                    <Users className="h-4 w-4 text-sky-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(xAnalyticsData.followers_count)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section - Side by Side */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: Engagement & Impressions Chart */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        エンゲージメント & インプレッション
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {xPeriod === "2hours" ? "過去2時間" : xPeriod === "1day" ? "過去1日" : xPeriod === "1week" ? "過去1週間" : "過去1ヶ月間"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={engagementChartConfig} className="h-[280px] w-full">
                      <ComposedChart
                        data={xAnalyticsData.engagement_trend}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                          dataKey="time"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {payload[0].payload.time}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        <span className="text-xs">エンゲージメント</span>
                                      </div>
                                      <span className="text-xs font-semibold">{formatNumber(payload[0].value as number)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                                        <span className="text-xs">インプレッション</span>
                                      </div>
                                      <span className="text-xs font-semibold">{formatNumber(payload[1]?.value as number || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="impressions"
                          fill="hsl(280, 100%, 60%)"
                          fillOpacity={0.2}
                          stroke="hsl(280, 100%, 60%)"
                          strokeWidth={2}
                          name="インプレッション"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="engagement"
                          stroke="hsl(210, 100%, 50%)"
                          strokeWidth={2.5}
                          dot={{ fill: "hsl(210, 100%, 50%)", r: 3 }}
                          activeDot={{ r: 5 }}
                          name="エンゲージメント"
                        />
                      </ComposedChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Right: Hashtag Analysis Chart */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Hash className="h-4 w-4 text-pink-400" />
                        ハッシュタグ別いいね数
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        {topHashtags.length > 0 ? (
                          topHashtags.map((hashtag, index) => (
                          <Badge
                              key={`${hashtag.tag}-${index}`}
                            variant="outline"
                            className="text-xs"
                              style={{ borderColor: hashtagColors[index % hashtagColors.length], color: hashtagColors[index % hashtagColors.length] }}
                          >
                            #{hashtag.tag}
                          </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">データなし</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={hashtagChartConfig} className="h-[280px] w-full">
                      <BarChart
                        data={getHashtagChartData()}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                          dataKey="time"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border border-border bg-background p-3 shadow-md">
                                  <div className="text-xs text-muted-foreground mb-2">
                                    {payload[0].payload.time}
                                  </div>
                                  <div className="space-y-1">
                                    {payload.map((item, index) => (
                                      <div key={index} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                          />
                                          <span className="text-xs">#{item.dataKey}</span>
                                        </div>
                                        <span className="text-xs font-semibold">
                                          {formatNumber(item.value as number)} いいね
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {topHashtags.map((hashtag, index) => (
                          <Bar
                            key={`bar-${hashtag.tag}-${index}`}
                            dataKey={hashtag.tag}
                            fill={hashtagColors[index % hashtagColors.length]}
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                          />
                        ))}
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Improvement Suggestions Button */}
              <Card className="border-border shadow-sm">
                <CardContent className="py-6">
                  <div className="flex items-center justify-center">
                    <Button
                      onClick={handleGenerateImprovements}
                      disabled={isGeneratingSuggestions}
                      size="lg"
                      className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isGeneratingSuggestions ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          改善提案
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Suggestions Display */}
              {improvementSuggestion && (
                <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-pink-500/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-pink-500" />
                        AI改善提案
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select value={cevioCast} onValueChange={setCevioCast}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="フィーちゃん">フィーちゃん</SelectItem>
                            <SelectItem value="ユニちゃん">ユニちゃん</SelectItem>
                            <SelectItem value="夏色花梨">夏色花梨</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSpeakSuggestion}
                          className="h-8 px-3"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-4 w-4 mr-1.5" />
                              停止
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-1.5" />
                              読み上げ
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="rounded-lg bg-card/80 p-4 border border-border">
                        <p className="text-sm text-foreground leading-relaxed">
                          {improvementSuggestion.summary}
                        </p>
                      </div>

                      {/* Key Insights */}
                      <div className="rounded-lg bg-card/80 p-4 border border-border">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          主要インサイト
                        </h4>
                        <ul className="space-y-2">
                          {improvementSuggestion.key_insights.map((insight, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div className="rounded-lg bg-card/80 p-4 border border-border">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          改善推奨事項
                        </h4>
                        <ul className="space-y-2">
                          {improvementSuggestion.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">{index + 1}.</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Quick Info Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-card/80 p-4 border border-border">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            推奨投稿時間
                          </h4>
                          <p className="text-lg font-semibold text-amber-500">
                            {improvementSuggestion.best_posting_time}
                          </p>
                        </div>
                        <div className="rounded-lg bg-card/80 p-4 border border-border">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-pink-500" />
                            推奨ハッシュタグ
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {improvementSuggestion.hashtag_recommendations.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Report Export Button - Fixed Position */}
              {improvementSuggestion && (
                <div className="fixed bottom-6 right-6 z-50">
                  <Button
                    onClick={handleExportExcel}
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    レポート出力 (Excel)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-sky-500/10">
                      <Twitter className="h-10 w-10 text-sky-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      期間を選択して「分析」ボタンを押してください
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      X APIからデータを取得して分析を開始します
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
