// 检查登录状态和权限
function checkAdminAccess() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        alert('请先登录');
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            alert('只有管理员可以访问数据统计页面');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    } catch (e) {
        alert('用户信息错误');
        window.location.href = 'index.html';
        return false;
    }
}

// 加载统计数据
async function loadStatisticsData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statisticsContent = document.getElementById('statisticsContent');
    
    if (!loadingIndicator || !statisticsContent) return;
    
    loadingIndicator.style.display = 'block';
    statisticsContent.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:8080/api/admin/statistics');
        if (!response.ok) {
            throw new Error('加载统计数据失败');
        }
        
        const data = await response.json();
        
        // 隐藏加载指示器，显示内容
        loadingIndicator.style.display = 'none';
        statisticsContent.style.display = 'block';
        
        // 延迟绘制图表，确保容器已经完全渲染
        setTimeout(() => {
            drawUserChart(data);
            drawSearchChart(data);
            drawOfficialUrlChart(data);
            drawEntryUrlChart(data);
            drawActivityTrendChart(data);
            drawBehaviorChart(data);
            drawBuildingTypeChart(data);
        }, 100);
        
    } catch (error) {
        console.error('加载统计数据失败:', error);
        loadingIndicator.innerHTML = '<div style="color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 绘制用户统计图表
function drawUserChart(data) {
    const chartDom = document.getElementById('userChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawUserChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: '用户类型',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}: {c}\n({d}%)'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                data: [
                    { value: data.adminUsers || 0, name: '管理员' },
                    { value: data.normalUsers || 0, name: '普通用户' }
                ]
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 绘制搜索统计图表
function drawSearchChart(data) {
    const chartDom = document.getElementById('searchChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawSearchChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    
    const popularSearches = data.popularSearches || [];
    const keywords = popularSearches.map(item => item.keyword || '');
    const counts = popularSearches.map(item => item.count || 0);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: keywords.length > 0 ? keywords : ['暂无数据'],
            axisLabel: {
                rotate: 45,
                interval: 0
            }
        },
        yAxis: {
            type: 'value',
            name: '搜索次数'
        },
        series: [
            {
                name: '搜索次数',
                type: 'bar',
                data: counts.length > 0 ? counts : [0],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#2c5aa0' },
                        { offset: 1, color: '#1e3f73' }
                    ])
                },
                label: {
                    show: true,
                    position: 'top'
                }
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// 绘制官方网站访问排行图表
function drawOfficialUrlChart(data) {
    const chartDom = document.getElementById('officialUrlChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawOfficialUrlChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    const officialUrls = data.officialUrlRanking || [];
    
    // 构建显示名称：使用网站名，如果没有则使用URL
    const names = officialUrls.map(item => {
        const mainWebsiteName = item.mainWebsiteName || '';
        if (mainWebsiteName) {
            return mainWebsiteName.length > 20 ? mainWebsiteName.substring(0, 20) + '...' : mainWebsiteName;
        }
        const url = item.url || '';
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
    });
    
    const counts = officialUrls.map(item => item.count || 0);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
                const index = params[0].dataIndex;
                const item = officialUrls[index];
                if (item) {
                    const name = item.mainWebsiteName || item.url || '';
                    return name + '<br/>访问次数: ' + params[0].value;
                }
                return '';
            }
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: names.length > 0 ? names : ['暂无数据'],
            axisLabel: { rotate: 45, interval: 0, fontSize: 10 }
        },
        yAxis: { type: 'value', name: '访问次数' },
        series: [{
            name: '访问次数',
            type: 'bar',
            data: counts.length > 0 ? counts : [0],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#2196f3' },
                    { offset: 1, color: '#1976d2' }
                ])
            },
            label: { show: true, position: 'top' }
        }]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

// 绘制入口网站访问排行图表
function drawEntryUrlChart(data) {
    const chartDom = document.getElementById('entryUrlChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawEntryUrlChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    const entryUrls = data.entryUrlRanking || [];
    
    // 构建显示名称：主网站名 - 入口名，如果没有则使用URL
    const names = entryUrls.map(item => {
        const mainWebsiteName = item.mainWebsiteName || '';
        const entryName = item.entryName || '';
        if (mainWebsiteName && entryName) {
            const displayName = `${mainWebsiteName} - ${entryName}`;
            return displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName;
        } else if (mainWebsiteName) {
            return mainWebsiteName.length > 20 ? mainWebsiteName.substring(0, 20) + '...' : mainWebsiteName;
        } else if (entryName) {
            return entryName.length > 20 ? entryName.substring(0, 20) + '...' : entryName;
        }
        const url = item.url || '';
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
    });
    
    const counts = entryUrls.map(item => item.count || 0);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
                const index = params[0].dataIndex;
                const item = entryUrls[index];
                if (item) {
                    const mainWebsiteName = item.mainWebsiteName || '';
                    const entryName = item.entryName || '';
                    let name = '';
                    if (mainWebsiteName && entryName) {
                        name = `${mainWebsiteName} - ${entryName}`;
                    } else if (mainWebsiteName) {
                        name = mainWebsiteName;
                    } else if (entryName) {
                        name = entryName;
                    } else {
                        name = item.url || '';
                    }
                    return name + '<br/>访问次数: ' + params[0].value;
                }
                return '';
            }
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: names.length > 0 ? names : ['暂无数据'],
            axisLabel: { rotate: 45, interval: 0, fontSize: 10 }
        },
        yAxis: { type: 'value', name: '访问次数' },
        series: [{
            name: '访问次数',
            type: 'bar',
            data: counts.length > 0 ? counts : [0],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ff9800' },
                    { offset: 1, color: '#f57c00' }
                ])
            },
            label: { show: true, position: 'top' }
        }]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

// 绘制用户活跃度趋势图表
function drawActivityTrendChart(data) {
    const chartDom = document.getElementById('activityTrendChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawActivityTrendChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    const activityTrend = data.activityTrend || [];
    const dates = activityTrend.map(item => item.date || '');
    const searchCounts = activityTrend.map(item => item.searchCount || 0);
    const clickCounts = activityTrend.map(item => item.clickCount || 0);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        legend: {
            data: ['搜索次数', '访问次数'],
            bottom: '5%'
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates.length > 0 ? dates : ['暂无数据']
        },
        yAxis: { type: 'value', name: '次数' },
        series: [
            {
                name: '搜索次数',
                type: 'line',
                data: searchCounts.length > 0 ? searchCounts : [0],
                smooth: true,
                itemStyle: { color: '#2196f3' }
            },
            {
                name: '访问次数',
                type: 'line',
                data: clickCounts.length > 0 ? clickCounts : [0],
                smooth: true,
                itemStyle: { color: '#ff9800' }
            }
        ]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

// 绘制搜索与访问行为对比图表
function drawBehaviorChart(data) {
    const chartDom = document.getElementById('behaviorChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawBehaviorChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: ['搜索次数', '访问次数']
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: ['搜索', '访问']
        },
        yAxis: { type: 'value', name: '次数' },
        series: [
            {
                name: '搜索次数',
                type: 'bar',
                data: [data.totalSearches || 0, 0],
                itemStyle: { color: '#2196f3' },
                label: { show: true, position: 'top' }
            },
            {
                name: '访问次数',
                type: 'bar',
                data: [0, data.totalClicks || 0],
                itemStyle: { color: '#ff9800' },
                label: { show: true, position: 'top' }
            }
        ]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

// 绘制建筑类型图表
function drawBuildingTypeChart(data) {
    const chartDom = document.getElementById('buildingTypeChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawBuildingTypeChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    const typeData = data.mainWebsiteTypeRanking || [];
    const types = typeData.map(item => item.type || '');
    const counts = typeData.map(item => item.count || 0);
    
    const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: types.length > 0 ? types : ['暂无数据'],
            axisLabel: { rotate: 45, interval: 0 }
        },
        yAxis: { type: 'value', name: '访问次数' },
        series: [{
            name: '访问次数',
            type: 'bar',
            data: counts.length > 0 ? counts : [0],
            itemStyle: {
                color: function(params) {
                    const colors = ['#2c5aa0', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];
                    return colors[params.dataIndex % colors.length];
                }
            },
            label: { show: true, position: 'top' }
        }]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

// 页面加载时检查权限并加载数据
window.addEventListener('DOMContentLoaded', function() {
    if (checkAdminAccess()) {
        loadStatisticsData();
    }
});




