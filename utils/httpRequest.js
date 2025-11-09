class HttpRequest {
    constructor(baseUrl = "https://spotify.f8team.dev/api") {
        this.baseUrl = baseUrl;
    }

    async _send(path, method, data, options = {}) {
        try {
            const _options = {
                method,
                headers: { ...options.headers },
            };

            // Nếu có token => thêm Authorization
            const accessToken = localStorage.getItem("access_token");
            if (accessToken) {
                _options.headers["Authorization"] = `Bearer ${accessToken}`;
            }

            // Nếu là FormData => KHÔNG set Content-Type
            if (data instanceof FormData) {
                _options.body = data;
            }
            // Nếu là JSON
            else if (data) {
                _options.headers["Content-Type"] = "application/json";
                _options.body = JSON.stringify(data);
            }

            const res = await fetch(`${this.baseUrl}${path}`, _options);

            // Bắt content-type để tránh JSON parse lỗi
            const contentType = res.headers.get("content-type");
            let responseData;
            if (contentType && contentType.includes("application/json")) {
                responseData = await res.json();
            } else {
                responseData = await res.text();
            }

            // Nếu request thất bại => throw error kèm chi tiết
            if (!res.ok) {
                const error = new Error(`HTTP error! status: ${res.status}`);
                error.status = res.status;
                error.response = responseData;
                console.error("🔥 Server error:", responseData);
                if (responseData?.error) {
                    console.error(
                        "🧩 Backend message:",
                        responseData.error.message || responseData.error
                    );
                }
                throw error;
            }

            return responseData;
        } catch (error) {
            console.error("❌ Request failed:", error);
            throw error;
        }
    }

    get(path, options = {}) {
        return this._send(path, "GET", null, options);
    }

    post(path, data, options = {}) {
        return this._send(path, "POST", data, options);
    }

    put(path, data, options = {}) {
        return this._send(path, "PUT", data, options);
    }

    patch(path, data, options = {}) {
        return this._send(path, "PATCH", data, options);
    }

    delete(path, options = {}) {
        return this._send(path, "DELETE", null, options);
    }
}

const httpRequest = new HttpRequest();
export default httpRequest;
