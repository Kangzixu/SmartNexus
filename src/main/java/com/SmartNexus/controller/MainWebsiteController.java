package com.SmartNexus.controller;

import com.SmartNexus.MainWebsite;
import com.SmartNexus.MainWebsiteService;
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
 * 主网站控制器
 */
@RestController
@RequestMapping("/api/main-websites")
public class MainWebsiteController {

    @Autowired
    private MainWebsiteService mainWebsiteService;

    /**
     * 获取所有主网站列表
     */
    @GetMapping
    public ResponseEntity<?> getAllMainWebsites() {
        try {
            List<MainWebsite> mainWebsites = mainWebsiteService.getAllMainWebsites();
            String json = JsonUtil.mainWebsitesToJson(mainWebsites);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "数据库查询失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 获取统计数据
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = mainWebsiteService.getStatistics();
            String json = JsonUtil.statisticsToJson(stats);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "数据库查询失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 按区域获取主网站信息
     */
    @GetMapping("/by-area")
    public ResponseEntity<?> getMainWebsitesByArea() {
        try {
            Map<String, List<MainWebsite>> areaMainWebsites = mainWebsiteService.getMainWebsitesByArea();
            String json = JsonUtil.areaMainWebsitesToJson(areaMainWebsites);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "数据库查询失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 获取区域统计信息
     */
    @GetMapping("/area-statistics")
    public ResponseEntity<?> getAreaStatistics() {
        try {
            Map<String, Map<String, Object>> areaStats = mainWebsiteService.getAreaStatistics();
            String json = JsonUtil.areaStatisticsToJson(areaStats);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "数据库查询失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

