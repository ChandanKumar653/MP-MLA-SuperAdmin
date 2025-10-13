import React, { useState, useEffect } from "react";
import MenuItem from "./MenuItem";
import { Button, Typography, Paper, Stack } from "@mui/material";

const MenuManagerPage = () => {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("menus")) || [];
    setMenus(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("menus", JSON.stringify(menus));
  }, [menus]);

  const addMenu = () => {
    setMenus([
      ...menus,
      {
        id: Date.now(),
        title: "New Menu",
        hasForm: false,
        formJson: [],
        subMenus: [],
      },
    ]);
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Menu Manager</Typography>
        <Button variant="contained" color="primary" onClick={addMenu}>
          + Add Menu
        </Button>
      </Stack>

      <Stack spacing={2}>
        {menus.map((menu) => (
          <MenuItem
            key={menu.id}
            item={menu}
            allMenus={menus}
            updateMenus={setMenus}
          />
        ))}
      </Stack>

      <Typography variant="body2" mt={4}>
        <pre>{JSON.stringify(menus, null, 2)}</pre>
      </Typography>
    </Paper>
  );
};

export default MenuManagerPage;
