# PTCGLログファイル解析

## 1. ログファイルの概要

PTCGLは対戦のログをテキスト形式で出力します。このログファイルには、ゲームの準備から終了まで、すべてのアクションが時系列で記録されています。

### ログファイルの基本構造

```
Setup
<初期設定情報>

Turn # X - <プレイヤー名>'s Turn
<ターン中のアクション>

<勝敗の決定>
```

## 2. ログのセクション構成

### 2.1 Setup (ゲーム準備)

ゲーム開始時の初期設定を記録するセクション。

#### コイントス
```
<プレイヤー名> chose <heads/tails> for the opening coin flip.
<プレイヤー名> won the coin toss.
<プレイヤー名> decided to go <first/second>.
```

**例:**
```
0512SmileMan chose heads for the opening coin flip.
0512SmileMan won the coin toss.
0512SmileMan decided to go second.
```

#### 初期手札
```
<プレイヤー名> drew 7 cards for the opening hand.
- 7 drawn cards.
   • <カード名>, <カード名>, ...
```

**例:**
```
0512SmileMan drew 7 cards for the opening hand.
- 7 drawn cards.
   • Drakloak, Luminous Energy, Ultra Ball, Jamming Tower, Dusknoir, Neo Upper Energy, Night Stretcher
```

> [!NOTE]
> 相手の手札は、マリガンが発生した場合にのみ公開されます。

#### マリガン（やり直し）
```
<プレイヤー名> took a mulligan.
- Cards revealed from Mulligan <回数>
   • <カード名>, <カード名>, ...
<相手プレイヤー名> drew 1 more card because <プレイヤー名> took at least 1 mulligan.
- <相手プレイヤー名> drew a card.
```

**例:**
```
0512SmileMan took a mulligan.
- Cards revealed from Mulligan 1
   • Drakloak, Luminous Energy, Ultra Ball, Jamming Tower, Dusknoir, Neo Upper Energy, Night Stretcher
Hooddon drew 1 more card because 0512SmileMan took at least 1 mulligan.
- Hooddon drew a card.
```

#### バトル場・ベンチへのポケモン配置
```
<プレイヤー名> played <ポケモン名> to the Active Spot.
<プレイヤー名> played <ポケモン名> to the Bench.
```

**例:**
```
0512SmileMan played Dreepy to the Active Spot.
0512SmileMan played Dreepy to the Bench.
```

### 2.2 Turn (各ターン)

#### ターン開始
```
Turn # <番号> - <プレイヤー名>'s Turn
```

**例:**
```
Turn # 1 - Hooddon's Turn
```

> [!IMPORTANT]
> ターン番号は、**各プレイヤー視点**でカウントされます。
> - 先攻プレイヤーの最初のターン: `Turn # 1 - 先攻's Turn`
> - 後攻プレイヤーの最初のターン: `Turn # 2 - 後攻's Turn`（全体では2番目だが、後攻プレイヤーにとっては1番目）
> 
> **実際には**、ログ上では両プレイヤーとも自分の番を `Turn # 1` から始めています。

#### カードを引く
```
<プレイヤー名> drew <カード名>.
<プレイヤー名> drew a card.  # カード名非公開の場合
```

**例:**
```
0512SmileMan drew Budew.
Hooddon drew a card.
```

#### グッズカードの使用
```
<プレイヤー名> played <グッズ名>.
- <効果の説明>
```

**例:**
```
0512SmileMan played Buddy-Buddy Poffin.
- 0512SmileMan drew 2 cards and played them to the Bench.
   • Duskull, Dreepy
- 0512SmileMan shuffled their deck.
```

#### サポートカードの使用
```
<プレイヤー名> played <サポート名>.
- <効果の説明>
```

**例:**
```
Hooddon played Arven.
- Hooddon drew 2 cards.
   • Precious Trolley, Vitality Band
- Hooddon shuffled their deck.
```

#### ポケモンサーチカードの使用（ベンチに直接出すカード）

> [!IMPORTANT]
> **「to the Bench」と明記されないベンチ配置**  
> 一部のグッズカードは、ポケモンを山札からベンチに直接出しますが、ログには「played to the Bench」と明記されません。代わりに「drew X cards and played them to the Bench」という表現が使われます。

以下のカードは、ポケモンを山札から直接ベンチに出す効果を持ちます：

##### Buddy-Buddy Poffin（なかよしポフィン）

**カード効果:**
- HP70以下のたねポケモンを山札から最大2枚まで選び、ベンチに出す
- その後、山札をシャッフルする

**ログパターン:**
```
<プレイヤー名> played Buddy-Buddy Poffin.
- <プレイヤー名> drew X cards and played them to the Bench.
   • <ポケモン名>, <ポケモン名>
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
0512SmileMan played Buddy-Buddy Poffin.
- 0512SmileMan drew 2 cards and played them to the Bench.
   • Duskull, Dreepy
- 0512SmileMan shuffled their deck.
```

**重要な注意点:**
- ベンチが満席（5匹）の場合は使用できません
- ベンチに空きが1つしかない場合は、1枚だけ出すことも可能
- 「drew X cards」と書いてありますが、実際にはベンチに直接出しています（手札には入りません）

##### Nest Ball（ネストボール）

**カード効果:**
- たねポケモンを1枚、山札から選んでベンチに出す
- その後、山札をシャッフルする
- **手札を捨てる必要がない**

**ログパターン:**
```
<プレイヤー名> played Nest Ball.
- <プレイヤー名> drew <ポケモン名> and played it to the Bench.
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
0512SmileMan played Nest Ball.
- 0512SmileMan drew Rotom V and played it to the Bench.
- 0512SmileMan shuffled their deck.
```

**重要な注意点:**
- ベンチが満席の場合は使用できません
- 手札からではなく山札から直接ベンチに出すため、「手札から出したときに発動する特性」は発動しません

##### Ultra Ball（ハイパーボール）

**カード効果:**
- 手札を2枚捨てて、山札から好きなポケモン（たね、進化、V、VMAXなど）を1枚選んで**手札**に加える
- その後、山札をシャッフルする

**ログパターン:**
```
<プレイヤー名> played Ultra Ball.
- <プレイヤー名> discarded 2 cards.
   • <カード名>, <カード名>
- <プレイヤー名> drew <ポケモン名>.
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
0512SmileMan played Ultra Ball.
- 0512SmileMan discarded 2 cards.
   • Nest Ball, Counter Catcher
- 0512SmileMan drew Drakloak.
- 0512SmileMan shuffled their deck.
```

**重要な注意点:**
- Ultra Ballは**手札に加える**ため、ベンチに直接出すわけではありません
- その後、別のアクションで「played <ポケモン名> to the Bench」が記録されます
- 手札を2枚捨てる必要があるため、手札が3枚以上ないと使用できません

##### Great Ball（スーパーボール）

**カード効果:**
- 山札の上から7枚を見て、その中からポケモンを1枚選んで**手札**に加える
- 残りのカードは山札に戻してシャッフル

**ログパターン:**
```
<プレイヤー名> played Great Ball.
# ログに詳細が記録されない可能性あり（要確認）
```

**重要な注意点:**
- Great Ballも**手札に加える**ため、ベンチに直接出すわけではありません
- Ultra Ballと異なり、手札を捨てる必要がありません

##### その他のポケモンサーチカード

PTCGLには他にも以下のようなポケモンサーチカードがあります：

| カード名 | 日本語名 | サーチ対象 | 行き先 |
|---------|---------|-----------|--------|
| **Feather Ball** | フェザーボール | にげるコスト0のポケモン | 手札 |
| **Hisuian Heavy Ball** | ヒスイのヘビーボール | たねポケモン（少数採用向け） | 手札 |
| **Capturing Aroma** | ポケモンキャッチャー | ポケモン | 手札 |
| **Poké Ball** | モンスターボール | コイン次第でポケモン | 手札 |

### ログ解析時の重要なポイント

#### 1. 「drew and played to the Bench」の解釈

```
- <プレイヤー名> drew 2 cards and played them to the Bench.
   • Duskull, Dreepy
```

この表現は：
- **実際の動作**: 山札から直接ベンチに出している
- **ログの表現**: 「drew」（引いた）と書かれているが、手札には入らない
- **原因カード**: Buddy-Buddy Poffinなどのベンチ配置カード

#### 2. カードの効果による違い

| カード | ベンチに直接？ | ログの表現 |
|--------|--------------|-----------|
| **Buddy-Buddy Poffin** | ✅ はい | `drew X cards and played them to the Bench` |
| **Nest Ball** | ✅ はい | `drew X and played it to the Bench` |
| **Ultra Ball** | ❌ いいえ（手札へ） | `drew X`（その後別途ベンチ配置） |
| **Great Ball** | ❌ いいえ（手札へ） | `drew X`（その後別途ベンチ配置） |

#### 3. パーサー実装時の注意

ログ解析プログラムを作成する際は、以下を考慮する必要があります：

```python
# 擬似コード例
if "played Buddy-Buddy Poffin" in line:
    # 次の行で「drew X cards and played them to the Bench」を探す
    # → ベンチに直接配置されたポケモンを記録
    
elif "played Nest Ball" in line:
    # 次の行で「drew X and played it to the Bench」を探す
    # → ベンチに直接配置されたポケモンを記録
    
elif "played Ultra Ball" in line:
    # 次の行で「drew X」を探す
    # → 手札に加わっただけ。ベンチ配置は別のアクション
```

#### 4. 状態管理への影響

これらのカードを使用した場合：

1. **Buddy-Buddy Poffin / Nest Ball**:
   - 山札の枚数が減る
   - ベンチのポケモン数が増える
   - 手札の枚数は変わらない（カード1枚使用のみ）

2. **Ultra Ball / Great Ball**:
   - 山札の枚数が減る
   - 手札の枚数が変わる（Ultra Ballは-2+1=-1、Great Ballは-1+1=0）
   - ベンチのポケモン数は後のアクションで増える



#### ポケモンを場に出す
```
<プレイヤー名> played <ポケモン名> to the Bench.
<プレイヤー名> played <ポケモン名> to the Active Spot.
```

#### 進化
```
<プレイヤー名> evolved <進化前> to <進化後> <場所>.
```

**場所:**
- `in the Active Spot`: バトル場
- `on the Bench`: ベンチ

**例:**
```
0512SmileMan evolved Dreepy to Drakloak on the Bench.
Hooddon evolved Goldeen to Seaking in the Active Spot.
```

#### エネルギーの付与
```
<プレイヤー名> attached <エネルギー名> to <ポケモン名> <場所>.
```

**例:**
```
0512SmileMan attached Basic Fire Energy to Dreepy on the Bench.
Hooddon attached Basic Grass Energy to Goldeen in the Active Spot.
```

#### ポケモンの道具（ツール）の付与
```
<プレイヤー名> attached <道具名> to <ポケモン名> <場所>.
```

**例:**
```
Hooddon attached Vitality Band to Seaking in the Active Spot.
Hooddon attached Technical Machine: Evolution to Goldeen in the Active Spot.
```

#### スタジアムカードの使用
```
<プレイヤー名> played <スタジアム名> to the Stadium spot.
```

**例:**
```
Hooddon played Festival Grounds to the Stadium spot.
```

#### ワザの使用
```
<プレイヤー名>'s <ポケモン名> used <ワザ名> [on <対象ポケモン>] [for <ダメージ> damage].
```

**例（攻撃ワザ）:**
```
0512SmileMan's Budew used Itchy Pollen on Hooddon's Goldeen for 10 damage.
```

**例（特性的なワザ）:**
```
0512SmileMan's Drakloak used Recon Directive.
- 0512SmileMan drew Buddy-Buddy Poffin.
```

#### ダメージ計算の詳細
```
- Damage breakdown:
   • Base damage: <基本ダメージ> damage
   • (<効果の種類>) <効果名>: <追加ダメージ> damage
   • Total damage: <合計ダメージ> damage
```

**例:**
```
Hooddon's Seaking used Rapid Draw on 0512SmileMan's Budew for 70 damage.
- Damage breakdown:
   • Base damage: 60 damage
   • (Pokémon Tool) Vitality Band: 10 damage
   • Total damage: 70 damage
```

#### 弱点計算
```
<ワザの記述> <対象> took <追加ダメージ> more damage because of <タイプ> Weakness.
```

**例:**
```
0512SmileMan's Litten used Gnaw on Revengè's Teal Mask Ogerpon ex for 20 damage. Revengè's Teal Mask Ogerpon ex took 10 more damage because of Fire Weakness.
```

#### ポケモンのきぜつ
```
<プレイヤー名>'s <ポケモン名> was Knocked Out!
<カード名> was discarded from <プレイヤー名>'s <ポケモン名>.
```

複数のカードが付いている場合:
```
- X cards were discarded from <プレイヤー名>'s <ポケモン名>.
   • <カード名>, <カード名>, ...
```

**例:**
```
0512SmileMan's Budew was Knocked Out!
Hooddon's Dipplin was Knocked Out!
- 3 cards were discarded from Hooddon's Dipplin.
   • Basic Grass Energy, Applin, Brave Bangle
```

#### サイドカードを取る
```
<プレイヤー名> took <枚数> Prize card(s).
<カード名> was added to <プレイヤー名>'s hand.
```

**例:**
```
Hooddon took a Prize card.
A card was added to Hooddon's hand.

0512SmileMan took 2 Prize cards.
Counter Catcher was added to 0512SmileMan's hand.
Luminous Energy was added to 0512SmileMan's hand.
```

> [!NOTE]
> 自分のサイドカードの内容は公開されますが、相手のサイドは「A card」と表記されます。

#### ポケモンの入れ替え（にげる）
```
<プレイヤー名> retreated <ポケモンA> to the Bench.
<プレイヤー名>'s <ポケモンB> is now in the Active Spot.
```

エネルギーが捨てられる場合:
```
- <エネルギー名> was discarded from <プレイヤー名>'s <ポケモン名>.
```

**例:**
```
0512SmileMan retreated Dreepy to the Bench.
0512SmileMan's Budew is now in the Active Spot.

Revengè retreated Teal Mask Ogerpon ex to the Bench.
- Basic Grass Energy was discarded from Revengè's Teal Mask Ogerpon ex.
Revengè's Regidrago VSTAR is now in the Active Spot.
```

#### カードの効果によるポケモンの入れ替え
```
<プレイヤー名> played <カード名>.
- <相手プレイヤー名>'s <ポケモンA> was switched with <相手プレイヤー名>'s <ポケモンB> to become the Active Pokémon.
<相手プレイヤー名>'s <ポケモンB> is now in the Active Spot.
```

**例:**
```
0512SmileMan played Counter Catcher.
- Hooddon's Thwackey was switched with Hooddon's Seaking to become the Active Pokémon.
Hooddon's Thwackey is now in the Active Spot.
```

#### 手札のシャッフル（Iono、Unfair Stampなど）
```
<プレイヤー名> played <カード名>.
- <プレイヤー名> shuffled their hand.
- <プレイヤー名> put <枚数> cards on the bottom of their deck.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
- <相手プレイヤー名> shuffled their hand.
- <相手プレイヤー名> put <枚数> cards on the bottom of their deck.
- <プレイヤー名> drew <枚数> cards.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
- <相手プレイヤー名> drew <枚数> cards.
```

**例:**
```
0512SmileMan played Iono.
- 0512SmileMan shuffled their hand.
- 0512SmileMan put 3 cards on the bottom of their deck.
   • Buddy-Buddy Poffin, Budew, Night Stretcher
- Hooddon shuffled their hand.
- 0512SmileMan moved 0512SmileMan's 10 cards to their deck.
- 0512SmileMan drew 6 cards.
   • Brock's Scouting, Hawlucha, Night Stretcher, Basic Psychic Energy, Luminous Energy, Nest Ball
- 0512SmileMan drew 5 cards.
```

#### ダメカンの移動
```
- <プレイヤー名> put <個数> damage counter(s) on <対象ポケモン>.
- <プレイヤー名> moved <個数> damage counter(s) from <元ポケモン> to <先ポケモン>.
```

**例:**
```
- 0512SmileMan put a damage counter on 0512SmileMan's Thwackey.
- 0512SmileMan put 5 damage counters on 0512SmileMan's Rellor.

- ogushin112 moved 3 damage counters from ogushin112's Gardevoir ex to 0512SmileMan's Xatu.
```

#### ロストゾーンへの移動
```
- <プレイヤー名> moved <プレイヤー名>'s <カード名> to the Lost Zone.
```

**例:**
```
0512SmileMan played Lost Vacuum.
- 0512SmileMan moved 0512SmileMan's Buddy-Buddy Poffin to the Lost Zone.
- ogushin112 moved ogushin112's Bravery Charm to the Lost Zone.
```

#### 特殊状態

##### やけど (Burned)
```
- <プレイヤー名>'s <ポケモン名> is now Burned.
```

ポケモンチェック時:
```
Pokémon Checkup
2 damage counters were placed on <プレイヤー名>'s <ポケモン名> for the Special Condition Burned.
<プレイヤー名> flipped a coin and it landed on <heads/tails>.
<プレイヤー名>'s <ポケモン名> is no longer Burned.  # 表の場合
```

**例:**
```
- Revengè's Regidrago VSTAR is now Burned.

Pokémon Checkup
2 damage counters were placed on Revengè's Regidrago VSTAR for the Special Condition Burned.
Revengè flipped a coin and it landed on heads.
Revengè's Regidrago VSTAR is no longer Burned.
**重要な注意点:**
- やけど状態でもダメカンは必ず2個乗る（コインの結果に関わらず）
- コイントスは回復するかどうかを判定するためのもの
- 表が出れば回復し、裏なら次のポケモンチェックまで継続

##### どく (Poisoned)

> [!IMPORTANT]
> **ルール上はどく=1個、やけど=2個**ですが、ログで「3 damage counters for Poisoned」と記録されている場合は、以下の可能性があります：
> 1. どく+やけどの両方の状態（合計3個）
> 2. 特殊などく効果を持つワザ（Toxic Powder など）
> 3. カード固有の追加効果

**効果:**
- ポケモンチェック時にダメカン1個を乗せる
- **自然には回復しない**（進化・ベンチ移動・カード効果でのみ回復）

**ログパターン:**
```
- <プレイヤー名>'s <ポケモン名> is now Poisoned.
```

**ポケモンチェック時:**
```
Pokémon Checkup
1 damage counter was placed on <プレイヤー名>'s <ポケモン名> for the Special Condition Poisoned.
```

**重要な注意点:**
- どく状態は自然回復しない（やけどと異なりコイントスもない）
- 毎ポケモンチェック時に必ず1個ダメカンが乗り続ける
- 進化するかベンチに下がるか、カード効果で治すしかない

##### ねむり (Asleep)

**効果:**
- ワザが使えない
- にげることができない
- ポケモンチェック時にコイントスを行い、表が出たら回復

**ログパターン（推測）:**
```
- <プレイヤー名>'s <ポケモン名> is now Asleep.

Pokémon Checkup
<プレイヤー名> flipped a coin and it landed on heads.
<プレイヤー名>'s <ポケモン名> is no longer Asleep.
```

**重要な注意点:**
- ねむり状態ではダメカンは乗らない
- ワザの使用とにげるが制限される
- コイントスで表が出るまで継続

##### マヒ (Paralyzed)

**効果:**
- ワザが使えない
- にげることができない
- **次の自分の番の終わりに自動回復**

**ログパターン（推測）:**
```
- <プレイヤー名>'s <ポケモン名> is now Paralyzed.

[次のターン終了時]
<プレイヤー名>'s <ポケモン名> is no longer Paralyzed.
```

**重要な注意点:**
- マヒは1ターンで自動回復（コイントス不要）
- ダメカンは乗らない
- ワザの使用とにげるが制限される

##### こんらん (Confused)

**効果:**
- ワザを使う際にコイントスを行う
- 裏が出ると、ワザは失敗し自分に30ダメージ

**ログパターン（推測）:**
```
- <プレイヤー名>'s <ポケモン名> is now Confused.

[ワザ使用時]
<プレイヤー名> flipped a coin and it landed on tails.
<プレイヤー名>'s <ポケモン名> hurt itself in its confusion for 30 damage.
```

**重要な注意点:**
- こんらん状態でもワザは使用可能だが、コイン次第で失敗
- 自傷ダメージは30固定
- 表が出ればワザは成功

#### VSTARパワーの使用
```
<プレイヤー名>'s <ポケモン名> used <VSTAR能力名>.
- <効果の説明>
<プレイヤー名> can no longer use VSTAR Powers.
```

**例:**
```
0512SmileMan's Rotom V used Star Alchemy.
- 0512SmileMan drew Arven.
- 0512SmileMan shuffled their deck.
0512SmileMan can no longer use VSTAR Powers.
```

#### Technical Machine: Evolutionの使用
```
<プレイヤー名> attached Technical Machine: Evolution to <ポケモン名> <場所>.
<プレイヤー名>'s <ポケモン名> used Evolution.
- <プレイヤー名> evolved <進化前> to <進化後> <場所>.
- <プレイヤー名> evolved <進化前> to <進化後> <場所>.
- <プレイヤー名> shuffled their deck.
Technical Machine: Evolution was activated.
- Technical Machine: Evolution was discarded from <プレイヤー名>'s <ポケモン名>.
```

**例:**
```
0512SmileMan attached Technical Machine: Evolution to Dreepy in the Active Spot.
0512SmileMan's Dreepy used Evolution.
- 0512SmileMan evolved Dreepy to Drakloak on the Bench.
- 0512SmileMan evolved Natu to Xatu on the Bench.
- 0512SmileMan shuffled their deck.
Technical Machine: Evolution was activated.
- Technical Machine: Evolution was discarded from 0512SmileMan's Dreepy.
```

#### Festival Lead（ワザの選択）
一部のポケモンは複数のワザから選択できます。
```
<プレイヤー名>'s <ポケモン名> used Festival Lead.
- Damage breakdown:
   • ...
- <プレイヤー名> chose <ワザ名>
- <プレイヤー名>'s <ポケモン名> used <ワザ名> ...
```

**例:**
```
Hooddon's Seaking used Festival Lead.
- Damage breakdown:
   • Base damage: 60 damage
   • (Pokémon Tool) Vitality Band: 10 damage
   • Total damage: 70 damage

- Hooddon chose Rapid Draw
- Hooddon's Seaking used Rapid Draw on 0512SmileMan's Latias ex for 70 damage.
- Hooddon drew 2 cards.
```

#### ターン終了
```
<プレイヤー名> ended their turn.
```

**例:**
```
Hooddon ended their turn.
```

### 2.3 勝敗の決定

#### サイドカードを全て取った場合
```
All Prize cards taken. <プレイヤー名> wins.
```

**例:**
```
All Prize cards taken. 0512SmileMan wins.
```

#### 降参した場合
```
Opponent conceded. <プレイヤー名> wins.
You conceded. <相手プレイヤー名> wins.
```

**例:**
```
Opponent conceded. 0512SmileMan wins.
You conceded. Revengè wins.
```

## 3. ログのパターン分析

### 3.1 情報の可視性

| 情報 | 自分 | 相手 |
|------|------|------|
| **手札** | カード名表示 | 枚数のみ（マリガン時のみ公開） |
| **引いたカード** | カード名表示 | 「a card」のみ |
| **プレイしたカード** | 表示 | 表示 |
| **場のポケモン** | 表示 | 表示 |
| **サイドカード** | カード名表示 | 「A card」のみ |
| **捨て札** | 表示 | 表示 |
| **ダメージ** | 表示 | 表示 |

### 3.2 アクションの階層構造

ログは以下のような階層構造になっています：

```
アクション
├─ メインアクション（カードのプレイ、ワザの使用など）
└─ サブアクション（効果の詳細）
   ├─ カードを引く
   ├─ ダメージを与える
   ├─ ポケモンをきぜつさせる
   └─ etc.
```

サブアクションは `- `（ハイフン＋スペース）で始まり、さらに詳細な情報は `   • `（スペース3つ＋中黒＋スペース）で箇条書きされます。

### 3.3 カード名の表記

- カード名は基本的に**英語**で記録されます
- カード名にスペースが含まれる場合があります（例：`Buddy-Buddy Poffin`、`Basic Fire Energy`）
- ex/V/VMAX/VSTARなどは名前の一部として表記されます（例：`Dragapult ex`、`Regidrago VSTAR`）

### 3.4 場所の表記

| 英語表記 | 日本語 |
|---------|--------|
| `Active Spot` | バトル場 |
| `Bench` | ベンチ |
| `hand` | 手札 |
| `deck` | 山札 |
| `discard pile` / `discarded` | 捨て札 |
| `Prize cards` | サイドカード |
| `Lost Zone` | ロストゾーン |
| `Stadium spot` | スタジアム |

### 3.5 プレイヤーの参照

ログを出力したプレイヤー（自分）と相手は、以下のように区別されます：

- **自分**: 実際のプレイヤー名で記録（例：`0512SmileMan`）
- **相手**: 相手のプレイヤー名で記録（例：`Hooddon`）

> [!NOTE]
> ログには「自分」「相手」という表記は使われず、常にプレイヤー名で記録されます。

## 4. ログファイルからの情報抽出

### 4.1 抽出可能な情報

#### ゲーム全体の情報
- プレイヤー名（自分と相手）
- 勝敗結果
- ターン数
- 勝利条件（サイド、降参など）

#### セットアップ情報
- コイントスの結果
- 先攻/後攻
- 初期手札（自分のみ）
- マリガンの有無と回数
- 初期配置ポケモン

#### ターンごとの情報
- 引いたカード（自分のみ）
- プレイしたカード（双方）
- 使用したワザ（双方）
- 与えたダメージ
- きぜつしたポケモン
- 取ったサイドカード

#### デッキ情報（部分的）
- 自分が引いたカード
- 自分がプレイしたカード
- サーチ効果で公開されたカード
- マリガンで公開されたカード（自分または相手）

### 4.2 推測可能な情報

- **デッキ構成の一部**: プレイされたカード、引いたカードから推測
- **戦略・プレイング**: カードの使用順、ターゲット選択から推測
- **相手の手札**: プレイされたカード、使わなかったカードから推測（不完全）

### 4.3 取得困難な情報

- **相手の完全なデッキリスト**: 使われなかったカードは不明
- **相手の手札内容**: Ionoなどの効果時に枚数のみ
- **山札の順序**: シャッフルが頻繁に入るため追跡困難
- **コインフリップの詳細**: 一部のコインフリップは記録されない可能性

## 5. ログ解析の活用例

### 5.1 対戦リプレイの再現

ログファイルから以下の情報を抽出して、対戦を再現できます：
- 各ターンの盤面状態
- カードの移動
- ダメージの変化
- 勝敗の流れ

### 5.2 統計データの収集

- 使用デッキの勝率
- よく使われるカード
- ターン別の勝率
- サイドカードを取るターン数の平均

### 5.3 デッキ分析

- 自分のデッキのカード引き具合
- 事故率（マリガン頻度）
- 特定カードの使用頻度
- エネルギー加速の回数

### 5.4 プレイング改善

- ミスプレイの検出
- 最適なカードの使用タイミング
- ターゲット選択の傾向
- リソース管理の分析

## 6. ログ解析の課題

### 6.1 パース（解析）の難しさ

- カード名が複数単語にまたがる
- アクションの階層構造
- 同じアクションでも複数の表現形式がある
- 特殊文字（•、'）の処理

### 6.2 状態管理の複雑さ

完全な対戦再現には以下の状態管理が必要：
- 両プレイヤーの場の状態（バトル場、ベンチ）
- 各ポケモンのダメージ量
- 各ポケモンに付いているカード（エネルギー、道具）
- 手札、山札、捨て札、サイド、ロストゾーンの枚数
- 特殊状態
- VSTARパワーの使用状態

### 6.3 不完全な情報

- 相手の手札・山札は完全には分からない
- 一部の自動処理が省略されている可能性
- ログに記録されないルール処理がある可能性

## 7. 推奨される実装アプローチ

### 7.1 段階的な実装

1. **基本パーサー**
   - ログファイルの読み込み
   - ターンごとに分割
   - 基本的なアクションの抽出

2. **アクション識別**
   - 正規表現やパターンマッチングで各アクションを識別
   - アクションの種類ごとに構造化データに変換

3. **状態管理**
   - ゲーム状態を表すデータ構造を定義
   - 各アクションに応じて状態を更新

4. **リプレイ機能**
   - 状態の変化を可視化
   - ターンごとに再生可能にする

### 7.2 データ構造の設計

```
GameLog
├─ setup: Setup情報
│  ├─ players: プレイヤー情報
│  ├─ coinFlip: コイントス結果
│  ├─ initialHands: 初期手札
│  └─ initialBoard: 初期盤面
├─ turns: Turn[]
│  └─ Turn
│     ├─ turnNumber: ターン番号
│     ├─ player: プレイヤー名
│     └─ actions: Action[]
└─ result: 勝敗情報
```

### 7.3 重要なアクションタイプ

優先的に実装すべきアクション：
1. カードを引く
2. カードをプレイする
3. ワザを使う
4. ダメージを与える
5. ポケモンをきぜつさせる
6. サイドを取る
7. ポケモンを入れ替える
8. 進化させる
9. エネルギーを付ける

## 8. よく使われるカードの詳細なログパターン

### 8.1 サポートカード

#### Professor's Research（博士の研究）

**カード効果:**
- 手札を全て捨てて、山札から7枚引く
- 最も汎用的なドローソース

**ログパターン:**
```
<プレイヤー名> played Professor's Research.
- <プレイヤー名> discarded X cards.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
- <プレイヤー名> drew 7 cards.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
```

**実例:**
```
0512SmileMan played Professor's Research.
- 0512SmileMan discarded 6 cards.
   • Professor's Research, Boss's Orders, Prime Catcher, Energy Switch, Regidrago V, Radiant Alakazam
- 0512SmileMan drew 7 cards.
   • Nest Ball, Iono, PokéStop, Earthen Vessel, Ultra Ball, Regidrago VSTAR, Iono
```

**重要な注意点:**
- 手札の枚数に関わらず、必ず7枚引く
- 手札が0枚でも使用可能
- 捨てたカードの内容は自分のログでのみ表示される

#### Boss's Orders（ボスの指令）

**カード効果:**
- 相手のベンチポケモンを選び、バトル場のポケモンと入れ替える
- 戦略的に重要なカード

**ログパターン:**
```
<プレイヤー名> played Boss's Orders.
- <相手プレイヤー名>'s <ポケモンA> was switched with <相手プレイヤー名>'s <ポケモンB> to become the Active Pokémon.
<相手プレイヤー名>'s <ポケモンA> is now in the Active Spot.
```

**実例:**
```
0512SmileMan played Boss's Orders.
- goodboyyuyu's Baxcalibur was switched with goodboyyuyu's Chien-Pao ex to become the Active Pokémon.
goodboyyuyu's Baxcalibur is now in the Active Spot.
```

**重要な注意点:**
- 強制的にベンチポケモンをバトル場に引きずり出す
- にげるコストは不要
- 相手が選択するのではなく、使用者が選択する

#### Iono（イオノ）

Ionoは既にドキュメント化されていますが、追加で注意点があります。

**特殊なケース:**
```
0512SmileMan played Iono.
- 0512SmileMan shuffled their hand.
- 0512SmileMan put 4 cards on the bottom of their deck.
   • Nest Ball, Iono, PokéStop, Ultra Ball
- powarup shuffled their hand.
- powarup put 12 cards on the bottom of their deck.
- 0512SmileMan drew 6 cards.
   • Regidrago VSTAR, Superior Energy Retrieval, Energy Switch, Nest Ball, Nest Ball, Iono
- powarup drew 4 cards.
```

**注意:**
- 残りサイド枚数によって引く枚数が異なる
- ログから「残りサイド枚数 = 引いた枚数 + 1」が推測できる
- 例: 6枚引いた = サイド残り7枚（まだ1枚も取っていない）、4枚引いた = サイド残り5枚（1枚取った）

### 8.2 グッズカード

#### Rare Candy（ふしぎなアメ）

**カード効果:**
- ベンチの1進化ポケモンをスキップして、たねポケモンから2進化ポケモンに直接進化させる

**ログパターン:**
```
<プレイヤー名> played Rare Candy.
- <プレイヤー名> evolved <たねポケモン> to <2進化ポケモン> <場所>.
```

**実例:**
```
goodboyyuyu played Rare Candy.
- goodboyyuyu evolved Frigibax to Baxcalibur on the Bench.
```

**重要な注意点:**
- 1進化ポケモンをスキップしている
- 通常は Frigibax → Arctibax → Baxcalibur だが、Rare Candyで Frigibax → Baxcalibur に直接進化
- ログには「Rare Candy」とだけ書かれ、スキップした中間進化は記録されない

#### Energy Switch（エネルギーつけかえ）

**カード効果:**
- 自分のポケモンについているエネルギーを、別の自分のポケモンに付け替える

**ログパターン:**
```
<プレイヤー名> played Energy Switch.
- <プレイヤー名> attached <エネルギー名> to <ポケモン名> <場所>.
```

**実例:**
```
0512SmileMan played Energy Switch.
- 0512SmileMan attached Basic Grass Energy to Regidrago VSTAR in the Active Spot.
```

**重要な注意点:**
- どのポケモンから付け替えたかは記録されない
- 付け替え先のポケモンと、付け替えたエネルギーの種類のみ記録される
- 手札からエネルギーを付けたわけではないので、「番に1回のエネルギー付与」にはカウントされない

#### Super Rod（すごいつりざお）

**カード効果:**
- トラッシュからポケモンまたはエネルギーを最大3枚選び、山札に戻してシャッフル

**ログパターン:**
```
<プレイヤー名> played Super Rod.
- <プレイヤー名> shuffled X cards into their deck.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
```

**実例:**
```
0512SmileMan played Super Rod.
- 0512SmileMan shuffled 3 cards into their deck.
   • Basic Grass Energy, Basic Grass Energy, Teal Mask Ogerpon ex
```

```
goodboyyuyu played Super Rod.
- goodboyyuyu shuffled Radiant Greninja into their deck.
```

**重要な注意点:**
- 最大3枚だが、1枚だけ戻すこともできる
- 相手のSuper Rodは何を戻したか見えない場合がある

### 8.3 特殊なワザとエネルギー加速

#### Teal Dance（Teal Mask Ogerpon ex のワザ）

**ワザ効果:**
- 山札からエネルギーを1枚、自分のポケモンに付ける
- カードを1枚引く

**ログパターン:**
```
<プレイヤー名>'s Teal Mask Ogerpon ex used Teal Dance.
- <プレイヤー名> attached <エネルギー名> to <ポケモン名> <場所>.
- <プレイヤー名> drew <カード名>.  # 自分の場合のみ
```

**実例:**
```
0512SmileMan's Teal Mask Ogerpon ex used Teal Dance.
- 0512SmileMan attached Basic Grass Energy to Teal Mask Ogerpon ex in the Active Spot.
- 0512SmileMan drew Trekking Shoes.
```

**重要な注意点:**
- エネルギー加速とドローが同時に行われる
- ワザだが、ダメージを与えない補助ワザ
- 番に何度でも使える（複数のTeal Mask Ogerpon exがいれば）

#### Apex Dragon（Regidrago VSTAR のワザ）

**ワザ効果:**
- 山札にあるドラゴンタイプポケモンのワザをコピーして使用

**ログパターン:**
```
<プレイヤー名>'s Regidrago VSTAR used Apex Dragon on <対象> for <ダメージ> damage.
- <プレイヤー名> chose <コピーしたワザ名>
- [<追加効果>]
```

**実例:**
```
0512SmileMan's Regidrago VSTAR used Apex Dragon on goodboyyuyu's Radiant Greninja for 200 damage.
- 0512SmileMan chose Phantom Dive
- 0512SmileMan put 6 damage counters on goodboyyuyu's Bidoof.
```

```
0512SmileMan's Regidrago VSTAR used Apex Dragon on powarup's Raging Bolt ex for 280 damage.
- 0512SmileMan chose Lost Impact
- 0512SmileMan moved 0512SmileMan's 2 cards to the Lost Zone.
   • Basic Grass Energy, Basic Grass Energy
```

**重要な注意点:**
- 使用したワザ名が明記される
- ワザによって追加効果（ダメカン配置、ロストゾーン送りなど）がある
- コピー元のポケモンは山札にいるため、ログには登場しない

### 8.4 エネルギー回収

#### Superior Energy Retrieval（エネルギーリサイクル）

**カード効果:**
- 手札を2枚捨てて、トラッシュからエネルギーを最大4枚手札に戻す

**ログパターン:**
```
<プレイヤー名> played Superior Energy Retrieval.
- <プレイヤー名> discarded 2 cards.
   • <カード名>, <カード名>
- <プレイヤー名> moved <プレイヤー名>'s X cards to their hand.
   • <エネルギー名>, <エネルギー名>, ...
```

**実例:**
```
0512SmileMan played Superior Energy Retrieval.
- 0512SmileMan discarded 2 cards.
   • Nest Ball, PokéStop
- 0512SmileMan moved 0512SmileMan's 4 cards to their hand.
   • Basic Grass Energy, Basic Grass Energy, Basic Grass Energy, Basic Fire Energy
```

**重要な注意点:**
- 最大4枚だが、1〜3枚でも良い
- トラッシュから手札に戻すので、まだポケモンに付いていない
- その後、手張りで1枚付けるか、Energy Switchなどで付け替える

#### Earthen Vessel（大地の器）

**カード効果:**
- カードを1枚捨てて、山札から基本エネルギーを2枚手札に加える

**ログパターン:**
```
<プレイヤー名> played Earthen Vessel.
- <プレイヤー名> discarded <カード名>.
- <プレイヤー名> drew 2 cards.
   • <エネルギー名>, <エネルギー名>  # 自分の場合のみ
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
0512SmileMan played Earthen Vessel.
- 0512SmileMan discarded Buddy-Buddy Poffin.
- 0512SmileMan drew 2 cards.
   • Basic Fire Energy, Basic Psychic Energy
- 0512SmileMan shuffled their deck.
```

**重要な注意点:**
- `drew 2 cards`と書かれているが、実際はエネルギー限定
- 山札にエネルギーがない、または1枚しかない場合もある

### 8.5 スタジアムカード

#### PokéStop（ポケストップ）

**カード効果:**
- 一度使用すると、山札の上から3枚見て、トレーナーズカードを最大2枚手札に加え、残りをトラッシュ

**ログパターン（スタジアム配置）:**
```
<プレイヤー名> played PokéStop to the Stadium spot.
```

**ログパターン（効果使用）:**
```
<プレイヤー名> played PokéStop.
- <プレイヤー名> moved <プレイヤー名>'s 3 cards to the discard pile.
   • <カード名>, <カード名>, <カード名>
- <プレイヤー名> moved <プレイヤー名>'s X cards to their hand.
   • <カード名>, <カード名>  # X枚、0〜2枚
```

**実例:**
```
powarup played PokéStop to the Stadium spot.
powarup played PokéStop.
- powarup moved powarup's 3 cards to the discard pile.
   • Pal Pad, Energy Retrieval, Iono
- powarup moved powarup's 2 cards to their hand.
   • Pal Pad, Energy Retrieval
```

**重要な注意点:**
- スタジアム配置と効果使用が別々に記録される
- トラッシュに送られたカードが先に表示され、手札に加えたカードが後
- トラッシュ3枚の中から最大2枚選ぶため、手札に加えた枚数は0〜2枚

## 9. 特殊なケースとエッジケース

### 9.1 複数回マリガン

**ログパターン:**
```
<プレイヤー名> took X mulligans.
- Cards revealed from Mulligan 1
   • <カード名>, <カード名>, ...
- Cards revealed from Mulligan 2
   • <カード名>, <カード名>, ...
```

**実例:**
```
powarup took 2 mulligans.
- Cards revealed from Mulligan 1
   • Nest Ball, PokéStop, Basic Fighting Energy, Basic Grass Energy, Unfair Stamp, Basic Grass Energy, Super Rod
- Cards revealed from Mulligan 2
   • Nest Ball, Nest Ball, Boss's Orders, Basic Grass Energy, Pal Pad, Basic Grass Energy, Basic Lightning Energy
```

**重要な注意点:**
- 各マリガンで引き直した手札が全て公開される
- 相手は公開された情報から、マリガンしたプレイヤーのデッキ内容を推測できる
- マリガンした回数だけ、相手はカードを引ける

### 9.2 同じワザを複数回使用

一部のポケモンは、特性や効果により、同じターンに複数回ワザを使えます。

**実例（Teal Mask Ogerpon ex）:**
```
0512SmileMan's Teal Mask Ogerpon ex used Teal Dance.
- 0512SmileMan attached Basic Grass Energy to Teal Mask Ogerpon ex in the Active Spot.
- 0512SmileMan drew Trekking Shoes.

0512SmileMan's Teal Mask Ogerpon ex used Teal Dance.
- 0512SmileMan attached Basic Grass Energy to Teal Mask Ogerpon ex on the Bench.
- 0512SmileMan drew PokéStop.
```

**重要な注意点:**
- 同じポケモンが複数いれば、それぞれワザを使える
- ログには区別がつかないため、実装時にはポケモンの追跡が必要

### 9.3 Nest Ball で見つからない場合

**ログパターン:**
```
<プレイヤー名> played Nest Ball.
- <プレイヤー名> shuffled their deck.
```

**重要な注意点:**
- ポケモンを見つけられなかった、または選ばなかった場合
- 「drew X and played it to the Bench」が無い
- シャッフルのみ記録される

### 9.4 同一ターンでの複数きぜつ

**実例:**
```
0512SmileMan's Dragapult ex used Phantom Dive on Hooddon's Thwackey for 200 damage.
- 0512SmileMan put a damage counter on 0512SmileMan's Thwackey.
- 0512SmileMan put 5 damage counters on 0512SmileMan's Rellor.
Hooddon's Thwackey was Knocked Out!
Grookey was discarded from Hooddon's Thwackey.
Hooddon's Rellor was Knocked Out!
0512SmileMan took 2 Prize cards.
```

**重要な注意点:**
- Phantom Diveのような追加ダメージ効果で、複数のポケモンが同時にきぜつすることがある
- サイドは合計枚数（この例では2枚）を一度に取る
- きぜつしたポケモン全てについて、捨て札が記録される

### 9.5 VSTARパワーの使用制限

一度VSTARパワーを使うと、そのプレイヤーは二度と使えません。

**ログパターン:**
```
<プレイヤー名>'s <ポケモン名> used <VSTARパワー名>.
- <効果>
<プレイヤー名> can no longer use VSTAR Powers.
```

**実例:**
```
0512SmileMan's Regidrago VSTAR used Legacy Star.
- 0512SmileMan moved 0512SmileMan's 7 cards to the discard pile.
   • Great Ball, Radiant Alakazam, Nest Ball, Ultra Ball, Teal Mask Ogerpon ex, Earthen Vessel, Basic Grass Energy
- 0512SmileMan moved 0512SmileMan's 2 cards to their hand.
   • Radiant Alakazam, Boss's Orders
0512SmileMan can no longer use VSTAR Powers.
```

**重要な注意点:**
- VSTARポケモンが複数いても、VSTARパワーは対戦中1回のみ
- 「can no longer use VSTAR Powers」が表示されたら、そのプレイヤーは二度とVSTARパワーを使えない
- この制限は状態として管理する必要がある

### 9.6 ベンチが満席の場合

ベンチが満席（5匹）の状態では、ベンチに出すカードは使用できません。

**考慮点:**
- Nest Ball、Buddy-Buddy Poffinなどは使用不可
- ログには使用できなかった事実は記録されない
- プレイヤーは手札に持っているが使えない状況

### 9.7 山札切れ

山札がなくなって引けなくなった場合、そのプレイヤーの負けになります。

**ログパターン（推測）:**
```
<プレイヤー名> could not draw a card.
<相手プレイヤー名> wins.
```

> [!NOTE]
> 実際のログサンプルでは山札切れによる勝敗例が少ないため、正確なパターンは要確認

## 9.8 特殊状態の詳細（実際のログから）

> [!NOTE]
> **実際のログでの表記について**
> 実際のPTCGLログを確認したところ、どく状態で「3 damage counters」と記録されている例が見つかりました。これは以下の可能性があります：
> 1. どく+やけどの両方が付与されている（どく1個+やけど2個=合計3個）
> 2. 特殊などく状態（通常より強力な効果）
> 3. 追加効果を持つワザ
> 
> 正確なルールでは**どく=1個、やけど=2個**ですが、ログ解析時には実際の記録を優先してください。

### どく（Poisoned）と やけど（Burned）の組み合わせ

**ログパターン（両方付与）:**
```
<プレイヤー名>'s <ポケモン名> used <ワザ名>.
- <対象プレイヤー名>'s <ポケモン名> is now Poisoned.
- <対象プレイヤー名>'s <ポケモン名> is now Burned.
```

**ポケモンチェック時（両方の状態）:**
```
Pokémon Checkup
1 damage counter was placed on <プレイヤー名>'s <ポケモン名> for the Special Condition Poisoned.
2 damage counters were placed on <プレイヤー名>'s <ポケモン名> for the Special Condition Burned.
<プレイヤー名> flipped a coin and it landed on tails.
```

**実際のログ例（ガケガニのログより）:**
```
0512SmileMan's Brute Bonnet used Toxic Powder.
- Fffantasia's Arceus VSTAR is now Poisoned.

Pokémon Checkup
3 damage counters were placed on Fffantasia's Arceus VSTAR for the Special Condition Poisoned.
```

**この「3個」の解釈:**
- Toxic Powderが特殊な効果を持つ可能性（通常のどくより強力）
- または、既にやけど状態だったポケモンにどくが追加された状態
- パーサー実装時は、ログに記録された数値をそのまま使用することを推奨

**重要な注意点:**
- どく状態は自然回復しない（進化・ベンチ移動・カード効果でのみ回復）
- やけど状態はコイントスで表が出れば回復
- 複数のポケモンが同時に特殊状態になることがある
- ポケモンチェックは両プレイヤーのターン終了時に発生

**複数ポケモンのチェック:**
```
Pokémon Checkup
3 damage counters were placed on Fffantasia's Giratina VSTAR for the Special Condition Poisoned.
3 damage counters were placed on 0512SmileMan's Klawf for the Special Condition Poisoned.
```

### 9.9 進化による特殊状態解除

**ログパターン:**
```
<プレイヤー名> evolved <進化前> to <進化後> <場所>.
- <プレイヤー名>'s <進化後> is no longer Poisoned.
```

**実例:**
```
Fffantasia evolved Arceus V to Arceus VSTAR in the Active Spot.
- Fffantasia's Arceus VSTAR is no longer Poisoned.
```

**重要な注意点:**
- 進化すると、全ての特殊状態（どく、やけど、ねむり、マヒ、こんらん）が解除される
- ログには「is no longer [状態名]」と記録される

## 9.10 追加の重要カードパターン

### Serena（選択効果のあるサポート）

**カード効果:**
プレイヤーが以下の2つから1つを選ぶ：
1. 相手のベンチポケモンを入れ替える
2. 手札を最大3枚捨てて、5枚になるまで引く

**ログパターン:**
```
<プレイヤー名> played Serena.
- <プレイヤー名> chose <選択した効果の説明>.
- <効果の詳細>
```

**実例（効果2を選択）:**
```
0512SmileMan played Serena.
- 0512SmileMan chose Discard up to 3 cards from your hand. Then, draw cards until you have 5 cards in your hand.
- 0512SmileMan discarded 3 cards.
   • Oranguru V, Forest Seal Stone, Ancient Booster Energy Capsule
- 0512SmileMan drew 3 cards.
   • Klawf, Super Rod, Squawkabilly ex
```

**重要な注意点:**
- プレイヤーが選択した効果が明記される
- 効果の説明文がそのまま記録される

### Prime Catcher（両者の入れ替え）

**カード効果:**
- 自分のポケモン1匹と相手のベンチポケモン1匹を、それぞれバトル場と入れ替える

**ログパターン:**
```
<プレイヤー名> played Prime Catcher.
- <相手プレイヤー名>'s <ポケモンA> was switched with <相手プレイヤー名>'s <アクティブポケモン> to become the Active Pokémon.
- <プレイヤー名>'s <ポケモンB> was switched with <プレイヤー名>'s <アクティブポケモン> to become the Active Pokémon.
<相手プレイヤー名>'s <ポケモンA> is now in the Active Spot.
<プレイヤー名>'s <ポケモンB> is now in the Active Spot.
```

**実例:**
```
Soero played Prime Catcher.
- 0512SmileMan's Drakloak was switched with 0512SmileMan's Dreepy to become the Active Pokémon.
- Soero's Raikou V was switched with Soero's Raichu V to become the Active Pokémon.
0512SmileMan's Drakloak is now in the Active Spot.
Soero's Raikou V is now in the Active Spot.
```

**重要な注意点:**
- 両プレイヤーのポケモンが同時に入れ替わる
- Boss's Ordersと異なり、使用者も自分のポケモンを入れ替える

### Tandem Unit（ワザでベンチに出す）

**ワザ効果（Miraidon ex）:**
- 山札から「みらい」のポケモンを1枚選んでベンチに出す

**ログパターン:**
```
<プレイヤー名>'s Miraidon ex used Tandem Unit.
- <プレイヤー名> drew <ポケモン名> and played it to the Bench.
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
Soero's Miraidon ex used Tandem Unit.
- Soero drew Iron Hands ex and played it to the Bench.
- Soero shuffled their deck.
```

**重要な注意点:**
- ワザだがダメージを与えない
- Nest Ballと似た表記だが、ワザとして使用
- グッズではなくワザなので、番に何度でも使える可能性がある（複数のMiraidon exがいれば）

### Hisuian Heavy Ball（サイドカードとの交換）

**カード効果:**
- 山札からたねポケモン1枚を手札に加え、このカードをサイドに加える

**ログパターン:**
```
<プレイヤー名> played Hisuian Heavy Ball.
- <プレイヤー名> moved <プレイヤー名>'s <ポケモン名> to their hand.
- <プレイヤー名> moved <プレイヤー名>'s Hisuian Heavy Ball to the Prize cards.
- <プレイヤー名> shuffled their Prize cards.
```

**実例:**
```
0512SmileMan played Hisuian Heavy Ball.
- 0512SmileMan moved 0512SmileMan's Dreepy to their hand.
- 0512SmileMan moved 0512SmileMan's Hisuian Heavy Ball to the Prize cards.
- 0512SmileMan shuffled their Prize cards.
```

**重要な注意点:**
- このカード自体がサイドカードに加わる
- サイドがシャッフルされる
- 特殊なリソース管理カード

### Electric Generator（複数エネルギー加速）

**カード効果:**
- 山札から基本雷エネルギーを最大2枚、自分のポケモンに好きなように付ける

**ログパターン（2枚付ける場合）:**
```
<プレイヤー名> played Electric Generator.
- <プレイヤー名> attached <エネルギー名> to <ポケモンA> <場所>.
- <プレイヤー名> attached <エネルギー名> to <ポケモンB> <場所>.
- <プレイヤー名> shuffled their deck.
```

**ログパターン（1枚の場合）:**
```
<プレイヤー名> played Electric Generator.
- <プレイヤー名> attached <エネルギー名> to <ポケモン> <場所>.
- <プレイヤー名> shuffled their deck.
```

**ログパターン（エネルギーがない場合）:**
```
<プレイヤー名> played Electric Generator.
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
Soero played Electric Generator.
- Soero attached Basic Lightning Energy to Raichu V on the Bench.
- Soero attached Basic Lightning Energy to Miraidon ex on the Bench.
- Soero shuffled their deck.
```

**重要な注意点:**
- 0枚、1枚、2枚のいずれも可能
- 同じポケモンに2枚付けることも、別々のポケモンに付けることも可能

### Judge（両者が同じ枚数引く）

**カード効果:**
- お互いのプレイヤーが手札を山札に戻し、それぞれ4枚引く

**ログパターン:**
```
<プレイヤー名> played Judge.
- <プレイヤー名> shuffled X cards into their deck.
- <相手プレイヤー名> moved <相手プレイヤー名>'s Y cards to their deck.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
- <プレイヤー名> drew 4 cards.
- <相手プレイヤー名> drew 4 cards.
   • <カード名>, <カード名>, ...  # 自分の場合のみ
```

**実例:**
```
Fffantasia played Judge.
- Fffantasia shuffled a card into their deck.
- 0512SmileMan moved 0512SmileMan's 4 cards to their deck.
   • Ancient Booster Energy Capsule, Klawf, Super Rod, Squawkabilly ex
- Fffantasia drew 4 cards.
- 0512SmileMan drew 4 cards.
   • Carmine, Squawkabilly ex, Super Rod, Double Turbo Energy
```

**重要な注意点:**
- Ionoと異なり、両者とも必ず4枚引く
- サイド枚数に関係なく固定

### Capturing Aroma（コインフリップ付き）

**カード効果:**
- コインを投げて表なら、山札からポケモンを1枚手札に加える

**ログパターン（表の場合）:**
```
<プレイヤー名> played Capturing Aroma.
- <プレイヤー名> flipped a coin and it landed on heads.
- <プレイヤー名> drew <ポケモン名>.
- <プレイヤー名> shuffled their deck.
```

**ログパターン（裏の場合）:**
```
<プレイヤー名> played Capturing Aroma.
- <プレイヤー名> flipped a coin and it landed on tails.
- <プレイヤー名> drew <ポケモン名>.
- <プレイヤー名> shuffled their deck.
```

**実例:**
```
Fffantasia played Capturing Aroma.
- Fffantasia flipped a coin and it landed on tails.
- Fffantasia drew Skwovet.
- Fffantasia shuffled their deck.
```

**重要な注意点:**
- 裏でもポケモンを引いている（このカードは裏でも効果がある可能性）
- コインフリップの結果が記録される

### Professor Turo's Scenario（手札に戻す）

**カード効果:**
- 自分の場のポケモンを手札に戻す

**ログパターン:**
```
<プレイヤー名> played Professor Turo's Scenario.
- <プレイヤー名> moved <プレイヤー名>'s <進化ポケモン> to their hand.
- <エネルギー/カード> was discarded from <プレイヤー名>'s <進化ポケモン>.
- <プレイヤー名> moved <プレイヤー名>'s <下のポケモン> to their hand.
<新しいアクティブポケモン>'s <ポケモン名> is now in the Active Spot.
```

**実例:**
```
Fffantasia played Professor Turo's Scenario.
- Fffantasia moved Fffantasia's Giratina VSTAR to their hand.
- Basic Psychic Energy was discarded from Fffantasia's Giratina VSTAR.
- Fffantasia moved Fffantasia's Giratina V to their hand.
Fffantasia's Arceus V is now in the Active Spot.
```

**重要な注意点:**
- 進化ポケモンの場合、進化段階ごとに手札に戻る
- 付いているカードは捨てられる
- バトル場のポケモンを戻した場合、新しいアクティブポケモンが選ばれる

## 10. パーサー実装時の重要な注意点

### 10.1 カード名の抽出

カード名には以下の特徴があります：

- **スペースを含む**: `Buddy-Buddy Poffin`, `Teal Mask Ogerpon ex`
- **ハイフンを含む**: `Buddy-Buddy Poffin`
- **アポストロフィを含む**: `Boss's Orders`, `Professor's Research`
- **コロンを含む**: `Technical Machine: Evolution`
- **サフィックス**: `ex`, `V`, `V Max`, `VSTAR`

**推奨される正規表現:**
```python
# ポケモン名のパターン
pokemon_pattern = r"([A-Z][A-Za-z0-9 '\-:]+(?:ex|V|VMAX|VSTAR)?)"

# トレーナーズカード名のパターン
trainer_pattern = r"([A-Z][A-Za-z0-9 '\-:]+)"
```

### 10.2 数値の抽出

ログには様々な数値が登場します：

- **枚数**: `drew 7 cards`, `took 2 Prize cards`
- **ダメージ**: `for 200 damage`, `70 damage`
- **ダメカン**: `put 6 damage counters`
- **ターン番号**: `Turn # 1`

**注意点:**
- 同じ行に複数の数値が出現する場合がある
- 文脈から正しい数値を抽出する必要がある

### 10.3 プレイヤーの識別

ログを出力したプレイヤー（自分）と相手を識別する方法：

1. **初期手札の公開度**:
   - カード名が表示される → 自分
   - `7 drawn cards.`のみ → 相手

2. **引いたカードの表記**:
   - `drew <カード名>` → 自分
   - `drew a card` → 相手

3. **サイドカードの公開度**:
   - カード名が表示される → 自分
   - `A card was added to X's hand` → 相手

**実装例:**
```python
def identify_self_player(setup_lines):
    """Setup セクションからログ出力プレイヤーを特定"""
    for line in setup_lines:
        if "• " in line and "drawn cards" in prev_line:
            # カード名が列挙されている
            player_match = re.search(r"(\w+) drew 7 cards", prev_line)
            return player_match.group(1)
        prev_line = line
    return None
```

### 10.4 ゲーム状態の管理

完全な対戦再現には、以下の状態を常に追跡する必要があります：

```python
class GameState:
    def __init__(self):
        self.players = {
            "player1": PlayerState(),
            "player2": PlayerState()
        }
        self.active_player = None
        self.turn_number = 0
        self.stadium = None
        
class PlayerState:
    def __init__(self):
        self.deck_count = 60
        self.hand_count = 0
        self.hand_cards = []  # 自分の場合のみ
        self.prize_count = 6
        self.prize_cards = []  # 自分の場合のみ
        self.active_pokemon = None
        self.bench = []  # 最大5匹
        self.discard_pile = []
        self.lost_zone = []
        self.vstar_used = False
```

### 10.5 エラーハンドリング

実装時には以下のエラーケースを考慮してください：

1. **予期しないログ形式**:
   - 新しいカードで未知のパターンが出現
   - アップデートでログ形式が変更

2. **不完全な情報**:
   - 相手の手札内容は不明
   - 山札の順序は追跡不可能（シャッフルが頻繁）

3. **ログの途中終了**:
   - 降参による早期終了
   - 接続エラーなど

**推奨される対処:**
```python
def parse_action(line):
    """アクションをパース、不明な場合は警告"""
    try:
        if "played" in line:
            return parse_played_card(line)
        elif "used" in line:
            return parse_used_attack(line)
        # ... 他のパターン
        else:
            logger.warning(f"Unknown action pattern: {line}")
            return UnknownAction(line)
    except Exception as e:
        logger.error(f"Error parsing line: {line}, Error: {e}")
        return None
```

## 11. まとめ

PTCGLのログファイルは、対戦の詳細な記録を提供していますが、完全な情報ではありません。対戦リプレイを再現するには：

- **構造化された解析**: ログの階層構造を理解し、正確にパースする
- **状態管理**: ゲームの状態を常に追跡し、各アクションで更新する
- **不完全さの受容**: 相手の手札など、取得できない情報があることを前提にする

ログ解析により、対戦の振り返り、統計分析、デッキ研究など、様々な活用が可能になります。

---

## 参考情報

### ログサンプルの場所
`c:\repo\pokelog\doc\logsample\` に82個のログファイルサンプルがあります。

### 代表的なログファイル
- [`ptcgl log.txt`](file:///c:/repo/pokelog/doc/logsample/ptcgl%20log.txt) - 標準的な対戦ログ
- [`相手がすぐに降参.txt`](file:///c:/repo/pokelog/doc/logsample/相手がすぐに降参.txt) - 早期降参のログ
- [`ガオガエン　レジドラゴやけど.txt`](file:///c:/repo/pokelog/doc/logsample/ガオガエン%20レジドラゴやけど.txt) - 特殊状態を含むログ
