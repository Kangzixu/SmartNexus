package com.SmartNexus.controller;

import com.SmartNexus.AuthService;
import com.SmartNexus.DatabaseUtil;
import com.SmartNexus.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户相关控制器
 * 处理用户关心、收藏夹、历史记录等
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserProfileService userProfileService;

    /**
     * 获取用户关心列表
     */
    @GetMapping("/concern")
    public ResponseEntity<?> getUserConcern(@RequestParam String username) {
        try {
            if (username == null || username.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户名不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            AuthService.UserInfo userInfo = authService.getUserInfo(username);
            if (userInfo == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            // 从 my_care 表获取用户关心主网站ID列表（deleted=0）
            Connection conn = null;
            PreparedStatement pstmt = null;
            ResultSet rs = null;
            try {
                conn = DatabaseUtil.getConnection();
                String sql = "SELECT care_id FROM my_care WHERE user_id = ? AND deleted = 0";
                pstmt = conn.prepareStatement(sql);
                pstmt.setLong(1, userInfo.id);
                rs = pstmt.executeQuery();

                StringBuilder careIds = new StringBuilder();
                careIds.append("[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) {
                        careIds.append(",");
                    }
                    careIds.append(rs.getLong("care_id"));
                    first = false;
                }
                careIds.append("]");

                String response = String.format("{\"careIds\":%s}", careIds.toString());
                return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(response);
            } finally {
                if (rs != null) {
                    try { rs.close(); } catch (SQLException ignored) {}
                }
                if (pstmt != null) {
                    try { pstmt.close(); } catch (SQLException ignored) {}
                }
                DatabaseUtil.closeConnection(conn);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 关心/取消关心网站
     */
    @PostMapping("/care")
    public ResponseEntity<?> toggleCare(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String mainWebsiteIdStr = request.get("mainWebsiteId");
            String careStr = request.get("care");

            if (username == null || username.isEmpty() || mainWebsiteIdStr == null || careStr == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            long mainWebsiteId;
            try {
                mainWebsiteId = Long.parseLong(mainWebsiteIdStr);
            } catch (NumberFormatException e) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "主网站ID格式错误");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            boolean care = "true".equalsIgnoreCase(careStr);

            // 获取用户信息
            AuthService.UserInfo userInfo = authService.getUserInfo(username);
            if (userInfo == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户不存在");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            Connection conn = null;
            PreparedStatement pstmt = null;
            try {
                conn = DatabaseUtil.getConnection();

                if (care) {
                    // 关心：插入或更新 deleted=0
                    String sql = "INSERT INTO my_care (user_id, care_id, deleted) VALUES (?, ?, 0) " +
                               "ON DUPLICATE KEY UPDATE deleted = 0";
                    pstmt = conn.prepareStatement(sql);
                    pstmt.setLong(1, userInfo.id);
                    pstmt.setLong(2, mainWebsiteId);
                    pstmt.executeUpdate();
                } else {
                    // 取消关心：更新 deleted=1
                    String sql = "UPDATE my_care SET deleted = 1 WHERE user_id = ? AND care_id = ?";
                    pstmt = conn.prepareStatement(sql);
                    pstmt.setLong(1, userInfo.id);
                    pstmt.setLong(2, mainWebsiteId);
                    int updated = pstmt.executeUpdate();
                    // 如果记录不存在，插入一条 deleted=1 的记录
                    if (updated == 0) {
                        pstmt.close();
                        sql = "INSERT INTO my_care (user_id, care_id, deleted) VALUES (?, ?, 1)";
                        pstmt = conn.prepareStatement(sql);
                        pstmt.setLong(1, userInfo.id);
                        pstmt.setLong(2, mainWebsiteId);
                        pstmt.executeUpdate();
                    }
                }

                Map<String, String> response = new HashMap<>();
                response.put("status", "ok");
                return ResponseEntity.ok(response);
            } finally {
                if (pstmt != null) {
                    try { pstmt.close(); } catch (SQLException ignored) {}
                }
                DatabaseUtil.closeConnection(conn);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "操作失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 记录用户搜索日志
     */
    @PostMapping("/search-log")
    public ResponseEntity<?> logSearch(@RequestBody Map<String, Object> request) {
        try {
            Object userIdObj = request.get("userId");
            String keyword = (String) request.get("searchKeyword");

            if (userIdObj == null || keyword == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Long userId = userIdObj instanceof Number ? ((Number) userIdObj).longValue() : Long.parseLong(userIdObj.toString());
            boolean success = userProfileService.logUserSearch(userId, keyword);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", success ? "ok" : "error");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "记录失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 记录用户点击日志
     */
    @PostMapping("/click-log")
    public ResponseEntity<?> logClick(@RequestBody Map<String, Object> request) {
        try {
            Object userIdObj = request.get("userId");
            String url = (String) request.get("url");
            String urlType = (String) request.get("urlType");
            Object mainWebsiteIdObj = request.get("mainWebsiteId");

            if (userIdObj == null || url == null || urlType == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Long userId = userIdObj instanceof Number ? ((Number) userIdObj).longValue() : Long.parseLong(userIdObj.toString());
            Long mainWebsiteId = null;
            if (mainWebsiteIdObj != null && !mainWebsiteIdObj.toString().equals("null")) {
                mainWebsiteId = mainWebsiteIdObj instanceof Number ? ((Number) mainWebsiteIdObj).longValue() : Long.parseLong(mainWebsiteIdObj.toString());
            }
            
            boolean success = userProfileService.logUserClick(userId, url, urlType, mainWebsiteId);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", success ? "ok" : "error");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "记录失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 获取用户搜索历史
     */
    @GetMapping("/history/search")
    public ResponseEntity<?> getSearchHistory(@RequestParam Long userId) {
        try {
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户ID不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            List<Map<String, Object>> searches = userProfileService.getUserSearchHistory(userId);
            
            // 构建JSON响应（与WebServer中的实现保持一致）
            StringBuilder json = new StringBuilder("{\"searches\":[");
            for (int i = 0; i < searches.size(); i++) {
                Map<String, Object> item = searches.get(i);
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"searchKeyword\":\"").append(escapeJson(item.get("searchKeyword").toString())).append("\",");
                json.append("\"searchTime\":\"").append(item.get("searchTime").toString()).append("\"");
                json.append("}");
            }
            json.append("]}");
            
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 获取用户点击历史
     */
    @GetMapping("/history/click")
    public ResponseEntity<?> getClickHistory(@RequestParam Long userId) {
        try {
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户ID不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            List<Map<String, Object>> clicks = userProfileService.getUserClickHistory(userId);
            
            // 构建JSON响应（与WebServer中的实现保持一致）
            StringBuilder json = new StringBuilder("{\"clicks\":[");
            for (int i = 0; i < clicks.size(); i++) {
                Map<String, Object> item = clicks.get(i);
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"url\":\"").append(escapeJson(item.get("url").toString())).append("\",");
                json.append("\"urlType\":\"").append(item.get("urlType").toString()).append("\",");
                json.append("\"clickTime\":\"").append(item.get("clickTime").toString()).append("\"");
                json.append("}");
            }
            json.append("]}");
            
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 云收藏夹相关API
     */
    @GetMapping("/bookmarks")
    public ResponseEntity<?> getBookmarks(@RequestParam Long userId) {
        try {
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户ID不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            List<Map<String, Object>> websites = userProfileService.getUserDefinedWebsites(userId);
            
            // 构建JSON响应（与WebServer中的实现保持一致）
            StringBuilder json = new StringBuilder("{\"websites\":[");
            for (int i = 0; i < websites.size(); i++) {
                Map<String, Object> item = websites.get(i);
                if (i > 0) json.append(",");
                json.append("{");
                json.append("\"id\":").append(item.get("id")).append(",");
                json.append("\"websiteName\":\"").append(escapeJson(item.get("websiteName").toString())).append("\",");
                json.append("\"website\":\"").append(escapeJson(item.get("website").toString())).append("\",");
                json.append("\"createTime\":\"").append(item.get("createTime").toString()).append("\",");
                json.append("\"updateTime\":\"").append(item.get("updateTime").toString()).append("\"");
                json.append("}");
            }
            json.append("]}");
            
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json.toString());
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/bookmarks")
    public ResponseEntity<?> addBookmark(@RequestParam Long userId, @RequestBody Map<String, String> request) {
        try {
            String websiteName = request.get("websiteName");
            String website = request.get("website");

            if (userId == null || websiteName == null || website == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            boolean success = userProfileService.createUserDefinedWebsite(userId, websiteName, website);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", success ? "ok" : "error");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "添加失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/bookmarks")
    public ResponseEntity<?> updateBookmark(@RequestParam Long userId, @RequestBody Map<String, Object> request) {
        try {
            Object idObj = request.get("id");
            String websiteName = (String) request.get("websiteName");
            String website = (String) request.get("website");

            if (userId == null || idObj == null || websiteName == null || website == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            Long id = idObj instanceof Number ? ((Number) idObj).longValue() : Long.parseLong(idObj.toString());
            boolean success = userProfileService.updateUserDefinedWebsite(userId, id, websiteName, website);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", success ? "ok" : "error");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "更新失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/bookmarks")
    public ResponseEntity<?> deleteBookmark(@RequestParam Long userId, @RequestParam Long id) {
        try {
            if (userId == null || id == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "参数不完整");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            boolean success = userProfileService.deleteUserDefinedWebsite(userId, id);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", success ? "ok" : "error");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "删除失败");
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
