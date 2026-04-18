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
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "An unexpected error occurred";
      return Promise.reject(new Error(message));
    },
  );

  return instance;
}
