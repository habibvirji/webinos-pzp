var PzpID = function () {
    var PzpObject = this;
     /**
     * Changes friendly name of the PZP
     * @param {String} friendlyName_ - PZP friendly name intended to be changed
     */
    this.setFriendlyName = function(friendlyName_) {
        var friendlyName;
        if(friendlyName_) {
            friendlyName = friendlyName_;
        } else {
            var os = require("os");
            if (os.platform() && os.platform().toLowerCase() === "android" ){
                friendlyName = "Mobile";
            } else if (process.platform === "win32") {
                friendlyName = "Windows PC";
            } else if (process.platform === "darwin") {
                friendlyName = "MacBook";
            } else if (process.platform === "linux" || process.platform === "freebsd") {
                friendlyName = "Linux Device";
            } else {
                friendlyName = "Webinos Device";// Add manually
            }
        }
        return friendlyName;
    };

    /**
     * Sets webinos pzp sessionId
     */
    this.setSessionId = function (pzpState) {
        pzpState.sessionId = PzpObject.getMetaData("webinosName");
        if (PzpObject.getEnrolledStatus()) {
            pzpState.sessionId = PzpObject.getPzhId()+ "/" +pzpState.sessionId;
        }
    };
    /**
     * sets webinos application id
     * @param webAppName
     * @return {String}
     */
    this.setApplicationId = function(webAppName) {
        var appId, sessionId, newId;
        if (!webAppName) webAppName = require("crypto").randomBytes(3).toString("hex").toUpperCase();
        appId = require("crypto").createHash("md5").update(PzpObject.getSessionId() + webAppName).digest("hex");
        sessionId = Math.round(Math.random()*100);
        newId = (PzpObject.getSessionId()  + "/"+ appId +":" + sessionId)
        return newId;
    }
};

module.exports = PzpID;
