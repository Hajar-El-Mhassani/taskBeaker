import { post } from './api';

/**
 * Sign up a new user
 */
export async function signup(email, password, name) {
  const response = await post('/auth/signup', {
    email,
    password,
    name,
  });

  return response.data;
}

/**
 * Log in a user
 */
export async function login(email, password) {
  const response = await post('/auth/login', {
    email,
    password,
  });

  return response.data;
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  const { get } = await import('./api');
  const response = await get('/auth/me');
  return response.data;
}
