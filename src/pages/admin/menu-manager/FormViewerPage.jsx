import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import * as Yup from "yup";

import {
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
import { MenuContext } from "../../../context/MenuContext";
import useApi from "../../../context/useApi";
import { apiEndpoints } from "../../../api/endpoints";

/* ---------------- NORMALIZER ---------------- */
const normalizeField = (f) => {
  const typeMap = { string: "text", integer: "number" };
  const type = typeMap[f.type] || f.type || "text";

  const name =
    f.name ||
    f.id ||
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
    dependsOn: f.dependsOn
      ? { field: f.dependsOn.field || "", value: f.dependsOn.value }
      : null,
  };
};

/* ---------------- MAIN ---------------- */
const FormViewerPage = () => {
  const { menuId } = useParams();
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { getDecodedToken } = useContext(AuthContext);
  const tenantId = getDecodedToken?.()?.tenantId;

  const { menus } = useContext(MenuContext);

  const findMenu = (list) => {
    for (const m of list) {
      if (m.id === menuId) return m;
      const found = findMenu(m.children || []);
      if (found) return found;
    }
    return null;
  };

  const menuObj = useMemo(
    () => findMenu(menus?.tabs || []),
    [menus, menuId]
  );

  const schema = menuObj?.formSchema || [];
  const tableName = menuObj?.tableName;

  const { execute: submitFormApi, loading } = useApi(
    apiEndpoints.submitForm.submit,
    { immediate: false }
  );

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
      let rule;

      if (["text", "email", "date"].includes(f.type)) {
        rule = Yup.string();
        if (f.required) rule = rule.required(`${f.label} is required`);
        shape[f.name] = rule;
        return;
      }

      if (f.type === "number") {
        rule = Yup.number().typeError("Must be a number");
        if (f.required) rule = rule.required(`${f.label} is required`);
        shape[f.name] = rule;
        return;
      }

      if (f.type === "checkbox-group") {
        rule = Yup.array().of(Yup.string());
        if (f.required) {
          rule = rule.min(1, `Select at least one ${f.label}`);
        }
        shape[f.name] = rule;
        return;
      }

      if (f.type === "file") {
        rule = Yup.mixed();
        if (f.required) rule = rule.required(`${f.label} is required`);
        shape[f.name] = rule;
        return;
      }

      rule = Yup.mixed();
      if (f.required) rule = rule.required(`${f.label} is required`);
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
    shouldUnregister: false, // 🔥 CRITICAL FIX
  });

  const values = useWatch({ control });

  /* ---------------- VISIBILITY ---------------- */
  const isVisible = (field) => {
    if (!field.dependsOn) return true;

    const { field: parentField, value } = field.dependsOn;
    if (!parentField || value === undefined || value === "") return true;

    const parentValue = values?.[parentField];
    if (parentValue === undefined) return false;

    return parentValue === value;
  };

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data) => {
    console.log("FINAL PAYLOAD 👉", data); // Debug once

    try {
      await submitFormApi({
        tenantId,
        title: menuObj.title,
        tableName,
        data,
      });

      setSubmitSuccess(true);
       toast.success("Form submitted successfully");
      reset(defaultValues);
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  if (!menuObj) {
    return <Alert severity="error">Invalid Menu</Alert>;
  }

  /* ---------------- UI ---------------- */
  return (
    <Box maxWidth="md" mx="auto" mt={4} mb={6}>
      <Paper sx={{ p: 4 }}>
        <Box mb={3}>
          <Typography variant="h6" fontWeight={600}>
            {menuObj.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please fill in the required information
          </Typography>
        </Box>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Form submitted successfully
          </Alert>
         
        )}

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
                      <Typography component="span" color="error" fontWeight={600}>
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

                  {/* CHECKBOX GROUP (🔥 FIXED) */}
                  {field.type === "checkbox-group" && (
                    <Controller
                      name={field.name}
                      control={control}
                      defaultValue={[]} // 🔥 REQUIRED
                      render={({ field: ctrl }) => (
                        <>
                          <FormGroup>
                            {field.options.map((opt) => (
                              <FormControlLabel
                                key={opt}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={ctrl.value.includes(opt)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      ctrl.onChange(
                                        checked
                                          ? [...ctrl.value, opt]
                                          : ctrl.value.filter(
                                              (v) => v !== opt
                                            )
                                      );
                                    }}
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

          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default FormViewerPage;
