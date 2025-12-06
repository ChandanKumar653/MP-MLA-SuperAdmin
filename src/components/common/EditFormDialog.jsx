// src/components/common/EditFormDialog.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";

const normalizeOptions = (opts) => {
  if (!Array.isArray(opts)) return [];
  return opts.map((o) =>
    typeof o === "string" ? { value: o, label: o } : { value: o.value ?? o.label ?? "", label: o.label ?? o.value ?? "" }
  );
};

const parseBoolean = (val) => {
  if (typeof val === "boolean") return val;
  if (val === 1 || val === "1" || val === "true" || val === "TRUE") return true;
  return false;
};

const toDateInputValue = (v) => {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function EditFormDialog({ open, onClose, formSchema = [], rowData = {}, onSave }) {
  const [formData, setFormData] = useState({});

  // initialize formData when rowData or schema changes
  useEffect(() => {
    const initial = {};

    (formSchema || []).forEach((field) => {
      const name = field.name;
      const type = field.type || "text";
      const raw = rowData?.[name];

      if (type === "checkbox-group") {
        if (Array.isArray(raw)) initial[name] = raw.slice();
        else if (typeof raw === "string" && raw.includes(",")) initial[name] = raw.split(",").map((s) => s.trim()).filter(Boolean);
        else if (raw == null) initial[name] = [];
        else initial[name] = [String(raw)];
      } else if (type === "checkbox") {
        initial[name] = parseBoolean(raw);
      } else if (type === "number" || type === "integer") {
        initial[name] = raw === null || raw === undefined || raw === "" ? "" : Number(raw);
      } else if (type === "date") {
        initial[name] = toDateInputValue(raw);
      } else if (type === "file") {
        if (Array.isArray(raw)) initial[name] = raw.slice();
        else if (typeof raw === "string" && raw.includes(",")) initial[name] = raw.split(",").map(s => s.trim()).filter(Boolean);
        else initial[name] = raw ? [String(raw)] : [];
      } else {
        initial[name] = raw ?? "";
      }
    });

    // always include pk
    if (rowData.pk !== undefined) initial.pk = rowData.pk;

    setFormData(initial);
  }, [rowData, formSchema]);

  const handleChangeValue = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const handleToggleCheckboxGroup = (fieldName, optionValue) => {
    setFormData((prev) => {
      const curr = Array.isArray(prev[fieldName]) ? prev[fieldName].slice() : [];
      const idx = curr.indexOf(optionValue);
      if (idx === -1) curr.push(optionValue);
      else curr.splice(idx, 1);
      return { ...prev, [fieldName]: curr };
    });
  };

  const handleSave = () => {
    onSave?.({ ...formData, pk: rowData.pk });
    onClose?.();
  };

  const renderField = (field) => {
    const name = field.name;
    const type = (field.type || "text").toLowerCase();
    const label = field.label || name;
    const value = formData[name];

    if (type === "select") {
      const opts = normalizeOptions(field.options);
      return (
        <TextField
          key={name}
          label={label}
          select
          fullWidth
          margin="normal"
          value={value ?? ""}
          onChange={(e) => handleChangeValue(name, e.target.value)}
        >
          <MenuItem value="">
            <em>--</em>
          </MenuItem>
          {opts.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    if (type === "checkbox-group") {
      const opts = normalizeOptions(field.options);
      return (
        <Box key={name} sx={{ my: 1 }}>
          <Typography sx={{ mb: 1, fontWeight: 600 }}>{label}</Typography>
          <FormGroup>
            {opts.map((opt) => {
              const checked = Array.isArray(value) ? value.includes(opt.value) : false;
              return (
                <FormControlLabel
                  key={opt.value}
                  control={<Checkbox checked={checked} onChange={() => handleToggleCheckboxGroup(name, opt.value)} />}
                  label={opt.label}
                />
              );
            })}
          </FormGroup>
        </Box>
      );
    }

    if (type === "checkbox") {
      return (
        <FormControlLabel
          key={name}
          control={<Checkbox checked={!!value} onChange={(e) => handleChangeValue(name, e.target.checked)} />}
          label={label}
        />
      );
    }

    if (type === "number" || type === "integer") {
      return (
        <TextField
          key={name}
          label={label}
          type="number"
          fullWidth
          margin="normal"
          value={value === "" || value === null || value === undefined ? "" : value}
          onChange={(e) => handleChangeValue(name, e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    }

    if (type === "date") {
      return (
        <TextField
          key={name}
          label={label}
          type="date"
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={value ?? ""}
          onChange={(e) => handleChangeValue(name, e.target.value)}
        />
      );
    }

    if (type === "file") {
      const files = Array.isArray(value) ? value : value ? [String(value)] : [];
      return (
        <Box key={name} sx={{ my: 1 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>{label}</Typography>
          {files.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No files</Typography>
          ) : (
            files.map((f, i) => <Typography key={i} variant="body2">{f}</Typography>)
          )}
        </Box>
      );
    }

    return (
      <TextField
        key={name}
        label={label}
        fullWidth
        margin="normal"
        value={value ?? ""}
        onChange={(e) => handleChangeValue(name, e.target.value)}
      />
    );
  };

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Record</DialogTitle>
      <DialogContent dividers>
        {(formSchema || []).map((f) => renderField(f))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
