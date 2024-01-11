const ApiResponse = require("./Response/ApiResponse");
const ApiResponseDownload = require("./Response/ApiResponseDownload");
const fetch = require('node-fetch');
const FormData = require('form-data');
const packageVersion = require('../package').version;
const https = require('https');

const RESPONSE_RESPONSE = "RESPONSE_RESPONSE";
const RESPONSE_DOWNLOAD = "RESPONSE_DOWNLOAD";

const IP_RESOLVE_V4 = "ipv4";
const IP_RESOLVE_V6 = "ipv6";
const IP_RESOLVE_ANY = "any";

class Client {
    /**
     *
     * @param {string} baseUrl
     * @param {string} version
     * @param options
     */
    constructor(baseUrl = "https://core.resellerinterface.de/", version = "stable", options = {}) {
        if (!baseUrl.endsWith("/")) baseUrl += "/";
        this.baseUrl = baseUrl;

        if (version === 'stable' || version === 'latest') {
            this.version = version;
        } else if (version && parseInt(version)) {
            this.version = 'v' + parseInt(version);
        } else {
            throw new Error('Invalid version provided')
        }

        this.userAgent = 'api-client-nodejs/' + packageVersion;
        if(process && process.versions && process.versions.node) {
            this.userAgent += " node/" + process.versions.node;
        }

        this.httpsAgent = new https.Agent();
        this.setOptions(options);
    }

    /**
     *
     * @returns {string}
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     *
     * @returns {string}
     */
    getVersion() {
        return this.version;
    }

    /**
     *
     * @param options
     */
    setOptions(options) {
        if (options['ipResolve']) {
            this.setIpResolve(options['ipResolve'])
        }
        if(options['userAgent']) {
            this.setUserAgent(options['userAgent']);
        }
    }

    /**
     *
     * @param option
     */
    setIpResolve(option) {
        if (option === IP_RESOLVE_V4) {
            this.httpsAgent = new https.Agent({family: 4});
        } else {
            if (option === IP_RESOLVE_V6) {
                this.httpsAgent = new https.Agent({family: 6});
            } else {
                this.httpsAgent = new https.Agent();
            }
        }
    }

    /**
     *
     * @param {string} option
     */
    setUserAgent(option) {
        this.userAgent = option;
    }

    /**
     *
     * @returns {string}
     */
    getUserAgent() {
        return this.userAgent;
    }

    /**
     *
     * @param username
     * @param password
     * @param resellerId
     * @returns {Promise<void>}
     */
    login(username, password, resellerId = null) {
        const query = {
            'username': username,
            'password': password,
        }
        if (resellerId) {
            query.resellerId = resellerId;
        }
        return this.request('reseller/login', query);
    }

    /**
     *
     * @param current
     * @param returnValue
     * @param prefix
     * @returns {*[]}
     */
    buildPostArray(current, returnValue = [], prefix) {
        for (const k in current) {
            let v = current[k];
            const newPrefix = prefix ? prefix + '[' + k + ']' : k;
            if (typeof v === 'object') {
                returnValue = this.buildPostArray(v, returnValue, newPrefix)
            } else {
                if (v === true) {
                    v = "true";
                }
                if (v === false) {
                    v = "false";
                }
                returnValue[newPrefix] = v;
            }
        }
        return returnValue;
    }

    /**
     *
     * @param action
     * @param params
     * @param responseType
     * @returns {Promise<ApiResponseDownload>|Promise<ApiResponse>}
     */
    async request(action, params, responseType = RESPONSE_RESPONSE) {
        action = action.replace(/(^\/|\/$)/mg, "");
        const path = action.split('/');
        if (!path[0] || !path[1]) {
            throw new Error("invalid request action")
        }

        const form = new FormData();
        const formData = this.buildPostArray(params);
        for (const name in formData) {
            form.append(name, formData[name]);
        }

        const url = this.baseUrl + this.version + '/';

        switch (responseType) {
            case RESPONSE_RESPONSE: {
                try {
                    const response = await this.fetchWrapper(url + action, {
                        method: 'post',
                        body: form,
                    }).then(res => res.json())

                    return new ApiResponse(response);
                } catch (e) {
                    throw new Error('Fetch-Error: ' + e);
                }
            }
            case RESPONSE_DOWNLOAD: {
                let filename = null;
                let filesize = null;
                let filetype = null;
                try {
                    const file = await this.fetchWrapper(url + action, {
                        method: 'post',
                        body: form,
                    }).then(res => {
                        filename = res.headers.get('content-disposition').match(/.*filename=[\'\"]?([^\"]+)/)[1] || null;
                        filesize = parseInt(res.headers.get('content-length'));
                        filetype = res.headers.get('content-type')
                        return res.buffer();
                    });
                    return new ApiResponseDownload(file, filename, filesize, filetype);
                } catch (e) {
                    throw new Error('Fetch-Error: ' + e);
                }
            }
            default: {
                throw new Error("invalid responseType")
            }
        }

    }

    /**
     *
     * @param {string,null} session
     */
    setSession(session) {
        this.session = session;
    }

    /**
     *
     * @returns {string|null}
     */
    getSession() {
        return this.session || null;
    }

    async fetchWrapper(url, options = {}){
        if(options.headers) {
            options.headers['User-Agent'] = this.userAgent;
        } else {
            options.headers = {'User-Agent': this.userAgent}
        }

        options.agent = this.httpsAgent;

        if(this.session) {
            options.headers.cookie = 'coreSID=' + this.session;
        }

        try {
            const res = await fetch(url, options);

            const cookies = res.headers.get('set-cookie');

            if(cookies) {
                const match = cookies.match(/coreSID=*([^;]*)/mi);

                if(match) {
                    this.session = match[1];
                }
            }

            return res;
        } catch (e) {
            throw new Error('Fetch-Error: ' + e);
        }
    }

}

module.exports = Client;