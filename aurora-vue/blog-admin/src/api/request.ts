import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import http from './http'
import type { ApiFailure, ApiResponse, ApiResult, RequestOptions } from './types'

const FALLBACK_MESSAGE = '请求失败，请稍后再试'

const resolveErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message || '')
    if (message) {
      return message
    }
  }
  return FALLBACK_MESSAGE
}

const toFailure = (error: unknown, options?: RequestOptions): ApiFailure => {
  const message = resolveErrorMessage(error)
  if (!options?.silent) {
    ElMessage.error(message)
  }
  return {
    ok: false,
    message,
    error,
  }
}

const toResult = <T>(
  response: AxiosResponse<ApiResponse<T>>,
  options?: RequestOptions,
): ApiResult<T> => {
  const payload = response.data
  if (!payload || typeof payload.flag !== 'boolean') {
    return toFailure('响应格式异常', options)
  }
  if (!payload.flag) {
    const message = payload.message || '操作失败'
    const shouldNotify = !options?.silent && payload.code !== 40001 && payload.code !== 50000
    if (shouldNotify) {
      ElMessage.error(message)
    }
    return {
      ok: false,
      message,
      code: payload.code,
      raw: payload as ApiResponse<unknown>,
    }
  }
  return {
    ok: true,
    data: payload.data,
    message: payload.message,
    raw: payload,
  }
}

const toErrorResult = <T>(
  error: AxiosError<ApiResponse<T>> | unknown,
  options?: RequestOptions,
) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as AxiosError<ApiResponse<T>>).response
    if (response?.data) {
      return toResult(response as AxiosResponse<ApiResponse<T>>, options)
    }
  }
  return toFailure(error, options)
}

export const request = {
  async get<T>(url: string, config?: AxiosRequestConfig, options?: RequestOptions) {
    try {
      const response = await http.get<ApiResponse<T>>(url, config)
      return toResult(response, options)
    } catch (error) {
      return toErrorResult<T>(error, options)
    }
  },
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
    options?: RequestOptions,
  ) {
    try {
      const response = await http.post<ApiResponse<T>>(url, data, config)
      return toResult(response, options)
    } catch (error) {
      return toErrorResult<T>(error, options)
    }
  },
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
    options?: RequestOptions,
  ) {
    try {
      const response = await http.put<ApiResponse<T>>(url, data, config)
      return toResult(response, options)
    } catch (error) {
      return toErrorResult<T>(error, options)
    }
  },
  async delete<T, D = unknown>(
    url: string,
    config?: AxiosRequestConfig<D>,
    options?: RequestOptions,
  ) {
    try {
      const response = await http.delete<ApiResponse<T>>(url, config)
      return toResult(response, options)
    } catch (error) {
      return toErrorResult<T>(error, options)
    }
  },
}
