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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";

import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

export default function UserList() {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId;
  const tabs = menus?.tabs || [];

  const getUsersApi = useApi(apiEndpoints.usersManagement.getAll, {
    immediate: false,
  });
  const createUserApi = useApi(apiEndpoints.usersManagement.create, {
    immediate: false,
  });
  const updateUserApi = useApi(apiEndpoints.usersManagement.update, {
    immediate: false,
  });
  const deleteUserApi = useApi(apiEndpoints.usersManagement.remove, {
    immediate: false,
  });

  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
      }))
    );
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  /* ================= ACCESS HELPERS ================= */
  const getAccess = (id) =>
    formData.access.find((a) => a.accessLevel === id)?.access || "none";

  const hasDirectAccess = (id) =>
    formData.access.some((a) => a.accessLevel === id);

  const hasChildAccess = (menu) =>
    menu.children?.some((child) => hasDirectAccess(child.id));

  const getMenuDisplayAccess = (menu) => {
    if (hasDirectAccess(menu.id)) return getAccess(menu.id);
    if (hasChildAccess(menu)) return "read";
    return "none";
  };

  const handleAccessChange = (node, accessType, parent = null) => {
    setFormData((prev) => {
      let access = [...prev.access];
      let titles = [...prev.access_level];

      access = access.filter((a) => a.accessLevel !== node.id);
      titles = titles.filter((t) => t !== node.title);

      if (!parent && accessType !== "none") {
        node.children?.forEach((sub) => {
          access = access.filter((a) => a.accessLevel !== sub.id);
          titles = titles.filter((t) => t !== sub.title);
        });
      }

      if (accessType !== "none") {
        access.push({ accessLevel: node.id, access: accessType });
        titles.push(node.title);
      }

      return { ...prev, access, access_level: titles };
    });
  };

  /* ================= BULK ACTIONS ================= */
  const grantAll = (type) => {
    const access = [];
    const titles = [];

    tabs.forEach((menu) => {
      access.push({ accessLevel: menu.id, access: type });
      titles.push(menu.title);
    });

    setFormData((prev) => ({ ...prev, access, access_level: titles }));
  };

  const clearAll = () => {
    setFormData((prev) => ({ ...prev, access: [], access_level: [] }));
  };

  /* ================= ACCESS UI ================= */
  const renderAccessTree = (list) =>
    list.map((menu) => {
      const inherited = hasChildAccess(menu);
      const direct = hasDirectAccess(menu.id);

      return (
        <Paper
          key={menu.id}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fcfbff",
          }}
        >
          {/* MENU */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>
              {menu.title}
              {inherited && !direct && (
                <Typography
                  component="span"
                  sx={{ ml: 1, fontSize: 12, color: "text.secondary" }}
                >
                  (inherited)
                </Typography>
              )}
            </Typography>

            <Select
              size="small"
              value={getMenuDisplayAccess(menu)}
              disabled={inherited && !direct}
              onChange={(e) => handleAccessChange(menu, e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="none">No Access</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="read_write">Read & Write</MenuItem>
            </Select>
          </Box>

          {/* SUBMENUS */}
          {!direct && menu.children?.length > 0 && (
            <Box
              sx={{
                ml: 2,
                mt: 1,
                pl: 2,
                borderLeft: "2px solid #e9d5ff",
              }}
            >
              {menu.children.map((sub) => (
                <Box
                  key={sub.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mt: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#a855f7",
                      mr: 1.5,
                      mt: "2px",
                    }}
                  />

                  <Typography sx={{ flex: 1 }} variant="body2">
                    {sub.title}
                  </Typography>

                  <Select
                    size="small"
                    value={getAccess(sub.id)}
                    onChange={(e) =>
                      handleAccessChange(sub, e.target.value, menu)
                    }
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="none">No Access</MenuItem>
                    <MenuItem value="read">Read</MenuItem>
                    <MenuItem value="read_write">Read & Write</MenuItem>
                  </Select>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      );
    });

  /* ================= TABLE ================= */
  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "phone", headerName: "Phone", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "active" ? "Active" : "Inactive"}
          size="small"
          color={params.value === "active" ? "success" : "error"}
          variant="outlined"
        />
      ),
    },
    {
      field: "access_level",
      headerName: "Access",
      flex: 2,
      renderCell: (params) =>
        params.value?.map((v) => (
          <Chip key={v} label={v} size="small" sx={{ mr: 0.5 }} />
        )),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => {
              setSelectedUser(params.row);
              setOpenDelete(true);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* ================= ADD / EDIT ================= */
  const handleAdd = () => {
    setIsEdit(false);
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
    setFormData({
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      access: row.access || [],
      access_level: row.access_level || [],
    });
    setOpenForm(true);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (isEdit) {
        await updateUserApi.execute(selectedUser.userId, formData);
        toast.success("User updated");
      } else {
        await createUserApi.execute({
          ...formData,
          createdBy: tenantId,
        });
        toast.success("User created");
      }
      setOpenForm(false);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">User Management</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleAdd}>
          Add User
        </Button>
      </Box>

      <Box sx={{ height: 450 }}>
        <DataGrid rows={rows} columns={columns} />
      </Box>

      {/* FORM DIALOG */}
      <Dialog
        open={openForm}
        onClose={() => !isSaving && setOpenForm(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          <Typography variant="h6">
            {isEdit ? "Edit User" : "Create New User"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user details and menu access permissions
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={4}>
            {/* USER DETAILS */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                User Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
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
            </Box>

            <Divider />

            {/* PERMISSIONS */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Permissions
              </Typography>
              {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure access to menus and submenus for this user.
              </Typography> */}
              {/* RIGHT-ALIGNED BULK ACTIONS */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => grantAll("read")}
                  >
                    Grant All – Read
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => grantAll("read_write")}
                  >
                    Grant All – Read & Write
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={clearAll}
                  >
                    Clear All
                  </Button>
                </Stack>
              </Box>

              <Stack spacing={2}>{renderAccessTree(tabs)}</Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving && <CircularProgress size={18} />}
          >
            {isSaving ? "Saving..." : "Save User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
