package com.SmartNexus;

/**
 * 主网站实体类
 */
public class MainWebsite {
    private Long id;
    private String name;
    private String type;
    private String status;
    private String website;
    private String description;
    
    public MainWebsite() {
    }
    
    public MainWebsite(Long id, String name, String type, String status, String website, String description) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.website = website;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}


