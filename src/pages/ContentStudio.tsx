import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Film,
  Video,
  Lightbulb,
  Wand2,
  Copy,
  Download,
  Sparkles,
  Layers,
  Search,
  X,
  Edit,
  History,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShortsScript {
  id: string;
  theme: string;
  duration: number;
  scriptFormat: string;
  tone: string;
  sections: {
    timeRange: string;
    title: string;
    content: string;
  }[];
  generatedAt: string;
}

interface LivePlan {
  id: string;
  type: string;
  title: string;
  durationHours: number;
  durationMinutes: number;
  purposes: string[];
  targetAudience: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  notes: string;
  difficulty?: string;
  flow: {
    timeRange: string;
    title: string;
    content: string;
  }[];
  preparations: string[];
  generatedAt: string;
}

interface Metadata {
  titles: string[];
  description: string;
  hashtags: string[];
  thumbnailText: {
    main: string;
    sub: string;
  };
}

// 充実したShortsテーマリスト
const SHORTS_THEMES = [
  // ゲーム実況系
  "ゲーム実況ハイライト",
  "新作ゲームレビュー",
  "ゲーム攻略",
  "ゲーム裏技",
  "ゲームバグ",
  "ゲームコラボ",
  "ゲーム対戦",
  "ゲームチャレンジ",
  "ゲーム実況の裏話",
  "ゲーム実況の失敗談",
  // ライフスタイル系
  "朝のルーティン",
  "夜のルーティン",
  "日常の一コマ",
  "おすすめアイテム",
  "買い物レビュー",
  "料理",
  "旅行",
  "ペット",
  "部屋紹介",
  "ファッションコーデ",
  // エンタメ系
  "歌ってみた",
  "踊ってみた",
  "コスプレ",
  "メイク",
  "アニメ感想",
  "映画レビュー",
  "ドラマレビュー",
  "音楽レビュー",
  "ライブレポート",
  "イベントレポート",
  // 教育系
  "勉強法",
  "スキルアップ",
  "資格取得",
  "語学学習",
  "プログラミング",
  "デザイン",
  "写真撮影",
  "動画編集",
  // コメディ系
  "面白エピソード",
  "視聴者お悩み相談",
  "クイズ",
  "チャレンジ",
  "リアクション",
  "失敗談",
  "あるある話",
  // その他
  "今週のハイライト",
  "視聴者からの質問",
  "コラボ",
  "企画告知",
  "新機能紹介",
  "アップデート情報",
];

// ライブ形式オプション
const LIVE_FORMATS = ["雑談", "ゲーム", "コラボ", "トーク企画", "歌枠", "ASMR", "Q&A", "特別イベント"];

// 目的オプション
const LIVE_PURPOSES = ["同時接続増加", "チャンネル登録者増加", "視聴維持改善", "交流強化", "収益化"];

// ターゲット層オプション
const TARGET_AUDIENCES_LIVE = [
  "コアファン",
  "新規ユーザー",
  "10代",
  "20代",
  "30代",
  "40代以上",
  "ゲームファン",
];

// 難易度オプション
const DIFFICULTY_OPTIONS = [
  { value: "low", label: "低(易しい)" },
  { value: "medium", label: "中" },
  { value: "high", label: "高(大規模)" },
];

// 動画形式オプション
const VIDEO_FORMATS = ["ショート動画", "通常動画", "ライブ"];

// 目的オプション
const METADATA_PURPOSES = ["同時接続増加", "登録者増加", "発見性向上", "視聴維持改善"];

// スクリプト形式の選択肢
const SCRIPT_FORMATS = [
  "解説・教育",
  "物語・ストーリー",
  "リスト・ランキング",
  "How-to",
  "レビュー・紹介",
  "エンターテインメント・雑談",
] as const;

// トーンの選択肢
const TONES = [
  "明るい（賑やか・フレンドリー）",
  "自信のある（プロフェッショナル）",
  "フォーマル（丁寧・かたい印象）",
  "カジュアル（親しみやすい）",
  "ユーモラス（軽い・ユーモアを含む）",
  "シリアス（落ち着いた・真剣な雰囲気）",
] as const;

// スクリプト形式に基づくテンプレート
const SCRIPT_FORMAT_TEMPLATES: Record<
  string,
  {
    opener: (theme: string, tone: string) => string;
    main: (theme: string, tone: string) => string;
    closer: (tone: string) => string;
  }
> = {
  "解説・教育": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}について、わかりやすく解説します！」`;
      if (tone.includes("自信のある")) return `「${theme}の本質を、プロの視点で解説します」`;
      if (tone.includes("フォーマル")) return `「本日は${theme}について、詳しくご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}について、一緒に学んでいきましょう！」`;
      if (tone.includes("ユーモラス")) return `「${theme}を面白おかしく解説してみます！」`;
      return `「${theme}について、真剣に考えてみましょう」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「ポイントは3つ！①基礎知識 ②実践方法 ③応用テクニック。${theme}をマスターしましょう！」`;
      if (tone.includes("自信のある")) return `「重要な要素は3点。第一に基礎理論、第二に実践的アプローチ、第三に応用展開。${theme}の本質を理解しましょう」`;
      if (tone.includes("フォーマル")) return `「${theme}において重要な点は、基礎理解、実践方法、応用展開の3点です。順を追ってご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のコツは3つ。基礎を押さえて、実践して、応用する。一緒にやってみましょう！」`;
      if (tone.includes("ユーモラス")) return `「${theme}の秘密は3つ！①基礎 ②実践 ③応用。でも実は、コツさえ掴めば簡単なんです（笑）」`;
      return `「${theme}を深く理解するには、基礎理論、実践方法、応用展開の3段階が重要です」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「理解できたら高評価お願いします！質問はコメント欄へ！」";
      if (tone.includes("自信のある")) return "「本日の内容を実践に活かしてください。ご質問はコメント欄でお受けします」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。ご質問がございましたら、コメント欄にてお願いいたします」";
      if (tone.includes("カジュアル")) return "「参考になったら高評価お願いします！質問もお気軽にどうぞ」";
      if (tone.includes("ユーモラス")) return "「役に立ったら高評価とチャンネル登録お願いします！次回もお楽しみに！」";
      return "「ご視聴ありがとうございました。ご質問はコメント欄でお受けします」";
  },
  },
  "物語・ストーリー": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}の物語を、楽しくお届けします！」`;
      if (tone.includes("自信のある")) return `「${theme}というテーマで、一つの物語を紡ぎます」`;
      if (tone.includes("フォーマル")) return `「${theme}をテーマにした物語を、ご紹介いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}の話、聞いてくれる？」`;
      if (tone.includes("ユーモラス")) return `「${theme}の面白い話、始まりますよ〜！」`;
      return `「${theme}について、真剣に語りたいと思います」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}の物語は、こんな展開に...。驚きの結末が待っています！」`;
      if (tone.includes("自信のある")) return `「${theme}というテーマを通じて、物語の核心に迫ります。展開は予想外の方向へ...」`;
      if (tone.includes("フォーマル")) return `「${theme}を軸に、物語が展開していきます。重要な転換点が訪れます」`;
      if (tone.includes("カジュアル")) return `「${theme}の話、実はこんなことがあって...。びっくりするよ！」`;
      if (tone.includes("ユーモラス")) return `「${theme}の話、まさかこんな展開になるとは（笑）。でも面白いでしょ？」`;
      return `「${theme}について、深く掘り下げた物語を語ります。重要なメッセージが込められています」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「面白かったら高評価お願いします！次回もお楽しみに！」";
      if (tone.includes("自信のある")) return "「物語の続きは、チャンネル登録でお楽しみください」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。次回もお楽しみに」";
      if (tone.includes("カジュアル")) return "「どうだった？高評価とチャンネル登録お願いします！」";
      if (tone.includes("ユーモラス")) return "「面白かったら高評価とチャンネル登録！次回も笑える話を用意するね！」";
      return "「ご視聴ありがとうございました。次回もお楽しみに」";
    },
  },
  "リスト・ランキング": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}のランキングTOP3を発表します！」`;
      if (tone.includes("自信のある")) return `「${theme}について、厳選したランキングをご紹介します」`;
      if (tone.includes("フォーマル")) return `「${theme}に関するランキングを、ご紹介いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のランキング、気になるでしょ？」`;
      if (tone.includes("ユーモラス")) return `「${theme}のランキング、予想外の結果かも！？」`;
      return `「${theme}について、重要な項目をランキング形式でご紹介します」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「第3位は...、第2位は...、そして第1位は${theme}のこれ！理由も解説します！」`;
      if (tone.includes("自信のある")) return `「${theme}のランキング。第3位から順に、データに基づいた分析とともにご紹介します」`;
      if (tone.includes("フォーマル")) return `「${theme}に関するランキングを、第3位から順にご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のランキング、3位から1位まで一気に紹介するね！」`;
      if (tone.includes("ユーモラス")) return `「${theme}のランキング、3位から1位まで！予想外の結果かも（笑）」`;
      return `「${theme}について、第3位から第1位まで、重要な順にご紹介します」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「ランキングどうだった？高評価とチャンネル登録お願いします！」";
      if (tone.includes("自信のある")) return "「ランキングの詳細は、チャンネル登録で続きをお楽しみください」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。次回もお楽しみに」";
      if (tone.includes("カジュアル")) return "「どうだった？高評価お願いします！」";
      if (tone.includes("ユーモラス")) return "「ランキング面白かった？高評価とチャンネル登録お願いします！」";
      return "「ご視聴ありがとうございました。次回もお楽しみに」";
    },
  },
  "How-to": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}のやり方、簡単に説明します！」`;
      if (tone.includes("自信のある")) return `「${theme}を実現するための、効果的な方法をご紹介します」`;
      if (tone.includes("フォーマル")) return `「${theme}の方法について、詳しくご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のやり方、一緒にやってみよう！」`;
      if (tone.includes("ユーモラス")) return `「${theme}のやり方、実は簡単なんです（笑）！」`;
      return `「${theme}について、正しい手順をご説明します」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}のステップは3つ！①準備 ②実践 ③仕上げ。順番にやってみましょう！」`;
      if (tone.includes("自信のある")) return `「${theme}を実現するには、準備、実践、仕上げの3段階が重要です。各段階のポイントを解説します」`;
      if (tone.includes("フォーマル")) return `「${theme}の手順は、準備、実践、仕上げの3段階に分かれます。順を追ってご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のやり方、3ステップでできるよ！①準備 ②実践 ③仕上げ」`;
      if (tone.includes("ユーモラス")) return `「${theme}のやり方、実は3ステップだけ！①準備 ②実践 ③仕上げ（簡単でしょ？）」`;
      return `「${theme}を実現するには、準備、実践、仕上げの3段階を順に実行することが重要です」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「できたら高評価お願いします！質問はコメント欄へ！」";
      if (tone.includes("自信のある")) return "「実践してみてください。ご質問はコメント欄でお受けします」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。ご質問がございましたら、コメント欄にてお願いいたします」";
      if (tone.includes("カジュアル")) return "「やってみてね！質問もお気軽にどうぞ」";
      if (tone.includes("ユーモラス")) return "「できたら高評価お願いします！次回もお楽しみに！」";
      return "「ご視聴ありがとうございました。ご質問はコメント欄でお受けします」";
    },
  },
  "レビュー・紹介": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}をレビューします！気になるでしょ？」`;
      if (tone.includes("自信のある")) return `「${theme}について、詳細なレビューをお届けします」`;
      if (tone.includes("フォーマル")) return `「${theme}に関するレビューを、ご紹介いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のレビュー、聞いてくれる？」`;
      if (tone.includes("ユーモラス")) return `「${theme}のレビュー、正直に言います（笑）！」`;
      return `「${theme}について、真剣にレビューします」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}の良い点、悪い点、そして総合評価をお伝えします！参考になるよ！」`;
      if (tone.includes("自信のある")) return `「${theme}について、メリット、デメリット、総合評価の3点から分析します」`;
      if (tone.includes("フォーマル")) return `「${theme}の特徴を、メリット、デメリット、総合評価の観点からご説明いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}のレビュー、良い点と悪い点、そして総合評価をまとめたよ！」`;
      if (tone.includes("ユーモラス")) return `「${theme}のレビュー、正直に言うと...（笑）。でも参考になるよ！」`;
      return `「${theme}について、メリット、デメリット、総合評価の3点から、客観的にレビューします」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「参考になったら高評価お願いします！質問はコメント欄へ！」";
      if (tone.includes("自信のある")) return "「レビューの詳細は、チャンネル登録で続きをお楽しみください」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。次回もお楽しみに」";
      if (tone.includes("カジュアル")) return "「どうだった？高評価お願いします！」";
      if (tone.includes("ユーモラス")) return "「参考になったら高評価とチャンネル登録お願いします！」";
      return "「ご視聴ありがとうございました。次回もお楽しみに」";
    },
  },
  "エンターテインメント・雑談": {
    opener: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}について、楽しくお話しします！」`;
      if (tone.includes("自信のある")) return `「${theme}というテーマで、エンターテインメントをお届けします」`;
      if (tone.includes("フォーマル")) return `「${theme}について、お話しさせていただきます」`;
      if (tone.includes("カジュアル")) return `「${theme}の話、聞いてくれる？」`;
      if (tone.includes("ユーモラス")) return `「${theme}の話、面白いから聞いてよ〜！」`;
      return `「${theme}について、真剣に語りたいと思います」`;
    },
    main: (theme, tone) => {
      if (tone.includes("明るい")) return `「${theme}について、こんなことがあって...。面白いエピソードが盛りだくさん！」`;
      if (tone.includes("自信のある")) return `「${theme}というテーマで、エンターテインメント性の高い内容をお届けします」`;
      if (tone.includes("フォーマル")) return `「${theme}について、興味深い話題をいくつかご紹介いたします」`;
      if (tone.includes("カジュアル")) return `「${theme}の話、実はこんなことがあって...。聞いてよ！」`;
      if (tone.includes("ユーモラス")) return `「${theme}の話、まさかこんなことが（笑）。でも面白いでしょ？」`;
      return `「${theme}について、深く掘り下げた内容をお届けします」`;
    },
    closer: (tone) => {
      if (tone.includes("明るい")) return "「楽しんでくれたら高評価お願いします！次回もお楽しみに！」";
      if (tone.includes("自信のある")) return "「エンターテインメントの続きは、チャンネル登録でお楽しみください」";
      if (tone.includes("フォーマル")) return "「ご視聴ありがとうございました。次回もお楽しみに」";
      if (tone.includes("カジュアル")) return "「どうだった？高評価とチャンネル登録お願いします！」";
      if (tone.includes("ユーモラス")) return "「面白かったら高評価とチャンネル登録！次回も笑える話を用意するね！」";
      return "「ご視聴ありがとうございました。次回もお楽しみに」";
    },
  },
};


const META_TAG_BASES = ["#VTuber", "#ライブ配信", "#コンテンツ制作"];

export default function ContentStudio() {
  // Shorts台本の状態
  const [shortsTheme, setShortsTheme] = useState("");
  const [shortsDuration, setShortsDuration] = useState("30");
  const [shortsScriptFormat, setShortsScriptFormat] = useState<string>(SCRIPT_FORMATS[0]);
  const [shortsTone, setShortsTone] = useState<string>(TONES[0]);
  const [shortsDetailLevel, setShortsDetailLevel] = useState<string>("standard");
  const [shortsScript, setShortsScript] = useState<ShortsScript | null>(null);
  const [isGeneratingShorts, setIsGeneratingShorts] = useState(false);
  const [shortsThemeOpen, setShortsThemeOpen] = useState(false);
  const [shortsThemeSearch, setShortsThemeSearch] = useState("");
  const [shortsHistory, setShortsHistory] = useState<ShortsScript[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSectionContent, setEditingSectionContent] = useState<string>("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ShortsScript | null>(null);

  // ライブ企画の状態
  const [liveType, setLiveType] = useState("雑談");
  const [liveTitle, setLiveTitle] = useState("");
  const [liveDurationHours, setLiveDurationHours] = useState("0");
  const [liveDurationMinutes, setLiveDurationMinutes] = useState("60");
  const [livePurposes, setLivePurposes] = useState<string[]>([]);
  const [liveTargetAudience, setLiveTargetAudience] = useState("");
  const [livePreferredTimeStart, setLivePreferredTimeStart] = useState("");
  const [livePreferredTimeEnd, setLivePreferredTimeEnd] = useState("");
  const [liveNotes, setLiveNotes] = useState("");
  const [liveDifficulty, setLiveDifficulty] = useState<string>("");
  const [livePlan, setLivePlan] = useState<LivePlan | null>(null);
  const [isGeneratingLive, setIsGeneratingLive] = useState(false);
  const [liveHistory, setLiveHistory] = useState<LivePlan[]>([]);
  const [selectedLiveHistoryItem, setSelectedLiveHistoryItem] = useState<LivePlan | null>(null);
  const [isEditingLivePlan, setIsEditingLivePlan] = useState(false);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);
  const [editingFlowContent, setEditingFlowContent] = useState<string>("");

  // メタデータの状態
  const [scriptSummary, setScriptSummary] = useState("");
  const [videoFormat, setVideoFormat] = useState("");
  const [metadataPurposes, setMetadataPurposes] = useState<string[]>([]);
  const [channelSummary, setChannelSummary] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

  // API Base URL
  // Use empty string for relative URLs (proxy will handle routing)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  // Shorts台本生成
  const handleGenerateShortsScript = async () => {
    if (!shortsTheme.trim()) {
      toast.error("テーマ・トピックを入力してください");
      return;
    }

      const duration = parseInt(shortsDuration) || 30;
    if (duration < 5 || duration > 60) {
      toast.error("時間は5〜60秒の範囲で入力してください");
      return;
    }

    setIsGeneratingShorts(true);
    setIsEditingScript(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/shorts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        theme: shortsTheme,
          duration: duration,
          scriptFormat: shortsScriptFormat,
          tone: shortsTone,
          detailLevel: shortsDetailLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "台本生成に失敗しました" }));
        throw new Error(errorData.detail || "台本生成に失敗しました");
      }

      const data = await response.json();
      
      const newScript: ShortsScript = {
        id: data.id,
        theme: data.theme,
        duration: data.duration,
        scriptFormat: data.scriptFormat,
        tone: data.tone,
        sections: data.sections.map((s: any) => ({
          timeRange: s.timeRange,
          title: s.title,
          content: s.content,
        })),
        generatedAt: data.generatedAt,
      };

      setShortsScript(newScript);
      await fetchShortsHistory();
      setIsGeneratingShorts(false);
      toast.success("Shorts台本を生成しました");
    } catch (error) {
      console.error("Shorts台本生成エラー:", error);
      toast.error(error instanceof Error ? error.message : "台本生成に失敗しました");
      setIsGeneratingShorts(false);
    }
  };

  // 台本の再編集
  const handleEditScript = () => {
    if (!shortsScript) return;
    setIsEditingScript(true);
    setShortsTheme(shortsScript.theme);
    setShortsDuration(shortsScript.duration.toString());
    setShortsScriptFormat(shortsScript.scriptFormat);
    setShortsTone(shortsScript.tone);
    setShortsDetailLevel("standard"); // Default for editing
  };
  
  // 編集内容の保存
  const handleSaveEditedScript = async () => {
    if (!shortsScript) return;
    
    const duration = parseInt(shortsDuration) || 30;
    if (duration < 5 || duration > 60) {
      toast.error("時間は5〜60秒の範囲で入力してください");
      return;
    }

    setIsGeneratingShorts(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/shorts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: shortsTheme,
          duration: duration,
          scriptFormat: shortsScriptFormat,
          tone: shortsTone,
          detailLevel: shortsDetailLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "台本更新に失敗しました" }));
        throw new Error(errorData.detail || "台本更新に失敗しました");
      }

      const data = await response.json();
      
      const updatedScript: ShortsScript = {
        id: data.id,
        theme: data.theme,
        duration: data.duration,
        scriptFormat: data.scriptFormat,
        tone: data.tone,
        sections: data.sections.map((s: any) => ({
          timeRange: s.timeRange,
          title: s.title,
          content: s.content,
        })),
        generatedAt: data.generatedAt,
      };

      setShortsScript(updatedScript);
      await fetchShortsHistory();
      setIsEditingScript(false);
      setIsGeneratingShorts(false);
      toast.success("台本を更新しました");
    } catch (error) {
      console.error("台本更新エラー:", error);
      toast.error(error instanceof Error ? error.message : "台本更新に失敗しました");
      setIsGeneratingShorts(false);
    }
  };

  // セクション編集開始
  const handleStartEditSection = (index: number) => {
    if (!shortsScript) return;
    setEditingSectionIndex(index);
    setEditingSectionContent(shortsScript.sections[index].content);
  };

  // セクション編集保存
  const handleSaveSection = () => {
    if (!shortsScript || editingSectionIndex === null) return;
    
    const updatedSections = [...shortsScript.sections];
    updatedSections[editingSectionIndex] = {
      ...updatedSections[editingSectionIndex],
      content: editingSectionContent,
    };

    const updatedScript: ShortsScript = {
      ...shortsScript,
      sections: updatedSections,
    };

    setShortsScript(updatedScript);
    // Note: Section edits are local only, not saved to DB
    setEditingSectionIndex(null);
    setEditingSectionContent("");
    toast.success("セクションを更新しました");
  };

  // セクション編集キャンセル
  const handleCancelSectionEdit = () => {
    setEditingSectionIndex(null);
    setEditingSectionContent("");
  };

  // 履歴アイテムを詳細表示（アコーディオン形式）
  const handleViewHistoryDetail = (item: ShortsScript) => {
    // 同じアイテムを再クリックした場合は詳細を閉じる
    if (selectedHistoryItem?.id === item.id) {
      setSelectedHistoryItem(null);
      setShortsScript(null);
      return;
    }
    
    // 新しいアイテムを選択して詳細を表示
    setSelectedHistoryItem(item);
    setShortsScript(item);
    setShortsTheme(item.theme);
    setShortsDuration(item.duration.toString());
    setShortsScriptFormat(item.scriptFormat);
    setShortsTone(item.tone);
    setIsEditingScript(false);
  };

  // 履歴をAPIから取得
  const fetchShortsHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/shorts/`);
      if (response.ok) {
        const data = await response.json();
        setShortsHistory(data.scripts.map((item: any) => ({
          id: item.id,
          theme: item.theme,
          duration: item.duration,
          scriptFormat: item.scriptFormat,
          tone: item.tone,
          sections: item.sections.map((s: any) => ({
            timeRange: s.timeRange,
            title: s.title,
            content: s.content,
          })),
          generatedAt: item.generatedAt,
        })));
      }
    } catch (error) {
      console.error("履歴取得エラー:", error);
    }
  };

  // 台本を削除
  const handleDeleteScript = async (scriptId: string) => {
    if (!confirm("この台本を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/shorts/${scriptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("台本の削除に失敗しました");
      }

      // 削除された台本が現在表示中の場合はクリア
      if (shortsScript?.id === scriptId) {
        setShortsScript(null);
        setSelectedHistoryItem(null);
      }
      
      await fetchShortsHistory();
      toast.success("台本を削除しました");
    } catch (error) {
      console.error("台本削除エラー:", error);
      toast.error(error instanceof Error ? error.message : "台本削除に失敗しました");
    }
  };

  // コンポーネントマウント時に履歴を取得
  useEffect(() => {
    fetchShortsHistory();
    fetchLiveHistory();
  }, []);

  const generateShortsSections = (duration: number, scriptFormat: string, tone: string, theme: string) => {
    const template = SCRIPT_FORMAT_TEMPLATES[scriptFormat] ?? SCRIPT_FORMAT_TEMPLATES["解説・教育"];
    const sections = [];
    const openingDuration = Math.min(7, Math.max(3, Math.floor(duration * 0.2)));
    const closingDuration = Math.min(6, Math.max(3, Math.floor(duration * 0.15)));
    const mainDuration = Math.max(10, duration - openingDuration - closingDuration);

    sections.push({
      timeRange: `0-${openingDuration}秒`,
      title: "オープニング",
      content: template.opener(theme, tone),
    });

    sections.push({
      timeRange: `${openingDuration}-${openingDuration + mainDuration}秒`,
      title: "メインコンテンツ",
      content: template.main(theme, tone),
    });

    sections.push({
      timeRange: `${openingDuration + mainDuration}-${duration}秒`,
      title: "クロージング",
      content: template.closer(tone),
    });

    return sections;
  };

  // ライブ企画生成
  const handleGenerateLivePlan = async () => {
    // バリデーション
    if (!liveTitle.trim()) {
      toast.error("ライブタイトルを入力してください");
      return;
    }
    if (!liveType) {
      toast.error("ライブ形式を選択してください");
      return;
    }
    if (livePurposes.length === 0) {
      toast.error("目的を1つ以上選択してください");
      return;
    }
    if (!liveTargetAudience) {
      toast.error("ターゲット層を選択してください");
      return;
    }

    const totalMinutes = parseInt(liveDurationHours) * 60 + parseInt(liveDurationMinutes);
    if (totalMinutes < 10 || totalMinutes > 480) {
      toast.error("予定ライブ時間は10分以上480分以下で入力してください");
      return;
    }

    setIsGeneratingLive(true);
    setIsEditingLivePlan(false);
    
    try {
      // 数値変換（NaNを防ぐため、デフォルト値を設定）
      const hours = parseInt(liveDurationHours) || 0;
      const minutes = parseInt(liveDurationMinutes) || 0;
      
      // タイムアウト付きfetch（60秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/live-plan/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            type: liveType,
            title: liveTitle,
            duration_hours: hours,
            duration_minutes: minutes,
            purposes: livePurposes,
            target_audience: liveTargetAudience,
            preferred_time_start: livePreferredTimeStart || null,
            preferred_time_end: livePreferredTimeEnd || null,
            notes: liveNotes || null,
            difficulty: liveDifficulty || null,
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "企画案生成に失敗しました" }));
          
          // FastAPIの422エラーレスポンス形式に対応
          let errorMessage = "企画案生成に失敗しました";
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // バリデーションエラーの場合
              const errors = errorData.detail.map((err: any) => {
                const field = err.loc ? err.loc.join(".") : "";
                const msg = err.msg || "";
                return `${field}: ${msg}`;
              }).join(", ");
              errorMessage = `入力データに誤りがあります: ${errors}`;
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        const plan: LivePlan = {
          id: data.id,
          type: data.type,
          title: data.title,
          durationHours: data.duration_hours,
          durationMinutes: data.duration_minutes,
          purposes: data.purposes,
          targetAudience: data.target_audience,
          preferredTimeStart: data.preferred_time_start,
          preferredTimeEnd: data.preferred_time_end,
          notes: data.notes,
          difficulty: data.difficulty,
          flow: data.flow.map((f: any) => ({
            timeRange: f.time_range,
            title: f.title,
            content: f.content,
          })),
          preparations: data.preparations,
          generatedAt: data.generated_at,
        };

      setLivePlan(plan);
        await fetchLiveHistory();
      setIsGeneratingLive(false);
      toast.success("ライブ企画案を生成しました");
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("リクエストがタイムアウトしました。時間をおいて再度お試しください。");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("ライブ企画案生成エラー:", error);
      toast.error(error instanceof Error ? error.message : "企画案生成に失敗しました");
      setIsGeneratingLive(false);
    }
  };

  // 目的のチェックボックス変更
  const handlePurposeChange = (purpose: string, checked: boolean) => {
    if (checked) {
      setLivePurposes((prev) => [...prev, purpose]);
    } else {
      setLivePurposes((prev) => prev.filter((p) => p !== purpose));
    }
  };

  // 履歴アイテムを詳細表示
  const handleViewLiveHistoryDetail = (item: LivePlan) => {
    if (selectedLiveHistoryItem?.id === item.id) {
      setSelectedLiveHistoryItem(null);
      setLivePlan(null);
      return;
    }
    setSelectedLiveHistoryItem(item);
    setLivePlan(item);
    setIsEditingLivePlan(false);
  };

  // ライブ企画の編集
  const handleEditLivePlan = () => {
    if (!livePlan) return;
    setIsEditingLivePlan(true);
    setLiveType(livePlan.type);
    setLiveTitle(livePlan.title);
    setLiveDurationHours(livePlan.durationHours.toString());
    setLiveDurationMinutes(livePlan.durationMinutes.toString());
    setLivePurposes(livePlan.purposes);
    setLiveTargetAudience(livePlan.targetAudience);
    setLivePreferredTimeStart(livePlan.preferredTimeStart || "");
    setLivePreferredTimeEnd(livePlan.preferredTimeEnd || "");
    setLiveNotes(livePlan.notes);
    setLiveDifficulty(livePlan.difficulty || "");
  };

  // ライブ企画履歴の取得
  const fetchLiveHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/live-plan/`);
      if (response.ok) {
        const data = await response.json();
        setLiveHistory(data.plans.map((item: any) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          durationHours: item.duration_hours,
          durationMinutes: item.duration_minutes,
          purposes: item.purposes,
          targetAudience: item.target_audience,
          preferredTimeStart: item.preferred_time_start,
          preferredTimeEnd: item.preferred_time_end,
          notes: item.notes,
          difficulty: item.difficulty,
          flow: item.flow.map((f: any) => ({
            timeRange: f.time_range,
            title: f.title,
            content: f.content,
          })),
          preparations: item.preparations,
          generatedAt: item.generated_at,
        })));
      }
    } catch (error) {
      console.error("履歴取得エラー:", error);
    }
  };

  // ライブ企画の削除
  const handleDeleteLivePlan = async (planId: string) => {
    if (!confirm("この企画案を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/live-plan/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("企画案の削除に失敗しました");
      }

      // 削除された企画案が現在表示中の場合はクリア
      if (livePlan?.id === planId) {
        setLivePlan(null);
        setSelectedLiveHistoryItem(null);
      }
      
      await fetchLiveHistory();
      toast.success("企画案を削除しました");
    } catch (error) {
      console.error("企画案削除エラー:", error);
      toast.error(error instanceof Error ? error.message : "企画案削除に失敗しました");
    }
  };

  // セクション編集開始
  const handleStartEditFlowSection = (index: number) => {
    if (!livePlan) return;
    setEditingFlowIndex(index);
    setEditingFlowContent(livePlan.flow[index].content);
  };

  // セクション編集保存
  const handleSaveFlowSection = () => {
    if (!livePlan || editingFlowIndex === null) return;
    
    const updatedFlow = [...livePlan.flow];
    updatedFlow[editingFlowIndex] = {
      ...updatedFlow[editingFlowIndex],
      content: editingFlowContent,
    };

    const updatedPlan: LivePlan = {
      ...livePlan,
      flow: updatedFlow,
    };

    setLivePlan(updatedPlan);
    // 履歴も更新
    setLiveHistory((prev) =>
      prev.map((p) => (p.id === livePlan.id ? updatedPlan : p))
    );
    setEditingFlowIndex(null);
    setEditingFlowContent("");
    toast.success("セクションを更新しました");
  };

  // セクション編集キャンセル
  const handleCancelFlowEdit = () => {
    setEditingFlowIndex(null);
    setEditingFlowContent("");
  };

  // 目的のチェックボックス変更
  const handleMetadataPurposeChange = (purpose: string, checked: boolean) => {
    if (checked) {
      setMetadataPurposes((prev) => [...prev, purpose]);
    } else {
      setMetadataPurposes((prev) => prev.filter((p) => p !== purpose));
    }
  };

  // メタデータ生成
  const handleGenerateMetadata = async () => {
    if (!scriptSummary.trim()) {
      toast.error("脚本要約を入力してください");
      return;
    }
    if (!videoFormat) {
      toast.error("動画形式を選択してください");
      return;
    }
    if (metadataPurposes.length === 0) {
      toast.error("目的を1つ以上選択してください");
      return;
    }

    setIsGeneratingMetadata(true);
    
    // タイムアウト設定（60秒）
    const timeoutId = setTimeout(() => {
      setIsGeneratingMetadata(false);
      toast.error("リクエストがタイムアウトしました。バックエンドサーバーが起動しているか確認してください。");
    }, 60000);

    // AbortController for timeout
    const abortController = new AbortController();
    const abortTimeoutId = setTimeout(() => abortController.abort(), 60000);

    try {
      const requestBody = {
        script_summary: scriptSummary,
        video_format: videoFormat,
        purposes: metadataPurposes,
        channel_summary: channelSummary || null,
        forbidden_words: forbiddenWords || null,
      };

      const apiUrl = API_BASE_URL 
        ? `${API_BASE_URL}/api/v1/metadata/generate`
        : "/api/v1/metadata/generate";
      
      console.log("メタデータ生成リクエスト:", {
        apiBaseUrl: API_BASE_URL || "(プロキシ使用: /api -> http://localhost:8000)",
        url: apiUrl,
        method: "POST",
        body: requestBody,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(abortTimeoutId);

      console.log("メタデータ生成レスポンス:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorMessage = "メタデータ生成に失敗しました";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          console.error("エラーレスポンス:", errorData);
        } catch (parseError) {
          console.error("エラーレスポンスの解析に失敗:", parseError);
          const errorText = await response.text().catch(() => "");
          console.error("エラーレスポンス本文:", errorText);
          errorMessage = `サーバーエラー (${response.status}): ${errorText || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("メタデータ生成成功:", data);
      
      const metadata: Metadata = {
        titles: data.titles,
        description: data.description,
        hashtags: data.hashtags,
      thumbnailText: {
          main: data.thumbnail_text.main,
          sub: data.thumbnail_text.sub,
        },
      };

      setMetadata(metadata);
      setIsGeneratingMetadata(false);
      toast.success("メタデータを生成しました");
    } catch (error) {
      clearTimeout(timeoutId);
      clearTimeout(abortTimeoutId);
      setIsGeneratingMetadata(false);
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error("リクエストがタイムアウトしました");
          toast.error("リクエストがタイムアウトしました。バックエンドサーバーが起動しているか確認してください。");
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          console.error("ネットワークエラー:", error);
          toast.error("ネットワークエラーが発生しました。バックエンドサーバーが起動しているか確認してください。");
        } else {
          console.error("メタデータ生成エラー:", error);
          toast.error(error.message || "メタデータ生成に失敗しました");
        }
      } else {
        console.error("予期しないエラー:", error);
        toast.error("メタデータ生成に失敗しました");
      }
    }
  };


  // コピー機能
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}をクリップボードにコピーしました`);
      console.log(`コピー: ${label}`);
    } catch (err) {
      toast.error("クリップボードへのコピーに失敗しました");
      console.error("コピーエラー:", err);
    }
  };

  // ダウンロード機能
  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}をダウンロードしました`);
    console.log(`ダウンロード: ${filename}`);
  };

  // フィルタリング関数
  const filteredShortsThemes = SHORTS_THEMES.filter((theme) =>
    theme.toLowerCase().includes(shortsThemeSearch.toLowerCase())
  );

  return (
    <div className="min-h-[100vh] space-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">コンテンツスタジオ</h1>
        <p className="text-sm text-muted-foreground">
          Shorts台本 / ライブ企画 / メタタグをワンストップ生成
        </p>
      </div>

      <Tabs defaultValue="shorts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 gap-2 h-12">
          <TabsTrigger value="shorts" className="flex items-center gap-2 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Video className="h-5 w-5" />
            Shorts台本
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Film className="h-5 w-5" />
            ライブ企画
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2 text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Lightbulb className="h-5 w-5" />
            メタデータ生成
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shorts" className="space-y-6 min-h-[calc(100vh-200px)]">
          {/* ① 最上部セクション：設定入力 */}
            <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Shorts台本設定</CardTitle>
              <p className="text-sm text-muted-foreground">
                テーマ、スクリプト形式、トーンを選択して台本を生成します
                </p>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* テーマ・トピック入力 */}
                <div>
                <Label htmlFor="shorts-theme" className="text-sm font-medium mb-2 block">
                  テーマ・トピック
                </Label>
                    <Input
                      id="shorts-theme"
                      value={shortsTheme}
                      onChange={(e) => setShortsTheme(e.target.value)}
                      placeholder="例: 逆転勝利の瞬間 / 新作ゲームレビュー"
                  className="w-full"
                  disabled={isEditingScript}
                />
              </div>

              {/* スクリプト形式、トーン、詳細度の選択 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shorts-format" className="text-sm font-medium mb-2 block">
                    スクリプト形式
                  </Label>
                  <select
                    id="shorts-format"
                    value={shortsScriptFormat}
                    onChange={(e) => setShortsScriptFormat(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isEditingScript}
                  >
                    {SCRIPT_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                  </div>
                <div>
                  <Label htmlFor="shorts-tone" className="text-sm font-medium mb-2 block">
                    トーン
                  </Label>
                  <select
                    id="shorts-tone"
                    value={shortsTone}
                    onChange={(e) => setShortsTone(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isEditingScript}
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                  </div>
                  <div>
                  <Label htmlFor="shorts-detail" className="text-sm font-medium mb-2 block">
                    詳細度
                  </Label>
                  <select
                    id="shorts-detail"
                    value={shortsDetailLevel}
                    onChange={(e) => setShortsDetailLevel(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isEditingScript}
                  >
                    <option value="concise">簡潔（短め）</option>
                    <option value="standard">標準</option>
                    <option value="detailed">詳細（長め）</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {shortsDetailLevel === "concise" && "要点を簡潔にまとめた台本"}
                    {shortsDetailLevel === "standard" && "標準的な詳細度の台本"}
                    {shortsDetailLevel === "detailed" && "より詳細で充実した台本"}
                  </p>
                  </div>
                </div>

              {/* 時間入力と生成ボタン */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="shorts-duration" className="text-sm font-medium mb-2 block">
                    時間（秒）
                  </Label>
                    <Input
                      id="shorts-duration"
                      type="number"
                      value={shortsDuration}
                      onChange={(e) => setShortsDuration(e.target.value)}
                      placeholder="30"
                    min="5"
                      max="60"
                    className="w-full"
                    disabled={isEditingScript}
                    />
                  <p className="text-xs text-muted-foreground mt-1">5〜60秒の範囲で入力してください</p>
                  </div>
                {isEditingScript ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEditedScript}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingScript(false);
                        if (shortsScript) {
                          setShortsTheme(shortsScript.theme);
                          setShortsDuration(shortsScript.duration.toString());
                          setShortsScriptFormat(shortsScript.scriptFormat);
                          setShortsTone(shortsScript.tone);
                        }
                      }}
                    >
                      キャンセル
                    </Button>
                  </div>
                ) : (
                <Button
                  onClick={handleGenerateShortsScript}
                  disabled={isGeneratingShorts || !shortsTheme.trim()}
                    className="bg-primary hover:bg-primary/90"
                    size="lg"
                >
                  {isGeneratingShorts ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      台本を自動生成
                    </>
                  )}
                </Button>
                )}
              </div>
              </CardContent>
            </Card>

          {/* ② 中央セクション：生成された台本ビュー */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle className="text-lg">生成された台本</CardTitle>
                  {shortsScript && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {shortsScript.duration}秒・{shortsScript.scriptFormat}・{shortsScript.tone}
                    </p>
                  )}
                </div>
              {shortsScript && !isEditingScript && (
                  <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditScript}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    再編集
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fullScript = shortsScript.sections
                          .map((s) => `[${s.timeRange}] ${s.title}\n${s.content}`)
                          .join("\n\n");
                        handleCopy(fullScript, "台本");
                      }}
                    >
                    <Copy className="h-4 w-4 mr-2" />
                    コピー
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fullScript = shortsScript.sections
                          .map((s) => `[${s.timeRange}] ${s.title}\n${s.content}`)
                          .join("\n\n");
                        handleDownload(
                          fullScript,
                          `shorts-script-${shortsScript.id}.txt`
                        );
                      }}
                    >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                    </Button>
                  </div>
                )}
              </CardHeader>
            <CardContent>
                {shortsScript ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {shortsScript.sections.map((section, index) => (
                    <div key={index} className="rounded-lg border border-border/60 p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{section.timeRange}</Badge>
                          <span className="text-sm font-semibold">{section.title}</span>
                        </div>
                        {editingSectionIndex === index ? (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleSaveSection}
                              className="h-7 px-3 text-xs"
                            >
                              <Save className="h-3 w-3 mr-1" />
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelSectionEdit}
                              className="h-7 px-3 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              キャンセル
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEditSection(index)}
                            className="h-7 px-3 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            編集
                          </Button>
                        )}
                      </div>
                      {editingSectionIndex === index ? (
                        <Textarea
                          value={editingSectionContent}
                          onChange={(e) => setEditingSectionContent(e.target.value)}
                          className="min-h-[100px] text-sm"
                          placeholder="セクションの内容を編集してください"
                        />
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      )}
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">テーマを入力して「台本を自動生成」を押してください</p>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* ③ 下部セクション：台本生成履歴 */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <CardTitle className="text-lg">生成履歴</CardTitle>
                <Badge variant="outline" className="text-xs">
                {shortsHistory.length} 件
              </Badge>
              </div>
              {shortsHistory.length > 0 && (
                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="タイトルで検索..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
                {shortsHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">まだ履歴がありません</p>
                </div>
                ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {shortsHistory
                    .filter((item) =>
                      item.theme.toLowerCase().includes(historySearchQuery.toLowerCase())
                    )
                    .map((item) => (
                    <div
                      key={item.id}
                        className={`border border-border/60 rounded-lg p-4 transition-all cursor-pointer ${
                          selectedHistoryItem?.id === item.id
                            ? "bg-primary/10 border-primary/50 shadow-sm"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => handleViewHistoryDetail(item)}
                      >
                        <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-2">{item.theme}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <span>{item.generatedAt}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.duration}秒
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                                {item.scriptFormat}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {item.tone.split("（")[0]}
                          </Badge>
                        </div>
                            {selectedHistoryItem?.id === item.id && (
                              <div className="mt-3 pt-3 border-t border-border/60">
                                <p className="text-xs font-medium text-muted-foreground mb-2">台本プレビュー:</p>
                                <div className="space-y-2">
                                  {item.sections.map((section, idx) => (
                                    <div key={idx} className="text-xs text-foreground/80 bg-muted/30 p-2 rounded">
                                      <span className="font-medium">[{section.timeRange}] {section.title}:</span>{" "}
                                      <span className="line-clamp-2">{section.content}</span>
                      </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 mt-3">
                      <Button
                                    variant="outline"
                        size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullScript = item.sections
                                        .map((s) => `[${s.timeRange}] ${s.title}\n${s.content}`)
                                        .join("\n\n");
                                      handleCopy(fullScript, "台本");
                                    }}
                                    className="h-7 px-3 text-xs"
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    コピー
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteScript(item.id);
                                    }}
                                    className="h-7 px-3 text-xs text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    削除
                      </Button>
                    </div>
                              </div>
                )}
              </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4 min-h-[calc(100vh-200px)]">
            {/* Input Section */}
            <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">ライブ企画案設定</CardTitle>
              <p className="text-sm text-muted-foreground">
                必要な情報を入力して企画案を生成します
                </p>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* 1. ライブ形式(必須) */}
                <div>
                <Label htmlFor="live-format" className="text-sm font-medium mb-2 block">
                  ライブ形式 <span className="text-red-500">*</span>
                </Label>
                <Select value={liveType} onValueChange={setLiveType} disabled={isEditingLivePlan}>
                  <SelectTrigger id="live-format">
                    <SelectValue placeholder="ライブ形式を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIVE_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. ライブタイトル(必須) */}
              <div>
                <Label htmlFor="live-title" className="text-sm font-medium mb-2 block">
                  ライブタイトル <span className="text-red-500">*</span>
                </Label>
                    <Input
                  id="live-title"
                  value={liveTitle}
                  onChange={(e) => setLiveTitle(e.target.value)}
                  placeholder="例: 新作ゲーム初プレイ配信"
                  disabled={isEditingLivePlan}
                />
              </div>

              {/* 3. 予定ライブ時間(必須) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  予定ライブ時間 <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={liveDurationHours}
                    onChange={(e) => setLiveDurationHours(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="8"
                    className="w-20"
                    disabled={isEditingLivePlan}
                  />
                  <span className="text-sm">時間</span>
                  <Input
                    type="number"
                    value={liveDurationMinutes}
                    onChange={(e) => setLiveDurationMinutes(e.target.value)}
                    placeholder="60"
                    min="0"
                    max="59"
                    className="w-20"
                    disabled={isEditingLivePlan}
                  />
                  <span className="text-sm">分</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  合計10分以上480分以下で入力してください
                </p>
              </div>

              {/* 4. 目的(必須) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  目的 <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-2 border rounded-md p-3">
                  {LIVE_PURPOSES.map((purpose) => (
                    <div key={purpose} className="flex items-center space-x-2">
                      <Checkbox
                        id={`purpose-${purpose}`}
                        checked={livePurposes.includes(purpose)}
                        onCheckedChange={(checked) =>
                          handlePurposeChange(purpose, checked as boolean)
                        }
                        disabled={isEditingLivePlan}
                      />
                      <Label
                        htmlFor={`purpose-${purpose}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {purpose}
                      </Label>
                    </div>
                  ))}
                  </div>
              </div>

              {/* 5. ターゲット層(必須) */}
              <div>
                <Label htmlFor="live-target" className="text-sm font-medium mb-2 block">
                  ターゲット層 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={liveTargetAudience}
                  onValueChange={setLiveTargetAudience}
                  disabled={isEditingLivePlan}
                >
                  <SelectTrigger id="live-target">
                    <SelectValue placeholder="ターゲット層を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_AUDIENCES_LIVE.map((target) => (
                      <SelectItem key={target} value={target}>
                        {target}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  </div>

              {/* 6. 優先時間帯(任意) */}
                  <div>
                <Label className="text-sm font-medium mb-2 block">
                  優先時間帯 <span className="text-xs text-muted-foreground">(任意)</span>
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                    type="time"
                    value={livePreferredTimeStart}
                    onChange={(e) => setLivePreferredTimeStart(e.target.value)}
                    className="w-32"
                    disabled={isEditingLivePlan}
                  />
                  <span className="text-sm">〜</span>
                  <Input
                    type="time"
                    value={livePreferredTimeEnd}
                    onChange={(e) => setLivePreferredTimeEnd(e.target.value)}
                    className="w-32"
                    disabled={isEditingLivePlan}
                  />
                  <span className="text-xs text-muted-foreground">(JST)</span>
                  </div>
                    </div>

              {/* 7. 追加メモ(任意) */}
                <div>
                <Label htmlFor="live-notes" className="text-sm font-medium mb-2 block">
                  追加メモ <span className="text-xs text-muted-foreground">(任意)</span>
                </Label>
                  <Textarea
                    id="live-notes"
                    value={liveNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setLiveNotes(e.target.value);
                    }
                  }}
                  placeholder="キーワード、コラボ候補、禁止事項など"
                  className="min-h-24"
                  maxLength={500}
                  disabled={isEditingLivePlan}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {liveNotes.length}/500文字
                </p>
                </div>

              {/* 8. 希望難易度(オプション) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  希望難易度 <span className="text-xs text-muted-foreground">(任意)</span>
                </Label>
                <RadioGroup
                  value={liveDifficulty}
                  onValueChange={setLiveDifficulty}
                  disabled={isEditingLivePlan}
                >
                  <div className="flex items-center space-x-6">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`difficulty-${option.value}`} />
                        <Label
                          htmlFor={`difficulty-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* 生成ボタン */}
              {isEditingLivePlan ? (
                <div className="flex gap-2">
                <Button
                  onClick={handleGenerateLivePlan}
                  disabled={isGeneratingLive}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isGeneratingLive ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                        更新中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        更新
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingLivePlan(false);
                      if (livePlan) {
                        setLiveType(livePlan.type);
                        setLiveTitle(livePlan.title);
                        setLiveDurationHours(livePlan.durationHours.toString());
                        setLiveDurationMinutes(livePlan.durationMinutes.toString());
                        setLivePurposes(livePlan.purposes);
                        setLiveTargetAudience(livePlan.targetAudience);
                        setLivePreferredTimeStart(livePlan.preferredTimeStart || "");
                        setLivePreferredTimeEnd(livePlan.preferredTimeEnd || "");
                        setLiveNotes(livePlan.notes);
                        setLiveDifficulty(livePlan.difficulty || "");
                      }
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateLivePlan}
                  disabled={isGeneratingLive}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isGeneratingLive ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      企画書作成
                    </>
                  )}
                </Button>
              )}
              </CardContent>
            </Card>

            {/* Output Section */}
          {livePlan && (
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">生成された企画案</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {livePlan.type} / {livePlan.durationHours}時間{livePlan.durationMinutes}分
                    </p>
                </div>
                  <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditLivePlan}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                      const totalMinutes = livePlan.durationHours * 60 + livePlan.durationMinutes;
                      const fullPlan = `企画タイトル: ${livePlan.title}\nライブ形式: ${livePlan.type}\n予定時間: ${livePlan.durationHours}時間${livePlan.durationMinutes}分 (合計${totalMinutes}分)\n目的: ${livePlan.purposes.join("、")}\nターゲット層: ${livePlan.targetAudience}\n${livePlan.preferredTimeStart ? `優先時間帯: ${livePlan.preferredTimeStart} 〜 ${livePlan.preferredTimeEnd} (JST)\n` : ""}${livePlan.difficulty ? `難易度: ${DIFFICULTY_OPTIONS.find((d) => d.value === livePlan.difficulty)?.label}\n` : ""}${livePlan.notes ? `追加メモ: ${livePlan.notes}\n` : ""}\n\n配信の流れ:\n${livePlan.flow
                          .map((f) => `[${f.timeRange}] ${f.title}\n${f.content}`)
                          .join("\n\n")}\n\n準備物:\n${livePlan.preparations.map((p) => `・${p}`).join("\n")}`;
                        handleCopy(fullPlan, "企画案");
                      }}
                    >
                    <Copy className="h-4 w-4 mr-2" />
                    コピー
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                      const totalMinutes = livePlan.durationHours * 60 + livePlan.durationMinutes;
                      const fullPlan = `企画タイトル: ${livePlan.title}\nライブ形式: ${livePlan.type}\n予定時間: ${livePlan.durationHours}時間${livePlan.durationMinutes}分 (合計${totalMinutes}分)\n目的: ${livePlan.purposes.join("、")}\nターゲット層: ${livePlan.targetAudience}\n${livePlan.preferredTimeStart ? `優先時間帯: ${livePlan.preferredTimeStart} 〜 ${livePlan.preferredTimeEnd} (JST)\n` : ""}${livePlan.difficulty ? `難易度: ${DIFFICULTY_OPTIONS.find((d) => d.value === livePlan.difficulty)?.label}\n` : ""}${livePlan.notes ? `追加メモ: ${livePlan.notes}\n` : ""}\n\n配信の流れ:\n${livePlan.flow
                          .map((f) => `[${f.timeRange}] ${f.title}\n${f.content}`)
                          .join("\n\n")}\n\n準備物:\n${livePlan.preparations.map((p) => `・${p}`).join("\n")}`;
                        handleDownload(fullPlan, `live-plan-${livePlan.id}.txt`);
                      }}
                    >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                    <div className="rounded-lg border border-border/70 p-3 bg-muted/30">
                      <h4 className="font-medium text-sm mb-1">企画タイトル</h4>
                      <p className="text-sm">{livePlan.title}</p>
                    </div>
                    <div className="grid gap-2">
                      {livePlan.flow.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border/60 p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[11px]">{item.timeRange}</Badge>
                              <span className="text-xs font-semibold">{item.title}</span>
                            </div>
                          {editingFlowIndex === index ? (
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleSaveFlowSection}
                                className="h-7 px-3 text-xs"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                保存
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelFlowEdit}
                                className="h-7 px-3 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                キャンセル
                              </Button>
                          </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEditFlowSection(index)}
                              className="h-7 px-3 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              編集
                            </Button>
                          )}
                        </div>
                        {editingFlowIndex === index ? (
                          <Textarea
                            value={editingFlowContent}
                            onChange={(e) => setEditingFlowContent(e.target.value)}
                            className="min-h-[100px] text-sm"
                            placeholder="セクションの内容を編集してください"
                          />
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        )}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <h4 className="font-medium text-sm mb-2">準備物チェック</h4>
                      <div className="flex flex-wrap gap-2">
                        {livePlan.preparations.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-1 flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* 生成履歴 */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                <CardTitle className="text-lg">生成履歴</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {liveHistory.length} 件
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {liveHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">まだ履歴がありません</p>
                  </div>
                ) : (
                <Accordion type="single" collapsible className="w-full">
                  {liveHistory.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger
                        onClick={() => handleViewLiveHistoryDetail(item)}
                        className="hover:no-underline"
                      >
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2 text-left">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {item.type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {item.durationHours}時間{item.durationMinutes}分
                            </Badge>
                  </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {selectedLiveHistoryItem?.id === item.id && (
                          <div className="space-y-3 pt-2">
                            <div className="text-sm text-muted-foreground">
                              <p>生成日時: {item.generatedAt}</p>
                              <p>目的: {item.purposes.join("、")}</p>
                              <p>ターゲット層: {item.targetAudience}</p>
                              {item.preferredTimeStart && (
                                <p>優先時間帯: {item.preferredTimeStart} 〜 {item.preferredTimeEnd} (JST)</p>
                              )}
                              {item.difficulty && (
                                <p>難易度: {DIFFICULTY_OPTIONS.find((d) => d.value === item.difficulty)?.label}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const totalMinutes = item.durationHours * 60 + item.durationMinutes;
                                  const fullPlan = `企画タイトル: ${item.title}\nライブ形式: ${item.type}\n予定時間: ${item.durationHours}時間${item.durationMinutes}分 (合計${totalMinutes}分)\n目的: ${item.purposes.join("、")}\nターゲット層: ${item.targetAudience}\n${item.preferredTimeStart ? `優先時間帯: ${item.preferredTimeStart} 〜 ${item.preferredTimeEnd} (JST)\n` : ""}${item.difficulty ? `難易度: ${DIFFICULTY_OPTIONS.find((d) => d.value === item.difficulty)?.label}\n` : ""}${item.notes ? `追加メモ: ${item.notes}\n` : ""}\n\n配信の流れ:\n${item.flow
                                    .map((f) => `[${f.timeRange}] ${f.title}\n${f.content}`)
                                    .join("\n\n")}\n\n準備物:\n${item.preparations.map((p) => `・${p}`).join("\n")}`;
                                  handleCopy(fullPlan, "企画案");
                                }}
                                className="h-7 px-3 text-xs"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                コピー
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLivePlan(item.id);
                                }}
                                className="h-7 px-3 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                削除
                              </Button>
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4 min-h-[calc(100vh-200px)]">
          <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
            {/* Input Section */}
            <Card className="border-border shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">コンテンツ情報</CardTitle>
                <p className="text-xs text-muted-foreground">
                  脚本要約と動画形式を入力してメタデータを生成します
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 脚本要約 / スクリプト要約 */}
                <div>
                  <Label htmlFor="script-summary" className="text-sm font-medium mb-2 block">
                    脚本要約 / スクリプト要約 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="script-summary"
                    value={scriptSummary}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setScriptSummary(e.target.value);
                      }
                    }}
                    placeholder="例: 新作ゲームの最速レビューと裏話。視聴者と一緒に楽しむ実況配信。"
                    className="min-h-32"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    残り文字数: {1000 - scriptSummary.length} / 1000文字
                  </p>
                </div>

                {/* 動画形式 */}
                <div>
                  <Label htmlFor="video-format" className="text-sm font-medium mb-2 block">
                    動画形式 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={videoFormat} onValueChange={setVideoFormat}>
                    <SelectTrigger id="video-format">
                      <SelectValue placeholder="動画形式を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {VIDEO_FORMATS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>

                {/* 目的 */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    目的 <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2 border rounded-md p-3">
                    {METADATA_PURPOSES.map((purpose) => (
                      <div key={purpose} className="flex items-center space-x-2">
                        <Checkbox
                          id={`purpose-${purpose}`}
                          checked={metadataPurposes.includes(purpose)}
                          onCheckedChange={(checked) =>
                            handleMetadataPurposeChange(purpose, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`purpose-${purpose}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {purpose}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* チャンネル概要 */}
                <div>
                  <Label htmlFor="channel-summary" className="text-sm font-medium mb-2 block">
                    チャンネル概要 <span className="text-xs text-muted-foreground">(任意)</span>
                  </Label>
                  <Textarea
                    id="channel-summary"
                    value={channelSummary}
                    onChange={(e) => {
                      if (e.target.value.length <= 200) {
                        setChannelSummary(e.target.value);
                      }
                    }}
                    placeholder="例: VTuberとしてゲーム実況と雑談を中心に活動。視聴者との交流を大切にしています。"
                    className="min-h-24"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {channelSummary.length} / 200文字
                  </p>
                </div>

                {/* 禁止語 */}
                <div>
                  <Label htmlFor="forbidden-words" className="text-sm font-medium mb-2 block">
                    禁止語 <span className="text-xs text-muted-foreground">(任意)</span>
                  </Label>
                  <Input
                    id="forbidden-words"
                    value={forbiddenWords}
                    onChange={(e) => setForbiddenWords(e.target.value)}
                    placeholder="例: 禁止語1, 禁止語2, 禁止語3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    カンマ区切りで入力してください
                  </p>
                </div>

                {/* メタデータ生成ボタン */}
                <Button
                  onClick={handleGenerateMetadata}
                  disabled={
                    isGeneratingMetadata ||
                    !scriptSummary.trim() ||
                    !videoFormat ||
                    metadataPurposes.length === 0
                  }
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isGeneratingMetadata ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      メタデータ生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Section */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">生成結果</CardTitle>
                {metadata && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allContent = `タイトル候補:\n${metadata.titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n説明文:\n${metadata.description}\n\nハッシュタグ:\n${metadata.hashtags.join(" ")}\n\nサムネイルテキスト:\nメイン: ${metadata.thumbnailText.main}\nサブ: ${metadata.thumbnailText.sub}`;
                      handleCopy(allContent, "すべてのメタデータ");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    すべてコピー
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {metadata ? (
                  <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                    <div className="grid gap-2">
                      {metadata.titles.map((title, index) => (
                        <div key={index} className="rounded-md border border-border/60 p-3 text-sm bg-muted/40 flex items-start justify-between gap-3">
                          <span>{title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleCopy(title, `タイトル案${index + 1}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">説明文</Label>
                      <Textarea value={metadata.description} className="min-h-36 text-sm mt-1" readOnly />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">推奨ハッシュタグ</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {metadata.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-border/60 p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">サムネメイン</p>
                        <p className="font-medium">{metadata.thumbnailText.main}</p>
                      </div>
                      <div className="rounded-md border border-border/60 p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">サムネサブ</p>
                        <p className="font-medium">{metadata.thumbnailText.sub}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Wand2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">内容とターゲットを入力して「メタデータを自動生成」を押してください</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
