import axios from "axios";

const api = axios.create({
    baseURL:
        process.env.NODE_ENV === "production"
            ? "/api"
            : "http://localhost:5000",
    withCredentials: true,
});

export default api;