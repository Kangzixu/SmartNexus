-- 创建数据库
CREATE DATABASE IF NOT EXISTS smart_nexus CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE smart_nexus;

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 主网站表（网络资源导航）
CREATE TABLE IF NOT EXISTS main_website (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    website VARCHAR(500),
    description TEXT COMMENT '网站描述',
    deleted TINYINT DEFAULT 0 COMMENT '删除标记：0=未删除（正常），1=已删除',
    last_update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT '操作类型: CREATE, UPDATE, DELETE',
    main_website_id BIGINT,
    main_website_name VARCHAR(100),
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT COMMENT '操作详情，JSON格式存储变更内容'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认管理员用户 (密码: 123456，明文存储)
INSERT INTO user (username, password, role) VALUES 
('admin', '123456', 'ADMIN')
ON DUPLICATE KEY UPDATE username=username;

-- 插入示例主网站数据
INSERT INTO main_website (name, type, status, website, deleted) VALUES
('政务服务平台', '政务', '运行', 'https://www.gov.cn', 0),
('百度', '互联网', '运行', 'https://www.baidu.com', 0),
('腾讯', '互联网', '运行', 'https://www.tencent.com', 0),
('阿里巴巴', '互联网', '运行', 'https://www.alibaba.com', 0),
('京东', '电商', '运行', 'https://www.jd.com', 0),
('淘宝', '电商', '运行', 'https://www.taobao.com', 0),
('网易', '互联网', '运行', 'https://www.163.com', 0)
ON DUPLICATE KEY UPDATE name=name;

-- 反馈表
CREATE TABLE IF NOT EXISTS feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    contact VARCHAR(100),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 公告表
CREATE TABLE IF NOT EXISTS announcement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 网站入口表
CREATE TABLE IF NOT EXISTS websites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    website_name VARCHAR(100) NOT NULL COMMENT '入口名称',
    whole_website VARCHAR(500) NOT NULL COMMENT '入口网址',
    belongs_to BIGINT NOT NULL COMMENT '属于哪个主网站的id',
    FOREIGN KEY (belongs_to) REFERENCES main_website(id) ON DELETE RESTRICT,
    INDEX idx_belongs_to (belongs_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 我的关心表
CREATE TABLE IF NOT EXISTS my_care (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户id',
    care_id BIGINT NOT NULL COMMENT '用户关心的主网站id',
    deleted TINYINT DEFAULT 0 COMMENT '是否删除：0=关心，1=不关心',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (care_id) REFERENCES main_website(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_care_id (care_id),
    UNIQUE KEY uk_user_care (user_id, care_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户搜索记录表（用于用户画像）
CREATE TABLE IF NOT EXISTS user_search_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户id',
    search_keyword VARCHAR(200) NOT NULL COMMENT '搜索关键词',
    search_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '搜索时间',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_search_time (search_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户点击网址记录表（用于用户画像）
CREATE TABLE IF NOT EXISTS user_click_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户id',
    url VARCHAR(500) NOT NULL COMMENT '点击的网址',
    url_type VARCHAR(50) NOT NULL COMMENT '网址类型：official(官方网站), entry(更多入口), concern(我的关心), bookmark(云收藏夹)',
    main_website_id BIGINT COMMENT '关联的主网站id',
    click_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '点击时间',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (main_website_id) REFERENCES main_website(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_main_website_id (main_website_id),
    INDEX idx_click_time (click_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户自定义网址表（云收藏夹）
CREATE TABLE IF NOT EXISTS user_defined_website (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户id',
    website_name VARCHAR(100) NOT NULL COMMENT '网址名称',
    website VARCHAR(500) NOT NULL COMMENT '网址',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

