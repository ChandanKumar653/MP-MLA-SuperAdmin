import React, { useEffect, useState, useContext, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import * as Yup from "yup";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  FormGroup,
  FormHelperText,
  FormControlLabel,
  Alert,
  Stack,
} from "@mui/material";

import { AuthContext } from "../../../context/AuthContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";
import { MenuContext } from "../../../context/MenuContext";
/* ---------------- NORMALIZER ---------------- */
const normalizeField = (f) => {
  const typeMap = { string: "text", integer: "number" };
  const type = typeMap[f.type] || f.type || "text";

  const name =
    f.name ||
    (f.label
      ? f.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_")
      : "");

  return {
    id: f.id || name,
    label: f.label || name,
    name,
    type,
    required: !!f.required,
    options: Array.isArray(f.options) ? f.options : [],
    validations: f.validations || {},
    dependsOn: f.dependsOn
      ? { field: f.dependsOn.field || "", value: f.dependsOn.value }
      : null,
  };
};

/* ---------------- MAIN ---------------- */
const FormViewerDialog = ({ open, onClose, menuObj,tenantId }) => {
  let { role, userId } = useContext(AuthContext);
  if(!tenantId){
    tenantId=useContext(MenuContext).menus?.tenantId;
    if(!tenantId){
        tenantId=localStorage.getItem("tenantId");
    }
  }

  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const schema = menuObj?.formSchema || [];
  const tableName = menuObj?.tableName;

  const { execute: submitFormApi, loading } = useApi(
    role === "admin"
      ? apiEndpoints.submitForm.submit
      : apiEndpoints.submitForm.userSubmits,
    { immediate: false }
  );

  /* ---------------- BUILD FIELDS ---------------- */
  useEffect(() => {
    setFields(schema.map(normalizeField));
  }, [schema]);

  /* ---------------- DEFAULT VALUES ---------------- */
  const defaultValues = useMemo(() => {
    const d = {};
    fields.forEach((f) => {
      if (f.type === "checkbox-group") d[f.name] = [];
      else if (f.type === "checkbox") d[f.name] = false;
      else d[f.name] = "";
    });
    return d;
  }, [fields]);

  /* ---------------- VALIDATION ---------------- */
  const validationSchema = useMemo(() => {
    const shape = {};

    fields.forEach((f) => {
      const v = f.validations || {};
      let rule;

      if (["text", "email", "date"].includes(f.type)) {
        rule = Yup.string();

        if (v.minLength)
          rule = rule.min(v.minLength, `${f.label} is too short`);
        if (v.maxLength)
          rule = rule.max(v.maxLength, `${f.label} is too long`);
        if (v.pattern) {
          try {
            rule = rule.matches(
              new RegExp(v.pattern),
              `${f.label} format is invalid`
            );
          } catch {}
        }
        if (f.required)
          rule = rule.required(`${f.label} is required`);

        shape[f.name] = rule;
        return;
      }

      if (f.type === "number") {
        rule = Yup.number().typeError("Must be a number");
        if (v.min !== undefined)
          rule = rule.min(v.min, `${f.label} is too small`);
        if (v.max !== undefined)
          rule = rule.max(v.max, `${f.label} is too large`);
        if (f.required)
          rule = rule.required(`${f.label} is required`);
        shape[f.name] = rule;
        return;
      }

      if (f.type === "checkbox-group") {
        rule = Yup.array().of(Yup.string());
        if (f.required)
          rule = rule.min(1, `Select at least one ${f.label}`);
        shape[f.name] = rule;
        return;
      }

      if (f.type === "file") {
        rule = Yup.mixed();
        if (f.required)
          rule = rule.required(`${f.label} is required`);
        shape[f.name] = rule;
        return;
      }

      rule = Yup.mixed();
      if (f.required)
        rule = rule.required(`${f.label} is required`);
      shape[f.name] = rule;
    });

    return Yup.object().shape(shape);
  }, [fields]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
    shouldUnregister: false, // 🔥 REQUIRED for dependsOn
  });

  /* 🔥🔥🔥 THIS FIXES CHECKBOX / CHECKBOX-GROUP PAYLOAD 🔥🔥🔥 */
  useEffect(() => {
    if (fields.length) {
      reset(defaultValues);
    }
  }, [fields, reset, defaultValues]);

  const values = useWatch({ control });

  /* ---------------- VISIBILITY ---------------- */
  const isVisible = (field) => {
    if (!field.dependsOn) return true;

    const { field: parentField, value } = field.dependsOn;
    if (!parentField || value === undefined || value === "") return true;

    return values?.[parentField] === value;
  };

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data) => {
    try {
      await submitFormApi({
        tenantId,
        userId,
        title: menuObj.title,
        tableName,
        data,
      });

      toast.success("Form submitted successfully");
      setSubmitSuccess(true);
      reset(defaultValues);

      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Submission failed"
      );
    }
  };

  if (!menuObj) {
    return <Alert severity="error">Invalid Menu</Alert>;
  }

  /* ---------------- UI ---------------- */
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{menuObj.title}</DialogTitle>

      <DialogContent dividers>
        <Paper sx={{ p: 4 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Please fill in the required information
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
              {fields.map((field) => {
                if (!isVisible(field)) return null;
                const err = errors[field.name]?.message;

                return (
                  <Box key={field.id}>
                    <Typography variant="body2" fontWeight={500} mb={0.5}>
                      {field.label}
                      {field.required && (
                        <Typography component="span" color="error">
                          {" "}*
                        </Typography>
                      )}
                    </Typography>

                    {/* TEXT / NUMBER / EMAIL / DATE */}
                    {["text", "number", "email", "date"].includes(field.type) && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <TextField
                            {...ctrl}
                            type={field.type}
                            size="small"
                            fullWidth
                            error={!!err}
                            helperText={err}
                          />
                        )}
                      />
                    )}

                    {/* SELECT */}
                    {field.type === "select" && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <>
                            <Select {...ctrl} size="small" fullWidth displayEmpty>
                              <MenuItem value="">Select an option</MenuItem>
                              {field.options.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                  {opt}
                                </MenuItem>
                              ))}
                            </Select>
                            {err && <FormHelperText error>{err}</FormHelperText>}
                          </>
                        )}
                      />
                    )}

                    {/* RADIO */}
                    {field.type === "radio" && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <>
                            <RadioGroup {...ctrl}>
                              {field.options.map((opt) => (
                                <FormControlLabel
                                  key={opt}
                                  value={opt}
                                  control={<Radio size="small" />}
                                  label={opt}
                                />
                              ))}
                            </RadioGroup>
                            {err && <FormHelperText error>{err}</FormHelperText>}
                          </>
                        )}
                      />
                    )}

                    {/* CHECKBOX */}
                    {field.type === "checkbox" && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                size="small"
                                checked={!!ctrl.value}
                                onChange={(e) =>
                                  ctrl.onChange(e.target.checked)
                                }
                              />
                            }
                            label="Yes"
                          />
                        )}
                      />
                    )}

                    {/* CHECKBOX GROUP */}
                    {field.type === "checkbox-group" && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <>
                            <FormGroup>
                              {field.options.map((opt) => (
                                <FormControlLabel
                                  key={opt}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={ctrl.value?.includes(opt)}
                                      onChange={(e) =>
                                        ctrl.onChange(
                                          e.target.checked
                                            ? [...ctrl.value, opt]
                                            : ctrl.value.filter(
                                                (v) => v !== opt
                                              )
                                        )
                                      }
                                    />
                                  }
                                  label={opt}
                                />
                              ))}
                            </FormGroup>
                            {err && <FormHelperText error>{err}</FormHelperText>}
                          </>
                        )}
                      />
                    )}

                    {/* FILE */}
                    {field.type === "file" && (
                      <Controller
                        name={field.name}
                        control={control}
                        render={({ field: ctrl }) => (
                          <>
                            <TextField
                              type="file"
                              size="small"
                              fullWidth
                              onChange={(e) =>
                                ctrl.onChange(e.target.files)
                              }
                            />
                            {err && <FormHelperText error>{err}</FormHelperText>}
                          </>
                        )}
                      />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </form>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormViewerDialog;
