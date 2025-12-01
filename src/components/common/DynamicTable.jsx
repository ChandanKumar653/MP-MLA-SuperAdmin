// src/components/DynamicTable.jsx
import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import { ViewColumn, FilterList } from "@mui/icons-material";

const DynamicTable = ({ columns = [], rows = [], loading = false }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [anchorEl, setAnchorEl] = useState(null);

  // Column visibility state
  const [visibleCols, setVisibleCols] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  // Sorting
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

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

  // Toggle column visibility
  const toggleColumn = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Paper elevation={3} sx={{ p: 2, width: "100%", overflowX: "auto" }}>
      {/* Column Selector Button */}
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Select Columns">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <ViewColumn />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Popover Column Selector */}
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Box sx={{ p: 2 }}>
          <h4 className="font-semibold mb-2">Show Columns</h4>
          {columns.map((col) => (
            <Box key={col.key} display="flex" alignItems="center">
              <Checkbox
                checked={visibleCols[col.key]}
                onChange={() => toggleColumn(col.key)}
              />
              {col.label}
            </Box>
          ))}
        </Box>
      </Popover>

      {/* TABLE */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns
                .filter((c) => visibleCols[c.key])
                .map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 600 }}>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Loading...</TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>No Data Found</TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableRow key={idx}>
                  {columns
                    .filter((c) => visibleCols[c.key])
                    .map((col) => (
                      <TableCell key={col.key}>{row[col.key]}</TableCell>
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
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
};

export default DynamicTable;
