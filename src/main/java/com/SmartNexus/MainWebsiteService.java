package com.SmartNexus;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 主网站业务逻辑类
 */
public class MainWebsiteService {
    
    /**
     * 获取所有主网站列表（只返回未删除的）
     */
    public List<MainWebsite> getAllMainWebsites() throws SQLException {
        List<MainWebsite> mainWebsites = new ArrayList<>();
        Connection conn = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description FROM main_website WHERE deleted = 0 ORDER BY id";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                mainWebsites.add(mainWebsite);
            }
            
            rs.close();
            pstmt.close();
        } finally {
            DatabaseUtil.closeConnection(conn);
        }
        
        return mainWebsites;
    }
    
    /**
     * 根据ID获取单个主网站（只返回未删除的）
     */
    public MainWebsite getMainWebsiteById(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description FROM main_website WHERE id = ? AND deleted = 0";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                return mainWebsite;
            }
            
            return null;
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 获取统计数据
     */
    public Map<String, Object> getStatistics() throws SQLException {
        Map<String, Object> stats = new HashMap<>();
        Connection conn = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            
            // 总主网站数（只统计未删除的）
            String sql1 = "SELECT COUNT(*) as total FROM main_website WHERE deleted = 0";
            PreparedStatement pstmt1 = conn.prepareStatement(sql1);
            ResultSet rs1 = pstmt1.executeQuery();
            if (rs1.next()) {
                stats.put("totalCount", rs1.getInt("total"));
            }
            rs1.close();
            pstmt1.close();
            
            // 类型统计
            String sql3 = "SELECT type, COUNT(*) as count FROM main_website WHERE deleted = 0 GROUP BY type";
            PreparedStatement pstmt3 = conn.prepareStatement(sql3);
            ResultSet rs3 = pstmt3.executeQuery();
            Map<String, Integer> typeStats = new HashMap<>();
            while (rs3.next()) {
                typeStats.put(rs3.getString("type"), rs3.getInt("count"));
            }
            stats.put("typeStatistics", typeStats);
            rs3.close();
            pstmt3.close();
            
            // 状态统计
            String sql4 = "SELECT status, COUNT(*) as count FROM main_website WHERE deleted = 0 GROUP BY status";
            PreparedStatement pstmt4 = conn.prepareStatement(sql4);
            ResultSet rs4 = pstmt4.executeQuery();
            Map<String, Integer> statusStats = new HashMap<>();
            while (rs4.next()) {
                statusStats.put(rs4.getString("status"), rs4.getInt("count"));
            }
            stats.put("statusStatistics", statusStats);
            rs4.close();
            pstmt4.close();
            
        } finally {
            DatabaseUtil.closeConnection(conn);
        }
        
        return stats;
    }
    
    /**
     * 按区域获取主网站信息（从地址中提取区域信息）
     */
    public Map<String, List<MainWebsite>> getMainWebsitesByArea() throws SQLException {
        Map<String, List<MainWebsite>> areaMainWebsites = new HashMap<>();
        Connection conn = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            // 使用SQL提取区域信息：从地址中提取第一个词（区域名）
            // 假设地址格式为"区域名+路名+门牌号"，使用SUBSTRING_INDEX提取区域名
            // 如果地址包含"区"字，提取"区"字之前的内容+"区"
            String sql = "SELECT id, name, type, status, website, description, " +
                        "'未知区域' as area_name " +
                        "FROM main_website " +
                        "WHERE deleted = 0 " +
                        "ORDER BY id";
            
            PreparedStatement pstmt = conn.prepareStatement(sql);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                String areaName = rs.getString("area_name");
                if (areaName == null || areaName.isEmpty()) {
                    areaName = "未知区域";
                }
                
                if (!areaMainWebsites.containsKey(areaName)) {
                    areaMainWebsites.put(areaName, new ArrayList<>());
                }
                areaMainWebsites.get(areaName).add(mainWebsite);
            }
            
            rs.close();
            pstmt.close();
        } finally {
            DatabaseUtil.closeConnection(conn);
        }
        
        return areaMainWebsites;
    }
    
    /**
     * 获取区域统计信息
     */
    public Map<String, Map<String, Object>> getAreaStatistics() throws SQLException {
        Map<String, Map<String, Object>> areaStats = new HashMap<>();
        Connection conn = null;
        
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT " +
                        "'未知区域' as area_name, " +
                        "COUNT(*) as main_website_count " +
                        "FROM main_website " +
                        "WHERE deleted = 0 " +
                        "GROUP BY area_name " +
                        "ORDER BY main_website_count DESC";
            
            PreparedStatement pstmt = conn.prepareStatement(sql);
            ResultSet rs = pstmt.executeQuery();
            
            while (rs.next()) {
                String areaName = rs.getString("area_name");
                if (areaName == null || areaName.isEmpty()) {
                    areaName = "未知区域";
                }
                
                Map<String, Object> stats = new HashMap<>();
                stats.put("mainWebsiteCount", rs.getInt("main_website_count"));
                areaStats.put(areaName, stats);
            }
            
            rs.close();
            pstmt.close();
        } finally {
            DatabaseUtil.closeConnection(conn);
        }
        
        return areaStats;
    }

    /**
     * 根据名称查找主网站（包括已删除的）
     * 返回主网站信息，如果不存在返回null
     */
    public MainWebsite findMainWebsiteByName(String name) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description, deleted FROM main_website WHERE name = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                // 注意：这里我们需要知道deleted状态，但MainWebsite类没有这个字段
                // 我们可以通过返回的mainWebsite对象来判断，或者创建一个新的方法返回包含deleted的对象
                // 为了简单，我们返回mainWebsite，然后在调用处通过查询deleted字段来判断
                return mainWebsite;
            }
            return null;
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 根据名称查找主网站（包括已删除的），返回包含deleted状态的信息
     */
    public Map<String, Object> findMainWebsiteByNameWithDeleted(String name) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description, deleted FROM main_website WHERE name = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                int deleted = rs.getInt("deleted");
                
                Map<String, Object> result = new HashMap<>();
                result.put("mainWebsite", mainWebsite);
                result.put("deleted", deleted);
                return result;
            }
            return null;
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 根据名称查找主网站（排除指定ID，用于更新时检查重名）
     */
    public Map<String, Object> findMainWebsiteByNameWithDeletedExcludingId(String name, Long excludeId) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description, deleted FROM main_website WHERE name = ? AND id != ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);
            pstmt.setLong(2, excludeId);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                int deleted = rs.getInt("deleted");
                
                Map<String, Object> result = new HashMap<>();
                result.put("mainWebsite", mainWebsite);
                result.put("deleted", deleted);
                return result;
            }
            return null;
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 根据ID获取主网站（包括已删除的，用于恢复操作）
     */
    public MainWebsite getMainWebsiteByIdWithDeleted(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, name, type, status, website, description FROM main_website WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                MainWebsite mainWebsite = new MainWebsite();
                mainWebsite.setId(rs.getLong("id"));
                mainWebsite.setName(rs.getString("name"));
                mainWebsite.setType(rs.getString("type"));
                
                mainWebsite.setStatus(rs.getString("status"));
                mainWebsite.setWebsite(rs.getString("website"));
                mainWebsite.setDescription(rs.getString("description"));
                
                return mainWebsite;
            }
            
            return null;
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 还原主网站（将 deleted 字段设置为 0）
     */
    public void restoreMainWebsite(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "UPDATE main_website SET deleted = 0 WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 添加主网站（使用简单的 AUTO_INCREMENT，不查找空余ID）
     */
    public Long addMainWebsite(MainWebsite mainWebsite) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            // 使用简单的 AUTO_INCREMENT，让数据库自动生成ID
            String sql = "INSERT INTO main_website (name, type, status, website, description, deleted) "
                        + "VALUES (?, ?, ?, ?, ?, 0)";
            pstmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
            setMainWebsiteStatement(pstmt, mainWebsite, false, 1); // 从索引1开始设置参数
            pstmt.executeUpdate();
            
            // 获取生成的ID
            ResultSet rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                return rs.getLong(1);
            }
            return null;
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }

    public void updateMainWebsite(MainWebsite mainWebsite) throws SQLException {
        if (mainWebsite.getId() == null) {
            throw new IllegalArgumentException("MainWebsite ID is required for update");
        }
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "UPDATE main_website SET name=?, type=?, status=?, website=?, description=? "
                    + "WHERE id=?";
            pstmt = conn.prepareStatement(sql);
            setMainWebsiteStatement(pstmt, mainWebsite, true);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }

    /**
     * 软删除主网站（将 deleted 字段设置为 0）
     */
    public void deleteMainWebsite(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "UPDATE main_website SET deleted = 1 WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }

    private void setMainWebsiteStatement(PreparedStatement pstmt, MainWebsite mainWebsite, boolean includeId) throws SQLException {
        setMainWebsiteStatement(pstmt, mainWebsite, includeId, 1);
    }
    
    private void setMainWebsiteStatement(PreparedStatement pstmt, MainWebsite mainWebsite, boolean includeId, int startIndex) throws SQLException {
        int index = startIndex;
        pstmt.setString(index++, mainWebsite.getName());
        pstmt.setString(index++, mainWebsite.getType());
        pstmt.setString(index++, mainWebsite.getStatus());
        pstmt.setString(index++, mainWebsite.getWebsite());
        pstmt.setString(index++, mainWebsite.getDescription());
        if (includeId) {
            pstmt.setLong(index, mainWebsite.getId());
        }
    }
}


