// 主Vue应用
const { createApp } = Vue;

createApp({
    data() {
        return {
            loading: false,
            error: null,
            cryptocurrencies: [],
            lastUpdated: null,
            useMockData: false
        };
    },
    
    async mounted() {
        await this.fetchMarketData();
    },
    
    methods: {
        async fetchMarketData() {
            this.loading = true;
            this.error = null;
            
            try {
                const data = await cryptoAPI.getMarketData();
                this.cryptocurrencies = data;
                
                // 检查是否是模拟数据
                this.useMockData = data.length > 0 && data[0].id === 'bitcoin';
                
                // 更新最后刷新时间
                this.lastUpdated = new Date().toLocaleString('zh-CN');
                
                console.log('数据获取成功:', data.length, '个币种');
                
            } catch (err) {
                this.error = `获取数据失败: ${err.message}`;
                console.error('数据获取错误:', err);
            } finally {
                this.loading = false;
            }
        },
        
        formatPrice,
        formatMarketCap,
        formatVolume,
        getChangeClass
    }
}).mount('#app');