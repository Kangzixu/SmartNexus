package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class FeedbackService {

    public void saveFeedback(String category, String message, String contact) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "INSERT INTO feedback (category, message, contact) VALUES (?, ?, ?)";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, category);
            pstmt.setString(2, message);
            pstmt.setString(3, contact);
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
     * 获取所有反馈列表
     */
    public List<Feedback> getAllFeedbacks() throws SQLException {
        List<Feedback> feedbacks = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, category, message, contact, create_time FROM feedback ORDER BY create_time DESC";
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                Feedback feedback = new Feedback();
                feedback.setId(rs.getLong("id"));
                feedback.setCategory(rs.getString("category"));
                feedback.setMessage(rs.getString("message"));
                feedback.setContact(rs.getString("contact"));
                
                Timestamp createTime = rs.getTimestamp("create_time");
                feedback.setCreateTimeStr(createTime != null ? createTime.toString() : null);
                
                feedbacks.add(feedback);
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
        
        return feedbacks;
    }
}




