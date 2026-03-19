package com.SmartNexus.config;

import com.SmartNexus.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * DatabaseUtil 初始化器
 * 将 Spring 的 DataSource 注入到 DatabaseUtil 中
 * 
 * 注意：由于 DatabaseUtil 使用静态方法，这里我们采用另一种方式：
 * 保持 DatabaseUtil 不变，让它继续使用 DriverManager，但 Spring Boot 会自动配置连接池。
 * 如果将来需要，可以将 DatabaseUtil 改为使用 DataSource。
 */
@Component
public class DatabaseUtilInitializer {

    @Autowired
    private DataSource dataSource;

    /**
     * 初始化后测试数据库连接
     */
    @PostConstruct
    public void init() {
        try {
            Connection conn = dataSource.getConnection();
            if (conn != null && !conn.isClosed()) {
                System.out.println("数据库连接正常（使用 Spring DataSource）");
                conn.close();
            }
        } catch (SQLException e) {
            System.err.println("警告: 数据库连接测试失败，请检查数据库配置: " + e.getMessage());
        }
    }
}

