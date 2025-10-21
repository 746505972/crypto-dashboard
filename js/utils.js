// 工具函数
function formatPrice(price) {
    if (!price) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

function formatVolume(volume) {
    if (!volume) return '0';
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getChangeClass(change) {
    if (!change) return '';
    return change >= 0 ? 'positive' : 'negative';
}

// 图表渲染函数
function renderPriceChart(historicalData, containerId) {
    const dates = historicalData.map(d => new Date(d.date).getTime());
    const prices = historicalData.map(d => d.price);
    
    const options = {
        series: [{
            name: '价格',
            data: historicalData.map((d, index) => ({
                x: new Date(d.date).getTime(),
                y: d.price
            }))
        }],
        chart: {
            type: 'area',
            height: 400,
            zoom: {
                enabled: true
            },
            toolbar: {
                show: true
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            labels: {
                formatter: function(value) {
                    return '$' + formatPrice(value);
                }
            }
        },
        tooltip: {
            x: {
                format: 'dd MMM yyyy'
            },
            y: {
                formatter: function(value) {
                    return '$' + formatPrice(value);
                }
            }
        }
    };
    
    const chart = new ApexCharts(document.querySelector(containerId), options);
    chart.render();
    return chart;
}