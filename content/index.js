
const API_BASE_URL = 'http://localhost:8080/api/main-websites';
const LOGIN_URL = 'http://localhost:8080/api/login';
const REGISTER_URL = 'http://localhost:8080/api/register';
const FEEDBACK_URL = API_BASE_URL.replace('/main-websites', '/feedback');
let allMainWebsites = [];
let currentUser = null; // 存储当前登录用户信息
let allWebsites = []; // 存储所有主网站的入口数据
let userCareIds = []; // 存储用户关心的主网站ID列表
let isTogglingCare = false; // 防止重复点击关心功能
let isSubmittingBookmark = false; // 防止重复提交收藏夹
let isDeletingBookmark = false; // 防止重复删除收藏夹

// 分页加载相关变量
let currentPage = 0; // 当前页码（从0开始）
const PAGE_SIZE = 10; // 每页加载数量
let isLoadingMore = false; // 是否正在加载更多
let hasMoreData = true; // 是否还有更多数据
let displayedMainWebsites = []; // 当前已显示的主网站列表
let allLoadedMainWebsites = []; // 所有已加载的主网站数据（用于筛选）

// 检查登录状态
async function checkLoginStatus() {
    const userStr = localStorage.getItem('currentUser');
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const loginBtn = document.getElementById('loginBtn');
    const navMenuSection = document.getElementById('navMenuSection');
    const myConcernBtn = document.getElementById('myConcernBtn');
    
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {
            currentUser = null;
        }
    }
    
    if (currentUser) {
        // 已登录，显示导航菜单，隐藏登录按钮
        if (loginBtn) loginBtn.style.display = 'none';
        if (navMenuSection) navMenuSection.style.display = 'block';
        
        // 显示用户名按钮
        const userNameBtn = document.getElementById('userNameBtn');
        const userNameText = document.getElementById('userNameText');
        if (userNameBtn && userNameText) {
            userNameBtn.style.display = 'flex';
            userNameText.textContent = currentUser.username || '用户';
        }
        
        // 显示"我的关心"按钮（所有登录用户包括管理员都可以使用）
        if (myConcernBtn) {
            // 管理员和普通用户都可以使用"我的关心"功能
            myConcernBtn.style.display = 'block';
        }
        
        // 显示"云收藏夹"按钮（所有登录用户都可以查看）
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) {
            bookmarkBtn.style.display = 'block';
        }
        
        // 显示"访问历史"按钮（所有登录用户都可以查看）
        const userHistoryBtn = document.getElementById('userHistoryBtn');
        if (userHistoryBtn) {
            userHistoryBtn.style.display = 'block';
        }
        
        // 显示页面切换下拉菜单（仅管理员）
        const pageSelectorContainer = document.getElementById('pageSelectorContainer');
        const statisticsPageItem = document.getElementById('statisticsPageItem');
        if (pageSelectorContainer) {
            pageSelectorContainer.style.display = currentUser.role === 'ADMIN' ? 'block' : 'none';
        }
        if (statisticsPageItem) {
            statisticsPageItem.style.display = currentUser.role === 'ADMIN' ? 'flex' : 'none';
        }
        
        // 显示切换按钮（仅管理员可见）
        const pageToggleSection = document.getElementById('pageToggleSection');
        if (pageToggleSection) {
            pageToggleSection.style.display = currentUser.role === 'ADMIN' ? 'block' : 'none';
        }
        
        // 激活首页
        switchToPage('home');
        
        // 加载用户关心的主网站列表（不阻塞页面显示）
        loadUserCareIds().then(() => {
            // 如果表格已加载，重新渲染
            if (typeof getFilteredMainWebsites === 'function') {
                const filteredMainWebsites = getFilteredMainWebsites();
                if (filteredMainWebsites.length > 0) {
                    renderMainWebsitesTable(filteredMainWebsites);
                }
            }
        });
    } else {
        // 未登录，显示登录按钮，隐藏导航菜单
        if (loginBtn) loginBtn.style.display = 'block';
        if (navMenuSection) navMenuSection.style.display = 'none';
        if (myConcernBtn) myConcernBtn.style.display = 'none';
        
        // 隐藏页面切换按钮
        const pageToggleSection = document.getElementById('pageToggleSection');
        if (pageToggleSection) {
            pageToggleSection.style.display = 'none';
        }
        
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) bookmarkBtn.style.display = 'none';
        // 隐藏用户名按钮
        const userNameBtn = document.getElementById('userNameBtn');
        if (userNameBtn) userNameBtn.style.display = 'none';
        closeUserDropdown(); // 关闭下拉菜单
        userCareIds = []; // 清空关心列表
        // 确保在首页
        switchPage('home');
    }
}

// 切换用户下拉菜单
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        if (dropdown.style.display === 'none' || dropdown.style.display === '') {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }
}

// 关闭用户下拉菜单
function closeUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('currentUser');
    currentUser = null;
    userCareIds = []; // 清空关心列表
    const loginBtn = document.getElementById('loginBtn');
    const navMenuSection = document.getElementById('navMenuSection');
    const myConcernBtn = document.getElementById('myConcernBtn');
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (loginBtn) loginBtn.style.display = 'block';
    if (navMenuSection) navMenuSection.style.display = 'none';
    if (myConcernBtn) myConcernBtn.style.display = 'none';
    
    // 隐藏页面切换按钮
    const pageToggleSection = document.getElementById('pageToggleSection');
    if (pageToggleSection) {
        pageToggleSection.style.display = 'none';
    }
    
    if (bookmarkBtn) bookmarkBtn.style.display = 'none';
    closeUserDropdown(); // 关闭下拉菜单
    switchPage('home');
    // 重新渲染表格（清除关心状态）
    const filteredMainWebsites = getFilteredMainWebsites();
    renderMainWebsitesTable(filteredMainWebsites);
}

// 加载我的关心页面
async function loadMyConcern() {
    const contentDiv = document.getElementById('myConcernContent');
    if (!contentDiv) return;
    
    if (!currentUser) {
        contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">请先登录</div>';
        return;
    }
    
    contentDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading">正在加载我关心的主网站...</div></div>';
    
    try {
        // 获取用户关心的主网站ID列表
        const response = await fetch(`http://localhost:8080/api/user/concern?username=${currentUser.username}`);
        if (!response.ok) {
            throw new Error('获取关心列表失败');
        }
        
        const result = await response.json();
        const concernIds = result.careIds || [];
        
        if (concernIds.length === 0) {
            contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">您还没有关心的主网站</div>';
            return;
        }
        
        // 获取关心的主网站信息
        const mainWebsitesResponse = await fetch(API_BASE_URL);
        if (!mainWebsitesResponse.ok) {
            throw new Error('获取主网站列表失败');
        }
        
        const allMainWebsites = await mainWebsitesResponse.json();
        const concernMainWebsites = allMainWebsites.filter(mainWebsite => 
            concernIds.includes(mainWebsite.id)
        );
        
        if (concernMainWebsites.length === 0) {
            contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到您关心的主网站</div>';
            return;
        }
        
        // 显示关心的主网站列表
        displayMyConcernMainWebsites(concernMainWebsites);
    } catch (error) {
        console.error('加载我的关心失败:', error);
        contentDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 显示我的关心（保留原函数用于兼容）
async function showMyConcern() {
    if (!currentUser) {
        alert('请先登录');
        return;
    }
    
    try {
        // 获取用户关心的主网站ID列表
        const response = await fetch(`http://localhost:8080/api/user/concern?username=${currentUser.username}`);
        if (!response.ok) {
            throw new Error('获取关心列表失败');
        }
        
        const result = await response.json();
        const concernIds = result.careIds || [];
        
        if (concernIds.length === 0) {
            alert('您还没有关心的主网站');
            return;
        }
        
        // 获取关心的主网站信息
        const mainWebsitesResponse = await fetch(API_BASE_URL);
        if (!mainWebsitesResponse.ok) {
            throw new Error('获取主网站列表失败');
        }
        
        const allMainWebsites = await mainWebsitesResponse.json();
        const concernMainWebsites = allMainWebsites.filter(mainWebsite => 
            concernIds.includes(mainWebsite.id)
        );
        
        if (concernMainWebsites.length === 0) {
            alert('未找到您关心的主网站');
            return;
        }
        
        // 显示关心的主网站列表
        displayConcernMainWebsites(concernMainWebsites);
    } catch (error) {
        console.error('显示我的关心失败:', error);
        alert('加载失败，请稍后重试');
    }
}

// 在页面中显示关心的主网站列表
function displayMyConcernMainWebsites(mainWebsites) {
    const contentDiv = document.getElementById('myConcernContent');
    if (!contentDiv) return;
    
    let html = '<table class="main-websites-table" style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">';
    html += '<thead><tr>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">ID</th>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">主网站名称</th>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">类型</th>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">状态</th>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">官方网站</th>';
    html += '<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; background: #2c5aa0; color: white; font-weight: bold;">更多入口</th>';
    html += '</tr></thead><tbody>';
    
    mainWebsites.forEach(mainWebsite => {
        html += '<tr>';
        html += `<td>${mainWebsite.id}</td>`;
        html += `<td>${mainWebsite.name || '-'}</td>`;
        html += `<td>${mainWebsite.type || '-'}</td>`;
        html += `<td><span class="status-badge status-${getStatusClass(mainWebsite.status)}">${mainWebsite.status || '-'}</span></td>`;
        html += `<td>${renderWebsite(mainWebsite.website, mainWebsite.id, 'concern', true)}</td>`;
        html += `<td><button class="btn-more-entries" onclick="showMainWebsiteEntries(${mainWebsite.id}, '${(mainWebsite.name || '').replace(/'/g, "\\'")}')">查看入口</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    contentDiv.innerHTML = html;
}

// 显示关心的主网站列表
function displayConcernMainWebsites(mainWebsites) {
    const modal = document.getElementById('concernModal');
    if (!modal) {
        // 创建弹窗
        const newModal = document.createElement('div');
        newModal.id = 'concernModal';
        newModal.className = 'modal';
        newModal.style.zIndex = '9999'; // 确保在 mainWebsiteEntriesModal 下面
        newModal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <h3>❤️ 我的关心</h3>
                <div id="concernMainWebsitesList" style="max-height: 500px; overflow-y: auto;">
                </div>
                <div class="modal-actions" style="margin-top: 20px;">
                    <button type="button" class="btn-cancel" onclick="closeConcernModal()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(newModal);
    }
    
    const list = document.getElementById('concernMainWebsitesList');
    if (!list) return;
    
    let html = '<table class="main-websites-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<thead><tr>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">ID</th>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">主网站名称</th>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">类型</th>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">状态</th>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">网址</th>';
    html += '<th style="padding: 12px; border-bottom: 1px solid #eee; text-align: left; background: linear-gradient(135deg, #2c5aa0 0%, #1e3f73 100%); color: white; font-weight: bold;">更多入口</th>';
    html += '</tr></thead><tbody>';
    
    mainWebsites.forEach(mainWebsite => {
        html += '<tr>';
        html += `<td>${mainWebsite.id}</td>`;
        html += `<td>${mainWebsite.name || '-'}</td>`;
        html += `<td>${mainWebsite.type || '-'}</td>`;
        html += `<td><span class="status-badge status-${getStatusClass(mainWebsite.status)}">${mainWebsite.status || '-'}</span></td>`;
        html += `<td>${renderWebsite(mainWebsite.website, mainWebsite.id, 'concern', true)}</td>`;
        html += `<td><button class="btn-more-entries" onclick="showMainWebsiteEntries(${mainWebsite.id}, '${(mainWebsite.name || '').replace(/'/g, "\\'")}')">查看入口</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
    
    document.getElementById('concernModal').style.display = 'flex';
}

// 关闭我的关心弹窗
function closeConcernModal() {
    const modal = document.getElementById('concernModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 点击弹窗外部关闭我的关心弹窗
window.addEventListener('DOMContentLoaded', function() {
    const concernModal = document.getElementById('concernModal');
    if (concernModal) {
        concernModal.addEventListener('click', function(e) {
            if (e.target === concernModal) {
                closeConcernModal();
            }
        });
    }
    
    // 点击外部关闭用户下拉菜单
    document.addEventListener('click', function(e) {
        const userNameBtn = document.getElementById('userNameBtn');
        const userDropdown = document.getElementById('userDropdown');
        if (userNameBtn && userDropdown) {
            if (!userNameBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                closeUserDropdown();
            }
        }
    });
});

// 加载用户关心的主网站ID列表
async function loadUserCareIds() {
    if (!currentUser) {
        userCareIds = [];
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8080/api/user/concern?username=${currentUser.username}`);
        if (response.ok) {
            const result = await response.json();
            // 确保所有ID都是数字类型
            userCareIds = (result.careIds || []).map(id => Number(id));
        } else {
            userCareIds = [];
        }
    } catch (error) {
        console.error('加载用户关心列表失败:', error);
        userCareIds = [];
    }
}

// 切换关心状态
async function toggleCare(mainWebsiteId) {
    // 防止重复点击
    if (isTogglingCare) {
        console.log('操作进行中，请勿重复点击');
        return;
    }
    
    // 检查是否登录
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }
    
    // 确保 mainWebsiteId 是数字类型
    mainWebsiteId = Number(mainWebsiteId);
    
    // 检查关心状态（确保类型一致）
    const isCared = userCareIds.some(id => Number(id) === mainWebsiteId);
    
    isTogglingCare = true; // 标记操作开始
    
    try {
        const response = await fetch('http://localhost:8080/api/user/care', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                mainWebsiteId: mainWebsiteId,
                care: !isCared // true表示关心，false表示取消关心
            })
        });
        
        // 处理HTTP错误状态
        if (!response.ok) {
            let errorMessage = '操作失败';
            try {
            const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // JSON解析失败，使用状态码判断
                if (response.status === 401) {
                    errorMessage = '登录已过期，请重新登录';
                    // 清除登录状态
                    logout();
                    return;
                } else if (response.status === 404) {
                    errorMessage = '用户不存在，请重新登录';
                    logout();
                    return;
                } else if (response.status === 400) {
                    errorMessage = '请求参数错误';
                } else if (response.status >= 500) {
                    errorMessage = '服务器错误，请稍后重试';
                }
            }
            throw new Error(errorMessage);
        }
        
        // 更新本地关心列表（确保类型一致）
        if (!isCared) {
            // 添加关心
            if (!userCareIds.some(id => Number(id) === mainWebsiteId)) {
                userCareIds.push(mainWebsiteId);
            }
        } else {
            // 取消关心
            userCareIds = userCareIds.filter(id => Number(id) !== mainWebsiteId);
        }
        
        // 更新当前行的关心图标状态（避免重新渲染整个表格）
        const tbody = document.getElementById('mainWebsitesTableBody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const firstCell = row.querySelector('td:first-child');
                if (firstCell && Number(firstCell.textContent) === mainWebsiteId) {
                    const careIcon = row.querySelector('td:last-child span');
                    if (careIcon) {
                        const newIsCared = userCareIds.some(id => Number(id) === mainWebsiteId);
                        careIcon.className = newIsCared ? 'care-icon cared' : 'care-icon';
                        careIcon.title = newIsCared ? '取消关心' : '关心';
                    }
                }
            });
        }
        
        // 检查搜索框是否显示，如果显示则同步更新搜索框状态
        const searchResult = document.getElementById('searchResult');
        const searchInput = document.getElementById('searchInput');
        
        if (searchResult && searchInput) {
            // 检查搜索框是否可见（通过计算样式或内联样式）
            const computedStyle = window.getComputedStyle(searchResult);
            const isSearchResultVisible = computedStyle.display !== 'none' && 
                                         searchResult.innerHTML.trim() !== '';
            if (isSearchResultVisible && searchInput.value.trim()) {
                // 搜索框显示且有搜索内容，更新搜索框状态（不重新加载列表）
                await searchMainWebsite();
            }
        }
    } catch (error) {
        console.error('切换关心状态失败:', error);
        alert(error.message || '操作失败，请稍后重试');
        // 发生错误时，重新加载数据以确保状态一致
        try {
            await loadUserCareIds();
            const filteredMainWebsites = getFilteredMainWebsites();
            if (filteredMainWebsites && Array.isArray(filteredMainWebsites)) {
                renderMainWebsitesTable(filteredMainWebsites);
            }
        } catch (reloadError) {
            console.error('重新加载数据失败:', reloadError);
        }
    } finally {
        isTogglingCare = false; // 标记操作完成
    }
}

// 在搜索结果中切换关心状态
async function toggleCareInSearch(mainWebsiteId) {
    // 防止重复点击
    if (isTogglingCare) {
        console.log('操作进行中，请勿重复点击');
        return;
    }
    
    // 检查是否登录
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }
    
    // 确保 mainWebsiteId 是数字类型
    mainWebsiteId = Number(mainWebsiteId);
    
    // 检查关心状态（确保类型一致）
    const isCared = userCareIds.some(id => Number(id) === mainWebsiteId);
    
    isTogglingCare = true; // 标记操作开始
    
    try {
        const response = await fetch('http://localhost:8080/api/user/care', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                mainWebsiteId: mainWebsiteId,
                care: !isCared // true表示关心，false表示取消关心
            })
        });
        
        // 处理HTTP错误状态
        if (!response.ok) {
            let errorMessage = '操作失败';
            try {
            const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // JSON解析失败，使用状态码判断
                if (response.status === 401) {
                    errorMessage = '登录已过期，请重新登录';
                    logout();
                    return;
                } else if (response.status === 404) {
                    errorMessage = '用户不存在，请重新登录';
                    logout();
                    return;
                } else if (response.status === 400) {
                    errorMessage = '请求参数错误';
                } else if (response.status >= 500) {
                    errorMessage = '服务器错误，请稍后重试';
                }
            }
            throw new Error(errorMessage);
        }
        
        // 更新本地关心列表（确保类型一致）
        if (!isCared) {
            // 添加关心
            if (!userCareIds.some(id => Number(id) === mainWebsiteId)) {
                userCareIds.push(mainWebsiteId);
            }
        } else {
            // 取消关心
            userCareIds = userCareIds.filter(id => Number(id) !== mainWebsiteId);
        }
        
        // 重新加载用户关心的列表（从服务器获取最新数据）
        await loadUserCareIds();
        
        // 刷新数据（调用左侧边栏的刷新功能）
        handleRefresh();
        
        // 刷新搜索结果
        searchMainWebsite();
    } catch (error) {
        console.error('切换关心状态失败:', error);
        alert(error.message || '操作失败，请稍后重试');
        // 发生错误时，重新加载数据以确保状态一致
        try {
            await loadUserCareIds();
            searchMainWebsite();
        } catch (reloadError) {
            console.error('重新加载数据失败:', reloadError);
        }
    } finally {
        isTogglingCare = false; // 标记操作完成
    }
}

// 获取当前筛选后的主网站列表（用于重新渲染）
function getFilteredMainWebsites() {
    const typeFilter = document.getElementById('typeFilter');
    const selectedType = typeFilter ? typeFilter.value : '';
    const searchInput = document.getElementById('searchInput');
    const searchKeyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filtered = allMainWebsites.slice();
    
    // 类型筛选
    if (selectedType) {
        filtered = filtered.filter(mainWebsite => mainWebsite.type === selectedType);
    }
    
    // 搜索筛选
    if (searchKeyword) {
        filtered = filtered.filter(mainWebsite => {
            const name = (mainWebsite.name || '').toLowerCase();
            const type = (mainWebsite.type || '').toLowerCase();
            const description = (mainWebsite.description || '').toLowerCase();
            const status = (mainWebsite.status || '').toLowerCase();
            const website = (mainWebsite.website || '').toLowerCase();
            
            // 搜索主网站的基本信息
            if (name.includes(searchKeyword) || type.includes(searchKeyword) || 
                description.includes(searchKeyword) || 
                status.includes(searchKeyword) || website.includes(searchKeyword)) {
                return true;
            }
            
            // 搜索入口网站名称和网址
            if (allWebsites.length > 0) {
                const mainWebsiteWebsites = allWebsites.filter(w => w.belongsTo === mainWebsite.id);
                return mainWebsiteWebsites.some(w => 
                    (w.websiteName || '').toLowerCase().includes(searchKeyword) ||
                    (w.wholeWebsite || '').toLowerCase().includes(searchKeyword)
                );
            }
            
            return false;
        });
    }
    
    return filtered;
}

// 页面加载时获取数据
// 更新加载更多提示
function updateLoadMoreIndicator() {
    const tbody = document.getElementById('mainWebsitesTableBody');
    if (!tbody) return;
    
    let loadMoreIndicator = document.getElementById('loadMoreIndicator');
    
    // 如果正在加载，显示"正在加载..."
    if (isLoadingMore) {
        if (!loadMoreIndicator) {
            loadMoreIndicator = document.createElement('tr');
            loadMoreIndicator.id = 'loadMoreIndicator';
            loadMoreIndicator.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; color: #999;" id="loadMoreText">正在加载...</td>';
            // 确保添加到 tbody 的最后
            tbody.appendChild(loadMoreIndicator);
        } else {
            // 如果已存在，确保它在最后位置
            tbody.appendChild(loadMoreIndicator);
        }
        if (loadMoreIndicator) {
            const loadMoreText = document.getElementById('loadMoreText');
            if (loadMoreText) {
                loadMoreText.textContent = '正在加载...';
            }
            loadMoreIndicator.style.display = 'table-row';
        }
        return;
    }
    
    // 如果不存在，创建加载更多提示元素
    if (!loadMoreIndicator) {
        loadMoreIndicator = document.createElement('tr');
        loadMoreIndicator.id = 'loadMoreIndicator';
        loadMoreIndicator.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; color: #999;" id="loadMoreText">加载更多...</td>';
        // 确保添加到 tbody 的最后
        tbody.appendChild(loadMoreIndicator);
    } else {
        // 如果已存在，确保它在最后位置（移动到末尾）
        tbody.appendChild(loadMoreIndicator);
    }
    
    if (loadMoreIndicator) {
        const loadMoreText = document.getElementById('loadMoreText');
        // 只有在真正没有更多数据时才显示"没有更多数据了"
        // 并且只在已显示的数据数量大于0时才显示
        if (hasMoreData) {
            if (loadMoreText) {
                loadMoreText.textContent = '加载更多...';
            }
            loadMoreIndicator.style.display = 'table-row';
        } else if (displayedMainWebsites.length > 0) {
            // 只有在已显示数据且确实没有更多数据时才显示"没有更多数据了"
            if (loadMoreText) {
                loadMoreText.textContent = '没有更多数据了';
            }
            loadMoreIndicator.style.display = 'table-row';
            // 3秒后隐藏提示
            setTimeout(() => {
                if (loadMoreIndicator && !hasMoreData) {
                    loadMoreIndicator.style.display = 'none';
                }
            }, 3000);
        } else {
            // 如果没有数据，直接隐藏
            loadMoreIndicator.style.display = 'none';
        }
    }
}

// 滚动监听，实现无限滚动
function setupInfiniteScroll() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        // 防抖处理
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // 检查是否滚动到底部
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // 当距离底部100px时触发加载
            if (documentHeight - scrollTop - windowHeight < 100) {
                // 检查是否在首页
                const homePage = document.getElementById('homePage');
                if (homePage && homePage.style.display !== 'none') {
                    // 无论是否有搜索内容，都可以触发无限滚动（列表和搜索结果是分开的）
                    loadMainWebsites(false);
                }
            }
        }, 100);
    });
}

window.onload = function() {
    // 初始化搜索引擎选择显示
    initSearchEngineDisplay();
    loadData();
    checkLoginStatus();
    // 设置无限滚动
    setupInfiniteScroll();
};

// 加载所有数据
async function loadData() {
    try {
        // 加载主网站列表（重置分页）
        await loadMainWebsites(true);
        // 加载统计数据
        await loadStatistics();
        // 加载所有主网站的入口数据
        await loadAllWebsites();
        // 加载网站热度推荐榜
        await loadTopWebsites();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载数据失败，请检查后端服务是否启动');
    }
}

// 加载主网站列表（首页用）
async function loadMainWebsites(reset = false) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('mainWebsitesTable');
    const tbody = document.getElementById('mainWebsitesTableBody');
    
    // 如果元素不存在（可能在管理员页面），直接返回
    if (!loading || !table || !tbody) {
        return;
    }

    // 如果是重置，清空当前状态
    if (reset) {
        currentPage = 0;
        displayedMainWebsites = [];
        allLoadedMainWebsites = [];
        hasMoreData = true;
        tbody.innerHTML = '';
        if (loading) loading.style.display = 'block';
        if (table) table.style.display = 'none';
    }

    // 如果正在加载或没有更多数据，直接返回
    if (isLoadingMore || !hasMoreData) {
        return;
    }

    isLoadingMore = true;

    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '加载失败');
        }
        const mainWebsites = await response.json();
        
        // 如果是重置，保存全部数据；否则使用已有的全部数据
        if (reset || currentPage === 0) {
        allMainWebsites = mainWebsites.slice();
        }

        // 确保mainWebsites是数组
        if (!Array.isArray(mainWebsites)) {
            throw new Error('返回的数据格式不正确');
        }

        // 初始化类型筛选器（只在第一次加载时）
        if (reset || currentPage === 0) {
            initTypeFilter(allMainWebsites);
        
        // 如果用户已登录，加载用户关心的主网站列表
        if (currentUser) {
            await loadUserCareIds();
        }
        }
        
        // 计算当前页要显示的数据
        const startIndex = currentPage * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageData = allMainWebsites.slice(startIndex, endIndex);
        
        // 追加到已显示列表和所有已加载列表
        displayedMainWebsites = displayedMainWebsites.concat(pageData);
        allLoadedMainWebsites = allLoadedMainWebsites.concat(pageData);
        
        // 应用类型筛选（如果已选择类型）
        const typeFilter = document.getElementById('typeFilter');
        const selectedType = typeFilter ? typeFilter.value : '';
        let dataToRender = pageData;
        if (selectedType) {
            // 只渲染符合类型筛选的数据
            dataToRender = pageData.filter(mainWebsite => mainWebsite.type === selectedType);
        }
        
        // 渲染表格（追加模式）
        if (dataToRender.length > 0 || !selectedType) {
            renderMainWebsitesTable(dataToRender, true);
        }
        
        // 更新页码
        currentPage++;
        
        // 检查是否还有更多数据（在更新页码后检查，基于下一页的数据）
        // 使用 currentPage * PAGE_SIZE 来判断是否还有更多数据
        // 如果当前页的结束位置小于总数据长度，说明还有更多数据
        const nextPageStartIndex = currentPage * PAGE_SIZE;
        hasMoreData = nextPageStartIndex < allMainWebsites.length;
        
        // 隐藏初始加载提示
        if (reset && loading) {
            loading.style.display = 'none';
        }
        if (table) {
            table.style.display = 'table';
        }
        
        // 先重置加载状态
        isLoadingMore = false;
        
        // 更新加载更多提示（延迟一点，确保DOM更新完成）
        setTimeout(() => {
            updateLoadMoreIndicator();
        }, 100);
    } catch (error) {
        if (loading) loading.innerHTML = '加载失败，请检查后端服务是否启动 (http://localhost:8080)';
        console.error('加载主网站列表失败:', error);
        isLoadingMore = false;
    } finally {
        // 确保在 finally 中重置加载状态（防止异常情况下状态未重置）
        if (isLoadingMore) {
            isLoadingMore = false;
            // 如果状态被重置，再次更新提示
            setTimeout(() => {
                updateLoadMoreIndicator();
            }, 50);
        }
    }
}

// 加载统计数据
async function loadStatistics() {
    try {
        const response = await fetch(API_BASE_URL + '/statistics');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '加载统计数据失败');
        }
        const stats = await response.json();

        // 更新统计卡片
        document.getElementById('totalCount').textContent = stats.totalCount || 0;
        // 总面积统计已删除，不再显示
        
        // 计算运行中主网站数
        const runningCount = stats.statusStatistics && stats.statusStatistics['运行'] ? stats.statusStatistics['运行'] : 0;
        document.getElementById('runningCount').textContent = runningCount;
        
        // 计算类型数
        const typeCount = stats.typeStatistics ? Object.keys(stats.typeStatistics).length : 0;
        document.getElementById('typeCount').textContent = typeCount;

        // 绘制类型分布图表
        drawTypeChart(stats.typeStatistics || {});
        
        // 获取入口网站总数并绘制柱状图
        try {
            const websitesResponse = await fetch('http://localhost:8080/api/websites');
            if (websitesResponse.ok) {
                const websites = await websitesResponse.json();
                const totalWebsites = Array.isArray(websites) ? websites.length : 0;
                const totalMainWebsites = stats.totalCount || 0;
                drawCountChart(totalMainWebsites, totalWebsites);
            } else {
                // 如果获取失败，使用0作为默认值
                drawCountChart(stats.totalCount || 0, 0);
            }
        } catch (error) {
            console.error('获取入口网站数失败:', error);
            // 如果获取失败，使用0作为默认值
            drawCountChart(stats.totalCount || 0, 0);
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 加载区域主网站信息
async function loadAreaMainWebsites() {
    // 加载区域统计信息并绘制图表
    try {
        const statsResponse = await fetch(API_BASE_URL + '/area-statistics');
        if (statsResponse.ok) {
            try {
                const statsData = await statsResponse.json();
                if (statsData && typeof statsData === 'object' && !statsData.error) {
                    drawAreaChart(statsData);
                }
            } catch (jsonError) {
                console.error('解析区域统计数据JSON失败:', jsonError);
            }
        }
    } catch (error) {
        console.error('加载区域统计时发生网络错误:', error);
    }
}

// 加载网站热度推荐榜
async function loadTopWebsites() {
    const listContainer = document.getElementById('topWebsitesList');
    if (!listContainer) return;
    
    try {
        const response = await fetch('http://localhost:8080/api/websites/top');
        if (!response.ok) {
            throw new Error('加载推荐榜失败');
        }
        
        const data = await response.json();
        const websites = data.websites || [];
        
        displayTopWebsites(websites);
    } catch (error) {
        console.error('加载网站热度推荐榜失败:', error);
        listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">加载失败，请稍后重试</div>';
    }
}

// 显示网站热度推荐榜
function displayTopWebsites(websites) {
    const listContainer = document.getElementById('topWebsitesList');
    if (!listContainer) return;
    
    if (websites.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无访问数据</div>';
        return;
    }
    
    let html = '';
    websites.forEach((website, index) => {
        const rank = index + 1;
        const url = website.url || '';
        const urlType = website.urlType || '';
        const count = website.count || 0;
        const mainWebsiteName = website.mainWebsiteName || '';
        const entryName = website.entryName || '';
        
        // 构建显示名称
        let displayName = '';
        if (urlType === 'official' && mainWebsiteName) {
            // 官方网站：显示主网站名称
            displayName = mainWebsiteName;
        } else if (urlType === 'entry' && mainWebsiteName && entryName) {
            // 入口网站：显示主网站名称 + 入口名称
            displayName = `${mainWebsiteName} - ${entryName}`;
        } else if (urlType === 'entry' && mainWebsiteName) {
            // 入口网站：只有主网站名称
            displayName = mainWebsiteName;
        } else if (urlType === 'bookmark' && mainWebsiteName) {
            // 云收藏夹：显示网站名称
            displayName = mainWebsiteName;
        } else {
            // 如果没有名称，显示URL（截断）
            displayName = url.length > 40 ? url.substring(0, 40) + '...' : url;
        }
        
        html += `
            <div class="top-website-item">
                <div class="top-website-rank">${rank}</div>
                <div class="top-website-info">
                    <div class="top-website-name">${displayName}</div>
                    <div class="top-website-url">
                        <a href="${url}" target="_blank" rel="noopener noreferrer" onclick="logUserClick('${url.replace(/'/g, "\\'")}', '${urlType}', null)">
                            ${url.length > 50 ? url.substring(0, 50) + '...' : url}
                        </a>
                    </div>
                    <div class="top-website-count">访问次数: ${count}</div>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

// 绘制区域主网站分布图表
function drawAreaChart(areaStats) {
    const chartDom = document.getElementById('areaChart');
    if (!chartDom) {
        console.error('找不到区域图表容器');
        return;
    }
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawAreaChart(areaStats), 100);
        return;
    }
    
    const myChart = initChart(chartDom);
    if (!myChart) return;

    if (!areaStats || typeof areaStats !== 'object' || Object.keys(areaStats).length === 0) {
        console.warn('区域统计数据为空');
        return;
    }

    const areas = Object.keys(areaStats);
    const mainWebsiteCounts = areas.map(area => {
        const stat = areaStats[area];
        return stat && stat.mainWebsiteCount !== undefined ? stat.mainWebsiteCount : 0;
    });

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    result += param.seriesName + ': ' + param.value + ' 栋';
                });
                return result;
            }
        },
        legend: {
            data: ['主网站数量'],
            bottom: '5%',
            left: 'center'
        },
        dataZoom: [],
        grid: {
            left: '3%',
            right: '8%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: areas,
            axisLabel: {
                rotate: 45,
                interval: 0
            }
        },
        yAxis: {
                type: 'value',
                name: '主网站数量',
                position: 'left'
            },
        series: [
            {
                name: '主网站数量',
                type: 'bar',
                data: mainWebsiteCounts,
                itemStyle: {
                    color: '#2c5aa0'
                }
            }
        ]
    };

    myChart.setOption(option);
    setTimeout(() => {
        try {
            const currentChart = echarts.getInstanceByDom(chartDom);
            if (currentChart && currentChart === myChart) {
                if (typeof currentChart.isDisposed === 'function') {
                    if (!currentChart.isDisposed()) {
                        currentChart.resize();
                    }
                } else {
                    currentChart.resize();
                }
            }
        } catch (e) {
            // 忽略错误
        }
    }, 100);
}

// 初始化类型筛选器
function initTypeFilter(mainWebsites) {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;
    
    // 获取所有唯一的主网站类型
    const types = [...new Set(mainWebsites.map(m => m.type).filter(t => t))].sort();
    
    // 清空现有选项（保留"全部"选项）
    typeFilter.innerHTML = '<option value="">全部</option>';
    
    // 添加类型选项
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });
    
    // 添加筛选事件监听
    typeFilter.addEventListener('change', function() {
        filterMainWebsitesByType(this.value);
    });
}

// 按类型筛选主网站（在已加载的数据中筛选）
function filterMainWebsitesByType(selectedType) {
    // 不重置分页状态，只在已加载的数据中筛选
    let filteredMainWebsites;
    
    if (selectedType) {
        // 在已加载的数据中筛选
        filteredMainWebsites = allLoadedMainWebsites.filter(mainWebsite => mainWebsite.type === selectedType);
    } else {
        // 如果选择"全部"，显示所有已加载的数据
        filteredMainWebsites = allLoadedMainWebsites.slice();
    }
    
    // 更新 displayedMainWebsites（用于显示）
    displayedMainWebsites = filteredMainWebsites.slice();
    
    // 重新渲染表格（非追加模式，完整替换）
    renderMainWebsitesTable(filteredMainWebsites, false);
    
    // 更新加载更多提示
    updateLoadMoreIndicator();
}

// 渲染主网站表格
function renderMainWebsitesTable(mainWebsites, append = false) {
    const tbody = document.getElementById('mainWebsitesTableBody');
    const loading = document.getElementById('loading');
    const table = document.getElementById('mainWebsitesTable');
    
    if (!tbody) return;
    
    // 确保 main-websites-section 宽度正确
    const mainWebsitesSection = document.querySelector('.main-websites-section');
    if (mainWebsitesSection) {
        mainWebsitesSection.style.setProperty('width', '100%', 'important');
        mainWebsitesSection.style.setProperty('max-width', '100%', 'important');
        mainWebsitesSection.style.setProperty('min-width', '100%', 'important');
        mainWebsitesSection.style.setProperty('display', 'block', 'important');
        mainWebsitesSection.style.setProperty('box-sizing', 'border-box', 'important');
        mainWebsitesSection.style.setProperty('margin-left', '0', 'important');
        mainWebsitesSection.style.setProperty('margin-right', '0', 'important');
        mainWebsitesSection.style.setProperty('padding-left', '0', 'important');
        mainWebsitesSection.style.setProperty('padding-right', '0', 'important');
        mainWebsitesSection.style.setProperty('position', 'relative', 'important');
        mainWebsitesSection.style.setProperty('float', 'none', 'important');
        mainWebsitesSection.style.setProperty('table-layout', 'auto', 'important');
    }
    
    // 如果不是追加模式，清空表格（但先移除加载提示，稍后重新添加）
    if (!append) {
        // 先移除加载提示（如果存在）
        const loadMoreIndicator = document.getElementById('loadMoreIndicator');
        if (loadMoreIndicator && loadMoreIndicator.parentNode) {
            loadMoreIndicator.parentNode.removeChild(loadMoreIndicator);
        }
    tbody.innerHTML = '';
    }
    
    if (!Array.isArray(mainWebsites) || mainWebsites.length === 0) {
        // 只有在非追加模式且没有数据时才显示"暂无数据"
        if (!append) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; color: #999;">暂无数据</td>';
        tbody.appendChild(row);
        }
        // 即使没有数据，也要隐藏加载提示并显示表格
        if (loading) {
            loading.style.display = 'none';
            loading.style.visibility = 'hidden';
        }
        if (table) {
            table.style.display = 'table';
            table.style.visibility = 'visible';
        }
        return;
    }
    
    // 隐藏加载提示，显示表格
    if (loading && !append) {
        loading.style.display = 'none';
        loading.style.visibility = 'hidden';
    }
    if (table) {
        table.style.display = 'table';
        table.style.visibility = 'visible';
    }
    
    mainWebsites.forEach(mainWebsite => {
        // 确保类型一致（mainWebsite.id 可能是数字，userCareIds 中可能是字符串或数字）
        const mainWebsiteId = mainWebsite.id;
        const isCared = userCareIds.some(id => Number(id) === Number(mainWebsiteId));
        const careIconClass = isCared ? 'care-icon cared' : 'care-icon';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mainWebsite.id}</td>
            <td>${mainWebsite.name || '-'}</td>
            <td>${mainWebsite.type || '-'}</td>
            <td>${(mainWebsite.description || '-').substring(0, 50)}${(mainWebsite.description && mainWebsite.description.length > 50) ? '...' : ''}</td>
            <td>${renderWebsite(mainWebsite.website, mainWebsite.id, 'official', true)}</td>
            <td><span class="status-badge status-${getStatusClass(mainWebsite.status)}">${mainWebsite.status || '-'}</span></td>
            <td><button class="btn-more-entries" onclick="showMainWebsiteEntries(${mainWebsite.id}, '${(mainWebsite.name || '').replace(/'/g, "\\'")}')">查看入口</button></td>
            <td><span class="${careIconClass}" onclick="toggleCare(${mainWebsite.id})" title="${isCared ? '取消关心' : '关心'}">❤️</span></td>
        `;
        tbody.appendChild(row);
    });
    
    // 确保加载提示在最后（如果存在）
    const loadMoreIndicator = document.getElementById('loadMoreIndicator');
    if (loadMoreIndicator && loadMoreIndicator.parentNode === tbody) {
        // 如果加载提示已经在 tbody 中，移动到末尾
        tbody.appendChild(loadMoreIndicator);
    }
}

// 窗口大小改变时，重新调整图表大小
window.addEventListener('resize', function() {
    const charts = [
        document.getElementById('typeChart'),
        document.getElementById('countChart')
    ];
    charts.forEach(chartDom => {
        if (chartDom) {
            try {
                const chart = echarts.getInstanceByDom(chartDom);
                if (chart) {
                    // 检查是否有 isDisposed 方法
                    if (typeof chart.isDisposed === 'function') {
                        if (!chart.isDisposed()) {
                            chart.resize();
                        }
                    } else {
                        // 如果没有 isDisposed 方法，直接尝试 resize
                        chart.resize();
                    }
                }
            } catch (e) {
                // 忽略错误（实例可能已被销毁）
            }
        }
    });
});

// 加载所有主网站的入口数据
async function loadAllWebsites() {
    try {
        const response = await fetch('http://localhost:8080/api/websites');
        if (response.ok) {
            const websites = await response.json();
            allWebsites = Array.isArray(websites) ? websites : [];
        } else {
            allWebsites = [];
        }
    } catch (error) {
        console.error('加载入口数据失败:', error);
        allWebsites = [];
    }
}

// 记录用户搜索
async function logUserSearch(keyword) {
    if (!currentUser || !currentUser.id) return;
    
    try {
        await fetch('http://localhost:8080/api/user/search-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                searchKeyword: keyword
            })
        });
    } catch (error) {
        console.error('记录用户搜索失败:', error);
    }
}

// 记录用户点击网址
async function logUserClick(url, urlType, mainWebsiteId = null) {
    if (!currentUser || !currentUser.id) return;
    
    try {
        const requestBody = {
            userId: currentUser.id,
            url: url,
            urlType: urlType
        };
        // 只有当 mainWebsiteId 不为 null 时才添加到请求体中
        if (mainWebsiteId != null) {
            requestBody.mainWebsiteId = mainWebsiteId;
        }
        
        await fetch('http://localhost:8080/api/user/click-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
    } catch (error) {
        console.error('记录用户点击失败:', error);
    }
}

// 搜索主网站（支持搜索更多字段和入口）
async function searchMainWebsite() {
    const input = document.getElementById('searchInput');
    const keyword = input.value.trim().toLowerCase();
    const resultBox = document.getElementById('searchResult');

    if (!keyword) {
        resultBox.style.display = 'none';
        resultBox.innerHTML = '';
        return;
    }

    // 记录用户搜索
    if (currentUser && currentUser.id) {
        await logUserSearch(input.value.trim());
    }

    if (!Array.isArray(allMainWebsites) || allMainWebsites.length === 0) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<div class="empty">暂无数据，请先加载主网站信息。</div>';
        return;
    }

    // 创建一个Map，存储每个主网站的入口
    const mainWebsiteWebsitesMap = new Map();
    if (Array.isArray(allWebsites)) {
        allWebsites.forEach(website => {
            const mainWebsiteId = website.belongsTo;
            if (mainWebsiteId) {
                if (!mainWebsiteWebsitesMap.has(mainWebsiteId)) {
                    mainWebsiteWebsitesMap.set(mainWebsiteId, []);
                }
                mainWebsiteWebsitesMap.get(mainWebsiteId).push(website);
            }
        });
    }

    // 搜索：搜索主网站名称、描述，以及入口网站名称
    const matches = allMainWebsites.filter(mainWebsite => {
        // 搜索主网站名称
        const nameMatch = (mainWebsite.name || '').toLowerCase().includes(keyword);
        // 搜索主网站描述
        const descriptionMatch = (mainWebsite.description || '').toLowerCase().includes(keyword);
        
        // 如果主网站名称或描述匹配，直接返回
        if (nameMatch || descriptionMatch) {
            return true;
        }
        
        // 搜索入口网站名称
        if (mainWebsiteWebsitesMap.has(mainWebsite.id)) {
            const entries = mainWebsiteWebsitesMap.get(mainWebsite.id);
            const entryNameMatch = entries.some(entry => {
                const entryName = (entry.websiteName || '').toLowerCase();
                return entryName.includes(keyword);
            });
            if (entryNameMatch) {
                return true;
            }
        }
        
        return false;
    });

    if (matches.length === 0) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<div class="empty">未找到与 "${keyword}" 匹配的主网站。</div>`;
        
        // 即使没有结果，也显示并行搜索按钮
        const parallelSearchWrapper = document.getElementById('parallelSearchWrapper');
        if (parallelSearchWrapper) {
            parallelSearchWrapper.style.display = 'block';
        }
        return;
    }

    const cardsHtml = matches.map(mainWebsite => {
        const mainWebsiteId = mainWebsite.id;
        // 官方网站显示"访问"而不是具体网址
        const websiteLink = mainWebsite.website ? `<a href="${mainWebsite.website}" target="_blank" rel="noopener" style="color:#1a73e8;" onclick="logUserClick('${(mainWebsite.website || '').replace(/'/g, "\\'")}', 'official', ${mainWebsiteId})">访问</a>` : '-';
        
        // 获取该主网站的入口
        let entriesHtml = '';
        if (mainWebsiteWebsitesMap.has(mainWebsiteId)) {
            const entries = mainWebsiteWebsitesMap.get(mainWebsiteId);
            if (entries.length > 0) {
                entriesHtml = '<p><strong>更多入口:</strong></p><ul style="margin-left: 20px; margin-top: 5px;">';
                entries.forEach(entry => {
                    const entryName = entry.websiteName || '未命名入口';
                    const entryUrl = entry.wholeWebsite || '';
                    if (entryUrl) {
                        const escapedUrl = entryUrl.replace(/'/g, "\\'");
                        // 更多入口只显示入口名字，不显示网址
                        entriesHtml += `<li><a href="${entryUrl}" target="_blank" rel="noopener" style="color:#1a73e8;" onclick="logUserClick('${escapedUrl}', 'entry', ${mainWebsiteId})">${entryName}</a></li>`;
                    }
                });
                entriesHtml += '</ul>';
            }
        }
        
        // 确保类型一致（mainWebsite.id 可能是数字，userCareIds 中可能是字符串或数字）
        // mainWebsiteId 已在上面声明，直接使用
        const isCared = userCareIds.some(id => Number(id) === Number(mainWebsiteId));
        const careIconClass = isCared ? 'care-icon cared' : 'care-icon';
        const careTitle = isCared ? '取消关心' : '关心';
        return `
            <div class="result-card">
                <p><strong>名称:</strong> ${mainWebsite.name || '-'}</p>
                <p><strong>类型:</strong> ${mainWebsite.type || '-'}</p>
                <p><strong>描述:</strong> ${mainWebsite.description || '-'}</p>
                <p><strong>状态:</strong> ${mainWebsite.status || '-'}</p>
                <p><strong>网站:</strong> ${websiteLink}</p>
                ${entriesHtml}
                <p style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                    <strong>关心:</strong> 
                    <span class="${careIconClass}" onclick="toggleCareInSearch(${mainWebsiteId})" title="${careTitle}" style="cursor: pointer; font-size: 20px;">❤️</span>
                </p>
            </div>
        `;
    }).join('');

    const html = `
        <h3>🔍 搜索结果（${matches.length}）</h3>
        <div class="result-list">
            ${cardsHtml}
        </div>
    `;

    resultBox.style.display = 'block';
    resultBox.innerHTML = html;
    
    // 显示并行搜索按钮
    const parallelSearchWrapper = document.getElementById('parallelSearchWrapper');
    if (parallelSearchWrapper) {
        parallelSearchWrapper.style.display = 'block';
    }
}

// 获取默认搜索引擎（从localStorage或使用Bing作为默认）
function getDefaultSearchEngine() {
    const saved = localStorage.getItem('defaultSearchEngine');
    return saved || 'bing'; // 默认使用Bing
}

// 保存默认搜索引擎
function saveDefaultSearchEngine(engine) {
    localStorage.setItem('defaultSearchEngine', engine);
}

// 初始化搜索引擎选择显示
function initSearchEngineDisplay() {
    const engine = getDefaultSearchEngine();
    updateSearchEngineCheck(engine);
}

// 更新搜索引擎选择标记
function updateSearchEngineCheck(engine) {
    ['bing', 'google', 'baidu'].forEach(e => {
        const check = document.getElementById(`check-${e}`);
        if (check) {
            check.style.display = e === engine ? 'inline' : 'none';
        }
    });
}

// 切换搜索引擎菜单显示/隐藏
function toggleSearchEngineMenu(event) {
    if (event) {
        event.stopPropagation(); // 阻止事件冒泡
    }
    const menu = document.getElementById('searchEngineMenu');
    if (!menu) return;
    
    if (menu.style.display === 'none' || !menu.style.display) {
        menu.style.display = 'block';
        // 点击外部区域关闭菜单
        setTimeout(() => {
            const closeHandler = function(e) {
                const wrapper = document.getElementById('parallelSearchWrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    closeSearchEngineMenu();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 0);
    } else {
        closeSearchEngineMenu();
    }
}

// 关闭搜索引擎菜单
function closeSearchEngineMenu() {
    const menu = document.getElementById('searchEngineMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}

// 选择搜索引擎
function selectSearchEngine(engine) {
    saveDefaultSearchEngine(engine);
    updateSearchEngineCheck(engine);
    closeSearchEngineMenu();
    
    // 执行搜索
    parallelSearch(engine);
}

// 并行搜索功能
function parallelSearch(engine = null) {
    const input = document.getElementById('searchInput');
    const keyword = input ? input.value.trim() : '';
    
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    
    // 如果没有指定引擎，使用默认引擎
    if (!engine) {
        engine = getDefaultSearchEngine();
    }
    
    // 编码搜索关键词
    const encodedKeyword = encodeURIComponent(keyword);
    
    // 根据选择的搜索引擎构建URL
    let searchUrl = '';
    switch(engine) {
        case 'google':
            searchUrl = `https://www.google.com/search?q=${encodedKeyword}`;
            break;
        case 'baidu':
            searchUrl = `https://www.baidu.com/s?wd=${encodedKeyword}`;
            break;
        case 'bing':
        default:
            searchUrl = `https://www.bing.com/search?q=${encodedKeyword}`;
            break;
    }
    
    // 在新标签页打开搜索
    window.open(searchUrl, '_blank');
}

// 清除搜索框内容
function clearSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const searchResult = document.getElementById('searchResult');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (searchClearBtn) {
        searchClearBtn.style.display = 'none';
    }
    if (searchResult) {
        searchResult.style.display = 'none';
        searchResult.innerHTML = '';
    }
    
    // 隐藏并行搜索按钮
    const parallelSearchWrapper = document.getElementById('parallelSearchWrapper');
    if (parallelSearchWrapper) {
        parallelSearchWrapper.style.display = 'none';
    }
    
    // 关闭搜索引擎菜单
    closeSearchEngineMenu();
}

// 清除管理员搜索框内容
function clearAdminSearchInput() {
    const adminSearchInput = document.getElementById('adminSearchInput');
    const adminSearchClearBtn = document.getElementById('adminSearchClearBtn');
    if (adminSearchInput) {
        adminSearchInput.value = '';
        adminSearchInput.focus();
    }
    if (adminSearchClearBtn) {
        adminSearchClearBtn.style.display = 'none';
    }
    // 重新加载所有主网站
        filterMainWebsites();
}

// 搜索框事件监听（延迟绑定，确保元素存在）
window.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    if (searchInput) {
        // 只保留Enter键搜索，移除实时搜索
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                searchMainWebsite();
            }
        });
        // 监听输入，显示/隐藏清除按钮
        searchInput.addEventListener('input', () => {
            if (searchClearBtn) {
                searchClearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
            }
        });
    }
    
    // 管理员搜索框事件监听
    const adminSearchInput = document.getElementById('adminSearchInput');
    const adminSearchClearBtn = document.getElementById('adminSearchClearBtn');
    if (adminSearchInput) {
        // 监听输入，显示/隐藏清除按钮
        adminSearchInput.addEventListener('input', () => {
            if (adminSearchClearBtn) {
                adminSearchClearBtn.style.display = adminSearchInput.value.trim() ? 'flex' : 'none';
            }
        });
    }
});

// 安全地初始化图表（先销毁已存在的实例）
function initChart(dom) {
    if (!dom) return null;
    // 如果已经初始化，先销毁
    const existingChart = echarts.getInstanceByDom(dom);
    if (existingChart) {
        try {
            // 检查实例是否已经被销毁
            if (typeof existingChart.isDisposed === 'function' && !existingChart.isDisposed()) {
                // 先清除选项，再销毁
                existingChart.clear();
                existingChart.dispose();
            } else if (typeof existingChart.isDisposed !== 'function') {
                // 如果没有 isDisposed 方法，直接尝试销毁
                existingChart.clear();
                existingChart.dispose();
            }
        } catch (e) {
            // 忽略销毁时的错误（可能实例已经被销毁）
        }
    }
    // 清空容器内容，确保干净的状态
    dom.innerHTML = '';
    // 初始化图表，禁用一些可能导致 passive 警告的交互
    return echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });
}

// 绘制类型分布饼图
function drawTypeChart(typeStats) {
    const chartDom = document.getElementById('typeChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawTypeChart(typeStats), 100);
        return;
    }
    
    const myChart = initChart(chartDom);
    if (!myChart) return;

    const data = Object.keys(typeStats).map(type => ({
        value: typeStats[type],
        name: type
    }));

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 'bottom',
            left: 'center'
        },
        // 禁用鼠标滚轮缩放，减少 passive 事件警告
        dataZoom: [],
        series: [{
            name: '主网站类型',
            type: 'pie',
            radius: '60%',
            data: data,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    myChart.setOption(option);
    // 延迟resize，让ECharts自带的动画先播放完成
    setTimeout(() => {
        try {
            // 检查实例是否仍然有效且未销毁
            const currentChart = echarts.getInstanceByDom(chartDom);
            if (currentChart && currentChart === myChart) {
                // 等待动画完成后再resize（ECharts默认动画时长约1000ms）
                setTimeout(() => {
                    try {
                // 检查是否有 isDisposed 方法，如果没有则直接调用 resize
                if (typeof currentChart.isDisposed === 'function') {
                    if (!currentChart.isDisposed()) {
                        currentChart.resize();
                    }
                } else {
                    // 如果没有 isDisposed 方法，直接尝试 resize，用 try-catch 捕获错误
                    currentChart.resize();
                }
                    } catch (e) {
                        // 忽略错误（实例可能已被销毁）
                    }
                }, 1200); // 等待动画完成后再resize
            }
        } catch (e) {
            // 忽略错误（实例可能已被销毁）
        }
    }, 100);
}

// 绘制总主网站数与总入口网站数柱状图
function drawCountChart(totalMainWebsites, totalWebsites) {
    const chartDom = document.getElementById('countChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawCountChart(totalMainWebsites, totalWebsites), 100);
        return;
    }
    
    const myChart = initChart(chartDom);
    if (!myChart) return;

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    result += param.seriesName + ': ' + param.value + ' 个';
                });
                return result;
            }
        },
        // 禁用鼠标滚轮缩放，减少 passive 事件警告
        dataZoom: [],
        xAxis: {
            type: 'category',
            data: ['总主网站数', '总入口网站数']
        },
        yAxis: {
            type: 'value',
            name: '数量'
        },
        series: [{
            name: '数量',
            type: 'bar',
            data: [totalMainWebsites, totalWebsites],
            itemStyle: {
                color: function(params) {
                    const colors = ['#2c5aa0', '#4caf50'];
                    return colors[params.dataIndex % colors.length];
                }
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}'
            }
        }]
    };

    myChart.setOption(option);
    // 延迟resize，让ECharts自带的动画先播放完成
    setTimeout(() => {
        try {
            const currentChart = echarts.getInstanceByDom(chartDom);
            if (currentChart) {
                // 等待动画完成后再resize（ECharts默认动画时长约1000ms）
                setTimeout(() => {
                    try {
                if (typeof currentChart.isDisposed === 'function') {
                    if (!currentChart.isDisposed()) {
                        currentChart.resize();
                    }
                } else {
                    currentChart.resize();
                }
                    } catch (e) {
                        // 忽略错误（实例可能已被销毁）
                    }
                }, 1200); // 等待动画完成后再resize
            }
        } catch (e) {
            // 忽略错误（实例可能已被销毁）
        }
    }, 100);
}

// 绘制状态分布柱状图
function drawStatusChart(statusStats) {
    const chartDom = document.getElementById('statusChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawStatusChart(statusStats), 100);
        return;
    }
    
    const myChart = initChart(chartDom);
    if (!myChart) return;

    const categories = Object.keys(statusStats);
    const values = Object.values(statusStats);

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        // 禁用鼠标滚轮缩放，减少 passive 事件警告
        dataZoom: [],
        xAxis: {
            type: 'category',
            data: categories
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            name: '主网站数量',
            type: 'bar',
            data: values,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#2c5aa0' },
                    { offset: 1, color: '#1e3f73' }
                ])
            }
        }]
    };

    myChart.setOption(option);
    // 确保图表正确渲染
    setTimeout(() => {
        try {
            // 检查实例是否仍然有效且未销毁
            const currentChart = echarts.getInstanceByDom(chartDom);
            if (currentChart && currentChart === myChart) {
                // 检查是否有 isDisposed 方法，如果没有则直接调用 resize
                if (typeof currentChart.isDisposed === 'function') {
                    if (!currentChart.isDisposed()) {
                        currentChart.resize();
                    }
                } else {
                    // 如果没有 isDisposed 方法，直接尝试 resize，用 try-catch 捕获错误
                    currentChart.resize();
                }
            }
        } catch (e) {
            // 忽略错误（实例可能已被销毁）
        }
    }, 100);
}

// 获取状态样式类
function getStatusClass(status) {
    if (!status) return 'running';
    const statusMap = {
        '运行': 'running',
        '停用': 'stopped',
        '新建': 'new',
        '规划中': 'planning',
        '改造中': 'renovating'
    };
    return statusMap[status] || 'running';
}

function renderWebsite(url, mainWebsiteId = null, urlType = 'official', showUrl = true) {
    if (!url) {
        return '-';
    }
    // 添加点击事件来记录用户点击
    const onClick = mainWebsiteId ? `onclick="logUserClick('${url.replace(/'/g, "\\'")}', '${urlType}', ${mainWebsiteId})"` : '';
    // showUrl为true时显示具体网址，false时显示"访问"
    const displayText = showUrl ? url : '访问';
    return `<a href="${url}" target="_blank" rel="noopener" style="color:#1a73e8;" ${onClick}>${displayText}</a>`;
}

// 反馈功能已移至独立的feedback.html页面

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginStatus').textContent = '';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerPasswordConfirm').value = '';
    document.getElementById('loginStatus').textContent = '';
    switchToLogin(); // 重置为登录模式
}

// 显示隐私政策弹窗
function showPrivacyPolicy() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 关闭隐私政策弹窗
function closePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 切换到注册模式
function switchToRegister() {
    document.getElementById('loginModalTitle').textContent = '注册';
    document.getElementById('registerPasswordConfirmGroup').style.display = 'block';
    document.getElementById('switchToRegisterBtn').style.display = 'none';
    document.getElementById('switchToLoginBtn').style.display = 'inline-block';
    document.getElementById('loginSubmitBtn').style.display = 'none';
    document.getElementById('registerSubmitBtn').style.display = 'inline-block';
    document.getElementById('loginStatus').textContent = '';
    // 清空密码确认框
    document.getElementById('registerPasswordConfirm').value = '';
}

// 切换到登录模式
function switchToLogin() {
    document.getElementById('loginModalTitle').textContent = '登录';
    document.getElementById('registerPasswordConfirmGroup').style.display = 'none';
    document.getElementById('switchToRegisterBtn').style.display = 'inline-block';
    document.getElementById('switchToLoginBtn').style.display = 'none';
    document.getElementById('loginSubmitBtn').style.display = 'inline-block';
    document.getElementById('registerSubmitBtn').style.display = 'none';
    document.getElementById('loginStatus').textContent = '';
    // 清空密码确认框
    document.getElementById('registerPasswordConfirm').value = '';
}

// 处理表单提交（根据当前模式决定是登录还是注册）
function handleFormSubmit(event) {
    event.preventDefault();
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    if (registerSubmitBtn && registerSubmitBtn.style.display !== 'none') {
        // 注册模式
        submitRegister();
    } else {
        // 登录模式
        submitLogin();
    }
}

// 注册用户
async function submitRegister() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value.trim();
    const statusBox = document.getElementById('loginStatus');

    if (!username || !password) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '请输入用户名和密码';
        return;
    }

    if (password !== passwordConfirm) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '两次输入的密码不一致';
        return;
    }

    if (password.length < 6) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '密码长度至少为6位';
        return;
    }

    try {
        const response = await fetch(REGISTER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        // 检查响应状态
        if (!response.ok) {
            // 尝试解析错误信息
            let errorMessage = '注册失败';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // 如果响应不是JSON格式，使用状态码判断
                if (response.status === 400) {
                    errorMessage = '注册失败，请检查输入信息';
                } else if (response.status === 500) {
                    errorMessage = '服务器错误，请稍后重试';
                }
            }
            statusBox.style.color = '#f44336';
            statusBox.textContent = errorMessage;
            return;
        }
        
        // 解析成功响应
        const result = await response.json();
            statusBox.style.color = '#4caf50';
            statusBox.textContent = '注册成功，请登录';
            // 自动切换到登录模式
            setTimeout(() => {
                switchToLogin();
                document.getElementById('loginPassword').value = '';
                document.getElementById('registerPasswordConfirm').value = '';
            }, 1000);
    } catch (error) {
        console.error('注册请求失败:', error);
        statusBox.style.color = '#f44336';
        statusBox.textContent = '注册失败，请检查网络连接';
    }
}

async function submitLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const statusBox = document.getElementById('loginStatus');

    if (!username || !password) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '请输入用户名和密码';
        return;
    }

    try {
        const response = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (response.ok) {
            statusBox.style.color = '#4caf50';
            statusBox.textContent = '登录成功';
            // 保存用户信息
            currentUser = result.user || { username, role: result.role || 'USER' };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('adminLoggedIn', result.role === 'ADMIN' ? 'true' : 'false');
            
            // 隐藏登录按钮，显示导航菜单
            const loginBtn = document.getElementById('loginBtn');
            const navMenuSection = document.getElementById('navMenuSection');
            const myConcernBtn = document.getElementById('myConcernBtn');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (navMenuSection) navMenuSection.style.display = 'block';
            
            // 显示用户名按钮
            const userNameBtn = document.getElementById('userNameBtn');
            const userNameText = document.getElementById('userNameText');
            if (userNameBtn && userNameText) {
                userNameBtn.style.display = 'flex';
                userNameText.textContent = currentUser.username || '用户';
            }
            
            // 根据用户角色显示不同的功能
            if (result.role === 'ADMIN') {
                // 管理员：显示管理员页面
                // 注意：管理员也可以使用"我的关心"功能，所以不隐藏按钮
                
                // 显示页面切换按钮（仅管理员可见）
                const pageToggleSection = document.getElementById('pageToggleSection');
                if (pageToggleSection) {
                    pageToggleSection.style.display = 'block';
                }
                
                // 显示页面切换下拉菜单（仅管理员）
                const pageSelectorContainer = document.getElementById('pageSelectorContainer');
                const statisticsPageItem = document.getElementById('statisticsPageItem');
                if (pageSelectorContainer) {
                    pageSelectorContainer.style.display = 'block';
                }
                if (statisticsPageItem) {
                    statisticsPageItem.style.display = 'flex';
                }
                
            switchPage('admin');
                updateToggleButton();
            if (typeof loadAdminMainWebsites === 'function') {
                loadAdminMainWebsites();
            }
            } else {
                // 普通用户：显示首页，显示"我的关心"按钮
                if (myConcernBtn) myConcernBtn.style.display = 'block';
                switchPage('home');
                updateToggleButton();
                // 加载用户关心的主网站列表并重新渲染表格
                await loadUserCareIds();
                const filteredMainWebsites = getFilteredMainWebsites();
                renderMainWebsitesTable(filteredMainWebsites);
            }
            
            // 关闭登录弹窗
            closeLoginModal();
        } else {
            statusBox.style.color = '#f44336';
            statusBox.textContent = result.error || '登录失败';
        }
    } catch (error) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '登录失败，请检查网络';
    }
}

document.getElementById('loginPassword').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        submitLogin();
    }
});

// 显示公告列表弹窗
async function showAnnouncementsModal() {
    const modal = document.getElementById('announcementsModal');
    const list = document.getElementById('announcementsList');
    modal.style.display = 'flex';
    list.innerHTML = '<div class="loading">正在加载公告...</div>';
    
    try {
        const response = await fetch('http://localhost:8080/api/announcements');
        if (!response.ok) {
            throw new Error('加载失败');
        }
        const announcements = await response.json();
        
        if (!Array.isArray(announcements) || announcements.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无公告</div>';
            return;
        }
        
        let html = '';
        announcements.forEach(ann => {
            const createTime = ann.createTime ? new Date(ann.createTime).toLocaleString('zh-CN') : '-';
            html += `
                <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #2c5aa0;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">${escapeHtml(ann.title || '无标题')}</h4>
                    <p style="margin: 10px 0; color: #666; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(ann.content || '')}</p>
                    <div style="font-size: 12px; color: #999; margin-top: 10px;">发布时间: ${createTime}</div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">加载失败，请稍后重试</div>';
        console.error('加载公告失败:', error);
    }
}

// 公告功能已移至独立的announcements.html页面

// 反馈管理相关函数（管理员用）
const FEEDBACK_API_URL = 'http://localhost:8080/api/feedbacks';

function showFeedbackModal() {
    const modal = document.getElementById('feedbackManagementModal');
    if (modal) {
        modal.style.display = 'flex';
        loadFeedbacks();
    }
}

function closeFeedbackManagementModal() {
    const modal = document.getElementById('feedbackManagementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 加载反馈列表
async function loadFeedbacks() {
    const loading = document.getElementById('feedbackLoading');
    const table = document.getElementById('feedbackTable');
    const tbody = document.getElementById('feedbackTableBody');
    const emptyMessage = document.getElementById('feedbackEmptyMessage');
    
    if (!loading || !table || !tbody || !emptyMessage) {
        return;
    }
    
    loading.style.display = 'block';
    table.style.display = 'none';
    emptyMessage.style.display = 'none';
    
    try {
        const response = await fetch(FEEDBACK_API_URL);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '加载失败');
        }
        
        const feedbacks = await response.json();
        
        if (!Array.isArray(feedbacks)) {
            throw new Error('返回的数据格式不正确');
        }
        
        tbody.innerHTML = '';
        
        if (feedbacks.length === 0) {
            loading.style.display = 'none';
            table.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }
        
        feedbacks.forEach(feedback => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${feedback.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;"><span style="font-weight: bold; color: #2c5aa0;">${feedback.category || '-'}</span></td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; max-width: 400px; word-wrap: break-word;">${escapeHtml(feedback.message || '-')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${feedback.contact || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #999; font-size: 0.9em;">${feedback.createTime || feedback.createTimeStr || '-'}</td>
            `;
            tbody.appendChild(row);
        });
        
        loading.style.display = 'none';
        emptyMessage.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        loading.innerHTML = '加载失败，请检查后端服务是否启动';
        loading.style.color = '#f44336';
        console.error('加载反馈列表失败:', error);
    }
}

// 显示主网站入口弹窗
async function showMainWebsiteEntries(mainWebsiteId, mainWebsiteName) {
    const modal = document.getElementById('mainWebsiteEntriesModal');
    const title = document.getElementById('mainWebsiteEntriesTitle');
    const list = document.getElementById('mainWebsiteEntriesList');
    
    if (!modal || !title || !list) {
        console.error('入口弹窗元素不存在');
        return;
    }
    
    // 设置标题
    title.textContent = `🔗 ${mainWebsiteName} - 网站入口`;
    
    // 显示弹窗
    modal.style.display = 'flex';
    list.innerHTML = '<div class="loading">正在加载入口信息...</div>';
    
    try {
        // 获取该主网站的所有网站入口
        const response = await fetch(`http://localhost:8080/api/websites?mainWebsiteId=${mainWebsiteId}`);
        if (!response.ok) {
            throw new Error('加载入口信息失败');
        }
        
        const websites = await response.json();
        
        if (!Array.isArray(websites) || websites.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无网站入口</div>';
            return;
        }
        
        // 渲染入口列表
        let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
        websites.forEach(website => {
            const websiteName = website.websiteName || '未命名入口';
            const websiteUrl = website.wholeWebsite || '';
            if (websiteUrl) {
                html += `
                    <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2c5aa0;">
                        <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 16px;">${escapeHtml(websiteName)}</div>
                        <a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener" 
                           style="color: #1a73e8; text-decoration: none; word-break: break-all; display: inline-block; font-size: 14px;"
                           onmouseover="this.style.textDecoration='underline'; this.style.color='#0d47a1';" 
                           onmouseout="this.style.textDecoration='none'; this.style.color='#1a73e8';"
                           onclick="logUserClick('${escapeHtml(websiteUrl).replace(/'/g, "\\'")}', 'entry', ${mainWebsiteId})">
                            🔗 ${escapeHtml(websiteUrl)}
                        </a>
                    </div>
                `;
            }
        });
        html += '</div>';
        list.innerHTML = html;
    } catch (error) {
        console.error('加载入口信息失败:', error);
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 关闭主网站入口弹窗
function closeMainWebsiteEntriesModal() {
    const modal = document.getElementById('mainWebsiteEntriesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// HTML转义函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 点击弹窗外部关闭
// 公告和操作记录功能已移至独立页面

// ========== 页面切换功能 ==========
let isAdminLoggedIn = false;

// 获取当前页面
function getCurrentPage() {
    const homePage = document.getElementById('homePage');
    const adminPage = document.getElementById('adminPage');
    if (homePage && homePage.style.display !== 'none' && homePage.classList.contains('active')) {
        return 'home';
    } else if (adminPage && adminPage.style.display !== 'none' && adminPage.classList.contains('active')) {
        return 'admin';
    }
    return 'home'; // 默认首页
}

// 切换页面
function togglePage() {
    const currentPage = getCurrentPage();
    if (currentPage === 'home') {
        switchPage('admin');
    } else {
        switchPage('home');
    }
}

// 更新切换按钮文本（已废弃，保留以兼容）
function updateToggleButton() {
    // 此函数已废弃，使用updatePageSelectorText代替
}

// 更新页面选择器文本
function updatePageSelectorText() {
    const selectorText = document.getElementById('pageSelectorText');
    if (!selectorText) return;
    
    const currentPath = window.location.pathname;
    if (currentPath.includes('admin.html')) {
        selectorText.textContent = '管理员后台';
    } else if (currentPath.includes('statistics.html')) {
        selectorText.textContent = '数据统计';
    } else {
        selectorText.textContent = '首页';
    }
}

// 切换页面选择器下拉菜单
function togglePageSelector() {
    const dropdown = document.getElementById('pageSelectorDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// 关闭页面选择器下拉菜单
function closePageSelector() {
    const dropdown = document.getElementById('pageSelectorDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// 切换页面（index 和 admin）
async function togglePage() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        alert('请先登录');
        return;
    }
    
    let currentUser;
    try {
        currentUser = JSON.parse(userStr);
    } catch (e) {
        alert('用户信息错误');
        return;
    }
    
    const homePage = document.getElementById('homePage');
    const adminPage = document.getElementById('adminPage');
    const isOnHomePage = homePage && (homePage.style.display !== 'none' || homePage.classList.contains('active'));
    
    if (isOnHomePage) {
        // 从首页切换到管理员页面，需要验证管理员权限
        if (currentUser.role !== 'ADMIN') {
            // 弹出密码输入框验证
            const password = prompt('请输入管理员密码：');
            if (!password) {
                return;
            }
            
            // 验证密码
            try {
                const response = await fetch('http://localhost:8080/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        username: currentUser.username || 'admin', 
                        password: password 
                    })
                });
                const result = await response.json();
                
                if (response.ok && result.role === 'ADMIN') {
                    // 更新用户信息
                    currentUser.role = 'ADMIN';
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    // 切换到管理员页面
                    switchToPage('admin');
                } else {
                    alert('密码错误，无法进入管理员页面');
                    return;
                }
            } catch (error) {
                alert('验证失败，请检查网络');
                console.error('验证失败:', error);
                return;
            }
        } else {
            // 已经是管理员，直接切换
            switchToPage('admin');
        }
    } else {
        // 从管理员页面切换回首页
        switchToPage('home');
    }
}

// 修复submitCreateAnnouncement中的变量引用
async function submitCreateAnnouncement() {
    const titleInput = document.getElementById('createAnnouncementTitle');
    const contentInput = document.getElementById('createAnnouncementContent');
    const statusBox = document.getElementById('createAnnouncementStatus');
    
    const title = titleInput?.value.trim();
    const content = contentInput?.value.trim();
    
    if (!title || !content) {
        if (statusBox) {
            statusBox.style.color = '#f44336';
            statusBox.textContent = '请填写标题和内容';
        }
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8080/api/admin/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const result = await response.json();
        
        if (response.ok) {
            if (statusBox) {
                statusBox.style.color = '#4caf50';
                statusBox.textContent = '公告发布成功';
            }
            // 清空表单
            if (titleInput) titleInput.value = '';
            if (contentInput) contentInput.value = '';
            setTimeout(() => {
                switchToPage('admin');
            }, 1500);
        } else {
            if (statusBox) {
                statusBox.style.color = '#f44336';
                statusBox.textContent = result.error || '发布失败';
            }
        }
    } catch (error) {
        if (statusBox) {
            statusBox.style.color = '#f44336';
            statusBox.textContent = '网络错误，请检查服务器连接';
        }
        console.error('发布公告失败:', error);
    }
}

// 更新切换按钮文本
function updateToggleButton() {
    const toggleBtn = document.getElementById('pageToggleBtn');
    const toggleText = document.getElementById('pageToggleText');
    if (!toggleBtn || !toggleText) return;
    
    const homePage = document.getElementById('homePage');
    const isOnHomePage = homePage && homePage.style.display !== 'none';
    
    if (isOnHomePage) {
        toggleText.innerHTML = '切换>管理员页';
    } else {
        toggleText.innerHTML = '切换>首页';
    }
}

// 更新侧边栏为管理员模式
function updateSidebarForAdmin() {
    const userSidebar = document.getElementById('userSidebarSection');
    const adminSidebar = document.getElementById('adminSidebarSection');
    
    if (userSidebar) userSidebar.style.display = 'none';
    if (adminSidebar) adminSidebar.style.display = 'block';
    
    // 确保"我的关心"按钮显示（所有登录用户包括管理员都可以使用）
    const myConcernBtn = document.getElementById('myConcernBtn');
    if (myConcernBtn && currentUser) {
        myConcernBtn.style.display = 'block';
    }
}

// 更新侧边栏为用户模式
function updateSidebarForUser() {
    const userSidebar = document.getElementById('userSidebarSection');
    const adminSidebar = document.getElementById('adminSidebarSection');
    
    if (userSidebar) userSidebar.style.display = 'block';
    if (adminSidebar) adminSidebar.style.display = 'none';
    
    // 确保"我的关心"按钮显示（所有登录用户包括管理员都可以使用）
    const myConcernBtn = document.getElementById('myConcernBtn');
    if (myConcernBtn && currentUser) {
        myConcernBtn.style.display = 'block';
    }
    
    // 确保"云收藏夹"按钮显示（所有登录用户）
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn && currentUser) {
        bookmarkBtn.style.display = 'block';
    }
    
    // 确保"访问历史"按钮显示（所有登录用户）
    const userHistoryBtn = document.getElementById('userHistoryBtn');
    if (userHistoryBtn && currentUser) {
        userHistoryBtn.style.display = 'block';
    }
}

// 切换到指定页面
function switchToPage(pageName) {
    // 隐藏所有页面
    const allPages = document.querySelectorAll('.page-section');
    allPages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    // 移除所有选择器的active状态
    const allSelectors = document.querySelectorAll('.sidebar-selector');
    allSelectors.forEach(selector => {
        selector.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        // 访问历史页面使用 flex 布局
        if (pageName === 'userHistory') {
            targetPage.style.display = 'flex';
            targetPage.style.flexDirection = 'column';
        } else {
        targetPage.style.display = 'block';
        }
        targetPage.classList.add('active');
    }
    
    // 激活对应的选择器
    const targetSelector = document.querySelector(`.sidebar-selector[data-page="${pageName}"]`);
    if (targetSelector) {
        targetSelector.classList.add('active');
    }
    
    // 等待 DOM 更新后再加载数据（确保页面已显示）
    // 使用 requestAnimationFrame 确保 DOM 已渲染
    requestAnimationFrame(() => {
        setTimeout(() => {
            // 根据页面加载相应数据并更新侧边栏
            switch(pageName) {
                case 'home':
                    if (typeof loadData === 'function') {
                        loadData();
                    }
                    updateSidebarForUser();
                    updateRefreshButton('home');
                    break;
                case 'admin':
                    if (typeof loadAdminMainWebsites === 'function') {
                        loadAdminMainWebsites();
                    }
                    updateSidebarForAdmin();
                    updateRefreshButton('admin');
                    // 默认显示数据管理标签页
                    switchAdminTab('dataManagement');
                    // 默认显示数据管理页面
                    const adminSelector = document.querySelector('.sidebar-selector[data-page="admin"]');
                    if (adminSelector) {
                        adminSelector.classList.add('active');
                    }
                    break;
                case 'statistics':
                    loadStatisticsData();
                    break;
                case 'createAnnouncement':
                    // 清空表单
                    const titleInput = document.getElementById('createAnnouncementTitle');
                    const contentInput = document.getElementById('createAnnouncementContent');
                    const statusBox = document.getElementById('createAnnouncementStatus');
                    if (titleInput) titleInput.value = '';
                    if (contentInput) contentInput.value = '';
                    if (statusBox) statusBox.textContent = '';
                    break;
                case 'viewFeedback':
                    loadViewFeedbacks();
                    break;
                case 'announcements':
                    loadAnnouncements();
                    break;
                case 'userHistory':
                    loadUserHistory();
                    break;
                case 'myConcern':
                    loadMyConcern();
                    break;
                case 'bookmark':
                    loadBookmarks();
                    break;
                case 'operationLog':
                    loadOperationLogs();
                    break;
            }
            
            updateToggleButton();
        }, 150); // 延迟 150ms 确保 DOM 已渲染
    });
}

// 更新刷新按钮显示
function updateRefreshButton(currentPage) {
    const refreshSection = document.getElementById('refreshSection');
    if (!refreshSection) return;
    
    // 只在首页显示刷新按钮（刷新按钮用于刷新index首页数据）
    if (currentPage === 'home') {
        refreshSection.style.display = 'block';
    } else {
        refreshSection.style.display = 'none';
    }
}

// ========== 整合其他页面的功能 ==========

// HTML转义函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 切换管理员页面标签页
function switchAdminTab(tabName) {
    // 移除所有标签按钮的active状态
    const allTabs = document.querySelectorAll('.admin-tab-btn');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // 隐藏所有标签页内容
    const allContents = document.querySelectorAll('.admin-tab-content');
    allContents.forEach(content => content.style.display = 'none');
    
    // 激活选中的标签按钮
    const activeTab = document.getElementById(tabName + 'Tab');
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 显示选中的标签页内容
    const activeContent = document.getElementById(tabName + 'Content');
    if (activeContent) {
        activeContent.style.display = 'block';
    }
    
    // 如果切换到操作记录标签页，加载数据
    if (tabName === 'operationLog') {
        loadAdminOperationLogs();
    }
}

// 加载操作记录（用于独立页面）
async function loadOperationLogs() {
    const list = document.getElementById('operationLogList');
    if (!list) return;
    
    // 检查权限
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">请先登录</div>';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">只有管理员可以查看操作记录</div>';
            return;
        }
    } catch (e) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">用户信息错误</div>';
        return;
    }
    
    list.innerHTML = '<div class="loading">正在加载操作记录...</div>';
    
    try {
        const response = await fetch('http://localhost:8080/api/operation-logs');
        if (!response.ok) {
            throw new Error('加载失败');
        }
        const logs = await response.json();
        
        if (!Array.isArray(logs) || logs.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无操作记录</div>';
            return;
        }
        
        let html = '';
        logs.forEach(log => {
            const actionText = {
                'CREATE': '新建',
                'UPDATE': '更新',
                'DELETE': '删除'
            }[log.action] || log.action;
            
            const actionColor = {
                'CREATE': '#4caf50',
                'UPDATE': '#2196f3',
                'DELETE': '#f44336'
            }[log.action] || '#666';
            
            const operationTime = log.operationTime ? new Date(log.operationTime).toLocaleString('zh-CN') : '-';
            
            let detailsHtml = '';
            try {
                if (log.details) {
                    const details = JSON.parse(log.details);
                    if (log.action === 'UPDATE' && details.old && details.new) {
                        const changes = [];
                        Object.keys(details.new).forEach(key => {
                            const oldVal = details.old[key];
                            const newVal = details.new[key];
                            if (oldVal !== newVal) {
                                changes.push(`<div style="margin: 3px 0;"><strong>${key}:</strong> <span style="color: #f44336;">${escapeHtml(String(oldVal || '-'))}</span> → <span style="color: #4caf50;">${escapeHtml(String(newVal || '-'))}</span></div>`);
                            }
                        });
                        if (changes.length > 0) {
                            detailsHtml = `<div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><div style="font-size: 12px; color: #666; margin-bottom: 5px;">变更详情：</div><div style="font-size: 12px;">${changes.join('')}</div></div>`;
                        }
                    } else {
                        const detailItems = Object.keys(details).map(key => 
                            `<div style="margin: 2px 0;"><strong>${key}:</strong> ${escapeHtml(String(details[key] || '-'))}</div>`
                        ).join('');
                        detailsHtml = `<div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><div style="font-size: 12px; color: #666;">详细信息：</div><div style="font-size: 12px; margin-top: 5px;">${detailItems}</div></div>`;
                    }
                }
            } catch (e) {
                detailsHtml = `<div style="margin-top: 10px; font-size: 12px; color: #999;">${escapeHtml(log.details || '')}</div>`;
            }
            
            html += `
                <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid ${actionColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <span style="display: inline-block; padding: 4px 10px; background: ${actionColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: bold;">${actionText}</span>
                            <span style="margin-left: 10px; font-weight: bold; color: #333;">${escapeHtml(log.mainWebsiteName || '未知主网站')}</span>
                            ${log.mainWebsiteId ? `<span style="color: #999; font-size: 12px;">(ID: ${log.mainWebsiteId})</span>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #999;">${operationTime}</div>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        操作人: <strong>${escapeHtml(log.username || 'admin')}</strong>
                    </div>
                    ${detailsHtml}
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">加载失败，请稍后重试</div>';
        console.error('加载操作记录失败:', error);
    }
}

// 加载操作记录（用于admin页面中的标签页）
async function loadAdminOperationLogs() {
    const list = document.getElementById('adminOperationLogList');
    if (!list) return;
    
    // 检查权限
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">请先登录</div>';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">只有管理员可以查看操作记录</div>';
            return;
        }
    } catch (e) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">用户信息错误</div>';
        return;
    }
    
    list.innerHTML = '<div class="loading">正在加载操作记录...</div>';
    
    try {
        const response = await fetch('http://localhost:8080/api/operation-logs');
        if (!response.ok) {
            throw new Error('加载失败');
        }
        const logs = await response.json();
        
        if (!Array.isArray(logs) || logs.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无操作记录</div>';
            return;
        }
        
        let html = '';
        logs.forEach(log => {
            const actionText = {
                'CREATE': '新建',
                'UPDATE': '更新',
                'DELETE': '删除'
            }[log.action] || log.action;
            
            const actionColor = {
                'CREATE': '#4caf50',
                'UPDATE': '#2196f3',
                'DELETE': '#f44336'
            }[log.action] || '#666';
            
            const operationTime = log.operationTime ? new Date(log.operationTime).toLocaleString('zh-CN') : '-';
            
            let detailsHtml = '';
            try {
                if (log.details) {
                    const details = JSON.parse(log.details);
                    if (log.action === 'UPDATE' && details.old && details.new) {
                        const changes = [];
                        Object.keys(details.new).forEach(key => {
                            const oldVal = details.old[key];
                            const newVal = details.new[key];
                            if (oldVal !== newVal) {
                                changes.push(`<div style="margin: 3px 0;"><strong>${key}:</strong> <span style="color: #f44336;">${escapeHtml(String(oldVal || '-'))}</span> → <span style="color: #4caf50;">${escapeHtml(String(newVal || '-'))}</span></div>`);
                            }
                        });
                        if (changes.length > 0) {
                            detailsHtml = `<div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><div style="font-size: 12px; color: #666; margin-bottom: 5px;">变更详情：</div><div style="font-size: 12px;">${changes.join('')}</div></div>`;
                        }
                    } else {
                        const detailItems = Object.keys(details).map(key => 
                            `<div style="margin: 2px 0;"><strong>${key}:</strong> ${escapeHtml(String(details[key] || '-'))}</div>`
                        ).join('');
                        detailsHtml = `<div style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px;"><div style="font-size: 12px; color: #666;">详细信息：</div><div style="font-size: 12px; margin-top: 5px;">${detailItems}</div></div>`;
                    }
                }
            } catch (e) {
                detailsHtml = `<div style="margin-top: 10px; font-size: 12px; color: #999;">${escapeHtml(log.details || '')}</div>`;
            }
            
            html += `
                <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid ${actionColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div>
                            <span style="display: inline-block; padding: 4px 10px; background: ${actionColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: bold;">${actionText}</span>
                            <span style="margin-left: 10px; font-weight: bold; color: #333;">${escapeHtml(log.mainWebsiteName || '未知主网站')}</span>
                            ${log.mainWebsiteId ? `<span style="color: #999; font-size: 12px;">(ID: ${log.mainWebsiteId})</span>` : ''}
                        </div>
                        <div style="font-size: 12px; color: #999;">${operationTime}</div>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        操作人: <strong>${escapeHtml(log.username || 'admin')}</strong>
                    </div>
                    ${detailsHtml}
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">加载失败，请稍后重试</div>';
        console.error('加载操作记录失败:', error);
    }
}

// 加载公告列表
async function loadAnnouncements() {
    const list = document.getElementById('announcementsList');
    if (!list) return;
    
    list.innerHTML = '<div class="loading">正在加载公告...</div>';
    
    try {
        const response = await fetch('http://localhost:8080/api/announcements');
        if (!response.ok) {
            throw new Error('加载失败');
        }
        const announcements = await response.json();
        
        if (!Array.isArray(announcements) || announcements.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无公告</div>';
        return;
    }
    
        let html = '';
        announcements.forEach(ann => {
            const createTime = ann.createTime ? new Date(ann.createTime).toLocaleString('zh-CN') : '-';
            html += `
                <div style="background: #f5f5f5; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #2c5aa0;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">${escapeHtml(ann.title || '无标题')}</h4>
                    <p style="margin: 10px 0; color: #666; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(ann.content || '')}</p>
                    <div style="font-size: 12px; color: #999; margin-top: 10px;">发布时间: ${createTime}</div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">加载失败，请稍后重试</div>';
        console.error('加载公告失败:', error);
    }
}

// 提交反馈
async function submitFeedback() {
    const category = document.getElementById('feedbackCategory').value;
    const message = document.getElementById('feedbackMessage').value.trim();
    const contact = document.getElementById('feedbackContact').value.trim();
    const statusBox = document.getElementById('feedbackStatus');

    if (!message) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '请填写反馈内容';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: category,
                message: message,
                contact: contact || ''
            })
        });

        const result = await response.json();

        if (response.ok) {
            statusBox.style.color = '#4caf50';
            statusBox.textContent = '反馈提交成功！';
            // 清空表单
            document.getElementById('feedbackCategory').value = '数据错误';
            document.getElementById('feedbackMessage').value = '';
            document.getElementById('feedbackContact').value = '';
        } else {
            statusBox.style.color = '#f44336';
            statusBox.textContent = result.error || '提交失败，请稍后重试';
        }
    } catch (error) {
        console.error('提交反馈失败:', error);
        statusBox.style.color = '#f44336';
        statusBox.textContent = '网络错误，请检查服务器连接';
    }
}

// 加载查看反馈列表
async function loadViewFeedbacks() {
    const loading = document.getElementById('viewFeedbackLoading');
    const table = document.getElementById('viewFeedbackTable');
    const tbody = document.getElementById('viewFeedbackTableBody');
    const emptyMessage = document.getElementById('viewFeedbackEmptyMessage');
    
    if (!loading || !table || !tbody || !emptyMessage) {
        return;
    }
    
    loading.style.display = 'block';
    table.style.display = 'none';
    emptyMessage.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:8080/api/feedbacks');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '加载失败');
        }
        
        const feedbacks = await response.json();
        
        if (!Array.isArray(feedbacks)) {
            throw new Error('返回的数据格式不正确');
        }
        
        tbody.innerHTML = '';
        
        if (feedbacks.length === 0) {
            loading.style.display = 'none';
            table.style.display = 'none';
            emptyMessage.style.display = 'block';
            return;
        }
        
        feedbacks.forEach(feedback => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${feedback.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;"><span style="font-weight: bold; color: #2c5aa0;">${escapeHtml(feedback.category || '-')}</span></td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; max-width: 400px; word-wrap: break-word;">${escapeHtml(feedback.message || '-')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #666;">${escapeHtml(feedback.contact || '-')}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; color: #999; font-size: 0.9em;">${feedback.createTime || feedback.createTimeStr || '-'}</td>
            `;
            tbody.appendChild(row);
        });
        
        loading.style.display = 'none';
        emptyMessage.style.display = 'none';
        table.style.display = 'table';
    } catch (error) {
        loading.innerHTML = '加载失败，请检查后端服务是否启动';
        loading.style.color = '#f44336';
        console.error('加载反馈列表失败:', error);
    }
}

// 加载用户访问历史
async function loadUserHistory() {
    const content = document.getElementById('userHistoryContent');
    if (!content) return;
    
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">请先登录</div>';
        return;
    }
    
    let currentUser;
    try {
        currentUser = JSON.parse(userStr);
        if (!currentUser || !currentUser.id) {
            content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">用户信息错误</div>';
            return;
        }
    } catch (e) {
        content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">用户信息错误</div>';
        return;
    }
    
    content.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading">正在加载访问历史...</div></div>';
    
    try {
        // 获取搜索记录
        const searchResponse = await fetch(`http://localhost:8080/api/user/history/search?userId=${currentUser.id}`);
        const searchData = searchResponse.ok ? await searchResponse.json() : { searches: [] };
        
        // 获取点击记录
        const clickResponse = await fetch(`http://localhost:8080/api/user/history/click?userId=${currentUser.id}`);
        const clickData = clickResponse.ok ? await clickResponse.json() : { clicks: [] };
        
        let html = '<div style="display: flex; flex-direction: row; gap: 30px; align-items: stretch; height: 100%;">';
        
        // 搜索历史
        html += '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%;">';
        html += '<h4 style="margin-bottom: 15px; color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 8px; flex-shrink: 0;">🔍 搜索历史</h4>';
        if (searchData.searches && searchData.searches.length > 0) {
            html += '<div style="flex: 1; overflow-y: auto; min-height: 0;">';
            html += '<table style="width: 100%; border-collapse: collapse;">';
            html += '<thead><tr style="background: #f5f6fa;"><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">搜索关键词</th><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">搜索时间</th></tr></thead>';
            html += '<tbody>';
            searchData.searches.forEach(item => {
                html += `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.searchKeyword || '')}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${item.searchTime || ''}</td></tr>`;
            });
            html += '</tbody></table>';
            html += '</div>';
        } else {
            html += '<div style="text-align: center; padding: 20px; color: #999; flex: 1; display: flex; align-items: center; justify-content: center;">暂无搜索记录</div>';
        }
        html += '</div>';
        
        // 点击历史
        html += '<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%;">';
        html += '<h4 style="margin-bottom: 15px; color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 8px; flex-shrink: 0;">🔗 访问历史</h4>';
        if (clickData.clicks && clickData.clicks.length > 0) {
            html += '<div style="flex: 1; overflow-y: auto; min-height: 0;">';
            html += '<table style="width: 100%; border-collapse: collapse;">';
            html += '<thead><tr style="background: #f5f6fa;"><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">网址</th><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">类型</th><th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">访问时间</th></tr></thead>';
            html += '<tbody>';
            clickData.clicks.forEach(item => {
                const urlTypeText = item.urlType === 'official' ? '官方网站' : item.urlType === 'entry' ? '更多入口' : item.urlType === 'concern' ? '我的关心' : item.urlType || '';
                html += `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="${escapeHtml(item.url || '')}" target="_blank" style="color: #1a73e8;">${escapeHtml(item.url || '')}</a></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${urlTypeText}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${item.clickTime || ''}</td></tr>`;
            });
            html += '</tbody></table>';
            html += '</div>';
        } else {
            html += '<div style="text-align: center; padding: 20px; color: #999; flex: 1; display: flex; align-items: center; justify-content: center;">暂无访问记录</div>';
        }
        html += '</div>';
        
        html += '</div>';
        content.innerHTML = html;
    } catch (error) {
        console.error('加载访问历史失败:', error);
        content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 加载统计数据（需要ECharts）
async function loadStatisticsData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statisticsContent = document.getElementById('statisticsContent');
    
    if (!loadingIndicator || !statisticsContent) return;
    
    // 检查权限
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        loadingIndicator.innerHTML = '<div style="color: #f44336;">请先登录</div>';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'ADMIN') {
            loadingIndicator.innerHTML = '<div style="color: #f44336;">只有管理员可以访问数据统计页面</div>';
            return;
        }
    } catch (e) {
        loadingIndicator.innerHTML = '<div style="color: #f44336;">用户信息错误</div>';
        return;
    }
    
    loadingIndicator.style.display = 'block';
    statisticsContent.style.display = 'none';
    
    try {
        const response = await fetch('http://localhost:8080/api/admin/statistics');
        if (!response.ok) {
            throw new Error('加载失败');
        }
        const data = await response.json();
        
        loadingIndicator.style.display = 'none';
        statisticsContent.style.display = 'block';
        
        // 延迟绘制图表，确保 DOM 已渲染
        setTimeout(() => {
            // 绘制图表（需要从statistics.js中复制相关函数）
            if (typeof echarts !== 'undefined') {
                drawUserChart(data);
                drawSearchChart(data);
                drawOfficialUrlChart(data);
                drawEntryUrlChart(data);
                drawActivityTrendChart(data);
                drawBehaviorChart(data);
                drawMainWebsiteTypeChart(data);
            }
        }, 100);
    } catch (error) {
        console.error('加载统计数据失败:', error);
        loadingIndicator.innerHTML = '<div style="color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 从 statistics.js 复制的图表绘制函数

// 绘制用户统计图表
function drawUserChart(data) {
    const chartDom = document.getElementById('userChart');
    if (!chartDom) return;
    
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

// 绘制访问统计图表
function drawClickChart(data) {
    const chartDom = document.getElementById('clickChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawClickChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    
    const clickTypes = data.clickTypeStats || {};
    const types = Object.keys(clickTypes);
    const values = Object.values(clickTypes);
    
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
                name: '访问类型',
                type: 'pie',
                radius: '50%',
                data: types.map((type, index) => {
                    const typeNames = {
                        'official': '官方网站',
                        'entry': '更多入口',
                        'concern': '我的关心'
                    };
                    return {
                        value: values[index] || 0,
                        name: typeNames[type] || type
                    };
                }),
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
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

// 从 statistics.js 复制的图表绘制函数
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

function drawActivityTrendChart(data) {
    const chartDom = document.getElementById('activityTrendChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawActivityTrendChart(data), 100);
        return;
    }
    
    const myChart = echarts.init(chartDom);
    const activityData = data.activityTrend || [];
    const dates = activityData.map(item => item.date || '');
    const searchCounts = activityData.map(item => item.searchCount || 0);
    const clickCounts = activityData.map(item => item.clickCount || 0);
    
    const option = {
        tooltip: { trigger: 'axis' },
        legend: { 
            data: ['搜索次数', '访问次数'],
            bottom: '5%'
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: dates.length > 0 ? dates : [] },
        yAxis: { type: 'value', name: '次数' },
        series: [
            {
                name: '搜索次数',
                type: 'line',
                data: searchCounts,
                smooth: true,
                itemStyle: { color: '#2c5aa0' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(44, 90, 160, 0.3)' },
                        { offset: 1, color: 'rgba(44, 90, 160, 0.1)' }
                    ])
                }
            },
            {
                name: '访问次数',
                type: 'line',
                data: clickCounts,
                smooth: true,
                itemStyle: { color: '#ff9800' },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(255, 152, 0, 0.3)' },
                        { offset: 1, color: 'rgba(255, 152, 0, 0.1)' }
                    ])
                }
            }
        ]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

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
        tooltip: { trigger: 'item' },
        legend: { orient: 'horizontal', bottom: 'bottom' },
        series: [{
            name: '用户行为',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '{b}: {c}\n({d}%)' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: [
                { value: data.totalSearches || 0, name: '搜索行为' },
                { value: data.totalClicks || 0, name: '访问行为' }
            ]
        }]
    };
    
    myChart.setOption(option);
    window.addEventListener('resize', function() { myChart.resize(); });
}

function drawMainWebsiteTypeChart(data) {
    const chartDom = document.getElementById('mainWebsiteTypeChart');
    if (!chartDom) return;
    
    // 检查元素是否可见，如果不可见则延迟初始化
    if (chartDom.offsetWidth === 0 || chartDom.offsetHeight === 0) {
        setTimeout(() => drawMainWebsiteTypeChart(data), 100);
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
            axisLabel: { rotate: 0 }
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

function switchPage(page) {
    // 使用统一的 switchToPage 函数
    switchToPage(page);
}

function handleRefresh() {
    const currentPage = getCurrentPage();
    if (currentPage === 'home') {
        loadData();
    } else if (currentPage === 'admin') {
        if (typeof loadAdminMainWebsites === 'function') {
            loadAdminMainWebsites();
        }
    }
}

// ========== 管理员功能 ==========
const ADMIN_API_URL = 'http://localhost:8080/api/admin/main-websites';
let adminMainWebsites = [];
let filteredMainWebsites = [];
let currentModalMode = ''; // 'add', 'edit', 'delete'
let currentMainWebsiteId = null;

async function loadAdminMainWebsites() {
    try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('返回数据格式不正确');
        }
        adminMainWebsites = data;
        filteredMainWebsites = data.slice();
        renderTable();
        // 移除自动显示"数据已加载"提示，只在需要时显示
    } catch (error) {
        console.error('加载主网站数据失败:', error);
        setStatus('加载失败，请检查服务器', '#f44336');
    }
}

function renderTable() {
    const tbody = document.getElementById('adminMainWebsitesTableBody');
    const mainWebsiteCount = document.getElementById('mainWebsiteCount');
    
    if (!tbody) return;
    
    // 更新主网站数量显示
    if (mainWebsiteCount) {
        mainWebsiteCount.textContent = `(${filteredMainWebsites.length}个主网站)`;
    }
    
    tbody.innerHTML = '';
    filteredMainWebsites.forEach(mainWebsite => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mainWebsite.id}</td>
            <td>${mainWebsite.name || '-'}</td>
            <td>${mainWebsite.type || '-'}</td>
            <td>${(mainWebsite.description || '-').substring(0, 50)}${(mainWebsite.description && mainWebsite.description.length > 50) ? '...' : ''}</td>
            <td>${mainWebsite.status || '-'}</td>
            <td style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn-edit" onclick="openMainWebsiteModal('edit', ${mainWebsite.id})">编辑</button>
                <button class="btn-delete" onclick="openDeleteModal(${mainWebsite.id})">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterMainWebsites() {
    const keyword = document.getElementById('adminSearchInput')?.value.trim().toLowerCase() || '';
    if (!keyword) {
        filteredMainWebsites = adminMainWebsites.slice();
    } else {
        filteredMainWebsites = adminMainWebsites.filter(item =>
            (item.name || '').toLowerCase().includes(keyword)
        );
    }
    renderTable();
}

// 显示Toast提示（屏幕中间）
function showToast(message, type = 'success') {
    // 移除已存在的toast
    const existingToast = document.getElementById('adminToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 16px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: fadeIn 0.3s ease-in;
    `;
    
    // 根据类型设置颜色
    if (type === 'error') {
        toast.style.background = 'rgba(244, 67, 54, 0.9)';
    } else if (type === 'success') {
        toast.style.background = 'rgba(76, 175, 80, 0.9)';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 1秒后自动消失
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 1000);
}

// 设置状态（用于弹窗内的状态提示）
function setStatus(message, color) {
    const modalStatusBox = document.getElementById('adminStatusBox');
    
    if (modalStatusBox) {
        if (message) {
            modalStatusBox.textContent = message;
            modalStatusBox.style.color = color || '#333';
        } else {
            modalStatusBox.textContent = '';
        }
    }
}

function openMainWebsiteModal(mode, id = null) {
    currentModalMode = mode;
    currentMainWebsiteId = id;
    const modal = document.getElementById('mainWebsiteModal');
    if (!modal) return;
    const title = document.getElementById('mainWebsiteModalTitle');
    const submitBtn = document.getElementById('mainWebsiteModalSubmitBtn');
    const formId = document.getElementById('formId');
    
    if (mode === 'add') {
        title.textContent = '新建主网站';
        submitBtn.textContent = '新建主网站';
        submitBtn.className = 'btn-submit';
        submitBtn.style.background = '#4caf50';
        clearForm();
        formId.value = '';
        formId.placeholder = '新建主网站时自动生成';
        // 新建模式，默认添加一个空的网站入口
        clearWebsiteEntries();
        addWebsiteEntry();
    } else if (mode === 'edit') {
        const mainWebsite = adminMainWebsites.find(item => item.id === id);
        if (!mainWebsite) {
            setStatus('未找到该主网站', '#f44336');
            return;
        }
        title.textContent = '编辑主网站';
        submitBtn.textContent = '更新主网站';
        submitBtn.className = 'btn-submit';
        submitBtn.style.background = '#ff9800';
        formId.value = mainWebsite.id;
        document.getElementById('formName').value = mainWebsite.name || '';
        document.getElementById('formType').value = mainWebsite.type || '';
        document.getElementById('formStatus').value = mainWebsite.status || '运行';
        document.getElementById('formWebsite').value = mainWebsite.website || '';
        document.getElementById('formDescribe').value = mainWebsite.description || '';
        
        // 加载该主网站的网站入口
        clearWebsiteEntries();
        loadMainWebsiteWebsites(id);
        
        setStatus('', '');
    }
    
    // 使用setTimeout延迟显示弹窗，避免按钮点击事件干扰
    setTimeout(() => {
        modal.style.display = 'flex';
    }, 10);
}

async function loadMainWebsiteWebsites(mainWebsiteId) {
    try {
        const response = await fetch(`http://localhost:8080/api/websites?mainWebsiteId=${mainWebsiteId}`);
        if (response.ok) {
            const websites = await response.json();
            if (Array.isArray(websites) && websites.length > 0) {
                websites.forEach(website => {
                    addWebsiteEntry(
                        website.websiteName || '',
                        website.wholeWebsite || '',
                        website.id
                    );
                });
            } else {
                addWebsiteEntry();
            }
        } else {
            addWebsiteEntry();
        }
    } catch (error) {
        console.error('加载网站入口失败:', error);
        addWebsiteEntry();
    }
}

let deleteMainWebsiteId = null;

function openDeleteModal(id) {
    const mainWebsite = adminMainWebsites.find(item => item.id === id);
    if (!mainWebsite) {
        alert('未找到该主网站');
        return;
    }
    
    deleteMainWebsiteId = id;
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteConfirmMessage');
    if (modal && message) {
        message.textContent = `确定要删除主网站 "${mainWebsite.name}" (ID: ${id}) 吗？`;
        // 使用setTimeout延迟显示弹窗，避免按钮点击事件干扰
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 10);
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    deleteMainWebsiteId = null;
}

async function confirmDelete() {
    if (!deleteMainWebsiteId) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_URL}?id=${deleteMainWebsiteId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            closeDeleteModal();
            showToast('删除成功', 'success');
            loadAdminMainWebsites();
        } else {
            showToast(result.error || '删除失败', 'error');
        }
    } catch (error) {
        setStatus('删除失败，请检查网络', '#f44336');
    }
}

function closeMainWebsiteModal() {
    const modal = document.getElementById('mainWebsiteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    clearForm();
    currentModalMode = '';
    currentMainWebsiteId = null;
}

function submitMainWebsiteForm() {
    if (currentModalMode === 'add') {
        submitAdd();
    } else if (currentModalMode === 'edit') {
        submitUpdate();
    }
}

function gatherFormData() {
    return {
        name: document.getElementById('formName')?.value.trim() || '',
        type: document.getElementById('formType')?.value.trim() || '',
        address: '', // 地址字段已移除，保留空字符串以兼容后端
        status: document.getElementById('formStatus')?.value || '运行',
        website: document.getElementById('formWebsite')?.value.trim() || '',
        description: document.getElementById('formDescribe')?.value.trim() || ''
    };
}

function clearForm() {
    const formId = document.getElementById('formId');
    if (formId) formId.value = '';
    const formName = document.getElementById('formName');
    if (formName) formName.value = '';
    const formType = document.getElementById('formType');
    if (formType) formType.value = '';
    const formStatus = document.getElementById('formStatus');
    if (formStatus) formStatus.value = '运行';
    const formWebsite = document.getElementById('formWebsite');
    if (formWebsite) formWebsite.value = '';
    const formDescribe = document.getElementById('formDescribe');
    if (formDescribe) formDescribe.value = '';
    clearWebsiteEntries();
    addWebsiteEntry();
}

let websiteEntryCounter = 0;
let existingWebsiteIds = {};

function addWebsiteEntry(websiteName = '', wholeWebsite = '', websiteId = null) {
    const container = document.getElementById('websiteEntriesContainer');
    if (!container) return;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'website-entry';
    entryDiv.dataset.entryId = websiteEntryCounter++;
    
    if (websiteId !== null) {
        entryDiv.dataset.websiteId = websiteId;
        existingWebsiteIds[websiteId] = true;
    }
    
    entryDiv.innerHTML = `
        <input type="text" placeholder="入口名称（如：官网首页）" 
               class="website-name-input" value="${websiteName}" />
        <input type="text" placeholder="入口网址（如：https://example.com）" 
               class="website-url-input" value="${wholeWebsite}" />
        <button type="button" class="btn-delete" onclick="removeWebsiteEntry(this)">删除</button>
    `;
    container.appendChild(entryDiv);
}

function removeWebsiteEntry(button) {
    const entryDiv = button.closest('.website-entry');
    const websiteId = entryDiv.dataset.websiteId;
    if (websiteId) {
        delete existingWebsiteIds[websiteId];
    }
    entryDiv.remove();
}

function clearWebsiteEntries() {
    const container = document.getElementById('websiteEntriesContainer');
    if (container) {
        container.innerHTML = '';
    }
    existingWebsiteIds = {};
    websiteEntryCounter = 0;
}

function gatherWebsiteEntries() {
    const entries = [];
    const entryDivs = document.querySelectorAll('.website-entry');
    entryDivs.forEach(div => {
        const nameInput = div.querySelector('.website-name-input');
        const urlInput = div.querySelector('.website-url-input');
        const websiteId = div.dataset.websiteId;
        const name = nameInput ? nameInput.value.trim() : '';
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (name || url) {
            entries.push({
                id: websiteId || null,
                websiteName: name,
                wholeWebsite: url
            });
        }
    });
    return entries;
}

function buildFormBody(data) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => params.append(key, data[key] || ''));
    return params.toString();
}

async function submitAdd() {
    const data = gatherFormData();
    if (!data.name) {
        setStatus('名称不能为空', '#f44336');
        return;
    }
    try {
        const response = await fetch(ADMIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: buildFormBody(data)
        });
        const result = await response.json();
        
        if (response.status === 409 && result.code === 'DUPLICATE') {
            setStatus(result.error, '#f44336');
            return;
        }
        
        if (response.ok && result.status === 'restore') {
            // 自动还原，不显示确认对话框
                try {
                const restoreResponse = await fetch('http://localhost:8080/api/admin/main-websites/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: result.id })
                    });
                    const restoreResult = await restoreResponse.json();
                if (restoreResponse.ok) {
                    closeMainWebsiteModal();
                    showToast('成功还原', 'success');
                    loadAdminMainWebsites();
                    setTimeout(() => {
                        openMainWebsiteModal('edit', restoreResult.id);
                    }, 1000);
                    } else {
                    showToast('还原失败: ' + (restoreResult.error || '未知错误'), 'error');
                    }
                } catch (error) {
                    console.error('还原失败:', error);
                showToast('还原失败，请检查网络', 'error');
            }
            return;
        }
        
        if (response.ok && result.status === 'ok') {
            let newMainWebsiteId = result.id;
            
            if (!newMainWebsiteId) {
                const mainWebsitesResponse = await fetch(API_BASE_URL);
                if (mainWebsitesResponse.ok) {
                    const mainWebsites = await mainWebsitesResponse.json();
                    if (Array.isArray(mainWebsites) && mainWebsites.length > 0) {
                        const matchingMainWebsites = mainWebsites.filter(m => m.name === data.name);
                        if (matchingMainWebsites.length > 0) {
                            matchingMainWebsites.sort((a, b) => b.id - a.id);
                            newMainWebsiteId = matchingMainWebsites[0].id;
                        }
                    }
                }
            }
            
            if (newMainWebsiteId) {
                const websiteEntries = gatherWebsiteEntries();
                for (const entry of websiteEntries) {
                    if (entry.websiteName && entry.wholeWebsite) {
                        try {
                            await fetch('http://localhost:8080/api/websites', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    websiteName: entry.websiteName,
                                    wholeWebsite: entry.wholeWebsite,
                                    belongsTo: newMainWebsiteId
                                })
                            });
                        } catch (err) {
                            console.error('创建网站入口失败:', err);
                        }
                    }
                }
            }
            
            showToast('新建完成', 'success');
            setTimeout(() => {
                closeMainWebsiteModal();
                loadAdminMainWebsites();
            }, 1000);
        } else {
            setStatus(result.error || '新增失败', '#f44336');
        }
    } catch (error) {
        console.error('新增失败:', error);
        setStatus('新增失败，请检查网络', '#f44336');
    }
}

async function submitUpdate() {
    const id = document.getElementById('formId')?.value;
    if (!id) {
        setStatus('请选择要更新的主网站', '#f44336');
        return;
    }
    const data = gatherFormData();
    try {
        const response = await fetch(`${ADMIN_API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: buildFormBody(data)
        });
        const result = await response.json();
        
        if (response.status === 409 && result.code === 'DUPLICATE') {
            setStatus(result.error, '#f44336');
            return;
        }
        
        if (response.ok && result.status === 'restore') {
            // 自动还原，不显示确认对话框
                try {
                const restoreResponse = await fetch('http://localhost:8080/api/admin/main-websites/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: result.id })
                    });
                    const restoreResult = await restoreResponse.json();
                if (restoreResponse.ok) {
                    closeMainWebsiteModal();
                    // 先显示提示
                    setStatus('已恢复，id=' + restoreResult.id + '，你可前往编辑', '#4caf50');
                    // 延迟刷新数据
                    setTimeout(() => {
                        loadAdminMainWebsites();
                        // 2秒后打开编辑弹窗并清空状态消息
                        setTimeout(() => {
                            setStatus('', '');
                            openMainWebsiteModal('edit', restoreResult.id);
                        }, 2000);
                    }, 100);
                    } else {
                    setStatus('还原失败: ' + (restoreResult.error || '未知错误'), '#f44336');
                    }
                } catch (error) {
                    console.error('还原失败:', error);
                setStatus('还原失败，请检查网络', '#f44336');
            }
            return;
        }
        
        if (response.ok && result.status === 'ok') {
            const websiteEntries = gatherWebsiteEntries();
            const mainWebsiteId = parseInt(id);
            
            const websitesResponse = await fetch(`http://localhost:8080/api/websites?mainWebsiteId=${mainWebsiteId}`);
            if (websitesResponse.ok) {
                const existingWebsites = await websitesResponse.json();
                const existingIds = new Set(existingWebsites.map(w => w.id));
                
                for (const existing of existingWebsites) {
                    if (!existingWebsiteIds[existing.id]) {
                        await fetch(`http://localhost:8080/api/websites?id=${existing.id}`, {
                            method: 'DELETE'
                        });
                    }
                }
                
                for (const entry of websiteEntries) {
                    if (entry.websiteName && entry.wholeWebsite) {
                        if (entry.id && existingIds.has(parseInt(entry.id))) {
                            await fetch(`http://localhost:8080/api/websites?id=${entry.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    websiteName: entry.websiteName,
                                    wholeWebsite: entry.wholeWebsite
                                })
                            });
                        } else {
                            await fetch('http://localhost:8080/api/websites', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    websiteName: entry.websiteName,
                                    wholeWebsite: entry.wholeWebsite,
                                    belongsTo: mainWebsiteId
                                })
                            });
                        }
                    }
                }
            }
            
            setStatus('更新成功', '#4caf50');
            setTimeout(() => {
                closeMainWebsiteModal();
                loadAdminMainWebsites();
            }, 1000);
        } else {
            setStatus(result.error || '更新失败', '#f44336');
        }
    } catch (error) {
        console.error('更新失败:', error);
        setStatus('更新失败，请检查网络', '#f44336');
    }
}

// 公告管理
function showAnnouncementModal() {
    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        document.getElementById('announcementStatus').textContent = '';
    }
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 用户访问历史功能已移至独立的user-history.html页面

// 显示数据统计页面
async function submitAnnouncement() {
    const title = document.getElementById('announcementTitle')?.value.trim();
    const content = document.getElementById('announcementContent')?.value.trim();
    const statusBox = document.getElementById('announcementStatus');
    
    if (!title || !content) {
        if (statusBox) {
            statusBox.style.color = '#f44336';
            statusBox.textContent = '请填写标题和内容';
        }
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8080/api/admin/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const result = await response.json();
        
        if (response.ok) {
            if (statusBox) {
                statusBox.style.color = '#4caf50';
                statusBox.textContent = '公告发布成功';
            }
            setTimeout(() => {
                closeAnnouncementModal();
            }, 1200);
        } else {
            if (statusBox) {
                statusBox.style.color = '#f44336';
                statusBox.textContent = result.error || '发布失败';
            }
        }
    } catch (error) {
        if (statusBox) {
            statusBox.style.color = '#f44336';
            statusBox.textContent = '发布失败，请检查网络';
        }
    }
}

// 初始化：绑定管理员搜索框事件
window.addEventListener('DOMContentLoaded', function() {
    const adminSearchInput = document.getElementById('adminSearchInput');
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', filterMainWebsites);
    }
    
    // 绑定弹窗点击外部关闭事件
    const mainWebsiteModal = document.getElementById('mainWebsiteModal');
    if (mainWebsiteModal) {
        mainWebsiteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeMainWebsiteModal();
            }
        });
        // 阻止modal-content的点击事件冒泡
        const modalContent = mainWebsiteModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
    
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDeleteModal();
            }
        });
        // 阻止modal-content的点击事件冒泡
        const deleteModalContent = deleteModal.querySelector('.modal-content');
        if (deleteModalContent) {
            deleteModalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
    
    const announcementModal = document.getElementById('announcementModal');
    if (announcementModal) {
        announcementModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAnnouncementModal();
            }
        });
        // 阻止modal-content的点击事件冒泡
        const announcementModalContent = announcementModal.querySelector('.modal-content');
        if (announcementModalContent) {
            announcementModalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});

// 点击主网站入口弹窗外部关闭
window.addEventListener('DOMContentLoaded', function() {
    const mainWebsiteEntriesModal = document.getElementById('mainWebsiteEntriesModal');
    if (mainWebsiteEntriesModal) {
        mainWebsiteEntriesModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeMainWebsiteEntriesModal();
            }
        });
    }
});

// 点击反馈管理弹窗外部关闭
const feedbackManagementModal = document.getElementById('feedbackManagementModal');
if (feedbackManagementModal) {
    feedbackManagementModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeFeedbackManagementModal();
        }
    });
}

// 点击隐私政策弹窗外部关闭
window.addEventListener('DOMContentLoaded', function() {
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal) {
        privacyModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closePrivacyModal();
            }
        });
    }
    
    // 点击云收藏夹弹窗外部关闭
    const bookmarkModal = document.getElementById('bookmarkModal');
    if (bookmarkModal) {
        bookmarkModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeBookmarkModal();
            }
        });
    }
});

// 初始化切换按钮文本
window.addEventListener('DOMContentLoaded', function() {
    updateToggleButton();
});

// ========== 云收藏夹功能 ==========

let currentBookmarkId = null; // 当前编辑的收藏网址ID

// 加载云收藏夹
async function loadBookmarks() {
    const content = document.getElementById('bookmarkContent');
    if (!content) return;
    
    if (!currentUser || !currentUser.id) {
        content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">请先登录</div>';
        return;
    }
    
    content.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading">正在加载收藏夹...</div></div>';
    
    try {
        const response = await fetch(`http://localhost:8080/api/user/bookmarks?userId=${currentUser.id}`);
        if (!response.ok) {
            throw new Error('加载失败');
        }
        
        const data = await response.json();
        const websites = data.websites || [];
        
        displayBookmarks(websites);
    } catch (error) {
        console.error('加载云收藏夹失败:', error);
        content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">加载失败，请稍后重试</div>';
    }
}

// 显示云收藏夹列表
function displayBookmarks(websites) {
    const content = document.getElementById('bookmarkContent');
    if (!content) return;
    
    if (websites.length === 0) {
        content.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无收藏网址，点击"添加网址"按钮开始收藏</div>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 15px;">';
    websites.forEach(website => {
        html += `
            <div class="bookmark-item" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 1.1em; font-weight: bold; color: #333; margin-bottom: 8px;">${escapeHtml(website.websiteName)}</div>
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
                        <a href="${escapeHtml(website.website)}" target="_blank" rel="noopener noreferrer" 
                           data-url="${escapeHtml(website.website)}"
                           onclick="handleBookmarkClick(event, this.getAttribute('data-url')); return false;" 
                           style="color: #2c5aa0; text-decoration: none; cursor: pointer;">
                            ${escapeHtml(website.website)}
                        </a>
                    </div>
                    <div style="font-size: 0.85em; color: #999;">更新时间: ${website.updateTime}</div>
                </div>
                <div style="display: flex; gap: 8px; margin-left: 20px;">
                    <button class="btn-edit" onclick="openBookmarkModal('edit', ${website.id}, '${website.websiteName.replace(/'/g, "\\'")}', '${website.website.replace(/'/g, "\\'")}')">编辑</button>
                    <button class="btn-delete" onclick="deleteBookmark(${website.id})">删除</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    content.innerHTML = html;
}

// 打开云收藏夹弹窗
function openBookmarkModal(mode, id = null, name = '', url = '') {
    const modal = document.getElementById('bookmarkModal');
    const title = document.getElementById('bookmarkModalTitle');
    const nameInput = document.getElementById('bookmarkName');
    const urlInput = document.getElementById('bookmarkUrl');
    const statusBox = document.getElementById('bookmarkStatus');
    
    if (!modal || !title || !nameInput || !urlInput) return;
    
    currentBookmarkId = id;
    
    if (mode === 'add') {
        title.textContent = '添加网址';
        nameInput.value = '';
        urlInput.value = '';
    } else if (mode === 'edit') {
        title.textContent = '编辑网址';
        nameInput.value = name;
        urlInput.value = url;
    }
    
    if (statusBox) statusBox.textContent = '';
    modal.style.display = 'flex';
}

// 关闭云收藏夹弹窗
function closeBookmarkModal() {
    const modal = document.getElementById('bookmarkModal');
    if (modal) {
        modal.style.display = 'none';
        currentBookmarkId = null;
    }
}

// 提交云收藏夹（添加或更新）
async function submitBookmark() {
    // 防止重复提交
    if (isSubmittingBookmark) {
        console.log('提交进行中，请勿重复点击');
        return;
    }
    
    const nameInput = document.getElementById('bookmarkName');
    const urlInput = document.getElementById('bookmarkUrl');
    const statusBox = document.getElementById('bookmarkStatus');
    
    if (!nameInput || !urlInput || !statusBox) return;
    
    // 检查是否登录
    if (!currentUser || !currentUser.id) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '请先登录';
        return;
    }
    
    const websiteName = nameInput.value.trim();
    const website = urlInput.value.trim();
    
    if (!websiteName || !website) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '请填写网址名称和网址';
        return;
    }
    
    // 验证URL格式
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '网址格式不正确，请以 http:// 或 https:// 开头';
        return;
    }
    
    isSubmittingBookmark = true; // 标记提交开始
    statusBox.style.color = '#666';
    statusBox.textContent = '处理中...';
    
    try {
        let response;
        if (currentBookmarkId) {
            // 更新
            response = await fetch(`http://localhost:8080/api/user/bookmarks?userId=${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentBookmarkId,
                    websiteName: websiteName,
                    website: website
                })
            });
        } else {
            // 创建
            response = await fetch(`http://localhost:8080/api/user/bookmarks?userId=${currentUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    websiteName: websiteName,
                    website: website
                })
            });
        }
        
        // 处理HTTP错误状态
        if (!response.ok) {
            let errorMessage = '操作失败';
            try {
        const result = await response.json();
                errorMessage = result.error || errorMessage;
            } catch (e) {
                // JSON解析失败，使用状态码判断
                if (response.status === 401) {
                    errorMessage = '登录已过期，请重新登录';
                    logout();
                    return;
                } else if (response.status === 404) {
                    errorMessage = '用户不存在，请重新登录';
                    logout();
                    return;
                } else if (response.status === 400) {
                    errorMessage = '请求参数错误';
                } else if (response.status >= 500) {
                    errorMessage = '服务器错误，请稍后重试';
                }
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
            statusBox.style.color = '#4caf50';
            statusBox.textContent = currentBookmarkId ? '更新成功' : '添加成功';
            setTimeout(() => {
                closeBookmarkModal();
                loadBookmarks();
            }, 1000);
    } catch (error) {
        console.error('提交云收藏夹失败:', error);
        statusBox.style.color = '#f44336';
        statusBox.textContent = error.message || '网络错误，请检查服务器连接';
    } finally {
        isSubmittingBookmark = false; // 标记提交完成
    }
}

// 删除云收藏夹
async function deleteBookmark(id) {
    // 防止重复删除
    if (isDeletingBookmark) {
        console.log('删除进行中，请勿重复点击');
        return;
    }
    
    if (!confirm('确定要删除这个网址吗？')) {
        return;
    }
    
    // 检查是否登录
    if (!currentUser || !currentUser.id) {
        alert('请先登录');
        return;
    }
    
    isDeletingBookmark = true; // 标记删除开始
    
    try {
        const response = await fetch(`http://localhost:8080/api/user/bookmarks?userId=${currentUser.id}&id=${id}`, {
            method: 'DELETE'
        });
        
        // 处理HTTP错误状态
        if (!response.ok) {
            let errorMessage = '删除失败';
            try {
        const result = await response.json();
                errorMessage = result.error || errorMessage;
            } catch (e) {
                // JSON解析失败，使用状态码判断
                if (response.status === 401) {
                    errorMessage = '登录已过期，请重新登录';
                    logout();
                    return;
                } else if (response.status === 404) {
                    errorMessage = '用户不存在或收藏不存在';
                } else if (response.status === 400) {
                    errorMessage = '请求参数错误';
                } else if (response.status >= 500) {
                    errorMessage = '服务器错误，请稍后重试';
                }
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        if (response.ok) {
            alert('删除成功');
            loadBookmarks();
        } else {
            throw new Error(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除云收藏夹失败:', error);
        alert(error.message || '网络错误，请检查服务器连接');
    } finally {
        isDeletingBookmark = false; // 标记删除完成
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 处理云收藏夹链接点击（确保数据收集）
async function handleBookmarkClick(event, url) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // 检查用户是否登录
    if (!currentUser || !currentUser.id) {
        console.warn('用户未登录，无法记录点击，直接打开链接');
        window.open(url, '_blank');
        return;
    }
    
    // 验证URL
    if (!url || url.trim() === '') {
        console.error('URL为空，无法记录点击');
        return;
    }
    
    try {
        // 先记录点击
        const requestBody = {
            userId: currentUser.id,
            url: url.trim(),
            urlType: 'bookmark'
        };
        // 不发送 mainWebsiteId 字段（为 null 时）
        
        const response = await fetch('http://localhost:8080/api/user/click-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('记录用户点击失败:', response.status, errorData.error || '未知错误');
        } else {
            console.log('成功记录云收藏夹点击:', url);
        }
    } catch (error) {
        console.error('记录用户点击失败:', error);
    }
    
    // 然后打开链接（无论记录是否成功都打开）
    window.open(url, '_blank');
    
    return false;
}
    