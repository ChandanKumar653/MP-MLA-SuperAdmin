import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { AuthContext } from "../../context/AuthContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    const staticUsername = "admin";
    const staticPassword = "admin123";

    if (username === staticUsername && password === staticPassword) {
      login({ username, role: "admin" });
      navigate("/admin/dashboard");
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <Paper
        elevation={5}
        sx={{
          maxWidth: 420,
          width: "100%",
          p: 5,
          borderRadius: 4,
          textAlign: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Welcome Back 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please sign in to continue to your dashboard
          </Typography>

          {/* Error Message */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Username */}
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password */}
          <TextField
            label="Password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Login Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={handleLogin}
            sx={{
              borderRadius: 2,
              py: 1.2,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            Sign In
          </Button>

          {/* Info */}
          <Typography variant="body2" color="text.secondary">
            Demo credentials — <b>admin / admin123</b>
          </Typography>
        </Stack>
      </Paper>
    </div>
  );
};

export default Login;
