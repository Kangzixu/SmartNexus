package com.SmartNexus;

import java.util.List;
import java.util.Map;

/**
 * 简单的 JSON 工具类（不使用第三方库）
 */
public class JsonUtil {
    
    /**
     * 将主网站对象转换为 JSON 字符串
     */
    public static String mainWebsiteToJson(MainWebsite mainWebsite) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"id\":").append(mainWebsite.getId()).append(",");
        json.append("\"name\":\"").append(escapeJson(mainWebsite.getName())).append("\",");
        json.append("\"type\":\"").append(escapeJson(mainWebsite.getType())).append("\",");
        json.append("\"status\":\"").append(escapeJson(mainWebsite.getStatus())).append("\",");
        json.append("\"website\":\"").append(escapeJson(mainWebsite.getWebsite())).append("\",");
        json.append("\"description\":\"").append(escapeJson(mainWebsite.getDescription())).append("\"");
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将主网站列表转换为 JSON 数组
     */
    public static String mainWebsitesToJson(List<MainWebsite> mainWebsites) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < mainWebsites.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(mainWebsiteToJson(mainWebsites.get(i)));
        }
        json.append("]");
        return json.toString();
    }
    
    /**
     * 将统计数据转换为 JSON
     */
    public static String statisticsToJson(Map<String, Object> stats) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        
        // totalCount
        json.append("\"totalCount\":").append(stats.get("totalCount")).append(",");
        
        // typeStatistics
        json.append("\"typeStatistics\":");
        @SuppressWarnings("unchecked")
        Map<String, Integer> typeStats = (Map<String, Integer>) stats.get("typeStatistics");
        json.append(mapToJson(typeStats)).append(",");
        
        // statusStatistics
        json.append("\"statusStatistics\":");
        @SuppressWarnings("unchecked")
        Map<String, Integer> statusStats = (Map<String, Integer>) stats.get("statusStatistics");
        json.append(mapToJson(statusStats));
        
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将 Map 转换为 JSON 对象
     */
    private static String mapToJson(Map<String, Integer> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        StringBuilder json = new StringBuilder();
        json.append("{");
        int index = 0;
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            if (index > 0) {
                json.append(",");
            }
            json.append("\"").append(escapeJson(entry.getKey())).append("\":").append(entry.getValue());
            index++;
        }
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将按区域分组的主网站信息转换为 JSON
     */
    public static String areaMainWebsitesToJson(Map<String, List<MainWebsite>> areaMainWebsites) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        int areaIndex = 0;
        for (Map.Entry<String, List<MainWebsite>> entry : areaMainWebsites.entrySet()) {
            if (areaIndex > 0) {
                json.append(",");
            }
            json.append("\"").append(escapeJson(entry.getKey())).append("\":");
            json.append(mainWebsitesToJson(entry.getValue()));
            areaIndex++;
        }
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将区域统计信息转换为 JSON
     */
    public static String areaStatisticsToJson(Map<String, Map<String, Object>> areaStats) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        int index = 0;
        for (Map.Entry<String, Map<String, Object>> entry : areaStats.entrySet()) {
            if (index > 0) {
                json.append(",");
            }
            json.append("\"").append(escapeJson(entry.getKey())).append("\":{");
            Map<String, Object> stats = entry.getValue();
            json.append("\"mainWebsiteCount\":").append(stats.get("mainWebsiteCount"));
            json.append("}");
            index++;
        }
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将反馈列表转换为 JSON 数组
     */
    public static String feedbacksToJson(List<Feedback> feedbacks) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < feedbacks.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(feedbackToJson(feedbacks.get(i)));
        }
        json.append("]");
        return json.toString();
    }
    
    /**
     * 将反馈对象转换为 JSON 字符串
     */
    public static String feedbackToJson(Feedback feedback) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"id\":").append(feedback.getId()).append(",");
        json.append("\"category\":\"").append(escapeJson(feedback.getCategory())).append("\",");
        json.append("\"message\":\"").append(escapeJson(feedback.getMessage())).append("\",");
        json.append("\"contact\":\"").append(escapeJson(feedback.getContact())).append("\",");
        json.append("\"createTime\":\"").append(escapeJson(feedback.getCreateTimeStr())).append("\"");
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将公告列表转换为 JSON 数组
     */
    public static String announcementsToJson(List<Announcement> announcements) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < announcements.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(announcementToJson(announcements.get(i)));
        }
        json.append("]");
        return json.toString();
    }
    
    /**
     * 将公告对象转换为 JSON 字符串
     */
    public static String announcementToJson(Announcement announcement) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"id\":").append(announcement.getId()).append(",");
        json.append("\"title\":\"").append(escapeJson(announcement.getTitle())).append("\",");
        json.append("\"content\":\"").append(escapeJson(announcement.getContent())).append("\",");
        json.append("\"createTime\":\"").append(escapeJson(announcement.getCreateTime())).append("\",");
        json.append("\"updateTime\":\"").append(escapeJson(announcement.getUpdateTime())).append("\"");
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将操作日志列表转换为 JSON 数组
     */
    public static String operationLogsToJson(List<AdminOperationLog> logs) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < logs.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(operationLogToJson(logs.get(i)));
        }
        json.append("]");
        return json.toString();
    }
    
    /**
     * 将操作日志对象转换为 JSON 字符串
     */
    public static String operationLogToJson(AdminOperationLog log) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"id\":").append(log.getId()).append(",");
        json.append("\"username\":\"").append(escapeJson(log.getUsername())).append("\",");
        json.append("\"action\":\"").append(escapeJson(log.getAction())).append("\",");
        if (log.getMainWebsiteId() != null) {
            json.append("\"mainWebsiteId\":").append(log.getMainWebsiteId()).append(",");
        } else {
            json.append("\"mainWebsiteId\":null,");
        }
        json.append("\"mainWebsiteName\":\"").append(escapeJson(log.getMainWebsiteName())).append("\",");
        json.append("\"operationTime\":\"").append(escapeJson(log.getOperationTime())).append("\",");
        json.append("\"details\":\"").append(escapeJson(log.getDetails())).append("\"");
        json.append("}");
        return json.toString();
    }
    
    /**
     * 将网站入口列表转换为 JSON 数组
     */
    public static String websitesToJson(List<Website> websites) {
        StringBuilder json = new StringBuilder();
        json.append("[");
        for (int i = 0; i < websites.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(websiteToJson(websites.get(i)));
        }
        json.append("]");
        return json.toString();
    }
    
    /**
     * 将网站入口对象转换为 JSON 字符串
     */
    public static String websiteToJson(Website website) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"id\":").append(website.getId()).append(",");
        json.append("\"websiteName\":\"").append(escapeJson(website.getWebsiteName())).append("\",");
        json.append("\"wholeWebsite\":\"").append(escapeJson(website.getWholeWebsite())).append("\",");
        json.append("\"belongsTo\":").append(website.getBelongsTo());
        json.append("}");
        return json.toString();
    }
    
    /**
     * 转义 JSON 字符串中的特殊字符
     */
    private static String escapeJson(String str) {
        if (str == null) {
            return "";
        }
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }
}

