package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * 管理员操作日志服务
 */
public class AdminLogService {
    
    /**
     * 记录管理员操作日志
     * @param username 管理员用户名
     * @param action 操作类型 (CREATE, UPDATE, DELETE)
     * @param mainWebsiteId 主网站ID
     * @param mainWebsiteName 主网站名称
     * @param details 操作详情（JSON格式）
     */
    public void logOperation(String username, String action, Long mainWebsiteId, String mainWebsiteName, String details) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "INSERT INTO admin_operation_log (username, action, main_website_id, main_website_name, details) VALUES (?, ?, ?, ?, ?)";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, username);
            pstmt.setString(2, action);
            if (mainWebsiteId != null) {
                pstmt.setLong(3, mainWebsiteId);
            } else {
                pstmt.setNull(3, java.sql.Types.BIGINT);
            }
            pstmt.setString(4, mainWebsiteName);
            pstmt.setString(5, details);
            pstmt.executeUpdate();
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 获取所有操作日志列表（按时间倒序）
     */
    public List<AdminOperationLog> getAllOperationLogs() throws SQLException {
        List<AdminOperationLog> logs = new ArrayList<>();
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, username, action, main_website_id, main_website_name, operation_time, details FROM admin_operation_log ORDER BY operation_time DESC LIMIT 100";
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();
            
            while (rs.next()) {
                AdminOperationLog log = new AdminOperationLog();
                log.setId(rs.getLong("id"));
                log.setUsername(rs.getString("username"));
                log.setAction(rs.getString("action"));
                
                Long mainWebsiteId = rs.getLong("main_website_id");
                log.setMainWebsiteId(rs.wasNull() ? null : mainWebsiteId);
                
                log.setMainWebsiteName(rs.getString("main_website_name"));
                
                Timestamp operationTime = rs.getTimestamp("operation_time");
                log.setOperationTime(operationTime != null ? operationTime.toString() : null);
                
                log.setDetails(rs.getString("details"));
                
                logs.add(log);
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
        
        return logs;
    }
}

