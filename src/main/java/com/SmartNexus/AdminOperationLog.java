package com.SmartNexus;

/**
 * 管理员操作日志实体类
 */
public class AdminOperationLog {
    private Long id;
    private String username;
    private String action;
    private Long mainWebsiteId;
    private String mainWebsiteName;
    private String operationTime;
    private String details;

    public AdminOperationLog() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Long getMainWebsiteId() {
        return mainWebsiteId;
    }
    
    public void setMainWebsiteId(Long mainWebsiteId) {
        this.mainWebsiteId = mainWebsiteId;
    }
    
    public String getMainWebsiteName() {
        return mainWebsiteName;
    }
    
    public void setMainWebsiteName(String mainWebsiteName) {
        this.mainWebsiteName = mainWebsiteName;
    }

    public String getOperationTime() {
        return operationTime;
    }

    public void setOperationTime(String operationTime) {
        this.operationTime = operationTime;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}









