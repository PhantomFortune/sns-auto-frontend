import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  X,
  SortAsc,
  SortDesc,
  Calendar,
  HardDrive,
  Loader2,
  Edit,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

interface ReportFile {
  id: string;
  category: "report";
  report_type: "youtube_analytics" | "x_analytics" | null;
  file_name: string;
  file_path: string;
  file_size: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  image_path: string | null;
  scheduled_datetime: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function FileManagement() {
  // データ状態
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // UI状態
  const [activeTab, setActiveTab] = useState("reports");
  const [reportSubTab, setReportSubTab] = useState<"all" | "youtube" | "x">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // ダイアログ状態
  const [selectedReport, setSelectedReport] = useState<ReportFile | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string; type: "report" | "post" } | null>(null);

  // 編集フォーム状態
  const [editPostForm, setEditPostForm] = useState({
    content: "",
    scheduledTime: "",
    imageUrl: "",
  });

  // レポート取得
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/files?category=report`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("レポートの取得に失敗しました");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.files)) {
        setReports(data.files);
      }
    } catch (error) {
      console.error("レポート取得エラー:", error);
      toast.error("レポートの取得に失敗しました");
    } finally {
      setIsLoadingReports(false);
    }
  };

  // 予約投稿取得
  const fetchScheduledPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/scheduled-posts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("予約投稿の取得に失敗しました");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.posts)) {
        setScheduledPosts(data.posts);
      }
    } catch (error) {
      console.error("予約投稿取得エラー:", error);
      toast.error("予約投稿の取得に失敗しました");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchReports();
    fetchScheduledPosts();
  }, []);

  // レポートフィルタリング
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // サブタブによるフィルタリング
    if (reportSubTab === "youtube") {
      filtered = filtered.filter((r) => r.report_type === "youtube_analytics");
    } else if (reportSubTab === "x") {
      filtered = filtered.filter((r) => r.report_type === "x_analytics");
    }

    // 検索クエリによるフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.file_name.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.file_name.localeCompare(b.file_name, "ja");
          break;
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "size":
          comparison = a.file_size - b.file_size;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [reports, reportSubTab, searchQuery, sortBy, sortOrder]);

  // 予約投稿フィルタリング
  const filteredPosts = useMemo(() => {
    let filtered = scheduledPosts;

    // 検索クエリによるフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.content.toLowerCase().includes(query));
    }

    // ソート（予約日時順）
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.scheduled_datetime).getTime();
      const dateB = new Date(b.scheduled_datetime).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }, [scheduledPosts, searchQuery, sortOrder]);

  // ファイルサイズフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // 日時フォーマット
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ファイルダウンロード
  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/files/${fileId}/download`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("ダウンロードに失敗しました");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`「${fileName}」をダウンロードしました`);
    } catch (error) {
      console.error("ダウンロードエラー:", error);
      toast.error("ファイルのダウンロードに失敗しました");
    }
  };

  // レポート削除
  const handleDeleteReport = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      toast.success("レポートを削除しました");
      fetchReports();
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("削除エラー:", error);
      toast.error("レポートの削除に失敗しました");
    }
  };

  // 予約投稿削除
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/storage/scheduled-posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      toast.success("予約投稿を削除しました");
      fetchScheduledPosts();
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("削除エラー:", error);
      toast.error("予約投稿の削除に失敗しました");
    }
  };

  // 予約投稿編集
  const handleOpenEditDialog = (post: ScheduledPost) => {
    setSelectedPost(post);
    const scheduledDate = new Date(post.scheduled_datetime);
    const dateStr = scheduledDate.toISOString().split('T')[0];
    const timeStr = scheduledDate.toTimeString().slice(0, 5);
    setEditPostForm({
      content: post.content,
      scheduledTime: `${dateStr}T${timeStr}`,
      imageUrl: post.image_path
        ? `${API_BASE_URL}/api/v1/storage/scheduled-posts/${post.id}/image?t=${new Date(post.updated_at).getTime()}`
        : "",
    });
    setIsEditPostDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPost) return;

    try {
      const scheduledDateTime = new Date(editPostForm.scheduledTime);
      const updateData: any = {
        content: editPostForm.content,
        scheduled_datetime: scheduledDateTime.toISOString(),
      };

      // 新しい画像が選択された場合のみ更新
      if (editPostForm.imageUrl && editPostForm.imageUrl.startsWith('data:')) {
        updateData.image_base64 = editPostForm.imageUrl;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/storage/scheduled-posts/${selectedPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      toast.success("予約投稿を更新しました");
      setIsEditPostDialogOpen(false);
      setSelectedPost(null);
      fetchScheduledPosts();
    } catch (error) {
      console.error("更新エラー:", error);
      toast.error("予約投稿の更新に失敗しました");
    }
  };

  const handleEditImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPostForm({ ...editPostForm, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // ストレージ使用状況の計算
  const storageStats = useMemo(() => {
    const totalBytes = reports.reduce((sum, r) => sum + r.file_size, 0) +
      scheduledPosts.reduce((sum, p) => {
        // 画像サイズは正確に取得できないため、おおよその推定値を使用
        return sum;
      }, 0);

    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const maxGB = 120;
    const percentage = (totalGB / maxGB) * 100;

    const byType = {
      youtube: reports
        .filter((r) => r.report_type === "youtube_analytics")
        .reduce((sum, r) => sum + r.file_size, 0),
      x: reports
        .filter((r) => r.report_type === "x_analytics")
        .reduce((sum, r) => sum + r.file_size, 0),
      posts: scheduledPosts.length,
    };

    return {
      total: totalGB,
      max: maxGB,
      percentage: Math.min(percentage, 100),
      byType: {
        youtube: byType.youtube / (1024 * 1024),
        x: byType.x / (1024 * 1024),
        posts: byType.posts,
      },
    };
  }, [reports, scheduledPosts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ファイル管理</h1>
          <p className="text-muted-foreground mt-2">
            ストレージ内のファイルを一元管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ファイルを検索..."
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              レポート登録簿
            </TabsTrigger>
            <TabsTrigger value="posts">
              <ImageIcon className="h-4 w-4 mr-2" />
              X投稿登録簿
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {activeTab === "reports"
                ? filteredReports.length
                : filteredPosts.length}
              件
            </span>
            <div className="flex gap-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortBy("name");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
                className={sortBy === "name" ? "bg-muted" : ""}
              >
                {sortBy === "name" && sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortBy("date");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
                className={sortBy === "date" ? "bg-muted" : ""}
              >
                {sortBy === "date" && sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
              {activeTab === "reports" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy("size");
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                  className={sortBy === "size" ? "bg-muted" : ""}
                >
                  {sortBy === "size" && sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* レポート登録簿 */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">レポート登録簿</CardTitle>
                <TabsList>
                  <TabsTrigger
                    value="all"
                    onClick={() => setReportSubTab("all")}
                    className={reportSubTab === "all" ? "bg-muted" : ""}
                  >
                    すべて
                  </TabsTrigger>
                  <TabsTrigger
                    value="youtube"
                    onClick={() => setReportSubTab("youtube")}
                    className={reportSubTab === "youtube" ? "bg-muted" : ""}
                  >
                    YouTube分析
                  </TabsTrigger>
                  <TabsTrigger
                    value="x"
                    onClick={() => setReportSubTab("x")}
                    className={reportSubTab === "x" ? "bg-muted" : ""}
                  >
                    X分析
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingReports ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">レポートを読み込み中...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    レポートが見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{report.file_name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {report.report_type === "youtube_analytics"
                                ? "YouTube分析"
                                : report.report_type === "x_analytics"
                                ? "X分析"
                                : "レポート"}
                            </Badge>
                            <span>{formatFileSize(report.file_size)}</span>
                            <span>{formatDateTime(report.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsPreviewDialogOpen(true);
                          }}
                          title="詳細"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(report.id, report.file_name)}
                          title="ダウンロード"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setFileToDelete({ id: report.id, name: report.file_name, type: "report" });
                            setIsDeleteDialogOpen(true);
                          }}
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* X投稿登録簿 */}
        <TabsContent value="posts" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">X投稿登録簿</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">予約投稿を読み込み中...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    予約投稿が見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start justify-between border-b border-border last:border-0 pb-4 last:pb-0 group hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              post.status === "posted"
                                ? "default"
                                : post.status === "pending"
                                ? "outline"
                                : "secondary"
                            }
                            className={
                              post.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
                                : ""
                            }
                          >
                            {post.status === "pending"
                              ? "予約済み"
                              : post.status === "posted"
                              ? "投稿済み"
                              : post.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2 whitespace-pre-wrap break-words">{post.content}</p>
                        {post.image_path && (
                          <div className="mb-2">
                            <img
                              src={`${API_BASE_URL}/api/v1/storage/scheduled-posts/${post.id}/image?t=${new Date(post.updated_at).getTime()}`}
                              alt="投稿画像"
                              className="w-32 h-32 object-cover rounded-lg border border-border"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(post.scheduled_datetime)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            setFileToDelete({ id: post.id, name: post.content.substring(0, 30) + "...", type: "post" });
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ストレージ使用状況 */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            ストレージ使用状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>使用容量</span>
                <span className="font-medium">
                  {storageStats.total.toFixed(2)} GB / {storageStats.max} GB
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all"
                  style={{ width: `${storageStats.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {storageStats.percentage.toFixed(1)}% 使用中
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">YouTube分析レポート</p>
                <p className="text-lg font-bold">
                  {storageStats.byType.youtube.toFixed(1)} MB
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">X分析レポート</p>
                <p className="text-lg font-bold">
                  {storageStats.byType.x.toFixed(1)} MB
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-1">予約投稿</p>
                <p className="text-lg font-bold">
                  {storageStats.byType.posts} 件
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* レポート詳細ダイアログ */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.file_name}</DialogTitle>
            <DialogDescription>レポートの詳細情報</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{selectedReport.file_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge variant="secondary">
                      {selectedReport.report_type === "youtube_analytics"
                        ? "YouTube分析"
                        : selectedReport.report_type === "x_analytics"
                        ? "X分析"
                        : "レポート"}
                    </Badge>
                    <span>{formatFileSize(selectedReport.file_size)}</span>
                    <span>{formatDateTime(selectedReport.created_at)}</span>
                  </div>
                </div>
              </div>
              {selectedReport.description && (
                <div>
                  <Label>説明</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedReport.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              閉じる
            </Button>
            {selectedReport && (
              <Button
                onClick={() => {
                  handleDownloadFile(selectedReport.id, selectedReport.file_name);
                  setIsPreviewDialogOpen(false);
                }}
                className="bg-primary hover:bg-primary-hover"
              >
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>削除確認</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。ファイルが完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          {fileToDelete && (
            <div className="py-4">
              <p className="font-medium">{fileToDelete.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fileToDelete.type === "report" ? "レポート" : "予約投稿"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setFileToDelete(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (fileToDelete) {
                  if (fileToDelete.type === "report") {
                    handleDeleteReport(fileToDelete.id);
                  } else {
                    handleDeletePost(fileToDelete.id);
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 予約投稿編集ダイアログ */}
      <Dialog open={isEditPostDialogOpen} onOpenChange={setIsEditPostDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>予約投稿を編集</DialogTitle>
            <DialogDescription>投稿内容と予約日時を変更できます</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-content">投稿内容</Label>
              <Textarea
                id="edit-content"
                value={editPostForm.content}
                onChange={(e) =>
                  setEditPostForm({ ...editPostForm, content: e.target.value })
                }
                className="mt-1 min-h-[100px]"
                placeholder="投稿内容を入力..."
              />
            </div>
            <div>
              <Label htmlFor="edit-scheduled-time">予約日時</Label>
              <Input
                id="edit-scheduled-time"
                type="datetime-local"
                value={editPostForm.scheduledTime}
                onChange={(e) =>
                  setEditPostForm({ ...editPostForm, scheduledTime: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-image">画像</Label>
              {editPostForm.imageUrl && !editPostForm.imageUrl.startsWith('data:') && (
                <div className="mt-2 mb-2">
                  <img
                    src={editPostForm.imageUrl}
                    alt="現在の画像"
                    className="w-32 h-32 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
              {editPostForm.imageUrl && editPostForm.imageUrl.startsWith('data:') && (
                <div className="mt-2 mb-2">
                  <img
                    src={editPostForm.imageUrl}
                    alt="新しい画像"
                    className="w-32 h-32 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleEditImageSelect}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                新しい画像を選択すると既存の画像が置き換えられます
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPostDialogOpen(false);
                setSelectedPost(null);
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary-hover">
              <Edit className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
