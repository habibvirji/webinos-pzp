/*******************************************************************************
 *  Code contributed to the webinos project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2012 - 2013 Samsung Electronics (UK) Ltd
 * AUTHORS: Habib Virji (habib.virji@samsung.com)
 *******************************************************************************/
/**
 * Connects with PZH and handle respective events
 */
var PzpConnectHub = function () {
    "use strict";
    var PzpCommon       = require("./pzp.js");
    var PzpObject = this;
    var logger = PzpCommon.wUtil.webinosLogging(__filename) || console;
    var pzpClient, failedConnecting = 0;
    var retryConnection;
    //This function will be called when PZH is disconnected and retries connection
    function retryConnecting () {
        if(!retryConnection) retryConnection= PzpObject.getMetaData("retryConnection");
        if (PzpObject.getEnrolledStatus()) {
            setTimeout (function () {
                if (failedConnecting === 2) {
                    retryConnection = retryConnection * 2;
                    console.log("double", retryConnection)
                    failedConnecting = 0;
                }
                failedConnecting = failedConnecting  + 1;
                logger.log ("Retrying to connect back to the PZH ");
                PzpObject.connectHub();
            }, retryConnection);//increase time limit to suggest when it should retry connecting back to the PZH
        }
    }

    //This function will be called when PZH is connected
    function connectionWithPzhChecker() {
        var succConnecting = 0;
        var id = setInterval(function(){
            var socket = PzpCommon.net.createConnection(PzpObject.getWebinosPorts("provider"),  PzpObject.getMetaData("serverName"));
            socket.setTimeout(10);
            socket.on('connect', function() {
                if (succConnecting === 2) {
                    retryConnection = retryConnection * 2;
                    succConnecting = 0;
                }
                succConnecting = succConnecting + 1;
                socket.end();
            });
            socket.on('error', function() { // Assuming this will happen as internet is not reachable
                logger.log("connection with pzh has been lost. Will try reconnecting back when PZH is available");
                pzpClient.socket.destroy();
                retryConnection = PzpObject.getMetaData("retryConnection");
                failedConnecting = succConnecting = 0;
                clearInterval(id)
            });
        },retryConnection);
    }
    /**
     *
     *
     */
    this.connectHub = function () {
        try {
            logger.log("connection towards pzh "+ PzpObject.getPzhId() +" initiated");
            var socket = PzpCommon.net.createConnection(PzpObject.getWebinosPorts("provider"),  PzpObject.getMetaData("serverName")); //Check if we are online..
            socket.setTimeout(10);
            socket.on('connect', function() {
                socket.end();
                logger.log("you are connected to the internet, now trying to connect to PZH");
                pzpClient = PzpCommon.tls.connect(PzpObject.getWebinosPorts("provider"),
                    PzpObject.getMetaData("serverName"),
                    PzpObject.setConnectionParameters(), function() {
                        if (pzpClient.authorized) {
                            PzpObject.handleAuthorization("hub", PzpObject.getPzhId(), pzpClient);
                            connectionWithPzhChecker();
                            PzpObject.emit("PZP_CONNECTED");
                        } else {
                            PzpObject.unAuthorized(pzpClient);
                        }
                    });


                pzpClient.on ("data", function (buffer) {
                    PzpObject.handleMsg(pzpClient, buffer);
                });

                pzpClient.on ("close", function (had_errors) {
                    if(had_errors) logger.log("socket connection failed due to transmission error");
                });

                pzpClient.on ("end", function() {
                    if (pzpClient.id) {
                        logger.log("connection end for "+ pzpClient.id);
                        PzpObject.socketCleanUp(pzpClient.id);
                    }
                    retryConnecting();
                });

                pzpClient.on ("error", function(err) {
                    PzpObject.emit("CONNECTION_FAILED", err);
                });
            });
            socket.on('error', function() { // Assuming this will happen as internet is not reachable
               logger.log("currently your PZH is offline.");
                retryConnecting();
            });
        } catch (err) {
            PzpObject.emit("EXCEPTION", new Error("Connecting Personal Zone Hub Failed - " + err))
        }
    }
};

//require("util").inherits(PzpConnectHub, PzpOtherManager);
module.exports = PzpConnectHub;
