import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HelpCircle,
  Book,
  MessageCircle,
  ExternalLink,
  Search,
  X,
  Settings,
  Radio,
  BarChart3,
  Film,
  Send,
  Calendar,
  MonitorPlay,
  FolderOpen,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  category: "初期設定" | "機能説明" | "トラブルシューティング" | "自動化" | "分析・レポート";
  question: string;
  answer: string | JSX.Element;
  keywords: string[];
}

const faqData: FAQItem[] = [
  {
    id: "setup-1",
    category: "初期設定",
    question: "ツールの初期設定はどのように行いますか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>初期設定は以下の手順で行います：</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            <strong>設定画面</strong>でYouTubeとXのアカウントを連携
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → アカウントタブから各プラットフォームを連携
            </span>
          </li>
          <li>
            <strong>API設定</strong>で必要なAPIキーを入力
            <br />
            <span className="text-muted-foreground text-xs">
              → OpenAI API、YouTube Data API、X APIのキーを設定
            </span>
          </li>
          <li>
            <strong>音声通知設定</strong>でCeVIO AIを設定
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → 通知設定からCeVIO AIのバージョンとキャラクターを選択
            </span>
          </li>
          <li>
            <strong>データ収集間隔</strong>を設定
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → データ管理から収集間隔をカスタマイズ
            </span>
          </li>
        </ol>
      </div>
    ),
    keywords: ["初期設定", "セットアップ", "設定", "アカウント連携", "API"],
  },
  {
    id: "feature-1",
    category: "機能説明",
    question: "ライブモニター機能はどのように使用しますか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>ライブモニターでは、YouTube配信中のリアルタイムデータを監視できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>同時接続数</strong>：リアルタイムの視聴者数をグラフで確認
          </li>
          <li>
            <strong>コメント・スーパーチャット</strong>：最新のコメントとスーパーチャットを表示
          </li>
          <li>
            <strong>OBSコントロール</strong>：モニタリング開始/停止、手動更新が可能
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 配信中は自動的にデータが更新されます
        </p>
      </div>
    ),
    keywords: ["ライブモニター", "配信", "視聴者", "コメント", "スーパーチャット"],
  },
  {
    id: "feature-2",
    category: "機能説明",
    question: "コンテンツスタジオの機能を教えてください",
    answer: (
      <div className="space-y-3 text-sm">
        <p>コンテンツスタジオでは、AIを活用してコンテンツを生成できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Shorts台本生成</strong>：テーマ、時間、スタイルを指定して台本を自動生成
          </li>
          <li>
            <strong>ライブ企画生成</strong>：配信タイプと時間に応じた企画を提案
          </li>
          <li>
            <strong>メタデータ生成</strong>：タイトル、説明文、ハッシュタグを自動生成
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 生成されたコンテンツはコピーやダウンロードが可能です
        </p>
      </div>
    ),
    keywords: ["コンテンツスタジオ", "Shorts", "台本", "ライブ企画", "メタデータ", "AI生成"],
  },
  {
    id: "feature-3",
    category: "機能説明",
    question: "X投稿の自動化機能について詳しく教えてください",
    answer: (
      <div className="space-y-3 text-sm">
        <p>X投稿サポートでは、以下の自動化機能を利用できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>画像合成</strong>：背景、キャラクター、オーバーレイを組み合わせて画像を生成
          </li>
          <li>
            <strong>AI挨拶文生成</strong>：ChatGPTが時間帯に応じた挨拶文を生成
          </li>
          <li>
            <strong>予約投稿</strong>：指定した時間に自動投稿（手動承認必須）
          </li>
          <li>
            <strong>返信サポート</strong>：Xからの返信をリアルタイムで表示・返信
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ 自動投稿は必ず手動で承認してから投稿されます
        </p>
      </div>
    ),
    keywords: ["X投稿", "自動投稿", "画像合成", "返信", "予約投稿"],
  },
  {
    id: "feature-4",
    category: "機能説明",
    question: "スケジューラー機能の使い方を教えてください",
    answer: (
      <div className="space-y-3 text-sm">
        <p>スケジューラーでは、配信や作業のスケジュールを管理できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>週間・月間表示</strong>：カレンダー形式でスケジュールを確認
          </li>
          <li>
            <strong>重要イベント</strong>：記念イベントなどを特別に管理（2ヶ月前に通知）
          </li>
          <li>
            <strong>CevioAI設定</strong>：各スケジュールの通知時間を個別に設定
          </li>
          <li>
            <strong>種類別色分け</strong>：8種類のスケジュールタイプを色で識別
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 通常の予定は2時間前、重要イベントは2ヶ月前にCevio AI音声通知されます
        </p>
      </div>
    ),
    keywords: ["スケジューラー", "スケジュール", "カレンダー", "重要イベント", "通知"],
  },
  {
    id: "trouble-1",
    category: "トラブルシューティング",
    question: "OBS連携が接続できない場合はどうすればいいですか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>以下の点を順番に確認してください：</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            <strong>OBS WebSocketプラグイン</strong>がインストールされているか確認
          </li>
          <li>
            <strong>OBSが起動</strong>しているか確認
          </li>
          <li>
            <strong>ポート番号</strong>（デフォルト：4455）が正しいか確認
            <br />
            <span className="text-muted-foreground text-xs">
              → OBSコントロール → 接続設定で確認
            </span>
          </li>
          <li>
            <strong>パスワード</strong>が正しく設定されているか確認
          </li>
          <li>
            <strong>ファイアウォール</strong>でブロックされていないか確認
          </li>
        </ol>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1">💡 ヒント</p>
          <p className="text-xs text-muted-foreground">
            OBSコントロール画面の「再接続」ボタンで接続を再試行できます
          </p>
        </div>
      </div>
    ),
    keywords: ["OBS", "接続", "WebSocket", "エラー", "トラブル"],
  },
  {
    id: "trouble-2",
    category: "トラブルシューティング",
    question: "CeVIO AIの音声通知が機能しない場合は？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>トラブルシューティング手順：</p>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            <strong>CeVIO AIのインストール確認</strong>
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → 通知設定でバージョンを確認
            </span>
          </li>
          <li>
            <strong>キャラクター設定</strong>が適切か確認
            <br />
            <span className="text-muted-foreground text-xs">
              → さとうささら、すずきつづみ、たかはしさんなど
            </span>
          </li>
          <li>
            <strong>音量設定</strong>を確認（デフォルト：70%）
          </li>
          <li>
            <strong>テスト再生</strong>で動作確認
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → 通知設定から「テスト再生」を実行
            </span>
          </li>
          <li>
            <strong>CevioAI設定</strong>が有効になっているか確認
            <br />
            <span className="text-muted-foreground text-xs">
              → スケジューラー → CevioAI設定タブで確認
            </span>
          </li>
        </ol>
      </div>
    ),
    keywords: ["CeVIO", "音声通知", "通知", "エラー", "トラブル"],
  },
  {
    id: "trouble-3",
    category: "トラブルシューティング",
    question: "データ分析が表示されない場合は？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>以下の点を確認してください：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>APIキー</strong>が正しく設定されているか
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → API設定で確認
            </span>
          </li>
          <li>
            <strong>アカウント連携</strong>が完了しているか
          </li>
          <li>
            <strong>分析開始ボタン</strong>をクリックしてデータ取得を開始
          </li>
          <li>
            <strong>期間選択</strong>が適切か確認（YouTube: 過去1日/1週間、X: 過去2時間/1日）
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 「今すぐ更新」ボタンで手動でデータを取得できます
        </p>
      </div>
    ),
    keywords: ["データ分析", "分析", "API", "データ取得", "エラー"],
  },
  {
    id: "auto-1",
    category: "自動化",
    question: "AIによる自動生成の精度を上げるにはどうすればいいですか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>以下の方法で精度を向上できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>具体的な指示</strong>：テーマや目的を明確に指定
            <br />
            <span className="text-muted-foreground text-xs">
              例：「ゲーム実況のShorts台本」ではなく「Apex Legendsのハイライト動画用30秒台本」
            </span>
          </li>
          <li>
            <strong>視聴者層の指定</strong>：ターゲットを明確に
          </li>
          <li>
            <strong>スタイル・トーンの指定</strong>：明るい、真面目、ユーモアなど
          </li>
          <li>
            <strong>過去の成功例を参考</strong>：生成履歴から良い例を参考にする
          </li>
        </ul>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1">💡 ヒント</p>
          <p className="text-xs text-muted-foreground">
            コンテンツスタジオでは、生成履歴を確認して過去の成功例を参考にできます
          </p>
        </div>
      </div>
    ),
    keywords: ["AI", "自動生成", "精度", "改善", "コンテンツ生成"],
  },
  {
    id: "auto-2",
    category: "自動化",
    question: "予約投稿の承認・却下はどのように行いますか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>予約投稿の管理方法：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>自動生成後</strong>：承認ダイアログで内容を確認
          </li>
          <li>
            <strong>承認</strong>：承認ボタンで予約投稿リストに追加
          </li>
          <li>
            <strong>却下</strong>：却下ボタンで却下済みとして記録
          </li>
          <li>
            <strong>編集</strong>：予約投稿リストから編集モーダルで内容を変更可能
          </li>
          <li>
            <strong>ステータス変更</strong>：編集モーダルで承認待ち/承認済み/却下済み/投稿済みを変更可能
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ 承認済みの投稿は指定時間に自動投稿されます
        </p>
      </div>
    ),
    keywords: ["予約投稿", "承認", "却下", "編集", "ステータス"],
  },
  {
    id: "report-1",
    category: "分析・レポート",
    question: "データ分析レポートはどのくらいの頻度で生成されますか？",
    answer: (
      <div className="space-y-3 text-sm">
        <p>レポート生成頻度：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>日次レポート</strong>：毎日23時に自動生成（設定で変更可能）
            <br />
            <span className="text-muted-foreground text-xs">
              → 設定 → データ管理から変更
            </span>
          </li>
          <li>
            <strong>週次レポート</strong>：毎週日曜日に生成
          </li>
          <li>
            <strong>月次レポート</strong>：毎月1日に生成
          </li>
          <li>
            <strong>リアルタイムダッシュボード</strong>：常時更新（ライブモニター、分析画面）
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 生成されたレポートはファイル管理から確認・ダウンロードできます
        </p>
      </div>
    ),
    keywords: ["レポート", "分析", "データ", "生成頻度", "ダッシュボード"],
  },
  {
    id: "report-2",
    category: "分析・レポート",
    question: "ファイル管理機能の使い方を教えてください",
    answer: (
      <div className="space-y-3 text-sm">
        <p>ファイル管理では、生成されたファイルを一元管理できます：</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>検索機能</strong>：ファイル名、タイプ、サイズ、日付で検索
          </li>
          <li>
            <strong>フィルター</strong>：タイプ、サイズ、日付範囲で絞り込み
          </li>
          <li>
            <strong>ソート</strong>：名前、日付、サイズで並び替え
          </li>
          <li>
            <strong>プレビュー</strong>：ファイル詳細を確認
          </li>
          <li>
            <strong>ダウンロード・削除</strong>：ファイルの管理操作
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          💡 ストレージ使用状況もリアルタイムで確認できます
        </p>
      </div>
    ),
    keywords: ["ファイル管理", "検索", "フィルター", "ダウンロード", "ストレージ"],
  },
];

const quickLinks = [
  {
    title: "設定",
    description: "アカウント連携とAPI設定",
    icon: Settings,
    path: "/settings",
    color: "bg-blue-500",
  },
  {
    title: "ライブモニター",
    description: "配信中のリアルタイム監視",
    icon: Radio,
    path: "/live-monitor",
    color: "bg-red-500",
  },
  {
    title: "データ分析",
    description: "YouTube/Xの分析データ",
    icon: BarChart3,
    path: "/analytics",
    color: "bg-green-500",
  },
  {
    title: "コンテンツスタジオ",
    description: "AIによるコンテンツ生成",
    icon: Film,
    path: "/content-studio",
    color: "bg-purple-500",
  },
  {
    title: "投稿サポート",
    description: "X自動投稿と返信",
    icon: Send,
    path: "/post-support",
    color: "bg-cyan-500",
  },
  {
    title: "スケジューラー",
    description: "スケジュール管理",
    icon: Calendar,
    path: "/scheduler",
    color: "bg-orange-500",
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 検索とフィルタリング
  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    // カテゴリフィルター
    if (selectedCategory !== "all") {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }

    // 検索クエリ
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
          (typeof faq.answer === "string"
            ? faq.answer.toLowerCase().includes(query)
            : false)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const categories = [
    { value: "all", label: "すべて" },
    { value: "初期設定", label: "初期設定" },
    { value: "機能説明", label: "機能説明" },
    { value: "自動化", label: "自動化" },
    { value: "分析・レポート", label: "分析・レポート" },
    { value: "トラブルシューティング", label: "トラブルシューティング" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ヘルプ & サポート</h1>
        <p className="text-muted-foreground mt-2">
          よくある質問と機能ガイドで、プロジェクトの使い方を確認できます
        </p>
      </div>

      {/* 検索 */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="質問やキーワードで検索..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              {filteredFAQs.length}件の質問が見つかりました
            </p>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              よくある質問（FAQ）
            </CardTitle>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                該当する質問が見つかりませんでした
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                検索をリセット
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {faq.category}
                      </Badge>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* システム情報 */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            システム情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">バージョン</span>
                <Badge variant="secondary" className="font-mono">v1.0.0</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ビルド日</span>
                <span className="font-medium">2025-11-22</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">対応OS</span>
                <span className="font-medium">Windows 11</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">最終更新</span>
                <span className="font-medium">2025-11-22</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ライセンス</span>
                <Badge variant="outline">Pro</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ステータス</span>
                <Badge variant="default" className="bg-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  正常
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
