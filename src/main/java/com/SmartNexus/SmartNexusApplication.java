package com.SmartNexus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SmartNexus 应用主类
 * Spring Boot 应用程序入口
 */
@SpringBootApplication
public class SmartNexusApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartNexusApplication.class, args);
        System.out.println("========================================");
        System.out.println("SmartNexus 服务器已启动");
        System.out.println("访问地址: http://localhost:8080");
        System.out.println("按 Ctrl+C 停止服务器");
        System.out.println("========================================");
    }
}

