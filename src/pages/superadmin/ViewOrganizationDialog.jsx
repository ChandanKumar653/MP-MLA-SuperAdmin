import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Divider,
  Button,
  Box,
} from "@mui/material";

export default function ViewOrganizationDialog({ open, onClose, organization }) {
  if (!organization) return null;

  const fields = [
    { label: "Organization Name", value: organization.name },
    { label: "Domain", value: organization.domain },
    { label: "Email", value: organization.email },
    { label: "Tenant ID", value: organization.tenantId },
    { label: "Users", value: organization.users ?? "N/A" },
    { label: "Status", value: organization.status },
    { label: "Admin URL", value: organization.adminUrl },
    { label: "Created At", value: organization.createdAt },
    { label: "Updated At", value: organization.updatedAt },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1, background: "#faf9ff" },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "#4c1d95",
          pb: 1,
          borderBottom: "1px solid #ede9fe",
        }}
      >
        Organization Details
      </DialogTitle>

      <DialogContent dividers sx={{ mt: 1 }}>
        <Grid container spacing={2}>
          {fields.map(
            (field) =>
              field.value && (
                <Grid item xs={12} sm={6} key={field.label}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontWeight: 600,
                      mb: 0.3,
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Typography
                    sx={{
                      background: "#fff",
                      borderRadius: 2,
                      p: 1,
                      fontWeight: 500,
                      color: "#3b0764",
                      border: "1px solid #ede9fe",
                    }}
                  >
                    {field.value}
                  </Typography>
                </Grid>
              )
          )}
        </Grid>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            background: "linear-gradient(90deg,#7c3aed,#a855f7)",
            "&:hover": {
              background: "linear-gradient(90deg,#6d28d9,#9333ea)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
