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
  CircularProgress,
  MenuItem,
  Fade,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // dynamic endpoint based on selected role
  const getEndpoint = () => {
    switch (role) {
      case "superadmin":
        return apiEndpoints.auth.superadminLogin;
      case "admin":
        return apiEndpoints.auth.adminLogin;
      default:
        return apiEndpoints.auth.userLogin;
    }
  };

  //using custom hook
  const { execute, loading } = useApi(getEndpoint(), { immediate: false });
  

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setError("");

    try {
      const response = await execute({ email, password });
      // console.log(response);

      localStorage.setItem("token", response?.token);
      login({
        email: response?.user?.name,
        role: response?.role,
        token:response?.token
      });

      // navigate(`/${response?.role}/dashboard`);
      window.location.href = `/${response?.role}/dashboard`;
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        const status = err?.response.status;
        // if (status === 401 || status === 403) {
        //   setError("Invalid email or password. Please try again.");
        // } else if (status >= 500) {
        //   setError("Server error. Please try again later.");
        // } else {
        //   setError(err?.response.data?.message || "Unexpected error occurred.");
        // }
        setError(err?.response.data?.message || "Unexpected error occurred.");
      } else if (err?.request) {
        setError("Server is unreachable.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={6}
          sx={{
            maxWidth: 420,
            width: "100%",
            p: 5,
            borderRadius: 5,
            textAlign: "center",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Welcome Back 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to your dashboard
            </Typography>

            {error && <Fade in={!!error}><Alert severity="error">{error}</Alert></Fade>}

            {/* Role Selector */}
            <TextField
              select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            >
              <MenuItem value="superadmin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </TextField>

            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

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
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{
                borderRadius: "12px",
                py: 1.4,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                letterSpacing: 0.5,
                boxShadow: "0 6px 16px rgba(99, 102, 241, 0.3)",
                "&:hover": { boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)" },
              }}
            >
              {loading ? (
                <CircularProgress size={26} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Forgot password?{" "}
              <span
                className="text-blue-600 hover:underline cursor-pointer"
                onClick={() => toast.error("Reset password feature coming soon")}
              >
                Reset here
              </span>
            </Typography>
          </Stack>
        </Paper>
      </motion.div>
    </div>
  );
};

export default Login;
