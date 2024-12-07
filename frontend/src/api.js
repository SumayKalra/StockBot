import axios from "axios";

const createAxiosInstance = (getToken) => {
  const instance = axios.create({
    baseURL: "https://stock-d0ugs28f3-sumays-projects-d15cfe10.vercel.app",
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
