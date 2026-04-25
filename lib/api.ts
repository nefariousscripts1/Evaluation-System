import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

type ApiRouteErrorOptions = {
  status?: number;
  extras?: Record<string, unknown>;
};

export class ApiRouteError extends Error {
  status: number;
  extras?: Record<string, unknown>;

  constructor(message: string, options: ApiRouteErrorOptions = {}) {
    super(message);
    this.name = "ApiRouteError";
    this.status = options.status ?? 400;
    this.extras = options.extras;
  }
}

function buildHeaders(headers?: HeadersInit) {
  return {
    ...NO_STORE_HEADERS,
    ...(headers ?? {}),
  };
}

type ApiSuccessInit = {
  status?: number;
  headers?: HeadersInit;
  preserveRoot?: boolean;
};

export function apiSuccess<T>(data: T, init: ApiSuccessInit = {}) {
  const preserveRoot =
    init.preserveRoot !== false &&
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data);

  const payload = preserveRoot
    ? {
        success: true,
        data,
        ...(data as Record<string, unknown>),
      }
    : {
        success: true,
        data,
      };

  return NextResponse.json(payload, {
    status: init.status ?? 200,
    headers: buildHeaders(init.headers),
  });
}

export function apiError(
  error: string,
  status = 400,
  extras?: Record<string, unknown>,
  headers?: HeadersInit
) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(extras ?? {}),
    },
    {
      status,
      headers: buildHeaders(headers),
    }
  );
}

function formatPath(path: PropertyKey) {
  return typeof path === "number" ? `[${path}]` : String(path);
}

export function formatZodError(error: ZodError) {
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return "Invalid request";
  }

  const path = firstIssue.path.length > 0 ? `${firstIssue.path.map(formatPath).join(".")}: ` : "";
  return `${path}${firstIssue.message}`;
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiRouteError("Invalid JSON request body", { status: 400 });
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new ApiRouteError(formatZodError(parsed.error), { status: 400 });
  }

  return parsed.data;
}

export function parseSearchParams<T>(
  request: Request | URL | URLSearchParams,
  schema: ZodType<T>
) {
  const searchParams =
    request instanceof URLSearchParams
      ? request
      : request instanceof URL
      ? request.searchParams
      : new URL(request.url).searchParams;

  const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));

  if (!parsed.success) {
    throw new ApiRouteError(formatZodError(parsed.error), { status: 400 });
  }

  return parsed.data;
}

export function parseRouteParams<T>(params: unknown, schema: ZodType<T>) {
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    throw new ApiRouteError(formatZodError(parsed.error), { status: 400 });
  }

  return parsed.data;
}

export function handleApiError(
  error: unknown,
  fallbackMessage = "Internal server error",
  extraHandlers?: {
    prismaConflictMessage?: string;
    prismaNotFoundMessage?: string;
  }
) {
  if (error instanceof ApiRouteError) {
    return apiError(error.message, error.status, error.extras);
  }

  if (error instanceof ZodError) {
    return apiError(formatZodError(error), 400);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002" && extraHandlers?.prismaConflictMessage) {
      return apiError(extraHandlers.prismaConflictMessage, 400);
    }

    if (error.code === "P2025" && extraHandlers?.prismaNotFoundMessage) {
      return apiError(extraHandlers.prismaNotFoundMessage, 404);
    }
  }

  console.error(fallbackMessage, error);
  return apiError(fallbackMessage, 500);
}

export { NO_STORE_HEADERS };
