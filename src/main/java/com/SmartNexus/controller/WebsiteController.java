package com.SmartNexus.controller;

import com.SmartNexus.JsonUtil;
import com.SmartNexus.Website;
import com.SmartNexus.WebsiteService;
import com.SmartNexus.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 网站入口管理控制器
 */
@RestController
@RequestMapping("/api/websites")
public class WebsiteController {

    @Autowired
    private WebsiteService websiteService;

    @Autowired
    private UserProfileService userProfileService;

    /**
     * 获取网站入口列表
     */
    @GetMapping
    public ResponseEntity<?> getWebsites(@RequestParam(required = false) Long mainWebsiteId) {
        try {
            List<Website> websites;
            if (mainWebsiteId != null) {
                websites = websiteService.getWebsitesByMainWebsiteId(mainWebsiteId);
            } else {
                websites = websiteService.getAllWebsites();
            }
            String json = JsonUtil.websitesToJson(websites);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
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
     * 添加网站入口
     */
    @PostMapping
    public ResponseEntity<?> addWebsite(@RequestBody Map<String, String> request) {
        try {
            String websiteName = request.get("websiteName");
            String wholeWebsite = request.get("wholeWebsite");
            String belongsToStr = request.get("belongsTo");

            if (websiteName == null || wholeWebsite == null || belongsToStr == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "缺少必要参数");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Long belongsTo = Long.parseLong(belongsToStr);
            Long newId = websiteService.addWebsite(websiteName, wholeWebsite, belongsTo);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ok");
            response.put("id", newId);
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
     * 更新网站入口
     */
    @PutMapping
    public ResponseEntity<?> updateWebsite(@RequestParam Long id, @RequestBody Map<String, String> request) {
        try {
            String websiteName = request.get("websiteName");
            String wholeWebsite = request.get("wholeWebsite");

            if (websiteName == null || wholeWebsite == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "缺少网站名称或网址");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            websiteService.updateWebsite(id, websiteName, wholeWebsite);
            
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
     * 删除网站入口
     */
    @DeleteMapping
    public ResponseEntity<?> deleteWebsite(@RequestParam Long id) {
        try {
            websiteService.deleteWebsite(id);
            
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
     * 获取网站热度推荐榜
     */
    @GetMapping("/top")
    public ResponseEntity<?> getTopWebsites(@RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            List<Map<String, Object>> topWebsites = userProfileService.getTopWebsites(limit);
            
            // 构建JSON响应（与WebServer中的实现保持一致）
            StringBuilder json = new StringBuilder("{\"websites\":[");
            for (int i = 0; i < topWebsites.size(); i++) {
                Map<String, Object> item = topWebsites.get(i);
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"url\":\"").append(escapeJson(item.get("url").toString())).append("\",");
                json.append("\"count\":").append(item.get("count"));
                
                // 添加urlType
                if (item.containsKey("urlType")) {
                    json.append(",\"urlType\":\"").append(escapeJson(item.get("urlType").toString())).append("\"");
                }
                
                // 添加mainWebsiteName
                if (item.containsKey("mainWebsiteName")) {
                    json.append(",\"mainWebsiteName\":\"").append(escapeJson(item.get("mainWebsiteName").toString())).append("\"");
                }
                
                // 添加entryName
                if (item.containsKey("entryName")) {
                    json.append(",\"entryName\":\"").append(escapeJson(item.get("entryName").toString())).append("\"");
                }
                
                json.append("}");
            }
            json.append("]}");
            
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取失败: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
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
