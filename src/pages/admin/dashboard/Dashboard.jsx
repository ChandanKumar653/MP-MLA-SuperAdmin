import React, { useContext, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";

import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

export default function Dashboard() {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId;

  const {
    execute: fetchStats,
    data,
    loading,
    error
  } = useApi(apiEndpoints.dashboard.getStats, { immediate: false });

  useEffect(() => {
    if (!tenantId) return;
    fetchStats({tenantId});
  }, [tenantId]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load dashboard data
        </Alert>
      )}

      {/* Data */}
      {!loading && !error && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Dashboard Stats
          </Typography>

          <pre
            style={{
              marginTop: 16,
              background: "#f9fafb",
              padding: 16,
              borderRadius: 6,
              fontSize: 13
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
}
