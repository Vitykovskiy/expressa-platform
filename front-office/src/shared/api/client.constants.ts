import type { InjectionKey } from "vue";

import type { ApiClient } from "./client";

export const apiClientKey: InjectionKey<ApiClient> = Symbol("apiClient");
export const apiContractErrorCode = "API_CONTRACT_ERROR";
export const apiErrorContractErrorMessage =
  "Сервер вернул ошибку, не соответствующую контракту API.";
export const apiResponseContractErrorMessage =
  "Сервер вернул ответ, не соответствующий контракту API.";
export const apiStatusContractErrorMessage =
  "Сервер вернул неожиданный статус ответа.";
export const jsonContentTypeHeader = "content-type";
export const jsonContentTypeValue = "application/json";
export const networkErrorCode = "NETWORK_ERROR";
export const networkErrorMessage = "Не удалось подключиться к серверу.";
export const noContentStatus = 204;
export const protocolRelativeApiBaseUrlMessage =
  "Неверная конфигурация: VITE_API_BASE_URL не может быть protocol-relative URL.";
export const sameOriginApiBaseUrl = "https://same-origin.invalid/api/v1/";
