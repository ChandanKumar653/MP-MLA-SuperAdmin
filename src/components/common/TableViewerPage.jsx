import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { MenuContext } from "../../context/MenuContext";
import DynamicTable from "./DynamicTable";

const TableViewerPage = ({ menu }) => {
  // console.log("Menu prop in TableViewerPage:", menu);
  const { menus } = useContext(MenuContext);
  // console.log("📌 TableViewerPage → menus from context:", menus);

  /* Tenant ID is always inside MenuContext */
  const tenantId = menus?.tenantId;

  /* Full menu object comes from route */
  const { id, title, tableName, hasForm } = menu || {};

  // console.log("📌 TableViewerPage → menu:", menu);
  // console.log("📌 tenantId:", tenantId);

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* API hook — no default body */
  const { execute: fetchData } = useApi(apiEndpoints.submitForm.allData, {
    immediate: false,
  });

  useEffect(() => {
    if (!tenantId || !menu) {
      console.log("⏳ Waiting for tenantId or menu...");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        // console.log("Calling API with:", {
        //   tenantId,
        //   title,
        // });

        const response = await fetchData({
          tenantId,
          title,
        });

        // console.log("API Response:", response);

        const dataArray = response?.data || [];
        // console.log("Data Array:", dataArray);

        // Dynamically generate columns
        if (dataArray.length > 0) {
          const keys = Object.keys(dataArray[0]);
          const generatedCols = keys.map((key) => ({
            key,
            label: key.replace(/_/g, " ").toUpperCase(),
          }));
          setColumns(generatedCols);
        } else {
          setColumns([]); // no data yet
        }

        setRows(dataArray);
      } catch (error) {
        console.error("Error loading table data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, menu, fetchData, title]);

  /* ----------------- Navigation for "Add" -----------------
     Routes to FormViewerPage and passes tenantId, menuId, tableName
     via query string so FormViewerPage can open blank form for this menu.
  -------------------------------------------------------- */
  const handleAddNewRecord = () => {
  if (!tenantId || !id) {
    console.warn("Missing tenantId or menu id");
    return;
  }

  navigate(`/admin/form-viewer/${id}`);
};


  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">{title || "Table"}</Typography>

        <Box display="flex" alignItems="center" gap={1}>
          {loading && <CircularProgress size={20} />}

          {/* Add button: only enabled if menu has dynamic form attached */}
          <Tooltip
            title={
              hasForm
                ? "Add new record"
                : "This menu does not have a form attached"
            }
            arrow
          >
            <span>
              {/* span wrapper so Tooltip works when button is disabled */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNewRecord}
                disabled={!hasForm}
              >
                Add
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <DynamicTable
        columns={columns}
        rows={rows}
        loading={loading}
        title={title}
      />
    </>
  );
};

export default TableViewerPage;
