
const API_BASE_URL = 'http://localhost:8080/api/main-websites';
const ADMIN_API_URL = 'http://localhost:8080/api/admin/main-websites';
let adminBuildings = [];
let filteredBuildings = [];
let currentModalMode = ''; // 'add', 'edit', 'delete'
let currentBuildingId = null;

async function loadBuildings() {
    try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('返回数据格式不正确');
        }
        adminBuildings = data;
        filteredBuildings = data.slice();
        renderTable();
        setStatus('数据已加载', '#4caf50');
    } catch (error) {
        console.error('加载建筑数据失败:', error);
        setStatus('加载失败，请检查服务器', '#f44336');
    }
}

function renderTable() {
    const tbody = document.getElementById('adminBuildingsTableBody');
    const buildingCount = document.getElementById('buildingCount');
    
    // 更新建筑数量显示
    if (buildingCount) {
        buildingCount.textContent = `(${filteredBuildings.length}个建筑)`;
    }
    
    tbody.innerHTML = '';
    filteredBuildings.forEach(building => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${building.id}</td>
            <td>${building.name || '-'}</td>
            <td>${building.type || '-'}</td>
            <td>${building.address || '-'}</td>
            <td>${building.status || '-'}</td>
            <td style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="btn-edit" onclick="openBuildingModal('edit', ${building.id})">编辑</button>
                <button class="btn-delete" onclick="openDeleteModal(${building.id})">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterBuildings() {
    const keyword = document.getElementById('adminSearchInput').value.trim().toLowerCase();
    if (!keyword) {
        filteredBuildings = adminBuildings.slice();
    } else {
        filteredBuildings = adminBuildings.filter(item =>
            (item.name || '').toLowerCase().includes(keyword)
        );
    }
    renderTable();
}

document.getElementById('adminSearchInput').addEventListener('input', filterBuildings);

function openBuildingModal(mode, id = null) {
    currentModalMode = mode;
    currentBuildingId = id;
    const modal = document.getElementById('buildingModal');
    const title = document.getElementById('buildingModalTitle');
    const submitBtn = document.getElementById('buildingModalSubmitBtn');
    const formId = document.getElementById('formId');
    
    if (mode === 'add') {
        title.textContent = '新建建筑';
        submitBtn.textContent = '新建建筑';
        submitBtn.className = 'btn-submit';
        submitBtn.style.background = '#4caf50';
        clearForm();
        formId.value = '';
        formId.placeholder = '新建建筑时自动生成';
    } else if (mode === 'edit') {
        const building = adminBuildings.find(item => item.id === id);
        if (!building) {
            setStatus('未找到该建筑', '#f44336');
            return;
        }
        title.textContent = '编辑建筑';
        submitBtn.textContent = '更新建筑';
        submitBtn.className = 'btn-submit';
        submitBtn.style.background = '#ff9800';
        formId.value = building.id;
        document.getElementById('formName').value = building.name || '';
        document.getElementById('formType').value = building.type || '';
        document.getElementById('formAddress').value = building.address || '';
        document.getElementById('formStatus').value = building.status || '运行';
        document.getElementById('formWebsite').value = building.website || '';
        
        // 加载该建筑的网站入口
        clearWebsiteEntries();
        loadBuildingWebsites(id);
        
        setStatus('', '');
    } else {
        // 新建模式，默认添加一个空的网站入口
        clearWebsiteEntries();
        addWebsiteEntry();
    }
    
    modal.style.display = 'flex';
}

async function loadBuildingWebsites(buildingId) {
    try {
        const response = await fetch(`http://localhost:8080/api/websites?buildingId=${buildingId}`);
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
                // 如果没有网站入口，添加一个空的
                addWebsiteEntry();
            }
        } else {
            // 如果加载失败，至少添加一个空的
            addWebsiteEntry();
        }
    } catch (error) {
        console.error('加载网站入口失败:', error);
        // 如果加载失败，至少添加一个空的
        addWebsiteEntry();
    }
}

let deleteBuildingId = null;

function openDeleteModal(id) {
    const building = adminBuildings.find(item => item.id === id);
    if (!building) {
        showCustomAlert('未找到该主网站', 'error');
        return;
    }
    
    deleteBuildingId = id;
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteConfirmMessage');
    message.textContent = `确定要删除主网站 "${building.name}" (ID: ${id}) 吗？`;
    modal.style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteBuildingId = null;
}

async function confirmDelete() {
    if (!deleteBuildingId) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_URL}?id=${deleteBuildingId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            showCustomAlert('删除成功', 'success');
            closeDeleteModal();
            loadBuildings();
        } else {
            showCustomAlert(result.error || '删除失败', 'error');
        }
    } catch (error) {
        showCustomAlert('删除失败，请检查网络', 'error');
    }
}

function closeBuildingModal() {
    document.getElementById('buildingModal').style.display = 'none';
    clearForm();
    currentModalMode = '';
    currentBuildingId = null;
}

function submitBuildingForm() {
    if (currentModalMode === 'add') {
        submitAdd();
    } else if (currentModalMode === 'edit') {
        submitUpdate();
    }
}

function gatherFormData() {
    return {
        name: document.getElementById('formName').value.trim(),
        type: document.getElementById('formType').value.trim(),
        address: document.getElementById('formAddress').value.trim(),
        status: document.getElementById('formStatus').value,
        website: document.getElementById('formWebsite').value.trim()
    };
}

function clearForm() {
    document.getElementById('formId').value = '';
    document.getElementById('formName').value = '';
    document.getElementById('formType').value = '';
    document.getElementById('formAddress').value = '';
    document.getElementById('formStatus').value = '运行';
    document.getElementById('formWebsite').value = '';
    clearWebsiteEntries();
    // 默认添加一个空的网站入口
    addWebsiteEntry();
}

let websiteEntryCounter = 0;
let existingWebsiteIds = {}; // 存储编辑时已有的网站ID

function addWebsiteEntry(websiteName = '', wholeWebsite = '', websiteId = null) {
    const container = document.getElementById('websiteEntriesContainer');
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
    container.innerHTML = '';
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
        // 先创建建筑
        const response = await fetch(ADMIN_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: buildFormBody(data)
        });
        const result = await response.json();
        
        // 检查是否是同名建筑错误
        if (response.status === 409 && result.code === 'DUPLICATE') {
            showCustomAlert(result.error, 'error');
            return;
        }
        
        // 检查是否需要还原
        if (response.ok && result.status === 'restore') {
            const shouldRestore = await showCustomConfirm(result.message, '提示');
            if (shouldRestore) {
                // 还原建筑
                try {
                    const restoreResponse = await fetch('http://localhost:8080/api/admin/main-websites/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: result.id })
                    });
                    const restoreResult = await restoreResponse.json();
                    if (restoreResponse.ok) {
                        showCustomAlert('已恢复，id=' + restoreResult.id + '，你可前往编辑', 'success');
                        closeBuildingModal();
                        loadBuildings();
                        // 打开编辑弹窗
                        setTimeout(() => {
                            openBuildingModal('edit', restoreResult.id);
                        }, 500);
                    } else {
                        showCustomAlert('还原失败: ' + (restoreResult.error || '未知错误'), 'error');
                    }
                } catch (error) {
                    console.error('还原失败:', error);
                    showCustomAlert('还原失败，请检查网络', 'error');
                }
            }
            return;
        }
        
        if (response.ok && result.status === 'ok') {
            // 获取新建建筑的ID
            // 由于API返回的是 {"status":"ok","id":xxx}，尝试从响应中获取ID
            let newBuildingId = result.id;
            
            // 如果响应中没有ID，通过查询获取
            if (!newBuildingId) {
                const buildingsResponse = await fetch(API_BASE_URL);
                if (buildingsResponse.ok) {
                    const buildings = await buildingsResponse.json();
                    if (Array.isArray(buildings) && buildings.length > 0) {
                        // 找到名称匹配的最新建筑（按ID降序排列，取第一个匹配的）
                        const matchingBuildings = buildings.filter(b => b.name === data.name);
                        if (matchingBuildings.length > 0) {
                            // 按ID降序排序，取最大的（最新的）
                            matchingBuildings.sort((a, b) => b.id - a.id);
                            newBuildingId = matchingBuildings[0].id;
                        }
                    }
                }
            }
            
            // 创建网站入口
            if (newBuildingId) {
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
                                    belongsTo: newBuildingId
                                })
                            });
                        } catch (err) {
                            console.error('创建网站入口失败:', err);
                        }
                    }
                }
            }
            
            setStatus('新增成功', '#4caf50');
            setTimeout(() => {
                closeBuildingModal();
                loadBuildings();
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
    const id = document.getElementById('formId').value;
    if (!id) {
        setStatus('请选择要更新的建筑', '#f44336');
        return;
    }
    const data = gatherFormData();
    try {
        // 先更新建筑信息
        const response = await fetch(`${ADMIN_API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: buildFormBody(data)
        });
        const result = await response.json();
        
        // 检查是否是同名建筑错误
        if (response.status === 409 && result.code === 'DUPLICATE') {
            showCustomAlert(result.error, 'error');
            return;
        }
        
        // 检查是否需要还原
        if (response.ok && result.status === 'restore') {
            const shouldRestore = await showCustomConfirm(result.message, '提示');
            if (shouldRestore) {
                // 还原建筑
                try {
                    const restoreResponse = await fetch('http://localhost:8080/api/admin/main-websites/restore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: result.id })
                    });
                    const restoreResult = await restoreResponse.json();
                    if (restoreResponse.ok) {
                        showCustomAlert('已恢复，id=' + restoreResult.id + '，你可前往编辑', 'success');
                        closeBuildingModal();
                        loadBuildings();
                        // 打开编辑弹窗
                        setTimeout(() => {
                            openBuildingModal('edit', restoreResult.id);
                        }, 500);
                    } else {
                        showCustomAlert('还原失败: ' + (restoreResult.error || '未知错误'), 'error');
                    }
                } catch (error) {
                    console.error('还原失败:', error);
                    showCustomAlert('还原失败，请检查网络', 'error');
                }
            }
            return;
        }
        
        if (response.ok && result.status === 'ok') {
            // 处理网站入口的更新
            const websiteEntries = gatherWebsiteEntries();
            const buildingId = parseInt(id);
            
            // 获取现有的网站入口
            const websitesResponse = await fetch(`http://localhost:8080/api/websites?buildingId=${buildingId}`);
            if (websitesResponse.ok) {
                const existingWebsites = await websitesResponse.json();
                const existingIds = new Set(existingWebsites.map(w => w.id));
                
                // 删除不在新列表中的网站入口
                for (const existing of existingWebsites) {
                    if (!existingWebsiteIds[existing.id]) {
                        await fetch(`http://localhost:8080/api/websites?id=${existing.id}`, {
                            method: 'DELETE'
                        });
                    }
                }
                
                // 更新或创建网站入口
                for (const entry of websiteEntries) {
                    if (entry.websiteName && entry.wholeWebsite) {
                        if (entry.id && existingIds.has(parseInt(entry.id))) {
                            // 更新现有入口
                            await fetch(`http://localhost:8080/api/websites?id=${entry.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    websiteName: entry.websiteName,
                                    wholeWebsite: entry.wholeWebsite
                                })
                            });
                        } else {
                            // 创建新入口
                            await fetch('http://localhost:8080/api/websites', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    websiteName: entry.websiteName,
                                    wholeWebsite: entry.wholeWebsite,
                                    belongsTo: buildingId
                                })
                            });
                        }
                    }
                }
            }
            
            setStatus('更新成功', '#4caf50');
            setTimeout(() => {
                closeBuildingModal();
                loadBuildings();
            }, 1000);
        } else {
            setStatus(result.error || '更新失败', '#f44336');
        }
    } catch (error) {
        console.error('更新失败:', error);
        setStatus('更新失败，请检查网络', '#f44336');
    }
}


function setStatus(message, color) {
    const box = document.getElementById('adminStatusBox');
    box.textContent = message;
    box.style.color = color || '#333';
}

// 显示新建公告弹窗
function showAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'flex';
    document.getElementById('announcementStatus').textContent = '';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementContent').value = '';
}

// 关闭新建公告弹窗
function closeAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'none';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementContent').value = '';
    document.getElementById('announcementStatus').textContent = '';
}

// 提交公告
async function submitAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const statusBox = document.getElementById('announcementStatus');
    
    if (!title || !content) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '标题和内容不能为空';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:8080/api/admin/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            statusBox.style.color = '#4caf50';
            statusBox.textContent = '公告发布成功！';
            setTimeout(() => {
                closeAnnouncementModal();
            }, 1500);
        } else {
            statusBox.style.color = '#f44336';
            statusBox.textContent = result.error || '发布失败';
        }
    } catch (error) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '发布失败，请检查网络';
        console.error('发布公告失败:', error);
    }
}

// 点击弹窗外部关闭（延迟执行，确保DOM已加载）
window.addEventListener('DOMContentLoaded', function() {
    const announcementModal = document.getElementById('announcementModal');
    if (announcementModal) {
        announcementModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAnnouncementModal();
            }
        });
    }
    
    const buildingModal = document.getElementById('buildingModal');
    if (buildingModal) {
        buildingModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeBuildingModal();
            }
        });
    }
    
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeDeleteModal();
            }
        });
    }
});

// 登录相关函数
const LOGIN_URL = 'http://localhost:8080/api/admin/login';

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginStatus').textContent = '';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginStatus').textContent = '';
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
            // 保存登录状态到localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            // 关闭登录弹窗
            closeLoginModal();
            // 重新加载页面数据
            loadBuildings();
        } else {
            statusBox.style.color = '#f44336';
            statusBox.textContent = result.error || '登录失败';
        }
    } catch (error) {
        statusBox.style.color = '#f44336';
        statusBox.textContent = '登录失败，请检查网络';
    }
}

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
        // 如果未登录，显示登录弹窗
        openLoginModal();
    }
}

// 监听密码输入框回车键
const loginPassword = document.getElementById('loginPassword');
if (loginPassword) {
    loginPassword.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            submitLogin();
        }
    });
}

// 页面加载时检查登录状态
checkLoginStatus();

loadBuildings();
    





