export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    code?: ErrorCode;
    errors?: Record<string, string>;
    pagination?: PaginationMeta;
};

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export enum ErrorCode {
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    DUPLICATE = 'DUPLICATE',
    VALIDATION = 'VALIDATION',
    INTERNAL = 'INTERNAL',
}
