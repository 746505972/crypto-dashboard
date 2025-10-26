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

            // 先创建调试用的简化图表
            this.$nextTick(() => {
                const debugDom = document.getElementById('debug-chart');
                if (!debugDom) {
                    console.error('找不到调试图表容器 #debug-chart');
                    return;
                }

                if (this.debugChart) {
                    this.debugChart.dispose();
                }
                this.debugChart = echarts.init(debugDom);
                const debugChart = echarts.init(debugDom);
                
                const debugData = this.coinHistory.map(d => ({
                    date: new Date(d.timestamp),
                    price: parseFloat(d.current_price),
                    volume: parseFloat(d.total_volume),
                    market_cap: parseFloat(d.market_cap) || null,
                    market_cap_rank: parseInt(d.market_cap_rank) || null,
                    price_change_percentage_24h: parseFloat(d.price_change_percentage_24h) || 0,
                    high_24h: parseFloat(d.high_24h) || null,
                    low_24h: parseFloat(d.low_24h) || null,
                }));
                
                // 调试用配置 - 也使用双图表布局
                const debugOption = {
                    title: {
                        text: `${this.selectedCoin.name} (${this.selectedCoin.symbol.toUpperCase()})`,
                        left: 'center',
                        textStyle: {
                            color: '#666',
                            fontSize: 16
                        }
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                            crossStyle: {
                                color: '#999'
                            }
                        },
                        snap: true,
                        label: {
                            show: true,  // 确保显示坐标值
                            backgroundColor: '#666'
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        textStyle: {
                            color: '#fff'
                        },
                        formatter: function(params) {
                            try {
                                // 1. 时间格式化
                                const date = new Date(params[0].axisValue);
                                const timeStr = isNaN(date.getTime()) 
                                    ? params[0].axisValue 
                                    : `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                                
                                // 2. 构建结果
                                let result = [`<div style="font-weight:bold;">📅 ${timeStr}</div>`];
                                
                                params.forEach(param => {
                                   
                                    // 3. 根据不同系列采用不同格式化方式
                                    if (param.seriesName === '价格') {
                                        result.push(`<div>价格: <span style="color:${param.color}">$${
                                            param.data.value[1].toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })
                                        }</span></div>`);
                                        result.push(`<div>市值: <span>$${
                                            param.data.rawData.market_cap.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })
                                        }</span></div>`);
                                        result.push(`<div>市值排名: <span>${
                                            param.data.rawData.market_cap_rank
                                        }</span></div>`);    
                                        result.push(`<div>24小时变化率: <span>${
                                            param.data.rawData.price_change_percentage_24h
                                        }</span></div>`); 
                                        result.push(`<div>24小时最高价: <span>${
                                            param.data.rawData.high_24h.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })
                                        }</span></div>`); 
                                        result.push(`<div>24小时最低价: <span>${
                                            param.data.rawData.low_24h.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })
                                        }</span></div>`);

                                    } else if (param.seriesName === '交易量') {
                                        result.push(`<div>交易量: <span style="color:${param.color}">$${
                                            param.data[1].toLocaleString('en-US', {
                                                maximumFractionDigits: 0
                                            })
                                        }</span></div>`);
                                    }
                                });


                                return result.join('');
                            } catch (error) {
                                console.error('Error formatting tooltip:', error);
                                return '数据格式错误';
                            }}
                    },
                    grid: [
                        {
                            // 价格图区域 - 上半部分
                            top: '10%',
                            bottom: '30%',
                            left: '10%',
                            right: '10%',
                            containLabel: true
                        },
                        {
                            // 交易量图区域 - 下半部分
                            top: '75%',
                            bottom: '10%',
                            left: '10%',
                            right: '10%',
                            containLabel: true
                        }
                    ],
                    xAxis: [
                        {
                            // 价格图的X轴
                            type: 'time',
                            name: '时间',
                            gridIndex: 0,
                            axisLabel: {
                                color: '#666',
                                rotate: 0,
                                interval: 'auto',
                                formatter: '{MM}-{dd} {HH}:{mm}',

                            },
                            axisLine: {
                                lineStyle: {
                                    color: '#ccc'
                                }
                            },
                            boundaryGap: false, // 重要：让数据点从边缘开始
                            min: 'dataMin', // 确保最小值为数据最小值
                            max: 'dataMax'  // 确保最大值为数据最大值                            
                        },
                        {
                            // 交易量图的X轴
                            type: 'time',
                            gridIndex: 1,
                            axisLabel: {
                                show: false
                            },
                            axisTick: {
                                show: false
                            },
                            axisLine: {
                                show: false
                            },
                            boundaryGap: false, // 重要：让数据点从边缘开始
                        }
                    ],
                    yAxis: [
                        {
                            // 价格图的Y轴
                            type: 'value',
                            gridIndex: 0,
                            scale: true,
                            name: '价格 (USD)',
                            position: 'left',
                            axisLabel: {
                                color: '#666',
                                formatter: '${value}',
                                interval: 'auto'
                            },
                            axisLine: {
                                lineStyle: {
                                    color: '#ccc'
                                }
                            },
                            splitLine: {
                                lineStyle: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            }
                        },
                        {
                            // 交易量图的Y轴
                            type: 'value',
                            gridIndex: 1,
                            name: '交易量',
                            position: 'left',
                            axisLabel: {
                                color: '#666',
                                interval: 'auto',
                                formatter: function(value) {
                                    if (!value) return '0';
                                    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
                                    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
                                    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
                                    return value.toString();
                                },
                                show: true
                            },
                            axisLine: {
                                lineStyle: {
                                    color: '#ccc'
                                }
                            },
                            splitLine: {
                                lineStyle: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            }
                        }
                    ],
                    series: [
                        { // 价格线
                            name: '价格',
                            type: 'line',
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                            data: debugData.map(d => ({value: [d.date, d.price],
                                rawData: d
                            })),
                            smooth: true,
                            symbolSize: 4,
                            itemStyle: {
                                color: 'rgba(75, 192, 192, 1)'
                            },
                            lineStyle: {
                                color: 'rgba(75, 192, 192, 1)',
                                width: 2
                            },
                            areaStyle: {
                                color: {
                                    type: 'linear',
                                    x: 0,
                                    y: 0,
                                    x2: 0,
                                    y2: 1,
                                    colorStops: [{
                                        offset: 0,
                                        color: 'rgba(75, 192, 192, 0.3)'
                                    }, {
                                        offset: 1,
                                        color: 'rgba(75, 192, 192, 0.1)'
                                    }]
                                }
                            },
                            emphasis: {
                                focus: 'series'
                            }
                        },
                        { // 交易量线
                            name: '交易量',
                            type: 'bar',
                            xAxisIndex: 1,
                            yAxisIndex: 1,
                            data: debugData.map(d => [d.date, d.volume]),
                            itemStyle: {
                                color: 'rgba(54, 162, 235, 0.7)'
                            },

                            emphasis: {
                                focus: 'series'
                            }
                        },
                    ],
                    dataZoom: [
                        {
                            type: 'inside',
                            xAxisIndex: [0, 1],
                            filterMode: 'none',
                            start: 70,
                            end: 100,
                            zoomOnMouseWheel: true,
                            moveOnMouseMove: true
                        },
                        {
                            type: 'slider',
                            xAxisIndex: [0, 1],
                            start: 70,
                            end: 100,
                            filterMode: 'none'
                        }
                    ],
                    axisPointer: {
                        link: { xAxisIndex: 'all' },
                        triggerTooltip: true
                    }
                };
                
                debugChart.setOption(debugOption);
                
                // 添加事件监听用于调试
                debugChart.on('dataZoom', params => {
                    console.log('调试图表缩放事件:', {
                        start: params.start,
                        end: params.end,
                        startValue: params.startValue,
                        endValue: params.endValue
                    });
                });
                   
            });
        

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