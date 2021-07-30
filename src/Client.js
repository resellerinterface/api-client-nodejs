const nodeFetch = require('node-fetch');
const ApiResponse = require("./Response/ApiResponse");
const ApiResponseDownload = require("./Response/ApiResponseDownload");
const fetch = require('fetch-cookie')(nodeFetch);
const FormData = require('form-data');
const FileType = require('file-type');
const packageVersion =  require('../package').version;

const RESPONSE_RESPONSE = "RESPONSE_RESPONSE";
const RESPONSE_DOWNLOAD = "RESPONSE_DOWNLOAD";

class Client {
    /**
     *
     * @param baseUrl
     * @param version
     */
    constructor(baseUrl = "https://core.resellerinterface.de/", version = "stable") {
        if (!baseUrl.endsWith("/")) baseUrl += "/";
        this.baseUrl = baseUrl;

        if (version === 'stable' || version === 'latest') {
            this.version = version;
        } else if (version && parseInt(version)) {
            this.version = 'v' + parseInt(version);
        } else {
            throw new Error('Invalid version provided')
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

        for (const name in params) {
            form.append(name, params[name]);
        }

        const url = this.baseUrl + this.version + '/';

        switch (responseType) {
            case RESPONSE_RESPONSE: {
                try {
                    const response = await fetch(url + action, {
                        method: 'post',
                        body: form,
                        headers: { 'User-Agent': 'api-client-nodejs/' + packageVersion }
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
                        headers: { 'User-Agent': 'api-client-nodejs/' + packageVersion }
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