import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Checkbox,
  Popover,
  Button,
  Tooltip,
  Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import DownloadIcon from "@mui/icons-material/Download";

import * as XLSX from "xlsx";

// Excel-only export
const exportToExcel = (rows, fileName = "data.xlsx") => {
  if (!rows || rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, fileName);
};

const DynamicTable = ({ columns = [], rows = [], isLoading = false }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleCols, setVisibleCols] = useState({});
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

  // initialize visible columns
  useEffect(() => {
    const updated = {};
    columns.forEach((col) => {
      updated[col.key] = true; // all visible initially
    });
    setVisibleCols(updated);
  }, [columns]);

  const handleSort = (key) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const sortedRows = useMemo(() => {
    if (!orderBy) return rows;
    return [...rows].sort((a, b) => {
      const av = a[orderBy];
      const bv = b[orderBy];
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, order, orderBy]);

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const toggleColumn = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getExportRows = () => {
    const visibleKeys = columns
      .filter((c) => visibleCols[c.key])
      .map((c) => c.key);

    return rows.map((r) => {
      const out = {};
      visibleKeys.forEach((k) => (out[k] = r[k]));
      return out;
    });
  };

  return (
    <Paper sx={{ p: 2, width: "100%", borderRadius: 2, overflowX: "auto" }}>
      {/* Toolbar */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Records</Typography>

        <Box display="flex" gap={1}>
          <Tooltip title="Export to Excel">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => exportToExcel(getExportRows())}
            >
              Excel
            </Button>
          </Tooltip>

          <Tooltip title="Select Columns">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Column Selector */}
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography fontWeight={600} mb={1}>
            Show / Hide Columns
          </Typography>
          {columns.map((col) => (
            <Box key={col.key} display="flex" alignItems="center">
              <Checkbox
                checked={visibleCols[col.key] || false}
                onChange={() => !col.fixed && toggleColumn(col.key)} // cannot toggle fixed columns
                disabled={col.fixed} // disable checkbox if fixed
              />
              {col.label}
            </Box>
          ))}
        </Box>
      </Popover>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8f9fa" }}>
              {columns
                .filter((c) => visibleCols[c.key])
                .map((col) => (
                  <TableCell key={col.key}>
                    {col.key !== "action" ? (
                      <TableSortLabel
                        active={orderBy === col.key}
                        direction={orderBy === col.key ? order : "asc"}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Loading...</TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>No Data Found</TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  {columns
                    .filter((c) => visibleCols[c.key])
                    .map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(row) : row[col.key] ?? ""}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) =>
          setRowsPerPage(parseInt(e.target.value, 10)) & setPage(0)
        }
      />
    </Paper>
  );
};

export default DynamicTable;
