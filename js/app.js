// 主Vue应用
const { createApp } = Vue;

createApp({
    data() {
        return {
            loading: false,
            error: null,
            cryptocurrencies: [],
            dataSource: 'local', // 'api' | 'local' | 'mock'
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
                this.dataSource = data._source || 'local';
                this.dataTimestamp = 
                    data[0].last_updated
                        ? new Date(data[0].last_updated).toLocaleString('zh-CN')
                        : null;
                  
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