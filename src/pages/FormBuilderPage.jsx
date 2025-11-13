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
  Tooltip,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControl,
  FormGroup,
  FormLabel,
  FormHelperText,
} from "@mui/material";
import { Add, Edit, Delete, DragIndicator } from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { ErrorBoundary } from "react-error-boundary";

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div role="alert" className="p-4 text-red-600">
    <p>Something went wrong: {error.message}</p>
    <Button variant="contained" color="primary" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </div>
);

const FormBuilderPage = ({ existingForm = [], onSave }) => {
  // Initialize state with default validations
  const [fields, setFields] = useState(() =>
    (Array.isArray(existingForm) ? existingForm : []).map((field) => ({
      ...field,
      id: field.id || uuidv4(),
      validations: {
        required: field.validations?.required || false,
        minLength: field.validations?.minLength || "",
        maxLength: field.validations?.maxLength || "",
        numeric: field.validations?.numeric || false,
        email: field.validations?.email || false,
        custom: field.validations?.custom || "",
      },
      options: field.options || [],
    }))
  );
  const [newField, setNewField] = useState({
    id: uuidv4(),
    label: "",
    type: "text",
    options: [],
    optionInput: "",
    required: false,
    validations: { required: false, minLength: "", maxLength: "", numeric: false, email: false, custom: "" },
  });
  const [editField, setEditField] = useState(null);
  const [editOptionInput, setEditOptionInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Sync with existingForm
  useEffect(() => {
    setFields((prev) =>
      (Array.isArray(existingForm) ? existingForm : []).map((field) => ({
        ...field,
        id: field.id || uuidv4(),
        validations: {
          required: field.validations?.required || false,
          minLength: field.validations?.minLength || "",
          maxLength: field.validations?.maxLength || "",
          numeric: field.validations?.numeric || false,
          email: field.validations?.email || false,
          custom: field.validations?.custom || "",
        },
        options: field.options || [],
      }))
    );
  }, [existingForm]);

  // Handle drag end
  const onDragEnd = (result) => {
    if (!result.destination || !Array.isArray(fields)) return;
    const items = [...fields];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFields(items);
  };

  // Add Option
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

  // Add Field
  const addField = () => {
    if (!newField.label.trim()) return;
    setFields((prev) => [...prev, { ...newField, id: uuidv4() }]);
    setNewField({
      id: uuidv4(),
      label: "",
      type: "text",
      options: [],
      optionInput: "",
      required: false,
      validations: { required: false, minLength: "", maxLength: "", numeric: false, email: false, custom: "" },
    });
  };

  // Remove Field
  const removeField = (id) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  // Save Form
  const saveForm = () => {
    if (onSave) onSave(fields);
  };

  // Edit Field
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

  // Handle validation changes
  const handleValidationChange = (key) => (event) => {
    if (key === "required") {
      setNewField({
        ...newField,
        required: event.target.checked,
        validations: { ...newField.validations, [key]: event.target.checked },
      });
    } else {
      setNewField({
        ...newField,
        validations: { ...newField.validations, [key]: event.target.checked },
      });
    }
  };

  const handleValidationValueChange = (key) => (event) => {
    const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value)) || "";
    setNewField({
      ...newField,
      validations: { ...newField.validations, [key]: value },
    });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Typography variant="h5" className="mb-4 font-semibold text-gray-800">
        🛠 Form Builder
      </Typography>

      {!previewMode && (
        <>
          {/* Field Creation */}
          <Card className="mb-6 p-4 shadow-md">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Field Label"
                  variant="outlined"
                  size="small"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  fullWidth
                  required
                  error={!newField.label.trim()}
                  helperText={!newField.label.trim() ? "Field label is required" : ""}
                />
                <Select
                  value={newField.type}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      type: e.target.value,
                      options: ["select", "checkbox-group"].includes(e.target.value) ? newField.options : [],
                    })
                  }
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

              {["select", "checkbox-group"].includes(newField.type) && (
                <div className="mb-4">
                  <div className="flex gap-2 mb-2">
                    <TextField
                      label="Add Option"
                      size="small"
                      value={newField.optionInput}
                      onChange={(e) => setNewField({ ...newField, optionInput: e.target.value })}
                      fullWidth
                      error={!newField.optionInput.trim() && newField.options.length === 0}
                      helperText={!newField.optionInput.trim() && newField.options.length === 0 ? "At least one option is required" : ""}
                    />
                    <Tooltip title="Add a new option">
                      <Button
                        variant="outlined"
                        onClick={handleAddOption}
                        disabled={!newField.optionInput.trim()}
                      >
                        <Add />
                      </Button>
                    </Tooltip>
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

              {/* Validation Options */}
              <FormControl component="fieldset" className="mb-4">
                <FormLabel component="legend">Field Rules</FormLabel>
                <FormGroup row>
                  <Tooltip title="Make this field mandatory">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newField.validations.required}
                          onChange={handleValidationChange("required")}
                        />
                      }
                      label="Required"
                    />
                  </Tooltip>
                  <Tooltip title="Set the minimum number of characters (leave blank for no limit)">
                    <FormControlLabel
                      control={
                        <TextField
                          size="small"
                          type="number"
                          value={newField.validations.minLength}
                          onChange={handleValidationValueChange("minLength")}
                          placeholder="Min Length"
                          inputProps={{ min: 0 }}
                          error={newField.validations.minLength !== "" && isNaN(Number(newField.validations.minLength))}
                          helperText={
                            newField.validations.minLength !== "" && isNaN(Number(newField.validations.minLength))
                              ? "Please enter a valid number"
                              : "Leave blank for no minimum"
                          }
                        />
                      }
                      label="Min Length"
                    />
                  </Tooltip>
                  <Tooltip title="Set the maximum number of characters (leave blank for no limit)">
                    <FormControlLabel
                      control={
                        <TextField
                          size="small"
                          type="number"
                          value={newField.validations.maxLength}
                          onChange={handleValidationValueChange("maxLength")}
                          placeholder="Max Length"
                          inputProps={{ min: 0 }}
                          error={newField.validations.maxLength !== "" && isNaN(Number(newField.validations.maxLength))}
                          helperText={
                            newField.validations.maxLength !== "" && isNaN(Number(newField.validations.maxLength))
                              ? "Please enter a valid number"
                              : "Leave blank for no maximum"
                          }
                        />
                      }
                      label="Max Length"
                    />
                  </Tooltip>
                  <Tooltip title="Only allow numbers">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newField.validations.numeric}
                          onChange={handleValidationChange("numeric")}
                        />
                      }
                      label="Numbers Only"
                    />
                  </Tooltip>
                  <Tooltip title="Must be a valid email">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newField.validations.email}
                          onChange={handleValidationChange("email")}
                        />
                      }
                      label="Email Format"
                    />
                  </Tooltip>
                  <Tooltip title="Add a custom rule (e.g., 'pattern:/^\d+$/')">
                    <FormControlLabel
                      control={
                        <TextField
                          size="small"
                          value={newField.validations.custom}
                          onChange={handleValidationValueChange("custom")}
                          placeholder="Custom Rule (e.g., pattern:/^\d+$/)"
                        />
                      }
                      label="Custom Rule"
                    />
                  </Tooltip>
                </FormGroup>
                <FormHelperText>
                  Set rules to ensure data quality. Leave blank for no restriction.
                </FormHelperText>
              </FormControl>

              <Tooltip title="Add a new field to the form">
                <Button
                  startIcon={<Add />}
                  variant="contained"
                  color="primary"
                  onClick={addField}
                  className="mt-4"
                  disabled={!newField.label.trim() || (["select", "checkbox-group"].includes(newField.type) && newField.options.length === 0)}
                >
                  Add Field
                </Button>
              </Tooltip>
            </CardContent>
          </Card>

          {/* Field List with Error Boundary */}
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setFields(existingForm || [])}>
            <Card className="mb-6 shadow-md">
              <CardContent>
                <Typography variant="h6" className="mb-4 text-gray-700">
                  Form Fields
                </Typography>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <ul
                        className="space-y-3"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {Array.isArray(fields) &&
                          fields.map((field, index) => (
                            <Draggable
                              key={field.id}
                              draggableId={field.id}
                              index={index}
                            >
                              {(provided) => (
                                <li
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex justify-between items-center border border-gray-200 p-3 rounded-lg bg-white hover:bg-gray-50 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <DragIndicator className="text-gray-400" />
                                    <div>
                                      <p className="font-medium text-gray-800">
                                        {field.label}{" "}
                                        <span className="text-sm text-gray-500">
                                          ({field.type})
                                        </span>
                                      </p>
                                      {field.validations?.required && (
                                        <span className="text-xs text-red-600">
                                          * Required
                                        </span>
                                      )}
                                      {(field.validations?.minLength ||
                                        field.validations?.maxLength) && (
                                        <span className="text-xs text-blue-600">
                                          (Length: {field.validations.minLength || "0"}-{field.validations.maxLength || "∞"})
                                        </span>
                                      )}
                                      {field.validations?.numeric && (
                                        <span className="text-xs text-blue-600">
                                          (Numbers Only)
                                        </span>
                                      )}
                                      {field.validations?.email && (
                                        <span className="text-xs text-blue-600">
                                          (Email)
                                        </span>
                                      )}
                                      {field.validations?.custom && (
                                        <span className="text-xs text-blue-600">
                                          (Custom: {field.validations.custom})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Tooltip title="Edit this field">
                                      <IconButton
                                        onClick={() => openEditDialog(field)}
                                        color="primary"
                                      >
                                        <Edit />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete this field">
                                      <IconButton
                                        onClick={() => removeField(field.id)}
                                        color="error"
                                      >
                                        <Delete />
                                      </IconButton>
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
                {fields.length === 0 && (
                  <Typography className="text-gray-500 italic mt-4">
                    No fields added yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </ErrorBoundary>

          <div className="flex gap-4">
            <Button
              variant="contained"
              color="success"
              onClick={saveForm}
              disabled={fields.length === 0}
              className="mb-4"
            >
              💾 Save Form
            </Button>
            <Button
              variant="outlined"
              onClick={() => setPreviewMode(true)}
              disabled={fields.length === 0}
              className="mb-4"
            >
              Preview
            </Button>
          </div>
        </>
      )}

      {previewMode && (
        <Card className="mb-6 shadow-md">
          <CardContent>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Form Preview
            </Typography>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-gray-700 font-medium mb-1">
                    {field.label} {field.validations?.required && <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type={
                      field.type === "select"
                        ? "text"
                        : field.type === "checkbox-group"
                        ? "text"
                        : field.type
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                    disabled
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                  {field.options?.length > 0 && (
                    <div className="mt-2">
                      {field.options.map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <input
                            type={field.type === "select" ? "radio" : "checkbox"}
                            disabled
                          />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outlined"
              onClick={() => setPreviewMode(false)}
              className="mt-4"
            >
              Back to Editor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editField && (
        <Dialog open={!!editField} onClose={closeEditDialog} fullWidth>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogContent>
            <TextField
              label="Field Label"
              value={editField.label}
              onChange={(e) => setEditField({ ...editField, label: e.target.value })}
              fullWidth
              margin="dense"
              required
              error={!editField.label.trim()}
              helperText={!editField.label.trim() ? "Field label is required" : ""}
            />

            <Select
              value={editField.type}
              onChange={(e) =>
                setEditField({
                  ...editField,
                  type: e.target.value,
                  options: ["select", "checkbox-group"].includes(e.target.value) ? editField.options : [],
                })
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

            {["select", "checkbox-group"].includes(editField.type) && (
              <div className="mt-3">
                <div className="flex gap-2 mb-2">
                  <TextField
                    label="Add Option"
                    size="small"
                    value={editOptionInput}
                    onChange={(e) => setEditOptionInput(e.target.value)}
                    fullWidth
                    error={!editOptionInput.trim() && editField.options.length === 0}
                    helperText={!editOptionInput.trim() && editField.options.length === 0 ? "At least one option is required" : ""}
                  />
                  <Tooltip title="Add a new option">
                    <Button
                      variant="outlined"
                      onClick={handleEditAddOption}
                      disabled={!editOptionInput.trim()}
                    >
                      <Add />
                    </Button>
                  </Tooltip>
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

            <FormControl component="fieldset" className="mb-4 mt-4">
              <FormLabel component="legend">Field Rules</FormLabel>
              <FormGroup row>
                <Tooltip title="Make this field mandatory">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editField.validations.required}
                        onChange={(e) =>
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, required: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Required"
                  />
                </Tooltip>
                <Tooltip title="Set the minimum number of characters (leave blank for no limit)">
                  <FormControlLabel
                    control={
                      <TextField
                        size="small"
                        type="number"
                        value={editField.validations.minLength}
                        onChange={(e) => {
                          const value = e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) || "";
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, minLength: value },
                          });
                        }}
                        placeholder="Min Length"
                        inputProps={{ min: 0 }}
                        error={editField.validations.minLength !== "" && isNaN(Number(editField.validations.minLength))}
                        helperText={
                          editField.validations.minLength !== "" && isNaN(Number(editField.validations.minLength))
                            ? "Please enter a valid number"
                            : "Leave blank for no minimum"
                        }
                      />
                    }
                    label="Min Length"
                  />
                </Tooltip>
                <Tooltip title="Set the maximum number of characters (leave blank for no limit)">
                  <FormControlLabel
                    control={
                      <TextField
                        size="small"
                        type="number"
                        value={editField.validations.maxLength}
                        onChange={(e) => {
                          const value = e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) || "";
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, maxLength: value },
                          });
                        }}
                        placeholder="Max Length"
                        inputProps={{ min: 0 }}
                        error={editField.validations.maxLength !== "" && isNaN(Number(editField.validations.maxLength))}
                        helperText={
                          editField.validations.maxLength !== "" && isNaN(Number(editField.validations.maxLength))
                            ? "Please enter a valid number"
                            : "Leave blank for no maximum"
                        }
                      />
                    }
                    label="Max Length"
                  />
                </Tooltip>
                <Tooltip title="Only allow numbers">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editField.validations.numeric}
                        onChange={(e) =>
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, numeric: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Numbers Only"
                  />
                </Tooltip>
                <Tooltip title="Must be a valid email">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editField.validations.email}
                        onChange={(e) =>
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, email: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Email Format"
                  />
                </Tooltip>
                <Tooltip title="Add a custom rule (e.g., 'pattern:/^\d+$/')">
                  <FormControlLabel
                    control={
                      <TextField
                        size="small"
                        value={editField.validations.custom}
                        onChange={(e) =>
                          setEditField({
                            ...editField,
                            validations: { ...editField.validations, custom: e.target.value },
                          })
                        }
                        placeholder="Custom Rule (e.g., pattern:/^\d+$/)"
                      />
                    }
                    label="Custom Rule"
                  />
                </Tooltip>
              </FormGroup>
              <FormHelperText>
                Set rules to ensure data quality. Leave blank for no restriction.
              </FormHelperText>
            </FormControl>
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