// src/components/common/TableViewerPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { MenuContext } from "../../context/MenuContext";
import DynamicTable from "./DynamicTable";
import EditFormDialog from "./EditFormDialog";

const TableViewerPage = ({ menu }) => {
  const { menus } = useContext(MenuContext);
  const tenantId = menus?.tenantId;

  const { id, title, hasForm, formSchema } = menu || {};

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);

  // NEW:: Delete dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const navigate = useNavigate();
  const { execute: fetchData } = useApi(apiEndpoints.submitForm.allData, { immediate: false });

  // Load table data
  useEffect(() => {
    if (!tenantId || !menu) return;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchData({ tenantId, title });
        const dataArray = response?.data || [];

        const tableRows = dataArray.map((row, index) => ({
          ...row,
          pk: row.id ?? row.pk ?? index,
          createdAt: row.createdAt
            ? new Date(row.createdAt).toLocaleString()
            : new Date().toLocaleString(),
        }));

        setRows(tableRows);

        const generatedCols =
          formSchema?.map((f) => ({ key: f.name, label: f.label })) || [];

        generatedCols.push({ key: "createdAt", label: "Created At" });

        generatedCols.push({
          key: "action",
          label: "Action",
          render: (row) => (
            <Box display="flex" gap={1}>
              <Tooltip title="Edit">
                <IconButton  size="small" color="primary" onClick={() => handleEdit(row)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton  size="small" color="error" onClick={() => openDeleteDialog(row)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ),
        });

        setColumns(generatedCols);
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, menu, title, formSchema, fetchData]);

  const handleAddNewRecord = () => {
    navigate(`/admin/form-viewer/${id}`);
  };

  const handleEdit = (row) => {
    setCurrentRow(row);
    setEditOpen(true);
  };

  // NEW: Open Delete Dialog
  const openDeleteDialog = (row) => {
    setRowToDelete(row);
    setDeleteOpen(true);
  };

  // NEW: Confirm delete
  const confirmDelete = () => {
    if (!rowToDelete) return;
    setRows((prev) => prev.filter((x) => x.pk !== rowToDelete.pk));
    setDeleteOpen(false);
    setRowToDelete(null);
  };

  // Update only edited row
  const handleSaveEdit = (updatedRow) => {
    setRows((prev) =>
      prev.map((r) => (r.pk === updatedRow.pk ? { ...r, ...updatedRow } : r))
    );
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{title}</Typography>

        <Box display="flex" gap={1}>
          {loading && <CircularProgress size={20} />}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewRecord}
            disabled={!hasForm}
          >
            Add
          </Button>
        </Box>
      </Box>

      <DynamicTable columns={columns} rows={rows} isLoading={loading} />

      {currentRow && (
        <EditFormDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          formSchema={formSchema}
          rowData={currentRow}
          onSave={handleSaveEdit}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete this record?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>

          <Button variant="contained" color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TableViewerPage;
