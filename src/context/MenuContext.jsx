import React, { createContext, useState, useCallback } from "react";

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [menus, setMenusState] = useState(() => {
    const saved = localStorage.getItem("menuTree");
    return saved ? JSON.parse(saved) : [];
  });

  // Wrapper that supports both value and functional updates
  const setMenus = useCallback((value) => {
    setMenusState((prev) => {
      const newMenus = typeof value === "function" ? value(prev) : value;
      localStorage.setItem("menuTree", JSON.stringify(newMenus));
      return newMenus;
    });
  }, []);

  return (
    <MenuContext.Provider value={{ menus, setMenus }}>
      {children}
    </MenuContext.Provider>
  );
};
