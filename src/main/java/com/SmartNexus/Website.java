package com.SmartNexus;

/**
 * 网站入口实体类
 */
public class Website {
    private Long id;
    private String websiteName;
    private String wholeWebsite;
    private Long belongsTo;
    
    public Website() {
    }
    
    public Website(Long id, String websiteName, String wholeWebsite, Long belongsTo) {
        this.id = id;
        this.websiteName = websiteName;
        this.wholeWebsite = wholeWebsite;
        this.belongsTo = belongsTo;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getWebsiteName() {
        return websiteName;
    }
    
    public void setWebsiteName(String websiteName) {
        this.websiteName = websiteName;
    }
    
    public String getWholeWebsite() {
        return wholeWebsite;
    }
    
    public void setWholeWebsite(String wholeWebsite) {
        this.wholeWebsite = wholeWebsite;
    }
    
    public Long getBelongsTo() {
        return belongsTo;
    }
    
    public void setBelongsTo(Long belongsTo) {
        this.belongsTo = belongsTo;
    }
}




