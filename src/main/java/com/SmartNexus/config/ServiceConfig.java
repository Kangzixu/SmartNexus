package com.SmartNexus.config;

import com.SmartNexus.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Service 配置类
 * 将所有 Service 注册为 Spring Bean
 */
@Configuration
public class ServiceConfig {

    @Bean
    public MainWebsiteService mainWebsiteService() {
        return new MainWebsiteService();
    }

    @Bean
    public FeedbackService feedbackService() {
        return new FeedbackService();
    }

    @Bean
    public AuthService authService() {
        return new AuthService();
    }

    @Bean
    public AnnouncementService announcementService() {
        return new AnnouncementService();
    }

    @Bean
    public AdminLogService adminLogService() {
        return new AdminLogService();
    }

    @Bean
    public WebsiteService websiteService() {
        return new WebsiteService();
    }

    @Bean
    public UserProfileService userProfileService() {
        return new UserProfileService();
    }
}

