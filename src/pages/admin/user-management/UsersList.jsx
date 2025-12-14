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
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import toast from "react-hot-toast";
import AddIcon from '@mui/icons-material/Add';

import copy from "copy-to-clipboard";

import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

export default function UserList() {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId;

  const getUsersApi = useApi(apiEndpoints.usersManagement.getAll, { immediate: false });
  const createUserApi = useApi(apiEndpoints.usersManagement.create, { immediate: false });
  const updateUserApi = useApi(apiEndpoints.usersManagement.update, { immediate: false });
  const deleteUserApi = useApi(apiEndpoints.usersManagement.remove, { immediate: false });

  const [rows, setRows] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openCredentials, setOpenCredentials] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const[refresh, setRefresh]=useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
  });

  const [credentials, setCredentials] = useState({
    email: "",
    userId: "",
    password: "",
  });

  useEffect(() => {
    if (!tenantId) return;

    const fetchUsers = async () => {
      try {
        const res = await getUsersApi.execute(tenantId);
        const list = res?.data || [];

        setRows(
          list.map((u) => ({
            id: u.userId,
            userId: u.userId,
            name: u.name,
            email: u.email,
            phone: u.phone,
            status: u.status,
          }))
        );
      } catch (err) {
        console.error("Fetch users failed", err);
      }
    };

    fetchUsers();
  }, [tenantId,refresh]);

  const handleAdd = () => {
    setIsEdit(false);
    setFormData({ name: "", email: "", phone: "", status: "" });
    setOpenForm(true);
  };

  const handleEdit = (row) => {
    setIsEdit(true);
    setSelectedUser(row);
    setFormData(row);
    setOpenForm(true);
    setRefresh(!refresh);
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await updateUserApi.execute(selectedUser.userId, formData);
        setRows((prev) =>
          prev.map((r) =>
            r.userId === selectedUser.userId ? { ...r, ...formData } : r
          )
        );
        setOpenForm(false);
      } else {
        const res = await createUserApi.execute({
          ...formData,
          createdBy: tenantId,
        });

        const { userId, defaultPassword } = res;

        setRows((prev) => [
          ...prev,
          { id: userId, userId, ...formData },
        ]);

        setCredentials({
          email: formData.email,
          userId,
          password: defaultPassword,
        });

        setOpenForm(false);
        setOpenCredentials(true);
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

const handleDeleteConfirm = async () => {
  try {
    await deleteUserApi.execute(selectedUser.userId);

    toast.success("User deleted successfully");

    setRefresh(!refresh);

    setOpenDelete(false);
  } catch (error) {
    console.error("Delete failed:", error);

    toast.error(
      error?.message || "Failed to delete user. Please try again."
    );
  }
};

  const handleCopyAll = () => {
    const text = `
Email: ${credentials.email}
User ID: ${credentials.userId}
Password: ${credentials.password}
    `;
    copy(text.trim());
    setSnackOpen(true);
  };

  const columns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "userId", headerName: "User ID", flex: 1 },
    { field: "phone", headerName: "Phone", flex: 1 },
    { field: "status", headerName: "Status", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => { setSelectedUser(params.row); setOpenDelete(true); }}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">User Management</Typography>
        <Button variant="contained" onClick={handleAdd}><AddIcon/> Add User</Button>
      </Box>

      <Box sx={{ height: 450 }}>
        <DataGrid rows={rows} columns={columns} loading={getUsersApi.loading} />
      </Box>

      {/* ADD / EDIT */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth>
        <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        <DialogContent>
          {["name", "email", "phone"].map((field) => (
            <TextField
              key={field}
              fullWidth
              margin="dense"
              label={field.toUpperCase()}
              name={field}
              value={formData[field]}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            />
          ))}
          <TextField fullWidth margin="dense" label="Status" select name="status" value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* DELETE */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Delete <b>{selectedUser?.name}</b> permanently?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* CREDENTIALS */}
      <Dialog open={openCredentials} disableEscapeKeyDown>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" /> User Created Successfully
        </DialogTitle>
        <DialogContent>
          <Typography color="error" sx={{ mb: 2 }}>
            Copy credentials now. They will not be shown again.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {Object.entries(credentials).map(([key, value]) => (
            <TextField key={key} fullWidth margin="dense" label={key.toUpperCase()} value={value} InputProps={{ readOnly: true }} />
          ))}

          <Button
            fullWidth
            startIcon={<ContentCopyIcon />}
            sx={{ mt: 2 }}
            variant="contained"
            onClick={handleCopyAll}
          >
            Copy All Credentials
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCredentials(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR */}
      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
        <Alert severity="success">Credentials copied successfully</Alert>
      </Snackbar>
    </Paper>
  );
}
