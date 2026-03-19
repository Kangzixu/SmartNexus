package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class AnnouncementService {

    /**
     * 创建公告
     */
    public void createAnnouncement(String title, String content) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "INSERT INTO announcement (title, content) VALUES (?, ?)";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, title);
            pstmt.setString(2, content);
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
     * 获取所有公告列表
     */
    public List<Announcement> getAllAnnouncements() throws SQLException {
        List<Announcement> announcements = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, title, content, create_time, update_time FROM announcement ORDER BY create_time DESC";
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Announcement announcement = new Announcement();
                announcement.setId(rs.getLong("id"));
                announcement.setTitle(rs.getString("title"));
                announcement.setContent(rs.getString("content"));
                
                Timestamp createTime = rs.getTimestamp("create_time");
                announcement.setCreateTime(createTime != null ? createTime.toString() : null);
                
                Timestamp updateTime = rs.getTimestamp("update_time");
                announcement.setUpdateTime(updateTime != null ? updateTime.toString() : null);
                
                announcements.add(announcement);
            }
        } finally {
            if (rs != null) {
                try { rs.close(); } catch (SQLException ignored) {}
            }
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
        
        return announcements;
    }
}
