var Electron = require("electron");

Bridge.assembly("TwitterElectron", function ($asm, globals) {
    "use strict";

    Bridge.define("TwitterElectron.RendererProcess.MainForm", {
        main: function Main () {
            Electron.ipcRenderer.on("cmd-options-updated", $asm.$.TwitterElectron.RendererProcess.MainForm.f1);

            Electron.ipcRenderer.on("cmd-start-capture", $asm.$.TwitterElectron.RendererProcess.MainForm.f2);

            Electron.ipcRenderer.on("cmd-stop-capture", $asm.$.TwitterElectron.RendererProcess.MainForm.f3);

            Electron.ipcRenderer.on("cmd-clear-capture", $asm.$.TwitterElectron.RendererProcess.MainForm.f4);
        },
        statics: {
            fields: {
                Electron: null,
                _listener: null,
                _lastNotificationDate: null,
                _credentials: null
            },
            methods: {
                InitListener: function () {
                    if (TwitterElectron.RendererProcess.MainForm._credentials == null || System.String.isNullOrEmpty(TwitterElectron.RendererProcess.MainForm._credentials.ApiKey) || System.String.isNullOrEmpty(TwitterElectron.RendererProcess.MainForm._credentials.ApiSecret) || System.String.isNullOrEmpty(TwitterElectron.RendererProcess.MainForm._credentials.AccessToken) || System.String.isNullOrEmpty(TwitterElectron.RendererProcess.MainForm._credentials.AccessTokenSecret)) {
                        alert("Please specify API keys and Access tokens before starting.");
                        return null;
                    }

                    var listener = new TwitterElectron.RendererProcess.TwitterListener(TwitterElectron.RendererProcess.MainForm._credentials.ApiKey, TwitterElectron.RendererProcess.MainForm._credentials.ApiSecret, TwitterElectron.RendererProcess.MainForm._credentials.AccessToken, TwitterElectron.RendererProcess.MainForm._credentials.AccessTokenSecret);

                    listener.addOnReceived($asm.$.TwitterElectron.RendererProcess.MainForm.f5);

                    listener.addOnError(function (sender, err) {
                        listener.Stop();
                    });

                    return listener;
                },
                CreateNotification: function (tweet) {
                    var notifTitle = System.String.concat(tweet.user.name, " is tweeting..");

                    var notifOpts = { };
                    notifOpts.body = tweet.text;
                    notifOpts.icon = tweet.user.profile_image_url;

                    var notif = new Notification(notifTitle, notifOpts);
                    notif.onclick = function (notifEv) {
                        var tweetUrl = System.String.format("https://twitter.com/{0}/status/{1}", tweet.user.screen_name, tweet.id_str);
                        Electron.shell.openExternal(tweetUrl);
                        return null;
                    };
                },
                AddRecord: function (tweet) {
                    var div = Bridge.cast(document.createElement("div"), HTMLDivElement);

                    div.style.padding = "10px";
                    div.style.margin = "10px";
                    div.style.backgroundColor = "rgba(133, 181, 249, 0.33)";
                    div.style.border = "2px solid orange";
                    div.ondblclick = Bridge.fn.combine(div.ondblclick, function (e) {
                        var tweetUrl = System.String.format("https://twitter.com/{0}/status/{1}", tweet.user.screen_name, tweet.id_str);
                        Electron.shell.openExternal(tweetUrl);
                        return null;
                    });

                    var img = Bridge.cast(document.createElement("img"), HTMLImageElement);
                    img.width = 48;
                    img.height = 48;
                    img.src = tweet.user.profile_image_url;

                    var nameDiv = Bridge.cast(document.createElement("div"), HTMLDivElement);
                    nameDiv.style.marginTop = "-50px";
                    nameDiv.style.marginLeft = "60px";
                    nameDiv.style.fontStyle = "italic";
                    nameDiv.innerHTML = System.String.concat(tweet.user.name, " is tweeting..");

                    var textDiv = Bridge.cast(document.createElement("div"), HTMLDivElement);
                    textDiv.style.marginTop = "10px";
                    textDiv.style.marginLeft = "60px";
                    textDiv.innerHTML = tweet.text;

                    div.appendChild(img);
                    div.appendChild(nameDiv);
                    div.appendChild(textDiv);

                    var capturedItemsDiv = Bridge.cast(document.getElementById("capturedItemsDiv"), HTMLDivElement);
                    if (capturedItemsDiv.children.length >= 20) {
                        capturedItemsDiv.removeChild(capturedItemsDiv.children[19]);
                    }

                    if (capturedItemsDiv.children.length > 0) {
                        capturedItemsDiv.insertBefore(div, capturedItemsDiv.children[0]);
                    } else {
                        capturedItemsDiv.appendChild(div);
                    }
                }
            }
        }
    });

    Bridge.ns("TwitterElectron.RendererProcess.MainForm", $asm.$);

    Bridge.apply($asm.$.TwitterElectron.RendererProcess.MainForm, {
        f1: function (ev, cred) {
            TwitterElectron.RendererProcess.MainForm._credentials = cred;
        },
        f2: function () {
            TwitterElectron.RendererProcess.MainForm._listener = TwitterElectron.RendererProcess.MainForm.InitListener();

            if (TwitterElectron.RendererProcess.MainForm._listener != null) {
                var captureFilterInput = Bridge.cast(document.getElementById("captureFilterInput"), HTMLInputElement);
                TwitterElectron.RendererProcess.MainForm._listener.Filter = captureFilterInput.value;
                TwitterElectron.RendererProcess.MainForm._listener.Start();
            }
        },
        f3: function () {
            TwitterElectron.RendererProcess.MainForm._listener != null ? TwitterElectron.RendererProcess.MainForm._listener.Stop() : null;
        },
        f4: function () {
            var capturedItemsDiv = Bridge.cast(document.getElementById("capturedItemsDiv"), HTMLDivElement);
            capturedItemsDiv.innerHTML = "";
        },
        f5: function (sender, tweet) {
            TwitterElectron.RendererProcess.MainForm.AddRecord(tweet);

            // Notify:
            var notificationEnabledCheckbox = Bridge.cast(document.getElementById("notificationEnabledCheckbox"), HTMLInputElement);
            var notificationEnabled = notificationEnabledCheckbox.checked;
            if (notificationEnabled) {
                // Use 20 seconds buffer to not create too many notifications:
                if (Bridge.equals(TwitterElectron.RendererProcess.MainForm._lastNotificationDate, null) || (System.DateTime.subdd(System.DateTime.getUtcNow(), System.Nullable.getValue(TwitterElectron.RendererProcess.MainForm._lastNotificationDate))).getTotalSeconds() > 20) {
                    TwitterElectron.RendererProcess.MainForm._lastNotificationDate = System.DateTime.getUtcNow();
                    TwitterElectron.RendererProcess.MainForm.CreateNotification(tweet);
                }
            } else {
                TwitterElectron.RendererProcess.MainForm._lastNotificationDate = null;
            }
        }
    });
});