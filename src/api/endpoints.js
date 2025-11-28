import api from "./axios";

export const apiEndpoints = {
  users: {
    getAll: () => api.get("/users"),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post("/users", data),
    update: (id, data) => api.put(`/users/${id}`, data),
    remove: (id) => api.delete(`/users/${id}`),
  },
  organizations: {
    getAll: () => api.get("/super-admin/tenant"),
    getById: (id) => api.get(`/super-admin/tenant/${id}`),
    create: (data) => api.post("/super-admin/tenant", data),
    update: (id, data) => api.put(`/users/${id}`, data),
    remove: (id) => api.delete(`/users/${id}`),
  },

  auth: {
    superadminLogin: (data) => api.post("/super-admin/login", data),
    adminLogin: (data) => api.post("/admin/login", data),
    userLogin: (data) => api.post("/user/login", data),
    register: (data) => api.post("/auth/register", data),
  },
   menus: {
    getAll: (tenantId) => api.get(`/admin/tenant-schema/${tenantId}`),
    save: (data) => api.post("/admin/tenant-schema", data),
  },
};
