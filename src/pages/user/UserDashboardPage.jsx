import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";

export default function UserDashboardPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 🔹 Temporary Dummy Dynamic Data
    setTimeout(() => {
      setMenus([
        {
          id: 1,
          name: "Profile",
          description: "View and update your profile",
        },
        {
          id: 2,
          name: "Forms",
          description: "Fill your assigned forms",
        },
        {
          id: 3,
          name: "Downloads",
          description: "Download documents",
        },
      ]);
      setLoading(false);
    }, 1000); // simulate API delay
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        User Dashboard
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <CircularProgress />
          <Typography mt={2}>Loading menus...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {menus.map((menu) => (
            <Grid item xs={12} sm={6} md={4} key={menu.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  transition: "0.3s",
                  "&:hover": { transform: "translateY(-5px)" },
                }}
                onClick={() => alert(`Clicked: ${menu.name}`)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">
                    {menu.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {menu.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
