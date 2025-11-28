import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  MenuItem,
  Tooltip,
  Skeleton,
} from "@mui/material";

import {
  Search,
  Add,
  Visibility,
  Edit,
  Delete,
  FilterAlt,
  ToggleOn,
  ToggleOff,
} from "@mui/icons-material";

import Swal from "sweetalert2";

import { OrganizationContext } from "../../context/OrganizationContext";
import AddOrganizationDialog from "./AddOrganizationDialog";
import EditOrganizationDialog from "./EditOrganizationDialog";
import ViewOrganizationDialog from "./ViewOrganizationDialog";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function Organizations() {
  const { selectOrganization } = useContext(OrganizationContext);

  const [openDialog, setOpenDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState(null);

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [loading, setLoading] = useState(true);

  // API HOOKS
  const { execute: fetchAll } = useApi(apiEndpoints.organizations.getAll, {
    immediate: false,
  });
  const { execute: deleteApi } = useApi(apiEndpoints.organizations.delete);
  const { execute: toggleApi } = useApi(apiEndpoints.organizations.toggleStatus);

  // ---------------- Fetch Organizations ----------------
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetchAll({ force: Date.now() }); // avoid caching
      let list = res?.data || [];

      // Sort by timestamp → latest first
      list.sort((a, b) => new Date(b.tstamp) - new Date(a.tstamp));

      setData(list);
    } catch (err) {
      toast.error("Failed to fetch organizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // ---------------- Filtering ----------------
  const filteredData = data.filter((org) => {
    const q = search.toLowerCase();
    const status = org.status?.toLowerCase() || "";

    return (
      (!statusFilter || status === statusFilter.toLowerCase()) &&
      (org.name?.toLowerCase().includes(q) ||
        org.email?.toLowerCase().includes(q) ||
        org.domain?.toLowerCase().includes(q))
    );
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ---------------- Add Organization Opens ----------------
  const handleOpenAdd = () => {
    setSearch("");
    setStatusFilter("");
    setOpenDialog(true);
  };

  // ---------------- Delete with SweetAlert ----------------
  const handleDelete = (org) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete "${org.name}" permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteApi({ id: org._id });
          Swal.fire("Deleted!", "Organization removed.", "success");
          fetchOrganizations();
        } catch {
          Swal.fire("Error", "Deletion failed.", "error");
        }
      }
    });
  };

  // ---------------- Toggle Status ----------------
  const handleToggleStatus = async (org) => {
    try {
      const newStatus = org.status === "active" ? "inactive" : "active";
      await toggleApi({ id: org._id, status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchOrganizations();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", p: 4, background: "#faf6ff" }}>

      {/* ------- Top Filter Bar ------- */}
      <Paper sx={{ mb: 4, p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Stack direction="row" spacing={2} sx={{ flex: 1 }}>

            {/* Search */}
            <TextField
              fullWidth
              placeholder="🔍 Search by name/email/domain"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            {/* Status Filter */}
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Stack>

          {/* Add Button */}
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
            Add Organization
          </Button>
        </Stack>
      </Paper>

      {/* ------- Table with Shimmer------- */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Org Name</TableCell>
                <TableCell>Email/Domain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* SHIMMER LOADER */}
              {loading &&
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width="80%" height={24} /></TableCell>
                    <TableCell><Skeleton width="70%" height={24} /></TableCell>
                    <TableCell><Skeleton width="60%" height={24} /></TableCell>
                    <TableCell><Skeleton width="40%" height={24} /></TableCell>
                    <TableCell><Skeleton width="50%" height={24} /></TableCell>
                  </TableRow>
                ))}

              {!loading &&
                paginatedData.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.email ?? org.domain}</TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          px: 1.2,
                          py: 0.3,
                          borderRadius: "10px",
                          display: "inline-block",
                          fontWeight: 600,
                          backgroundColor:
                            org.status === "active" ? "#ecfdf5" : "#ffe6e8",
                          color: org.status === "active" ? "#047857" : "#be123c",
                        }}
                      >
                        {org.status}
                      </Typography>
                    </TableCell>

                    <TableCell>{org.users ?? 10}</TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>

                        <Tooltip title="View">
                          <IconButton onClick={() => { setSelectedOrg(org); setViewDialog(true); }}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton onClick={() => { setSelectedOrg(org); setEditDialog(true); }}>
                            <Edit />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Toggle Status">
                          <IconButton onClick={() => handleToggleStatus(org)}>
                            {org.status === "active" ? (
                              <ToggleOn color="success" />
                            ) : (
                              <ToggleOff color="error" />
                            )}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(org)}>
                            <Delete sx={{ color: "red" }} />
                          </IconButton>
                        </Tooltip>

                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && (
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) =>
              setRowsPerPage(parseInt(e.target.value, 10))
            }
          />
        )}
      </Paper>

      {/* Add Dialog */}
      <AddOrganizationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={fetchOrganizations}
      />

      {/* Edit Dialog */}
      <EditOrganizationDialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        organization={selectedOrg}
        onSuccess={fetchOrganizations}
      />

      {/* View Dialog */}
      <ViewOrganizationDialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        organization={selectedOrg}
      />
    </Box>
  );
}
