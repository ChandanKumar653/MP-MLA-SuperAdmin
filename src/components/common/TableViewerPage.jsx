// src/components/common/TableViewerPage.jsx
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
  const { menus } = useContext(MenuContext);

  const tenantId = menus?.tenantId;

  const { id, title, hasForm } = menu || {};

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { execute: fetchData } = useApi(apiEndpoints.submitForm.allData, {
    immediate: false,
  });

  useEffect(() => {
    if (!tenantId || !menu) return;

    const load = async () => {
      try {
        setLoading(true);

        const response = await fetchData({ tenantId, title });

        const dataArray = response?.data || [];

        // generate dynamic columns
        if (dataArray.length > 0) {
          const keys = Object.keys(dataArray[0]);
          const generatedCols = keys.map((key) => ({
            key,
            label: key.replace(/_/g, " ").toUpperCase(),
          }));
          setColumns(generatedCols);
        } else {
          setColumns([]);
        }

        setRows(dataArray);
      } catch (error) {
        console.error("Error loading table data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();

    // ⚡ DO NOT add fetchData — causes infinite loop
  }, [tenantId, menu, title]);

  const handleAddNewRecord = () => {
    if (!tenantId || !id) return;
    navigate(`/admin/form-viewer/${id}`);
  };

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{title || "Table"}</Typography>

        <Box display="flex" alignItems="center" gap={1}>
          {loading && <CircularProgress size={20} />}

          <Tooltip
            title={hasForm ? "Add new record" : "This menu does not have a form"}
          >
            <span>
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
        isLoading={loading}
      />
    </>
  );
};

export default TableViewerPage;
