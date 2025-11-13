import React, { useContext, useState, useMemo, useEffect, useCallback } from "react";
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
  Chip,
  Alert,
  Box,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  List,
  Save,
  CompareArrows,
  CheckCircle,
} from "@mui/icons-material";
import { MenuContext } from "../context/MenuContext";
import FormBuilderPage from "./FormBuilderPage";

// Custom diff function
const computeMenuDiff = (original, current) => {
  const diffs = [];
  const compareNodes = (origNode, currNode, path = []) => {
    if (!origNode && currNode) {
      diffs.push({ kind: 'N', path, value: currNode });
      return;
    }
    if (origNode && !currNode) {
      diffs.push({ kind: 'D', path, value: origNode });
      return;
    }
    if (origNode && currNode) {
      if (origNode.id !== currNode.id) {
        diffs.push({ kind: 'E', path, oldValue: origNode, newValue: currNode });
      } else {
        const hasChanges = 
          origNode.title !== currNode.title ||
          origNode.hasForm !== currNode.hasForm ||
          origNode.tableName !== currNode.tableName ||
          JSON.stringify(origNode.formSchema) !== JSON.stringify(currNode.formSchema);

        if (hasChanges) {
          diffs.push({ kind: 'E', path, oldValue: origNode, newValue: currNode });
        }
        if (origNode.children?.length !== currNode.children?.length) {
          diffs.push({ kind: 'A', path, oldValue: origNode.children, newValue: currNode.children });
        }
        const origChildrenMap = new Map(origNode.children?.map(c => [c.id, c]) || []);
        currNode.children?.forEach((child, index) => {
          const origChild = origChildrenMap.get(child.id);
          compareNodes(origChild, child, [...path, 'children', index]);
        });
      }
    }
  };

  current.forEach((currNode, index) => {
    const origNode = original[index];
    compareNodes(origNode, currNode, [index]);
  });
  return diffs;
};

const MenuManagerPage = () => {
  const { menus: originalMenus, setMenus, saveMenuSchema } = useContext(MenuContext);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [lastSavedMenus, setLastSavedMenus] = useState([]);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Safe menus
  const safeMenus = useMemo(() => {
    try {
      if (typeof originalMenus === "string") return JSON.parse(originalMenus);
      if (Array.isArray(originalMenus)) return originalMenus;
      return [];
    } catch {
      return [];
    }
  }, [originalMenus]);

  // Initialize lastSavedMenus with initial menus
  useEffect(() => {
    if (lastSavedMenus.length === 0 && safeMenus.length > 0) {
      setLastSavedMenus(JSON.parse(JSON.stringify(safeMenus)));
    }
  }, [safeMenus, lastSavedMenus]);

  // Compute differences
  const { differences, hasChanges } = useMemo(() => {
    const diffs = computeMenuDiff(lastSavedMenus, safeMenus);
    return { differences: diffs, hasChanges: diffs.length > 0 };
  }, [lastSavedMenus, safeMenus]);

  // Validate before save
  const validateBeforeSave = useCallback(() => {
    const tableNameRegex = /^[a-zA-Z0-9_-]+$/;

    const check = (list) => {
      for (const m of list) {
        if (m.hasForm) {
          if (!m.tableName) {
            return `Menu "${m.title || "(Untitled)"}" needs a tableName`;
          }
          if (!tableNameRegex.test(m.tableName)) {
            return `tableName "${m.tableName}" contains invalid characters`;
          }
        }
        if (m.children && m.children.length > 0) {
          const childErr = check(m.children);
          if (childErr) return childErr;
        }
      }
      return null;
    };

    return check(safeMenus);
  }, [safeMenus]);

  useEffect(() => {
    setValidationError(validateBeforeSave() || "");
  }, [validateBeforeSave]);

  // Save All
  const handleSaveAll = async () => {
    if (!hasChanges || validationError) return;
    try {
      await saveMenuSchema();
      setLastSavedMenus(JSON.parse(JSON.stringify(safeMenus)));
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // CRUD operations
  const handleAddMenu = (parentId = null) => {
    const newMenu = {
      id: crypto.randomUUID(),
      title: "",
      hasForm: false,
      formSchema: [],
      tableName: "",
      children: [],
      parentId,
    };
    setEditingMenu(newMenu);
    setOpenDialog(true);
  };

  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setOpenDialog(true);
  };

  const handleDeleteMenu = (menuId) => {
    const deleteRecursive = (list) =>
      list
        .filter((m) => m.id !== menuId)
        .map((m) => ({ ...m, children: deleteRecursive(m.children || []) }));

    setMenus((prev) => deleteRecursive(safeMenus));
  };

  const saveMenu = () => {
    const saveRecursive = (list, menu) => {
      if (menu.parentId === null) {
        const exists = list.find((m) => m.id === menu.id);
        return exists
          ? list.map((m) => (m.id === menu.id ? menu : m))
          : [...list, menu];
      }

      return list.map((m) => {
        if (m.id === menu.parentId) {
          const childExists = m.children?.find((c) => c.id === menu.id);
          return {
            ...m,
            children: childExists
              ? m.children.map((c) => (c.id === menu.id ? menu : c))
              : [...(m.children || []), menu],
          };
        }
        return { ...m, children: saveRecursive(m.children || [], menu) };
      });
    };

    setMenus((prev) => saveRecursive(safeMenus, editingMenu));
    setEditingMenu(null);
    setOpenDialog(false);
  };

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

    setMenus((prev) => updateRecursive(safeMenus));
    setShowFormBuilder(null);
  };

  const findMenuById = (list, id) => {
    if (!Array.isArray(list)) return null;
    for (const m of list) {
      if (m.id === id) return m;
      const found = findMenuById(m.children, id);
      if (found) return found;
    }
    return null;
  };

  // Render diff chip
  const renderDiffChip = (kind, path) => {
    const label = path?.join(" → ") || "";
    switch (kind) {
      case "N": return <Chip size="small" color="success" label={`+ ${label}`} />;
      case "D": return <Chip size="small" color="error" label={`− ${label}`} />;
      case "E": return <Chip size="small" color="warning" label={`Edit ${label}`} />;
      case "A": return <Chip size="small" color="info" label="Array change" />;
      default: return null;
    }
  };

  // Render menu tree
  const renderMenuTree = (list, level = 0) => {
    if (!Array.isArray(list)) return null;

    return (
      <ul className="ml-4 border-l pl-4">
        {list.map((menu) => {
          const menuDiffs = differences.filter(
            (d) => d.path[0] === list.indexOf(menu) || d.path.includes(menu.id)
          );

          return (
            <li key={menu.id} className="mb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-gray-800">
                    {"— ".repeat(level)} {menu.title || "(Untitled Menu)"}
                  </span>
                  {menu.hasForm && (
                    <Chip size="small" label="Form" color="primary" />
                  )}
                  {menuDiffs.length > 0 && (
                    <Box className="flex gap-1">
                      {menuDiffs.map((d, i) => (
                        <span key={i}>{renderDiffChip(d.kind, d.path)}</span>
                      ))}
                    </Box>
                  )}
                </div>

                <div className="flex gap-1">
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
          );
        })}
      </ul>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Menu Manager</h2>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Chip
              icon={<CompareArrows />}
              label={`${differences.length} change${differences.length > 1 ? "s" : ""}`}
              color="secondary"
            />
          )}

          <Button
            variant="contained"
            color={hasChanges && !validationError ? "success" : "inherit"}
            startIcon={hasChanges ? <Save /> : <CheckCircle />}
            onClick={handleSaveAll}
            disabled={!hasChanges || !!validationError}
          >
            {hasChanges ? "Save All" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <Alert severity="error" className="mb-4">
          {validationError}
        </Alert>
      )}

      {/* Add Root */}
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => handleAddMenu(null)}
        className="mb-4"
      >
        Add Root Menu
      </Button>

      {/* Tree */}
      <div className="mt-6">
        {safeMenus.length > 0 ? (
          renderMenuTree(safeMenus)
        ) : (
          <p className="text-gray-500 italic mt-4">No menus created yet.</p>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingMenu?.id ? "Edit Menu" : "Add Menu"}</DialogTitle>
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
          <TextField
            label="Table Name (for forms)"
            fullWidth
            margin="dense"
            value={editingMenu?.tableName || ""}
            onChange={(e) =>
              setEditingMenu({ ...editingMenu, tableName: e.target.value })
            }
            helperText="Required if form is attached. Only letters, numbers, _, -"
            disabled={!editingMenu?.hasForm}
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingMenu?.hasForm || false}
                onChange={(e) =>
                  setEditingMenu({
                    ...editingMenu,
                    hasForm: e.target.checked,
                    tableName: e.target.checked ? editingMenu?.tableName || "" : "",
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

      {/* Form Builder */}
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
          <DialogTitle>Form Builder</DialogTitle>
          <DialogContent>
            <FormBuilderPage
              existingForm={
                findMenuById(safeMenus, showFormBuilder)?.formSchema || []
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