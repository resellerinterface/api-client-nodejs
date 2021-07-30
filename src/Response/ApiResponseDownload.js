const ApiResponse = require("./ApiResponse");

class ApiResponseDownload extends ApiResponse {
    /**
     *
     * @param response
     * @param fileName
     * @param fileSize
     * @param fileType
     */
    constructor(response, fileName, fileSize, fileType) {
        super();
        this.response = {
            'state': 1000,
            'stateParam': "",
            'stateName': "OK",
            'file': response,
            'fileName': fileName,
            'fileSize': fileSize,
            'fileType': fileType,
        }
    }

    /**
     *
     * @returns {*|null}
     */
    getFile() {
        return this.response['file'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getFileSize() {
        return this.response['fileSize'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getFileName() {
        return this.response['fileName'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getFileType() {
        return this.response['fileType'] || null;
    }
}

module.exports = ApiResponseDownload;