import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { apiEndpoints } from "../api/endpoints";
import useApi from "../context/useApi";
import { AuthContext } from "./AuthContext";

export const MenuContext = createContext(null);

export const MenuProvider = ({ children }) => {
  const navigate = useNavigate();
  const fetchedRef = useRef(false);

  const { getDecodedToken } = useContext(AuthContext);

  /* ---------------------------------------
     STABLE AUTH STATE (KEY FIX)
  ---------------------------------------- */
  const [decodedUser, setDecodedUser] = useState(null);

  const [menus, setMenusState] = useState({
    tenantId: null,
    createdBy: null,
    tabs: [],
  });

  /* ---------------------------------------
     DECODE TOKEN ONCE
  ---------------------------------------- */
  useEffect(() => {
    const decoded = getDecodedToken?.();
    if (!decoded) return;

    // Token expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return;
    }

    setDecodedUser(decoded);
    setMenusState((prev) => ({
      ...prev,
      tenantId: decoded.tenantId || localStorage.getItem("tenantId"),
      createdBy: decoded.userId || decoded.tenantId,
    }));
  }, [getDecodedToken, navigate]);

  /* ---------------------------------------
     API HOOKS (DEPEND ON decodedUser)
  ---------------------------------------- */
  const { execute: fetchMenus } = useApi(
    decodedUser?.role === "user"
      ? apiEndpoints.menus.getAllForUser
      : apiEndpoints.menus.getAll,
    { immediate: false }
  );

  const { execute: saveMenus } = useApi(apiEndpoints.menus.save, {
    immediate: false,
  });

  /* ---------------------------------------
     LOAD MENUS (ONCE PER TENANT)
  ---------------------------------------- */
  // useEffect(() => {
  //   if (!menus.tenantId || !decodedUser || fetchedRef.current) return;

  //   const loadMenus = async () => {
  //     try {
  //       fetchedRef.current = true;
  //       let res;
  //       if(decodedUser?.role === "user"){
  //         res = await fetchMenus({tenantId:menus.tenantId, userId:decodedUser.userId});
  //       }else{
  //         res = await fetchMenus(menus.tenantId);
  //       }
  //       const raw = res?.data?.data;

  //       let tabs = [];

  //       if (Array.isArray(raw)) {
  //         tabs = raw?.[0]?.tabs || [];
  //       } else if (typeof raw === "string") {
  //         try {
  //           const parsed = JSON.parse(raw);
  //           tabs = parsed?.[0]?.tabs || [];
  //         } catch (err) {
  //           console.error("Menu JSON parse error:", err);
  //         }
  //       }

  //       setMenusState((prev) => ({ ...prev, tabs }));
  //     } catch (err) {
  //       fetchedRef.current = false;
  //       console.error("Failed to load menus:", err);
  //       toast.error("Failed to load menus");
  //     }
  //   };

  //   const decoded = getDecodedToken?.();

  //   if (decoded?.role !== "superadmin") {
  //     loadMenus();
  //   }
  // }, [menus.tenantId, decodedUser, fetchMenus]);


//   useEffect(() => {
//   if (!menus?.tenantId || !decodedUser || fetchedRef.current) return;

//   const loadMenus = async () => {
//     try {
//       fetchedRef.current = true;

//       let res;
//       if (decodedUser.role === "user") {
//         res = await fetchMenus({
//           tenantId: menus.tenantId,
//           userId: decodedUser.userId,
//         });
//       } else {
//         res = await fetchMenus(menus.tenantId);
//       }

//       const apiData = res?.data?.data;
//       let tabs = [];

//       /* ---------------- ADMIN ---------------- */
//       if (decodedUser.role !== "user") {
//         // admin → data.data is STRINGIFIED JSON
//         if (typeof apiData?.data === "string") {
//           try {
//             const parsed = JSON.parse(apiData.data);
//             tabs = parsed?.[0]?.tabs || [];
//           } catch (e) {
//             console.error("Admin schema parse failed:", e);
//           }
//         }
//       }

//       /* ---------------- USER ---------------- */
//       else {
//         // user → data.schema is already ARRAY
//         if (Array.isArray(apiData?.schema)) {
//           tabs = apiData.schema?.[0]?.tabs || [];
//         }
//       }

//       setMenusState((prev) => ({
//         ...prev,
//         tabs, // includes access_level automatically for user
//       }));
//     } catch (err) {
//       fetchedRef.current = false;
//       console.error("Failed to load menus:", err);
//       toast.error("Failed to load menus");
//     }
//   };

//   loadMenus();
// }, [menus?.tenantId, decodedUser, fetchMenus]);


useEffect(() => {
  if (!menus?.tenantId || !decodedUser || fetchedRef.current) return;

  const loadMenus = async () => {
    try {
      fetchedRef.current = true;

      let res;
      if (decodedUser.role === "user") {
        res = await fetchMenus({
          tenantId: menus.tenantId,
          userId: decodedUser.userId,
        });
      } else {
        res = await fetchMenus(menus.tenantId);
      }

      let tabs = [];

      /* ---------------- ADMIN ---------------- */
      // res.data.data.data → STRINGIFIED JSON
      if (decodedUser.role !== "user") {
        const raw = res?.data?.data;
        if (typeof raw === "string") {
          try {
            const parsed = JSON.parse(raw);
            tabs = parsed?.[0]?.tabs || [];
          } catch (e) {
            console.error("Admin schema parse failed", e);
          }
        }
      }

      /* ---------------- USER ---------------- */
      // res.data.data.schema → ARRAY
      else {
        const schema = res?.data?.schema;
        if (Array.isArray(schema)) {
          tabs = schema?.[0]?.tabs || [];
        }
      }

      /* 🔑 SINGLE NORMALIZED OUTPUT */
      setMenusState((prev) => ({
        ...prev,
        tabs,
      }));
    } catch (err) {
      fetchedRef.current = false;
      console.error("Failed to load menus:", err);
      toast.error("Failed to load menus");
    }
  };

  loadMenus();
}, [menus?.tenantId, decodedUser]);




  /* ---------------------------------------
     SAFE SETTER
  ---------------------------------------- */
  const setMenus = useCallback((value) => {
    setMenusState((prev) => {
      const updated = typeof value === "function" ? value(prev) : value;

      return {
        ...prev,
        ...updated,
      };
    });
  }, []);

  /* ---------------------------------------
     SAVE MENU SCHEMA
  ---------------------------------------- */
  const saveMenuSchema = async ({ tabs }) => {
    try {
      await saveMenus({
        tenantId: menus.tenantId,
        createdBy: menus.createdBy,
        schemaVersion: 1,
        data: [{ tabs }],
      });

      toast.success("Menu updated successfully");
    } catch (err) {
      console.error("Save menu failed:", err);
      toast.error("Failed to update menus");
    }
  };

  return (
    <MenuContext.Provider
      value={{
        menus,
        setMenus,
        saveMenuSchema,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
