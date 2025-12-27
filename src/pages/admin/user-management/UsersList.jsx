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
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

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
  const [isSaving, setIsSaving] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewAccessData, setViewAccessData] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    access: [],
    access_level: [],
  });

  /* ================= FETCH USERS ================= */
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

  /* ================= HELPERS ================= */
  const normalizePermission = (p) => (p === "read_write" ? "write" : p);

  const getAccess = (id) =>
    formData.access.find((a) => a.accessLevel === id)?.access || "none";

  const getDataScope = (id) =>
    formData.access.find((a) => a.accessLevel === id)?.dataToShow || "own";

  const hasDirectAccess = (id) =>
    formData.access.some((a) => a.accessLevel === id);

  const hasChildAccess = (menu) =>
    menu.children?.some((child) => hasDirectAccess(child.id));

  const getMenuDisplayAccess = (menu) => {
    if (hasDirectAccess(menu.id)) return getAccess(menu.id);
    if (hasChildAccess(menu)) return "read";
    return "none";
  };

  /* ================= ACCESS CHANGE ================= */
  const handleAccessChange = (node, accessType) => {
    setFormData((prev) => {
      let access = prev.access.filter((a) => a.accessLevel !== node.id);
      let access_level = prev.access_level.filter((id) => id !== node.id);

      if (accessType !== "none") {
        access.push({
          accessLevel: node.id,
          access: accessType,
          dataToShow: accessType === "write" ? "all" : "own",
        });
        access_level.push(node.id);
      }

      return { ...prev, access, access_level };
    });
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
          dataToShow: type === "write" ? "all" : "own",
        });
        access_level.push(m.id);
        if (m.children?.length) walk(m.children);
      });
    };

    walk(tabs);
    setFormData((p) => ({ ...p, access, access_level }));
  };

  const applyDataScopeToAll = (scope) => {
    setFormData((p) => ({
      ...p,
      access: p.access.map((a) => ({ ...a, dataToShow: scope })),
    }));
  };

  const clearAllAccess = () =>
    setFormData((p) => ({ ...p, access: [], access_level: [] }));

  /* ================= ADD ================= */
  const handleAdd = () => {
    setIsEdit(false);
    setSelectedUser(null);
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

  /* ================= EDIT (REBUILD FROM accessLevels) ================= */
  const handleEdit = (row) => {
    setIsEdit(true);
    setSelectedUser(row);

    const titleToId = {};
    const mapMenus = (list) => {
      list.forEach((m) => {
        titleToId[m.title] = m.id;
        if (m.children?.length) mapMenus(m.children);
      });
    };
    mapMenus(tabs);

    const rebuiltAccess = [];
    const walkLevels = (levels = []) => {
      levels.forEach((l) => {
        const id = titleToId[l.title];
        if (id) {
          const perm = normalizePermission(l.access_level);
          rebuiltAccess.push({
            accessLevel: id,
            access: perm,
            dataToShow: perm === "write" ? "all" : "own",
          });
        }
        if (l.children?.length) walkLevels(l.children);
      });
    };
    walkLevels(row.accessLevels || []);

    setFormData({
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      access: rebuiltAccess,
      access_level: row.access_level || [],
    });

    setOpenForm(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    await deleteUserApi.execute(row.userId);
    toast.success("User deleted");
    fetchUsers();
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
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


  const getViewDataScope = (menuTitle) => {
  // build title -> id map once
  const titleToId = {};
  const walk = (list) => {
    list.forEach((m) => {
      titleToId[m.title] = m.id;
      if (m.children?.length) walk(m.children);
    });
  };
  walk(tabs);

  const menuId = titleToId[menuTitle];
  if (!menuId) return null;

  return (
    selectedUser?.access?.find((a) => a.accessLevel === menuId)?.dataToShow ||
    null
  );
};


 const renderViewTree = (node, level = 0) => {
  const scope = getViewDataScope(node.title);

  return (
    <Box key={node.title} sx={{ ml: level * 3, mt: 1 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography sx={{ flex: 1, fontWeight: level === 0 ? 600 : 400 }}>
          {node.title}
        </Typography>

        {/* Permission chip */}
        <Chip
          size="small"
          label={normalizePermission(node.access_level).toUpperCase()}
          color={normalizePermission(node.access_level) === "write" ? "success" : "info"}
          variant="outlined"
        />

        {/* Data scope chip */}
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
          label={p.value === "active" ? "Active" : "Inactive"}
          size="small"
          color={p.value === "active" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "accessView",
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
              <TextField fullWidth label="Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Status" value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* SHORTCUTS */}
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => applyAccessToAll("read")} startIcon={<LockOpenIcon />}>
                Grant All Read
              </Button>
              <Button size="small" onClick={() => applyAccessToAll("write")} startIcon={<LockIcon />}>
                Grant All Write
              </Button>
              <Button size="small" color="error" onClick={clearAllAccess} startIcon={<ClearAllIcon />}>
                Clear All
              </Button>
            </Stack>
          </Box>

          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => applyDataScopeToAll("own")}>
                Set All → Own Data
              </Button>
              <Button size="small" variant="outlined" onClick={() => applyDataScopeToAll("all")}>
                Set All → All Data
              </Button>
            </Stack>
          </Box>

          {/* PERMISSIONS */}
          <Stack spacing={2}>
            {tabs.map((menu) => (
              <Paper key={menu.id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography sx={{ flex: 1 }}>{menu.title}</Typography>

                  <Select
                    size="small"
                    value={getMenuDisplayAccess(menu)}
                    onChange={(e) => handleAccessChange(menu, e.target.value)}
                  >
                    <MenuItem value="none">No Access</MenuItem>
                    <MenuItem value="read">Read</MenuItem>
                    <MenuItem value="write">Write</MenuItem>
                  </Select>

                  {getMenuDisplayAccess(menu) !== "none" && (
                    // <Tooltip title="Controls whose data the user can see">
                      <Select
                        size="small"
                        value={getDataScope(menu.id)}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            access: p.access.map((a) =>
                              a.accessLevel === menu.id
                                ? { ...a, dataToShow: e.target.value }
                                : a
                            ),
                          }))
                        }
                      >
                        <MenuItem value="own">Own Data</MenuItem>
                        <MenuItem value="all">All Data</MenuItem>
                      </Select>
                    // </Tooltip>
                  )}
                </Box>

                {menu.children?.map((c) => (
                  <Box key={c.id} display="flex" ml={4} mt={1} gap={2}>
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
                      // <Tooltip title="Controls whose data the user can see">
                        <Select
                          size="small"
                          value={getDataScope(c.id)}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              access: p.access.map((a) =>
                                a.accessLevel === c.id
                                  ? { ...a, dataToShow: e.target.value }
                                  : a
                              ),
                            }))
                          }
                        >
                          <MenuItem value="own">Own Data</MenuItem>
                          <MenuItem value="all">All Data</MenuItem>
                        </Select>
                      // </Tooltip>
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
          {viewAccessData.length
            ? viewAccessData.map((n) => renderViewTree(n))
            : <Typography>No permissions assigned</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccessView(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
