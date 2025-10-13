import { useState } from "react";
import { Button, TextField, List, ListItem } from "@mui/material";

export default function MenuManager() {
  const [menus, setMenus] = useState([]);
  const [menuName, setMenuName] = useState("");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [subMenus, setSubMenus] = useState({});

  const addMenu = () => {
    if (menuName) {
      setMenus([...menus, menuName]);
      setMenuName("");
    }
  };

  const addSubMenu = (menu) => {
    const name = prompt("Enter sub-menu name:");
    if (name) {
      setSubMenus({
        ...subMenus,
        [menu]: [...(subMenus[menu] || []), name],
      });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <h2 className="text-xl font-semibold mb-3">Menus</h2>
        <TextField
          label="Menu name"
          size="small"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          className="w-full mb-2"
        />
        <Button variant="contained" color="primary" fullWidth onClick={addMenu}>
          + Add Menu
        </Button>

        <List>
          {menus.map((m) => (
            <ListItem
              key={m}
              className="flex justify-between items-center border-b"
            >
              <span
                onClick={() => setSelectedMenu(m)}
                className={`cursor-pointer ${
                  selectedMenu === m ? "text-blue-600" : ""
                }`}
              >
                {m}
              </span>
              <Button size="small" onClick={() => addSubMenu(m)}>
                + Sub
              </Button>
            </ListItem>
          ))}
        </List>
      </div>

      <div className="col-span-2">
        {selectedMenu && (
          <div>
            <h3 className="text-lg font-semibold">
              Submenus for {selectedMenu}
            </h3>
            <ul className="mt-2 space-y-2">
              {(subMenus[selectedMenu] || []).map((s) => (
                <li key={s} className="border p-2 rounded bg-gray-50">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
