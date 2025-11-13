import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import { motion } from "framer-motion";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function AddOrganizationDialog({ open, onClose, onSuccess }) {
  const { user } = useContext(AuthContext) || { user: { name: "Super Admin" } };
  const { execute, loading } = useApi(apiEndpoints.organizations.create, {
    immediate: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    createdBy: user?.name || "Unknown",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await execute(formData);
      console.log("response", response);

        toast.success("Organization added successfully!");
        onSuccess?.();
        onClose();
      
    } catch (error) {
      toast.error(error?.response?.data.message || "Something went wrong. Try again!");
      console.error("Error creating organization:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#fafafa",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(90deg, #4f46e5, #6d28d9)",
          color: "white",
          fontWeight: 600,
          letterSpacing: 0.4,
          py: 2.2,
          px: 3,
        }}
      >
        Add New Organization
      </DialogTitle>

      <DialogContent sx={{ py: 3.5, px: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontWeight: 500 }}
          >
            Please fill in the details below to add a new organization.
          </Typography>

          <Stack spacing={2.5}>
            <TextField
              label="Organization Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />

              <TextField
                label="Status"
                name="status"
                value={formData.status}
                select
                fullWidth
                variant="outlined"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              >
                <MenuItem value="active">🟢 Active</MenuItem>
                <MenuItem value="inactive">⚪ Inactive</MenuItem>
              </TextField>
            </Stack>

            <TextField
              label="Created By"
              name="createdBy"
              value={formData.createdBy}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#333",
                },
              }}
            />
          </Stack>
        </motion.div>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          py: 2.5,
          backgroundColor: "#f5f5f7",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            borderRadius: "10px",
            fontWeight: 600,
            color: "#555",
            px: 3,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
          sx={{
            background: "linear-gradient(90deg, #4f46e5, #6d28d9)",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            px: 3.5,
            py: 1,
            boxShadow: "0 3px 8px rgba(109,40,217,0.3)",
            "&:hover": {
              background: "linear-gradient(90deg, #4338ca, #5b21b6)",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : (
            "Save Organization"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
