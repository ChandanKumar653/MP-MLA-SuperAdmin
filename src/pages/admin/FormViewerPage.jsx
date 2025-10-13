import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Stack,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";

const FormViewerPage = ({ menuId }) => {
  const [fields, setFields] = useState([]);

  useEffect(() => {
    const menus = JSON.parse(localStorage.getItem("menus")) || [];

    const findMenuById = (nodes, id) => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.subMenus) {
          const found = findMenuById(n.subMenus, id);
          if (found) return found;
        }
      }
      return null;
    };

    const menu = findMenuById(menus, menuId);
    if (menu?.formJson) setFields(menu.formJson);
  }, [menuId]);

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" mb={2}>
        Form Viewer
      </Typography>
      <form>
        <Stack spacing={2}>
          {fields.map((f) => (
            <Stack key={f.id}>
              <Typography>{f.label}</Typography>
              {f.type === "select" ? (
                <Select fullWidth defaultValue="">
                  {f.options.map((o, idx) => (
                    <MenuItem key={idx} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </Select>
              ) : f.type === "checkbox-group" ? (
                <Stack direction="row" spacing={1}>
                  {f.options.map((o, idx) => (
                    <FormControlLabel
                      key={idx}
                      control={<Checkbox />}
                      label={o}
                    />
                  ))}
                </Stack>
              ) : (
                <TextField type={f.type} required={f.required} fullWidth />
              )}
            </Stack>
          ))}
          <Button variant="contained" color="primary">
            Submit
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default FormViewerPage;
