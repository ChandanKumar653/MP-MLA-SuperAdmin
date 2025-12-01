import React, { useEffect, useState, useContext } from "react";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";
import { MenuContext } from "../../context/MenuContext";                                                              
import DynamicTable from "./DynamicTable";

const TableViewerPage = ({ menu }) => {
    console.log("Menu prop in TableViewerPage:", menu);
  const { menus } = useContext(MenuContext);
  console.log("📌 TableViewerPage → menus from context:", menus);

  /* Tenant ID is always inside MenuContext */
  const tenantId = menus?.tenantId;

  /* Full menu object comes from route */
  const { id, title, tableName } = menu || {};

  console.log("📌 TableViewerPage → menu:", menu);
  console.log("📌 tenantId:", tenantId);

  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);

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

        console.log("🚀 Calling API with:", {
          tenantId,
          id: id || menu?.id,
          tableName,
        });

        const response = await fetchData({
          tenantId,
          id: id || menu?.id,
          tableName,
        });

        console.log("📥 API Response:", response);

        const dataArray = response?.data?.data || [];

        // Dynamically generate columns
        if (dataArray.length > 0) {
          const keys = Object.keys(dataArray[0]);
          const generatedCols = keys.map((key) => ({
            key,
            label: key.replace(/_/g, " ").toUpperCase(),
          }));
          setColumns(generatedCols);
        }

        setRows(dataArray);
      } catch (error) {
        console.error("❌ Error loading table data:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tenantId, menu]);

  return (
    <DynamicTable
      columns={columns}
      rows={rows}
      loading={loading}
      title={title}
    />
  );
};

export default TableViewerPage;
