import React, { createContext, useState, useEffect } from "react";

export const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [activeOrg, setActiveOrg] = useState(null);

  // Optionally persist selected org in localStorage
  useEffect(() => {
    const savedOrg = localStorage.getItem("activeOrg");
    if (savedOrg) {
      setActiveOrg(JSON.parse(savedOrg));
    }
  }, []);

  const selectOrganization = (org) => {
    setActiveOrg(org);
    localStorage.setItem("activeOrg", JSON.stringify(org));
  };

  const clearOrganization = () => {
    setActiveOrg(null);
    localStorage.removeItem("activeOrg");
  };

  return (
    <OrganizationContext.Provider
      value={{ activeOrg, selectOrganization, clearOrganization }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
