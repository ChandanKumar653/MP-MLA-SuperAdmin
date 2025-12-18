import React, { useContext, useState, useMemo, useEffect, useRef } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  List,
  Save,
  CheckCircle,
  CloudUpload,
} from "@mui/icons-material";

import Swal from "sweetalert2";
import { MenuContext } from "../../context/MenuContext";
import FormBuilderPage from "./FormBuilderPage";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { v4 as uuidv4 } from "uuid";

/* ---------------- Utilities ---------------- */
const slugify = (str) =>
  (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/* ---------------- MAIN ---------------- */
export default function MenuManagerPage() {
  const { menus, setMenus, saveMenuSchema } = useContext(MenuContext);
  const tenantId = menus?.tenantId;
  const tabs = menus?.tabs || [];

  const [editingMenu, setEditingMenu] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formBuilder, setFormBuilder] = useState(null);

  const initialized = useRef(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [deployLoading, setDeployLoading] = useState(false);
  const { execute: deploySchemaApi } = useApi(apiEndpoints.menus.deploySchema, {
    immediate: false,
  });

  /* ---------------- Track Saved Tabs ---------------- */
  const [lastSavedTabs, setLastSavedTabs] = useState([]);

  useEffect(() => {
    if (!initialized.current && Array.isArray(tabs)) {
      initialized.current = true;
      setLastSavedTabs(JSON.parse(JSON.stringify(tabs)));
    }
  }, [tabs]);

  /* ---------------- Diff Checker ---------------- */
  const hasChanges = useMemo(
    () => JSON.stringify(lastSavedTabs) !== JSON.stringify(tabs),
    [lastSavedTabs, tabs]
  );

  /* ---------------- Validation ---------------- */
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const validate = (list) => {
      for (const m of list) {
        if (m.hasForm && !m.tableName)
          return `Menu "${m.title}" requires tableName`;
        if (m.children?.length) {
          const err = validate(m.children);
          if (err) return err;
        }
      }
      return null;
    };
    setValidationError(validate(tabs) || "");
  }, [tabs]);

  /* ---------------- SAVE ALL ---------------- */
  const handleSaveAll = async () => {
    if (!hasChanges || validationError) return;
    await saveMenuSchema({ tabs: JSON.parse(JSON.stringify(tabs)) });
    setLastSavedTabs(JSON.parse(JSON.stringify(tabs)));
  };

  /* ---------------- DEPLOY ---------------- */
  const handleDeploySchema = async () => {
    if (hasChanges)
      return Swal.fire("Unsaved Changes", "Please save first", "warning");

    if (validationError)
      return Swal.fire("Validation Error", validationError, "error");

    const confirm = await Swal.fire({
      title: "Deploy Schema?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    setDeployLoading(true);
    try {
      await deploySchemaApi({ tenantId, data: tabs });
      Swal.fire("Success", "Schema deployed", "success");
    } catch (e) {
      Swal.fire("Error", e.message || "Failed", "error");
    } finally {
      setDeployLoading(false);
    }
  };

  /* ---------------- UPSERT MENU (FINAL FIX) ---------------- */
  const upsertMenu = (menu) => {
    setMenus((prev) => {
      let updated = false;

      const updateTree = (list) =>
        list.map((item) => {
          if (item.id === menu.id) {
            updated = true;
            return {
              ...item,
              ...menu,
              children: item.children || [],
            };
          }

          if (item.children?.length) {
            return {
              ...item,
              children: updateTree(item.children),
            };
          }

          return item;
        });

      let newTabs = updateTree(prev.tabs || []);

      if (!updated && !menu.parentId) {
        newTabs = [
          ...newTabs,
          { ...menu, children: [], order: newTabs.length + 1 },
        ];
      }

      if (!updated && menu.parentId) {
        newTabs = newTabs.map((item) =>
          item.id === menu.parentId
            ? {
                ...item,
                children: [
                  ...(item.children || []),
                  {
                    ...menu,
                    children: [],
                    order: (item.children?.length || 0) + 1,
                  },
                ],
              }
            : item
        );
      }

      return { ...prev, tabs: newTabs };
    });
  };

  /* ---------------- DELETE ---------------- */
  const deleteMenu = (id) => {
    setMenus((prev) => {
      const remove = (list) =>
        list
          .filter((x) => x.id !== id)
          .map((m) => ({ ...m, children: remove(m.children || []) }));
      return { ...prev, tabs: remove(prev.tabs || []) };
    });
  };

  /* ---------------- SAVE MENU ---------------- */
  const saveMenu = () => {
    const menu = JSON.parse(JSON.stringify(editingMenu)); // 🔒 clone

    if (menu.hasForm && !menu.tableName) {
      menu.tableName = `${slugify(menu.title)}_${Date.now()}`;
    }

    if (!menu.hasForm) {
      menu.tableName = "";
      menu.formSchema = [];
    }

    upsertMenu(menu);
    setDialogOpen(false);
    setEditingMenu(null);
  };

  /* ---------------- SAVE FORM ---------------- */
  const saveFormSchema = (menuId, schema) => {
    setMenus((prev) => {
      const update = (list) =>
        list.map((m) =>
          m.id === menuId
            ? { ...m, formSchema: schema }
            : { ...m, children: update(m.children || []) }
        );
      return { ...prev, tabs: update(prev.tabs) };
    });
    setFormBuilder(null);
  };

  /* ---------------- FIND MENU ---------------- */
  const findMenu = (list, id) => {
    for (const m of list) {
      if (m.id === id) return m;
      const found = findMenu(m.children || [], id);
      if (found) return found;
    }
    return null;
  };

  /* ---------------- TREE UI ---------------- */
  const renderTree = (list, lvl = 0) =>
    list.map((m) => (
      <div key={m.id} className="ml-4 mb-3">
        <div className="flex justify-between items-center">
          <span>
            {"— ".repeat(lvl)} {m.title}
          </span>

          <div className="flex gap-1">
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => {
                setEditingMenu({
                  id: uuidv4(),
                  parentId: m.id,
                  title: "",
                  hasForm: false,
                  formSchema: [],
                  tableName: "",
                  children: [],
                });
                setDialogOpen(true);
              }}
            >
              Submenu
            </Button>

            {m.hasForm && (
              <Button
                size="small"
                startIcon={<List />}
                onClick={() => setFormBuilder(m.id)}
              >
                Form
              </Button>
            )}

            <IconButton
              onClick={() => {
                setEditingMenu(JSON.parse(JSON.stringify(m))); // 🔒 clone
                setDialogOpen(true);
              }}
            >
              <Edit />
            </IconButton>

            <IconButton onClick={() => deleteMenu(m.id)}>
              <Delete color="error" />
            </IconButton>
          </div>
        </div>

        {m.children?.length > 0 && renderTree(m.children, lvl + 1)}
      </div>
    ));

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-semibold">Menu Manager</h2>

        <div className="flex gap-3">
          <Button
            variant="contained"
            color={hasChanges && !validationError ? "success" : "inherit"}
            startIcon={hasChanges ? <Save /> : <CheckCircle />}
            disabled={!hasChanges || !!validationError}
            onClick={handleSaveAll}
          >
            {hasChanges ? "Save All" : "Saved"}
          </Button>

          <Button
            variant="contained"
            startIcon={
              deployLoading ? <CircularProgress size={20} /> : <CloudUpload />
            }
            disabled={hasChanges || !!validationError || deployLoading}
            onClick={handleDeploySchema}
          >
            Deploy Schema
          </Button>
        </div>
      </div>

      {validationError && <Alert severity="error">{validationError}</Alert>}

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          setEditingMenu({
            id: uuidv4(),
            parentId: null,
            title: "",
            hasForm: false,
            formSchema: [],
            tableName: "",
            children: [],
          });
          setDialogOpen(true);
        }}
      >
        Add Root Menu
      </Button>

      <div className="mt-5">{renderTree(tabs)}</div>

      {/* MENU DIALOG */}
      <Dialog fullWidth open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {findMenu(tabs, editingMenu?.id) ? "Edit Menu" : "Add Menu"}
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveMenu}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* FORM BUILDER */}
      {formBuilder && (
        // <Dialog
        //   open
        //   fullScreen={fullScreen}
        //   fullWidth
        //   onClose={() => setFormBuilder(null)}
        // >
        <Dialog
          open
          fullWidth
          maxWidth="md"
          fullScreen={fullScreen}
          onClose={() => setFormBuilder(null)}
        >
          <DialogTitle>Form Builder</DialogTitle>
          <DialogContent>
            <FormBuilderPage
              existingForm={findMenu(tabs, formBuilder)?.formSchema || []}
              onSave={(schema) => saveFormSchema(formBuilder, schema)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormBuilder(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
