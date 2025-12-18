import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { Add, Edit, Delete, DragIndicator } from "@mui/icons-material";
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
});

/* ---------------- main ---------------- */
export default function FormBuilderPage({ existingForm = [], onSave }) {
  const [fields, setFields] = useState([]);
  const [current, setCurrent] = useState(emptyField());
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  /* load existing */
  useEffect(() => {
    if (Array.isArray(existingForm)) {
      setFields(
        existingForm.map((f) => ({
          id: uuidv4(),
          label: f.label,
          type: f.type,
          required: !!f.required,
          options: f.options || [],
          optionInput: "",
        }))
      );
    }
  }, [existingForm]);

  /* drag reorder */
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setFields(items);
  };

  /* add / update field */
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

  /* edit field */
  const editField = (field) => {
    setCurrent({ ...field });
    setEditingId(field.id);
  };

  /* delete field */
  const deleteField = (id) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  /* option handlers */
  const addOption = () => {
    if (!current.optionInput.trim()) return;
    setCurrent((prev) => ({
      ...prev,
      options: [...prev.options, prev.optionInput.trim()],
      optionInput: "",
    }));
  };

  const removeOption = (opt) => {
    setCurrent((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o !== opt),
    }));
  };

  /* save schema */
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
    }));

    onSave(schema);
  };

  return (
    <Box display="grid" gridTemplateColumns="420px 1fr" gap={2}>
      {/* ================= LEFT: FIELD EDITOR ================= */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
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
                options:
                  ["select", "checkbox-group"].includes(e.target.value)
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
          {["select", "checkbox-group"].includes(current.type) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Options</Typography>

              <Box display="flex" gap={1} mt={1}>
                <TextField
                  size="small"
                  placeholder="Option value"
                  value={current.optionInput}
                  onChange={(e) =>
                    setCurrent({
                      ...current,
                      optionInput: e.target.value,
                    })
                  }
                  fullWidth
                />
                <Button variant="outlined" onClick={addOption}>
                  Add
                </Button>
              </Box>

              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                {current.options.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    onDelete={() => removeOption(opt)}
                  />
                ))}
              </Box>
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

      {/* ================= RIGHT: LIST + PREVIEW ================= */}
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
                      <Draggable
                        key={f.id}
                        draggableId={f.id}
                        index={i}
                      >
                        {(d) => (
                          <Box
                            ref={d.innerRef}
                            {...d.draggableProps}
                            {...d.dragHandleProps}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            p={1}
                            mb={1}
                            border="1px solid #ddd"
                            borderRadius={1}
                          >
                            <Box display="flex" gap={1}>
                              <DragIndicator fontSize="small" />
                              <Typography>
                                {f.label}
                                {f.required && (
                                  <span style={{ color: "red" }}> *</span>
                                )}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {" "}
                                  ({f.type})
                                </Typography>
                              </Typography>
                            </Box>

                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => editField(f)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => deleteField(f.id)}
                              >
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

          {/* PREVIEW TABLE */}
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
                      {f.options.length
                        ? f.options.join(", ")
                        : "-"}
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
