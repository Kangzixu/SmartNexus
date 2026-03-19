package com.SmartNexus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AuthService {

    public boolean authenticate(String username, String password) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT password FROM user WHERE username = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, username);
            rs = pstmt.executeQuery();
            if (rs.next()) {
                String storedPassword = rs.getString("password");
                return storedPassword != null && storedPassword.equals(password);
            }
            return false;
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
     * 获取用户信息（包括角色）
     */
    public UserInfo getUserInfo(String username) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            conn = DatabaseUtil.getConnection();
            String sql = "SELECT id, username, role FROM user WHERE username = ?";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, username);
            rs = pstmt.executeQuery();
            if (rs.next()) {
                UserInfo userInfo = new UserInfo();
                userInfo.id = rs.getLong("id");
                userInfo.username = rs.getString("username");
                userInfo.role = rs.getString("role");
                return userInfo;
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
     * 注册新用户
     */
    public boolean register(String username, String password) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        try {
            conn = DatabaseUtil.getConnection();
            // 检查用户名是否已存在
            String checkSql = "SELECT id FROM user WHERE username = ?";
            PreparedStatement checkPstmt = conn.prepareStatement(checkSql);
            checkPstmt.setString(1, username);
            ResultSet rs = checkPstmt.executeQuery();
            if (rs.next()) {
                rs.close();
                checkPstmt.close();
                return false; // 用户名已存在
            }
            rs.close();
            checkPstmt.close();
            
            // 插入新用户，role默认为USER
            String sql = "INSERT INTO user (username, password, role) VALUES (?, ?, 'USER')";
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, username);
            pstmt.setString(2, password);
            int result = pstmt.executeUpdate();
            return result > 0;
        } finally {
            if (pstmt != null) {
                try { pstmt.close(); } catch (SQLException ignored) {}
            }
            DatabaseUtil.closeConnection(conn);
        }
    }
    
    /**
     * 用户信息类
     */
    public static class UserInfo {
        public Long id;
        public String username;
        public String role;
    }
}










