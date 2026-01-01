import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Divider,
  Select,
  Chip,
  Stack,
  Grid,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

/* ================= HELPERS ================= */

const normalizeAccessLevel = (al) => {
  if (!al) return null;
  if (typeof al === "string") return { access: al, dataToShow: "own" };
  return { access: al.access, dataToShow: al.dataToShow || "own" };
};

const buildTitleToIdMap = (tabs) => {
  const map = {};
  const walk = (list) => {
    list.forEach((m) => {
      map[m.title] = m.id;
      if (m.children?.length) walk(m.children);
    });
  };
  walk(tabs);
  return map;
};

const flattenAccessLevels = (accessLevels, titleToId) => {
  const result = [];
  const walk = (list = []) => {
    list.forEach((n) => {
      const menuId = titleToId[n.title];
      const norm = normalizeAccessLevel(n.access_level);
      if (menuId && norm) {
        result.push({
          accessLevel: menuId,
          access: norm.access,
          dataToShow: norm.dataToShow,
        });
      }
      if (n.children?.length) walk(n.children);
    });
  };
  walk(accessLevels);
  return result;
};

const normalizePermission = (p) => (p === "read_write" ? "write" : p);

const getPermissionFromNode = (node) => {
  const al = node?.access_level;
  if (!al) return "none";
  if (typeof al === "string") return al;
  return al.access || "none";
};

const getScopeFromNode = (node) =>
  typeof node?.access_level === "object" ? node.access_level.dataToShow : null;

const renderViewTree = (node, level = 0) => {
  const permission = normalizePermission(getPermissionFromNode(node));
  const scope = getScopeFromNode(node);

  return (
    <Box key={node.title} sx={{ ml: level * 3, mt: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ flex: 1, fontWeight: level === 0 ? 600 : 400 }}>
          {node.title}
        </Typography>

        {permission !== "none" && (
          <Chip
            size="small"
            label={permission.toUpperCase()}
            color={permission === "write" ? "success" : "info"}
            variant="outlined"
          />
        )}

        {scope && (
          <Tooltip
            title={
              scope === "all"
                ? "User can see all users & admin data"
                : "User can see only their own data"
            }
          >
            <Chip
              size="small"
              label={scope === "all" ? "ALL DATA" : "OWN DATA"}
              color={scope === "all" ? "warning" : "default"}
              variant="outlined"
            />
          </Tooltip>
        )}
      </Box>

      {node.children?.map((c) => renderViewTree(c, level + 1))}
    </Box>
  );
};

/* ================= COMPONENT ================= */

export default function UserList() {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId;
  const tabs = menus?.tabs || [];

  const getUsersApi = useApi(apiEndpoints.usersManagement.getAll, { immediate: false });
  const createUserApi = useApi(apiEndpoints.usersManagement.create, { immediate: false });
  const updateUserApi = useApi(apiEndpoints.usersManagement.update, { immediate: false });
  const deleteUserApi = useApi(apiEndpoints.usersManagement.remove, { immediate: false });

  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openAccessView, setOpenAccessView] = useState(false);
  const [viewAccessData, setViewAccessData] = useState([]);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    access: [],
    access_level: [],
  });

  /* ================= FETCH ================= */

  const fetchUsers = async () => {
    if (!tenantId) return;
    const res = await getUsersApi.execute(tenantId);
    setRows(
      (res?.data || []).map((u) => ({
        id: u.userId,
        ...u,
        createdAt: u.tstamp
          ? new Date(u.tstamp).toLocaleDateString("en-GB")
          : "",
      }))
    );
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  /* ================= ACCESS HELPERS ================= */

  const getAccess = (id) =>
    formData.access.find((a) => a.accessLevel === id)?.access || "none";

  const getScope = (id) =>
    formData.access.find((a) => a.accessLevel === id)?.dataToShow || "own";

  const hasChildAccess = (menu) =>
    menu.children?.some((c) => getAccess(c.id) !== "none");

  const getMenuAccess = (menu) => {
    const own = getAccess(menu.id);
    if (own !== "none") return own;
    if (hasChildAccess(menu)) return "read";
    return "none";
  };

  /* ================= ACCESS HANDLERS ================= */

  const handleAccessChange = (node, accessType) => {
    setFormData((prev) => {
      let access = prev.access.filter((a) => a.accessLevel !== node.id);
      let access_level = prev.access_level.filter((id) => id !== node.id);

      if (accessType !== "none") {
        access.push({
          accessLevel: node.id,
          access: accessType,
          dataToShow: "own",
        });
        access_level.push(node.id);
      }

      return { ...prev, access, access_level };
    });

    setErrors((p) => ({ ...p, access: undefined }));
  };

  const handleScopeChange = (node, scope) => {
    setFormData((prev) => ({
      ...prev,
      access: prev.access.map((a) =>
        a.accessLevel === node.id ? { ...a, dataToShow: scope } : a
      ),
    }));
  };

  /* ================= SHORTCUTS ================= */

  const applyAccessToAll = (type) => {
    const access = [];
    const access_level = [];

    const walk = (list) => {
      list.forEach((m) => {
        access.push({
          accessLevel: m.id,
          access: type,
          dataToShow: "own",
        });
        access_level.push(m.id);
        if (m.children?.length) walk(m.children);
      });
    };

    walk(tabs);
    setFormData((p) => ({ ...p, access, access_level }));
    setErrors((p) => ({ ...p, access: undefined }));
  };

  const applyScopeToAll = (scope) => {
    setFormData((p) => ({
      ...p,
      access: p.access.map((a) => ({ ...a, dataToShow: scope })),
    }));
  };

  const clearAll = () =>
    setFormData((p) => ({ ...p, access: [], access_level: [] }));

  /* ================= ADD / EDIT ================= */

  const handleAdd = () => {
    setIsEdit(false);
    setSelectedUser(null);
    setErrors({});
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: "active",
      access: [],
      access_level: [],
    });
    setOpenForm(true);
  };

  const handleEdit = (row) => {
    setIsEdit(true);
    setSelectedUser(row);
    setErrors({});

    const titleToId = buildTitleToIdMap(tabs);
    const rebuiltAccess = flattenAccessLevels(row.accessLevels || [], titleToId);

    setFormData({
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      access: rebuiltAccess,
      access_level: rebuiltAccess.map((a) => a.accessLevel),
    });

    setOpenForm(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (row) => {
    const res = await Swal.fire({
      title: "Delete user?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (!res.isConfirmed) return;

    await deleteUserApi.execute(row.userId);
    toast.success("User deleted");
    fetchUsers();
  };

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    const e = {};

    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) {
      e.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      e.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      e.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      e.phone = "Phone must be 10 digits";
    }

    if (!formData.access.length) {
      e.access = "At least one permission is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setIsSaving(true);

      if (isEdit) {
        await updateUserApi.execute({
          userId: selectedUser.userId,
          ...formData,
        });
      } else {
        await createUserApi.execute({
          ...formData,
          createdBy: tenantId,
        });
      }

      toast.success(isEdit ? "User updated" : "User created");
      setOpenForm(false);
      fetchUsers();
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= TABLE ================= */

  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "createdAt", headerName: "Created On", width: 130 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value === "active" ? "Active" : "Inactive"}
          color={p.value === "active" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "access",
      headerName: "Access",
      width: 120,
      renderCell: (p) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setViewAccessData(p.row.accessLevels || []);
            setOpenAccessView(true);
          }}
        >
          View
        </Button>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      renderCell: (p) => (
        <>
          <IconButton onClick={() => handleEdit(p.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(p.row)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* ================= RENDER ================= */

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">User Management</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleAdd}>
          Add User
        </Button>
      </Box>

      <Box sx={{ height: 450 }}>
        <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick />
      </Box>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={openForm} fullWidth maxWidth="md">
        <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                error={!!errors.name}
                helperText={errors.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                error={!!errors.email}
                helperText={errors.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                error={!!errors.phone}
                helperText={errors.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {errors.access && (
            <Typography color="error" mb={1}>
              {errors.access}
            </Typography>
          )}

          {/* SHORTCUTS */}
          <Stack direction="row" spacing={1} mb={2} justifyContent="flex-end">
            <Button size="small" onClick={() => applyAccessToAll("read")} startIcon={<LockOpenIcon />}>
              Grant All Read
            </Button>
            <Button size="small" onClick={() => applyAccessToAll("write")} startIcon={<LockIcon />}>
              Grant All Write
            </Button>
            <Button size="small" color="error" onClick={clearAll} startIcon={<ClearAllIcon />}>
              Clear All
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} mb={2} justifyContent="flex-end">
  <Button
    size="small"
    variant="outlined"
    onClick={() => applyScopeToAll("own")}
  >
    Set All → Own Data
  </Button>

  <Button
    size="small"
    variant="outlined"
    onClick={() => applyScopeToAll("all")}
  >
    Set All → All Data
  </Button>
</Stack>


          <Stack spacing={2}>
            {tabs.map((menu) => (
              <Paper key={menu.id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" gap={2}>
                  <Typography sx={{ flex: 1 }}>{menu.title}</Typography>

                  <Select
                    size="small"
                    value={getMenuAccess(menu)}
                    onChange={(e) => handleAccessChange(menu, e.target.value)}
                  >
                    <MenuItem value="none">No Access</MenuItem>
                    <MenuItem value="read">Read</MenuItem>
                    <MenuItem value="write">Write</MenuItem>
                  </Select>

                  {getMenuAccess(menu) !== "none" && (
                    <Select
                      size="small"
                      value={getScope(menu.id)}
                      onChange={(e) => handleScopeChange(menu, e.target.value)}
                    >
                      <MenuItem value="own">Own</MenuItem>
                      <MenuItem value="all">All</MenuItem>
                    </Select>
                  )}
                </Box>

                {menu.children?.map((c) => (
                  <Box key={c.id} ml={4} mt={1} display="flex" gap={2}>
                    <Typography sx={{ flex: 1 }}>{c.title}</Typography>
                    <Select
                      size="small"
                      value={getAccess(c.id)}
                      onChange={(e) => handleAccessChange(c, e.target.value)}
                    >
                      <MenuItem value="none">No Access</MenuItem>
                      <MenuItem value="read">Read</MenuItem>
                      <MenuItem value="write">Write</MenuItem>
                    </Select>

                    {getAccess(c.id) !== "none" && (
                      <Select
                        size="small"
                        value={getScope(c.id)}
                        onChange={(e) => handleScopeChange(c, e.target.value)}
                      >
                        <MenuItem value="own">Own</MenuItem>
                        <MenuItem value="all">All</MenuItem>
                      </Select>
                    )}
                  </Box>
                ))}
              </Paper>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW PERMISSIONS */}
      <Dialog open={openAccessView} onClose={() => setOpenAccessView(false)} fullWidth maxWidth="sm">
        <DialogTitle>User Permissions</DialogTitle>
        <DialogContent dividers>
          {viewAccessData.length ? (
            viewAccessData.map((n) => renderViewTree(n))
          ) : (
            <Typography>No permissions assigned</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccessView(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
