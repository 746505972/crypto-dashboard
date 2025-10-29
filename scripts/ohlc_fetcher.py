import requests
import json
import os
from datetime import datetime
import time

# 配置参数
COINS = ['bitcoin', 'ethereum']  # 要获取的币种列表
VS_CURRENCY = 'usd'  # 计价货币
TIME_RANGES = ['1', '7', '30']  # 要获取的时间范围（天）
API_URL = "https://api.coingecko.com/api/v3/coins/{coin_id}/ohlc"
DATA_DIR = "data"
OUTPUT_FILE = "ohlc_data.json"

# 创建数据目录
os.makedirs(DATA_DIR, exist_ok=True)

def fetch_ohlc_data(coin_id, days):
    """获取单个币种指定天数的OHLC数据"""
    params = {"vs_currency": VS_CURRENCY, "days": days}
    try:
        response = requests.get(API_URL.format(coin_id=coin_id), params=params)
        response.raise_for_status()  # 检查请求是否成功
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"获取 {coin_id} {days}天数据失败: {e}")
        return None

def main():
    final_data = {}
    
    for coin in COINS:
        print(f"正在获取 {coin} 数据...")
        coin_data = {}
        
        for days in TIME_RANGES:
            # 获取数据
            data = fetch_ohlc_data(coin, days)
            if data:
                # 按照时间范围存储数据
                time_key = f"{days}d"  # 如 "1d", "7d"
                coin_data[time_key] = data
            
            # 礼貌性延迟，避免API限速
            time.sleep(1)
        
        # 将币种数据添加到最终结果
        final_data[coin] = coin_data
    
    # 保存到JSON文件
    output_path = os.path.join(DATA_DIR, OUTPUT_FILE)
    with open(output_path, 'w') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"所有数据已保存至 {output_path}")

if __name__ == "__main__":
    main()
    