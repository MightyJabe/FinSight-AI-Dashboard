/**
 * Simple API client for making HTTP requests
 */

import { auth } from './firebase';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get Firebase ID token for authenticated requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return {};
}

/**
 * Make a GET request
 */
export async function apiGet(url: string, options?: RequestInit): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `GET ${url} failed: ${response.status} ${response.statusText}`,
      response.status,
      response
    );
  }

  return response;
}

/**
 * Make a POST request
 */
export async function apiPost(url: string, data?: any, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...(data && { body: JSON.stringify(data) }),
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `POST ${url} failed: ${response.status} ${response.statusText}`,
      response.status,
      response
    );
  }

  return response;
}

/**
 * Make a PUT request
 */
export async function apiPut(url: string, data?: any, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...(data && { body: JSON.stringify(data) }),
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `PUT ${url} failed: ${response.status} ${response.statusText}`,
      response.status,
      response
    );
  }

  return response;
}

/**
 * Make a DELETE request
 */
export async function apiDelete(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(
      `DELETE ${url} failed: ${response.status} ${response.statusText}`,
      response.status,
      response
    );
  }

  return response;
}
