import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar,
  Clock,
  Bell,
  CalendarDays,
  CalendarRange,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Link as LinkIcon,
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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type ScheduleType =
  | "YouTubeライブ配信"
  | "X自動投稿"
  | "重要イベント"
  | "その他";

interface Schedule {
  id: string;
  title: string;
  type: ScheduleType;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  description?: string;
  googleCalendarEventId?: string; // Google Calendar event ID for sync
  fromGoogleCalendar?: boolean; // Flag to indicate if schedule came from Google Calendar
}

interface ImportantEventSchedule {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  description?: string;
  googleCalendarEventId?: string;
  datetime: Date; // For sorting and comparison
}

// 種類ごとの固定色マッピング
const getDefaultColor = (type: ScheduleType): string => {
  const colorMap: Record<ScheduleType, string> = {
    "YouTubeライブ配信": "#fbbf24", // 黄色
    "X自動投稿": "#3b82f6", // 青色
    "重要イベント": "#dc2626", // 赤色（目立つ色）
    "その他": "#9aa0a6", // グレー
  };
  return colorMap[type] || "#9aa0a6";
};

// 色を背景色クラスに変換（表示用）
const getColorClass = (color?: string, type?: ScheduleType): string => {
  if (color) {
    // カスタム色の場合はインラインスタイルを使用
    return "";
  }
  const defaultColor = type ? getDefaultColor(type) : "#9aa0a6";
  // デフォルト色をTailwindクラスにマッピング
  if (defaultColor === "#ea4335") return "bg-red-500";
  if (defaultColor === "#34a853") return "bg-green-500";
  if (defaultColor === "#fbbc04") return "bg-yellow-500";
  return "bg-gray-500";
};

interface Reminder {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduleDate: string;
  scheduleTime: string;
  reminderTime: string; // HH:mm format, time before schedule to remind
  enabled: boolean;
}

export default function Scheduler() {
  const [activeTab, setActiveTab] = useState("week");
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isDayViewDialogOpen, setIsDayViewDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    type: "YouTubeライブ配信" as ScheduleType,
    date: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  // Google Calendar sync state
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // 重要イベントスケジュール関連のstate
  const [importantEventSchedules, setImportantEventSchedules] = useState<ImportantEventSchedule[]>([]);
  const [isLoadingImportantEvents, setIsLoadingImportantEvents] = useState(false);
  const [isImportantEventDialogOpen, setIsImportantEventDialogOpen] = useState(false);

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeek * 7);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Sync Google Calendar events
  // Strategy: Always sync full range (past 1 year to future 1 year) to ensure complete synchronization
  const syncGoogleCalendarEvents = async () => {
    if (!isGoogleCalendarConnected) {
      return;
    }

    try {
      setIsSyncing(true);
      
      // Calculate full time range: past 1 year to future 1 year
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setFullYear(now.getFullYear() - 1);
      timeMin.setHours(0, 0, 0, 0);
      
      const timeMax = new Date(now);
      timeMax.setFullYear(now.getFullYear() + 1);
      timeMax.setHours(23, 59, 59, 999);

      // Format dates for API (ISO format)
      const timeMinStr = timeMin.toISOString();
      const timeMaxStr = timeMax.toISOString();

      // Fetch events from Google Calendar (full range: past 1 year to future 1 year)
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
        console.error("Googleカレンダーイベント取得エラー:", response.status, errorData);
        toast.error(`Googleカレンダーからのイベント取得に失敗しました: ${errorData.detail || "エラーが発生しました"}`);
        return;
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.events)) {
        console.error("Googleカレンダーイベント取得エラー: 無効なレスポンス形式", data);
        toast.error("Googleカレンダーからのイベント取得に失敗しました: 無効なレスポンス形式");
        return;
      }

      // Convert Google Calendar events to Schedule format
      const googleCalendarSchedules: Schedule[] = data.events.map((event: any) => {
        // Parse start and end times - handle timezone correctly
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        // Extract date in local timezone (JST) to avoid timezone conversion issues
        // Use local date components instead of ISO string to preserve correct date
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        const date = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
        
        // Extract time in local timezone (JST)
        const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        
        
        // Extract type from event description
        // Rules: 
        // Priority 1: Check for "#重要" hashtag → 重要イベント (highest priority)
        // Priority 2: Check for "youtube" (case-insensitive) → YouTubeライブ配信
        // Priority 3: Check for "X" (uppercase) → X自動投稿
        // Otherwise → その他
        let type: ScheduleType = "その他";
        
        // First, try to get type from event.type (if backend already extracted it)
        if (event.type && ["YouTubeライブ配信", "X自動投稿", "重要イベント", "その他"].includes(event.type)) {
          type = event.type as ScheduleType;
        } else {
          // Determine type from description
          const description = event.description || "";
          const descriptionLower = description.toLowerCase();
          
          // Check for [種類: ...] prefix first (if backend added it)
          const typeMatch = description.match(/\[種類: (.+?)\]/);
          if (typeMatch && ["YouTubeライブ配信", "X自動投稿", "重要イベント", "その他"].includes(typeMatch[1])) {
            type = typeMatch[1] as ScheduleType;
          } else if (description.includes("#重要")) {
            // Priority 1: Check for "#重要" hashtag (highest priority)
            type = "重要イベント";
          } else if (descriptionLower.includes("youtube")) {
            // Priority 2: Check for "youtube" (case-insensitive) in description
            type = "YouTubeライブ配信";
          } else if (description.includes("X")) {
            // Priority 3: Check for "X" (uppercase) in description
            type = "X自動投稿";
          }
          // Otherwise, default to "その他"
        }
        
        // Clean description (remove type prefix if exists)
        let cleanDescription = event.description || "";
        cleanDescription = cleanDescription.replace(/\[種類: .+?\]\n?/, "").trim();

        return {
          id: `gc_${event.id}`, // Prefix to identify Google Calendar events
          title: event.summary || "無題のイベント",
          type: type,
          date: date,
          startTime: startTime,
          endTime: endTime,
          description: cleanDescription || undefined,
          googleCalendarEventId: event.id,
          fromGoogleCalendar: true,
        };
      });

      // Merge with existing schedules using functional update
      // Strategy: 
      // 1. Keep all local schedules (not from Google Calendar) - these are user-created in the system
      // 2. Replace all Google Calendar schedules with fresh data from API
      // 3. Use googleCalendarEventId as the key to identify and update Google Calendar events
      setSchedules(prevSchedules => {
        // Separate local schedules (user-created in system) and Google Calendar schedules
        const localSchedules = prevSchedules.filter(s => !s.fromGoogleCalendar);
        
        // Create a map of Google Calendar schedules by event ID for quick lookup
        const googleCalendarScheduleMap = new Map<string, Schedule>();
        googleCalendarSchedules.forEach(schedule => {
          if (schedule.googleCalendarEventId) {
            googleCalendarScheduleMap.set(schedule.googleCalendarEventId, schedule);
          }
        });
        
        // Update existing local schedules that have googleCalendarEventId
        // (these were synced from Google Calendar but may have been edited locally)
        const updatedLocalSchedules = localSchedules.map(localSchedule => {
          if (localSchedule.googleCalendarEventId && googleCalendarScheduleMap.has(localSchedule.googleCalendarEventId)) {
            // This local schedule corresponds to a Google Calendar event
            // Keep the local version (user may have edited it)
            return localSchedule;
          }
          return localSchedule;
        });
        
        // Combine: local schedules + all Google Calendar schedules
        const mergedSchedules = [...updatedLocalSchedules, ...googleCalendarSchedules];
        
        // Remove duplicates by googleCalendarEventId (prefer local version if exists)
        const uniqueSchedules = mergedSchedules.reduce((acc: Schedule[], current: Schedule) => {
          if (current.googleCalendarEventId) {
            // Check if we already have this Google Calendar event
            const existingIndex = acc.findIndex(
              s => s.googleCalendarEventId === current.googleCalendarEventId
            );
            if (existingIndex !== -1) {
              // If local version exists, keep it; otherwise use Google Calendar version
              if (!acc[existingIndex].fromGoogleCalendar && current.fromGoogleCalendar) {
                // Keep existing local schedule
                return acc;
              } else {
                // Replace with newer Google Calendar version
                acc[existingIndex] = current;
                return acc;
              }
            }
          }
          
          // Check for duplicate by id (for local schedules)
          const existingByIdIndex = acc.findIndex(s => s.id === current.id);
          if (existingByIdIndex !== -1) {
            // Same id exists - prefer local version
            if (!acc[existingByIdIndex].fromGoogleCalendar && current.fromGoogleCalendar) {
              return acc; // Keep existing local schedule
            } else {
              acc[existingByIdIndex] = current; // Replace with local version
              return acc;
            }
          }
          
          // No duplicate found, add to accumulator
          acc.push(current);
          return acc;
        }, []);

        console.log(`同期完了: ローカル${localSchedules.length}件 + Googleカレンダー${googleCalendarSchedules.length}件 = 合計${uniqueSchedules.length}件`);
        
        return uniqueSchedules;
      });
      
      console.log(`Googleカレンダーから${googleCalendarSchedules.length}件のイベントを同期しました`);
      toast.success(`Googleカレンダーと同期しました（${googleCalendarSchedules.length}件のイベント）`);
    } catch (error) {
      console.error("Googleカレンダー同期エラー:", error);
      toast.error("Googleカレンダーとの同期に失敗しました");
    } finally {
      setIsSyncing(false);
    }
  };

  // Check Google Calendar connection status on mount and after auth callback
  useEffect(() => {
    checkGoogleCalendarStatus();
    
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('calendar_auth') === 'success') {
      toast.success("Googleカレンダーへの接続が完了しました");
      // Remove the query parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Recheck connection status and sync events
      setTimeout(() => {
        checkGoogleCalendarStatus();
      }, 1000);
    }
  }, []);

  // Sync Google Calendar events when connected
  useEffect(() => {
    if (isGoogleCalendarConnected) {
      // Initial sync when connected
      syncGoogleCalendarEvents();
    }
  }, [isGoogleCalendarConnected]);

  // Real-time sync: WebSocket + Polling fallback
  useEffect(() => {
    if (!isGoogleCalendarConnected) {
      return;
    }

    // WebSocket接続を確立
    if (!API_BASE_URL) {
      console.warn('API_BASE_URL is not set. Falling back to polling only.');
      const pollInterval = setInterval(() => {
        syncGoogleCalendarEvents();
      }, 30000);
      return () => clearInterval(pollInterval);
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = new URL(API_BASE_URL);
    const wsHost = apiUrl.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/ws/schedule-updates`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let pollInterval: NodeJS.Timeout | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected for schedule updates');
          reconnectAttempts = 0;
          // Clear polling when WebSocket is connected
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'schedule_update' || data.type === 'connected') {
              console.log('Schedule update received via WebSocket:', data);
              syncGoogleCalendarEvents();
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
          // Fallback to polling when WebSocket is disconnected
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              syncGoogleCalendarEvents();
            }, 30000);
          }
          
          // Reconnect attempt
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            console.warn('Max reconnection attempts reached. Using polling only.');
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        // Fallback to polling
        if (!pollInterval) {
          pollInterval = setInterval(() => {
            syncGoogleCalendarEvents();
          }, 30000);
        }
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
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isGoogleCalendarConnected]);

  // 重要イベントスケジュールを取得（現在時点から3ヶ月以内）
  const fetchImportantEventSchedules = async () => {
    if (!isGoogleCalendarConnected) {
      setImportantEventSchedules([]);
      return;
    }

    setIsLoadingImportantEvents(true);
    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setHours(0, 0, 0, 0);
      
      // 3ヶ月後まで取得
      const timeMax = new Date(now);
      timeMax.setMonth(now.getMonth() + 3);
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

      // 重要イベントをフィルタリング（「#重要」ハッシュタグがある場合のみ）
      const importantEvents: ImportantEventSchedule[] = data.events
        .filter((event: any) => {
          const description = event.description || "";
          
          // 「#重要」ハッシュタグが含まれる場合のみ重要イベントとして認識
          if (description.includes("#重要")) {
            return true;
          }
          
          // タイプが「重要イベント」で、かつ説明欄に「#重要」が含まれる場合
          const eventType = event.type || "";
          if (eventType === "重要イベント" && description.includes("#重要")) {
            return true;
          }
          
          // 説明欄から[種類: 重要イベント]を抽出し、かつ「#重要」が含まれる場合
          const typeMatch = description.match(/\[種類: (.+?)\]/);
          if (typeMatch && typeMatch[1] === "重要イベント" && description.includes("#重要")) {
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
          // JST（UTC+9）として解釈
          const datetime = new Date(`${date}T${startTime}:00+09:00`);
          
          // タイムゾーン情報がない場合は、ローカルタイムゾーンとして扱う
          if (isNaN(datetime.getTime())) {
            const fallbackDatetime = new Date(`${date}T${startTime}:00`);
            return {
              id: event.id,
              title: event.summary || "無題のイベント",
              date,
              startTime,
              endTime,
              description: event.description || undefined,
              googleCalendarEventId: event.id,
              datetime: fallbackDatetime,
            };
          }

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
        .filter((schedule: ImportantEventSchedule) => {
          // 当日以降のスケジュールを含める
          const scheduleDate = new Date(schedule.date);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          today.setHours(0, 0, 0, 0);
          scheduleDate.setHours(0, 0, 0, 0);
          
          return scheduleDate >= today;
        })
        .sort((a: ImportantEventSchedule, b: ImportantEventSchedule) => {
          // 日時順にソート（最も近いものが先頭）
          return a.datetime.getTime() - b.datetime.getTime();
        });

      setImportantEventSchedules(importantEvents);
      console.log(`重要イベントスケジュール取得完了: ${importantEvents.length}件`);
    } catch (error) {
      console.error("重要イベントスケジュール取得エラー:", error);
      toast.error(error instanceof Error ? error.message : "重要イベントスケジュール取得に失敗しました");
    } finally {
      setIsLoadingImportantEvents(false);
    }
  };

  // WebSocket接続でリアルタイム更新（重要イベント）
  useEffect(() => {
    if (!isGoogleCalendarConnected) {
      setImportantEventSchedules([]);
      return;
    }

    // 初回取得
    fetchImportantEventSchedules();
    
    // WebSocket接続を確立
    if (!API_BASE_URL) {
      console.warn('API_BASE_URL is not set. WebSocket connection will not be established.');
      // フォールバック: ポーリングのみ
      const interval = setInterval(() => {
        fetchImportantEventSchedules();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
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
          console.log('WebSocket connected for important event schedule updates');
          reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'schedule_update' || data.type === 'connected') {
              console.log('Important event schedule update received via WebSocket:', data);
              // スケジュールを再取得
              fetchImportantEventSchedules();
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
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            reconnectTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          } else {
            console.warn('Max reconnection attempts reached. Falling back to polling.');
            const interval = setInterval(() => {
              fetchImportantEventSchedules();
            }, 5 * 60 * 1000);
            return () => clearInterval(interval);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        const interval = setInterval(() => {
          fetchImportantEventSchedules();
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
  }, [isGoogleCalendarConnected]);

  // 最も差し迫った重要イベントを取得
  const getUpcomingImportantEvent = (): ImportantEventSchedule | null => {
    if (importantEventSchedules.length === 0) return null;
    return importantEventSchedules[0]; // 既にソート済みなので最初の要素
  };

  // 日時をフォーマット
  const formatImportantEventDateTime = (schedule: ImportantEventSchedule): string => {
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

  // Check Google Calendar connection status
  const checkGoogleCalendarStatus = async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setIsGoogleCalendarConnected(false);
        return;
      }

      const data = await response.json();
      setIsGoogleCalendarConnected(data.connected || false);
      
      if (data.connected) {
        console.log("Googleカレンダーに接続済み", {
          calendars: data.calendars_count,
          scopes: data.scopes
        });
        // Sync events when connected (will be called by useEffect)
      } else {
        console.log("Googleカレンダー未接続", data.error || "認証が必要です");
      }
    } catch (error) {
      console.error("接続状態確認エラー:", error);
      setIsGoogleCalendarConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    scheduleId: "",
    scheduleTitle: "",
    scheduleDate: "",
    scheduleTime: "",
    reminderTime: "02:00", // Default 2 hours before
    enabled: true,
  });

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    // Use local date components to match the format used in schedule.date
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter((s) => s.date === dateStr);
  };

  // Get schedules for a specific date and time range (for week view)
  // Only return schedules that START in this hour to avoid duplicates
  const getSchedulesForDateAndTime = (date: Date, hour: number) => {
    // Use local date components to match the format used in schedule.date
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter((s) => {
      if (s.date !== dateStr) return false;
      const [startHour] = s.startTime.split(":").map(Number);
      // Only show schedules that start in this hour
      return startHour === hour;
    });
  };

  // Handle schedule creation/update
  const handleScheduleSubmit = async () => {
    let updatedSchedules: Schedule[];
    let googleCalendarEventId: string | undefined;
    
    if (editingSchedule) {
      // Update existing schedule
      const updatedSchedule = { ...scheduleForm, id: editingSchedule.id };
      
      // Update Google Calendar event if connected and event ID exists
      if (isGoogleCalendarConnected && editingSchedule.googleCalendarEventId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/v1/google-calendar/events/${editingSchedule.googleCalendarEventId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: scheduleForm.title,
                date: scheduleForm.date,
                startTime: scheduleForm.startTime,
                endTime: scheduleForm.endTime,
                description: scheduleForm.description || undefined,
                type: scheduleForm.type,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.event?.id) {
              googleCalendarEventId = data.event.id;
              toast.success("Googleカレンダーのイベントを更新しました");
            } else {
              throw new Error("無効なレスポンス形式");
            }
          } else {
            const errorData = await response.json().catch(() => ({ detail: "更新に失敗しました" }));
            const errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : errorData.detail?.message || errorData.message || "更新に失敗しました";
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error("Googleカレンダー更新エラー:", error);
          const errorMessage = error instanceof Error ? error.message : "Googleカレンダーの更新に失敗しました";
          toast.warning(`${errorMessage}。ローカルスケジュールは更新されました。`);
          // Continue with local update even if Google Calendar update fails
          googleCalendarEventId = editingSchedule.googleCalendarEventId;
        }
      } else if (isGoogleCalendarConnected && !editingSchedule.googleCalendarEventId) {
        // Create new Google Calendar event for existing schedule that didn't have one
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: scheduleForm.title,
              date: scheduleForm.date,
              startTime: scheduleForm.startTime,
              endTime: scheduleForm.endTime,
              description: scheduleForm.description || undefined,
              type: scheduleForm.type,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.event?.id) {
              googleCalendarEventId = data.event.id;
              toast.success("Googleカレンダーにイベントを作成しました");
            } else {
              throw new Error("無効なレスポンス形式");
            }
          } else {
            const errorData = await response.json().catch(() => ({ detail: "作成に失敗しました" }));
            const errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : errorData.detail?.message || errorData.message || "作成に失敗しました";
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error("Googleカレンダー作成エラー:", error);
          const errorMessage = error instanceof Error ? error.message : "Googleカレンダーの作成に失敗しました";
          toast.warning(`${errorMessage}。ローカルスケジュールは更新されました。`);
        }
      }

      updatedSchedules = schedules.map((s) =>
        s.id === editingSchedule.id
          ? { 
              ...updatedSchedule, 
              googleCalendarEventId: googleCalendarEventId || s.googleCalendarEventId,
              fromGoogleCalendar: editingSchedule.fromGoogleCalendar || false
            }
          : s
      );
    } else {
      // Create new schedule
      const newSchedule: Schedule = {
        ...scheduleForm,
        id: Date.now().toString(),
        fromGoogleCalendar: false,
      };
      
      // Create Google Calendar event if connected
      if (isGoogleCalendarConnected) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: scheduleForm.title,
              date: scheduleForm.date,
              startTime: scheduleForm.startTime,
              endTime: scheduleForm.endTime,
              description: scheduleForm.description || undefined,
              type: scheduleForm.type,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.event?.id) {
              googleCalendarEventId = data.event.id;
              newSchedule.googleCalendarEventId = googleCalendarEventId;
              toast.success("Googleカレンダーにイベントを作成しました");
            } else {
              throw new Error("無効なレスポンス形式");
            }
          } else {
            const errorData = await response.json().catch(() => ({ detail: "作成に失敗しました" }));
            const errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : errorData.detail?.message || errorData.message || "作成に失敗しました";
            throw new Error(errorMessage);
          }
        } catch (error) {
          console.error("Googleカレンダー作成エラー:", error);
          const errorMessage = error instanceof Error ? error.message : "Googleカレンダーの作成に失敗しました";
          toast.warning(`${errorMessage}。ローカルスケジュールは作成されました。`);
        }
      }
      
      updatedSchedules = [...schedules, newSchedule];
    }
    
    setSchedules(updatedSchedules);
    
    // YouTubeライブ配信のスケジュールをローカルストレージに保存
    const streamSchedules = updatedSchedules
      .filter(s => s.type === "YouTubeライブ配信")
      .map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        description: s.description,
      }));
    
    try {
      localStorage.setItem('streamSchedules', JSON.stringify(streamSchedules));
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
    }
    
    setIsScheduleDialogOpen(false);
    setEditingSchedule(null);
    setScheduleForm({
      title: "",
      type: "YouTubeライブ配信",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
    });
  };


  // Handle reminder creation/update
  const handleReminderSubmit = () => {
    if (editingReminder) {
      setReminders(
        reminders.map((r) =>
          r.id === editingReminder.id
            ? { ...reminderForm, id: editingReminder.id }
            : r
        )
      );
    } else {
      const newReminder: Reminder = {
        ...reminderForm,
        id: Date.now().toString(),
      };
      setReminders([...reminders, newReminder]);
    }
    setIsReminderDialogOpen(false);
    setEditingReminder(null);
    setReminderForm({
      scheduleId: "",
      scheduleTitle: "",
      scheduleDate: "",
      scheduleTime: "",
      reminderTime: "02:00",
      enabled: true,
    });
  };

  // Handle delete
  const handleDeleteSchedule = async (id: string) => {
    const scheduleToDelete = schedules.find((s) => s.id === id);
    
    if (!scheduleToDelete) {
      toast.error("削除するスケジュールが見つかりません");
      return;
    }
    
    // Delete from Google Calendar if connected and event ID exists
    if (isGoogleCalendarConnected && scheduleToDelete.googleCalendarEventId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/google-calendar/events/${scheduleToDelete.googleCalendarEventId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (data.success !== false) {
            toast.success("Googleカレンダーからイベントを削除しました");
          } else {
            throw new Error(data.detail || "削除に失敗しました");
          }
        } else {
          const errorData = await response.json().catch(() => ({ detail: "削除に失敗しました" }));
          const errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : errorData.detail?.message || errorData.message || "削除に失敗しました";
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Googleカレンダー削除エラー:", error);
        const errorMessage = error instanceof Error ? error.message : "Googleカレンダーの削除に失敗しました";
        toast.warning(`${errorMessage}。ローカルスケジュールは削除されました。`);
      }
    }
    
    // Always delete from local schedules
    const updatedSchedules = schedules.filter((s) => s.id !== id);
    setSchedules(updatedSchedules);
    
    // ローカルストレージも更新
    const streamSchedules = updatedSchedules
      .filter(s => s.type === "YouTubeライブ配信")
      .map(s => ({
        id: s.id,
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        description: s.description,
      }));
    
    try {
      localStorage.setItem('streamSchedules', JSON.stringify(streamSchedules));
    } catch (error) {
      console.error('スケジュール削除エラー:', error);
    }
  };


  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  // Open edit dialogs
  const openEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      title: schedule.title,
      type: schedule.type,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      description: schedule.description || "",
    });
    setIsScheduleDialogOpen(true);
  };


  const openEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      scheduleId: reminder.scheduleId,
      scheduleTitle: reminder.scheduleTitle,
      scheduleDate: reminder.scheduleDate,
      scheduleTime: reminder.scheduleTime,
      reminderTime: reminder.reminderTime,
      enabled: reminder.enabled,
    });
    setIsReminderDialogOpen(true);
  };

  // Tab button handlers
  const handleTabClick = (value: string) => {
    setActiveTab(value);
    console.log(`タブ切り替え: ${value}`);
  };

  // Navigation handlers
  const handleWeekNavigation = (direction: "prev" | "next" | "today") => {
    if (direction === "prev") {
      setCurrentWeek(currentWeek - 1);
      console.log("前週へ移動");
    } else if (direction === "next") {
      setCurrentWeek(currentWeek + 1);
      console.log("次週へ移動");
    } else {
      setCurrentWeek(0);
      console.log("今週へ移動");
    }
  };

  const handleMonthNavigation = (direction: "prev" | "next" | "today") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
      console.log("前月へ移動");
    } else if (direction === "next") {
      newMonth.setMonth(newMonth.getMonth() + 1);
      console.log("次月へ移動");
    } else {
      newMonth.setTime(Date.now());
      console.log("今月へ移動");
    }
    setCurrentMonth(newMonth);
  };

  // Get month calendar days
  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const monthDays = getMonthDays();
  const weekDates = getWeekDates();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const weekDayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

  // Get schedules count for statistics
  const getScheduleStats = () => {
    const currentMonthSchedules = schedules.filter((s) => {
      const scheduleDate = new Date(s.date);
      return (
        scheduleDate.getMonth() === currentMonth.getMonth() &&
        scheduleDate.getFullYear() === currentMonth.getFullYear()
      );
    });
    return {
      streaming: currentMonthSchedules.filter((s) => s.type === "YouTubeライブ配信").length,
      posting: currentMonthSchedules.filter((s) => s.type === "X自動投稿").length,
      events: currentMonthSchedules.filter((s) => s.type === "重要イベント").length,
      others: currentMonthSchedules.filter((s) => s.type === "その他").length,
      total: currentMonthSchedules.length,
    };
  };

  const stats = getScheduleStats();

  // Google Calendar sync handlers
  const handleGoogleCalendarConnect = async () => {
    try {
      // Start OAuth flow
      const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/auth`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "認証開始に失敗しました" }));
        const errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : errorData.detail?.message || errorData.message || "認証開始に失敗しました";
        toast.error(errorMessage);
        console.error("認証開始エラー:", errorMessage);
        return;
      }

      const data = await response.json();
      
      if (data.authorization_url) {
        // Open authorization URL in new window
        window.location.href = data.authorization_url;
        toast.info("Google認証画面に移動します...");
        console.log("Googleカレンダー認証開始");
      } else {
        toast.error("認証URLの取得に失敗しました");
      }
    } catch (error) {
      console.error("Googleカレンダー接続エラー:", error);
      toast.error("Googleカレンダーへの接続に失敗しました");
    }
  };

  const handleGoogleCalendarSync = async () => {
    if (isSyncing) {
      return; // Prevent multiple simultaneous syncs
    }
    
    // Check connection status first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast.error("Googleカレンダーに接続されていません");
        setIsGoogleCalendarConnected(false);
        return;
      }

      const data = await response.json();
      
      if (!data.connected) {
        toast.error("Googleカレンダーに接続されていません");
        setIsGoogleCalendarConnected(false);
        return;
      }

      // Sync events from Google Calendar (syncGoogleCalendarEvents内でsetIsSyncingが管理される)
      await syncGoogleCalendarEvents();
      
      // Success message is shown in syncGoogleCalendarEvents
    } catch (error) {
      console.error("同期エラー:", error);
      toast.error("同期に失敗しました");
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">スケジューラー</h1>
          <p className="text-muted-foreground mt-2">
            配信スケジュールを管理し、Googleカレンダーと同期します
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 重要イベント通知アイコン（ドロップダウンメニュー） */}
          {isGoogleCalendarConnected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {importantEventSchedules.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                      {importantEventSchedules.length > 99 ? "99+" : importantEventSchedules.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>重要イベントスケジュール</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchImportantEventSchedules();
                    }}
                    disabled={isLoadingImportantEvents}
                    className="h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingImportantEvents ? 'animate-spin' : ''}`} />
                  </Button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoadingImportantEvents ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    読み込み中...
                  </div>
                ) : importantEventSchedules.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    3ヶ月以内の重要イベントはありません
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {importantEventSchedules.map((schedule) => (
                      <DropdownMenuItem
                        key={schedule.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => setIsImportantEventDialogOpen(true)}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            {schedule.id === getUpcomingImportantEvent()?.id && (
                              <Bell className="h-3 w-3 text-red-500" />
                            )}
                            <span className="font-semibold text-sm">{schedule.title}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatImportantEventDateTime(schedule)}</span>
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
          )}

          {/* 重要イベントスケジュール表示ボタン */}
          {isGoogleCalendarConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchImportantEventSchedules();
                setIsImportantEventDialogOpen(true);
              }}
              disabled={isLoadingImportantEvents}
              className="h-9 px-3"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              {isLoadingImportantEvents ? "読み込み中..." : "重要イベント表示"}
            </Button>
          )}

          {isCheckingConnection ? (
            <Button variant="outline" disabled>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              接続確認中...
            </Button>
          ) : isGoogleCalendarConnected ? (
            <>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <LinkIcon className="h-3 w-3 mr-1" />
                接続済み
              </Badge>
              <Button
                variant="outline"
                onClick={handleGoogleCalendarSync}
                disabled={isSyncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "同期中..." : "同期"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={handleGoogleCalendarConnect}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Googleカレンダーに接続
            </Button>
          )}
          <Button
            className="bg-primary hover:bg-primary-hover"
            onClick={() => {
              setEditingSchedule(null);
              setScheduleForm({
                title: "",
                type: "YouTubeライブ配信",
                date: "",
                startTime: "",
                endTime: "",
                description: "",
              });
              setIsScheduleDialogOpen(true);
              console.log("新規スケジュール作成ダイアログを開く");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            予定を作成
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabClick} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1.5 rounded-lg border border-border shadow-sm">
          <TabsTrigger
            value="week"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary data-[state=active]:font-semibold transition-all font-medium"
            onClick={() => handleTabClick("week")}
          >
            <CalendarDays className="h-4 w-4" />
            <span>週間</span>
          </TabsTrigger>
          <TabsTrigger
            value="month"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary data-[state=active]:font-semibold transition-all font-medium"
            onClick={() => handleTabClick("month")}
          >
            <CalendarRange className="h-4 w-4" />
            <span>月間</span>
          </TabsTrigger>

        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {weekDates[0].toLocaleDateString("ja-JP", {
                    month: "long",
                    year: "numeric",
                  })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekNavigation("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekNavigation("today")}
                  >
                    今週
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleWeekNavigation("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Google Calendar風の週間ビュー */}
              <div className="grid grid-cols-8 border-b-2 border-border">
                {/* 時間列ヘッダー */}
                <div className="border-r border-border p-3 bg-muted/30"></div>
                {/* 日付ヘッダー */}
                {weekDates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSunday = index === 0;
                  const isSaturday = index === 6;
                  return (
                    <div
                      key={index}
                      className={`border-r border-border last:border-r-0 p-3 text-center ${
                        isToday ? "bg-primary/10" : "bg-muted/20"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          isSunday
                            ? "text-red-600 dark:text-red-400"
                            : isSaturday
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {dayNames[index]}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isToday
                            ? "text-primary"
                            : isSunday
                            ? "text-red-600 dark:text-red-400"
                            : isSaturday
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-foreground"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
              {/* 時間軸グリッド */}
              <div className="grid grid-cols-8 border-b border-border">
                {Array.from({ length: 24 }, (_, hour) => (
                  <React.Fragment key={`hour-row-${hour}`}>
                    <div
                      key={`time-${hour}`}
                      className="border-r border-border p-2 text-sm font-medium text-muted-foreground text-right pr-3"
                    >
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    {weekDates.map((date, dayIndex) => {
                      const daySchedules = getSchedulesForDateAndTime(date, hour);
                      // Only show the first schedule if multiple schedules start at the same hour
                      const scheduleToShow = daySchedules.length > 0 ? daySchedules[0] : null;
                      
                      return (
                        <div
                          key={`cell-${hour}-${dayIndex}`}
                          className="border-r border-border last:border-r-0 border-b border-border min-h-[80px] relative p-2 hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() => {
                            // Use local date components to ensure correct date
                            const year = date.getFullYear();
                            const month = date.getMonth();
                            const day = date.getDate();
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            setScheduleForm({
                              title: "",
                              type: "YouTubeライブ配信",
                              date: dateStr,
                              startTime: `${hour.toString().padStart(2, "0")}:00`,
                              endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
                              description: "",
                            });
                            setIsScheduleDialogOpen(true);
                          }}
                        >
                          {scheduleToShow && (() => {
                            const [startHour, startMin] = scheduleToShow.startTime.split(":").map(Number);
                            const [endHour, endMin] = scheduleToShow.endTime.split(":").map(Number);
                            const startMinutes = startHour * 60 + startMin;
                            const endMinutes = endHour * 60 + endMin;
                            const duration = endMinutes - startMinutes;
                            const topOffset = startMin > 0 ? (startMin / 60) * 60 : 0;
                            const height = (duration / 60) * 60;

                            return (
                              <div
                                key={scheduleToShow.id}
                                className="absolute left-0 right-0 mx-1 rounded-md px-3 py-2 text-sm cursor-pointer hover:opacity-90 hover:shadow-md transition-all group"
                                style={{
                                  top: `${topOffset}px`,
                                  height: `${Math.max(height, 24)}px`,
                                  backgroundColor: getDefaultColor(scheduleToShow.type),
                                  color: "#fff",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditSchedule(scheduleToShow);
                                }}
                              >
                                <div className="font-semibold truncate mb-0.5">{scheduleToShow.title}</div>
                                <div className="text-xs opacity-90">
                                  {scheduleToShow.startTime} - {scheduleToShow.endTime}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          {/* Statistics at the top - Slightly larger */}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">配信予定</p>
                <p className="text-xl font-bold text-foreground">{stats.streaming}回</p>
                </div>
              </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="h-10 w-10 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">X自動投稿</p>
                <p className="text-xl font-bold text-foreground">{stats.posting}件</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="h-10 w-10 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarRange className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">重要イベント</p>
                <p className="text-xl font-bold text-foreground">{stats.events}件</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="h-10 w-10 rounded bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">その他</p>
                <p className="text-xl font-bold text-foreground">{stats.others}件</p>
              </div>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {currentMonth.toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                  })}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthNavigation("prev")}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthNavigation("today")}
                    className="h-8 px-3"
                  >
                    今月
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMonthNavigation("next")}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday headers - Japanese style with navy blue */}
                {dayNames.map((day, index) => {
                  const isSunday = index === 0;
                  return (
                    <div
                      key={index}
                      className={`text-center text-xs font-bold py-2.5 px-1 ${
                        isSunday
                          ? "bg-red-800/80 dark:bg-red-900/80 text-white"
                          : "bg-blue-800/80 dark:bg-blue-900/80 text-white"
                      }`}
                    >
                    {day}
                  </div>
                  );
                })}
                {/* Calendar days - Compact */}
                {monthDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-16" />;
                  }
                  const date = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  );
                  const daySchedules = getSchedulesForDate(date);
                  const importantEvents = daySchedules.filter(s => s.type === "重要イベント");
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  const dayOfWeek = date.getDay();
                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;
                  return (
                  <div
                    key={day}
                      className={`h-28 border border-border p-2 text-sm hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer relative ${
                        isToday
                          ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedDate(date);
                        setIsDayViewDialogOpen(true);
                        // Use local date components to ensure correct date
                        const year = date.getFullYear();
                        const month = date.getMonth();
                        const day = date.getDate();
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        console.log(`日付クリック: ${dateStr}`);
                      }}
                  >
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`font-semibold text-sm ${
                            isToday
                              ? "text-primary"
                              : isSunday
                                ? "text-red-600 dark:text-red-400"
                                : isSaturday
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-foreground"
                          }`}
                        >
                          {day}
                        </p>
                        {importantEvents.length > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold" title="重要イベント">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {daySchedules.slice(0, 3).map((schedule) => (
                          <div
                            key={schedule.id}
                            className="text-xs px-2 py-1 rounded-md truncate text-white font-medium leading-tight shadow-sm"
                            style={{
                              backgroundColor: getDefaultColor(schedule.type),
                            }}
                            title={`${schedule.startTime}-${schedule.endTime} ${schedule.title}`}
                          >
                            {schedule.startTime} {schedule.title}
                          </div>
                        ))}
                        {daySchedules.length > 3 && (
                          <div className="text-xs text-primary font-semibold pt-1">
                            +{daySchedules.length - 3}件
                          </div>
                        )}
                      </div>
                </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>


      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? "スケジュールを編集" : "新規スケジュールを作成"}
            </DialogTitle>
            <DialogDescription>
              配信や投稿のスケジュールを設定します
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schedule-title">タイトル</Label>
              <Input
                id="schedule-title"
                value={scheduleForm.title}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, title: e.target.value })
                }
                placeholder="例: 雑談配信"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-type">種類</Label>
              <Select
                value={scheduleForm.type}
                onValueChange={(value: ScheduleType) => {
                  setScheduleForm({ ...scheduleForm, type: value });
                }}
              >
                <SelectTrigger id="schedule-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YouTubeライブ配信">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: getDefaultColor("YouTubeライブ配信") }}
                      />
                      <span>YouTubeライブ配信</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="X自動投稿">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: getDefaultColor("X自動投稿") }}
                      />
                      <span>X自動投稿</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="重要イベント">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: getDefaultColor("重要イベント") }}
                      />
                      <span>重要イベント</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-date">日付</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleForm.date}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, date: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-start-time">開始時間</Label>
                <Input
                  id="schedule-start-time"
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-end-time">終了時間</Label>
                <Input
                  id="schedule-end-time"
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-description">説明（任意）</Label>
              <Textarea
                id="schedule-description"
                value={scheduleForm.description}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, description: e.target.value })
                }
                placeholder="スケジュールの詳細を入力..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsScheduleDialogOpen(false);
                setEditingSchedule(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={!scheduleForm.title || !scheduleForm.date || !scheduleForm.startTime || !scheduleForm.endTime}
            >
              {editingSchedule ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Day View Dialog */}
      <Dialog open={isDayViewDialogOpen} onOpenChange={setIsDayViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedDate
                ? selectedDate.toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })
                : ""}
            </DialogTitle>
            <DialogDescription>
              この日の予定を管理します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedDate && (
              <>
                {(() => {
                  const daySchedules = getSchedulesForDate(selectedDate);
                  const totalItems = daySchedules.length;
                  
                  return totalItems === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">この日には予定がありません</p>
                      <Button
                        onClick={() => {
                          // Use local date components to ensure correct date
                          const year = selectedDate.getFullYear();
                          const month = selectedDate.getMonth();
                          const day = selectedDate.getDate();
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setScheduleForm({
                            title: "",
                            type: "YouTubeライブ配信",
                            date: dateStr,
                            startTime: "",
                            endTime: "",
                            description: "",
                          });
                          setIsDayViewDialogOpen(false);
                          setIsScheduleDialogOpen(true);
                          console.log(`新規スケジュール作成: ${dateStr}`);
                        }}
                        className="bg-primary hover:bg-primary-hover"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新規予定を追加
                      </Button>
                    </div>
                  ) : (
                    <>
              <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          {daySchedules.length}件の予定
                        </p>
                      <Button
                        onClick={() => {
                          // Use local date components to ensure correct date
                          const year = selectedDate.getFullYear();
                          const month = selectedDate.getMonth();
                          const day = selectedDate.getDate();
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          setScheduleForm({
                            title: "",
                            type: "YouTubeライブ配信",
                            date: dateStr,
                              startTime: "",
                              endTime: "",
                              description: "",
                            });
                            setIsDayViewDialogOpen(false);
                            setIsScheduleDialogOpen(true);
                            console.log(`新規スケジュール作成: ${dateStr}`);
                          }}
                          size="sm"
                          className="bg-primary hover:bg-primary-hover"
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          予定を追加
                        </Button>
                </div>
                      <div className="space-y-3">
                        {/* Schedules */}
                        {daySchedules
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
                          >
                            <div
                              className="h-4 w-4 rounded-full mt-1 flex-shrink-0"
                              style={{
                                backgroundColor: getDefaultColor(schedule.type),
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-semibold">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {schedule.type}
                                </Badge>
                              </div>
                              <h3 className="font-medium text-base mb-1">{schedule.title}</h3>
                              {schedule.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {schedule.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  openEditSchedule(schedule);
                                  setIsDayViewDialogOpen(false);
                                  console.log(`スケジュール編集: ${schedule.id}`);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  handleDeleteSchedule(schedule.id);
                                  console.log(`スケジュール削除: ${schedule.id}`);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDayViewDialogOpen(false);
                setSelectedDate(null);
              }}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重要イベントスケジュール表示ダイアログ */}
      <Dialog open={isImportantEventDialogOpen} onOpenChange={setIsImportantEventDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-red-600" />
              重要イベントスケジュール（3ヶ月以内）
            </DialogTitle>
            <DialogDescription>
              Googleカレンダーから取得した重要イベントのスケジュール一覧（現在から3ヶ月以内）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingImportantEvents ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-muted-foreground">読み込み中...</span>
              </div>
            ) : importantEventSchedules.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">3ヶ月以内の重要イベントはありません</p>
                <Button
                  variant="outline"
                  onClick={fetchImportantEventSchedules}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再読み込み
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">
                    合計 {importantEventSchedules.length} 件の重要イベント
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchImportantEventSchedules}
                    disabled={isLoadingImportantEvents}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingImportantEvents ? 'animate-spin' : ''}`} />
                    更新
                  </Button>
                </div>
                <div className="space-y-3">
                  {importantEventSchedules.map((schedule) => {
                    const isUpcoming = schedule.id === getUpcomingImportantEvent()?.id;
                    return (
                      <div
                        key={schedule.id}
                        className={`p-4 rounded-lg border ${
                          isUpcoming
                            ? "border-red-500/50 bg-red-50 dark:bg-red-950/20"
                            : "border-border bg-card"
                        } hover:bg-accent/30 transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {isUpcoming && (
                                <Bell className="h-4 w-4 text-red-600 flex-shrink-0" />
                              )}
                              <h3 className="font-semibold text-base">{schedule.title}</h3>
                              {isUpcoming && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-300">
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
                                {formatImportantEventDateTime(schedule)}
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
              onClick={() => setIsImportantEventDialogOpen(false)}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Legend */}
      <Card className="border-border shadow-sm">
        <CardContent>
          <div className="grid grid-cols-1 mt-4 md:grid-cols-4 gap-3">
            {([
              { type: "YouTubeライブ配信", color: getDefaultColor("YouTubeライブ配信") },
              { type: "X自動投稿", color: getDefaultColor("X自動投稿") },
              { type: "重要イベント", color: getDefaultColor("重要イベント") },
              { type: "その他", color: getDefaultColor("その他") },
            ] as const).map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-foreground">{item.type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
