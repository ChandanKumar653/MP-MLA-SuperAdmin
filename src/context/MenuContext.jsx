import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
} from "react";
import { apiEndpoints } from "../api/endpoints";
import useApi from "../context/useApi";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [menus, setMenusState] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [token, setToken] = useState(null);
  const [createdBy, setCreatedBy] = useState(null);

  const { getDecodedToken } = useContext(AuthContext);

  // 🟢 Decode token once
  useEffect(() => {
    try {
      const decoded = getDecodedToken?.();
      if (decoded) {
        setTenantId(decoded?.tenantId || null);
        setToken(decoded?.token || null);
        setCreatedBy(decoded?.userId || decoded?.tenantId || null);
      }
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, [getDecodedToken]);

  // --- API hooks ---
  const { execute: fetchMenus } = useApi(apiEndpoints.menus.getAll, {
    immediate: false,
  });
  const { execute: saveMenus } = useApi(apiEndpoints.menus.save, {
    immediate: false,
  });

  // --- Fetch menus only when tenantId ready ---
  useEffect(() => {
    if (!tenantId) return;
    const loadMenus = async () => {
      try {
        const res = await fetchMenus({
          tenantId,
          schemaVersion: 1,
          createdBy: createdBy || "",
          schema: [],
        });
        setMenusState(res?.data?.schema || []);
      } catch (err) {
        console.error("Failed to load menus:", err);
        toast.error("Failed to load menu data.");
      }
    };
    loadMenus();
  }, [tenantId, createdBy]); // ✅ removed fetchMenus from deps to avoid loops

  // --- Just updates local menus, doesn’t auto-save ---
  const setMenus = useCallback((value) => {
    const newMenus = typeof value === "function" ? value(menus) : value;
    const normalizeMenus = (list, isRoot = true) =>
      list.map((m) => ({
        ...m,
        type: isRoot ? "rootMenu" : "menu",
        children: m.children ? normalizeMenus(m.children, false) : [],
      }));
    setMenusState(normalizeMenus(newMenus));
  }, [menus]);

  // --- Save menus to API manually ---
  const saveMenuSchema = useCallback(async () => {
    try {
      await saveMenus({
        tenantId,
        schema: menus,
        createdBy,
        schemaVersion: 1,
      });
      toast.success("Menu updated successfully");
    } catch (err) {
      console.error("Failed to save menus:", err);
      toast.error("Failed to update menus.");
    }
  }, [menus, tenantId, createdBy, saveMenus]);

  return (
    <MenuContext.Provider
      value={{
        menus,
        setMenus,
        saveMenuSchema, // ✅ now exposed for manual trigger
        tenantId,
        token,
        createdBy,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
