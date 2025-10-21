// CoinGecko API 服务
class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.proxyURL = 'https://corsproxy.io/?';
        this.localDataURL = 'data/crypto_data_backup.json';
    }

    // 获取市场数据 - 优先使用API，失败时使用本地数据
    async getMarketData() {
        try {
            console.log('尝试从CoinGecko API获取实时数据...');
            const apiData = await this.fetchFromAPI();
            return apiData;
        } catch (error) {
            console.warn('API获取失败，尝试使用本地数据:', error.message);
            try {
                const localData = await this.fetchFromLocal();
                return localData;
            } catch (localError) {
                console.error('本地数据也获取失败，使用模拟数据:', localError.message);
                return this.getMockData();
            }
        }
    }

    // 从API获取数据
    async fetchFromAPI() {
        const params = {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
        };

        const queryString = new URLSearchParams(params).toString();
        const url = `${this.proxyURL}${encodeURIComponent(`${this.baseURL}/coins/markets?${queryString}`)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('成功从API获取数据');
        return data;
    }

    // 从本地JSON文件获取数据
    async fetchFromLocal() {
        const response = await fetch(this.localDataURL);
        
        if (!response.ok) {
            throw new Error(`本地文件读取失败: ${response.status}`);
        }

        const backupData = await response.json();
        console.log('成功从本地文件读取数据');
        return backupData.data || backupData;
    }

    // 模拟数据 - 最后的降级方案
    getMockData() {
        const coins = [
            {
                id: 'unknown-coin',
                symbol: 'unk',
                name: 'unknown Coin',
                image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
                current_price: 45000 + Math.random() * 5000,
                market_cap: 880000000000,
                market_cap_rank: 1,
                price_change_percentage_24h: (Math.random() * 10 - 5),
                high_24h: 46000,
                low_24h: 44000,
                total_volume: 25000000000,
                last_updated: new Date().toISOString()
            }
        ];

        console.log('使用模拟数据');
        return coins;
    }
}

// 创建全局API实例
const cryptoAPI = new CoinGeckoAPI();

// 工具函数
function formatPrice(price) {
    if (!price) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

function formatMarketCap(marketCap) {
    if (!marketCap) return '0';
    if (marketCap >= 1e12) return (marketCap / 1e12).toFixed(2) + 'T';
    if (marketCap >= 1e9) return (marketCap / 1e9).toFixed(2) + 'B';
    if (marketCap >= 1e6) return (marketCap / 1e6).toFixed(2) + 'M';
    return marketCap.toString();
}

function formatVolume(volume) {
    if (!volume) return '0';
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toString();
}

function getChangeClass(change) {
    if (!change) return '';
    return change >= 0 ? 'positive' : 'negative';
}