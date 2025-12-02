import React, {
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
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
import { Add, Delete, Edit, List, Save, CheckCircle, CloudUpload } from "@mui/icons-material";

import Swal from "sweetalert2";
import { MenuContext } from "../context/MenuContext";
import FormBuilderPage from "./FormBuilderPage";
import useApi from "../context/useApi";
import { apiEndpoints } from "../api/endpoints";
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
  const hasChanges = useMemo(() => {
    return JSON.stringify(lastSavedTabs) !== JSON.stringify(tabs);
  }, [lastSavedTabs, tabs]);

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

    await saveMenuSchema({
      tabs: JSON.parse(JSON.stringify(tabs)),
    });

    setLastSavedTabs(JSON.parse(JSON.stringify(tabs)));
  };

  /* ---------------- DEPLOY SCHEMA ---------------- */
  const handleDeploySchema = async () => {
  if (hasChanges) {
    return Swal.fire({
      icon: "warning",
      title: "Unsaved Changes",
      text: "Please save changes before deploying.",
    });
  }

  if (validationError) {
    return Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: validationError,
    });
  }

  const confirm = await Swal.fire({
    title: "Deploy Schema?",
    text: "This will generate backend tables using the schema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Deploy",
    cancelButtonText: "Cancel",
  });

  if (!confirm.isConfirmed) return;

  setDeployLoading(true);

  try {
    const response = await deploySchemaApi({
      tenantId,
      data: tabs,
    });
// console.log("Deploy API Response:", response);
    
      Swal.fire({
        icon: "success",
        title: "Deployment Successful",
        text: "Tenant schema deployed successfully. It may take a few moments for backend tables to be created.",
      });
    
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "API Error",
      text: err.message || "Something went wrong",
    });
  } finally {
    setDeployLoading(false);
  }
};

  /* ---------------- CRUD: UPsert Menu ---------------- */
  const upsertMenu = (menu) => {
    setMenus((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev.tabs || []));

      function apply(list) {
        const idx = list.findIndex((x) => x.id === menu.id);

        if (idx !== -1) {
          list[idx] = menu;
          return list;
        }

        if (!menu.parentId) {
          menu.order = list.length + 1;
          list.push(menu);
          return list;
        }

        return list.map((item) => ({
          ...item,
          children:
            item.id === menu.parentId
              ? [
                  ...(item.children || []),
                  {
                    ...menu,
                    order: (item.children?.length || 0) + 1,
                  },
                ]
              : apply(item.children || []),
        }));
      }

      return { ...prev, tabs: apply(cloned) };
    });
  };

  /* ---------------- DELETE MENU ---------------- */
  const deleteMenu = (id) => {
    setMenus((prev) => {
      function remove(list) {
        return list
          .filter((x) => x.id !== id)
          .map((m) => ({ ...m, children: remove(m.children || []) }));
      }

      return { ...prev, tabs: remove(prev.tabs || []) };
    });
  };

  /* ---------------- SAVE MENU ---------------- */
  const saveMenu = () => {
    let menu = { ...editingMenu };

    if (menu.hasForm) {
      menu.tableName = `${slugify(menu.title)}_${Date.now()}`;
    } else {
      menu.tableName = "";
    }

    upsertMenu(menu);
    setDialogOpen(false);
    setEditingMenu(null);
  };

  /* ---------------- SAVE FORM SCHEMA ---------------- */
  const saveFormSchema = (menuId, schema) => {
    setMenus((prev) => {
      function update(list) {
        return list.map((m) => {
          if (m.id === menuId) {
            const updated = { ...m, formSchema: schema };
            if (updated.hasForm && !updated.tableName)
              updated.tableName = `${slugify(updated.title)}_${Date.now()}`;
            return updated;
          }
          return { ...m, children: update(m.children || []) };
        });
      }

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

  /* ---------------- Render Tree UI ---------------- */
  const renderTree = (list, lvl = 0) =>
    list.map((m) => (
      <div key={m.id} className="ml-4 mb-3">
        <div className="flex justify-between items-center">
          <span>
            {"— ".repeat(lvl)} {m.title}
          </span>

          <div className="flex gap-1">
            {/* Add Submenu */}
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => {
                setEditingMenu({
                  id: crypto.randomUUID(),
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
                setEditingMenu(m);
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
          {/* SAVE ALL BUTTON */}
          <Button
            variant="contained"
            color={hasChanges && !validationError ? "success" : "inherit"}
            startIcon={hasChanges ? <Save /> : <CheckCircle />}
            disabled={!hasChanges || !!validationError}
            onClick={handleSaveAll}
          >
            {hasChanges ? "Save All" : "Saved"}
          </Button>

          {/* DEPLOY BUTTON */}
          <Button
            variant="contained"
            color="primary"
            startIcon={
              deployLoading ? <CircularProgress size={20} /> : <CloudUpload />
            }
            disabled={hasChanges || !!validationError || deployLoading}
            onClick={handleDeploySchema}
          >
            {deployLoading ? "Deploying..." : "Deploy Schema"}
          </Button>
        </div>
      </div>

      {validationError && <Alert severity="error">{validationError}</Alert>}

      {/* Root menu add */}
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          setEditingMenu({
            id: crypto.randomUUID(),
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

      {/* Add/Edit Menu Dialog */}
      <Dialog fullWidth open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingMenu?.parentId ? "Add Submenu" : "Add Menu"}
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

      {/* Form Builder */}
      {formBuilder && (
        <Dialog
          open={!!formBuilder}
          fullScreen={fullScreen}
          fullWidth
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
