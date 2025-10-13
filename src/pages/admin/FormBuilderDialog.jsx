import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  Checkbox,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

const FormBuilderDialog = ({ open, setOpen, formJson, onSave }) => {
  const [fields, setFields] = useState(formJson || []);

  const addField = () => {
    setFields([
      ...fields,
      { id: Date.now(), label: "", type: "text", required: false, options: [] },
    ]);
  };

  const updateField = (id, updated) =>
    setFields(fields.map((f) => (f.id === id ? updated : f)));

  const deleteField = (id) => setFields(fields.filter((f) => f.id !== id));

  if (!open) return null;

  return (
    <Dialog open={open} maxWidth="md" fullWidth>
      <DialogTitle>Form Builder</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {fields.map((f) => (
            <Stack key={f.id} spacing={1} border={1} borderRadius={1} p={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Label"
                  value={f.label}
                  size="small"
                  onChange={(e) => updateField(f.id, { ...f, label: e.target.value })}
                  fullWidth
                />
                <TextField
                  select
                  label="Type"
                  value={f.type}
                  size="small"
                  SelectProps={{ native: true }}
                  onChange={(e) => updateField(f.id, { ...f, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox-group">Checkbox Group</option>
                  <option value="file">File Upload</option>
                </TextField>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={f.required}
                      onChange={(e) =>
                        updateField(f.id, { ...f, required: e.target.checked })
                      }
                    />
                  }
                  label="Required"
                />

                <IconButton color="error" onClick={() => deleteField(f.id)}>
                  <Delete />
                </IconButton>
              </Stack>

              {(f.type === "select" || f.type === "checkbox-group") && (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {f.options.map((opt, idx) => (
                    <Chip
                      key={idx}
                      label={opt}
                      onDelete={() =>
                        updateField(f.id, { ...f, options: f.options.filter((o, i) => i !== idx) })
                      }
                    />
                  ))}
                  <TextField
                    size="small"
                    placeholder="Add option"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value.trim()) {
                        updateField(f.id, { ...f, options: [...f.options, e.target.value] });
                        e.target.value = "";
                      }
                    }}
                  />
                </Stack>
              )}
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            onSave(fields);
            setOpen(false);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormBuilderDialog;
