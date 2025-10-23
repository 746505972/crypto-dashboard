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
            coinHistory: [], 
            chart: null, 
            chartError: null,
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
        
        async viewCoinDetails(coin) {
            this.selectedCoin = coin;
            this.chartError = null;

            const csvPath = `data/crypto_data.csv`; // ✅ 改成统一文件
            try {
                const response = await fetch(csvPath);
                if (!response.ok) throw new Error(`无法读取 ${csvPath}`);
                const text = await response.text();

                // 解析 CSV
                const lines = text.trim().split("\n");
                const headers = lines[0].split(",");
                const data = lines.slice(1).map(line => {
                    const values = line.split(",");
                    const row = {};
                    headers.forEach((h, i) => (row[h] = values[i]));
                    return row;
                });

                // ✅ 过滤出当前币种
                const filtered = data.filter(d => d.id === coin.id);

                if (!filtered.length) {
                    throw new Error(`未找到 ${coin.id} 的历史数据`);
                }

                this.coinHistory = filtered;

                // ✅ 确保 DOM 更新后绘制图表
                this.$nextTick(() => {
                    this.renderChart();
                });

            } catch (err) {
                console.error("加载历史数据失败:", err);
                this.chartError = `加载历史数据失败: ${err.message}`;
            }
        },

        renderChart() {
            if (!this.coinHistory.length) return;

            // 格式化时间标签，精确到分钟
            const labels = this.coinHistory.map(d => {
                const date = new Date(d.timestamp);
                return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            });
            
            const prices = this.coinHistory.map(d => parseFloat(d.current_price));
            const volumes = this.coinHistory.map(d => parseFloat(d.total_volume));

            const mainCtx = document.getElementById("mainChart").getContext("2d");
            const volCtx = document.getElementById("volumeChart").getContext("2d");

            if (this.mainChart) this.mainChart.destroy();
            if (this.volumeChart) this.volumeChart.destroy();

            // 记录拖动选择区间
            let dragStartIdx = null;
            let dragEndIdx = null;
            let isDragging = false;

            // 现代风格的主图配置
            this.mainChart = new Chart(mainCtx, {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "价格",
                        data: prices,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderWidth: 2,
                        pointRadius: 3,  // 显示点
                        pointHoverRadius: 5,  // 悬停时放大点
                        pointBackgroundColor: "rgba(75, 192, 192, 1)",
                        tension: 0.4,
                        fill: false  // 移除填充
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            title: { display: true, text: "价格 (USD)", color: "#666" },
                            grid: { color: "rgba(0, 0, 0, 0.05)" }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: "#666", maxRotation: 45, minRotation: 45 ,

                            }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: "#666" } },
                        tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.7)",
                            titleColor: "#fff",
                            bodyColor: "#fff",
                            callbacks: {
                            label: function(context) {
                                // 自定义工具提示内容
                                const price = context.parsed.y;
                                const volume = volumes[context.dataIndex];
                                return [
                                    `价格: $${price.toFixed(2)}`,
                                    `交易量: $${volume.toLocaleString()}`,
                                    `时间: ${labels[context.dataIndex]}`
                                ];
                            }
                        },
                            intersect: false,
                            mode: 'nearest',
                            position: 'nearest'
                        },
                        zoom: {
                            pan: { enabled: true, mode: "x" },
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                mode: "x"
                            }
                        }
                    }
                }
            });

            // 现代风格的交易量图
            this.volumeChart = new Chart(volCtx, {
                type: "bar",
                data: {
                    labels,
                    datasets: [{
                        label: "交易量",
                        data: volumes,
                        backgroundColor: "rgba(54, 162, 235, 0.7)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });

            // 鼠标拖动选择事件
            volCtx.canvas.addEventListener("mousedown", e => {
                const points = this.volumeChart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                if (points.length) {
                    dragStartIdx = points[0].index;
                    isDragging = true;
                }
            });

            volCtx.canvas.addEventListener("mousemove", e => {
                if (!isDragging) return;
                const points = this.volumeChart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
                if (points.length) {
                    dragEndIdx = points[0].index;
                    highlightRange(dragStartIdx, dragEndIdx);
                    updateMainChart(dragStartIdx, dragEndIdx);
                }
            });

            volCtx.canvas.addEventListener("mouseup", e => {
                isDragging = false;
            });

            // 更新主图显示范围
            const updateMainChart = (start, end) => {
                if (start == null || end == null) return;
                const [minIdx, maxIdx] = start < end ? [start, end] : [end, start];
                this.mainChart.options.scales.x.min = minIdx;
                this.mainChart.options.scales.x.max = maxIdx;
                this.mainChart.update();
            };

            // 可视化选区
            const highlightRange = (start, end) => {
                const dataset = this.volumeChart.data.datasets[0];
                dataset.backgroundColor = dataset.data.map((v, i) => {
                    const [minIdx, maxIdx] = start < end ? [start, end] : [end, start];
                    return i >= minIdx && i <= maxIdx ? "rgba(255, 99, 132, 0.7)" : "rgba(54, 162, 235, 0.7)";
                });
                this.volumeChart.update('none');
            };
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

        formatPrice,
        formatMarketCap,
        formatVolume,
        getChangeClass
    }
}).mount('#app');