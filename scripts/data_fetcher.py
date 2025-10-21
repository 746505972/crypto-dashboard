import requests
import csv
import json
import time
from datetime import datetime
import os

class CryptoDataFetcher:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        # 修改为相对于仓库根目录的路径
        self.data_file = "data/crypto_data.csv"
        self.backup_file = "data/crypto_data_backup.json"
        
    def fetch_market_data(self):
        """获取加密货币市场数据"""
        try:
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': 10,
                'page': 1,
                'sparkline': 'false',
                'price_change_percentage': '24h,7d,30d'
            }
            
            print("🔄 正在从CoinGecko API获取数据...")
            response = requests.get(
                f"{self.base_url}/coins/markets",
                params=params,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ 成功获取 {len(data)} 个加密货币数据")
                return data
            elif response.status_code == 429:
                print("⚠️  API频率限制，使用本地备份数据")
                return self.read_latest_data()
            else:
                print(f"❌ API请求失败，状态码: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 网络请求错误: {e}")
            return None
        except Exception as e:
            print(f"❌ 获取数据时发生错误: {e}")
            return None
    
    def save_to_csv(self, data):
        """保存数据到CSV文件"""
        if not data:
            print("❌ 没有数据可保存")
            return False
            
        try:
            # 确保data目录存在
            os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
            
            # 定义CSV文件头
            fieldnames = [
                'timestamp', 'id', 'symbol', 'name', 'current_price', 
                'market_cap', 'market_cap_rank', 'price_change_percentage_24h',
                'high_24h', 'low_24h', 'total_volume', 'last_updated'
            ]
            
            # 检查文件是否存在，如果不存在则创建并写入表头
            file_exists = os.path.isfile(self.data_file)
            
            with open(self.data_file, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                if not file_exists:
                    writer.writeheader()
                    print("📄 创建新的CSV文件并写入表头")
                
                # 写入数据
                current_time = datetime.now().isoformat()
                for coin in data:
                    row = {
                        'timestamp': current_time,
                        'id': coin.get('id', ''),
                        'symbol': coin.get('symbol', ''),
                        'name': coin.get('name', ''),
                        'current_price': coin.get('current_price', 0),
                        'market_cap': coin.get('market_cap', 0),
                        'market_cap_rank': coin.get('market_cap_rank', 0),
                        'price_change_percentage_24h': coin.get('price_change_percentage_24h', 0),
                        'high_24h': coin.get('high_24h', 0),
                        'low_24h': coin.get('low_24h', 0),
                        'total_volume': coin.get('total_volume', 0),
                        'last_updated': coin.get('last_updated', '')
                    }
                    writer.writerow(row)
                
                print(f"💾 成功保存 {len(data)} 条数据到 {self.data_file}")
                return True
                
        except Exception as e:
            print(f"❌ 保存CSV文件时发生错误: {e}")
            return False
    
    def save_to_json(self, data):
        """保存数据到JSON备份文件"""
        try:
            # 确保data目录存在
            os.makedirs(os.path.dirname(self.backup_file), exist_ok=True)
            
            backup_data = {
                'timestamp': datetime.now().isoformat(),
                'data': data
            }
            
            with open(self.backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 数据已备份到 {self.backup_file}")
            return True
        except Exception as e:
            print(f"❌ 保存JSON备份文件时发生错误: {e}")
            return False
    
    def read_latest_data(self):
        """从CSV文件读取最新的数据"""
        try:
            if not os.path.exists(self.data_file):
                print("📂 CSV文件不存在")
                return None
            
            # 读取文件的所有行
            with open(self.data_file, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                rows = list(reader)
            
            if not rows:
                print("📂 CSV文件为空")
                return None
            
            # 获取最新的时间戳
            latest_timestamp = max(row['timestamp'] for row in rows)
            
            # 获取该时间戳的所有数据
            latest_data = [row for row in rows if row['timestamp'] == latest_timestamp]
            
            # 转换为前端需要的格式
            formatted_data = []
            for row in latest_data:
                formatted_data.append({
                    'id': row['id'],
                    'symbol': row['symbol'],
                    'name': row['name'],
                    'current_price': float(row['current_price']),
                    'market_cap': float(row['market_cap']),
                    'market_cap_rank': int(row['market_cap_rank']),
                    'price_change_percentage_24h': float(row['price_change_percentage_24h']),
                    'high_24h': float(row['high_24h']),
                    'low_24h': float(row['low_24h']),
                    'total_volume': float(row['total_volume']),
                    'last_updated': row['last_updated'],
                    'image': self.get_coin_image(row['id'])
                })
            
            print(f"📖 从CSV文件读取了 {len(formatted_data)} 条最新数据")
            return formatted_data
            
        except Exception as e:
            print(f"❌ 读取CSV文件时发生错误: {e}")
            return None
    
    def get_coin_image(self, coin_id):
        """根据币种ID获取图片URL"""
        images = {
            'bitcoin': 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            'ethereum': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            'binancecoin': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
            'ripple': 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
            'cardano': 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
            'solana': 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
            'dogecoin': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
            'polkadot': 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
            'matic-network': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
            'stellar': 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png'
        }
        return images.get(coin_id, 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png')
    
    def run(self):
        """主运行函数"""
        print("🚀 === 加密货币数据获取脚本 ===")
        print(f"⏰ 执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 尝试从API获取数据
        api_data = self.fetch_market_data()
        
        if api_data:
            # 保存到CSV和JSON
            self.save_to_csv(api_data)
            self.save_to_json(api_data)
            print("✅ 数据获取和保存完成！")
        else:
            print("❌ API获取失败，尝试从本地文件读取数据...")
            local_data = self.read_latest_data()
            if local_data:
                print("✅ 成功从本地文件读取数据")
                # 将本地数据保存为最新的JSON备份
                self.save_to_json(local_data)
            else:
                print("❌ 无法从任何来源获取数据")

def main():
    fetcher = CryptoDataFetcher()
    fetcher.run()

if __name__ == "__main__":
    main()