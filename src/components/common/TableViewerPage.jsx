// src/components/common/TableViewerPage.jsx
import React, {
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";
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
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import toast from "react-hot-toast";

import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { MenuContext } from "../../context/MenuContext";
import DynamicTable from "./DynamicTable";
import EditFormDialog from "./EditFormDialog";
import { AuthContext } from "../../context/AuthContext";
const TableViewerPage = ({ menu }) => {
  // console.log("Rendering TableViewerPage with menu:", menu);
  const { menus } = useContext(MenuContext);
  // console.log("Menus in TableViewerPage:", menus);
  const{role,userId}=useContext(AuthContext);
  const tenantId = menus?.tenantId;

  const { id, title, hasForm, formSchema ,access_level,tableName} = menu || {};
  const navigate = useNavigate();

  const { execute: fetchData } = useApi(
    role==="user"?apiEndpoints.submitForm.allDataForUser:
    apiEndpoints.submitForm.allData,
    { immediate: false }
  );

  const {execute:updateData}=useApi(
    role==="user"?
    apiEndpoints.submitForm.editDataForUser:
    apiEndpoints.submitForm.editData,
    { immediate: false }
  );

  const {execute:deleteData}=useApi(
    role==="user"?
    apiEndpoints.submitForm.deleteDataForUser:
    apiEndpoints.submitForm.deleteData,
    { immediate: false }
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [refresh, setRefresh] = useState(false);

  /* =======================
     LOAD DATA
  ======================= */
  useEffect(() => {
    if (!tenantId || !menu) return;

    const load = async () => {
      try {
        setLoading(true);
        let response;
        if(role==="user"){
          response = await fetchData({ tenantId, title,userId });
        }else{
          response = await fetchData({ tenantId, title });
        }
        // const response = await fetchData({ tenantId, title });
        const dataArray = response?.data || [];

        const tableRows = dataArray.map((row, index) => ({
          id: row.id ?? row.pk ?? index,
          ...row,
          createdAt: row.createdAt
            ? new Date(row.createdAt).toLocaleString()
            : new Date().toLocaleString(),
        }));

        setRows(tableRows);
      } catch (e) {
        console.error("Error loading table data:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, menu, title, fetchData]);

  /* =======================
     HANDLERS
  ======================= */
  const handleAddNewRecord = () => {
    navigate(`/${role}/form-viewer/${id}`);
  };

  const handleEdit = (row) => {
    setCurrentRow(row);
    setEditOpen(true);
  };

  const openDeleteDialog = (row) => {
    setRowToDelete(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!rowToDelete) return;

    // setRows((prev) => prev.filter((r) => r.id !== rowToDelete.id));
    try {
      const body={ tenantId,userId,id,title,tableName }
      console.log("Delete body:", body);
      const res= await deleteData(body);
    }catch (error) {
      // toast.error(error?.response?.data?.error||error?.response?.data?.message);
      toast.error("Failed to delete data");
    }
    setRefresh(!refresh);
    setDeleteOpen(false);
    setRowToDelete(null);
  };

  const handleSaveEdit =async (updatedRow) => {
    
    try {

      const res=await updateData({ tenantId,userId,data:updatedRow,id,title });
     
      
    } catch (error) {
      toast.error(error?.response?.data?.error||error?.response?.data?.message||"Failed to update data");
    }

  };

  /* =======================
     COLUMNS
  ======================= */
  const columns = useMemo(() => {
    const dynamicCols =
      formSchema?.map((f) => ({
        field: f.name,
        headerName: f.label,
        flex: 1,
      })) || [];

    return [
      ...dynamicCols,
      {
        field: "createdAt",
        headerName: "Created At",
        flex: 1,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box display="flex" gap={1}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEdit(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => openDeleteDialog(params.row)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ];
  }, [formSchema]);

  /* =======================
     UI
  ======================= */
  return (
    <Paper sx={{ p: 3, width: "100%", minWidth: 0 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{title}</Typography>

        <Box display="flex" gap={1} alignItems="center">
          {loading && <CircularProgress size={20} />}
   
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNewRecord}
            // disabled={!hasForm}
            disabled={!hasForm||(role==="user"&&access_level!=="write")}
          >
            Add
          </Button>
          
        </Box>
      </Box>

      {/* TABLE */}
      <Box sx={{ width: "100%" }}>
        <DynamicTable
          title={title}
          columns={columns}
          rows={rows}
          isLoading={loading}
        />
      </Box>

      {/* EDIT DIALOG */}
      {currentRow && (
        <EditFormDialog
          open={editOpen}
          keepMounted
          onClose={() => setEditOpen(false)}
          formSchema={formSchema}
          rowData={currentRow}
          onSave={handleSaveEdit}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <Dialog
        open={deleteOpen}
        keepMounted
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

          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TableViewerPage;
