import React, { useMemo } from "react";
import { Box, Paper } from "@mui/material";
import {
  DataGrid,
  GridToolbar,
} from "@mui/x-data-grid";

const DynamicTable = ({
  title = "Records",
  columns = [],
  rows = [],
  isLoading = false,
}) => {
  /* Ensure stable row identity */
  const safeRows = useMemo(() => {
    return rows.map((r, index) => ({
      id: r.id ?? r.userId ?? index,
      ...r,
    }));
  }, [rows]);

  /* Normalize columns */
  const safeColumns = useMemo(() => {
    return columns.map((col) => ({
      sortable: true,
      filterable: true,
      disableColumnMenu: false,
      ...col,
    }));
  }, [columns]);

  return (
    <Paper sx={{  borderRadius: 2, width: "100%", minWidth: 0 }}>
      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={safeRows}
          columns={safeColumns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 25, 50]}

          /* 🔑 Prevent aggressive reflow */
          autosizeOnMount={false}

          /* Pagination */
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
                page: 0,
              },
            },
          }}

          /* Toolbar */
          slots={{
            toolbar: GridToolbar,
          }}

          /* 🔑 Stabilize toolbar & poppers */
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              printOptions: { disableToolbarButton: true },
            },
            columnMenu: {
              // Prevent closing on resize / blur
              autoFocus: false,
            },
            panel: {
              // Keeps "Manage Columns" panel stable
              disableRestoreFocus: true,
              keepMounted: true,
            },
          }}

          /* 🔑 Prevent column menu auto-close on focus loss */
          disableColumnSelector={false}
          disableDensitySelector={false}

          /* Smooth resize behavior */
          sx={{
            "& .MuiDataGrid-columnSeparator": {
              display: "none",
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default DynamicTable;
