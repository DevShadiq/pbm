import api from "./api";

export async function loginUser(payload) {
  const response = await api.post("/auth/login", payload);

  if (response.data.success) {
    localStorage.setItem("sms_token", response.data.token);
    localStorage.setItem("sms_user", JSON.stringify(response.data.user));
  }

  return response.data;
}

export function logoutUser() {
  localStorage.removeItem("sms_token");
  localStorage.removeItem("sms_user");
  localStorage.removeItem("sms_menus");
  localStorage.removeItem("sms_permissions");
}

export function getLoggedUser() {
  const user = localStorage.getItem("sms_user");
  return user ? JSON.parse(user) : null;
}
