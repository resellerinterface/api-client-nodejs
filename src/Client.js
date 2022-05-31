const nodeFetch = require('node-fetch');
const ApiResponse = require("./Response/ApiResponse");
const ApiResponseDownload = require("./Response/ApiResponseDownload");
const fetch = require('fetch-cookie')(nodeFetch);
const FormData = require('form-data');
const FileType = require('file-type');
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
     * @param baseUrl
     * @param version
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

        this.httpsAgent = new https.Agent();
        this.setOptions(options);
    }

    /**
     *
     * @param options
     */
    setOptions(options) {
        if (options['ipResolve']) {
            this.setIpResolve(options['ipResolve'])
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
                    const response = await fetch(url + action, {
                        method: 'post',
                        body: form,
                        headers: {'User-Agent': 'api-client-nodejs/' + packageVersion},
                        agent: this.httpsAgent
                    }).then(res => res.json())

                    return new ApiResponse(response);
                } catch (e) {
                    throw new Error('Fetch-Error: ' + e);
                }
            }
            case RESPONSE_DOWNLOAD: {
                let filename = null;
                let filesize = null;
                try {
                    const file = await fetch(url + action, {
                        method: 'post',
                        body: form,
                        headers: {'User-Agent': 'api-client-nodejs/' + packageVersion},
                        agent: this.httpsAgent
                    }).then(res => {
                        filename = res.headers.get('content-disposition').match(/.*filename=[\'\"]?([^\"]+)/)[1] || null;
                        filesize = parseInt(res.headers.get('content-length'));
                        return res.buffer();
                    });
                    let filetype = await FileType.fromBuffer(file);
                    return new ApiResponseDownload(file, filename, filesize, filetype.mime);
                } catch (e) {
                    throw new Error('Fetch-Error: ' + e);
                }
            }
            default: {
                throw new Error("invalid responseType")
            }
        }

    }

}

module.exports = Client;