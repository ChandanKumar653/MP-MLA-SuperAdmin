// src/components/common/DynamicTable.jsx
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
  /** remove internal fields + rename timestamp */
  const filteredColumns = columns
    .filter((c) => c.key !== "pk" && c.key !== "tableName")
    .map((col) =>
      col.key === "tstamp" ? { ...col, label: "Created At" } : col
    );

  const convertedRows = rows.map((r) => ({
    ...r,
    tstamp: r.tstamp ? new Date(r.tstamp).toLocaleString() : "",
  }));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);

  const [visibleCols, setVisibleCols] = useState({});

  // FIX column selector not updating & infinite loops
  useEffect(() => {
    setVisibleCols((prev) => {
      let changed = false;
      const updated = { ...prev };

      filteredColumns.forEach((col) => {
        if (!(col.key in updated)) {
          updated[col.key] = true;
          changed = true;
        }
      });

      Object.keys(updated).forEach((key) => {
        if (!filteredColumns.some((c) => c.key === key)) {
          delete updated[key];
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [filteredColumns]);

  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

  const handleSort = (key) => {
    const isAsc = orderBy === key && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(key);
  };

  const sortedRows = useMemo(() => {
    if (!orderBy) return convertedRows;

    return [...convertedRows].sort((a, b) => {
      const av = a[orderBy];
      const bv = b[orderBy];
      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [convertedRows, order, orderBy]);

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const toggleColumn = (key) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));

  const getExportRows = () => {
    const visibleKeys = filteredColumns
      .filter((c) => visibleCols[c.key])
      .map((c) => c.key);

    return convertedRows.map((r) => {
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
          {filteredColumns.map((col) => (
            <Box key={col.key} display="flex" alignItems="center">
              <Checkbox
                checked={visibleCols[col.key] || false}
                onChange={() => toggleColumn(col.key)}
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
              {filteredColumns
                .filter((c) => visibleCols[c.key])
                .map((col) => (
                  <TableCell key={col.key}>
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? order : "asc"}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={filteredColumns.length}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={filteredColumns.length}>
                  No Data Found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  {filteredColumns
                    .filter((c) => visibleCols[c.key])
                    .map((col) => (
                      <TableCell key={col.key}>
                        {row[col.key] ?? ""}
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
        count={convertedRows.length}
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
