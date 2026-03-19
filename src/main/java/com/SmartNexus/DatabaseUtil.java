package com.SmartNexus;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * 数据库工具类
 */
public class DatabaseUtil {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/smart_nexus?useSSL=false&serverTimezone=UTC&characterEncoding=utf8";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "123456";
    
    /**
     * 获取数据库连接
     */
    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new SQLException("MySQL JDBC Driver not found", e);
        }
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }
    
    /**
     * 关闭数据库连接
     */
    public static void closeConnection(Connection conn) {
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                System.err.println("关闭数据库连接失败: " + e.getMessage());
            }
        }
    }
    
    /**
     * 测试数据库连接
     */
    public static boolean testConnection() {
        Connection conn = null;
        try {
            conn = getConnection();
            return conn != null && !conn.isClosed();
        } catch (SQLException e) {
            System.err.println("数据库连接测试失败: " + e.getMessage());
            return false;
        } finally {
            closeConnection(conn);
        }
    }
}





