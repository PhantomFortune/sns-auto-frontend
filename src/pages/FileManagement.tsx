import { useState, useMemo } from "react";
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
  Video,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  X,
  Upload,
  SortAsc,
  SortDesc,
  Calendar,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  id: string;
  name: string;
  type: "レポート" | "画像" | "動画";
  size: string;
  sizeBytes: number; // バイト単位でのサイズ（計算用）
  date: string;
  dateTimestamp: number; // ソート用
  duration?: string;
  path?: string;
  icon: typeof FileText | typeof ImageIcon | typeof Video;
}

export default function FileManagement() {
  // ファイルデータ
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "YouTube分析レポート_2025-11.xlsx",
      type: "レポート",
      size: "2.4 MB",
      sizeBytes: 2516582,
      date: "2時間前",
      dateTimestamp: Date.now() - 2 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "2",
      name: "X投稿用画像_朝の挨拶.png",
      type: "画像",
      size: "1.2 MB",
      sizeBytes: 1258291,
      date: "5時間前",
      dateTimestamp: Date.now() - 5 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "3",
      name: "配信ハイライト_2025-11-22.mp4",
      type: "動画",
      size: "45.6 MB",
      sizeBytes: 47815065,
      date: "1日前",
      dateTimestamp: Date.now() - 24 * 60 * 60 * 1000,
      duration: "3:24",
      icon: Video,
    },
    {
      id: "4",
      name: "月間トレンド分析.pdf",
      type: "レポート",
      size: "856 KB",
      sizeBytes: 876544,
      date: "1日前",
      dateTimestamp: Date.now() - 24 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "5",
      name: "サムネイル案_ゲーム実況.png",
      type: "画像",
      size: "3.1 MB",
      sizeBytes: 3250585,
      date: "2日前",
      dateTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "6",
      name: "YouTube月次レポート_2025-11.xlsx",
      type: "レポート",
      size: "2.4 MB",
      sizeBytes: 2516582,
      date: "2時間前",
      dateTimestamp: Date.now() - 2 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "7",
      name: "X週次分析_2025-W47.pdf",
      type: "レポート",
      size: "1.1 MB",
      sizeBytes: 1153433,
      date: "3日前",
      dateTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "8",
      name: "配信パフォーマンス分析_Q4.xlsx",
      type: "レポート",
      size: "3.2 MB",
      sizeBytes: 3355443,
      date: "1週間前",
      dateTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "9",
      name: "視聴者層分析レポート.pdf",
      type: "レポート",
      size: "856 KB",
      sizeBytes: 876544,
      date: "2週間前",
      dateTimestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
      icon: FileText,
    },
    {
      id: "10",
      name: "X投稿用_朝の挨拶.png",
      type: "画像",
      size: "1.2 MB",
      sizeBytes: 1258291,
      date: "5時間前",
      dateTimestamp: Date.now() - 5 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "11",
      name: "サムネイル_ゲーム実況.png",
      type: "画像",
      size: "2.8 MB",
      sizeBytes: 2936012,
      date: "1日前",
      dateTimestamp: Date.now() - 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "12",
      name: "配信告知画像.png",
      type: "画像",
      size: "1.5 MB",
      sizeBytes: 1572864,
      date: "2日前",
      dateTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "13",
      name: "記念画像_1000人達成.png",
      type: "画像",
      size: "3.5 MB",
      sizeBytes: 3670016,
      date: "3日前",
      dateTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "14",
      name: "おはようVTuber画像.png",
      type: "画像",
      size: "1.8 MB",
      sizeBytes: 1887436,
      date: "4日前",
      dateTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "15",
      name: "コラボ告知画像.png",
      type: "画像",
      size: "2.1 MB",
      sizeBytes: 2202009,
      date: "5日前",
      dateTimestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      icon: ImageIcon,
    },
    {
      id: "16",
      name: "Shorts_ゲーム実況切り抜き.mp4",
      type: "動画",
      size: "12.3 MB",
      sizeBytes: 12897484,
      date: "2日前",
      dateTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      duration: "0:30",
      icon: Video,
    },
    {
      id: "17",
      name: "配信アーカイブ_2025-11-20.mp4",
      type: "動画",
      size: "1.2 GB",
      sizeBytes: 1288490188,
      date: "3日前",
      dateTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      duration: "2:15:34",
      icon: Video,
    },
  ]);

  // UI状態
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // フィルター状態
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");

  // フィルタリングとソート
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // タブによるフィルタリング
    if (activeTab !== "all") {
      const typeMap: { [key: string]: FileItem["type"] } = {
        reports: "レポート",
        images: "画像",
        videos: "動画",
      };
      filtered = filtered.filter((file) => file.type === typeMap[activeTab]);
    }

    // 検索クエリによるフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(query) ||
          file.type.toLowerCase().includes(query) ||
          file.size.toLowerCase().includes(query) ||
          file.date.toLowerCase().includes(query)
      );
    }

    // 追加フィルター
    if (filterType !== "all") {
      filtered = filtered.filter((file) => file.type === filterType);
    }

    if (filterSize !== "all") {
      filtered = filtered.filter((file) => {
        const sizeMB = file.sizeBytes / (1024 * 1024);
        switch (filterSize) {
          case "small":
            return sizeMB < 1;
          case "medium":
            return sizeMB >= 1 && sizeMB < 10;
          case "large":
            return sizeMB >= 10 && sizeMB < 100;
          case "xlarge":
            return sizeMB >= 100;
          default:
            return true;
        }
      });
    }

    if (filterDate !== "all") {
      const now = Date.now();
      filtered = filtered.filter((file) => {
        const daysAgo = (now - file.dateTimestamp) / (24 * 60 * 60 * 1000);
        switch (filterDate) {
          case "today":
            return daysAgo < 1;
          case "week":
            return daysAgo < 7;
          case "month":
            return daysAgo < 30;
          default:
            return true;
        }
      });
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "ja");
          break;
        case "date":
          comparison = a.dateTimestamp - b.dateTimestamp;
          break;
        case "size":
          comparison = a.sizeBytes - b.sizeBytes;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [files, activeTab, searchQuery, filterType, filterSize, filterDate, sortBy, sortOrder]);

  // ストレージ使用状況の計算
  const storageStats = useMemo(() => {
    const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    const maxGB = 120;
    const percentage = (totalGB / maxGB) * 100;

    const byType = {
      レポート: files
        .filter((f) => f.type === "レポート")
        .reduce((sum, f) => sum + f.sizeBytes, 0),
      画像: files
        .filter((f) => f.type === "画像")
        .reduce((sum, f) => sum + f.sizeBytes, 0),
      動画: files
        .filter((f) => f.type === "動画")
        .reduce((sum, f) => sum + f.sizeBytes, 0),
    };

    return {
      total: totalGB,
      max: maxGB,
      percentage: Math.min(percentage, 100),
      byType: {
        レポート: byType.レポート / (1024 * 1024),
        画像: byType.画像 / (1024 * 1024 * 1024),
        動画: byType.動画 / (1024 * 1024 * 1024),
      },
    };
  }, [files]);

  // ファイル表示
  const handleViewFile = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewDialogOpen(true);
  };

  // ファイルダウンロード
  const handleDownloadFile = (file: FileItem) => {
    toast.success(`「${file.name}」をダウンロードしました`);
    console.log("ファイルダウンロード:", file);
    // 実際の実装では、ファイルのダウンロード処理を実行
  };

  // ファイル削除
  const handleDeleteFile = (file: FileItem) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      toast.success(`「${fileToDelete.name}」を削除しました`);
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  // ソート切り替え
  const handleSort = (field: "name" | "date" | "size") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilterType("all");
    setFilterSize("all");
    setFilterDate("all");
    setSearchQuery("");
    setIsFilterOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ファイル管理</h1>
          <p className="text-muted-foreground mt-2">
            生成されたファイルを一元管理します
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
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            フィルター
            {(filterType !== "all" || filterSize !== "all" || filterDate !== "all") && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* フィルターパネル */}
      {isFilterOpen && (
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>タイプ</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="レポート">レポート</SelectItem>
                    <SelectItem value="画像">画像</SelectItem>
                    <SelectItem value="動画">動画</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>サイズ</Label>
                <Select value={filterSize} onValueChange={setFilterSize}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="small">1MB未満</SelectItem>
                    <SelectItem value="medium">1MB〜10MB</SelectItem>
                    <SelectItem value="large">10MB〜100MB</SelectItem>
                    <SelectItem value="xlarge">100MB以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>日付</Label>
                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="today">今日</SelectItem>
                    <SelectItem value="week">過去1週間</SelectItem>
                    <SelectItem value="month">過去1ヶ月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  リセット
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              レポート
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              画像
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              動画
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedFiles.length}件
            </span>
            <div className="flex gap-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("name")}
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
                onClick={() => handleSort("date")}
                className={sortBy === "date" ? "bg-muted" : ""}
              >
                {sortBy === "date" && sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("size")}
                className={sortBy === "size" ? "bg-muted" : ""}
              >
                {sortBy === "size" && sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                すべてのファイル ({filteredAndSortedFiles.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    ファイルが見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <file.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {file.type}
                            </Badge>
                            <span>{file.size}</span>
                            <span>{file.date}</span>
                            {file.duration && <span>再生時間: {file.duration}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                          title="表示"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                          title="ダウンロード"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(file)}
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

          {/* Storage Usage */}
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
                    <p className="text-xs text-muted-foreground mb-1">レポート</p>
                    <p className="text-lg font-bold">
                      {storageStats.byType.レポート.toFixed(1)} MB
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">画像</p>
                    <p className="text-lg font-bold">
                      {storageStats.byType.画像.toFixed(2)} GB
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">動画</p>
                    <p className="text-lg font-bold">
                      {storageStats.byType.動画.toFixed(2)} GB
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                分析レポート ({filteredAndSortedFiles.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    レポートが見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{file.size}</span>
                            <span>{file.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(file)}
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

        <TabsContent value="images" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                生成された画像 ({filteredAndSortedFiles.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    画像が見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredAndSortedFiles.map((file) => (
                    <div key={file.id} className="group relative">
                      <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs mt-2 truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} · {file.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                動画ファイル ({filteredAndSortedFiles.length}件)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAndSortedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    動画が見つかりませんでした
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredAndSortedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{file.size}</span>
                            {file.duration && <span>再生時間: {file.duration}</span>}
                            <span>{file.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteFile(file)}
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
      </Tabs>

      {/* ファイルプレビューダイアログ */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>ファイルの詳細情報</DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <selectedFile.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge variant="secondary">{selectedFile.type}</Badge>
                    <span>{selectedFile.size}</span>
                    <span>{selectedFile.date}</span>
                  </div>
                </div>
              </div>
              {selectedFile.duration && (
                <div>
                  <Label>再生時間</Label>
                  <p className="text-sm">{selectedFile.duration}</p>
                </div>
              )}
              {selectedFile.path && (
                <div>
                  <Label>パス</Label>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {selectedFile.path}
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
            {selectedFile && (
              <Button
                onClick={() => {
                  handleDownloadFile(selectedFile);
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
            <DialogTitle>ファイルを削除</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。ファイルが完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          {fileToDelete && (
            <div className="py-4">
              <p className="font-medium">{fileToDelete.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {fileToDelete.type} · {fileToDelete.size} · {fileToDelete.date}
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
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
