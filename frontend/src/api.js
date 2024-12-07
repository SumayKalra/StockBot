import axios from "axios";

const createAxiosInstance = (getToken) => {
  const instance = axios.create({
    baseURL: "http://localhost:8000", // Adjust your backend URL as needed
  });

  // Add an interceptor to include the token in every request
  instance.interceptors.request.use(
    async (config) => {
      const token = getToken(); // Get the latest token
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

export default createAxiosInstance;
