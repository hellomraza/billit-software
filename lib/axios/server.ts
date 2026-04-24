import axios from "axios";
import { cookies } from "next/headers";

export async function createServerAxios() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 10000,
  });

  // Response interceptor: normalize errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("API Error:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(new Error(error));
    },
  );

  return instance;
}
