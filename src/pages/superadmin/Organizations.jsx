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
  Fade,
} from "@mui/material";
import {
  Search,
  Add,
  Visibility,
  Edit,
  Delete,
  ArrowForward,
  FilterAlt,
} from "@mui/icons-material";
import { OrganizationContext } from "../../context/OrganizationContext";
import AddOrganizationDialog from "./AddOrganizationDialog";
import ViewOrganizationDialog from "./ViewOrganizationDialog"; // ✅ new
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function Organizations() {
  const { selectOrganization } = useContext(OrganizationContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(4);

  const { loading, execute } = useApi(apiEndpoints.organizations.getAll, {
    immediate: true,
  });

  const fetchOrganizations = async () => {
    try {
      const res = await execute();
      setData(res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch organizations.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredData = data.filter((org) => {
    const q = search.toLowerCase();
    return (
      (!statusFilter || org.status === statusFilter) &&
      (org.name?.toLowerCase().includes(q) ||
        org.email?.toLowerCase().includes(q) ||
        org.domain?.toLowerCase().includes(q))
    );
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEnterPortal = (org) => {
    selectOrganization(org);
    window.open(org.adminUrl || `/admin/${org.tenantId}/dashboard`, "_blank");
  };

  const handleView = (org) => {
    setSelectedOrg(org);
    setViewDialog(true);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 4,
        background: "linear-gradient(180deg, #fdf9ff 0%, #faf6ff 100%)",
      }}
    >
      {/* Top control bar */}
      <Paper
        elevation={3}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(145deg,#ffffff,#f5f3ff)",
          boxShadow: "0 6px 18px rgba(160, 128, 255, 0.15)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="🔍 Search by name, domain, or email"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              variant="outlined"
              sx={{
                background: "#faf5ff",
                borderRadius: 3,
                "& fieldset": { border: "1px solid #ede9fe" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "&:hover fieldset": { borderColor: "#c084fc" },
                  "&.Mui-focused fieldset": { borderColor: "#8b5cf6" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#8b5cf6" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              variant="outlined"
              sx={{
                minWidth: 160,
                background: "#faf5ff",
                borderRadius: 2,
                "& fieldset": { border: "1px solid #ede9fe" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterAlt sx={{ color: "#a855f7" }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              textTransform: "none",
              px: 3,
              py: 1.2,
              fontWeight: 600,
              borderRadius: "50px",
              background: "linear-gradient(90deg, #8b5cf6, #a855f7)",
              boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
              "&:hover": {
                background: "linear-gradient(90deg, #7c3aed, #9333ea)",
              },
            }}
          >
            Add New Organization
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(138, 90, 255, 0.06)",
          background: "#fff",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: "linear-gradient(90deg,#f8f3ff,#f4ecff)",
                }}
              >
                {["Org Name", "Domain/Email", "User", "Status", "Action"].map(
                  (head) => (
                    <TableCell
                      key={head}
                      sx={{
                        fontWeight: 700,
                        color: "#3b0764",
                        fontSize: "0.95rem",
                        py: 1.5,
                      }}
                    >
                      {head}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.map((org, idx) => (
                <TableRow
                  key={org.tenantId || idx}
                  sx={{
                    backgroundColor: idx % 2 === 0 ? "#fcf9ff" : "#fff",
                    transition: "0.2s",
                    "&:hover": { backgroundColor: "#f5f0ff" },
                  }}
                >
                  <TableCell sx={{ py: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: "#4b006e" }}>
                      {org.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: "#5b5578" }}>
                    {org.email || org.domain}
                  </TableCell>
                  <TableCell sx={{ color: "#5b5578" }}>
                    {org.users ?? 10}
                  </TableCell>
                  <TableCell>
                    <Typography
                      sx={{
                        display: "inline-block",
                        px: 1.5,
                        py: 0.3,
                        borderRadius: "16px",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        backgroundColor:
                          org.status === "Active"
                            ? "#ecfdf5"
                            : "#fff1f2",
                        color:
                          org.status === "Active"
                            ? "#047857"
                            : "#be123c",
                      }}
                    >
                      {org.status || "Active"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      justifyContent="flex-start"
                      spacing={1}
                      alignItems="center"
                    >
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleView(org)}>
                          <Visibility sx={{ color: "#7e7b9b" }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit sx={{ color: "#7e7b9b" }} />
                        </IconButton>
                      </Tooltip>

                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={() => handleEnterPortal(org)}
                        disabled
                      //   sx={{
                      //     textTransform: "none",
                      //     borderRadius: "20px",
                      //     px: 2,
                      //     py: 0.5,
                      //     fontWeight: 600,
                      //     background:
                      //       "linear-gradient(90deg,#7c3aed,#a855f7)",
                      //     "&:hover": {
                      //       background:
                      //         "linear-gradient(90deg,#6d28d9,#9333ea)",
                      //     },
                      //   }}
                      >
                        Enter Portal
                      </Button>

                      <Tooltip title="Delete">
                        <IconButton size="small">
                          <Delete sx={{ color: "#ef4444" }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) =>
            setRowsPerPage(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[5, 10, 20]}
          sx={{
            ".MuiTablePagination-toolbar": {
              justifyContent: "space-between",
              px: 3,
            },
          }}
        />
      </Paper>

      {/* Add Dialog */}
      <AddOrganizationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={fetchOrganizations}
      />

      {/* ✅ View Dialog */}
      <ViewOrganizationDialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        organization={selectedOrg}
      />
    </Box>
  );
}
