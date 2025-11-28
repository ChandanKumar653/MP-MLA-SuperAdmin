import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function EditOrganizationDialog({
  open,
  onClose,
  organization,
  onSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
  });

  const { execute } = useApi(apiEndpoints.organizations.update);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        status: organization.status,
      });
    }
  }, [organization]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await execute({ id: organization._id, ...form });
      toast.success("Updated successfully");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Edit Organization</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
