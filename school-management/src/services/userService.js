import api from "./api";

export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function getUserById(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

export async function createUser(payload) {
  const response = await api.post("/users", payload);
  return response.data;
}

export async function updateUser(userId, payload) {
  const response = await api.put(`/users/${userId}`, payload);
  return response.data;
}