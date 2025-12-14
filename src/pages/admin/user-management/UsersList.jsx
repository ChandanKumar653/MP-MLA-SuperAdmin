import React, { useContext, useState } from "react";
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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { MenuContext } from "../../../context/MenuContext";

/* =======================
   DUMMY DATA
======================= */
const initialRows = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",
    status: "Active",
    createdBy: "TENANT_001",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "9123456789",
    status: "Inactive",
    createdBy: "TENANT_001",
  },
];

export default function UserList() {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId || "TENANT_001";

  const [rows, setRows] = useState(initialRows);

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
  });

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.phone &&
    formData.status;

  /* =======================
     HANDLERS
  ======================= */

  const handleAdd = () => {
    setIsEdit(false);
    setFormData({ name: "", email: "", phone: "", status: "" });
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
    });
    setOpenForm(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedUser(row);
    setOpenDelete(true);
  };

  const handleDeleteConfirm = () => {
    setRows((prev) => prev.filter((r) => r.id !== selectedUser.id));
    setOpenDelete(false);
    setSelectedUser(null);
  };

  const handleSave = () => {
    if (!isFormValid) return;

    if (isEdit) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === selectedUser.id ? { ...r, ...formData } : r
        )
      );
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          ...formData,
          createdBy: tenantId,
        },
      ]);
    }

    setOpenForm(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* =======================
     COLUMNS
  ======================= */

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "phone", headerName: "Phone", width: 150 },
    { field: "status", headerName: "Status", width: 120 },
    { field: "createdBy", headerName: "Created By", width: 150 },

    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => handleDeleteClick(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* =======================
     UI
  ======================= */

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">User List</Typography>
        <Button variant="contained" onClick={handleAdd}>
          Add
        </Button>
      </Box>

      {/* Table */}
      <Box sx={{ height: 420 }}>
        <DataGrid rows={rows} columns={columns} />
      </Box>

      {/* ADD / EDIT DIALOG */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth>
        <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>

        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            label="Email"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            label="Phone"
            name="phone"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            label="Status"
            name="status"
            select
            fullWidth
            value={formData.status}
            onChange={handleChange}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>

          {/* CREATED BY - READ ONLY */}
          {isEdit && (
            <TextField
              margin="dense"
              label="Created By"
              fullWidth
              value={selectedUser?.createdBy}
              disabled
            />
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isFormValid}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{" "}
          <b>{selectedUser?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
