// 主Vue应用
const { createApp } = Vue;

createApp({
    data() {
        return {
            loading: false,
            error: null,
            cryptocurrencies: [],
            lastUpdated: null,
            useLocalData: false,
            dataTimestamp: null
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
                
                // 检查数据来源
                this.useLocalData = data._source === 'local';
                this.dataTimestamp = data.timestamp ? 
                    new Date(data.timestamp).toLocaleString('zh-CN') : null;
                
                // 更新最后刷新时间
                this.lastUpdated = new Date().toLocaleString('zh-CN');
                
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