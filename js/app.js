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



            const throttle = (func, delay) => {
                let timer = null;
                return function() {
                    const context = this;
                    const args = arguments;
                    if (!timer) {
                        timer = setTimeout(() => {
                            func.apply(context, args);
                            timer = null;
                        }, delay);
                    }
                };
            };

            // 确保 DOM 已经渲染
            this.$nextTick(() => {
                const chartDom = document.getElementById('main');
                if (!chartDom) {
                    console.error('找不到图表容器 #main');
                    return;
                }

                // 如果已有图表实例，先销毁
                if (this.chart) {
                    this.chart.dispose();
                }

                // 初始化时添加渲染模式配置
                const renderOpts = {
                    renderer: 'canvas', // 强制使用canvas渲染
                    useDirtyRect: true  // 启用脏矩形渲染
                };
                
                this.chart = echarts.init(chartDom, null, renderOpts);

                // 格式化数据
                const dates = this.coinHistory.map(d => {
                    return new Date(d.timestamp); // 直接返回Date对象，ECharts能自动处理
                });
                console.log(dates[0], dates[dates.length -1]);
                const prices = this.coinHistory.map(d => [
                    new Date(d.timestamp), // 日期
                    parseFloat(d.current_price) // 值
                ]);

                const volumes = this.coinHistory.map(d => [
                    new Date(d.timestamp), // 日期
                    parseFloat(d.total_volume) // 值
                ]);

                // ECharts 配置 - 在一个div中显示价格和交易量
                const option = {
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
                        snap: true,  // 添加这个配置，让提示线自动吸附到数据点
                        label: {
                            show: true,  // 确保显示坐标值
                            backgroundColor: '#666'
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        textStyle: {
                            color: '#fff'
                        },
                        formatter: function(params) {
                            let result = `<div>时间: ${params[0].axisValue}</div>`;
                            params.forEach(param => {
                                if (param.seriesName === '价格') {
                                    result += `<div>价格: $${param.data.toFixed(2)}</div>`;
                                } else if (param.seriesName === '交易量') {
                                    result += `<div>交易量: $${param.data.toLocaleString()}</div>`;
                                }
                            });
                            return result;
                        }
                    },

                    // 配置多个网格区域
                    grid: [
                        {
                            // 价格图区域 - 上半部分
                            top: '15%',
                            bottom: '25%',
                            left: '10%',
                            right: '10%',
                            containLabel: true
                        },
                        {
                            // 交易量图区域 - 下半部分
                            top: '80%',
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
                            data: dates,
                            axisLabel: {
                                color: '#666',
                                rotate: 20,
                                interval: 'auto',
                                formatter: '{MM}-{dd} {HH}:{mm}',

                            },
                            axisLine: {
                                lineStyle: {
                                    color: '#ccc'
                                }
                            }
                        },
                        {
                            // 交易量图的X轴
                            type: 'time',
                            gridIndex: 1,
                            data: dates,
                            axisLabel: {
                                show: false
                            },
                            axisTick: {
                                show: false
                            },
                            axisLine: {
                                show: false
                            }
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
                            scale: true,
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
                                show: false
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
                        {
                            name: '价格',
                            type: 'line',
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                            data: prices,
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
                        {
                            name: '交易量',
                            type: 'line',
                            symbol: 'circle',                            
                            xAxisIndex: 1,
                            yAxisIndex: 1,
                            data: volumes,
                            itemStyle: {
                                color: 'rgba(54, 162, 235, 0.7)'
                            },

                            emphasis: {
                                focus: 'series'
                            }
                        }
                    ],
                    dataZoom: [
                        {
                            type: 'inside',
                            xAxisIndex: [0, 1], // 同时控制两个X轴
                            start: 0,
                            end: 100,
                            zoomOnMouseWheel: true, // 启用鼠标滚轮缩放
                            moveOnMouseMove: true, // 鼠标移动时可以拖动
                            moveOnMouseWheel: false, // 禁用鼠标滚轮平移
                            throttle: 100 ,
                            filterMode: 'filter'
                        },
                        {
                            type: 'slider',
                            xAxisIndex: [0, 1], // 同时控制两个X轴
                            start: 0,
                            end: 100,
                            bottom: 10,
                            height: 20,
                            throttle: 100 ,
                            filterMode: 'filter'
                        }
                    ],
                    axisPointer: {
                        link: [
                            {
                                xAxisIndex: 'all'
                            }
                        ],
                        triggerTooltip: true
                    },                    
                    
                };

                // 设置配置项并渲染图表
                option.animation = false;
                option.progressive = 1000;
                option.progressiveThreshold = 3000;

                this.chart.setOption(option);

                // 使用节流函数包装resize事件
                const throttledResize = throttle(() => {
                    this.chart.resize();
                }, 200);
                
                window.addEventListener('resize', throttledResize);

                this.$once('hook:beforeDestroy', () => {
                    window.removeEventListener('resize', throttledResize);
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