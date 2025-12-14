import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
  Stack,
  Avatar,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function UserDashboardPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      setMenus([
        {
          id: 1,
          name: "Profile",
          description: "View and update your personal information",
          icon: <PersonIcon />,
          color: "#1976d2",
        },
        {
          id: 2,
          name: "Forms",
          description: "Fill and submit assigned forms",
          icon: <DescriptionIcon />,
          color: "#9c27b0",
        },
        {
          id: 3,
          name: "Downloads",
          description: "Access and download documents",
          icon: <DownloadIcon />,
          color: "#2e7d32",
        },
      ]);
      setLoading(false);
    }, 1200);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 4 } }}>
      {/* Header / Hero */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",

          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
            <DashboardIcon />
          </Avatar>

          <Box>
            <Typography variant="h5" fontWeight={600}>
              Welcome back 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Here’s a quick overview of what you can do today
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Stats (dummy showcase) */}
      <Grid container spacing={2} mb={4}>
        {["Total Forms", "Pending Tasks", "Downloads"].map((label, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {Math.floor(Math.random() * 10) + 1}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Menu Cards */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Quick Actions
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton height={20} width="60%" sx={{ mt: 2 }} />
                  <Skeleton height={15} width="90%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {menus.map((menu) => (
            <Grid item xs={12} sm={6} md={4} key={menu.id}>
              <Card
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  borderRadius: 2,
                  transition: "0.25s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  },
                }}
                // onClick={() => alert(`Clicked: ${menu.name}`)}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: menu.color,
                      mb: 2,
                    }}
                  >
                    {menu.icon}
                  </Avatar>

                  <Typography variant="h6" fontWeight={600}>
                    {menu.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mt={0.5}
                  >
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
