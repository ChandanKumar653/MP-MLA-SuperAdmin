import React, { useState } from "react";
import FormBuilderDialog from "./FormBuilderDialog";
import {
  Stack,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import { Delete, Add, ExpandMore, ExpandLess } from "@mui/icons-material";

const MenuItem = ({ item, allMenus, updateMenus }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const updateItem = (updatedItem) => {
    const updateTree = (nodes) =>
      nodes.map((n) =>
        n.id === item.id
          ? updatedItem
          : { ...n, subMenus: updateTree(n.subMenus) }
      );
    updateMenus(updateTree(allMenus));
  };

  const addSubMenu = () => {
    const sub = {
      id: Date.now(),
      title: "New Submenu",
      hasForm: false,
      formJson: [],
      subMenus: [],
    };
    updateItem({ ...item, subMenus: [...item.subMenus, sub] });
  };

  const deleteItem = () => {
    const removeTree = (nodes) =>
      nodes
        .filter((n) => n.id !== item.id)
        .map((n) => ({ ...n, subMenus: removeTree(n.subMenus) }));
    updateMenus(removeTree(allMenus));
  };

  return (
    <Paper sx={{ p: 2, ml: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>

        <TextField
          size="small"
          label="Menu Title"
          value={item.title}
          onChange={(e) => updateItem({ ...item, title: e.target.value })}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={item.hasForm}
              onChange={(e) =>
                updateItem({ ...item, hasForm: e.target.checked })
              }
            />
          }
          label="Has Form"
        />

        {item.hasForm && (
          <Button
            variant="contained"
            color="success"
            onClick={() => setOpenDialog(true)}
          >
            Edit Form
          </Button>
        )}

        <Button variant="outlined" color="primary" startIcon={<Add />} onClick={addSubMenu}>
          Submenu
        </Button>
        <Button variant="outlined" color="error" startIcon={<Delete />} onClick={deleteItem}>
          Delete
        </Button>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {item.subMenus.map((sm) => (
            <MenuItem
              key={sm.id}
              item={sm}
              allMenus={allMenus}
              updateMenus={updateMenus}
            />
          ))}
        </Stack>
      </Collapse>

      {openDialog && (
        <FormBuilderDialog
          open={openDialog}
          setOpen={setOpenDialog}
          formJson={item.formJson}
          onSave={(form) => updateItem({ ...item, formJson: form })}
        />
      )}
    </Paper>
  );
};

export default MenuItem;
