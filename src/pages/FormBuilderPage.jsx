import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const FormBuilderPage = ({ existingForm = [], onSave }) => {
  const [fields, setFields] = useState(existingForm || []);
  const [newField, setNewField] = useState({
    label: "",
    type: "text",
    options: [],
    optionInput: "",
    required: false,
  });

  const [editField, setEditField] = useState(null);
  const [editOptionInput, setEditOptionInput] = useState("");

  // Keep fields in sync if existingForm changes
  useEffect(() => {
    setFields(existingForm || []);
  }, [existingForm]);

  // ---- Add Option ----
  const handleAddOption = () => {
    if (!newField.optionInput.trim()) return;
    setNewField({
      ...newField,
      options: [...newField.options, newField.optionInput.trim()],
      optionInput: "",
    });
  };

  const handleDeleteOption = (option) => {
    setNewField({
      ...newField,
      options: newField.options.filter((opt) => opt !== option),
    });
  };

  // ---- Add Field ----
  const addField = () => {
    if (!newField.label.trim()) return;
    setFields([...fields, { id: uuidv4(), ...newField }]);
    setNewField({
      label: "",
      type: "text",
      options: [],
      optionInput: "",
      required: false,
    });
  };

  // ---- Remove Field ----
  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  // ---- Save ----
  const saveForm = () => {
    if (onSave) onSave(fields); 
  };

  // ---- Edit Field ----
  const openEditDialog = (field) => {
    setEditField({ ...field });
    setEditOptionInput("");
  };

  const closeEditDialog = () => setEditField(null);

  const handleEditAddOption = () => {
    if (!editOptionInput.trim()) return;
    setEditField({
      ...editField,
      options: [...(editField.options || []), editOptionInput.trim()],
    });
    setEditOptionInput("");
  };

  const handleEditDeleteOption = (option) => {
    setEditField({
      ...editField,
      options: editField.options.filter((opt) => opt !== option),
    });
  };

  const saveEditField = () => {
    setFields(fields.map((f) => (f.id === editField.id ? editField : f)));
    setEditField(null);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        🛠 Build Your Form
      </h2>

      {/* FIELD CREATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <TextField
          label="Field Label"
          variant="outlined"
          size="small"
          value={newField.label}
          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
          fullWidth
        />

        <Select
          value={newField.type}
          onChange={(e) => setNewField({ ...newField, type: e.target.value })}
          size="small"
          fullWidth
        >
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="number">Number</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="date">Date</MenuItem>
          <MenuItem value="select">Dropdown</MenuItem>
          <MenuItem value="checkbox-group">Checkbox Group</MenuItem>
          <MenuItem value="file">File Upload</MenuItem>
        </Select>
      </div>

      {(newField.type === "select" || newField.type === "checkbox-group") && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <TextField
              label="Add Option"
              size="small"
              value={newField.optionInput}
              onChange={(e) =>
                setNewField({ ...newField, optionInput: e.target.value })
              }
            />
            <Button variant="outlined" onClick={handleAddOption}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {newField.options.map((option) => (
              <Chip
                key={option}
                label={option}
                onDelete={() => handleDeleteOption(option)}
                color="primary"
              />
            ))}
          </div>
        </div>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={newField.required}
            onChange={(e) =>
              setNewField({ ...newField, required: e.target.checked })
            }
          />
        }
        label="Required"
      />

      <Button
        startIcon={<Add />}
        variant="contained"
        color="primary"
        onClick={addField}
        className="mt-3"
      >
        Add Field
      </Button>

      {/* FIELD LIST */}
      <ul className="mt-6 space-y-3">
        {fields.map((field) => (
          <li
            key={field.id}
            className="flex justify-between items-center border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium text-gray-800">
                {field.label}{" "}
                <span className="text-sm text-gray-500">({field.type})</span>
              </p>
              {field.required && (
                <span className="text-xs text-red-600">* Required</span>
              )}
            </div>
            <div className="flex gap-2">
              <IconButton onClick={() => openEditDialog(field)} color="primary">
                <Edit />
              </IconButton>
              <IconButton onClick={() => removeField(field.id)} color="error">
                <Delete />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      {fields.length > 0 && (
        <Button
          onClick={saveForm}
          variant="contained"
          color="success"
          className="mt-6"
        >
          💾 Save Form
        </Button>
      )}

      {/* EDIT DIALOG */}
      {editField && (
        <Dialog open={!!editField} onClose={closeEditDialog} fullWidth>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogContent>
            <TextField
              label="Field Label"
              value={editField.label}
              onChange={(e) =>
                setEditField({ ...editField, label: e.target.value })
              }
              fullWidth
              margin="dense"
            />

            <Select
              value={editField.type}
              onChange={(e) =>
                setEditField({ ...editField, type: e.target.value, options: [] })
              }
              fullWidth
              margin="dense"
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="select">Dropdown</MenuItem>
              <MenuItem value="checkbox-group">Checkbox Group</MenuItem>
              <MenuItem value="file">File Upload</MenuItem>
            </Select>

            {(editField.type === "select" ||
              editField.type === "checkbox-group") && (
              <div className="mt-3">
                <div className="flex gap-2 mb-2">
                  <TextField
                    label="Add Option"
                    size="small"
                    value={editOptionInput}
                    onChange={(e) => setEditOptionInput(e.target.value)}
                  />
                  <Button variant="outlined" onClick={handleEditAddOption}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editField.options?.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      onDelete={() => handleEditDeleteOption(option)}
                      color="primary"
                    />
                  ))}
                </div>
              </div>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={editField.required}
                  onChange={(e) =>
                    setEditField({ ...editField, required: e.target.checked })
                  }
                />
              }
              label="Required"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button onClick={saveEditField} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default FormBuilderPage;
