package com.SmartNexus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Web 配置类
 * 配置静态资源映射和 CORS
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * 配置静态资源映射
     * 将 content 文件夹映射为静态资源
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 获取 content 文件夹的绝对路径
        String contentPath = Paths.get("content").toAbsolutePath().toString();
        
        registry.addResourceHandler("/**")
                .addResourceLocations("file:" + contentPath + "/")
                .addResourceLocations("classpath:/static/");
    }

    /**
     * 配置 CORS（跨域资源共享）
     * 允许前端访问 API
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*") // 允许所有来源（生产环境应该限制为特定域名）
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(false);
    }
}

