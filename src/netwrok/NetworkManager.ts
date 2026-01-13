import axios, { AxiosError, AxiosResponse } from "axios";
import { api, BASE_URL } from "./Environment";
import { useAuthStore } from "../store/authSlice";

export const Method = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export const Status = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpMethod = keyof typeof Method;

export type ApiResponse<T = any> = {
  status: number;
  message?: string;
  data?: T;
  errorType?: string;
};

interface ApiCallParams {
  method: HttpMethod;
  endPoint: string;
  bodyParams?: any;
  onSuccess?: (response: ApiResponse) => void;
  onError?: (error: any) => void;
  count?: number;
  multipart?: boolean;
  headers?: Record<string, string>;
}

declare global {
  interface Window {
    showToast?: (message: string, type?: "error" | "success" | "warning") => void;
  }
}

const showToast = (message?: string, type: "error" | "success" | "warning" = "error") => {
  if (!message) return;
  try {
    const fn = (window as any).showToast;
    if (typeof fn === "function") {
      fn(String(message), type);
    }
  } catch {}
};

// Configure axios defaults
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers['authorization'] = `Bearer ${token}`;
  }

  return config;
});

const refreshAccessToken = async (
  refreshToken: string
): Promise<string | null> => {
  try {
    const response = await axiosInstance.post(api.refreshToken, {
      refreshToken,
    });

    if (response.data?.accessToken) {
      return response.data.accessToken;
    }

    throw new Error("Failed to refresh token");
  } catch (error) {
    console.log("Error refreshing token:", error);
    return null;
  }
};

const handleAuthenticationError = (logout: () => void, message: string) => {
  console.warn("Auth Error:", message);
  showToast(message || "Authentication failed. Please login again.");
  logout();
};

export const callApi = async ({
  method,
  endPoint,
  bodyParams,
  onSuccess,
  onError,
  count = 0,
  multipart = false,
  headers = {},
}: ApiCallParams): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;

    let response: AxiosResponse<ApiResponse>;

    const requestConfig: any = { headers };

    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        authorization: `Bearer ${token}`,
      };
    }
    if (multipart) {
      requestConfig.headers = {
        ...requestConfig.headers,
        "Content-Type": "multipart/form-data",
      };
    } else {
      requestConfig.headers = {
        ...requestConfig.headers,
        "Content-Type": "application/json",
      };
    }

    switch (method) {
      case "GET":
        response = await axiosInstance.get(endPoint, requestConfig);
        break;
      case "POST":
        response = await axiosInstance.post(endPoint, bodyParams, requestConfig);
        break;
      case "PUT":
        response = await axiosInstance.put(endPoint, bodyParams, requestConfig);
        break;
      case "PATCH":
        response = await axiosInstance.patch(endPoint, bodyParams, requestConfig);
        break;
      case "DELETE":
        response = await axiosInstance.delete(endPoint, requestConfig);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    const responseData: ApiResponse = response.data;

    if (
      responseData?.message ===
      "User recently changed password please login again!"
    ) {
      handleAuthenticationError(useAuthStore.getState().logout, responseData.message);
      return;
    }

    if (response.status >= 200 && response.status < 300) {
      onSuccess && onSuccess(responseData);

      if (responseData?.errorType) {
        console.warn("API Warning:", responseData.errorType);
      } else if (responseData?.message) {
        console.log("API Message:", responseData.message);
      }
    } else {
      onError && onError(responseData);

      if (responseData?.errorType) {
        console.error("API Error Type:", responseData.errorType);
      } else if (responseData?.message) {
        console.error("API Error Message:", responseData.message);
      }
      showToast(responseData?.message || "Request failed. Please try again.");
    }
  } catch (error) {
    console.error("API Call Failed:", {
      endpoint: endPoint,
      method,
      bodyParams,
      error:
        error instanceof Error
          ? { message: error.message, name: error.name }
          : { message: String(error), name: "Unknown" },
    });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 401) {
        const serverError = axiosError.response.data as ApiResponse;
        const message = serverError?.message?.toLowerCase() || "";

        // 🧩 Case 1: login error (wrong password or invalid credentials)
        if (
          endPoint.includes("auth/signin") &&
          (message.includes("password") ||
            message.includes("invalid credentials") ||
            serverError?.errorType === "INVALID_PASSWORD")
        ) {
          onError && onError({ message: "Invalid credentials" });
          showToast("Invalid credentials");
          return;
        }

        // 🧩 Case 2: token/session expired
        if (
          (message.includes("jwt expired") ||
            message.includes("token") ||
            message.includes("expired") ||
            message.includes("unauthorized")) &&
          count < 2 &&
          useAuthStore.getState().refreshToken
        ) {
          console.log("Token expired, attempting refresh...");
          const newAccessToken = await refreshAccessToken(
            useAuthStore.getState().refreshToken!
          );
          if (newAccessToken) {
            useAuthStore.getState().setToken(newAccessToken);
            return callApi({
              method,
              endPoint,
              bodyParams,
              onSuccess,
              onError,
              count: count + 1,
              multipart,
              headers,
            });
          }
        }

        if (
          endPoint.includes("auth/update-password") &&
          (message.includes("old password") || message.includes("incorrect"))
        ) {
          onError && onError(serverError);
          showToast(serverError?.message || "Failed to update password. Please try again.");
          return;
        }

        // 🧩 Case 3: other 401 errors (like no token at all)
        if (endPoint.includes("auth/signin")) {
          onError && onError(serverError);
          const lowerMsgSignin = (serverError?.message || "").toLowerCase();
          if (
            lowerMsgSignin.includes("only therapist") ||
            lowerMsgSignin.includes("role") ||
            lowerMsgSignin.includes("instructor")
          ) {
            showToast("Please sign in with a therapist account.");
          } else {
            showToast("Invalid credentials");
          }
          return;
        }
        handleAuthenticationError(
          useAuthStore.getState().logout,
          serverError?.message || "Authentication failed. Please login again."
        );
        return;
      }


      // ✅ Handle specific password / credentials errors
      if (axiosError.response?.data) {
        const serverError = axiosError.response.data as ApiResponse;
        const message = serverError?.message?.toLowerCase() || "";

        if (
          message.includes("password") ||
          message.includes("invalid credentials") ||
          serverError?.errorType === "INVALID_PASSWORD"
        ) {
          onError && onError({ message: "Invalid credentials" });
          showToast("Invalid credentials");
          return;
        }

        if (
          message.includes("phone") ||
          message.includes("user not found") ||
          serverError?.errorType === "USER_NOT_FOUND"
        ) {
          const isSignin = endPoint.includes("auth/signin");
          const password = String(bodyParams?.password ?? "");
          const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/.test(password);

          if (isSignin) {
            if (isStrongPassword) {
              onError && onError({ message: "Invalid credentials" });
              showToast("Invalid credentials");
              return;
            } else {
              onError && onError({ message: "User not found" });
              showToast("User not found");
              return;
            }
          }

          onError && onError({ message: "User not found" });
          showToast("User not found");
          return;
        }
      }

      if (axiosError.code === "ECONNABORTED") {
        onError &&
          onError({ message: "Request timed out. Please try again." });
        showToast("Request timed out. Please try again.");
      } else if (
        axiosError.code === "NETWORK_ERROR" ||
        axiosError.message.includes("Network Error")
      ) {
        onError &&
          onError({
            message:
              "Network connection failed. Please check your internet connection.",
          });
        showToast("Network connection failed. Please check your internet connection.");
      } else if (axiosError.response) {
        const serverError = axiosError.response.data as ApiResponse;
        onError && onError(serverError);
        const lowerMsg = String(serverError?.message || "").toLowerCase();
        const isPermissionError =
          axiosError.response.status === 403 ||
          lowerMsg.includes("permission") ||
          lowerMsg.includes("forbidden") ||
          lowerMsg.includes("not authorized") ||
          lowerMsg.includes("not authorised");
        if (!endPoint.includes("auth/logout") && !endPoint.includes("logout")) {
          if (!isPermissionError) {
            showToast(serverError?.message || "Request failed. Please try again.");
          }
        }
      } else {
        onError && onError({ message: "Request failed. Please try again." });
        showToast("Request failed. Please try again.");
      }
    } else {
      onError && onError({ message: "An unexpected error occurred." });
      showToast("An unexpected error occurred.");
    }
  }
};

export const callApiLegacy = async (
  navigation: any,
  method: HttpMethod,
  endPoint: string,
  bodyParams?: any,
  onSuccess?: (response: ApiResponse) => void,
  onError?: (error: any) => void,
  count: number = 0,
  multipart: boolean = false
) => {
  if (!onSuccess || !onError) {
    throw new Error("onSuccess and onError callbacks are required");
  }

  return callApi({
    method,
    endPoint,
    bodyParams,
    onSuccess,
    onError,
    count,
    multipart,
  });
};
