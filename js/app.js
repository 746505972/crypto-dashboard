// 主Vue应用
const { createApp } = Vue;

createApp({
    data() {
        return {
            loading: false,
            error: null,
            allCoins: [],          // 所有缓存的币
            cryptocurrencies: [],  // 当前页展示币
            currentPage: 1,        // 当前页码（每页9个）
            coinsPerPage: 9,       // 每页数量
            batchSize: 100,        // 每次请求的数量
            lastFetchedBatch: 0,   // 已请求到的批次（每批100）
            dataSource: 'local', // 'api' | 'local' | 'mock'
            dataTimestamp: null,
            selectedCoin: null,
            currentPage: 1,
            gotoPageInput: '', // 用户输入的页码
        };
    },
    
    async mounted() {
        await this.loadCoinsIfNeeded(1);
    },
    
    methods: {
        // 检查是否需要加载更多数据
        async loadCoinsIfNeeded(page) {
            const batchNeeded = Math.ceil((page * this.coinsPerPage) / this.batchSize);
            if (batchNeeded <= this.lastFetchedBatch) {
                // 已经有数据了，直接分页展示
                this.updatePage(page);
                return;
            }

            // 否则请求新的一批
            await this.fetchMarketData(batchNeeded);
            this.updatePage(page);
        },

        // 从API获取100个一批的数据并缓存
        async fetchMarketData(batch = 1) {
            this.loading = true;
            this.error = null;
            
            try {
                const data = await cryptoAPI.getMarketData(batch);
                this.allCoins.push(...data);   // 累积缓存
                this.lastFetchedBatch = batch;
                
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

        // 更新当前页显示内容
        updatePage(page) {
            const start = (page - 1) * this.coinsPerPage;
            const end = start + this.coinsPerPage;
            this.cryptocurrencies = this.allCoins.slice(start, end);
            this.currentPage = page;
        },

        // 页码跳转
        async goToPage() {
            const target = parseInt(this.gotoPageInput);
            if (isNaN(target) || target < 1) {
                alert('请输入有效页码');
                return;
            }

            const maxPage = Math.ceil((this.lastFetchedBatch * this.batchSize) / this.coinsPerPage);

            // 若目标页比已有页还大 → 自动加载新批次
            if (target > maxPage) {
                const batchNeeded = Math.ceil((target * this.coinsPerPage) / this.batchSize);
                await this.fetchMarketData(batchNeeded);
            }

            await this.loadCoinsIfNeeded(target);
            this.gotoPageInput = ''; // 清空输入
        },

        async goToPageOne() {
            await this.loadCoinsIfNeeded(1);
        },

        // 翻页
        async nextPage() {
            const nextPage = this.currentPage + 1;
            await this.loadCoinsIfNeeded(nextPage);
        },
        async prevPage() {
            if (this.currentPage > 1) {
                await this.loadCoinsIfNeeded(this.currentPage - 1);
            }
        },

        // 进入货币详情
        viewCoinDetails(coin) {
            this.selectedCoin = coin;
        },
        
        formatPrice,
        formatMarketCap,
        formatVolume,
        getChangeClass
    }
}).mount('#app');