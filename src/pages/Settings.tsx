import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Key,
  Bell,
  Database,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Download,
  Trash2,
  TestTube,
  Volume2,
  Edit,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccountStatus {
  youtube: { connected: boolean; name: string; url: string };
  x: { connected: boolean; handle: string; plan: string };
  googleCalendar: { connected: boolean };
}

interface APIConfig {
  openai: { key: string; model: string };
  youtube: { key: string; usage: number; limit: number };
  x: { key: string; secret: string };
}

interface NotificationConfig {
  voice: {
    engine: string;
    character: string;
    volume: number;
  };
  desktop: boolean;
  cevioSound: boolean;
  types: {
    [key: string]: boolean;
  };
}

interface DataConfig {
  youtubeInterval: number;
  xInterval: number;
  reportTime: string;
  retentionPeriod: string;
}

export default function Settings() {
  // アカウント状態
  const [accountStatus, setAccountStatus] = useState<AccountStatus>({
    youtube: {
      connected: true,
      name: "しぇれす sheless",
      url: "https://www.youtube.com/channel/UCYPOx7xRlFDKiNSj2n-2Yuw",
    },
    x: {
      connected: true,
      handle: "@shelessV",
      plan: "X Pro プラン使用中",
    },
    googleCalendar: {
      connected: true,
    },
  });

  // API設定
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    openai: { key: "", model: "gpt-4" },
    youtube: { key: "", usage: 1234, limit: 10000 },
    x: { key: "", secret: "" },
  });

  // 通知設定
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    voice: {
      engine: "CeVIO AI ver9.1.17.0",
      character: "さとうささら",
      volume: 70,
    },
    desktop: true,
    cevioSound: true,
    types: {
      "YouTubeライブ配信": true,
      "ショート動画制作": true,
      "X定期投稿": false,
      "YouTube定期投稿": true,
      "サムネイル・動画編集作業": false,
      "企画/打ち合わせ/外部委託": true,
      "記念イベント": false,
    },
  });

  // データ設定
  const [dataConfig, setDataConfig] = useState<DataConfig>({
    youtubeInterval: 1,
    xInterval: 2,
    reportTime: "23:00",
    retentionPeriod: "6ヶ月",
  });

  // UI状態
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);
  
  // アカウント編集状態
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    youtube: { name: "", url: "" },
    x: { handle: "", plan: "" },
  });

  // API使用率の計算
  const youtubeUsagePercentage = (apiConfig.youtube.usage / apiConfig.youtube.limit) * 100;

  // パスワード表示切り替え
  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 設定保存
  const handleSave = async (section: string) => {
    setIsSaving(true);
    try {
      // シミュレーション: 実際の実装ではAPI呼び出し
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${section}の設定を保存しました`);
      console.log(`設定保存: ${section}`, {
        apiConfig,
        notificationConfig,
        dataConfig,
      });
    } catch (error) {
      toast.error("設定の保存に失敗しました");
      console.error("設定保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // アカウント連携解除
  const handleDisconnect = (target: string) => {
    setDisconnectTarget(target);
    setIsDisconnectDialogOpen(true);
  };

  const confirmDisconnect = () => {
    if (disconnectTarget) {
      if (disconnectTarget === "youtube") {
        setAccountStatus((prev) => ({
          ...prev,
          youtube: { ...prev.youtube, connected: false },
        }));
      } else if (disconnectTarget === "x") {
        setAccountStatus((prev) => ({
          ...prev,
          x: { ...prev.x, connected: false },
        }));
      } else if (disconnectTarget === "googleCalendar") {
        setAccountStatus((prev) => ({
          ...prev,
          googleCalendar: { connected: false },
        }));
      }
      toast.success(`${disconnectTarget === "youtube" ? "YouTube" : disconnectTarget === "x" ? "X" : "Googleカレンダー"}の連携を解除しました`);
      setIsDisconnectDialogOpen(false);
      setDisconnectTarget(null);
    }
  };

  // アカウント編集開始
  const handleStartEdit = (target: string) => {
    if (target === "youtube") {
      setEditForm((prev) => ({
        ...prev,
        youtube: {
          name: accountStatus.youtube.name,
          url: accountStatus.youtube.url,
        },
      }));
    } else if (target === "x") {
      setEditForm((prev) => ({
        ...prev,
        x: {
          handle: accountStatus.x.handle,
          plan: accountStatus.x.plan,
        },
      }));
    }
    setEditingAccount(target);
  };

  // アカウント編集キャンセル
  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditForm({
      youtube: { name: "", url: "" },
      x: { handle: "", plan: "" },
    });
  };

  // アカウント情報保存
  const handleSaveAccount = async (target: string) => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (target === "youtube") {
        setAccountStatus((prev) => ({
          ...prev,
          youtube: {
            ...prev.youtube,
            name: editForm.youtube.name,
            url: editForm.youtube.url,
          },
        }));
        toast.success("YouTubeアカウント情報を更新しました");
      } else if (target === "x") {
        setAccountStatus((prev) => ({
          ...prev,
          x: {
            ...prev.x,
            handle: editForm.x.handle,
            plan: editForm.x.plan,
          },
        }));
        toast.success("Xアカウント情報を更新しました");
      }
      
      setEditingAccount(null);
      console.log(`アカウント情報保存: ${target}`, editForm);
    } catch (error) {
      toast.error("アカウント情報の更新に失敗しました");
      console.error("アカウント情報保存エラー:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // アカウント情報更新（APIから取得）
  const handleRefreshAccount = (target: string) => {
    toast.success(`${target === "youtube" ? "YouTube" : "X"}アカウント情報を更新しました`);
    console.log(`アカウント情報更新: ${target}`);
  };

  // テスト再生
  const handleTestPlay = () => {
    toast.success("テスト再生を開始しました");
    console.log("テスト再生:", notificationConfig.voice);
  };

  // データエクスポート
  const handleExportData = () => {
    toast.success("データのエクスポートを開始しました");
    console.log("データエクスポート");
  };

  // データバックアップ
  const handleBackup = () => {
    toast.success("データベースのバックアップを開始しました");
    console.log("データバックアップ");
  };

  // 全データ削除
  const handleDeleteAllData = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAllData = () => {
    toast.success("すべてのデータを削除しました");
    console.log("全データ削除");
    setIsDeleteDialogOpen(false);
  };

  // 通知タイプの切り替え
  const toggleNotificationType = (type: string) => {
    setNotificationConfig((prev) => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: !prev.types[type],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground mt-2">
          アプリケーションの各種設定を管理します
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            アカウント
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API設定
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知設定
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            データ管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          {/* YouTube Account */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                YouTubeアカウント
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingAccount === "youtube" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="youtube-name">アカウント名</Label>
                    <Input
                      id="youtube-name"
                      value={editForm.youtube.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          youtube: { ...prev.youtube, name: e.target.value },
                        }))
                      }
                      placeholder="アカウント名を入力"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="youtube-url">チャンネルURL</Label>
                    <Input
                      id="youtube-url"
                      value={editForm.youtube.url}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          youtube: { ...prev.youtube, url: e.target.value },
                        }))
                      }
                      placeholder="https://www.youtube.com/channel/..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      キャンセル
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary-hover"
                      onClick={() => handleSaveAccount("youtube")}
                      disabled={isSaving || !editForm.youtube.name || !editForm.youtube.url}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{accountStatus.youtube.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {accountStatus.youtube.url}
                      </p>
                    </div>
                    <Badge
                      variant={accountStatus.youtube.connected ? "default" : "secondary"}
                      className={accountStatus.youtube.connected ? "bg-success" : ""}
                    >
                      {accountStatus.youtube.connected ? "連携中" : "未連携"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleStartEdit("youtube")}
                      disabled={!accountStatus.youtube.connected}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRefreshAccount("youtube")}
                      disabled={!accountStatus.youtube.connected}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      情報を更新
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect("youtube")}
                      disabled={!accountStatus.youtube.connected}
                    >
                      連携を解除
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* X Account */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Xアカウント
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingAccount === "x" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="x-handle">ハンドル名</Label>
                    <Input
                      id="x-handle"
                      value={editForm.x.handle}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          x: { ...prev.x, handle: e.target.value },
                        }))
                      }
                      placeholder="@username"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="x-plan">プラン</Label>
                    <Input
                      id="x-plan"
                      value={editForm.x.plan}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          x: { ...prev.x, plan: e.target.value },
                        }))
                      }
                      placeholder="プラン名を入力"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      キャンセル
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary-hover"
                      onClick={() => handleSaveAccount("x")}
                      disabled={isSaving || !editForm.x.handle}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{accountStatus.x.handle}</p>
                      <p className="text-xs text-muted-foreground">{accountStatus.x.plan}</p>
                    </div>
                    <Badge
                      variant={accountStatus.x.connected ? "default" : "secondary"}
                      className={accountStatus.x.connected ? "bg-success" : ""}
                    >
                      {accountStatus.x.connected ? "連携中" : "未連携"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleStartEdit("x")}
                      disabled={!accountStatus.x.connected}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRefreshAccount("x")}
                      disabled={!accountStatus.x.connected}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      情報を更新
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDisconnect("x")}
                      disabled={!accountStatus.x.connected}
                    >
                      連携を解除
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          {/* OpenAI API */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                OpenAI API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-key">APIキー</Label>
                <div className="relative mt-1">
                  <Input
                    id="openai-key"
                    type={showPasswords.openai ? "text" : "password"}
                    placeholder="sk-..."
                    value={apiConfig.openai.key}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        openai: { ...prev.openai, key: e.target.value },
                      }))
                    }
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("openai")}
                  >
                    {showPasswords.openai ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ChatGPTを使用したコンテンツ生成に必要です
                </p>
              </div>
              <div>
                <Label htmlFor="openai-model">使用モデル</Label>
                <Select
                  value={apiConfig.openai.model}
                  onValueChange={(value) =>
                    setApiConfig((prev) => ({
                      ...prev,
                      openai: { ...prev.openai, model: value },
                    }))
                  }
                >
                  <SelectTrigger id="openai-model" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">gpt-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={() => handleSave("OpenAI API")}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* YouTube Data API */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                YouTube Data API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube-key">APIキー</Label>
                <div className="relative mt-1">
                  <Input
                    id="youtube-key"
                    type={showPasswords.youtube ? "text" : "password"}
                    placeholder="AIza..."
                    value={apiConfig.youtube.key}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        youtube: { ...prev.youtube, key: e.target.value },
                      }))
                    }
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("youtube")}
                  >
                    {showPasswords.youtube ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  YouTubeアナリティクスデータの収集に使用します
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">API使用状況</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    今日: {apiConfig.youtube.usage.toLocaleString()} / {apiConfig.youtube.limit.toLocaleString()} クエリ
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      youtubeUsagePercentage > 80
                        ? "text-destructive"
                        : youtubeUsagePercentage > 50
                          ? "text-amber-600"
                          : "text-success"
                    }`}
                  >
                    {youtubeUsagePercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">使用率</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    youtubeUsagePercentage > 80
                      ? "bg-destructive"
                      : youtubeUsagePercentage > 50
                        ? "bg-amber-600"
                        : "bg-success"
                  }`}
                  style={{ width: `${Math.min(youtubeUsagePercentage, 100)}%` }}
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={() => handleSave("YouTube Data API")}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* X API */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                X API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="x-key">APIキー</Label>
                <div className="relative mt-1">
                  <Input
                    id="x-key"
                    type={showPasswords.xKey ? "text" : "password"}
                    placeholder="..."
                    value={apiConfig.x.key}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        x: { ...prev.x, key: e.target.value },
                      }))
                    }
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("xKey")}
                  >
                    {showPasswords.xKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="x-secret">APIシークレット</Label>
                <div className="relative mt-1">
                  <Input
                    id="x-secret"
                    type={showPasswords.xSecret ? "text" : "password"}
                    placeholder="..."
                    value={apiConfig.x.secret}
                    onChange={(e) =>
                      setApiConfig((prev) => ({
                        ...prev,
                        x: { ...prev.x, secret: e.target.value },
                      }))
                    }
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility("xSecret")}
                  >
                    {showPasswords.xSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={() => handleSave("X API")}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Voice Notifications */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                音声通知設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="voice-engine">音声エンジン</Label>
                <Select
                  value={notificationConfig.voice.engine}
                  onValueChange={(value) =>
                    setNotificationConfig((prev) => ({
                      ...prev,
                      voice: { ...prev.voice, engine: value },
                    }))
                  }
                >
                  <SelectTrigger id="voice-engine" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CeVIO AI ver9.1.17.0">
                      CeVIO AI ver9.1.17.0
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="voice-volume">音量: {notificationConfig.voice.volume}%</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    id="voice-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={notificationConfig.voice.volume}
                    onChange={(e) =>
                      setNotificationConfig((prev) => ({
                        ...prev,
                        voice: {
                          ...prev.voice,
                          volume: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-right">
                    {notificationConfig.voice.volume}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PC Notifications */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                PC通知設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">デスクトップ通知を有効化</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    重要なイベント時にデスクトップ通知を表示します
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.desktop}
                  onCheckedChange={(checked) =>
                    setNotificationConfig((prev) => ({
                      ...prev,
                      desktop: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">CevioAI サウンド通知</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    通知時にサウンドを再生します
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.cevioSound}
                  onCheckedChange={(checked) =>
                    setNotificationConfig((prev) => ({
                      ...prev,
                      cevioSound: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">通知タイプ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(notificationConfig.types).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between">
                  <p className="text-sm">{type}</p>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => toggleNotificationType(type)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {/* Data Collection */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                データ収集設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="youtube-interval">YouTube収集間隔（分）</Label>
                <Input
                  id="youtube-interval"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={dataConfig.youtubeInterval}
                  onChange={(e) =>
                    setDataConfig((prev) => ({
                      ...prev,
                      youtubeInterval: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  配信中の同時接続者数などの収集頻度
                </p>
              </div>
              <div>
                <Label htmlFor="x-interval">X収集間隔（時間）</Label>
                <Input
                  id="x-interval"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={dataConfig.xInterval}
                  onChange={(e) =>
                    setDataConfig((prev) => ({
                      ...prev,
                      xInterval: parseInt(e.target.value) || 2,
                    }))
                  }
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  トレンドタグ・バズワードの収集頻度
                </p>
              </div>
              <div>
                <Label htmlFor="report-time">日次レポート生成時刻</Label>
                <Input
                  id="report-time"
                  type="time"
                  value={dataConfig.reportTime}
                  onChange={(e) =>
                    setDataConfig((prev) => ({
                      ...prev,
                      reportTime: e.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={() => handleSave("データ収集設定")}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 連携解除確認ダイアログ */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>連携を解除</DialogTitle>
            <DialogDescription>
              {disconnectTarget === "youtube"
                ? "YouTube"
                : disconnectTarget === "x"
                  ? "X"
                  : "Googleカレンダー"}
              の連携を解除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect}>
              解除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 全データ削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>すべてのデータを削除</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。すべてのデータが完全に削除されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAllData}>
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
