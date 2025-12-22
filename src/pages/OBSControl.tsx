import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  MonitorPlay,
  Layers,
  Zap,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Play,
  Square,
  Volume2,
  VolumeX,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Power,
  PowerOff,
} from "lucide-react";
import { toast } from "sonner";

interface Scene {
  id: string;
  name: string;
  active: boolean;
}

interface Trigger {
  id: string;
  event: string;
  action: string;
  duration?: number;
  enabled: boolean;
  condition?: string;
}

interface Source {
  id: string;
  name: string;
  type: "画像" | "動画" | "テキスト" | "音声";
  path: string;
}

interface ConnectionConfig {
  host: string;
  port: number;
  password: string;
}

export default function OBSControl() {
  // 接続状態
  const [isConnected, setIsConnected] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastPing, setLastPing] = useState("2秒前");

  // シーン管理
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "1", name: "メイン配信シーン", active: true },
    { id: "2", name: "待機画面", active: false },
    { id: "3", name: "ゲーム画面", active: false },
    { id: "4", name: "チャット表示", active: false },
    { id: "5", name: "エンディング", active: false },
  ]);

  // トリガー管理
  const [triggers, setTriggers] = useState<Trigger[]>([
    {
      id: "1",
      event: "スーパーチャット受信時",
      action: "感謝画像を5秒間表示",
      duration: 5,
      enabled: true,
    },
    {
      id: "2",
      event: "同時接続500人到達時",
      action: "記念エフェクトを再生",
      enabled: true,
      condition: "500",
    },
    {
      id: "3",
      event: "特定キーワード検出時",
      action: "リアクション画像表示",
      enabled: false,
      condition: "キーワード",
    },
    {
      id: "4",
      event: "メンバーシップ加入時",
      action: "歓迎メッセージ表示",
      enabled: true,
    },
  ]);

  // ソース管理
  const [sources, setSources] = useState<Source[]>([
    { id: "1", name: "感謝画像", type: "画像", path: "H:/images/thanks.png" },
    { id: "2", name: "記念エフェクト", type: "動画", path: "H:/videos/celebration.mp4" },
    { id: "3", name: "リアクション1", type: "画像", path: "H:/images/reaction1.png" },
    { id: "4", name: "歓迎メッセージ", type: "テキスト", path: "テキストソース" },
  ]);

  // 接続設定
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    host: "localhost",
    port: 4455,
    password: "",
  });

  // NGワード管理
  const [ngWords, setNgWords] = useState("");

  // ダイアログ状態
  const [isTriggerDialogOpen, setIsTriggerDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isEditTriggerDialogOpen, setIsEditTriggerDialogOpen] = useState(false);
  const [isEditSourceDialogOpen, setIsEditSourceDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  // トリガーフォーム
  const [triggerForm, setTriggerForm] = useState({
    event: "スーパーチャット受信時",
    action: "画像を表示",
    duration: "5",
    condition: "",
  });

  // ソースフォーム
  const [sourceForm, setSourceForm] = useState({
    name: "",
    type: "画像" as Source["type"],
    path: "",
  });

  // ファイル入力用のref
  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const editSourceFileInputRef = useRef<HTMLInputElement>(null);

  // 接続状態の更新（シミュレーション）
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const seconds = Math.floor(Math.random() * 5) + 1;
        setLastPing(`${seconds}秒前`);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // シーン切り替え
  const handleSwitchScene = (sceneId: string) => {
    setScenes((prev) =>
      prev.map((s) => ({ ...s, active: s.id === sceneId }))
    );
    const scene = scenes.find((s) => s.id === sceneId);
    toast.success(`シーンを「${scene?.name}」に切り替えました`);
    console.log(`シーン切り替え: ${sceneId}`);
  };

  // 配信開始
  const handleStartStreaming = () => {
    setIsStreaming(true);
    toast.success("配信を開始しました");
    console.log("配信開始");
  };

  // 配信終了
  const handleStopStreaming = () => {
    setIsStreaming(false);
    toast.success("配信を終了しました");
    console.log("配信終了");
  };

  // 待機画面に切り替え
  const handleSwitchToWaiting = () => {
    const waitingScene = scenes.find((s) => s.name === "待機画面");
    if (waitingScene) {
      handleSwitchScene(waitingScene.id);
    }
  };

  // 音声ミュート切り替え
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? "音声を有効化しました" : "音声をミュートしました");
    console.log(`音声ミュート: ${!isMuted}`);
  };

  // トリガー追加
  const handleAddTrigger = () => {
    const newTrigger: Trigger = {
      id: Date.now().toString(),
      event: triggerForm.event,
      action: triggerForm.action,
      duration: triggerForm.duration ? parseInt(triggerForm.duration) : undefined,
      enabled: true,
      condition: triggerForm.condition || undefined,
    };
    setTriggers((prev) => [...prev, newTrigger]);
    setIsTriggerDialogOpen(false);
    setTriggerForm({ event: "スーパーチャット受信時", action: "画像を表示", duration: "5", condition: "" });
    toast.success("トリガーを追加しました");
    console.log("トリガー追加:", newTrigger);
  };

  // トリガー編集
  const handleEditTrigger = (trigger: Trigger) => {
    setEditingTrigger(trigger);
    setTriggerForm({
      event: trigger.event,
      action: trigger.action,
      duration: trigger.duration?.toString() || "",
      condition: trigger.condition || "",
    });
    setIsEditTriggerDialogOpen(true);
  };

  // トリガー更新
  const handleUpdateTrigger = () => {
    if (editingTrigger) {
      setTriggers((prev) =>
        prev.map((t) =>
          t.id === editingTrigger.id
            ? {
                ...t,
                event: triggerForm.event,
                action: triggerForm.action,
                duration: triggerForm.duration ? parseInt(triggerForm.duration) : undefined,
                condition: triggerForm.condition || undefined,
              }
            : t
        )
      );
      setIsEditTriggerDialogOpen(false);
      setEditingTrigger(null);
      setTriggerForm({ event: "スーパーチャット受信時", action: "画像を表示", duration: "5", condition: "" });
      toast.success("トリガーを更新しました");
      console.log("トリガー更新");
    }
  };

  // トリガー削除
  const handleDeleteTrigger = (id: string) => {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
    toast.success("トリガーを削除しました");
    console.log(`トリガー削除: ${id}`);
  };

  // トリガー有効/無効切り替え
  const handleToggleTrigger = (id: string) => {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
    const trigger = triggers.find((t) => t.id === id);
    toast.success(trigger?.enabled ? "トリガーを無効化しました" : "トリガーを有効化しました");
    console.log(`トリガー切り替え: ${id}`);
  };

  // ソース追加
  const handleAddSource = () => {
    if (!sourceForm.name.trim() || !sourceForm.path.trim()) {
      toast.error("ソース名とファイルパスを入力してください");
      return;
    }
    const newSource: Source = {
      id: Date.now().toString(),
      name: sourceForm.name,
      type: sourceForm.type,
      path: sourceForm.path,
    };
    setSources((prev) => [...prev, newSource]);
    setIsSourceDialogOpen(false);
    setSourceForm({ name: "", type: "画像", path: "" });
    toast.success("ソースを追加しました");
    console.log("ソース追加:", newSource);
  };

  // ソース編集
  const handleEditSource = (source: Source) => {
    setEditingSource(source);
    setSourceForm({
      name: source.name,
      type: source.type,
      path: source.path,
    });
    setIsEditSourceDialogOpen(true);
  };

  // ソース更新
  const handleUpdateSource = () => {
    if (editingSource) {
      setSources((prev) =>
        prev.map((s) =>
          s.id === editingSource.id
            ? {
                ...s,
                name: sourceForm.name,
                type: sourceForm.type,
                path: sourceForm.path,
              }
            : s
        )
      );
      setIsEditSourceDialogOpen(false);
      setEditingSource(null);
      setSourceForm({ name: "", type: "画像", path: "" });
      toast.success("ソースを更新しました");
      console.log("ソース更新");
    }
  };

  // ソース削除
  const handleDeleteSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    toast.success("ソースを削除しました");
    console.log(`ソース削除: ${id}`);
  };

  // ソーステスト表示
  const handleTestSource = (source: Source) => {
    toast.success(`「${source.name}」をテスト表示しました`);
    console.log(`ソーステスト表示: ${source.id}`);
  };

  // 接続/切断
  const handleConnect = () => {
    setIsConnected(true);
    toast.success("OBS WebSocketに接続しました");
    console.log("OBS接続");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setIsStreaming(false);
    toast.success("OBS WebSocketから切断しました");
    console.log("OBS切断");
  };

  const handleReconnect = () => {
    handleDisconnect();
    setTimeout(() => {
      handleConnect();
    }, 1000);
  };

  // 接続設定保存
  const handleSaveConnectionConfig = () => {
    toast.success("接続設定を保存しました");
    console.log("接続設定保存:", connectionConfig);
  };

  // NGワード保存
  const handleSaveNgWords = () => {
    toast.success("NGワードリストを保存しました");
    console.log("NGワード保存");
  };

  // NGワードインポート
  const handleImportNgWords = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNgWords(reader.result as string);
          toast.success("NGワードリストをインポートしました");
          console.log("NGワードインポート");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // ファイル選択のaccept属性を取得
  const getFileAccept = (type: Source["type"]) => {
    switch (type) {
      case "画像":
        return "image/*";
      case "動画":
        return "video/*";
      case "音声":
        return "audio/*";
      case "テキスト":
        return ".txt,.md,.txt";
      default:
        return "*/*";
    }
  };

  // ソース追加用ファイル選択
  const handleSourceFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ブラウザのセキュリティ制限により、完全なパスは取得できないため、
      // ファイル名を使用してパスフィールドに設定
      // 実際のOBS環境では、ユーザーが手動でパスを入力するか、
      // Electronなどのデスクトップアプリケーションで完全なパスを取得可能
      const fileName = file.name;
      setSourceForm({ ...sourceForm, path: fileName });
      toast.success(`ファイル「${fileName}」を選択しました`);
      console.log("ファイル選択:", fileName);
    }
    // 同じファイルを再度選択できるようにリセット
    if (event.target) {
      event.target.value = "";
    }
  };

  // ソース編集用ファイル選択
  const handleEditSourceFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name;
      setSourceForm({ ...sourceForm, path: fileName });
      toast.success(`ファイル「${fileName}」を選択しました`);
      console.log("ファイル選択（編集）:", fileName);
    }
    // 同じファイルを再度選択できるようにリセット
    if (event.target) {
      event.target.value = "";
    }
  };

  // 参照ボタンクリック（追加用）
  const handleSourceFileBrowse = () => {
    sourceFileInputRef.current?.click();
  };

  // 参照ボタンクリック（編集用）
  const handleEditSourceFileBrowse = () => {
    editSourceFileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OBSコントロール</h1>
          <p className="text-muted-foreground mt-2">
            配信中のOBSを自動制御します
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="default"
            className={`flex items-center gap-2 px-3 py-1 ${
              isConnected ? "bg-success" : "bg-destructive"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full bg-white ${
                isConnected ? "animate-pulse" : ""
              }`}
            />
            {isConnected ? "WebSocket接続中" : "未接続"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="scenes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenes" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            シーン管理
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            トリガー設定
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            ソース管理
          </TabsTrigger>
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            接続設定
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenes" className="space-y-4">
          {/* Scene List */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">シーンリスト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      scene.active
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MonitorPlay
                        className={`h-5 w-5 ${
                          scene.active ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <span className="font-medium text-sm">{scene.name}</span>
                      {scene.active && (
                        <Badge variant="default" className="bg-primary">
                          配信中
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant={scene.active ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleSwitchScene(scene.id)}
                      disabled={!isConnected}
                    >
                      切替
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">クイック操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                <Button
                  className="bg-primary hover:bg-primary-hover"
                  onClick={handleStartStreaming}
                  disabled={!isConnected || isStreaming}
                >
                  <Play className="h-4 w-4 mr-2" />
                  配信開始
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleStopStreaming}
                  disabled={!isConnected || !isStreaming}
                >
                  <Square className="h-4 w-4 mr-2" />
                  配信終了
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSwitchToWaiting}
                  disabled={!isConnected}
                >
                  待機画面に切替
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleMute}
                  disabled={!isConnected}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="h-4 w-4 mr-2" />
                      音声有効化
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 mr-2" />
                      音声ミュート
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          {/* Trigger List */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">自動トリガー</CardTitle>
              <Button
                className="bg-primary hover:bg-primary-hover"
                onClick={() => setIsTriggerDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                トリガー追加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    トリガーがありません
                  </p>
                ) : (
                  triggers.map((trigger) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap
                            className={`h-4 w-4 ${
                              trigger.enabled ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium text-sm">{trigger.event}</span>
                          <Badge
                            variant={trigger.enabled ? "default" : "secondary"}
                          >
                            {trigger.enabled ? "有効" : "無効"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          → {trigger.action}
                          {trigger.duration && ` (${trigger.duration}秒)`}
                          {trigger.condition && ` [条件: ${trigger.condition}]`}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTrigger(trigger)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteTrigger(trigger.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Switch
                          checked={trigger.enabled}
                          onCheckedChange={() => handleToggleTrigger(trigger.id)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          {/* Source List */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">登録済みソース</CardTitle>
              <Button
                className="bg-primary hover:bg-primary-hover"
                onClick={() => setIsSourceDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                ソース追加
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sources.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    ソースがありません
                  </p>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between border-b border-border last:border-0 pb-3 last:pb-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {source.type} - {source.path}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestSource(source)}
                          disabled={!isConnected}
                        >
                          テスト表示
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSource(source)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteSource(source.id)}
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

        <TabsContent value="connection" className="space-y-4">
          {/* Connection Status */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">WebSocket接続</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">接続状態</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    OBS WebSocketへの接続状態を確認します
                  </p>
                </div>
                <Badge
                  variant="default"
                  className={isConnected ? "bg-success" : "bg-destructive"}
                >
                  {isConnected ? "接続中" : "未接続"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">サーバー:</span>
                  <span className="font-medium">
                    {connectionConfig.host}:{connectionConfig.port}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">プロトコル:</span>
                  <span className="font-medium">WebSocket 5.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">最終通信:</span>
                  <span className="font-medium">{lastPing}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReconnect}
                  disabled={isConnected}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再接続
                </Button>
                {isConnected ? (
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={handleDisconnect}
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    切断
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleConnect}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    接続
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connection Settings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">接続設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ws-host">ホスト</Label>
                <Input
                  id="ws-host"
                  value={connectionConfig.host}
                  onChange={(e) =>
                    setConnectionConfig({ ...connectionConfig, host: e.target.value })
                  }
                  placeholder="localhost"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ws-port">ポート</Label>
                <Input
                  id="ws-port"
                  type="number"
                  value={connectionConfig.port}
                  onChange={(e) =>
                    setConnectionConfig({
                      ...connectionConfig,
                      port: parseInt(e.target.value) || 4455,
                    })
                  }
                  placeholder="4455"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ws-password">パスワード</Label>
                <Input
                  id="ws-password"
                  type="password"
                  value={connectionConfig.password}
                  onChange={(e) =>
                    setConnectionConfig({ ...connectionConfig, password: e.target.value })
                  }
                  placeholder="●●●●●●●●"
                  className="mt-1"
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary-hover"
                onClick={handleSaveConnectionConfig}
              >
                設定を保存
              </Button>
            </CardContent>
          </Card>

          {/* NG Word Management */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">NGワード管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ng-words">NGワードリスト</Label>
                <Textarea
                  id="ng-words"
                  value={ngWords}
                  onChange={(e) => setNgWords(e.target.value)}
                  placeholder="1行に1つのNGワードを入力"
                  className="mt-1 min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  検出されたNGワードは自動的にYouTube NGワードリストに追加候補として表示されます
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleImportNgWords}
                >
                  リストをインポート
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary-hover"
                  onClick={handleSaveNgWords}
                >
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* トリガー追加ダイアログ */}
      <Dialog open={isTriggerDialogOpen} onOpenChange={setIsTriggerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規トリガー作成</DialogTitle>
            <DialogDescription>
              自動実行されるトリガーを設定します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trigger-event">トリガーイベント</Label>
              <Select
                value={triggerForm.event}
                onValueChange={(value) =>
                  setTriggerForm({ ...triggerForm, event: value })
                }
              >
                <SelectTrigger id="trigger-event" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="スーパーチャット受信時">
                    スーパーチャット受信時
                  </SelectItem>
                  <SelectItem value="同時接続者数が指定数到達時">
                    同時接続者数が指定数到達時
                  </SelectItem>
                  <SelectItem value="特定コメント検出時">
                    特定コメント検出時
                  </SelectItem>
                  <SelectItem value="高評価が指定数到達時">
                    高評価が指定数到達時
                  </SelectItem>
                  <SelectItem value="メンバーシップ加入時">
                    メンバーシップ加入時
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="trigger-action">実行アクション</Label>
              <Select
                value={triggerForm.action}
                onValueChange={(value) =>
                  setTriggerForm({ ...triggerForm, action: value })
                }
              >
                <SelectTrigger id="trigger-action" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="画像を表示">画像を表示</SelectItem>
                  <SelectItem value="動画を再生">動画を再生</SelectItem>
                  <SelectItem value="シーンを切替">シーンを切替</SelectItem>
                  <SelectItem value="音声を再生">音声を再生</SelectItem>
                  <SelectItem value="テキストを表示">テキストを表示</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(triggerForm.event.includes("指定数") ||
              triggerForm.event.includes("検出")) && (
              <div>
                <Label htmlFor="trigger-condition">条件</Label>
                <Input
                  id="trigger-condition"
                  value={triggerForm.condition}
                  onChange={(e) =>
                    setTriggerForm({ ...triggerForm, condition: e.target.value })
                  }
                  placeholder={
                    triggerForm.event.includes("指定数")
                      ? "例: 500"
                      : "例: キーワード"
                  }
                  className="mt-1"
                />
              </div>
            )}
            {(triggerForm.action === "画像を表示" ||
              triggerForm.action === "動画を再生" ||
              triggerForm.action === "テキストを表示") && (
              <div>
                <Label htmlFor="trigger-duration">表示時間（秒）</Label>
                <Input
                  id="trigger-duration"
                  type="number"
                  value={triggerForm.duration}
                  onChange={(e) =>
                    setTriggerForm({ ...triggerForm, duration: e.target.value })
                  }
                  placeholder="5"
                  className="mt-1"
                  min="1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTriggerDialogOpen(false);
                setTriggerForm({
                  event: "スーパーチャット受信時",
                  action: "画像を表示",
                  duration: "5",
                  condition: "",
                });
              }}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddTrigger} className="bg-primary hover:bg-primary-hover">
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* トリガー編集ダイアログ */}
      <Dialog
        open={isEditTriggerDialogOpen}
        onOpenChange={setIsEditTriggerDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>トリガーを編集</DialogTitle>
            <DialogDescription>
              トリガーの設定を変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-trigger-event">トリガーイベント</Label>
              <Select
                value={triggerForm.event}
                onValueChange={(value) =>
                  setTriggerForm({ ...triggerForm, event: value })
                }
              >
                <SelectTrigger id="edit-trigger-event" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="スーパーチャット受信時">
                    スーパーチャット受信時
                  </SelectItem>
                  <SelectItem value="同時接続者数が指定数到達時">
                    同時接続者数が指定数到達時
                  </SelectItem>
                  <SelectItem value="特定コメント検出時">
                    特定コメント検出時
                  </SelectItem>
                  <SelectItem value="高評価が指定数到達時">
                    高評価が指定数到達時
                  </SelectItem>
                  <SelectItem value="メンバーシップ加入時">
                    メンバーシップ加入時
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-trigger-action">実行アクション</Label>
              <Select
                value={triggerForm.action}
                onValueChange={(value) =>
                  setTriggerForm({ ...triggerForm, action: value })
                }
              >
                <SelectTrigger id="edit-trigger-action" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="画像を表示">画像を表示</SelectItem>
                  <SelectItem value="動画を再生">動画を再生</SelectItem>
                  <SelectItem value="シーンを切替">シーンを切替</SelectItem>
                  <SelectItem value="音声を再生">音声を再生</SelectItem>
                  <SelectItem value="テキストを表示">テキストを表示</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(triggerForm.event.includes("指定数") ||
              triggerForm.event.includes("検出")) && (
              <div>
                <Label htmlFor="edit-trigger-condition">条件</Label>
                <Input
                  id="edit-trigger-condition"
                  value={triggerForm.condition}
                  onChange={(e) =>
                    setTriggerForm({ ...triggerForm, condition: e.target.value })
                  }
                  placeholder={
                    triggerForm.event.includes("指定数")
                      ? "例: 500"
                      : "例: キーワード"
                  }
                  className="mt-1"
                />
              </div>
            )}
            {(triggerForm.action === "画像を表示" ||
              triggerForm.action === "動画を再生" ||
              triggerForm.action === "テキストを表示") && (
              <div>
                <Label htmlFor="edit-trigger-duration">表示時間（秒）</Label>
                <Input
                  id="edit-trigger-duration"
                  type="number"
                  value={triggerForm.duration}
                  onChange={(e) =>
                    setTriggerForm({ ...triggerForm, duration: e.target.value })
                  }
                  placeholder="5"
                  className="mt-1"
                  min="1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTriggerDialogOpen(false);
                setEditingTrigger(null);
                setTriggerForm({
                  event: "スーパーチャット受信時",
                  action: "画像を表示",
                  duration: "5",
                  condition: "",
                });
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateTrigger}
              className="bg-primary hover:bg-primary-hover"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ソース追加ダイアログ */}
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規ソース追加</DialogTitle>
            <DialogDescription>
              OBSで使用するソースを追加します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="source-name">ソース名</Label>
              <Input
                id="source-name"
                value={sourceForm.name}
                onChange={(e) =>
                  setSourceForm({ ...sourceForm, name: e.target.value })
                }
                placeholder="例: スーパーチャット感謝画像"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="source-type">ソースタイプ</Label>
              <Select
                value={sourceForm.type}
                onValueChange={(value: Source["type"]) =>
                  setSourceForm({ ...sourceForm, type: value })
                }
              >
                <SelectTrigger id="source-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="画像">画像</SelectItem>
                  <SelectItem value="動画">動画</SelectItem>
                  <SelectItem value="テキスト">テキスト</SelectItem>
                  <SelectItem value="音声">音声</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-path">ファイルパス</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="source-path"
                  value={sourceForm.path}
                  onChange={(e) =>
                    setSourceForm({ ...sourceForm, path: e.target.value })
                  }
                  placeholder="H:/images/example.png"
                  className="flex-1"
                />
                <input
                  type="file"
                  ref={sourceFileInputRef}
                  accept={getFileAccept(sourceForm.type)}
                  onChange={handleSourceFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleSourceFileBrowse}
                >
                  参照
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSourceDialogOpen(false);
                setSourceForm({ name: "", type: "画像", path: "" });
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddSource}
              className="bg-primary hover:bg-primary-hover"
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ソース編集ダイアログ */}
      <Dialog
        open={isEditSourceDialogOpen}
        onOpenChange={setIsEditSourceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ソースを編集</DialogTitle>
            <DialogDescription>
              ソースの設定を変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-source-name">ソース名</Label>
              <Input
                id="edit-source-name"
                value={sourceForm.name}
                onChange={(e) =>
                  setSourceForm({ ...sourceForm, name: e.target.value })
                }
                placeholder="例: スーパーチャット感謝画像"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-source-type">ソースタイプ</Label>
              <Select
                value={sourceForm.type}
                onValueChange={(value: Source["type"]) =>
                  setSourceForm({ ...sourceForm, type: value })
                }
              >
                <SelectTrigger id="edit-source-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="画像">画像</SelectItem>
                  <SelectItem value="動画">動画</SelectItem>
                  <SelectItem value="テキスト">テキスト</SelectItem>
                  <SelectItem value="音声">音声</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-source-path">ファイルパス</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="edit-source-path"
                  value={sourceForm.path}
                  onChange={(e) =>
                    setSourceForm({ ...sourceForm, path: e.target.value })
                  }
                  placeholder="H:/images/example.png"
                  className="flex-1"
                />
                <input
                  type="file"
                  ref={editSourceFileInputRef}
                  accept={getFileAccept(sourceForm.type)}
                  onChange={handleEditSourceFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleEditSourceFileBrowse}
                >
                  参照
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSourceDialogOpen(false);
                setEditingSource(null);
                setSourceForm({ name: "", type: "画像", path: "" });
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateSource}
              className="bg-primary hover:bg-primary-hover"
            >
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
