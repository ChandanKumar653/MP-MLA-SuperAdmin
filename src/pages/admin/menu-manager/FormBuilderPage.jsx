import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
} from "@mui/material";
import { Edit, Delete, DragIndicator } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { v4 as uuidv4 } from "uuid";

/* ---------------- utils ---------------- */
const slugify = (str) =>
  (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/* ---------------- FIELD TEMPLATE ---------------- */
const emptyField = () => ({
  id: uuidv4(),
  label: "",
  type: "text",
  required: false,
  options: [],
  optionInput: "",
  validations: {},     // ✅ ALWAYS PRESENT
  dependsOn: null,     // ✅ ALWAYS PRESENT
});

/* ---------------- main ---------------- */
export default function FormBuilderPage({ existingForm = [], onSave }) {
  const [fields, setFields] = useState([]);
  const [current, setCurrent] = useState(emptyField());
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  /* ---------------- LOAD EXISTING ---------------- */
  useEffect(() => {
    if (!Array.isArray(existingForm)) return;

    setFields(
      existingForm.map((f) => ({
        id: uuidv4(),
        label: f.label,
        type:
          f.type === "integer"
            ? "number"
            : f.type === "string"
            ? "text"
            : f.type,
        required: !!f.required,
        options: f.options || [],
        optionInput: "",
        validations: f.validations || {},
        dependsOn: f.dependsOn || null,
      }))
    );
  }, [existingForm]);

  /* ---------------- DEPENDENCY PARENTS ---------------- */
  const dependencyParents = useMemo(
    () =>
      fields.filter(
        (f) =>
          ["select", "radio", "checkbox", "checkbox-group"].includes(f.type) &&
          f.id !== editingId
      ),
    [fields, editingId]
  );

  /* ---------------- DRAG ---------------- */
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...fields];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFields(items);
  };

  /* ---------------- SAVE FIELD ---------------- */
  const saveField = () => {
    if (!current.label.trim()) return;

    if (editingId) {
      setFields((p) => p.map((f) => (f.id === editingId ? current : f)));
    } else {
      setFields((p) => [...p, current]);
    }

    setCurrent(emptyField());
    setEditingId(null);
  };

  const editField = (field) => {
    setCurrent({ ...field });
    setEditingId(field.id);
  };

  const deleteField = (id) => {
    setFields((p) => p.filter((f) => f.id !== id));
  };

  /* ---------------- OPTIONS ---------------- */
  const addOption = () => {
    if (!current.optionInput.trim()) return;
    setCurrent((p) => ({
      ...p,
      options: [...p.options, p.optionInput.trim()],
      optionInput: "",
    }));
  };

  const removeOption = (opt) => {
    setCurrent((p) => ({
      ...p,
      options: p.options.filter((o) => o !== opt),
    }));
  };

  /* ---------------- SAVE FORM ---------------- */
  const saveForm = () => {
    const schema = fields.map((f) => ({
      name: slugify(f.label),
      label: f.label,
      type:
        f.type === "number"
          ? "integer"
          : f.type === "text"
          ? "string"
          : f.type,
      required: f.required,
      options: f.options,
      validations: Object.keys(f.validations).length
        ? f.validations
        : undefined,
      dependsOn: f.dependsOn || undefined,
    }));

    onSave(schema);
  };

  return (
    <Box display="grid" gridTemplateColumns="420px 1fr" gap={2}>
      {/* ================= LEFT ================= */}
      <Card>
        <CardContent>
          <Typography variant="h6">
            {editingId ? "Edit Field" : "Add Field"}
          </Typography>

          <TextField
            label="Field Label"
            fullWidth
            size="small"
            margin="dense"
            value={current.label}
            onChange={(e) =>
              setCurrent({ ...current, label: e.target.value })
            }
          />

          <Select
            fullWidth
            size="small"
            margin="dense"
            value={current.type}
            onChange={(e) =>
              setCurrent({
                ...current,
                type: e.target.value,
                options: ["select", "checkbox-group", "radio"].includes(
                  e.target.value
                )
                  ? current.options
                  : [],
              })
            }
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="select">Dropdown</MenuItem>
            <MenuItem value="radio">Radio</MenuItem>
            <MenuItem value="checkbox">Checkbox</MenuItem>
            <MenuItem value="checkbox-group">Checkbox Group</MenuItem>
          </Select>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Switch
                checked={current.required}
                onChange={(e) =>
                  setCurrent({ ...current, required: e.target.checked })
                }
              />
            }
            label="Required"
          />

          {/* OPTIONS */}
          {["select", "checkbox-group", "radio"].includes(current.type) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Options</Typography>

              <Stack direction="row" gap={1} mt={1}>
                <TextField
                  size="small"
                  placeholder="Option"
                  fullWidth
                  value={current.optionInput}
                  onChange={(e) =>
                    setCurrent({ ...current, optionInput: e.target.value })
                  }
                />
                <Button onClick={addOption}>Add</Button>
              </Stack>

              <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
                {current.options.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    onDelete={() => removeOption(opt)}
                  />
                ))}
              </Stack>
            </>
          )}

          {/* 🔥 VALIDATIONS */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Validations</Typography>

          {["text", "email"].includes(current.type) && (
            <>
              <Stack direction="row" gap={1} mt={1}>
                <TextField
                  size="small"
                  label="Min Length"
                  type="number"
                  value={current.validations.minLength || ""}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      validations: {
                        ...current.validations,
                        minLength: Number(e.target.value) || undefined,
                      },
                    })
                  }
                />
                <TextField
                  size="small"
                  label="Max Length"
                  type="number"
                  value={current.validations.maxLength || ""}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      validations: {
                        ...current.validations,
                        maxLength: Number(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </Stack>

              <TextField
                size="small"
                label="Custom Regex"
                fullWidth
                margin="dense"
                placeholder="^[A-Za-z ]+$"
                value={current.validations.pattern || ""}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    validations: {
                      ...current.validations,
                      pattern: e.target.value || undefined,
                    },
                  })
                }
              />
            </>
          )}

          {current.type === "number" && (
            <Stack direction="row" gap={1} mt={1}>
              <TextField
                size="small"
                label="Min"
                type="number"
                value={current.validations.min || ""}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    validations: {
                      ...current.validations,
                      min: Number(e.target.value) || undefined,
                    },
                  })
                }
              />
              <TextField
                size="small"
                label="Max"
                type="number"
                value={current.validations.max || ""}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    validations: {
                      ...current.validations,
                      max: Number(e.target.value) || undefined,
                    },
                  })
                }
              />
            </Stack>
          )}

          {/* 🔥 CONDITIONAL VISIBILITY */}
          {dependencyParents.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">
                Conditional Visibility
              </Typography>

              <Select
                fullWidth
                size="small"
                margin="dense"
                displayEmpty
                value={current.dependsOn?.field || ""}
                onChange={(e) =>
                  setCurrent({
                    ...current,
                    dependsOn: e.target.value
                      ? { field: e.target.value, value: "" }
                      : null,
                  })
                }
              >
                <MenuItem value="">Always visible</MenuItem>
                {dependencyParents.map((f) => (
                  <MenuItem key={f.id} value={slugify(f.label)}>
                    Show when "{f.label}" is
                  </MenuItem>
                ))}
              </Select>

              {current.dependsOn?.field && (
                <Select
                  fullWidth
                  size="small"
                  margin="dense"
                  value={current.dependsOn.value}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      dependsOn: {
                        ...current.dependsOn,
                        value: e.target.value,
                      },
                    })
                  }
                >
                  {dependencyParents
                    .find(
                      (f) => slugify(f.label) === current.dependsOn.field
                    )
                    ?.options?.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                </Select>
              )}
            </>
          )}

          <Button
            sx={{ mt: 3 }}
            variant="contained"
            fullWidth
            onClick={saveField}
            disabled={!current.label}
          >
            {editingId ? "Update Field" : "Add Field"}
          </Button>
        </CardContent>
      </Card>

      {/* ================= RIGHT ================= */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="h6">Form Fields</Typography>
            <Button size="small" onClick={() => setShowPreview((p) => !p)}>
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
          </Box>

          <Divider sx={{ my: 1 }} />

          {!showPreview && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(p) => (
                  <Box ref={p.innerRef} {...p.droppableProps}>
                    {fields.map((f, i) => (
                      <Draggable key={f.id} draggableId={f.id} index={i}>
                        {(d) => (
                          <Box
                            ref={d.innerRef}
                            {...d.draggableProps}
                            {...d.dragHandleProps}
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            p={1}
                            mb={1}
                            border="1px solid #ddd"
                            borderRadius={1}
                          >
                            <Box display="flex" gap={1}>
                              <DragIndicator fontSize="small" />
                              <Typography>
                                {f.label}
                                {f.dependsOn && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {" "} (conditional)
                                  </Typography>
                                )}
                              </Typography>
                            </Box>

                            <Box>
                              <IconButton onClick={() => editField(f)}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton onClick={() => deleteField(f.id)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {p.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {showPreview && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Column</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{slugify(f.label)}</TableCell>
                    <TableCell>{f.type}</TableCell>
                    <TableCell>{f.required ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {f.options.length ? f.options.join(", ") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Divider sx={{ my: 2 }} />

          <Button
            variant="contained"
            color="success"
            fullWidth
            disabled={!fields.length}
            onClick={saveForm}
          >
            Save Form Schema
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
