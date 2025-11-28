import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControl,
  FormGroup,
  FormLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControlLabel
} from "@mui/material";
import { Add, Edit, Delete, DragIndicator } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ErrorBoundary } from "react-error-boundary";

// Simple name generator (slug style)
const makeNameFromLabel = (label) =>
  (label || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeFieldForAPI = (field) => {
  const typeMap = {
    text: "string",
    number: "integer",
    email: "string",
    date: "date",
    file: "file",
    "checkbox-group": "array",
    select: "string",
  };

  return {
    name: field.name || makeNameFromLabel(field.label),
    label: field.label,
    type: typeMap[field.type] || "string",
    required: !!field.validations?.required,
    unique: !!field.validations?.unique,
    regex: field.validations?.custom || "",
    minLength:
      field.validations?.minLength === "" ? null : Number(field.validations?.minLength) || null,
    maxLength:
      field.validations?.maxLength === "" ? null : Number(field.validations?.maxLength) || null,
    default: field.default ?? "",
    options: Array.isArray(field.options) ? field.options : [],
  };
};

// Error Fallback
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="p-4 text-red-600">
    <p>Something went wrong: {error.message}</p>
    <Button variant="contained" color="primary" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </div>
);

const FormBuilderPage = ({ existingForm = [], onSave }) => {
  const [fields, setFields] = useState(() =>
    (Array.isArray(existingForm) ? existingForm : []).map((field) => ({
      ...field,
      id: field.id || uuidv4(),
      validations: {
        required: field.required ?? field.validations?.required ?? false,
        minLength: field.minLength ?? field.validations?.minLength ?? "",
        maxLength: field.maxLength ?? field.validations?.maxLength ?? "",
        numeric: field.validations?.numeric ?? false,
        email: field.validations?.email ?? false,
        custom: field.regex ?? field.validations?.custom ?? "",
      },
      options: field.options || [],
      default: field.default ?? "",
      name: field.name || makeNameFromLabel(field.label),
    }))
  );

  const [newField, setNewField] = useState({
    id: uuidv4(),
    label: "",
    type: "text",
    options: [],
    optionInput: "",
    validations: { required: false, minLength: "", maxLength: "", numeric: false, email: false, custom: "" },
    default: "",
    name: "",
  });

  const [editField, setEditField] = useState(null);
  const [editOptionInput, setEditOptionInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setFields((Array.isArray(existingForm) ? existingForm : []).map((field) => ({
      ...field,
      id: field.id || uuidv4(),
      validations: {
        required: field.required ?? field.validations?.required ?? false,
        minLength: field.minLength ?? field.validations?.minLength ?? "",
        maxLength: field.maxLength ?? field.validations?.maxLength ?? "",
        numeric: field.validations?.numeric ?? false,
        email: field.validations?.email ?? false,
        custom: field.regex ?? field.validations?.custom ?? "",
      },
      options: field.options || [],
      default: field.default ?? "",
      name: field.name || makeNameFromLabel(field.label),
    })));
  }, [existingForm]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFields(items);
  };

  // Option handlers (new field)
  const handleAddOption = () => {
    if (!newField.optionInput.trim()) return;
    setNewField(prev => ({ ...prev, options: [...prev.options, prev.optionInput.trim()], optionInput: "" }));
  };
  const handleDeleteOption = (option) => setNewField(prev => ({ ...prev, options: prev.options.filter(o => o !== option) }));

  // Add field
  const addField = () => {
    if (!newField.label.trim()) return;
    const entry = { ...newField, id: uuidv4(), name: newField.name || makeNameFromLabel(newField.label) };
    setFields(prev => [...prev, entry]);
    setNewField({
      id: uuidv4(),
      label: "",
      type: "text",
      options: [],
      optionInput: "",
      validations: { required: false, minLength: "", maxLength: "", numeric: false, email: false, custom: "" },
      default: "",
      name: "",
    });
  };

  // Remove field
  const removeField = (id) => setFields(prev => prev.filter(f => f.id !== id));

  // Edit dialog
  const openEditDialog = (field) => { setEditField({ ...field }); setEditOptionInput(""); };
  const closeEditDialog = () => setEditField(null);
  const handleEditAddOption = () => {
    if (!editOptionInput.trim()) return;
    setEditField(prev => ({ ...prev, options: [...(prev.options || []), editOptionInput.trim()] }));
    setEditOptionInput("");
  };
  const handleEditDeleteOption = (option) => setEditField(prev => ({ ...prev, options: (prev.options || []).filter(o => o !== option) }));
  const saveEditField = () => { setFields(prev => prev.map(f => (f.id === editField.id ? editField : f))); setEditField(null); };

  // Validation handlers for newField
  const handleValidationChange = (key) => (event) => {
    setNewField(prev => ({ ...prev, validations: { ...prev.validations, [key]: event.target.checked } }));
  };
  const handleValidationValueChange = (key) => (event) => {
    const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value)) || "";
    setNewField(prev => ({ ...prev, validations: { ...prev.validations, [key]: value } }));
  };

  const saveForm = () => {
  try {
    const normalized = fields.map((field) => normalizeFieldForAPI(field));

    if (normalized.length === 0) {
      alert("Add at least one field before saving.");
      return;
    }

    onSave(normalized);   // 🚀 Correct updated schema passed to Menu Manager
  } catch (err) {
    console.error("Form save failed:", err);
  }
};


  // Normalizer used here ensures exact API shape
  const normalizeFieldForAPI = (field) => {
    return {
      name: field.name || makeNameFromLabel(field.label),
      label: field.label,
      type: field.type === "number" ? "integer" : (field.type === "text" ? "string" : field.type),
      required: !!field.validations?.required,
      unique: !!field.validations?.unique,
      regex: field.validations?.custom || "",
      minLength: field.validations?.minLength === "" ? null : (Number(field.validations?.minLength) || null),
      maxLength: field.validations?.maxLength === "" ? null : (Number(field.validations?.maxLength) || null),
      default: field.default ?? "",
      options: field.options || [],
    };
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Typography variant="h5" className="mb-4 font-semibold text-gray-800">🛠 Form Builder</Typography>

      {/* editor */}
      {!previewMode && (
        <>
          <Card className="mb-6 p-4 shadow-md">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <TextField label="Field Label" variant="outlined" size="small"
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  fullWidth required error={!newField.label.trim()} helperText={!newField.label.trim() ? "Field label is required" : ""} />

                <Select value={newField.type} onChange={(e) => setNewField(prev => ({
                  ...prev, type: e.target.value,
                  options: ["select", "checkbox-group"].includes(e.target.value) ? prev.options : []
                }))} size="small" fullWidth>
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="select">Dropdown</MenuItem>
                  <MenuItem value="checkbox-group">Checkbox Group</MenuItem>
                  <MenuItem value="file">File Upload</MenuItem>
                </Select>
              </div>

              {["select", "checkbox-group"].includes(newField.type) && (
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <TextField label="Add Option" size="small" value={newField.optionInput}
                      onChange={(e) => setNewField(prev => ({ ...prev, optionInput: e.target.value }))} fullWidth />
                    <Tooltip title="Add a new option">
                      <Button variant="outlined" onClick={handleAddOption} disabled={!newField.optionInput.trim()}>
                        <Add />
                      </Button>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newField.options.map(o => <Chip key={o} label={o} onDelete={() => handleDeleteOption(o)} color="primary" />)}
                  </div>
                </div>
              )}

              <FormControl component="fieldset" className="mb-4">
                <FormLabel component="legend">Field Rules</FormLabel>
                <FormGroup row>
                  <FormControlLabel control={<Checkbox checked={newField.validations.required} onChange={handleValidationChange("required")} />} label="Required" />
                  <FormControlLabel control={<TextField size="small" type="number" value={newField.validations.minLength} onChange={handleValidationValueChange("minLength")} placeholder="Min Length" />} label="Min Length" />
                  <FormControlLabel control={<TextField size="small" type="number" value={newField.validations.maxLength} onChange={handleValidationValueChange("maxLength")} placeholder="Max Length" />} label="Max Length" />
                  <FormControlLabel control={<Checkbox checked={newField.validations.numeric} onChange={handleValidationChange("numeric")} />} label="Numbers Only" />
                  <FormControlLabel control={<Checkbox checked={newField.validations.email} onChange={handleValidationChange("email")} />} label="Email Format" />
                  <FormControlLabel control={<TextField size="small" value={newField.validations.custom} onChange={(e) => setNewField(prev => ({ ...prev, validations: { ...prev.validations, custom: e.target.value } }))} placeholder="Custom Rule (pattern:/...)" />} label="Custom Rule" />
                </FormGroup>
                <FormHelperText>Set rules to ensure data quality. Leave blank for no restriction.</FormHelperText>
              </FormControl>

              <Tooltip title="Add a new field to the form">
                <Button startIcon={<Add />} variant="contained" color="primary" onClick={addField}
                  disabled={!newField.label.trim() || (["select", "checkbox-group"].includes(newField.type) && newField.options.length === 0)}>
                  Add Field
                </Button>
              </Tooltip>
            </CardContent>
          </Card>

          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setFields(Array.isArray(existingForm) ? existingForm : [])}>
            <Card className="mb-6 shadow-md">
              <CardContent>
                <Typography variant="h6" className="mb-4 text-gray-700">Form Fields</Typography>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <ul className="space-y-3" {...provided.droppableProps} ref={provided.innerRef}>
                        {Array.isArray(fields) && fields.map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(prov) => (
                              <li ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                className="flex justify-between items-center border border-gray-200 p-3 rounded-lg bg-white hover:bg-gray-50 transition">
                                <div className="flex items-center gap-2">
                                  <DragIndicator className="text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {field.label} <span className="text-sm text-gray-500">({field.type})</span>
                                    </p>
                                    {field.validations?.required && <span className="text-xs text-red-600">* Required</span>}
                                    {(field.validations?.minLength || field.validations?.maxLength) && (
                                      <span className="text-xs text-blue-600">(Length: {field.validations.minLength || "0"}-{field.validations.maxLength || "∞"})</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Tooltip title="Edit this field">
                                    <IconButton onClick={() => openEditDialog(field)} color="primary"><Edit /></IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete this field">
                                    <IconButton onClick={() => removeField(field.id)} color="error"><Delete /></IconButton>
                                  </Tooltip>
                                </div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </DragDropContext>

                {fields.length === 0 && <Typography className="text-gray-500 italic mt-4">No fields added yet.</Typography>}
              </CardContent>
            </Card>
          </ErrorBoundary>

          <div className="flex gap-4">
            <Button variant="contained" color="success" onClick={saveForm} disabled={fields.length === 0}>💾 Save Form</Button>
            <Button variant="outlined" onClick={() => setPreviewMode(true)} disabled={fields.length === 0}>Preview</Button>
          </div>
        </>
      )}

      {previewMode && (
        <Card className="mb-6 shadow-md">
          <CardContent>
            <Typography variant="h6" className="mb-4 text-gray-700">Form Preview</Typography>
            <div className="space-y-4">
              {fields.map(field => (
                <div key={field.id}>
                  <label className="block text-gray-700 font-medium mb-1">
                    {field.label} {field.validations?.required && <span className="text-red-600">*</span>}
                  </label>
                  <input type={field.type === "select" ? "text" : field.type === "checkbox-group" ? "text" : field.type}
                    className="w-full p-2 border border-gray-300 rounded" disabled placeholder={`Enter ${field.label.toLowerCase()}`} />
                  {field.options?.length > 0 && (
                    <div className="mt-2">
                      {field.options.map(option => (
                        <div key={option} className="flex items-center gap-2">
                          <input type={field.type === "select" ? "radio" : "checkbox"} disabled />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outlined" onClick={() => setPreviewMode(false)} className="mt-4">Back to Editor</Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editField && (
        <Dialog open={!!editField} onClose={closeEditDialog} fullWidth>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogContent>
            <TextField label="Field Label" value={editField.label} onChange={(e) => setEditField({ ...editField, label: e.target.value })} fullWidth margin="dense" required error={!editField.label.trim()} helperText={!editField.label.trim() ? "Field label is required" : ""} />
            <Select value={editField.type} onChange={(e) => setEditField(prev => ({ ...prev, type: e.target.value, options: ["select", "checkbox-group"].includes(e.target.value) ? prev.options : [] }))} fullWidth margin="dense">
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="select">Dropdown</MenuItem>
              <MenuItem value="checkbox-group">Checkbox Group</MenuItem>
              <MenuItem value="file">File Upload</MenuItem>
            </Select>

            {["select", "checkbox-group"].includes(editField.type) && (
              <div className="mt-3">
                <div className="flex gap-2 mb-2">
                  <TextField label="Add Option" size="small" value={editOptionInput} onChange={(e) => setEditOptionInput(e.target.value)} fullWidth />
                  <Tooltip title="Add a new option">
                    <Button variant="outlined" onClick={handleEditAddOption} disabled={!editOptionInput.trim()}><Add /></Button>
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editField.options?.map(option => <Chip key={option} label={option} onDelete={() => handleEditDeleteOption(option)} color="primary" />)}
                </div>
              </div>
            )}

            <FormControl component="fieldset" className="mb-4 mt-4">
              <FormLabel component="legend">Field Rules</FormLabel>
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={editField.validations.required} onChange={(e) => setEditField(prev => ({ ...prev, validations: { ...prev.validations, required: e.target.checked } }))} />} label="Required" />
                <FormControlLabel control={<TextField size="small" type="number" value={editField.validations.minLength} onChange={(e) => { const value = e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) || ""; setEditField(prev => ({ ...prev, validations: { ...prev.validations, minLength: value } })); }} placeholder="Min Length" />} label="Min Length" />
                <FormControlLabel control={<TextField size="small" type="number" value={editField.validations.maxLength} onChange={(e) => { const value = e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) || ""; setEditField(prev => ({ ...prev, validations: { ...prev.validations, maxLength: value } })); }} placeholder="Max Length" />} label="Max Length" />
                <FormControlLabel control={<Checkbox checked={editField.validations.numeric} onChange={(e) => setEditField(prev => ({ ...prev, validations: { ...prev.validations, numeric: e.target.checked } }))} />} label="Numbers Only" />
                <FormControlLabel control={<Checkbox checked={editField.validations.email} onChange={(e) => setEditField(prev => ({ ...prev, validations: { ...prev.validations, email: e.target.checked } }))} />} label="Email Format" />
                <FormControlLabel control={<TextField size="small" value={editField.validations.custom} onChange={(e) => setEditField(prev => ({ ...prev, validations: { ...prev.validations, custom: e.target.value } }))} placeholder="Custom Rule (pattern:/...)" />} label="Custom Rule" />
              </FormGroup>
              <FormHelperText>Set rules to ensure data quality. Leave blank for no restriction.</FormHelperText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog}>Cancel</Button>
            <Button onClick={saveEditField} variant="contained" color="primary">Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default FormBuilderPage;
