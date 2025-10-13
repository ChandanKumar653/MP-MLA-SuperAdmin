import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Paper, TextField, Button, Stack, Typography, Select, MenuItem } from "@mui/material";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");

  const handleLogin = () => {
    login({ username, role });
    if (role === "superadmin") navigate("/superadmin/dashboard");
    else if (role === "admin") navigate("/admin/menus");
    else navigate("/user/viewer/1"); // example
  };

  return (
    <Paper sx={{ maxWidth: 400, margin: "100px auto", p: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5">Login</Typography>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <MenuItem value="superadmin">SuperAdmin</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </Select>
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Login
        </Button>
      </Stack>
    </Paper>
  );
};

export default Login;
