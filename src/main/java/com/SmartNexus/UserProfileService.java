package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 用户画像服务类
 */
public class UserProfileService {
    
    /**
     * 记录用户搜索
     */
    public boolean logUserSearch(Long userId, String searchKeyword) {
        if (userId == null || searchKeyword == null || searchKeyword.trim().isEmpty()) {
            return false;
        }
        
        String sql = "INSERT INTO user_search_log (user_id, search_keyword, search_time) VALUES (?, ?, ?)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.setString(2, searchKeyword.trim());
            stmt.setTimestamp(3, Timestamp.valueOf(LocalDateTime.now()));
            
            int rows = stmt.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            System.err.println("记录用户搜索失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 记录用户点击网址
     */
    public boolean logUserClick(Long userId, String url, String urlType, Long mainWebsiteId) {
        if (userId == null || url == null || url.trim().isEmpty() || urlType == null) {
            return false;
        }
        
        String sql = "INSERT INTO user_click_log (user_id, url, url_type, main_website_id, click_time) VALUES (?, ?, ?, ?, ?)";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            stmt.setString(2, url.trim());
            stmt.setString(3, urlType);
            if (mainWebsiteId != null) {
                stmt.setLong(4, mainWebsiteId);
            } else {
                stmt.setNull(4, java.sql.Types.BIGINT);
            }
            stmt.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
            
            int rows = stmt.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            System.err.println("记录用户点击失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 获取用户搜索历史
     */
    public List<Map<String, Object>> getUserSearchHistory(Long userId) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        String sql = "SELECT search_keyword, search_time FROM user_search_log WHERE user_id = ? ORDER BY search_time DESC LIMIT 100";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("searchKeyword", rs.getString("search_keyword"));
                item.put("searchTime", rs.getTimestamp("search_time").toString());
                results.add(item);
            }
        } catch (SQLException e) {
            System.err.println("获取用户搜索历史失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        return results;
    }
    
    /**
     * 获取用户点击历史
     */
    public List<Map<String, Object>> getUserClickHistory(Long userId) {
        List<Map<String, Object>> results = new java.util.ArrayList<>();
        String sql = "SELECT url, url_type, click_time FROM user_click_log WHERE user_id = ? ORDER BY click_time DESC LIMIT 100";
        
        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, userId);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("url", rs.getString("url"));
                item.put("urlType", rs.getString("url_type"));
                item.put("clickTime", rs.getTimestamp("click_time").toString());
                results.add(item);
            }
        } catch (SQLException e) {
            System.err.println("获取用户点击历史失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        return results;
    }
    
    /**
     * 获取统计数据（管理员）
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new java.util.HashMap<>();
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            // 用户统计
            String userSql = "SELECT COUNT(*) as total, SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_count FROM user";
            try (PreparedStatement stmt = conn.prepareStatement(userSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.put("totalUsers", rs.getInt("total"));
                    stats.put("adminUsers", rs.getInt("admin_count"));
                    stats.put("normalUsers", rs.getInt("total") - rs.getInt("admin_count"));
                }
            }
            
            // 搜索统计
            String searchSql = "SELECT COUNT(*) as total FROM user_search_log";
            try (PreparedStatement stmt = conn.prepareStatement(searchSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.put("totalSearches", rs.getInt("total"));
                }
            }
            
            // 热门搜索
            String popularSql = "SELECT search_keyword as keyword, COUNT(*) as count FROM user_search_log GROUP BY search_keyword ORDER BY count DESC LIMIT 10";
            List<Map<String, Object>> popularSearches = new java.util.ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(popularSql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("keyword", rs.getString("keyword"));
                    item.put("count", rs.getInt("count"));
                    popularSearches.add(item);
                }
            }
            stats.put("popularSearches", popularSearches);
            
            // 点击统计
            String clickSql = "SELECT COUNT(*) as total, SUM(CASE WHEN url_type = 'official' THEN 1 ELSE 0 END) as official, SUM(CASE WHEN url_type = 'entry' THEN 1 ELSE 0 END) as entry, SUM(CASE WHEN url_type = 'concern' THEN 1 ELSE 0 END) as concern FROM user_click_log";
            try (PreparedStatement stmt = conn.prepareStatement(clickSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.put("totalClicks", rs.getInt("total"));
                    stats.put("officialClicks", rs.getInt("official"));
                    stats.put("entryClicks", rs.getInt("entry"));
                    stats.put("concernClicks", rs.getInt("concern"));
                }
            }
            
            // 建筑统计
            String mainWebsiteSql = "SELECT COUNT(*) as total FROM main_website WHERE deleted = 0";
            try (PreparedStatement stmt = conn.prepareStatement(mainWebsiteSql);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    stats.put("totalMainWebsites", rs.getInt("total"));
                }
            }
            
            // 官方网站访问排行 Top 10
            String officialUrlSql = "SELECT url, main_website_id, COUNT(*) as count FROM user_click_log WHERE url_type = 'official' GROUP BY url, main_website_id ORDER BY count DESC LIMIT 10";
            List<Map<String, Object>> officialUrlRanking = new java.util.ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(officialUrlSql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new java.util.HashMap<>();
                    String url = rs.getString("url");
                    Long mainWebsiteId = rs.getLong("main_website_id");
                    if (rs.wasNull()) {
                        mainWebsiteId = null;
                    }
                    item.put("url", url);
                    item.put("count", rs.getInt("count"));
                    
                    // 获取主网站名称
                    if (mainWebsiteId != null) {
                        String officialMainWebsiteSql = "SELECT name FROM main_website WHERE id = ? AND deleted = 0";
                        try (PreparedStatement mainWebsiteStmt = conn.prepareStatement(officialMainWebsiteSql)) {
                            mainWebsiteStmt.setLong(1, mainWebsiteId);
                            try (ResultSet mainWebsiteRs = mainWebsiteStmt.executeQuery()) {
                                if (mainWebsiteRs.next()) {
                                    item.put("mainWebsiteName", mainWebsiteRs.getString("name"));
                                }
                            }
                        }
                    }
                    
                    officialUrlRanking.add(item);
                }
            }
            stats.put("officialUrlRanking", officialUrlRanking);
            
            // 入口网站访问排行 Top 10
            String entryUrlSql = "SELECT url, COUNT(*) as count FROM user_click_log WHERE url_type = 'entry' GROUP BY url ORDER BY count DESC LIMIT 10";
            List<Map<String, Object>> entryUrlRanking = new java.util.ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(entryUrlSql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new java.util.HashMap<>();
                    String url = rs.getString("url");
                    item.put("url", url);
                    item.put("count", rs.getInt("count"));
                    
                    // 从websites表获取入口名称和主网站ID，然后从main_website表获取主网站名称
                    String entrySql = "SELECT website_name, belongs_to FROM websites WHERE whole_website = ?";
                    try (PreparedStatement entryStmt = conn.prepareStatement(entrySql)) {
                        entryStmt.setString(1, url);
                        try (ResultSet entryRs = entryStmt.executeQuery()) {
                            if (entryRs.next()) {
                                item.put("entryName", entryRs.getString("website_name"));
                                Long entryMainWebsiteId = entryRs.getLong("belongs_to");
                                
                                // 获取主网站名称
                                String entryMainWebsiteSql = "SELECT name FROM main_website WHERE id = ? AND deleted = 0";
                                try (PreparedStatement mainWebsiteStmt = conn.prepareStatement(entryMainWebsiteSql)) {
                                    mainWebsiteStmt.setLong(1, entryMainWebsiteId);
                                    try (ResultSet mainWebsiteRs = mainWebsiteStmt.executeQuery()) {
                                        if (mainWebsiteRs.next()) {
                                            item.put("mainWebsiteName", mainWebsiteRs.getString("name"));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    entryUrlRanking.add(item);
                }
            }
            stats.put("entryUrlRanking", entryUrlRanking);
            
            // 用户活跃度趋势（最近30天）
            String activitySql = "SELECT DATE(search_time) as date, COUNT(*) as search_count FROM user_search_log WHERE search_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(search_time) ORDER BY date";
            Map<String, Integer> searchByDate = new java.util.HashMap<>();
            try (PreparedStatement stmt = conn.prepareStatement(activitySql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String date = rs.getDate("date").toString();
                    searchByDate.put(date, rs.getInt("search_count"));
                }
            }
            
            String clickActivitySql = "SELECT DATE(click_time) as date, COUNT(*) as click_count FROM user_click_log WHERE click_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(click_time) ORDER BY date";
            Map<String, Integer> clickByDate = new java.util.HashMap<>();
            try (PreparedStatement stmt = conn.prepareStatement(clickActivitySql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    String date = rs.getDate("date").toString();
                    clickByDate.put(date, rs.getInt("click_count"));
                }
            }
            
            // 合并日期数据
            java.util.Set<String> allDates = new java.util.HashSet<>();
            allDates.addAll(searchByDate.keySet());
            allDates.addAll(clickByDate.keySet());
            List<String> sortedDates = new java.util.ArrayList<>(allDates);
            java.util.Collections.sort(sortedDates);
            
            List<Map<String, Object>> activityTrend = new java.util.ArrayList<>();
            for (String date : sortedDates) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("date", date);
                item.put("searchCount", searchByDate.getOrDefault(date, 0));
                item.put("clickCount", clickByDate.getOrDefault(date, 0));
                activityTrend.add(item);
            }
            stats.put("activityTrend", activityTrend);
            
            // 最受欢迎的建筑类型（基于访问量）
            String mainWebsiteTypeSql = "SELECT mw.type, COUNT(*) as count FROM user_click_log ucl JOIN main_website mw ON ucl.main_website_id = mw.id WHERE mw.deleted = 0 GROUP BY mw.type ORDER BY count DESC";
            List<Map<String, Object>> mainWebsiteTypeRanking = new java.util.ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(mainWebsiteTypeSql);
                 ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("type", rs.getString("type"));
                    item.put("count", rs.getInt("count"));
                    mainWebsiteTypeRanking.add(item);
                }
            }
            stats.put("mainWebsiteTypeRanking", mainWebsiteTypeRanking);
            
        } catch (SQLException e) {
            System.err.println("获取统计数据失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        return stats;
    }
    
    /**
     * 获取网站热度推荐榜（前5名，合并所有类型）
     */
    public List<Map<String, Object>> getTopWebsites(int limit) {
        List<Map<String, Object>> topWebsites = new java.util.ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            // 合并所有类型的网站访问量，获取前N名（排除云收藏夹类型）
            // 先获取访问量前N的URL
            String topUrlsSql = "SELECT url, COUNT(*) as count " +
                               "FROM user_click_log " +
                               "WHERE url_type != 'bookmark' " +
                               "GROUP BY url " +
                               "ORDER BY count DESC " +
                               "LIMIT ?";
            List<String> topUrls = new java.util.ArrayList<>();
            try (PreparedStatement stmt = conn.prepareStatement(topUrlsSql)) {
                stmt.setInt(1, limit);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        topUrls.add(rs.getString("url"));
                    }
                }
            }
            
            // 对于每个URL，获取最常见的url_type和main_website_id（排除云收藏夹类型）
            for (String url : topUrls) {
                String detailSql = "SELECT url_type, main_website_id, COUNT(*) as cnt " +
                                  "FROM user_click_log " +
                                  "WHERE url = ? AND url_type != 'bookmark' " +
                                  "GROUP BY url_type, main_website_id " +
                                  "ORDER BY cnt DESC " +
                                  "LIMIT 1";
                    try (PreparedStatement detailStmt = conn.prepareStatement(detailSql)) {
                        detailStmt.setString(1, url);
                        try (ResultSet detailRs = detailStmt.executeQuery()) {
                            if (detailRs.next()) {
                                Map<String, Object> item = new java.util.HashMap<>();
                                String urlType = detailRs.getString("url_type");
                                Long mainWebsiteId = detailRs.getLong("main_website_id");
                                if (detailRs.wasNull()) {
                                    mainWebsiteId = null;
                                }
                            
                            // 获取访问总数（排除云收藏夹类型）
                            String countSql = "SELECT COUNT(*) as count FROM user_click_log WHERE url = ? AND url_type != 'bookmark'";
                            int totalCount = 0;
                            try (PreparedStatement countStmt = conn.prepareStatement(countSql)) {
                                countStmt.setString(1, url);
                                try (ResultSet countRs = countStmt.executeQuery()) {
                                    if (countRs.next()) {
                                        totalCount = countRs.getInt("count");
                                    }
                                }
                            }
                            
                            item.put("url", url);
                            item.put("urlType", urlType);
                            item.put("count", totalCount);
                            
                            // 根据URL类型获取主网站名称和入口名称
                            if ("official".equals(urlType) && mainWebsiteId != null) {
                                // 官方网站：从main_website表获取主网站名称
                                String mainWebsiteSql = "SELECT name FROM main_website WHERE id = ? AND deleted = 0";
                                try (PreparedStatement mainWebsiteStmt = conn.prepareStatement(mainWebsiteSql)) {
                                    mainWebsiteStmt.setLong(1, mainWebsiteId);
                                    try (ResultSet mainWebsiteRs = mainWebsiteStmt.executeQuery()) {
                                        if (mainWebsiteRs.next()) {
                                            item.put("mainWebsiteName", mainWebsiteRs.getString("name"));
                                        }
                                    }
                                }
                            } else if ("entry".equals(urlType)) {
                                // 入口网站：从websites表获取入口名称和主网站ID，然后从main_website表获取主网站名称
                                String entrySql = "SELECT website_name, belongs_to FROM websites WHERE whole_website = ?";
                                try (PreparedStatement entryStmt = conn.prepareStatement(entrySql)) {
                                    entryStmt.setString(1, url);
                                    try (ResultSet entryRs = entryStmt.executeQuery()) {
                                        if (entryRs.next()) {
                                            item.put("entryName", entryRs.getString("website_name"));
                                            Long entryMainWebsiteId = entryRs.getLong("belongs_to");
                                            
                                            // 获取主网站名称
                                            String mainWebsiteSql = "SELECT name FROM main_website WHERE id = ? AND deleted = 0";
                                            try (PreparedStatement mainWebsiteStmt = conn.prepareStatement(mainWebsiteSql)) {
                                                mainWebsiteStmt.setLong(1, entryMainWebsiteId);
                                                try (ResultSet mainWebsiteRs = mainWebsiteStmt.executeQuery()) {
                                                    if (mainWebsiteRs.next()) {
                                                        item.put("mainWebsiteName", mainWebsiteRs.getString("name"));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if ("bookmark".equals(urlType)) {
                                // 云收藏夹：从user_defined_website表获取网站名称
                                // 获取最常见的网站名称（按使用次数排序）
                                String bookmarkSql = "SELECT website_name, COUNT(*) as cnt " +
                                                    "FROM user_defined_website " +
                                                    "WHERE website = ? " +
                                                    "GROUP BY website_name " +
                                                    "ORDER BY cnt DESC " +
                                                    "LIMIT 1";
                                try (PreparedStatement bookmarkStmt = conn.prepareStatement(bookmarkSql)) {
                                    bookmarkStmt.setString(1, url);
                                    try (ResultSet bookmarkRs = bookmarkStmt.executeQuery()) {
                                        if (bookmarkRs.next()) {
                                            item.put("mainWebsiteName", bookmarkRs.getString("website_name"));
                                        }
                                    }
                                }
                            }
                            
                            topWebsites.add(item);
                        }
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("获取网站热度推荐榜失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        return topWebsites;
    }
    
    /**
     * 获取用户的所有自定义网址
     */
    public List<Map<String, Object>> getUserDefinedWebsites(Long userId) {
        List<Map<String, Object>> websites = new java.util.ArrayList<>();
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            String sql = "SELECT id, website_name, website, create_time, update_time " +
                        "FROM user_defined_website " +
                        "WHERE user_id = ? " +
                        "ORDER BY update_time DESC";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                try (ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> item = new java.util.HashMap<>();
                        item.put("id", rs.getLong("id"));
                        item.put("websiteName", rs.getString("website_name"));
                        item.put("website", rs.getString("website"));
                        item.put("createTime", rs.getTimestamp("create_time").toString());
                        item.put("updateTime", rs.getTimestamp("update_time").toString());
                        websites.add(item);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("获取用户自定义网址失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        return websites;
    }
    
    /**
     * 创建用户自定义网址
     */
    public boolean createUserDefinedWebsite(Long userId, String websiteName, String website) {
        if (userId == null || websiteName == null || websiteName.trim().isEmpty() || 
            website == null || website.trim().isEmpty()) {
            return false;
        }
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            String sql = "INSERT INTO user_defined_website (user_id, website_name, website) VALUES (?, ?, ?)";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                stmt.setString(2, websiteName.trim());
                stmt.setString(3, website.trim());
                int rows = stmt.executeUpdate();
                return rows > 0;
            }
        } catch (SQLException e) {
            System.err.println("创建用户自定义网址失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 更新用户自定义网址
     */
    public boolean updateUserDefinedWebsite(Long userId, Long websiteId, String websiteName, String website) {
        if (userId == null || websiteId == null || websiteName == null || websiteName.trim().isEmpty() || 
            website == null || website.trim().isEmpty()) {
            return false;
        }
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            // 先检查该网址是否属于该用户
            String checkSql = "SELECT id FROM user_defined_website WHERE id = ? AND user_id = ?";
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setLong(1, websiteId);
                checkStmt.setLong(2, userId);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (!rs.next()) {
                        return false; // 网址不存在或不属于该用户
                    }
                }
            }
            
            String sql = "UPDATE user_defined_website SET website_name = ?, website = ? WHERE id = ? AND user_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, websiteName.trim());
                stmt.setString(2, website.trim());
                stmt.setLong(3, websiteId);
                stmt.setLong(4, userId);
                int rows = stmt.executeUpdate();
                return rows > 0;
            }
        } catch (SQLException e) {
            System.err.println("更新用户自定义网址失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 删除用户自定义网址
     */
    public boolean deleteUserDefinedWebsite(Long userId, Long websiteId) {
        if (userId == null || websiteId == null) {
            return false;
        }
        
        try (Connection conn = DatabaseUtil.getConnection()) {
            String sql = "DELETE FROM user_defined_website WHERE id = ? AND user_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, websiteId);
                stmt.setLong(2, userId);
                int rows = stmt.executeUpdate();
                return rows > 0;
            }
        } catch (SQLException e) {
            System.err.println("删除用户自定义网址失败: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}

