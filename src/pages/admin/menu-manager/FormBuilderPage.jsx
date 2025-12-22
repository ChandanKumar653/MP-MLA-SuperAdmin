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

const emptyField = () => ({
  id: uuidv4(),
  label: "",
  type: "text",
  required: false,
  options: [],
  optionInput: "",
  dependsOn: null,
});

/* ---------------- main ---------------- */
export default function FormBuilderPage({ existingForm = [], onSave }) {
  const [fields, setFields] = useState([]);
  const [current, setCurrent] = useState(emptyField());
  const [editingId, setEditingId] = useState(null);

  /* Load existing */
  useEffect(() => {
    if (Array.isArray(existingForm)) {
      setFields(
        existingForm.map((f) => ({
          ...f,
          id: uuidv4(),
          optionInput: "",
        }))
      );
    }
  }, [existingForm]);

  /* Dependency parents (exact allowed types) */
  const dependencyParents = useMemo(
    () =>
      fields.filter(
        (f) =>
          ["select", "radio", "checkbox", "checkbox-group"].includes(f.type) &&
          f.id !== editingId
      ),
    [fields, editingId]
  );

  /* Drag reorder */
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFields(items);
  };

  /* Save field */
  const saveField = () => {
    if (!current.label.trim()) return;

    if (editingId) {
      setFields((prev) =>
        prev.map((f) => (f.id === editingId ? current : f))
      );
    } else {
      setFields((prev) => [...prev, current]);
    }

    setCurrent(emptyField());
    setEditingId(null);
  };

  const editField = (field) => {
    setCurrent(field);
    setEditingId(field.id);
  };

  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  /* Options */
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

  /* Save schema (STRICT TYPES) */
  const saveForm = () => {
    const schema = fields.map((f) => ({
      name: slugify(f.label),
      label: f.label,
      type: f.type, // 🔒 EXACT TYPE
      required: f.required,
      options: f.options,
      dependsOn: f.dependsOn
        ? {
            field: slugify(
              fields.find((x) => x.id === f.dependsOn.field)?.label
            ),
            value: f.dependsOn.value,
          }
        : null,
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
                dependsOn: null,
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
            <MenuItem value="file">File Upload</MenuItem>
          </Select>

          <FormControlLabel
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
                    setCurrent({
                      ...current,
                      optionInput: e.target.value,
                    })
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

          {/* CONDITIONAL VISIBILITY */}
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
                  <MenuItem key={f.id} value={f.id}>
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
                    .find((f) => f.id === current.dependsOn.field)
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
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={saveField}
          >
            {editingId ? "Update Field" : "Add Field"}
          </Button>
        </CardContent>
      </Card>

      {/* ================= RIGHT ================= */}
      <Card>
        <CardContent>
          <Typography variant="h6">Form Fields</Typography>
          <Divider sx={{ my: 1 }} />

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
                          border="1px solid #e0e0e0"
                          borderRadius={1}
                        >
                          <Stack direction="row" gap={1}>
                            <DragIndicator fontSize="small" />
                            <Typography>
                              {f.label}
                              {f.dependsOn && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {" "}
                                  (conditional)
                                </Typography>
                              )}
                            </Typography>
                          </Stack>

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

          <Divider sx={{ my: 2 }} />

          <Button
            fullWidth
            variant="contained"
            color="success"
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
