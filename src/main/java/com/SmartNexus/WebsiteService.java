package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * 网站入口业务逻辑类
 */
public class WebsiteService {
    
    /**
     * 添加网站入口
     */
    public Long addWebsite(String websiteName, String wholeWebsite, Long belongsTo) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        Long generatedId = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "INSERT INTO websites (website_name, whole_website, belongs_to) VALUES (?, ?, ?)";
            pstmt = conn.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS);
            pstmt.setString(1, websiteName);
            pstmt.setString(2, wholeWebsite);
            pstmt.setLong(3, belongsTo);
            pstmt.executeUpdate();
            
            ResultSet rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                generatedId = rs.getLong(1);
            }
            rs.close();
        } finally {
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
        return generatedId;
    }
    
    /**
     * 根据主网站ID获取所有网站入口
     */
    public List<Website> getWebsitesByMainWebsiteId(Long mainWebsiteId) throws SQLException {
        List<Website> websites = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, website_name, whole_website, belongs_to FROM websites WHERE belongs_to = ? ORDER BY id";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, mainWebsiteId);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Website website = new Website();
                website.setId(rs.getLong("id"));
                website.setWebsiteName(rs.getString("website_name"));
                website.setWholeWebsite(rs.getString("whole_website"));
                website.setBelongsTo(rs.getLong("belongs_to"));
                websites.add(website);
            }
        } finally {
            if (rs != null) {
                try {
                    rs.close();
                } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
        return websites;
    }
    
    /**
     * 获取所有网站入口
     */
    public List<Website> getAllWebsites() throws SQLException {
        List<Website> websites = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, website_name, whole_website, belongs_to FROM websites ORDER BY belongs_to, id";
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Website website = new Website();
                website.setId(rs.getLong("id"));
                website.setWebsiteName(rs.getString("website_name"));
                website.setWholeWebsite(rs.getString("whole_website"));
                website.setBelongsTo(rs.getLong("belongs_to"));
                websites.add(website);
            }
        } finally {
            if (rs != null) {
                try {
                    rs.close();
                } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
        return websites;
    }
    
    /**
     * 根据ID删除网站入口
     */
    public void deleteWebsite(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "DELETE FROM websites WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 更新网站入口
     */
    public void updateWebsite(Long id, String websiteName, String wholeWebsite) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "UPDATE websites SET website_name = ?, whole_website = ? WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, websiteName);
            pstmt.setString(2, wholeWebsite);
            pstmt.setLong(3, id);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 根据ID获取网站入口
     */
    public Website getWebsiteById(Long id) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Website website = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, website_name, whole_website, belongs_to FROM websites WHERE id = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setLong(1, id);
            rs = pstmt.executeQuery();
            
            if (rs.next()) {
                website = new Website();
                website.setId(rs.getLong("id"));
                website.setWebsiteName(rs.getString("website_name"));
                website.setWholeWebsite(rs.getString("whole_website"));
                website.setBelongsTo(rs.getLong("belongs_to"));
            }
        } finally {
            if (rs != null) {
                try {
                    rs.close();
                } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try {
                    pstmt.close();
                } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
        return website;
    }
}

