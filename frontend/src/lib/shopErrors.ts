import { ApiError } from "@/lib/api";

export const isMissingSellerShopError = (error: unknown) =>
  error instanceof ApiError && error.status === 404;
