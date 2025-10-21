// 加密货币历史数据API
const HISTORY_API = {
    baseURL: 'https://api.coingecko.com/api/v3',
    proxyURL: 'https://corsproxy.io/?',
    
    // 获取历史数据（按日期）
    async getHistoryByDate(coinId, date) {
        try {
            const url = `${this.proxyURL}${encodeURIComponent(
                `${this.baseURL}/coins/${coinId}/history?date=${date}&localization=false`
            )}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API错误: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('获取历史数据失败:', error);
            throw error;
        }
    },
    
    // 获取时间范围数据
    async getMarketChartRange(coinId, vsCurrency, from, to) {
        try {
            const url = `${this.proxyURL}${encodeURIComponent(
                `${this.baseURL}/coins/${coinId}/market_chart/range?vs_currency=${vsCurrency}&from=${from}&to=${to}`
            )}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API错误: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('获取时间范围数据失败:', error);
            throw error;
        }
    },
    
    // 生成模拟历史数据（避免API限制）
    generateMockHistoricalData(coinId, days = 30) {
        const basePrice = {
            'bitcoin': 45000,
            'ethereum': 3000,
            'binancecoin': 600,
            'ripple': 0.6,
            'cardano': 0.5
        }[coinId] || 1000;
        
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // 模拟价格波动
            const volatility = (Math.random() - 0.5) * 0.1; // ±5% 波动
            const price = basePrice * (1 + volatility);
            const priceChange24h = (Math.random() - 0.5) * 20; // ±10% 变化
            const volume = basePrice * 1000000 * (0.5 + Math.random());
            const marketCap = basePrice * 10000000 * (0.8 + Math.random() * 0.4);
            
            data.push({
                date: date.toISOString().split('T')[0],
                timestamp: date.getTime(),
                price: Number(price.toFixed(2)),
                priceChange24h: Number(priceChange24h.toFixed(2)),
                volume: Number(volume.toFixed(0)),
                marketCap: Number(marketCap.toFixed(0))
            });
        }
        
        return data;
    }
};

// 计算关键指标
function calculateMetrics(historicalData) {
    if (!historicalData || historicalData.length === 0) {
        return {
            currentPrice: 0,
            priceChange24h: 0,
            periodHigh: 0,
            periodLow: 0,
            periodHighDate: '',
            periodLowDate: '',
            averagePrice: 0,
            volatility: 0
        };
    }
    
    const prices = historicalData.map(d => d.price);
    const currentPrice = historicalData[historicalData.length - 1].price;
    const firstPrice = historicalData[0].price;
    const priceChange24h = historicalData[historicalData.length - 1].priceChange24h;
    
    const periodHigh = Math.max(...prices);
    const periodLow = Math.min(...prices);
    const periodHighDate = historicalData.find(d => d.price === periodHigh)?.date || '';
    const periodLowDate = historicalData.find(d => d.price === periodLow)?.date || '';
    
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // 计算波动率（标准差）
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
    const volatility = Number((Math.sqrt(variance) / averagePrice * 100).toFixed(2));
    
    return {
        currentPrice,
        priceChange24h,
        periodHigh,
        periodLow,
        periodHighDate: formatDisplayDate(periodHighDate),
        periodLowDate: formatDisplayDate(periodLowDate),
        averagePrice: Number(averagePrice.toFixed(2)),
        volatility
    };
}

// 工具函数
function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}