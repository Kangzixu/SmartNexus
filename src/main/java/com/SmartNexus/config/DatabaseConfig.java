package com.SmartNexus.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * 数据库配置类
 * 提供 JdbcTemplate bean（Spring 推荐使用 JdbcTemplate 而不是直接使用 Connection）
 */
@Configuration
public class DatabaseConfig {

    @Bean
    public JdbcTemplate jdbcTemplate(@Autowired DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}

