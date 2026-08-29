import type { InjectionKey } from "vue";

import type { ApiClient } from "./client";

export const apiClientKey: InjectionKey<ApiClient> = Symbol("apiClient");
export const apiContractErrorCode = "API_CONTRACT_ERROR";
export const networkErrorCode = "NETWORK_ERROR";
export const noContentStatus = 204;
export const sameOriginApiBaseUrl = "http://same-origin.invalid/api/v2/";

export const apiResponseContractErrorMessage =
  "Сервер вернул ответ, не соответствующий контракту API.";
export const apiErrorContractErrorMessage =
  "Сервер вернул ошибку, не соответствующую контракту API.";
export const apiStatusContractErrorMessage =
  "Сервер вернул неожиданный статус ответа.";
export const networkErrorMessage = "Не удалось подключиться к серверу.";
export const invalidSameOriginApiBaseUrlMessage =
  "Базовый URL API для текущего origin должен быть равен /.";
export const jsonContentTypeHeader = "content-type";
export const jsonContentTypeValue = "application/json";
