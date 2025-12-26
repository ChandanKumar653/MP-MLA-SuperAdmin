import api from "./axios";

export const apiEndpoints = {
  usersManagement: {
    getAll: (id) => api.get(`/admin/user?tenantId=${id}`),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post("/admin/user", data),
    update: (id, data) => api.put(`/admin/user/${id}`, data),
    remove: (id) => api.delete(`/admin/user/${id}`),
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
    getAllForUser: (tenantId) => api.get(`/user/tenant-schema/${tenantId}`),
    save: (data) => api.post("/admin/tenant-schema", data),
    deploySchema: (data) => api.post(`/admin/tenant-schema/deploy/${data?.tenantId}`, data),
  },
  submitForm:{
    submit: (data) => api.post("/admin/data/store", data),
    allData: (data) => api.post("/admin/all",data ),
  },
  dashboard:{
    getStats: (data) => api.post(`/admin/dashboard`,data),
  }
};
