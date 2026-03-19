package com.SmartNexus.controller;

import com.SmartNexus.Announcement;
import com.SmartNexus.AnnouncementService;
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
 * 公告控制器
 */
@RestController
@RequestMapping("/api")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    /**
     * 获取所有公告列表
     */
    @GetMapping("/announcements")
    public ResponseEntity<?> getAllAnnouncements() {
        try {
            List<Announcement> announcements = announcementService.getAllAnnouncements();
            String json = JsonUtil.announcementsToJson(announcements);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取公告列表失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 创建公告（管理员）
     */
    @PostMapping("/admin/announcements")
    public ResponseEntity<?> createAnnouncement(@RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String content = request.get("content");

            if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "标题和内容不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            announcementService.createAnnouncement(title, content);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "ok");
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "创建公告失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}
