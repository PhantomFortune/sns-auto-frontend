import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PenSquare,
  History,
  Image as ImageIcon,
  Wand2,
  Send,
  Clock,
  Heart,
  Repeat2,
  MessageCircle,
  Calendar,
  Trash2,
  Edit,
  Play,
  Square,
  FolderOpen,
  Layers,
  CheckCircle2,
  AlertCircle,
  Bot,
  Sparkles,
  X,
  Copy,
  ExternalLink,
  CheckCircle,
  Bell,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ScheduledPost {
  id: string;
  type: string;
  content: string;
  imageUrl?: string;
  scheduledTime: string;
  status: "pending" | "approved" | "rejected" | "posted";
  needsApproval: boolean;
}

interface PostHistory {
  id: string;
  content: string;
  datetime: string;
  likes: number;
  retweets: number;
  replies: number;
  imageUrl?: string;
}

interface AutoPostForm {
  postType: string;
  purpose: string;
  emojiStyle: string;
  emojiUsage: string;
  tone: string;
  posterType: string;
  requiredInfo: string;
  imageRole: string;
  cta: string;
  ctaCustom: string;
  scheduledDate: string;
  scheduledTime: string;
}

interface ImageLayer {
  id: string;
  name: string;
  file: File | null;
  preview: string | null;
  type: "background" | "character" | "overlay";
}

interface XReply {
  id: string;
  username: string;
  handle: string;
  content: string;
  datetime: string;
  likes: number;
  retweets: number;
  replies: number;
  avatar?: string;
  isUnread: boolean;
}

interface XAutoPostSchedule {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  description?: string;
  googleCalendarEventId?: string;
  datetime: Date; // For sorting and comparison
}

export default function PostSupport() {
  const [activeTab, setActiveTab] = useState("auto-post");
  const [postHistory, setPostHistory] = useState<PostHistory[]>([
    {
      id: "1",
      content: "配信ありがとうございました！楽しかったです",
      datetime: "2時間前",
      likes: 234,
      retweets: 45,
      replies: 23,
    },
    {
      id: "2",
      content: "20時から雑談配信します！遊びに来てね",
      datetime: "5時間前",
      likes: 189,
      retweets: 32,
      replies: 18,
    },
    {
      id: "3",
      content: "おはようございます！今日も頑張りましょう",
      datetime: "12時間前",
      likes: 456,
      retweets: 67,
      replies: 34,
    },
    {
      id: "4",
      content: "新しいShortsを投稿しました！",
      datetime: "1日前",
      likes: 312,
      retweets: 78,
      replies: 45,
    },
    {
      id: "5",
      content: "コラボ配信のお知らせです",
      datetime: "1日前",
      likes: 567,
      retweets: 123,
      replies: 89,
    },
  ]);

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: "1",
      type: "おはようVTuber",
      content: "おはようございます！今日も配信頑張ります",
      scheduledTime: "2025-11-23 07:00",
      status: "pending",
      needsApproval: true,
    },
    {
      id: "2",
      type: "配信告知",
      content: "20時から雑談配信やります！遊びに来てね",
      scheduledTime: "2025-11-23 19:00",
      status: "approved",
      needsApproval: true,
    },
  ]);

  const [autoPostForm, setAutoPostForm] = useState<AutoPostForm>({
    postType: "朝の挨拶",
    purpose: "親近感を高めたい",
    emojiStyle: "豊富に",
    emojiUsage: "バランス良く",
    tone: "カジュアル",
    posterType: "VTuber",
    requiredInfo: "",
    imageRole: "",
    cta: "なし",
    ctaCustom: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [autoPostImage, setAutoPostImage] = useState<{
    file: File | null;
    preview: string | null;
  }>({
    file: null,
    preview: null,
  });

  const [generatedText, setGeneratedText] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);

  const [imageLayers, setImageLayers] = useState<ImageLayer[]>([
    { id: "bg", name: "背景レイヤー", file: null, preview: null, type: "background" },
    { id: "char", name: "キャラクターレイヤー", file: null, preview: null, type: "character" },
    { id: "overlay", name: "テキストオーバーレイ", file: null, preview: null, type: "overlay" },
  ]);

  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState<ScheduledPost | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isReplyBoxOpened, setIsReplyBoxOpened] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [xReplies, setXReplies] = useState<XReply[]>([
    {
      id: "1",
      username: "視聴者A",
      handle: "@viewer_a",
      content: "配信ありがとうございました！楽しかったです",
      datetime: "2分前",
      likes: 5,
      retweets: 0,
      replies: 1,
      isUnread: true,
    },
    {
      id: "2",
      username: "視聴者B",
      handle: "@viewer_b",
      content: "次回の配信も楽しみにしてます！",
      datetime: "15分前",
      likes: 3,
      retweets: 0,
      replies: 0,
      isUnread: true,
    },
    {
      id: "3",
      username: "視聴者C",
      handle: "@viewer_c",
      content: "おはようございます！今日も配信頑張ってください",
      datetime: "1時間前",
      likes: 12,
      retweets: 2,
      replies: 3,
      isUnread: false,
    },
  ]);
  const [replyingTo, setReplyingTo] = useState<XReply | null>(null);
  const [replyToText, setReplyToText] = useState("");
  const [isCevioAINotificationEnabled, setIsCevioAINotificationEnabled] = useState(true);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [editForm, setEditForm] = useState({
    type: "",
    content: "",
    scheduledTime: "",
    imageUrl: "",
    status: "pending" as ScheduledPost["status"],
  });

  // X自動投稿スケジュール関連のstate
  const [xAutoPostSchedules, setXAutoPostSchedules] = useState<XAutoPostSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const editImageInputRef = useRef<HTMLInputElement | null>(null);
  const autoPostImageInputRef = useRef<HTMLInputElement | null>(null);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const deletePost = (id: string) => {
    setPostHistory((prev) => prev.filter((post) => post.id !== id));
  };

  const handleFileSelect = (layerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageLayers((prev) =>
          prev.map((layer) =>
            layer.id === layerId
              ? { ...layer, file, preview: reader.result as string }
              : layer
          )
        );
      };
      reader.readAsDataURL(file);
      console.log(`画像選択: ${layerId} - ${file.name}`);
    }
  };

  const composeImages = () => {
    setIsGenerating(true);
    // 画像合成のシミュレーション
    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      // 背景を描画
      const bgLayer = imageLayers.find((l) => l.type === "background");
      if (bgLayer?.preview) {
        const bgImg = new Image();
        bgImg.onload = () => {
          ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

          // キャラクターを描画
          const charLayer = imageLayers.find((l) => l.type === "character");
          if (charLayer?.preview) {
            const charImg = new Image();
            charImg.onload = () => {
              ctx.drawImage(charImg, 0, 0, canvas.width, canvas.height);
              setComposedImage(canvas.toDataURL("image/png"));
              setIsGenerating(false);
              console.log("画像合成完了");
            };
            charImg.src = charLayer.preview;
          } else {
            setComposedImage(canvas.toDataURL("image/png"));
            setIsGenerating(false);
          }
        };
        bgImg.src = bgLayer.preview;
      } else {
        // 背景がない場合は単色
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setComposedImage(canvas.toDataURL("image/png"));
        setIsGenerating(false);
      }
    }, 500);
  };

  const handleAutoPostImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAutoPostImage({
          file,
          preview: reader.result as string,
        });
        // 同じファイルを再選択できるように値をリセット
        if (autoPostImageInputRef.current) {
          autoPostImageInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAutoPostImage = () => {
    setAutoPostImage({ file: null, preview: null });
    if (autoPostImageInputRef.current) {
      autoPostImageInputRef.current.value = "";
    }
  };

  const handleGenerateText = async () => {
    setIsGeneratingText(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auto-post/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: autoPostForm.postType,
          purpose: autoPostForm.purpose,
          emoji_style: autoPostForm.emojiStyle,
          emoji_usage: autoPostForm.emojiUsage,
          tone: autoPostForm.tone,
          poster_type: autoPostForm.posterType,
          required_info: autoPostForm.requiredInfo || undefined,
          image_role: autoPostForm.imageRole || undefined,
          cta: autoPostForm.cta,
          cta_custom: autoPostForm.ctaCustom || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = "生成に失敗しました";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // JSON解析に失敗した場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.text) {
        setGeneratedText(data.text);
        toast.success("文章を生成しました");
      } else {
        throw new Error("生成された文章が空です");
      }
    } catch (error: unknown) {
      console.error("自動投稿生成エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "生成に失敗しました";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleSubmitAutoPost = () => {
    const trimmed = generatedText.trim();
    if (!trimmed) {
      toast.error("先に文章を生成してください");
      return;
    }
    if (trimmed.length > 280) {
      toast.error("280文字以内に収めてください");
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const defaultTime = now.toTimeString().slice(0, 5);
    const datePart = autoPostForm.scheduledDate || todayStr;
    const timePart = autoPostForm.scheduledTime || defaultTime;
    const scheduledTime = `${datePart} ${timePart}`;

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      type: autoPostForm.postType,
      content: trimmed,
      scheduledTime,
      status: "pending",
      needsApproval: true,
      imageUrl: autoPostImage.preview || undefined,
    };

    setPendingPost(newPost);
    setIsApprovalDialogOpen(true);
    toast.success("投稿案を作成しました。確認後に予約へ追加できます。");
  };

  const handleApprovePost = () => {
    if (pendingPost) {
      // 承認時はステータスをapprovedに変更して追加
      const approvedPost: ScheduledPost = {
        ...pendingPost,
        status: "approved",
      };
      setScheduledPosts((prev) => [...prev, approvedPost]);
      setIsApprovalDialogOpen(false);
      setPendingPost(null);
      console.log("投稿承認完了");
    }
  };

  const handleRejectPost = () => {
    if (pendingPost) {
      // 却下時はステータスをrejectedに変更して追加（記録として残す）
      const rejectedPost: ScheduledPost = {
        ...pendingPost,
        status: "rejected",
      };
      setScheduledPosts((prev) => [...prev, rejectedPost]);
      setIsApprovalDialogOpen(false);
      setPendingPost(null);
      console.log("投稿却下完了");
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(replyText);
      setCopiedToClipboard(true);
      toast.success("返信内容をクリップボードにコピーしました");
      setTimeout(() => setCopiedToClipboard(false), 2000);
      console.log("返信内容をクリップボードにコピー");
    } catch (err) {
      toast.error("クリップボードへのコピーに失敗しました");
      console.error("クリップボードコピーエラー:", err);
    }
  };

  const handleOpenReplyBox = async () => {
    // 返信内容をクリップボードにコピー
    try {
      await navigator.clipboard.writeText(replyText);
      setCopiedToClipboard(true);
      setIsReplyBoxOpened(true);
      
      // Xの返信ページを新しいタブで開く
      // 注意: Xの実際のURL構造は変更される可能性があります
      const xReplyUrl = "https://twitter.com/compose/tweet";
      window.open(xReplyUrl, "_blank");
      
      toast.success("返信内容をコピーし、Xを開きました。返信ボックスに貼り付けてください。");
      console.log("X返信ボックスを開く - 返信内容をクリップボードにコピー済み");
    } catch (err) {
      toast.error("クリップボードへのコピーに失敗しました");
      console.error("エラー:", err);
    }
  };

  const handleSendReply = () => {
    // 実際の送信処理はX側で行うため、ここでは確認のみ
    console.log(`返信内容確認: ${replyText}`);
    setIsReplyDialogOpen(false);
    toast.success("返信内容を確認しました。Xで送信してください。");
    // 送信後はテキストをクリアしない（ユーザーが再度使用する可能性があるため）
  };

  const handleOpenEditDialog = (post: ScheduledPost) => {
    setEditingPost(post);
    // scheduledTimeをdatetime-local形式に変換（"2025-11-23 07:00" -> "2025-11-23T07:00"）
    const datetimeLocalValue = post.scheduledTime.replace(" ", "T");
    setEditForm({
      type: post.type,
      content: post.content,
      scheduledTime: datetimeLocalValue,
      imageUrl: post.imageUrl || "",
      status: post.status,
    });
    setIsEditDialogOpen(true);
    console.log(`予約投稿編集開始: ${post.id}`);
  };

  const handleEditImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, imageUrl: reader.result as string });
        console.log("編集用画像を選択");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = () => {
    if (editingPost) {
      // datetime-local形式を通常形式に変換（"2025-11-23T07:00" -> "2025-11-23 07:00"）
      const formattedTime = editForm.scheduledTime.replace("T", " ");
      setScheduledPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? {
                ...p,
                type: editForm.type,
                content: editForm.content,
                scheduledTime: formattedTime,
                imageUrl: editForm.imageUrl || undefined,
                status: editForm.status,
              }
            : p
        )
      );
      setIsEditDialogOpen(false);
      setEditingPost(null);
      setEditForm({ type: "", content: "", scheduledTime: "", imageUrl: "", status: "pending" });
      console.log(`予約投稿編集完了: ${editingPost.id}`);
    }
  };

  // GoogleカレンダーからX自動投稿スケジュールを取得
  const fetchXAutoPostSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date(now);
      timeMax.setFullYear(now.getFullYear() + 1);
      timeMax.setHours(23, 59, 59, 999);

      const timeMinStr = timeMin.toISOString();
      const timeMaxStr = timeMax.toISOString();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/google-calendar/events?time_min=${encodeURIComponent(timeMinStr)}&time_max=${encodeURIComponent(timeMaxStr)}&max_results=2500`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "イベント取得に失敗しました" }));
        throw new Error(errorData.detail || "イベント取得に失敗しました");
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.events)) {
        throw new Error("無効なレスポンス形式");
      }

      // X自動投稿スケジュールをフィルタリング
      const xSchedules: XAutoPostSchedule[] = data.events
        .filter((event: any) => {
          // タイプがX自動投稿か確認
          if (event.type === "X自動投稿") {
            return true;
          }
          // 説明欄から判定
          const description = event.description || "";
          const descriptionLower = description.toLowerCase();
          const typeMatch = description.match(/\[種類: (.+?)\]/);
          if (typeMatch && typeMatch[1] === "X自動投稿") {
            return true;
          }
          if (description.includes("X") && !descriptionLower.includes("youtube")) {
            return true;
          }
          return false;
        })
        .map((event: any) => {
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          const startDay = startDate.getDate();
          const date = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
          
          const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
          const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

          // 日時をDateオブジェクトに変換（ソート用）
          const datetime = new Date(`${date}T${startTime}:00`);

          return {
            id: event.id,
            title: event.summary || "無題のイベント",
            date,
            startTime,
            endTime,
            description: event.description || undefined,
            googleCalendarEventId: event.id,
            datetime,
          };
        })
        .filter((schedule: XAutoPostSchedule) => {
          // 未来のスケジュールのみ（現在時刻以降）
          return schedule.datetime >= now;
        })
        .sort((a: XAutoPostSchedule, b: XAutoPostSchedule) => {
          // 日時順にソート（最も近いものが先頭）
          return a.datetime.getTime() - b.datetime.getTime();
        });

      setXAutoPostSchedules(xSchedules);
      console.log(`X自動投稿スケジュール取得完了: ${xSchedules.length}件`);
    } catch (error) {
      console.error("X自動投稿スケジュール取得エラー:", error);
      toast.error(error instanceof Error ? error.message : "スケジュール取得に失敗しました");
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // WebSocket接続でリアルタイム更新
  useEffect(() => {
    // 初回取得
    fetchXAutoPostSchedules();
    
    // WebSocket接続を確立
    if (!API_BASE_URL) {
      console.warn('API_BASE_URL is not set. WebSocket connection will not be established.');
      // フォールバック: ポーリングのみ
      const interval = setInterval(() => {
        fetchXAutoPostSchedules();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // API_BASE_URLからプロトコルとパスを除去してホストのみを取得
    const apiUrl = new URL(API_BASE_URL);
    const wsHost = apiUrl.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/ws/schedule-updates`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected for schedule updates');
          reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'schedule_update' || data.type === 'connected') {
              console.log('Schedule update received via WebSocket:', data);
              // スケジュールを再取得
              fetchXAutoPostSchedules();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // 再接続を試みる（最大5回）
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // 指数バックオフ、最大30秒
            console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            console.warn('Max reconnection attempts reached. Falling back to polling.');
            // ポーリングにフォールバック（5分ごと）
            const interval = setInterval(() => {
              fetchXAutoPostSchedules();
            }, 5 * 60 * 1000);
            return () => clearInterval(interval);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        // WebSocket接続に失敗した場合、ポーリングにフォールバック
        const interval = setInterval(() => {
          fetchXAutoPostSchedules();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 最も差し迫ったスケジュールを取得
  const getUpcomingSchedule = (): XAutoPostSchedule | null => {
    if (xAutoPostSchedules.length === 0) return null;
    return xAutoPostSchedules[0]; // 既にソート済みなので最初の要素
  };

  // 今後のX自動投稿数を取得
  const getUpcomingScheduleCount = (): number => {
    return xAutoPostSchedules.length;
  };

  // 日時をフォーマット
  const formatScheduleDateTime = (schedule: XAutoPostSchedule): string => {
    const date = new Date(schedule.datetime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `今日 ${schedule.startTime}`;
    } else if (diffDays === 1) {
      return `明日 ${schedule.startTime}`;
    } else if (diffDays <= 7) {
      return `${diffDays}日後 ${schedule.startTime}`;
    } else {
      return `${schedule.date} ${schedule.startTime}`;
    }
  };

  const upcomingSchedule = getUpcomingSchedule();
  const upcomingCount = getUpcomingScheduleCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">投稿サポート</h1>
          <p className="text-muted-foreground mt-2">
            X（旧Twitter）への自動投稿と返信サポートを管理します
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 通知アイコン（ドロップダウンメニュー） */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {upcomingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {upcomingCount > 99 ? "99+" : upcomingCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>X自動投稿スケジュール</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchXAutoPostSchedules();
                  }}
                  disabled={isLoadingSchedules}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingSchedules ? 'animate-spin' : ''}`} />
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingSchedules ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  読み込み中...
                </div>
              ) : xAutoPostSchedules.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  今後のX自動投稿スケジュールはありません
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {xAutoPostSchedules.map((schedule) => (
                    <DropdownMenuItem
                      key={schedule.id}
                      className="flex flex-col items-start p-3 cursor-pointer"
                      onClick={() => setIsScheduleDialogOpen(true)}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-2">
                          {schedule.id === upcomingSchedule?.id && (
                            <Bell className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="font-semibold text-sm">{schedule.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatScheduleDateTime(schedule)}</span>
                      </div>
                      {schedule.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {schedule.description.replace(/\[種類: .+?\]\n?/, "").trim()}
                        </p>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* スケジュール表示ボタン */}
          <Button
            variant="outline"
            onClick={() => {
              fetchXAutoPostSchedules();
              setIsScheduleDialogOpen(true);
            }}
            disabled={isLoadingSchedules}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {isLoadingSchedules ? "読み込み中..." : "スケジュール表示"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auto-post" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            自動投稿設定
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            予約投稿
          </TabsTrigger>
          <TabsTrigger value="reply-support" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            返信サポート
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            投稿履歴
          </TabsTrigger>
        </TabsList>

        {/* 自動投稿設定 */}
        <TabsContent value="auto-post" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                X自動投稿
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 左：設定 & 画像アップロード */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>画像アップロード</Label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={autoPostImageInputRef}
                      onChange={handleAutoPostImageUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => autoPostImageInputRef.current?.click()}
                      className="relative h-48 rounded-lg border border-border bg-muted/20 flex items-center justify-center hover:border-primary/70 hover:bg-muted/40 transition-colors cursor-pointer overflow-hidden"
                    >
                      {autoPostImage.preview ? (
                        <>
                          <img
                            src={autoPostImage.preview}
                            alt="投稿画像"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAutoPostImage();
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                            aria-label="画像をクリア"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
                          <p className="text-xs text-muted-foreground">画像をアップロード</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>投稿タイプ</Label>
                      <Select
                        value={autoPostForm.postType}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, postType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="朝の挨拶">朝の挨拶</SelectItem>
                          <SelectItem value="夜の挨拶">夜の挨拶</SelectItem>
                          <SelectItem value="放送・ストリーミング案内">放送・ストリーミング案内</SelectItem>
                          <SelectItem value="サービス・商品告知">サービス・商品告知</SelectItem>
                          <SelectItem value="雑談・日常投稿">雑談・日常投稿</SelectItem>
                          <SelectItem value="その他">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>目的</Label>
                      <Select
                        value={autoPostForm.purpose}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, purpose: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="親近感を高めたい">親近感を高めたい</SelectItem>
                          <SelectItem value="視聴・参加を誘導したい">視聴・参加を誘導したい</SelectItem>
                          <SelectItem value="情報を簡潔に伝えたい">情報を簡潔に伝えたい</SelectItem>
                          <SelectItem value="ブランディング">ブランディング</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>絵文字・感嘆符</Label>
                      <Select
                        value={autoPostForm.emojiStyle}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, emojiStyle: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="豊富に">豊富に</SelectItem>
                          <SelectItem value="多様化">多様化</SelectItem>
                          <SelectItem value="適度に">適度に</SelectItem>
                          <SelectItem value="控えめに">控えめに</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>絵文字・感嘆符の多用度</Label>
                      <Select
                        value={autoPostForm.emojiUsage}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, emojiUsage: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="多用する">多用する</SelectItem>
                          <SelectItem value="バランス良く">バランス良く</SelectItem>
                          <SelectItem value="控えめ">控えめ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>トーン</Label>
                      <Select
                        value={autoPostForm.tone}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, tone: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="カジュアル">カジュアル</SelectItem>
                          <SelectItem value="丁寧">丁寧</SelectItem>
                          <SelectItem value="活発">活発</SelectItem>
                          <SelectItem value="落ち着いた">落ち着いた</SelectItem>
                          <SelectItem value="専門的">専門的</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>投稿主タイプ</Label>
                      <Select
                        value={autoPostForm.posterType}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, posterType: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VTuber">VTuber</SelectItem>
                          <SelectItem value="個人">個人</SelectItem>
                          <SelectItem value="企業公式">企業公式</SelectItem>
                          <SelectItem value="インフルエンサー">インフルエンサー</SelectItem>
                          <SelectItem value="その他">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>必須情報（入力/空欄可）</Label>
                      <Textarea
                        placeholder="例）本日21時より配信、URL不要、出演者：〇〇、ハッシュタグ：#〇〇 など"
                        value={autoPostForm.requiredInfo}
                        onChange={(e) =>
                          setAutoPostForm({ ...autoPostForm, requiredInfo: e.target.value })
                        }
                        className="mt-1 min-h-[120px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        文中に自然に差し込みます。長めの情報もここにまとめてください。
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>画像の役割</Label>
                    <Select
                      value={autoPostForm.imageRole}
                      onValueChange={(value) => setAutoPostForm({ ...autoPostForm, imageRole: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="雰囲気伝達用">雰囲気伝達用</SelectItem>
                        <SelectItem value="内容補足">内容補足</SelectItem>
                        <SelectItem value="情報（日時等）を含む">情報（日時等）を含む</SelectItem>
                        <SelectItem value="特に関係なし">特に関係なし</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>行動喚起（CTA）</Label>
                      <Select
                        value={autoPostForm.cta}
                        onValueChange={(value) => setAutoPostForm({ ...autoPostForm, cta: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="なし">なし</SelectItem>
                          <SelectItem value="見てほしい">見てほしい</SelectItem>
                          <SelectItem value="参加してほしい">参加してほしい</SelectItem>
                          <SelectItem value="詳細を確認してほしい">詳細を確認してほしい</SelectItem>
                          <SelectItem value="自由入力">自由入力</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {autoPostForm.cta === "自由入力" && (
                      <div>
                        <Label>CTA自由入力</Label>
                        <Input
                          placeholder="例）詳細はこちらからチェック！"
                          value={autoPostForm.ctaCustom}
                          onChange={(e) =>
                            setAutoPostForm({ ...autoPostForm, ctaCustom: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 右：生成 & プレビュー */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 mt-9">
                    <Button
                      onClick={handleGenerateText}
                      disabled={isGeneratingText}
                      className="bg-primary hover:bg-primary-hover"
                    >
                      {isGeneratingText ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          文章を生成
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>生成結果（編集可）</Label>
                    <Textarea
                      value={generatedText}
                      onChange={(e) => setGeneratedText(e.target.value)}
                      placeholder="生成された文章が表示されます。ここで編集できます。"
                      className="min-h-[200px]"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>280文字以内で自然な文体に整えています</span>
                      <span>{generatedText.length} / 280</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">プレビュー（画像 + テキスト）</p>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border rounded-md p-3 bg-card">
                        {generatedText || "ここに生成結果が表示されます。生成後に編集できます。"}
                      </div>
                      <div className="w-full rounded-md border border-border bg-background overflow-hidden">
                        {autoPostImage.preview ? (
                          <img
                            src={autoPostImage.preview}
                            alt="プレビュー画像"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center text-xs text-muted-foreground">
                            画像なし
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 items-end pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label>予約日</Label>
                  <Input
                    type="date"
                    value={autoPostForm.scheduledDate}
                    onChange={(e) =>
                      setAutoPostForm({ ...autoPostForm, scheduledDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>予約時間</Label>
                  <Input
                    type="time"
                    value={autoPostForm.scheduledTime}
                    onChange={(e) =>
                      setAutoPostForm({ ...autoPostForm, scheduledTime: e.target.value })
                    }
                  />
                </div>
                <div className="flex md:justify-end">
                  <Button
                    onClick={handleSubmitAutoPost}
                    disabled={isGeneratingText || generatedText.trim().length === 0 || generatedText.length > 280}
                    className="w-full md:w-auto bg-primary hover:bg-primary-hover"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    投稿
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

          {/* 予約投稿 */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">予約投稿リスト</CardTitle>
              <Button
                className="bg-primary hover:bg-primary-hover"
                onClick={() => {
                  setActiveTab("auto-post");
                  console.log("自動投稿設定タブへ移動");
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                新規予約
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    予約投稿がありません
                  </p>
                ) : (
                  scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start justify-between border-b border-border last:border-0 pb-4 last:pb-0 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{post.type}</Badge>
                          <Badge
                            variant={
                              post.status === "approved"
                                ? "default"
                                : post.status === "posted"
                                  ? "default"
                                  : post.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                            }
                            className={
                              post.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                : post.status === "rejected"
                                  ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
                                  : ""
                            }
                          >
                            {post.status === "pending"
                              ? "承認待ち"
                              : post.status === "approved"
                                ? "承認済み"
                                : post.status === "posted"
                                  ? "投稿済み"
                                  : "却下済み"}
                          </Badge>
                          {post.needsApproval && post.status === "pending" && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              要確認
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-2">{post.content}</p>
                        {post.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={post.imageUrl}
                              alt="投稿画像"
                              className="w-32 h-32 object-cover rounded-lg border border-border"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{post.scheduledTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {post.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setScheduledPosts((prev) =>
                                  prev.map((p) =>
                                    p.id === post.id ? { ...p, status: "approved" } : p
                                  )
                                );
                                console.log(`投稿承認: ${post.id}`);
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              承認
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setScheduledPosts((prev) =>
                                  prev.map((p) =>
                                    p.id === post.id ? { ...p, status: "rejected" } : p
                                  )
                                );
                                console.log(`投稿却下: ${post.id}`);
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              <span className="text-xs">却下</span>
                            </Button>
                          </>
                        )}
                        {post.status === "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setScheduledPosts((prev) =>
                                prev.map((p) =>
                                  p.id === post.id ? { ...p, status: "pending" } : p
                                )
                              );
                              console.log(`投稿を承認待ちに戻す: ${post.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            再承認
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(post)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setScheduledPosts((prev) => prev.filter((p) => p.id !== post.id));
                            console.log(`予約投稿削除: ${post.id}`);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>        

        {/* 返信サポート */}
        <TabsContent value="reply-support" className="space-y-4">
          {/* Cevio AI音声通知設定 */}
          <Card className="border-border shadow-sm flex flex-row items-center justify-between">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Cevio AI音声通知設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-4 mr-4">
                <Switch
                  checked={isCevioAINotificationEnabled}
                  onCheckedChange={setIsCevioAINotificationEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Xからの返信一覧 */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Xからの返信
                {xReplies.filter((r) => r.isUnread).length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {xReplies.filter((r) => r.isUnread).length}件の未読
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setXReplies((prev) => prev.map((r) => ({ ...r, isUnread: false })));
                  toast.success("すべての返信を既読にしました");
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                すべて既読
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {xReplies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    返信がありません
                  </p>
                ) : (
                  xReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg border ${
                        reply.isUnread
                          ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                          : "border-border bg-card"
                      } hover:bg-accent/30 transition-colors group`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {reply.username.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{reply.username}</span>
                            <span className="text-xs text-muted-foreground">{reply.handle}</span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{reply.datetime}</span>
                            {reply.isUnread && (
                              <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                                新着
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-3 leading-relaxed break-words">
                            {reply.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5" />
                              <span>{reply.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Repeat2 className="h-3.5 w-3.5" />
                              <span>{reply.retweets}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{reply.replies}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(reply);
                              setReplyToText(`@${reply.handle} `);
                              setXReplies((prev) =>
                                prev.map((r) => (r.id === reply.id ? { ...r, isUnread: false } : r))
                              );
                              console.log(`返信開始: ${reply.id}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            返信する
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 返信作成 */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                {replyingTo ? `返信: @${replyingTo.handle}` : "返信作成"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replyingTo && (
                <div className="rounded-lg bg-muted/50 p-3 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{replyingTo.username}</p>
                      <p className="text-xs text-muted-foreground">{replyingTo.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyToText("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="reply-text">返信内容</Label>
                <Textarea
                  id="reply-text"
                  value={replyingTo ? replyToText : replyText}
                  onChange={(e) => {
                    if (replyingTo) {
                      setReplyToText(e.target.value);
                    } else {
                      setReplyText(e.target.value);
                    }
                  }}
                  placeholder="返信内容を入力してください"
                  className="mt-1 min-h-32"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {(replyingTo ? replyToText : replyText).length} / 280文字
                  </span>
                  {(replyingTo ? replyToText : replyText).length > 280 && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                      文字数制限を超えています
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const text = replyingTo ? replyToText : replyText;
                    try {
                      await navigator.clipboard.writeText(text);
                      setCopiedToClipboard(true);
                      toast.success("返信内容をクリップボードにコピーしました");
                      setTimeout(() => setCopiedToClipboard(false), 2000);
                    } catch (err) {
                      toast.error("クリップボードへのコピーに失敗しました");
                    }
                  }}
                  className="flex-1"
                  disabled={!(replyingTo ? replyToText : replyText).trim()}
                >
                  {copiedToClipboard ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      クリップボードにコピー
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const text = replyingTo ? replyToText : replyText;
                    try {
                      await navigator.clipboard.writeText(text);
                      setCopiedToClipboard(true);
                      setIsReplyBoxOpened(true);
                      const xReplyUrl = replyingTo
                        ? `https://twitter.com/${replyingTo.handle}/status/${replyingTo.id}`
                        : "https://twitter.com/compose/tweet";
                      window.open(xReplyUrl, "_blank");
                      toast.success("返信内容をコピーし、Xを開きました");
                    } catch (err) {
                      toast.error("クリップボードへのコピーに失敗しました");
                    }
                  }}
                  className="flex-1"
                  disabled={!(replyingTo ? replyToText : replyText).trim()}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Xを開いてコピー
                </Button>
                <Button
                  onClick={() => setIsReplyDialogOpen(true)}
                  className="flex-1 bg-primary hover:bg-primary-hover"
                  disabled={!(replyingTo ? replyToText : replyText).trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  送信前確認
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 投稿履歴 */}
        <TabsContent value="history" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">最近の投稿</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto scroll-smooth pr-2 space-y-3 custom-scrollbar">
                {postHistory.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors duration-150 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm mb-2.5 text-foreground leading-relaxed break-words">
                          {post.content}
                        </p>
                        {post.imageUrl && (
                          <div className="mb-2.5">
                            <img
                              src={post.imageUrl}
                              alt="投稿画像"
                              className="w-32 h-32 object-cover rounded-lg border border-border"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">
                            {post.datetime}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5" />
                              <span className="font-medium">{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Repeat2 className="h-3.5 w-3.5" />
                              <span className="font-medium">{post.retweets}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="font-medium">{post.replies}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 承認ダイアログ */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              投稿内容の確認
            </DialogTitle>
            <DialogDescription>
              自動生成された投稿内容を確認し、承認または却下してください
            </DialogDescription>
          </DialogHeader>
          {pendingPost && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    S
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">しぇれす sheless</span>
                      <span className="text-xs text-muted-foreground">@shelessV</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-3">{pendingPost.content}</p>
                    {pendingPost.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={pendingPost.imageUrl}
                          alt="投稿画像"
                          className="w-full max-w-md rounded-lg border border-border"
                        />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {pendingPost.scheduledTime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleRejectPost}>
              却下
            </Button>
            <Button onClick={handleApprovePost} className="bg-primary hover:bg-primary-hover">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              承認して予約
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 返信確認ダイアログ */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              返信内容の確認
            </DialogTitle>
            <DialogDescription>
              送信前に内容を確認してください。確認後、Xで送信してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {replyingTo && (
              <div className="rounded-lg bg-muted/50 p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">返信先</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{replyingTo.username}</span>
                  <span className="text-xs text-muted-foreground">@{replyingTo.handle}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {replyingTo.content}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border p-4 bg-card">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                  S
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">しぇれす sheless</span>
                    <span className="text-xs text-muted-foreground">@shelessV</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {replyingTo ? replyToText : replyText}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {(replyingTo ? replyToText : replyText).length} / 280文字
                  </div>
                </div>
              </div>
            </div>
            {(replyingTo ? replyToText : replyText).length > 280 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-900">
                <p className="text-xs text-red-700 dark:text-red-300">
                  ⚠️ 文字数制限（280文字）を超えています。Xでは送信できません。
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={() => {
                handleSendReply();
                if (replyingTo) {
                  setReplyingTo(null);
                  setReplyToText("");
                }
              }}
              disabled={(replyingTo ? replyToText : replyText).length > 280}
              className="bg-primary hover:bg-primary-hover"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              内容を確認しました
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 予約投稿編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              予約投稿を編集
            </DialogTitle>
            <DialogDescription>
              投稿内容と予約日時を編集できます
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-post-type">投稿タイプ</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                >
                  <SelectTrigger id="edit-post-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="おはようVTuber">おはようVTuber</SelectItem>
                    <SelectItem value="配信告知">配信告知</SelectItem>
                    <SelectItem value="お礼・感想">お礼・感想</SelectItem>
                    <SelectItem value="日常投稿">日常投稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-scheduled-time">予約日時</Label>
                <Input
                  id="edit-scheduled-time"
                  type="datetime-local"
                  value={editForm.scheduledTime}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      scheduledTime: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-content">投稿内容</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="投稿内容を入力してください"
                className="mt-1 min-h-32"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {editForm.content.length} / 280文字
                </span>
              </div>
            </div>
            <div>
              <Label>投稿画像</Label>
              <input
                type="file"
                accept="image/*"
                ref={editImageInputRef}
                onChange={handleEditImageSelect}
                className="hidden"
              />
              <div className="mt-2 space-y-2">
                {editForm.imageUrl && (
                  <div className="relative">
                    <img
                      src={editForm.imageUrl}
                      alt="投稿画像"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setEditForm({ ...editForm, imageUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => editImageInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {editForm.imageUrl ? "画像を変更" : "画像を選択"}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">ステータス</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: ScheduledPost["status"]) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger id="edit-status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span>承認待ち</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>承認済み</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>却下済み</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="posted">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>投稿済み</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                投稿のステータスを変更できます
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingPost(null);
                setEditForm({ type: "", content: "", scheduledTime: "", imageUrl: "", status: "pending" });
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editForm.type || !editForm.content || !editForm.scheduledTime}
              className="bg-primary hover:bg-primary-hover"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* X自動投稿スケジュール表示ダイアログ */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              X自動投稿スケジュール
            </DialogTitle>
            <DialogDescription>
              Googleカレンダーから取得したX自動投稿のスケジュール一覧
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingSchedules ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">読み込み中...</span>
              </div>
            ) : xAutoPostSchedules.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">今後のX自動投稿スケジュールはありません</p>
                <Button
                  variant="outline"
                  onClick={fetchXAutoPostSchedules}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再読み込み
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">
                    合計 {xAutoPostSchedules.length} 件のスケジュール
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchXAutoPostSchedules}
                    disabled={isLoadingSchedules}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSchedules ? 'animate-spin' : ''}`} />
                    更新
                  </Button>
                </div>
                <div className="space-y-3">
                  {xAutoPostSchedules.map((schedule) => {
                    const isUpcoming = schedule.id === upcomingSchedule?.id;
                    return (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-lg border ${
                          isUpcoming
                            ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                            : "border-border bg-card"
                        } hover:bg-accent/30 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {isUpcoming && (
                                <Bell className="h-4 w-4 text-amber-500 flex-shrink-0" />
                              )}
                              <h3 className="font-semibold text-base">{schedule.title}</h3>
                              {isUpcoming && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300">
                                  最優先
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                <span>{schedule.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                <span>{schedule.startTime} - {schedule.endTime}</span>
                              </div>
                              <div className="text-xs">
                                {formatScheduleDateTime(schedule)}
                              </div>
                            </div>
                            {schedule.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {schedule.description.replace(/\[種類: .+?\]\n?/, "").trim()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
