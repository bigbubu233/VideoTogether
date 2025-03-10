// ==UserScript==
// @name         Video Together 一起看视频
// @namespace    https://videotogether.github.io/
// @version      1739015268
// @description  Watch video together 一起看视频
// @author       maggch@outlook.com
// @match        *://*/*
// @icon         https://videotogether.github.io/icon/favicon-32x32.png
// @grant        GM.xmlHttpRequest
// @grant        GM_addElement
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.getTab
// @grant        GM.saveTab
// @connect      2gether.video
// @connect      api.2gether.video
// @connect      api.xn--6kr25xemln66b.com
// @connect      api.panghair.com
// @connect      vt.panghair.com
// @connect      raw.githubusercontent.com
// @connect      fastly.jsdelivr.net
// @connect      videotogether.oss-cn-hangzhou.aliyuncs.com
// ==/UserScript==

(async function () {
    let isDevelopment = false;

    if(document instanceof XMLDocument){
        return;
    }

    let version = '1739015268'
    let type = 'website'
    function getBrowser() {
        switch (type) {
            case 'Safari':
                return browser;
            case 'Chrome':
            case 'Firefox':
                return chrome;
        }
    }
    let isExtension = (type == "Chrome" || type == "Safari" || type == "Firefox");
    let isWebsite = (type == "website" || type == "website_debug");
    let isUserscript = (type == "userscript");
    let websiteGM = {};
    let extensionGM = {};
    const encodedChinaCdnA = 'aHR0cHM6Ly92aWRlb3RvZ2V0aGVyLm9zcy1jbi1oYW5nemhvdS5hbGl5dW5jcy5jb20='
    const encodeFastlyJsdelivrCdn = 'aHR0cHM6Ly9mYXN0bHkuanNkZWxpdnIubmV0L2doL1ZpZGVvVG9nZXRoZXIvVmlkZW9Ub2dldGhlckBsYXRlc3Q='
    function getCdnPath(encodedCdn, path) {
        const cdn = encodedCdn.startsWith('https') ? encodedCdn : atob(encodedCdn);
        return `${cdn}/${path}`;
    }
    async function getCdnConfig(encodedCdn) {
        return fetch(getCdnPath(encodedCdn, 'release/cdn-config.json')).then(r => r.json())
    }
    async function getChinaCdnB() {
        return getCdnConfig(encodedChinaCdnA).then(c => c.jsCdnHostChina)
    }

    function getGM() {
        if (type == "website" || type == "website_debug") {
            return websiteGM;
        }
        if (type == "Chrome" || type == "Safari" || type == "Firefox") {
            return extensionGM;
        }
        return GM;
    }

    function getRealTableName(table) {
        return table.replace('-mini', '');
    }

    setInterval(() => {
        if (isWebsite) {
            (function () {
                const iframes = document.getElementsByTagName('iframe');
                for (const iframe of iframes) {
                    try {
                        if (iframe.contentWindow.VideoTogetherParentInject != true &&
                            window.location.origin === iframe.contentWindow.location.origin) {
                            console.log("inject to iframe");
                            const script = document.createElement('script');
                            script.src = getCdnPath(encodeFastlyJsdelivrCdn, "release/extension.website.user.js");
                            iframe.contentWindow.document.body.appendChild(script);
                            iframe.contentWindow.VideoTogetherParentInject = true;
                        }
                    } catch (error) {
                    }
                }
            })();
        }
    }, 2000);

    if (type == "website" || type == "website_debug") {

        getGM().setValue = async (key, value) => {
            return localStorage.setItem(key, JSON.stringify(value));
        }

        getGM().getValue = async (key) => {
            return JSON.parse(localStorage.getItem(key));
        }

        getGM().getTab = async () => {
            let tab = sessionStorage.getItem('VideoTogetherTab');
            return tab == null ? {} : JSON.parse(tab);
        }

        getGM().saveTab = async (tab) => {
            return sessionStorage.setItem('VideoTogetherTab', JSON.stringify(tab));
        }

        getGM().xmlHttpRequest = async (props) => {
            try {
                fetch(props.url, {
                    method: props.method,
                    body: props.method == "GET" ? undefined : JSON.stringify(props.data)
                })
                    .then(r => r.text())
                    .then(text => props.onload({ responseText: text }))
                    .catch(e => props.onerror(e));
            } catch (e) {
                props.onerror(e);
            }
        }
    }
    if (type == "Chrome" || type == "Safari" || type == "Firefox") {
        getGM().setValue = async (key, value) => {
            return await new Promise((resolve, reject) => {
                try {
                    let item = {};
                    item[key] = value;
                    getBrowser().storage.local.set(item, function () {
                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            })
        }
        getGM().getValue = async (key) => {
            return await new Promise((resolve, reject) => {
                try {
                    getBrowser().storage.local.get([key], function (result) {
                        resolve(result[key]);
                    });
                } catch (e) {
                    reject(e);
                }

            })
        }
        getGM().getTab = async () => {
            return await new Promise((resolve, reject) => {
                try {
                    getBrowser().runtime.sendMessage(JSON.stringify({ type: 1 }), function (response) {
                        resolve(response);
                    })
                } catch (e) {
                    reject(e);
                }

            })
        }
        getGM().saveTab = async (tab) => {
            return await new Promise((resolve, reject) => {
                try {
                    getBrowser().runtime.sendMessage(JSON.stringify({ type: 2, tab: tab }), function (response) {
                        resolve(response);
                    })
                } catch (e) {
                    reject(e);
                }
            })
        }
        getGM().xmlHttpRequest = async (props) => {
            try {
                getBrowser().runtime.sendMessage(JSON.stringify({ type: 3, props: props }), function (response) {
                    if (response.error != undefined) {
                        throw response.error;
                    }
                    props.onload(response);
                })
            } catch (e) {
                props.onerror(e);
            }
        }
    }

    if (isExtension) {
        let vtEnabled = await getGM().getValue('vtEnabled');
        if (vtEnabled === false) {
            getBrowser().runtime.sendMessage(JSON.stringify({ type: 4, enabled: false }));
            return;
        } else {
            getBrowser().runtime.sendMessage(JSON.stringify({ type: 4, enabled: true }));
        }
    }


    const languages = ['en-us', 'zh-cn', 'ja-jp'];
    let language = 'en-us';
    let settingLanguage = undefined;
    try {
        settingLanguage = await getGM().getValue("DisplayLanguage");
    } catch (e) { };

    if (typeof settingLanguage != 'string') {
        settingLanguage = navigator.language;
    }
    if (typeof settingLanguage == 'string') {
        settingLanguage = settingLanguage.toLowerCase();
        if (languages.includes(settingLanguage)) {
            language = settingLanguage;
        } else {
            const settingLanguagePrefix = settingLanguage.split('-')[0];
            for (let i = 0; i < languages.length; i++) {
                const languagePrefix = languages[i].split('-')[0];
                if (settingLanguagePrefix === languagePrefix) {
                    language = languages[i];
                    break;
                }
            }
        }
    }

    let vtRefreshVersion = version + language;
    try {
        let publicVtVersion = await getGM().getValue("PublicVtVersion")
        if (publicVtVersion != null) {
            vtRefreshVersion = vtRefreshVersion + String(publicVtVersion);
        }
    } catch (e) { };
    console.log(vtRefreshVersion)

    let cachedVt = null;
    try {
        let vtType = isWebsite ? "website" : "user";
        let privateCachedVt = await getGM().getValue("PrivateCachedVt");
        let cachedVersion = null;
        try {
            cachedVersion = privateCachedVt['version'];
        } catch { };
        if (cachedVersion == vtRefreshVersion) {
            cachedVt = privateCachedVt['data'];
        } else {
            console.log("Refresh VT");
            fetch(getCdnPath(encodeFastlyJsdelivrCdn, `release/vt.${language}.${vtType}.js?vtRefreshVersion=${vtRefreshVersion}`))
                .then(r => r.text())
                .then(data => getGM().setValue('PrivateCachedVt', {
                    'version': vtRefreshVersion,
                    'data': data
                }))
                .catch(() => {
                    getChinaCdnB().then(chinaCdnB => fetch(getCdnPath(chinaCdnB, `release/vt.${language}.${vtType}.js?vtRefreshVersion=${vtRefreshVersion}`)))
                        .then(r => r.text())
                        .then(data => getGM().setValue('PrivateCachedVt', {
                            'version': vtRefreshVersion,
                            'data': data
                        }))
                })
        }
    } catch (e) { };

    async function AppendKey(key) {
        let keysStr = await getGM().getValue("VideoTogetherKeys");
        let keys = new Set(JSON.parse(keysStr));
        keys.add(key);
        await getGM().setValue("VideoTogetherKeys", JSON.stringify(Array.from(keys)));
    }

    async function GetKeys() {
        let keysStr = await getGM().getValue("VideoTogetherKeys");
        try {
            let keys = new Set(JSON.parse(keysStr));
            return Array.from(keys);
        } catch (e) {
            await getGM().setValue("VideoTogetherKeys", "[]");
            return [];
        }
    }

    function InsertInlineScript(content) {
        try {
            let inlineScript = document.createElement("script");
            inlineScript.textContent = content;
            document.head.appendChild(inlineScript);
        } catch { }
        try {
            if (isUserscript) {
                GM_addElement('script', {
                    textContent: content,
                    type: 'text/javascript'
                });
            }
        } catch { }
        try {
            if (isWebsite) {
                eval(content);
            }
        } catch { }
    }

    function InsertInlineJs(url) {
        try {
            getGM().xmlHttpRequest({
                method: "GET",
                url: url,
                onload: function (response) {
                    InsertInlineScript(response.responseText);
                }
            })
        } catch (e) { };
    }

    async function SetTabStorage(data) {
        try {
            let tabObj = await getGM().getTab();
            tabObj.VideoTogetherTabStorage = data;
            await getGM().saveTab(tabObj);
            window.postMessage({
                source: "VideoTogether",
                type: 19,
                data: tabObj.VideoTogetherTabStorage
            })
        } catch (e) { };
    }

    if (window.VideoTogetherLoading) {
        return;
    }
    window.VideoTogetherLoading = true;
    let ExtensionInitSuccess = false;

    let isTrustPageCache = undefined;
    function isTrustPage() {
        if (isDevelopment) {
            return true;
        }
        if (window.location.protocol != 'https:') {
            return false
        }

        if (isTrustPageCache == undefined) {
            const domains = [
                '2gether.video', 'videotogether.github.io'
            ];

            const hostname = window.location.hostname;
            isTrustPageCache = domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
        }
        return isTrustPageCache;
    }
    const indexedDbWriteHistory = {}
    function needTrustPage() {
        if (!isTrustPage()) {
            throw "not trust page"
        }
    }

    window.addEventListener("message", async e => {
        if (e.data.source == "VideoTogether") {
            switch (e.data.type) {
                case 13: {
                    let url = new URL(e.data.data.url);
                    if (!url.hostname.endsWith("2gether.video")
                        && !url.hostname.endsWith("xn--6kr25xemln66b.com")
                        && !url.hostname.endsWith("panghair.com")
                        && !url.hostname.endsWith("videotogether.github.io")
                        && !url.hostname.endsWith("aliyuncs.com")) {
                        console.error("permission error", e.data);
                        return;
                    }
                    getGM().xmlHttpRequest({
                        method: e.data.data.method,
                        url: e.data.data.url,
                        data: e.data.data.data,
                        onload: function (response) {
                            let data = null;
                            try {
                                data = JSON.parse(response.responseText);
                            } catch (e) { };
                            window.postMessage({
                                source: "VideoTogether",
                                type: 14,
                                data: {
                                    id: e.data.data.id,
                                    data: data,
                                    text: response.responseText
                                }
                            })
                        },
                        onerror: function (error) {
                            window.postMessage({
                                source: "VideoTogether",
                                type: 14,
                                data: {
                                    id: e.data.data.id,
                                    error: error,
                                }
                            })
                        }
                    })
                    break;
                }
                case 15: {
                    if (window.location.hostname.endsWith("videotogether.github.io")
                        || window.location.hostname.endsWith("2gether.video")
                        || e.data.data.key.startsWith("Public")
                        || isWebsite
                        || isDevelopment) {
                        getGM().setValue(e.data.data.key, e.data.data.value)
                        AppendKey(e.data.data.key);
                        break;
                    } else {
                        console.error("permission error", e.data);
                    }
                    break;
                }
                case 17: {
                    ExtensionInitSuccess = true;
                    break;
                }
                case 18: {
                    await SetTabStorage(e.data.data);
                    break;
                }
                case 2001: {
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        const realTableName = getRealTableName(e.data.data.table)
                        if (indexedDbWriteHistory[realTableName] == undefined) {
                            indexedDbWriteHistory[realTableName] = {};
                        }
                        indexedDbWriteHistory[realTableName][e.data.data.key] = true;
                        window.postMessage({
                            source: "VideoTogether",
                            type: 2003,
                            data: {
                                id: e.data.data.id,
                                table: e.data.data.table,
                                key: e.data.data.key,
                                error: response.error
                            }
                        })
                    })
                    break;
                }
                case 2002: {
                    try {
                        const realTableName = getRealTableName(e.data.data.table)
                        if (!indexedDbWriteHistory[realTableName][e.data.data.key]) {
                            needTrustPage();
                        }
                    } catch {
                        needTrustPage();
                    }
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        window.postMessage({
                            source: "VideoTogether",
                            type: 2004,
                            data: {
                                id: e.data.data.id,
                                table: e.data.data.table,
                                key: e.data.data.key,
                                data: response.data,
                                error: response.error
                            }
                        })
                    })
                    break;
                }
                case 2005: {
                    needTrustPage();
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        window.postMessage({
                            source: "VideoTogether",
                            type: 2006,
                            data: {
                                id: e.data.data.id,
                                table: e.data.data.table,
                                regex: e.data.data.regex,
                                data: response.data,
                                error: response.error
                            }
                        })
                    })
                    break;
                }
                case 2007: {
                    needTrustPage();
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        window.postMessage({
                            source: "VideoTogether",
                            type: 2008,
                            data: {
                                id: e.data.data.id,
                                table: e.data.data.table,
                                key: e.data.data.key,
                                error: response.error
                            }
                        })
                    })
                    break;
                }
                case 2009: {
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        window.postMessage({
                            source: "VideoTogether",
                            type: 2010,
                            data: {
                                data: JSON.parse(response)
                            }
                        })
                    })
                    break;
                }
                case 3009: {
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data))
                    break;
                }
                case 3010: {
                    needTrustPage();
                    getBrowser().runtime.sendMessage(JSON.stringify(e.data), response => {
                        window.postMessage({
                            source: "VideoTogether",
                            type: 3011,
                            data: {
                                id: e.data.data.id,
                                error: response.error
                            }
                        })
                    })
                    break;
                }
            }
        }
    });

    let isMain = window.self == window.top;

    async function PostStorage() {
        try {
            let keys = await GetKeys();
            let data = {}
            for (let i = 0; i < keys.length; i++) {
                data[keys[i]] = await getGM().getValue(keys[i]);
                if (data[keys[i]] == 'true') {
                    data[keys[i]] = true;
                }
                if (data[keys[i]] == 'false') {
                    data[keys[i]] = false;
                }
            }
            data["UserscriptType"] = type;
            data["LoaddingVersion"] = version;
            data["VideoTogetherTabStorageEnabled"] = true;
            data['ExtensionLanguages'] = languages;
            try {
                data["VideoTogetherTabStorage"] = (await getGM().getTab()).VideoTogetherTabStorage;
            } catch (e) {
                data["VideoTogetherTabStorageEnabled"] = false;
            }
            window.postMessage({
                source: "VideoTogether",
                type: 16,
                data: data
            }, "*");
        } catch { }
    }

    PostStorage();
    setInterval(() => {
        PostStorage();
    }, 1000);

    function insertJs(url) {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        (document.body || document.documentElement).appendChild(script);
    }

    let wrapper = document.createElement("div");
    wrapper.innerHTML = `<div id="videoTogetherLoading">
    <div id="videoTogetherLoadingwrap">
        <img style="display: inline;" src="data:image/png;base64,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">
        <a target="_blank" href="http://videotogether.github.io/guide/qa.html">loading ...</a>
    </div>
</div>

<style>
    #videoTogetherLoading {
        touch-action: none;
        height: 50px;
        border: 1px solid #c9c8c8;
        background: #ffffff;
        color: #212529;
        display: flex;
        align-items: center;
        z-index: 2147483646;
        position: fixed;
        bottom: 15px;
        right: 15px;
        width: 250px;
        text-align: center;
        box-shadow: 0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d;
        border-radius: 5px;
    }
    #videoTogetherLoadingwrap {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    #videoTogetherLoadingwrap img {
        margin-right: 12px;
    }
    #videoTogetherLoadingwrap a {
        color: #212529;
        text-decoration: none;
    }
    #videoTogetherLoadingwrap a:hover {
        color: #1890ff;
        text-decoration: underline;
    }
</style>
`;
    (document.body || document.documentElement).appendChild(wrapper);
    let script = document.createElement('script');
    script.type = 'text/javascript';
    switch (type) {
        case "userscript":
            script.src = getCdnPath(encodeFastlyJsdelivrCdn, `release/vt.${language}.user.js?timestamp=${version}`);
            break;
        case "Chrome":
        case "Safari":
        case "Firefox":
            let inlineDisabled = false;
            let evalDisabled = false;
            let urlDisabled = false;
            let hotUpdated = false;
            document.addEventListener("securitypolicyviolation", (e) => {
                if (hotUpdated) {
                    return;
                }
                for (let blockedStr of [e.blockedURI, e.sample]) {
                    for (let extensionUrl of ["2gether.video", "jsdelivr.net"]) {
                        try {
                            if (blockedStr.indexOf(extensionUrl) != -1) {
                                urlDisabled = true;
                            }
                        } catch { }

                    }
                }

                if (urlDisabled) {
                    console.log("hot update is not successful")
                    insertJs(getBrowser().runtime.getURL(`vt.${language}.user.js`));
                    hotUpdated = true;
                }
            });
            if (isDevelopment) {
                script.src = getBrowser().runtime.getURL(`vt.${language}.user.js`);
            } else {
                script.src = getBrowser().runtime.getURL(`load.${language}.js`);
            }
            script.setAttribute("cachedVt", cachedVt);
            break;
        case "userscript_debug":
            script.src = `http://127.0.0.1:7000/release/vt.debug.${language}.user.js?timestamp=` + parseInt(Date.now());
            break;
        case "website":
            script.src = getCdnPath(encodeFastlyJsdelivrCdn, `release/vt.${language}.website.js?timestamp=${version}`);
            break;
        case "website_debug":
            script.src = `http://127.0.0.1:7000/release/vt.debug.${language}.website.js?timestamp=` + parseInt(Date.now());
            break;
    }

    if (isWebsite || isUserscript) {
        if (cachedVt != null) {
            InsertInlineScript(cachedVt);
        }
        setTimeout(() => {
            if (!ExtensionInitSuccess) {
                (document.body || document.documentElement).appendChild(script);
                if (isWebsite) {
                    // keep this inline inject because shark browser needs this
                    InsertInlineJs(script.src);
                }
                try {
                    GM_addElement('script', {
                        src: script.src,
                        type: 'text/javascript'
                    })
                } catch { }
            }
        }, 10);
    } else {
        (document.body || document.documentElement).appendChild(script);
    }

    // fallback to china service
    setTimeout(async () => {
        try {
            document.querySelector("#videoTogetherLoading").remove()
        } catch { }
        if (type == "Chrome" || type == "Firefox" || type == "Safari") {
            return;
        }
        if (!ExtensionInitSuccess) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            const chinaCdnB = await getChinaCdnB();
            script.src = getCdnPath(chinaCdnB, `release/vt.${language}.user.js`);
            (document.body || document.documentElement).appendChild(script);
            try {
                if (isWebsite) {
                    InsertInlineJs(script.src);
                }

                GM_addElement('script', {
                    src: script.src,
                    type: 'text/javascript'
                })
            } catch (e) { };
        }
    }, 5000);
    function filter(e) {
        let target = e.target;

        if (target.id != "videoTogetherLoading") {
            return;
        }

        target.moving = true;

        if (e.clientX) {
            target.oldX = e.clientX;
            target.oldY = e.clientY;
        } else {
            target.oldX = e.touches[0].clientX;
            target.oldY = e.touches[0].clientY;
        }

        target.oldLeft = window.getComputedStyle(target).getPropertyValue('left').split('px')[0] * 1;
        target.oldTop = window.getComputedStyle(target).getPropertyValue('top').split('px')[0] * 1;

        document.onmousemove = dr;
        document.ontouchmove = dr;

        function dr(event) {
            if (!target.moving) {
                return;
            }
            if (event.clientX) {
                target.distX = event.clientX - target.oldX;
                target.distY = event.clientY - target.oldY;
            } else {
                target.distX = event.touches[0].clientX - target.oldX;
                target.distY = event.touches[0].clientY - target.oldY;
            }

            target.style.left = Math.min(document.documentElement.clientWidth - target.clientWidth, Math.max(0, target.oldLeft + target.distX)) + "px";
            target.style.top = Math.min(document.documentElement.clientHeight - target.clientHeight, Math.max(0, target.oldTop + target.distY)) + "px";
        }

        function endDrag() {
            target.moving = false;
        }
        target.onmouseup = endDrag;
        target.ontouchend = endDrag;
    }
    document.onmousedown = filter;
    document.ontouchstart = filter;
})();
