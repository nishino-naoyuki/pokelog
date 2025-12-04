# Pokemon TCG カード名と画像URL取得ガイド

## 概要

ポケモンカードの公式サイト (pokemon.com) からカード名と画像URLを取得する方法をまとめました。

## 方法1: Pokemon TCG API (推奨)

### APIについて

**Pokemon TCG API** は、公式ではありませんが、広く使われているRESTful APIです。
- URL: https://pokemontcg.io
- ドキュメント: https://docs.pokemontcg.io
- 無料で利用可能（APIキーなしで1時間あたり1000リクエストまで）

### API仕様

#### エンドポイント
```
GET https://api.pokemontcg.io/v2/cards
```

#### パラメータ
- `page`: ページ番号（デフォルト: 1）
- `pageSize`: 1ページあたりの件数（最大: 250）
- `q`: 検索クエリ（オプション）

#### レスポンス例
```json
{
  "data": [
    {
      "id": "xy1-1",
      "name": "Venusaur EX",
      "supertype": "Pokémon",
      "subtypes": ["Basic", "EX"],
      "hp": "180",
      "types": ["Grass"],
      "images": {
        "small": "https://images.pokemontcg.io/xy1/1.png",
        "large": "https://images.pokemontcg.io/xy1/1_hires.png"
      },
      "set": {
        "id": "xy1",
        "name": "XY",
        "series": "XY",
        "printedTotal": 146,
        "total": 146,
        "releaseDate": "2014/02/05"
      },
      "number": "1",
      "artist": "5ban Graphics"
    }
  ],
  "page": 1,
  "pageSize": 250,
  "count": 1,
  "totalCount": 15000
}
```

### 取得できる情報

各カードについて、以下の情報が取得できます：

#### 基本情報
- `id`: カードの一意なID
- `name`: カード名
- `supertype`: スーパータイプ（Pokémon, Trainer, Energy）
- `subtypes`: サブタイプ（Basic, Stage 1, Stage 2, EX, V, VMAXなど）
- `hp`: HP
- `types`: タイプ（Grass, Fire, Waterなど）

#### 画像URL
- `images.small`: 小さい画像（約245x342px）
- `images.large`: 大きい画像（高解像度）

画像URLの形式:
```
https://images.pokemontcg.io/{set}/{number}.png  # 小
https://images.pokemontcg.io/{set}/{number}_hires.png  # 大
```

#### セット情報
- `set.id`: セットID
- `set.name`: セット名
- `set.series`: シリーズ名
- `set.releaseDate`: 発売日

#### その他
- `number`: セット内のカード番号
- `artist`: イラストレーター名
- `rarity`: レアリティ
- `attacks`: ワザ情報
- `weaknesses`: 弱点
- `resistances`: 抵抗力
- `retreatCost`: にげるコスト

### 利用例

#### PowerShellでの取得
```powershell
# 最初の250枚を取得
$response = Invoke-RestMethod -Uri "https://api.pokemontcg.io/v2/cards?pageSize=250"

# カード名と画像URLを表示
foreach ($card in $response.data) {
    Write-Host "$($card.name): $($card.images.small)"
}
```

#### PowerShellで全カードを取得
```powershell
$allCards = @()
$page = 1
$pageSize = 250

do {
    $response = Invoke-RestMethod -Uri "https://api.pokemontcg.io/v2/cards?page=$page&pageSize=$pageSize"
    $allCards += $response.data
    $page++
} while ($allCards.Count -lt $response.totalCount)

# JSONファイルに保存
$allCards | ConvertTo-Json -Depth 10 | Out-File "cards.json" -Encoding UTF8
```

#### 特定のカードを検索
```powershell
# 「Pikachu」を含むカードを検索
$response = Invoke-RestMethod -Uri "https://api.pokemontcg.io/v2/cards?q=name:Pikachu*"

# 「Charizard」のVカードを検索
$response = Invoke-RestMethod -Uri "https://api.pokemontcg.io/v2/cards?q=name:Charizard subtypes:V"
```

### 検索クエリの例

APIは高度な検索機能をサポートしています：

```
name:Pikachu                  # 名前に「Pikachu」を含む
name:"Pikachu V"              # 正確に「Pikachu V」
types:Fire                    # 炎タイプ
subtypes:V                    # Vカード
set.id:swsh1                  # 特定のセット
hp:[100 TO *]                 # HP100以上
rarity:"Rare Holo"            # レアリティ指定
name:Charizard AND types:Fire # 複数条件（AND/OR/NOT使用可能）
```

## 方法2: TCGdex API

### APIについて

多言語対応のPokemon TCG APIです。
- URL: https://www.tcgdex.dev
- 日本語対応あり

### エンドポイント

```
GET https://api.tcgdex.net/v2/en/cards
GET https://api.tcgdex.net/v2/ja/cards  # 日本語版
```

### 特徴
- 多言語サポート（英語、日本語、フランス語など）
- 高品質な画像
- 詳細なカード情報

## 方法3: 公式サイトからスクレイピング（非推奨）

### 問題点
pokemon.com の公式カードデータベースは以下の理由でスクレイピングが困難です：

1. **動的コンテンツ**: JavaScriptで動的に読み込まれる
2. **DOM構造へのアクセス制限**: カード要素が通常のDOM取得では取得できない可能性
3. **利用規約**: スクレイピングは利用規約違反の可能性
4. **効率の悪さ**: APIの方が遥かに効率的

### 代替案
公式サイトから手動で必要なカードを確認し、APIで詳細情報を取得する方法を推奨します。

## 推奨される実装手順

### ステップ1: Pokemon TCG APIでカードデータを取得

```powershell
# scripts/fetch_pokemon_cards.ps1 を実行
powershell.exe -ExecutionPolicy Bypass -File "scripts/fetch_pokemon_cards.ps1"
```

### ステップ2: データをローカルに保存

- JSONファイル: 完全なカード情報
- CSVファイル: 表形式での閲覧・フィルタリング

### ステップ3: カード名から画像URLへのマッピング

JSONファイルから、カード名をキーとした辞書を作成：

```powershell
$cards = Get-Content "data/pokemon_cards.json" | ConvertFrom-Json
$cardMap = @{}

foreach ($card in $cards) {
    $cardMap[$card.name] = @{
        id = $card.id
        image_small = $card.image_small
        image_large = $card.image_large
        set = $card.set_name
    }
}

# カード名から画像URLを取得
$imageUrl = $cardMap["Pikachu"].image_small
```

### ステップ4: PTCGLログと統合

PTCGLのログに出てくるカード名（英語）を使って、対応する画像URLを検索できます。

```powershell
# ログからカード名を抽出
$logContent = Get-Content "doc/logsample/ptcgl log.txt"

# "played <CardName>" のパターンでカード名を抽出
$pattern = "played (.+?) to"
$matches = [regex]::Matches($logContent, $pattern)

foreach ($match in $matches) {
    $cardName = $match.Groups[1].Value
    if ($cardMap.ContainsKey($cardName)) {
        $imageUrl = $cardMap[$cardName].image_small
        Write-Host "$cardName -> $imageUrl"
    }
}
```

## データファイルの例

### JSON形式
```json
[
  {
    "id": "xy1-1",
    "name": "Venusaur EX",
    "set_name": "XY",
    "set_id": "xy1",
    "number": "1",
    "image_small": "https://images.pokemontcg.io/xy1/1.png",
    "image_large": "https://images.pokemontcg.io/xy1/1_hires.png",
    "supertype": "Pokémon",
    "subtypes": "Basic, EX",
    "hp": "180",
    "types": "Grass"
  }
]
```

### CSV形式
```csv
id,name,set_name,set_id,number,image_small,image_large,supertype,subtypes,hp,types
xy1-1,Venusaur EX,XY,xy1,1,https://images.pokemontcg.io/xy1/1.png,https://images.pokemontcg.io/xy1/1_hires.png,Pokémon,"Basic, EX",180,Grass
```

## 注意事項

### APIのレート制限
- APIキーなし: 1時間あたり1000リクエスト
- APIキーあり: より高い制限（無料アカウント作成で取得可能）

### 画像の利用規約
Pokemon TCG APIの画像は、The Pokémon Companyの著作物です。
- 個人利用・研究目的: OK
- 商用利用: 要確認

### カード名の対応
PTCGLのログに出てくるカード名は**英語**です。
- 例: `Dragapult ex`, `Buddy-Buddy Poffin`, `Basic Fire Energy`

日本語のカード名との対応が必要な場合は、TCGdex APIの日本語エンドポイントを使用するか、独自のマッピングテーブルを作成してください。

## まとめ

1. **Pokemon TCG API** を使用するのが最も簡単で効率的
2. 全カードデータを一度ダウンロードしてローカルに保存
3. カード名をキーとした検索可能な形式に変換
4. PTCGLログ解析時に画像URLを参照

このアプローチにより、リプレイアプリでカード画像を表示できるようになります。
