package com.SmartNexus.controller;

import com.SmartNexus.*;
import com.SmartNexus.JsonUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 * 处理管理员相关的 API（统计数据、主网站管理、操作日志等）
 */
@RestController
@RequestMapping("/api")
public class AdminController {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private AdminLogService adminLogService;

    @Autowired
    private MainWebsiteService mainWebsiteService;

    /**
     * 获取管理员统计数据
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = userProfileService.getStatistics();
            
            // 构建JSON响应（与WebServer中的实现保持一致）
            StringBuilder json = new StringBuilder("{");
            json.append("\"totalUsers\":").append(stats.getOrDefault("totalUsers", 0)).append(",");
            json.append("\"adminUsers\":").append(stats.getOrDefault("adminUsers", 0)).append(",");
            json.append("\"normalUsers\":").append(stats.getOrDefault("normalUsers", 0)).append(",");
            json.append("\"totalSearches\":").append(stats.getOrDefault("totalSearches", 0)).append(",");
            json.append("\"totalClicks\":").append(stats.getOrDefault("totalClicks", 0)).append(",");
            json.append("\"officialClicks\":").append(stats.getOrDefault("officialClicks", 0)).append(",");
            json.append("\"entryClicks\":").append(stats.getOrDefault("entryClicks", 0)).append(",");
            json.append("\"concernClicks\":").append(stats.getOrDefault("concernClicks", 0)).append(",");
            json.append("\"totalMainWebsites\":").append(stats.getOrDefault("totalMainWebsites", 0)).append(",");
            
            // 热门搜索
            json.append("\"popularSearches\":[");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> popularSearches = (List<Map<String, Object>>) stats.get("popularSearches");
            if (popularSearches != null) {
                for (int i = 0; i < popularSearches.size(); i++) {
                    Map<String, Object> item = popularSearches.get(i);
                    if (i > 0) json.append(",");
                    json.append("{");
                    json.append("\"keyword\":\"").append(escapeJson(item.get("keyword").toString())).append("\",");
                    json.append("\"count\":").append(item.get("count"));
                    json.append("}");
                }
            }
            json.append("],");
            
            // 官方网站访问排行
            json.append("\"officialUrlRanking\":[");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> officialUrlRanking = (List<Map<String, Object>>) stats.get("officialUrlRanking");
            if (officialUrlRanking != null) {
                for (int i = 0; i < officialUrlRanking.size(); i++) {
                    Map<String, Object> item = officialUrlRanking.get(i);
                    if (i > 0) json.append(",");
                    json.append("{");
                    json.append("\"url\":\"").append(escapeJson(item.get("url").toString())).append("\",");
                    json.append("\"count\":").append(item.get("count"));
                    if (item.get("mainWebsiteName") != null) {
                        json.append(",\"mainWebsiteName\":\"").append(escapeJson(item.get("mainWebsiteName").toString())).append("\"");
                    }
                    json.append("}");
                }
            }
            json.append("],");
            
            // 入口网站访问排行
            json.append("\"entryUrlRanking\":[");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entryUrlRanking = (List<Map<String, Object>>) stats.get("entryUrlRanking");
            if (entryUrlRanking != null) {
                for (int i = 0; i < entryUrlRanking.size(); i++) {
                    Map<String, Object> item = entryUrlRanking.get(i);
                    if (i > 0) json.append(",");
                    json.append("{");
                    json.append("\"url\":\"").append(escapeJson(item.get("url").toString())).append("\",");
                    json.append("\"count\":").append(item.get("count"));
                    if (item.get("mainWebsiteName") != null) {
                        json.append(",\"mainWebsiteName\":\"").append(escapeJson(item.get("mainWebsiteName").toString())).append("\"");
                    }
                    if (item.get("entryName") != null) {
                        json.append(",\"entryName\":\"").append(escapeJson(item.get("entryName").toString())).append("\"");
                    }
                    json.append("}");
                }
            }
            json.append("],");
            
            // 用户活跃度趋势
            json.append("\"activityTrend\":[");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> activityTrend = (List<Map<String, Object>>) stats.get("activityTrend");
            if (activityTrend != null) {
                for (int i = 0; i < activityTrend.size(); i++) {
                    Map<String, Object> item = activityTrend.get(i);
                    if (i > 0) json.append(",");
                    json.append("{");
                    json.append("\"date\":\"").append(item.get("date").toString()).append("\",");
                    json.append("\"searchCount\":").append(item.get("searchCount"));
                    json.append(",\"clickCount\":").append(item.get("clickCount"));
                    json.append("}");
                }
            }
            json.append("],");
            
            // 主网站类型排行
            json.append("\"mainWebsiteTypeRanking\":[");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> mainWebsiteTypeRanking = (List<Map<String, Object>>) stats.get("mainWebsiteTypeRanking");
            if (mainWebsiteTypeRanking != null) {
                for (int i = 0; i < mainWebsiteTypeRanking.size(); i++) {
                    Map<String, Object> item = mainWebsiteTypeRanking.get(i);
                    if (i > 0) json.append(",");
                    json.append("{");
                    json.append("\"type\":\"").append(escapeJson(item.get("type").toString())).append("\",");
                    json.append("\"count\":").append(item.get("count"));
                    json.append("}");
                }
            }
            json.append("]");
            json.append("}");
            
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 获取操作日志列表
     */
    @GetMapping("/operation-logs")
    public ResponseEntity<?> getOperationLogs() {
        try {
            List<AdminOperationLog> logs = adminLogService.getAllOperationLogs();
            String json = JsonUtil.operationLogsToJson(logs);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取操作日志失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 管理员主网站管理 - 创建
     */
    @PostMapping("/admin/main-websites")
    public ResponseEntity<?> createMainWebsite(@RequestParam Map<String, String> params) {
        try {
            MainWebsite mainWebsite = buildMainWebsiteFromParams(params);
            
            // 检查同名主网站
            String mainWebsiteName = mainWebsite.getName();
            if (mainWebsiteName != null && !mainWebsiteName.trim().isEmpty()) {
                Map<String, Object> existingMainWebsiteInfo = mainWebsiteService.findMainWebsiteByNameWithDeleted(mainWebsiteName);
                if (existingMainWebsiteInfo != null) {
                    MainWebsite existingMainWebsite = (MainWebsite) existingMainWebsiteInfo.get("mainWebsite");
                    int deleted = (Integer) existingMainWebsiteInfo.get("deleted");
                    
                    if (deleted == 0) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "该主网站已存在，不可新建同名主网站");
                        error.put("code", "DUPLICATE");
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                    } else if (deleted == 1) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "restore");
                        response.put("id", existingMainWebsite.getId());
                        response.put("message", "该主网站已被删除，是否还原？");
                        return ResponseEntity.ok(response);
                    }
                }
            }
            
            // 创建主网站
            Long newMainWebsiteId = mainWebsiteService.addMainWebsite(mainWebsite);
            
            // 记录操作日志
            try {
                String details = buildMainWebsiteDetailsJson(mainWebsite);
                String name = mainWebsite.getName() != null ? mainWebsite.getName() : "未知";
                adminLogService.logOperation("admin", "CREATE", newMainWebsiteId, name, details);
            } catch (Exception logError) {
                System.err.println("记录操作日志失败: " + logError.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("id", newMainWebsiteId);
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "操作失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * 管理员主网站管理 - 更新
     */
    @PutMapping("/admin/main-websites")
    public ResponseEntity<?> updateMainWebsite(@RequestParam Long id, @RequestParam Map<String, String> params) {
        try {
            // 获取更新前的主网站信息
            MainWebsite oldMainWebsite = mainWebsiteService.getMainWebsiteById(id);
            
            MainWebsite mainWebsite = buildMainWebsiteFromParams(params);
            mainWebsite.setId(id);
            
            // 检查同名主网站（排除当前主网站）
            String mainWebsiteName = mainWebsite.getName();
            if (mainWebsiteName != null && !mainWebsiteName.trim().isEmpty()) {
                Map<String, Object> existingMainWebsiteInfo = mainWebsiteService.findMainWebsiteByNameWithDeletedExcludingId(mainWebsiteName, id);
                if (existingMainWebsiteInfo != null) {
                    MainWebsite existingMainWebsite = (MainWebsite) existingMainWebsiteInfo.get("mainWebsite");
                    int deleted = (Integer) existingMainWebsiteInfo.get("deleted");
                    
                    if (deleted == 0) {
                        Map<String, String> error = new HashMap<>();
                        error.put("error", "该主网站已存在，不可新建同名主网站");
                        error.put("code", "DUPLICATE");
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
                    } else if (deleted == 1) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("status", "restore");
                        response.put("id", existingMainWebsite.getId());
                        response.put("message", "该主网站已被删除，是否还原？");
                        return ResponseEntity.ok(response);
                    }
                }
            }
            
            // 更新主网站
            mainWebsiteService.updateMainWebsite(mainWebsite);
            
            // 记录操作日志
            try {
                String details = buildUpdateDetailsJson(oldMainWebsite, mainWebsite);
                String name = mainWebsiteName != null ? mainWebsiteName : "未知";
                adminLogService.logOperation("admin", "UPDATE", id, name, details);
            } catch (Exception logError) {
                System.err.println("记录操作日志失败: " + logError.getMessage());
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "ok");
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "操作失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * 管理员主网站管理 - 删除
     */
    @DeleteMapping("/admin/main-websites")
    public ResponseEntity<?> deleteMainWebsite(@RequestParam Long id) {
        try {
            // 获取删除前的主网站信息
            MainWebsite mainWebsite = mainWebsiteService.getMainWebsiteById(id);
            String mainWebsiteName = mainWebsite != null ? mainWebsite.getName() : "未知";
            String details = mainWebsite != null ? buildMainWebsiteDetailsJson(mainWebsite) : "{}";
            
            // 删除主网站
            mainWebsiteService.deleteMainWebsite(id);
            
            // 记录操作日志
            try {
                adminLogService.logOperation("admin", "DELETE", id, mainWebsiteName, details);
            } catch (Exception logError) {
                System.err.println("记录操作日志失败: " + logError.getMessage());
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "ok");
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "操作失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * 还原主网站
     */
    @PostMapping("/admin/main-websites/restore")
    public ResponseEntity<?> restoreMainWebsite(@RequestBody Map<String, Object> request) {
        try {
            Object idObj = request.get("id");
            Long mainWebsiteId = idObj instanceof Number ? ((Number) idObj).longValue() : Long.parseLong(idObj.toString());
            
            // 还原主网站
            mainWebsiteService.restoreMainWebsite(mainWebsiteId);
            
            // 记录操作日志
            try {
                MainWebsite mainWebsite = mainWebsiteService.getMainWebsiteByIdWithDeleted(mainWebsiteId);
                String mainWebsiteName = mainWebsite != null ? mainWebsite.getName() : "未知";
                adminLogService.logOperation("admin", "RESTORE", mainWebsiteId, mainWebsiteName, "{\"action\":\"restore\"}");
            } catch (Exception logError) {
                System.err.println("记录操作日志失败: " + logError.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("id", mainWebsiteId);
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "还原失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * 从参数构建 MainWebsite 对象
     */
    private MainWebsite buildMainWebsiteFromParams(Map<String, String> params) {
        MainWebsite mainWebsite = new MainWebsite();
        mainWebsite.setName(params.getOrDefault("name", ""));
        mainWebsite.setType(params.get("type"));
        mainWebsite.setStatus(params.get("status"));
        mainWebsite.setWebsite(params.get("website"));
        mainWebsite.setDescription(params.get("description"));
        return mainWebsite;
    }

    /**
     * 构建主网站详情的JSON字符串
     */
    private String buildMainWebsiteDetailsJson(MainWebsite mainWebsite) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"name\":\"").append(escapeJson(mainWebsite.getName())).append("\",");
        json.append("\"type\":\"").append(escapeJson(mainWebsite.getType())).append("\",");
        json.append("\"status\":\"").append(escapeJson(mainWebsite.getStatus())).append("\",");
        json.append("\"description\":\"").append(escapeJson(mainWebsite.getDescription())).append("\"");
        json.append("}");
        return json.toString();
    }

    /**
     * 构建更新详情的JSON字符串
     */
    private String buildUpdateDetailsJson(MainWebsite oldMainWebsite, MainWebsite newMainWebsite) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        json.append("\"old\":").append(buildMainWebsiteDetailsJson(oldMainWebsite != null ? oldMainWebsite : new MainWebsite())).append(",");
        json.append("\"new\":").append(buildMainWebsiteDetailsJson(newMainWebsite));
        json.append("}");
        return json.toString();
    }

    /**
     * 转义 JSON 字符串中的特殊字符
     */
    private String escapeJson(String str) {
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
