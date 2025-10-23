import datetime
import requests
import csv

# === 基础配置 ===
COIN_ID = "bitcoin"
CURRENCY = "usd"
DAYS = 1
API_KEY = "<api-key>"  # 可为空字符串

# === 时间区间 ===
current_time = datetime.datetime.now()
one_year_ago = current_time - datetime.timedelta(days=DAYS)
current_timestamp = int(current_time.timestamp())
one_year_ago_timestamp = int(one_year_ago.timestamp())

# === 请求头 ===
headers = {"x-cg-demo-api-key": API_KEY} if API_KEY else {}

# === 1️⃣ 获取市场数据（价格、市值、交易量） ===
url_chart = f"https://api.coingecko.com/api/v3/coins/{COIN_ID}/market_chart/range"
params_chart = {
    "vs_currency": CURRENCY,
    "from": one_year_ago_timestamp,
    "to": current_timestamp
}
print(f"正在获取 {COIN_ID} 一年内 market_chart 数据...")
chart_data = requests.get(url_chart, params=params_chart).json()

prices = chart_data.get("prices", [])
market_caps = chart_data.get("market_caps", [])
total_volumes = chart_data.get("total_volumes", [])

# === 2️⃣ 获取OHLC数据 ===
url_ohlc = f"https://api.coingecko.com/api/v3/coins/{COIN_ID}/ohlc"
params_ohlc = {"vs_currency": CURRENCY, "days": DAYS}
print(f"正在获取 {COIN_ID} 一年内 OHLC 数据...")
ohlc_data = requests.get(url_ohlc, params=params_ohlc).json()

# === 3️⃣ 整合数据 ===
# 先把OHLC数据转成字典（按日期索引）
ohlc_map = {}
for item in ohlc_data:
    ts = int(item[0] / 1000)
    time_str = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
    ohlc_map[time_str] = {
        "open": item[1],
        "high": item[2],
        "low": item[3],
        "close": item[4]
    }

# 组合所有字段
rows = []
for p, m, v in zip(prices, market_caps, total_volumes):
    ts = int(p[0] / 1000)
    time_str = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
    row = {
        "time": time_str,
        "price": p[1],
        "market_cap": m[1],
        "total_volume": v[1],
        "open": None,
        "high": None,
        "low": None,
        "close": None
    }
    # 若该时间点有OHLC数据则补上
    if time_str in ohlc_map:
        row.update(ohlc_map[time_str])
    rows.append(row)

# === 4️⃣ 保存到CSV ===
filename = f"{COIN_ID}_market_data_with_ohlc.csv"
with open(filename, "w", newline='', encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "time", "open", "high", "low", "close",
        "price", "market_cap", "total_volume"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ 数据已保存到 {filename}，共 {len(rows)} 条记录。")
