class HttpRequest {
    constructor(baseUrl = "https://spotify.f8team.dev/api") {
        this.baseUrl = baseUrl;
    }

    async _send(path, method, data, options = {}) {
        try {
            const _options = {
                method,
                headers: {
                    ...options.headers,
                    "Content-Type": "application/json",
                },
            };
            if (data) {
                _options.body = JSON.stringify(data);
            }
            const accessToken = localStorage.getItem("access_token");
            if (accessToken) {
                _options.headers["Authorization"] = `Bearer ${accessToken}`;
            }
            const res = await fetch(`${this.baseUrl}${path}`, _options);
            const response = await res.json();
            if (!res.ok) {
                const error = new Error(`HTTP error! status: ${res.status}`);
                error.response = response;
                error.status = res.status;
                throw error;
            }

            return response;
        } catch (error) {
            console.log("Error:", error);
            throw error;
        }
    }

    async get(path, options = {}) {
        return this._send(path, "GET", null, options);
    }

    async post(path, data, options = {}) {
        return this._send(path, "POST", data, options);
    }

    async put(path, data, options = {}) {
        return this._send(path, "PUT", data, options);
    }

    async patch(path, data, options = {}) {
        return this._send(path, "PATCH", data, options);
    }

    async delete(path, options) {
        return this._send(path, "DELETE", null, options);
    }
}

const httpRequest = new HttpRequest();

export default httpRequest;
