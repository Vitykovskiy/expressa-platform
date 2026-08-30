import { HttpStatus } from "@nestjs/common";

export const backofficeOrdersControllerPath = "backoffice/orders";
export const backofficeOrdersApiTag = "backoffice";
export const backofficeOrderErrorResponses = {
  notFound: {
    code: "ORDER_NOT_FOUND",
    message: "Заказ не найден.",
    details: null,
  },
  conflict: {
    code: "ORDER_STAGE_CONFLICT",
    message: "Переход заказа недопустим на текущей стадии.",
    details: null,
  },
} as const;
export const backofficeOrderErrorStatus = {
  notFound: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
} as const;
