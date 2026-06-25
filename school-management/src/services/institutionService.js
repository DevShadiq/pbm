import api from "./api";

export const getInstitutions = () => {
  return api.get("/institutions");
};

export const getInstitutionById = (id) => {
  return api.get(`/institutions/${id}`);
};

export const createInstitution = (payload) => {
  return api.post("/institutions", payload);
};

export const updateInstitution = (id, payload) => {
  return api.put(`/institutions/${id}`, payload);
};

export const deleteInstitution = (id) => {
  return api.delete(`/institutions/${id}`);
};