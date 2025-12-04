"""
Pokemon TCG API を使用してカード名と画像URLを取得するスクリプト
"""
import requests
import json
import time

# APIのベースURL
BASE_URL = "https://api.pokemontcg.io/v2"

def fetch_all_cards(max_cards=None):
    """
    すべてのカードを取得する
    
    Args:
        max_cards: 取得する最大カード数（Noneの場合は全て）
    
    Returns:
        カードのリスト
    """
    all_cards = []
    page = 1
    page_size = 250  # 1ページあたりの最大カード数
    
    print("Pokemon TCG APIからカードデータを取得中...")
    
    while True:
        try:
            url = f"{BASE_URL}/cards"
            params = {
                "page": page,
                "pageSize": page_size
            }
            
            print(f"ページ {page} を取得中... (現在 {len(all_cards)} 枚)")
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            cards = data.get("data", [])
            
            if not cards:
                print("これ以上カードがありません。")
                break
            
            all_cards.extend(cards)
            
            # 最大枚数チェック
            if max_cards and len(all_cards) >= max_cards:
                all_cards = all_cards[:max_cards]
                print(f"最大枚数 {max_cards} に達しました。")
                break
            
            # ページネーション情報
            total_count = data.get("totalCount", 0)
            print(f"  進行状況: {len(all_cards)}/{total_count}")
            
            # 次のページがあるかチェック
            if len(all_cards) >= total_count:
                print("全カードを取得しました。")
                break
            
            page += 1
            
            # API rate limit対策（念のため）
            time.sleep(0.1)
            
        except requests.exceptions.RequestException as e:
            print(f"エラーが発生しました: {e}")
            break
    
    return all_cards

def extract_card_info(cards):
    """
    カードリストからカード名と画像URLを抽出
    
    Args:
        cards: カードのリスト
    
    Returns:
        {card_id, name, image_url, image_small, set, number}のリスト
    """
    card_info_list = []
    
    for card in cards:
        card_info = {
            "id": card.get("id", ""),
            "name": card.get("name", ""),
            "set_name": card.get("set", {}).get("name", ""),
            "set_id": card.get("set", {}).get("id", ""),
            "number": card.get("number", ""),
            "image_small": card.get("images", {}).get("small", ""),
            "image_large": card.get("images", {}).get("large", ""),
            "supertype": card.get("supertype", ""),
            "subtypes": card.get("subtypes", []),
            "hp": card.get("hp", ""),
            "types": card.get("types", [])
        }
        card_info_list.append(card_info)
    
    return card_info_list

def save_to_json(data, filename):
    """
    データをJSONファイルに保存
    
    Args:
        data: 保存するデータ
        filename: ファイル名
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"データを {filename} に保存しました。")

def save_to_csv(data, filename):
    """
    データをCSVファイルに保存
    
    Args:
        data: 保存するデータ
        filename: ファイル名
    """
    import csv
    
    if not data:
        print("データがありません。")
        return
    
    # CSVのヘッダー
    headers = ["id", "name", "set_name", "set_id", "number", 
               "image_small", "image_large", "supertype", 
               "subtypes", "hp", "types"]
    
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for card in data:
            # リストを文字列に変換
            row = card.copy()
            row["subtypes"] = ", ".join(card.get("subtypes", []))
            row["types"] = ", ".join(card.get("types", []))
            writer.writerow(row)
    
    print(f"データを {filename} に保存しました。")

def main():
    """メイン処理"""
    print("=" * 60)
    print("Pokemon TCG Card Data Fetcher")
    print("=" * 60)
    
    # 全カードを取得（テスト用に最初の100枚のみ取得する場合は max_cards=100 を指定）
    # cards = fetch_all_cards(max_cards=100)  # テスト用
    cards = fetch_all_cards()  # 全カード取得
    
    print(f"\n合計 {len(cards)} 枚のカードを取得しました。")
    
    # カード情報を抽出
    card_info = extract_card_info(cards)
    
    # JSONファイルに保存
    json_path = "c:\\repo\\pokelog\\data\\pokemon_cards.json"
    save_to_json(card_info, json_path)
    
    # CSVファイルに保存
    csv_path = "c:\\repo\\pokelog\\data\\pokemon_cards.csv"
    save_to_csv(card_info, csv_path)
    
    # サンプルを表示
    print("\n--- サンプルカード（最初の5枚）---")
    for i, card in enumerate(card_info[:5], 1):
        print(f"\n{i}. {card['name']} ({card['set_name']} #{card['number']})")
        print(f"   ID: {card['id']}")
        print(f"   画像（小）: {card['image_small']}")
        print(f"   画像（大）: {card['image_large']}")
    
    print("\n完了しました！")

if __name__ == "__main__":
    main()
