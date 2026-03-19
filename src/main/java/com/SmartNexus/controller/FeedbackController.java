package com.SmartNexus.controller;

import com.SmartNexus.Feedback;
import com.SmartNexus.FeedbackService;
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
 * 反馈控制器
 */
@RestController
@RequestMapping("/api")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    /**
     * 提交反馈
     */
    @PostMapping("/feedback")
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, String> request) {
        try {
            String category = request.get("category");
            String message = request.get("message");
            String contact = request.get("contact");

            if (category == null || category.isEmpty() || message == null || message.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "分类和内容不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            feedbackService.saveFeedback(category, message, contact);
            
            Map<String, String> response = new HashMap<>();
            response.put("status", "ok");
            return ResponseEntity.ok(response);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "保存反馈失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "请求格式错误");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * 获取所有反馈列表（管理员）
     */
    @GetMapping("/feedbacks")
    public ResponseEntity<?> getAllFeedbacks() {
        try {
            List<Feedback> feedbacks = feedbackService.getAllFeedbacks();
            String json = JsonUtil.feedbacksToJson(feedbacks);
            return ResponseEntity.ok().header("Content-Type", "application/json; charset=utf-8").body(json);
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "获取反馈列表失败: " + (e.getMessage() != null ? e.getMessage() : "未知SQL错误"));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "服务器错误: " + (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
