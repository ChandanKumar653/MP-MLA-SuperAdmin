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
import { useNavigate } from "react-router-dom";
export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const navigate=useNavigate();
  const [menus, setMenusState] = useState({
    tenantId: null,
    createdBy: null,
    tabs: []
  });

  const { getDecodedToken } = useContext(AuthContext);
    const decoded = getDecodedToken?.();

  /* ---------------------------------------
     TOKEN DECODE + EXPIRY VALIDATION
  ---------------------------------------- */
  useEffect(() => {
    if (!decoded) return;

    // check expiration
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      // navigate
      window.location.href = "/login";
      return;
    }

    setMenusState((prev) => ({
      ...prev,
      tenantId: decoded?.tenantId||localStorage.getItem("tenantId"),
      createdBy: decoded.userId || decoded.tenantId
    }));
  }, []);

  /* ---------------------------------------
     API HOOKS
  ---------------------------------------- */
  const { execute: fetchMenus } = useApi(decoded?.role==="user"?apiEndpoints.menus.getAllForUser:apiEndpoints.menus.getAll, { immediate: true });
  const { execute: saveMenus } = useApi(apiEndpoints.menus.save, { immediate: false });

  /* ---------------------------------------
     LOAD MENUS FROM BACKEND
  ---------------------------------------- */
  useEffect(() => {
    if (!menus.tenantId) return;

    const load = async () => {
      try {
        const res = await fetchMenus(menus.tenantId);
        const raw = res?.data?.data; // string

        let tabs = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            tabs = parsed?.[0]?.tabs || [];
          } catch (err) {
            console.error("Menu parse failed:", err);
            tabs = [];
          }
        }

        setMenusState((prev) => ({ ...prev, tabs }));
      } catch (err) {
        console.error("Failed to load menus:", err);
        setMenusState((prev) => ({ ...prev, tabs: [] }));
        toast.error("Failed to load menus");
      }
    };

    load();
  }, [menus.tenantId]);

  /* ---------------------------------------
     setMenus — handles deep updates
  ---------------------------------------- */
  const setMenus = useCallback((value) => {
    setMenusState((prev) => {
      const updated =
        typeof value === "function" ? value(prev) : value;

      return {
        ...prev,
        tabs: updated.tabs
      };
    });
  }, []);

  /* ---------------------------------------
     SAVE MENU SCHEMA — FIXED TO SEND ARRAY
  ---------------------------------------- */
  const saveMenuSchema = async ({ tabs }) => {
    try {
      await saveMenus({
        tenantId: menus.tenantId,
        createdBy: menus.createdBy,
        schemaVersion: 1,
        data: [{ tabs }]  // 👈 REAL ARRAY, NOT STRING
      });

      toast.success("Menu updated successfully");
    } catch (err) {
      console.error("Save menus failed:", err);
      toast.error("Failed to update menus");
    }
  };

  return (
    <MenuContext.Provider value={{ menus, setMenus, saveMenuSchema }}>
      {children}
    </MenuContext.Provider>
  );
};
