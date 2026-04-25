import request from "./request";

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export function register(data: RegisterParams) {
  return request.post("/users/register", data);
}

export interface LoginParams {
  username: string;
  password: string;
}

export function login(data: LoginParams) {
  // /users/login uses OAuth2PasswordRequestForm, requires x-www-form-urlencoded
  const form = new (globalThis as any).URLSearchParams();
  form.set("username", data.username);
  form.set("password", data.password);
  return request.post("/users/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

export interface GoogleLoginParams {
  id_token: string;
}

export function googleLogin(data: GoogleLoginParams) {
  return request.post("/users/google-login", data);
}
