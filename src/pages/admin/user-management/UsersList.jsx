import React, { useContext, useEffect, useRef, useState } from "react";
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

  const getUsersApi = useApi(apiEndpoints.usersManagement.getAll, { immediate: false });
  const createUserApi = useApi(apiEndpoints.usersManagement.create, { immediate: false });
  const updateUserApi = useApi(apiEndpoints.usersManagement.update, { immediate: false });
  const deleteUserApi = useApi(apiEndpoints.usersManagement.remove, { immediate: false });

  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
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

  /* 🔹 DataGrid resize fix */
  const gridRef = useRef(null);
  const [gridKey, setGridKey] = useState(0);

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

  /* 🔹 Observe resize (sidebar expand/shrink) */
  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new ResizeObserver(() => {
      setGridKey((k) => k + 1);
    });

    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

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

  const handleAccessChange = (node, accessType) => {
    setFormData((prev) => {
      let access = [...prev.access];
      let titles = [...prev.access_level];

      access = access.filter((a) => a.accessLevel !== node.id);
      titles = titles.filter((t) => t !== node.title);

      if (accessType !== "none") {
        access.push({ accessLevel: node.id, access: accessType });
        titles.push(node.title);
      }

      return { ...prev, access, access_level: titles };
    });
  };

  /* ================= RENDER ACCESS TREE ================= */
  const renderAccessTree = (menu) => (
    <Paper key={menu.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ flex: 1, fontWeight: 600 }}>{menu.title}</Typography>
        <Select
          size="small"
          value={getMenuDisplayAccess(menu)}
          onChange={(e) => handleAccessChange(menu, e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="none">No Access</MenuItem>
          <MenuItem value="read">Read</MenuItem>
          <MenuItem value="read_write">Read & Write</MenuItem>
        </Select>
      </Box>

      {menu.children?.map((sub) => (
        <Box key={sub.id} sx={{ display: "flex", mt: 1, ml: 3 }}>
          <Typography sx={{ flex: 1 }}>{sub.title}</Typography>
          <Select
            size="small"
            value={getAccess(sub.id)}
            onChange={(e) => handleAccessChange(sub, e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="none">No Access</MenuItem>
            <MenuItem value="read">Read</MenuItem>
            <MenuItem value="read_write">Read & Write</MenuItem>
          </Select>
        </Box>
      ))}
    </Paper>
  );

  /* ================= VIEW PERMISSIONS ================= */
  const handleViewAccess = (row) => {
    const parsed = Object.entries(row.accessLevels || {}).map(
      ([menuId, permission]) => ({ menuId, permission })
    );
    setViewAccessData(parsed);
    setOpenAccessView(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    try {
      await deleteUserApi.execute(selectedUser.userId);
      toast.success("User deleted");
      setOpenDelete(false);
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

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
      field: "accessView",
      headerName: "Access",
      width: 120,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => handleViewAccess(params.row)}>
          View
        </Button>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => {
            setSelectedUser(params.row);
            setOpenDelete(true);
          }}>
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
      access: [],
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
        await createUserApi.execute({ ...formData, createdBy: tenantId });
        toast.success("User created");
      }
      setOpenForm(false);
      fetchUsers();
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <Paper sx={{ p: 3, width: "100%", minWidth: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">User Management</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={handleAdd}>
          Add User
        </Button>
      </Box>

      <Box ref={gridRef} sx={{ height: 450, width: "100%" }}>
        <DataGrid
          key={gridKey}
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
        />
      </Box>

      {/* VIEW PERMISSIONS */}
      <Dialog open={openAccessView} keepMounted onClose={() => setOpenAccessView(false)} fullWidth maxWidth="sm">
        <DialogTitle>User Permissions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {viewAccessData.map((p, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                <Typography fontWeight={500}>{p.menuId}</Typography>
                <Chip
                  label={p.permission === "read" ? "Read" : "Read & Write"}
                  color={p.permission === "read_write" ? "success" : "primary"}
                  size="small"
                  variant="outlined"
                />
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAccessView(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE */}
      <Dialog open={openDelete} keepMounted onClose={() => setOpenDelete(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <b>{selectedUser?.name}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD / EDIT */}
      <Dialog open={openForm} keepMounted onClose={() => !isSaving && setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Stack spacing={2}>{tabs.map(renderAccessTree)}</Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
