import React, { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Add, Delete, Edit, List } from "@mui/icons-material";
import { MenuContext } from "../context/MenuContext";
import FormBuilderPage from "./FormBuilderPage";

const MenuManagerPage = () => {
  const { menus, setMenus } = useContext(MenuContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // 🟢 Add new menu
  const handleAddMenu = (parentId = null) => {
    const newMenu = {
      id: crypto.randomUUID(),
      title: "",
      hasForm: false,
      formSchema: [],
      children: [],
      parentId,
    };
    setEditingMenu(newMenu);
    setOpenDialog(true);
  };

  // 🟢 Edit existing menu
  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setOpenDialog(true);
  };

  // 🟢 Delete menu (recursive)
  const handleDeleteMenu = (menuId) => {
    const deleteRecursive = (list) =>
      list
        .filter((m) => m.id !== menuId)
        .map((m) => ({ ...m, children: deleteRecursive(m.children) }));

    setMenus((prev) => deleteRecursive(prev));
  };

  // 🟢 Save menu (add or update)
  const saveMenu = () => {
    const saveRecursive = (list, menu) => {
      // root-level add/update
      if (menu.parentId === null) {
        const exists = list.find((m) => m.id === menu.id);
        return exists
          ? list.map((m) => (m.id === menu.id ? menu : m))
          : [...list, menu];
      }

      // nested add/update
      return list.map((m) => {
        if (m.id === menu.parentId) {
          const childExists = m.children.find((c) => c.id === menu.id);
          return {
            ...m,
            children: childExists
              ? m.children.map((c) => (c.id === menu.id ? menu : c))
              : [...m.children, menu],
          };
        }
        return { ...m, children: saveRecursive(m.children, menu) };
      });
    };

    setMenus((prev) => saveRecursive(prev, editingMenu));
    setEditingMenu(null);
    setOpenDialog(false);
  };

  // 🟢 Save Form Schema (no localStorage — updates menuTree)
  const handleSaveForm = (menuId, formSchema) => {
    const updateRecursive = (list) =>
      list.map((m) => {
        if (m.id === menuId) {
          return { ...m, formSchema };
        } else if (m.children?.length > 0) {
          return { ...m, children: updateRecursive(m.children) };
        }
        return m;
      });

    setMenus((prev) => updateRecursive(prev));
    setShowFormBuilder(null);
  };

  // 🟢 Helper to find a menu by ID
  const findMenuById = (list, id) => {
    for (const m of list) {
      if (m.id === id) return m;
      const found = findMenuById(m.children, id);
      if (found) return found;
    }
    return null;
  };

  // 🟢 Render menu tree recursively
  const renderMenuTree = (list, level = 0) => (
    <ul className="ml-4 border-l pl-4">
      {list.map((menu) => (
        <li key={menu.id} className="mb-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">
              {"— ".repeat(level)} {menu.title || "(Untitled Menu)"}
            </span>
            <div className="flex gap-2">
              {menu.hasForm && (
                <Button
                  size="small"
                  onClick={() => setShowFormBuilder(menu.id)}
                  startIcon={<List />}
                >
                  Form
                </Button>
              )}
              <IconButton
                color="primary"
                size="small"
                onClick={() => handleAddMenu(menu.id)}
              >
                <Add />
              </IconButton>
              <IconButton
                color="secondary"
                size="small"
                onClick={() => handleEditMenu(menu)}
              >
                <Edit />
              </IconButton>
              <IconButton
                color="error"
                size="small"
                onClick={() => handleDeleteMenu(menu.id)}
              >
                <Delete />
              </IconButton>
            </div>
          </div>

          {menu.children?.length > 0 && (
            <div>{renderMenuTree(menu.children, level + 1)}</div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">📋 Menu Manager</h2>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => handleAddMenu(null)}
      >
        Add Root Menu
      </Button>

      <div className="mt-6">{renderMenuTree(menus)}</div>

      {/* 🟢 Add/Edit Menu Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingMenu?.id ? "Edit Menu" : "Add Menu"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Menu Title"
            fullWidth
            margin="dense"
            value={editingMenu?.title || ""}
            onChange={(e) =>
              setEditingMenu({ ...editingMenu, title: e.target.value })
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingMenu?.hasForm || false}
                onChange={(e) =>
                  setEditingMenu({
                    ...editingMenu,
                    hasForm: e.target.checked,
                  })
                }
              />
            }
            label="Attach Dynamic Form?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={saveMenu} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🟢 Form Builder Dialog */}
      {showFormBuilder && (
        <Dialog
          open={!!showFormBuilder}
          onClose={() => setShowFormBuilder(null)}
          fullScreen={fullScreen}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, minHeight: fullScreen ? "100%" : "80vh" },
          }}
        >
          <DialogTitle>🧩 Form Builder</DialogTitle>
          <DialogContent>
            <FormBuilderPage
              existingForm={
                findMenuById(menus, showFormBuilder)?.formSchema || []
              }
              onSave={(schema) => handleSaveForm(showFormBuilder, schema)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFormBuilder(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default MenuManagerPage;
