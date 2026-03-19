package com.SmartNexus.controller;

import com.SmartNexus.AuthService;
import com.SmartNexus.JsonUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 * 处理登录和注册
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");

            if (username == null || password == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户名和密码不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            boolean ok = authService.authenticate(username, password);
            if (ok) {
                AuthService.UserInfo userInfo = authService.getUserInfo(username);
                if (userInfo != null) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", "ok");
                    response.put("role", userInfo.role);
                    response.put("user", userInfo);
                    return ResponseEntity.ok(response);
                } else {
                    Map<String, String> response = new HashMap<>();
                    response.put("status", "ok");
                    response.put("role", "USER");
                    return ResponseEntity.ok(response);
                }
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户名或密码错误");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "登录失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");

            if (username == null || password == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户名和密码不能为空");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (username.length() < 3) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "用户名长度至少为3位");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            if (password.length() < 6) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "密码长度至少为6位");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            boolean success = authService.register(username, password);
            if (success) {
                Map<String, String> response = new HashMap<>();
                response.put("status", "ok");
                response.put("message", "注册成功");
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "该用户已存在，请更换用户名");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "注册失败");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

