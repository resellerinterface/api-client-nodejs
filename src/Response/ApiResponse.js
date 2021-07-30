class ApiResponse {
    /**
     *
     * @param response
     */
    constructor(response) {
        this.response = response;
    }

    /**
     *
     * @returns {*|null}
     */
    getState() {
        return this.response['state'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getStateName() {
        return this.response['stateName'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getStateParam() {
        return this.response['stateParam'] || null;
    }

    /**
     *
     * @returns {*|null}
     */
    getData() {
        return this.response || null;
    }

    /**
     *
     * @returns {boolean}
     */
    isError() {
        return !this.response || this.getState() >= 2000;
    }

    /**
     *
     * @returns {*[]|*}
     */
    getErrors() {
        if (this.response['errors']) {
            return this.response['errors']
        }
        return [];
    }
}

module.exports = ApiResponse;