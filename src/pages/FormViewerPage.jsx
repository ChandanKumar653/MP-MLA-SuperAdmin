import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import {
  TextField,
  Select,
  MenuItem,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  FormGroup,
  FormHelperText,
  FormControlLabel,
  Alert,
} from "@mui/material";

/* -------------------------------------------------------
   FORM VIEWER PAGE — UPDATED FOR NEW SCHEMA
-------------------------------------------------------- */

const normalizeField = (f) => {
  // Convert API schema → UI schema
  return {
    id: f.id || f.name,
    label: f.label,
    name: f.name,
    type:
      f.type === "string"
        ? "text"
        : f.type === "integer"
        ? "number"
        : f.type === "date"
        ? "date"
        : f.type === "file"
        ? "file"
        : f.type,

    required: f.required || false,
    minLength: f.minLength || null,
    maxLength: f.maxLength || null,
    regex: f.regex || "",
    options: f.options || [],
  };
};

const FormViewerPage = ({ formData = [] }) => {
  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* -------------------------------------------------------
     NORMALIZE INCOMING FORM SCHEMA
  -------------------------------------------------------- */
  useEffect(() => {
    if (!Array.isArray(formData)) return;
    setFields(formData.map(normalizeField));
  }, [formData]);

  /* -------------------------------------------------------
     BUILD YUP VALIDATION SCHEMA
  -------------------------------------------------------- */
  const buildValidationSchema = () => {
    const shape = {};

    fields.forEach((field) => {
      let schema;

      // base type
      if (field.type === "text") schema = Yup.string();
      else if (field.type === "email") schema = Yup.string().email("Invalid email");
      else if (field.type === "number") schema = Yup.number().typeError("Must be a number");
      else if (field.type === "date") schema = Yup.string();
      else if (field.type === "select") schema = Yup.string();
      else if (field.type === "checkbox-group") schema = Yup.array().of(Yup.string());
      else if (field.type === "file")
        schema = Yup.mixed().test("required-file", "File required", (val) => val && val.length > 0);
      else schema = Yup.string();

      // validations
      if (field.required) schema = schema.required(`${field.label} is required`);
      if (field.minLength) schema = schema.min(field.minLength, `Minimum ${field.minLength} characters`);
      if (field.maxLength) schema = schema.max(field.maxLength, `Maximum ${field.maxLength} characters`);

      // regex rule
      if (field.regex) {
        try {
          const regex = new RegExp(field.regex);
          schema = schema.test("regex", "Invalid format", (value) => regex.test(value || ""));
        } catch (e) {
          console.warn("Invalid regex:", field.regex);
        }
      }

      shape[field.name] = schema;
    });

    return Yup.object().shape(shape);
  };

  /* -------------------------------------------------------
     REACT HOOK FORM INITIALIZATION
  -------------------------------------------------------- */
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(buildValidationSchema()),
    defaultValues: fields.reduce((acc, f) => ({ ...acc, [f.name]: "" }), {}),
  });

  /* -------------------------------------------------------
     HANDLE SUBMIT
  -------------------------------------------------------- */
  const onSubmit = (data) => {
    const formatted = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof FileList ? Array.from(value).map((file) => file.name) : value,
      ])
    );

    setSubmitSuccess(true);
    alert(JSON.stringify(formatted, null, 2));
    reset();

    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧾 Form Viewer</h2>

      {fields.length === 0 ? (
        <p className="text-gray-500">No form found. Please configure a form.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitSuccess && (
            <Alert severity="success" className="mb-4">
              Form submitted successfully!
            </Alert>
          )}

          {fields.map((field) => {
            const fieldError = errors[field.name]?.message;

            return (
              <div key={field.id} className="flex flex-col">
                {/* Label */}
                <label className="font-medium mb-2 text-gray-700">
                  {field.label} {field.required && <span className="text-red-600">*</span>}
                </label>

                {/* Text / Email / Number / Date */}
                {["text", "email", "number", "date"].includes(field.type) && (
                  <TextField
                    type={field.type}
                    {...register(field.name)}
                    placeholder={`Enter ${field.label}`}
                    fullWidth
                    size="small"
                    error={!!fieldError}
                    helperText={fieldError}
                  />
                )}

                {/* Select */}
                {field.type === "select" && (
                  <FormControl fullWidth size="small" error={!!fieldError}>
                    <Select defaultValue="" {...register(field.name)}>
                      <MenuItem disabled value="">
                        Select {field.label}
                      </MenuItem>
                      {field.options.map((opt, idx) => (
                        <MenuItem key={idx} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{fieldError}</FormHelperText>
                  </FormControl>
                )}

                {/* Checkbox Group */}
                {field.type === "checkbox-group" && (
                  <FormControl error={!!fieldError}>
                    <FormLabel>{field.label}</FormLabel>
                    <FormGroup>
                      {field.options.map((opt, idx) => (
                        <FormControlLabel
                          key={idx}
                          control={<Checkbox value={opt} {...register(field.name)} />}
                          label={opt}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{fieldError}</FormHelperText>
                  </FormControl>
                )}

                {/* File Upload */}
                {field.type === "file" && (
                  <TextField
                    type="file"
                    multiple
                    {...register(field.name)}
                    error={!!fieldError}
                    helperText={fieldError}
                  />
                )}
              </div>
            );
          })}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            className="py-2 mt-4"
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  );
};

export default FormViewerPage;
