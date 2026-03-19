package com.SmartNexus;

import java.time.LocalDateTime;

public class Feedback {
    private Long id;
    private String category;
    private String message;
    private String contact;
    private LocalDateTime createTime;

    public Feedback() {
    }

    public Feedback(String category, String message, String contact) {
        this.category = category;
        this.message = message;
        this.contact = contact;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public LocalDateTime getCreateTime() {
        return createTime;
    }

    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    // 用于JSON序列化的String类型createTime
    private String createTimeStr;
    
    public String getCreateTimeStr() {
        return createTimeStr;
    }
    
    public void setCreateTimeStr(String createTimeStr) {
        this.createTimeStr = createTimeStr;
    }
}




