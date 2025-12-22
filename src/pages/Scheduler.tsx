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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type ScheduleType =
  | "YouTubeライブ配信"
  | "X自動投稿"
  | "重要イベント";

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

// 種類ごとの固定色マッピング
const getDefaultColor = (type: ScheduleType): string => {
  const colorMap: Record<ScheduleType, string> = {
    "YouTubeライブ配信": "#fbbf24", // 黄色
    "X自動投稿": "#3b82f6", // 青色
    "重要イベント": "#dc2626", // 赤色（目立つ色）
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

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      title: "雑談配信",
      type: "YouTubeライブ配信",
      date: "2025-12-07",
      startTime: "20:00",
      endTime: "22:00",
    },
    {
      id: "2",
      title: "ゲーム実況",
      type: "YouTubeライブ配信",
      date: "2025-12-08",
      startTime: "21:00",
      endTime: "23:00",
    },
    {
      id: "3",
      title: "X自動投稿",
      type: "X自動投稿",
      date: "2025-12-07",
      startTime: "12:00",
      endTime: "12:30",
    },
    {
      id: "4",
      title: "1周年記念配信",
      type: "重要イベント",
      date: "2026-03-15",
      startTime: "19:00",
      endTime: "21:00",
    },
  ]);

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
  const syncGoogleCalendarEvents = async (forceFullSync: boolean = false) => {
    if (!isGoogleCalendarConnected) {
      return;
    }

    try {
      // Calculate time range based on current view
      // For full sync (polling), get a wider range to catch all events
      const now = new Date();
      let timeMin: Date;
      let timeMax: Date;

      if (forceFullSync) {
        // For polling, sync a wider range (current week ± 2 weeks) to catch all relevant events
        const weekDates = getWeekDates();
        const baseStart = new Date(weekDates[0]);
        baseStart.setHours(0, 0, 0, 0);
        const baseEnd = new Date(weekDates[6]);
        baseEnd.setHours(23, 59, 59, 999);
        
        // Extend range by 2 weeks before and after
        timeMin = new Date(baseStart);
        timeMin.setDate(timeMin.getDate() - 14);
        timeMax = new Date(baseEnd);
        timeMax.setDate(timeMax.getDate() + 14);
      } else if (activeTab === "week") {
        // Get current week range
        const weekDates = getWeekDates();
        timeMin = new Date(weekDates[0]);
        timeMin.setHours(0, 0, 0, 0);
        timeMax = new Date(weekDates[6]);
        timeMax.setHours(23, 59, 59, 999);
      } else {
        // Get current month range
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        timeMin = new Date(year, month, 1);
        timeMax = new Date(year, month + 1, 0, 23, 59, 59, 999);
      }

      // Format dates for API
      const timeMinStr = timeMin.toISOString();
      const timeMaxStr = timeMax.toISOString();

      // Fetch events from Google Calendar
      const response = await fetch(
        `${API_BASE_URL}/api/v1/google-calendar/events?time_min=${encodeURIComponent(timeMinStr)}&time_max=${encodeURIComponent(timeMaxStr)}&max_results=250`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Googleカレンダーイベント取得エラー:", response.status);
        return;
      }

      const data = await response.json();
      
      if (!data.success || !data.events) {
        console.error("Googleカレンダーイベント取得エラー:", data);
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
        
        
        // Extract type from event (from description or use colorId as fallback)
        let type: ScheduleType = "重要イベント";
        
        // First, try to get type from event.type (extracted from description)
        if (event.type && ["YouTubeライブ配信", "X自動投稿", "重要イベント"].includes(event.type)) {
          type = event.type as ScheduleType;
        } else {
          // Fallback: determine type from description or title
          const description = event.description || "";
          const titleLower = (event.summary || "").toLowerCase();
          
          // Check description for type prefix
          const typeMatch = description.match(/\[種類: (.+?)\]/);
          if (typeMatch && ["YouTubeライブ配信", "X自動投稿", "重要イベント"].includes(typeMatch[1])) {
            type = typeMatch[1] as ScheduleType;
          } else if (titleLower.includes("配信") || titleLower.includes("ライブ") || titleLower.includes("stream")) {
            type = "YouTubeライブ配信";
          } else if (titleLower.includes("投稿") || titleLower.includes("post") || titleLower.includes("tweet")) {
            type = "X自動投稿";
          }
        }
        
        // Clean description (remove type prefix)
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

      // Merge with existing schedules using functional update to get latest state
      setSchedules(prevSchedules => {
        // Strategy: Keep all local schedules, update/add Google Calendar schedules for current period
        // Remove old Google Calendar schedules from the current period only
        // Use local date components to ensure correct date comparison
        const periodStartYear = timeMin.getFullYear();
        const periodStartMonth = timeMin.getMonth();
        const periodStartDay = timeMin.getDate();
        const currentPeriodStart = `${periodStartYear}-${String(periodStartMonth + 1).padStart(2, '0')}-${String(periodStartDay).padStart(2, '0')}`;
        
        const periodEndYear = timeMax.getFullYear();
        const periodEndMonth = timeMax.getMonth();
        const periodEndDay = timeMax.getDate();
        const currentPeriodEnd = `${periodEndYear}-${String(periodEndMonth + 1).padStart(2, '0')}-${String(periodEndDay).padStart(2, '0')}`;
        
        console.log('同期処理開始:', {
          currentPeriodStart,
          currentPeriodEnd,
          prevSchedulesCount: prevSchedules.length,
          googleCalendarSchedulesCount: googleCalendarSchedules.length
        });
        
        // Keep ALL local schedules (not from Google Calendar) - never remove them
        const localSchedules = prevSchedules.filter(s => !s.fromGoogleCalendar);
        console.log('ローカルスケジュール:', localSchedules.length, '件');
        
        // Remove Google Calendar schedules that are in the current period (will be replaced with fresh data)
        const otherPeriodGoogleSchedules = prevSchedules.filter(s => {
          if (!s.fromGoogleCalendar) return false;
          // Keep Google Calendar schedules outside current period
          const isOutsidePeriod = s.date < currentPeriodStart || s.date > currentPeriodEnd;
          return isOutsidePeriod;
        });
        console.log('期間外のGoogleカレンダースケジュール:', otherPeriodGoogleSchedules.length, '件');
        
        // Combine: local schedules + Google Calendar schedules from other periods + new Google Calendar schedules
        const mergedSchedules = [...localSchedules, ...otherPeriodGoogleSchedules, ...googleCalendarSchedules];
        console.log('マージ後のスケジュール:', mergedSchedules.length, '件');

        // Remove duplicates (same googleCalendarEventId or same id) - prefer newer Google Calendar version
        const uniqueSchedules = mergedSchedules.reduce((acc: Schedule[], current: Schedule) => {
          // Check for duplicate by googleCalendarEventId (if both have it)
          if (current.googleCalendarEventId) {
            const existingIndex = acc.findIndex(
              s => s.googleCalendarEventId === current.googleCalendarEventId && s.googleCalendarEventId
            );
            if (existingIndex !== -1) {
              // If both have googleCalendarEventId, prefer the newer one (from current sync)
              if (current.fromGoogleCalendar && acc[existingIndex].fromGoogleCalendar) {
                acc[existingIndex] = current;
              } else if (!acc[existingIndex].fromGoogleCalendar && current.fromGoogleCalendar) {
                // Keep local version if it exists - NEVER replace local with Google Calendar
                // Do nothing, keep the existing local schedule
              }
              return acc;
            }
          }
          
          // Check for duplicate by id (for local schedules without googleCalendarEventId)
          const existingByIdIndex = acc.findIndex(s => s.id === current.id);
          if (existingByIdIndex !== -1) {
            // If same id exists, keep the local version (never replace local with Google Calendar)
            if (!acc[existingByIdIndex].fromGoogleCalendar && current.fromGoogleCalendar) {
              // Keep existing local schedule, don't replace with Google Calendar version
              return acc;
            } else if (acc[existingByIdIndex].fromGoogleCalendar && !current.fromGoogleCalendar) {
              // Replace Google Calendar version with local version
              acc[existingByIdIndex] = current;
              return acc;
            }
          }
          
          // No duplicate found, add to accumulator
          acc.push(current);
          return acc;
        }, []);

        console.log('最終的なスケジュール:', uniqueSchedules.length, '件');
        console.log('ローカルスケジュール保持確認:', uniqueSchedules.filter(s => !s.fromGoogleCalendar).length, '件');
        
        return uniqueSchedules;
      });
      
      console.log(`Googleカレンダーから${googleCalendarSchedules.length}件のイベントを同期しました`);
    } catch (error) {
      console.error("Googleカレンダー同期エラー:", error);
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

  // Sync Google Calendar events when connected or view changes
  useEffect(() => {
    if (isGoogleCalendarConnected) {
      // Use a small delay to ensure state is stable before syncing
      // This prevents race conditions when rapidly changing weeks
      const timeoutId = setTimeout(() => {
        syncGoogleCalendarEvents();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isGoogleCalendarConnected, currentWeek, currentMonth, activeTab]);

  // Real-time sync: Poll Google Calendar for changes every 10 seconds when connected
  useEffect(() => {
    if (!isGoogleCalendarConnected) {
      return;
    }

    // Initial sync with full range
    syncGoogleCalendarEvents(true);

    // Set up polling interval for real-time sync
    const pollInterval = setInterval(() => {
      syncGoogleCalendarEvents(true); // Use full sync for polling
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [isGoogleCalendarConnected]);

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
            googleCalendarEventId = data.event?.id || editingSchedule.googleCalendarEventId;
            toast.success("Googleカレンダーのイベントを更新しました");
          } else {
            const errorData = await response.json().catch(() => ({ detail: "更新に失敗しました" }));
            toast.warning(`Googleカレンダーの更新に失敗: ${errorData.detail || "エラーが発生しました"}`);
            // Continue with local update even if Google Calendar update fails
            googleCalendarEventId = editingSchedule.googleCalendarEventId;
          }
        } catch (error) {
          console.error("Googleカレンダー更新エラー:", error);
          toast.warning("Googleカレンダーの更新に失敗しましたが、ローカルスケジュールは更新されました");
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
            googleCalendarEventId = data.event?.id;
            toast.success("Googleカレンダーにイベントを作成しました");
          } else {
            const errorData = await response.json().catch(() => ({ detail: "作成に失敗しました" }));
            toast.warning(`Googleカレンダーの作成に失敗: ${errorData.detail || "エラーが発生しました"}`);
          }
        } catch (error) {
          console.error("Googleカレンダー作成エラー:", error);
          toast.warning("Googleカレンダーの作成に失敗しましたが、ローカルスケジュールは更新されました");
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
            }),
          });

          if (response.ok) {
            const data = await response.json();
            googleCalendarEventId = data.event?.id;
            newSchedule.googleCalendarEventId = googleCalendarEventId;
            toast.success("Googleカレンダーにイベントを作成しました");
          } else {
            const errorData = await response.json().catch(() => ({ detail: "作成に失敗しました" }));
            toast.warning(`Googleカレンダーの作成に失敗: ${errorData.detail || "エラーが発生しました"}`);
          }
        } catch (error) {
          console.error("Googleカレンダー作成エラー:", error);
          toast.warning("Googleカレンダーの作成に失敗しましたが、ローカルスケジュールは作成されました");
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
    
    // Delete from Google Calendar if connected and event ID exists
    if (isGoogleCalendarConnected && scheduleToDelete?.googleCalendarEventId) {
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
          toast.success("Googleカレンダーからイベントを削除しました");
        } else {
          const errorData = await response.json().catch(() => ({ detail: "削除に失敗しました" }));
          toast.warning(`Googleカレンダーの削除に失敗: ${errorData.detail || "エラーが発生しました"}`);
        }
      } catch (error) {
        console.error("Googleカレンダー削除エラー:", error);
        toast.warning("Googleカレンダーの削除に失敗しましたが、ローカルスケジュールは削除されました");
      }
    }
    
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
    setIsSyncing(true);
    try {
      // Check connection status first
      const response = await fetch(`${API_BASE_URL}/api/v1/google-calendar/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        toast.error("Googleカレンダーに接続されていません");
        setIsSyncing(false);
        return;
      }

      const data = await response.json();
      
      if (!data.connected) {
        toast.error("Googleカレンダーに接続されていません");
        setIsGoogleCalendarConnected(false);
        setIsSyncing(false);
        return;
      }

      // Sync events from Google Calendar
      await syncGoogleCalendarEvents();
      
      toast.success("Googleカレンダーと同期が完了しました");
      setIsSyncing(false);
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
              <div className="grid grid-cols-8 border-b border-border">
                {/* 時間列ヘッダー */}
                <div className="border-r border-border p-2"></div>
                {/* 日付ヘッダー */}
                {weekDates.map((date, index) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSunday = index === 0;
                  const isSaturday = index === 6;
                  return (
                    <div
                      key={index}
                      className={`border-r border-border last:border-r-0 p-2 text-center ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <p
                        className={`text-xs font-medium ${
                          isSunday
                            ? "text-red-600 dark:text-red-400"
                            : isSaturday
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      >
                        {dayNames[index]}
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          isToday
                            ? "text-primary"
                            : isSunday
                            ? "text-red-600 dark:text-red-400"
                            : isSaturday
                            ? "text-blue-600 dark:text-blue-400"
                            : ""
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
                      className="border-r border-border p-1 text-xs text-muted-foreground text-right pr-2"
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
                          className="border-r border-border last:border-r-0 border-b border-border min-h-[60px] relative p-1"
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
                                className="absolute left-0 right-0 mx-1 rounded px-2 py-1 text-xs cursor-pointer hover:opacity-80 transition-opacity group"
                                style={{
                                  top: `${topOffset}px`,
                                  height: `${Math.max(height, 20)}px`,
                                  backgroundColor: getDefaultColor(scheduleToShow.type),
                                  color: "#fff",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditSchedule(scheduleToShow);
                                }}
                              >
                                <div className="font-medium truncate">{scheduleToShow.title}</div>
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
          <div className="grid gap-3 md:grid-cols-3">
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
              <div className="h-10 w-10 rounded bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <CalendarRange className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">重要イベント</p>
                <p className="text-xl font-bold text-foreground">{stats.events}件</p>
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
                      className={`h-20 border border-border p-1 text-xs hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer relative ${
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
                      <div className="space-y-0.5 overflow-hidden">
                        {daySchedules.slice(0, 3).map((schedule) => (
                          <div
                            key={schedule.id}
                            className="text-[8px] px-1 py-0.5 rounded truncate text-white font-medium leading-tight"
                            style={{
                              backgroundColor: getDefaultColor(schedule.type),
                            }}
                            title={`${schedule.startTime}-${schedule.endTime} ${schedule.title}`}
                          >
                            {schedule.startTime} {schedule.title}
                          </div>
                        ))}
                        {daySchedules.length > 3 && (
                          <div className="text-[10px] text-primary font-bold">
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

      {/* Color Legend */}
      <Card className="border-border shadow-sm">
        <CardContent>
          <div className="grid grid-cols-1 mt-4 md:grid-cols-3 gap-3">
            {([
              { type: "YouTubeライブ配信", color: getDefaultColor("YouTubeライブ配信") },
              { type: "X自動投稿", color: getDefaultColor("X自動投稿") },
              { type: "重要イベント", color: getDefaultColor("重要イベント") },
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
