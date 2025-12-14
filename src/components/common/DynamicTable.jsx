import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
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
 
  const safeRows = useMemo(() => {
    return rows.map((r, index) => ({
      id: r.id ?? r.userId ?? index,
      ...r,
    }));
  }, [rows]);

  /**
   * Normalize columns for DataGrid
   * (enable column menu by default)
   */
  const safeColumns = useMemo(() => {
    return columns.map((col) => ({
      sortable: true,
      filterable: true,
      disableColumnMenu: false, // 👈 enables ⋮ menu
      ...col,
    }));
  }, [columns]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">{title}</Typography>
      </Box>

      {/* DataGrid */}
      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={safeRows}
          columns={safeColumns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
                page: 0,
              },
            },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
              printOptions: { disableToolbarButton: true },
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default DynamicTable;
