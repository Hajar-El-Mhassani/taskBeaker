const API_URL = process.env.NEXT_PUBLIC_API_URL;

let authTokens = null;

/**
 * Set authentication tokens
 */
export function setTokens(tokens) {
  authTokens = tokens;
}

/**
 * Get current tokens
 */
export function getTokens() {
  return authTokens;
}

/**
 * Clear authentication tokens
 */
export function clearTokens() {
  authTokens = null;
}

/**
 * Make an API request
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if tokens are available
  if (authTokens?.accessToken) {
    headers.Authorization = `Bearer ${authTokens.accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * GET request
 */
export async function get(endpoint) {
  return request(endpoint, {
    method: 'GET',
  });
}

/**
 * POST request
 */
export async function post(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request
 */
export async function patch(endpoint, data) {
  return request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export async function del(endpoint) {
  return request(endpoint, {
    method: 'DELETE',
  });
}

/**
 * Upload file (multipart/form-data)
 */
export async function uploadFile(endpoint, file, fieldName = 'file') {
  const url = `${API_URL}${endpoint}`;
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers = {};

  // Add authorization header if tokens are available
  if (authTokens?.accessToken) {
    headers.Authorization = `Bearer ${authTokens.accessToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error?.message || 'Upload failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}
