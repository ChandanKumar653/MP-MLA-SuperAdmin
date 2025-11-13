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
} from "@mui/material";
import { Alert } from "@mui/material";

const FormViewerPage = ({ formData = [] }) => {
  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Normalize and set initial fields
  useEffect(() => {
    setFields(
      (Array.isArray(formData) ? formData : []).map((field) => ({
        ...field,
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
  }, [formData]);

  // Dynamic validation schema using Yup
  const buildValidationSchema = () => {
    const shape = {};
    fields.forEach((field) => {
      let schema = Yup.mixed();

      // Base type determination
      if (["text", "email", "date"].includes(field.type)) schema = Yup.string();
      else if (field.type === "number") schema = Yup.number();
      else if (field.type === "file") schema = Yup.mixed();
      else if (field.type === "select" || field.type === "checkbox-group")
        schema = Yup.string();

      // Apply validations
      if (field.validations.required) schema = schema.required(`${field.label} is required`);
      if (field.validations.minLength)
        schema = schema.min(field.validations.minLength, `Minimum ${field.validations.minLength} characters`);
      if (field.validations.maxLength)
        schema = schema.max(field.validations.maxLength, `Maximum ${field.validations.maxLength} characters`);
      if (field.validations.numeric) schema = schema.test("isNumeric", "Must be a number", (value) => !isNaN(value));
      if (field.validations.email) schema = schema.email("Invalid email format");
      if (field.validations.custom) {
        try {
          const customRule = new Function(`return ${field.validations.custom}`)();
          schema = schema.test("custom", "Invalid input", customRule);
        } catch (e) {
          console.warn(`Invalid custom validation for ${field.label}: ${e.message}`);
        }
      }

      // Handle file uploads
      if (field.type === "file") {
        schema = schema.test("isFile", "Please upload a file", (value) => value && value.length > 0);
      }

      shape[field.label] = schema;
    });
    return Yup.object().shape(shape);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(buildValidationSchema()),
    defaultValues: fields.reduce((acc, field) => ({ ...acc, [field.label]: "" }), {}),
  });

  const onSubmit = (data) => {
    const formatted = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof FileList ? Array.from(value).map((f) => f.name) : value,
      ])
    );
    setSubmitSuccess(true);
    alert(JSON.stringify(formatted, null, 2));
    reset();
    setTimeout(() => setSubmitSuccess(false), 3000); // Hide success message after 3s
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧾 Form Viewer</h2>

      {fields.length === 0 ? (
        <p className="text-gray-500">No form found. Please build one first.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {submitSuccess && (
            <Alert severity="success" onClose={() => setSubmitSuccess(false)} className="mb-4">
              Form submitted successfully!
            </Alert>
          )}

          {fields.map((field) => (
            <div key={field.id} className="flex flex-col">
              <label className="font-medium mb-2 text-gray-700">
                {field.label}{" "}
                {field.validations.required && <span className="text-red-600">*</span>}
              </label>

              {/* Text, Number, Email, Date */}
              {["text", "number", "email", "date"].includes(field.type) && (
                <TextField
                  type={field.type}
                  {...register(field.label)}
                  placeholder={`Enter ${field.label}`}
                  variant="outlined"
                  fullWidth
                  size="small"
                  error={!!errors[field.label]}
                  helperText={errors[field.label]?.message}
                  InputProps={{
                    className: "rounded-lg focus:ring-2 focus:ring-purple-400",
                  }}
                />
              )}

              {/* Select */}
              {field.type === "select" && (
                <Select
                  {...register(field.label)}
                  variant="outlined"
                  fullWidth
                  size="small"
                  error={!!errors[field.label]}
                  helperText={errors[field.label]?.message}
                  className="rounded-lg focus:ring-2 focus:ring-purple-400"
                >
                  <MenuItem value="" disabled>
                    Select {field.label}
                  </MenuItem>
                  {field.options.map((opt, idx) => (
                    <MenuItem key={idx} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              )}

              {/* Checkbox Group */}
              {field.type === "checkbox-group" && (
                <FormControl component="fieldset" error={!!errors[field.label]}>
                  <FormLabel component="legend">{field.label}</FormLabel>
                  <FormGroup>
                    {field.options.map((opt, idx) => (
                      <FormControlLabel
                        key={idx}
                        control={
                          <Checkbox
                            {...register(field.label)}
                            value={opt}
                            color="primary"
                          />
                        }
                        label={opt}
                      />
                    ))}
                  </FormGroup>
                  <FormHelperText>{errors[field.label]?.message}</FormHelperText>
                </FormControl>
              )}

              {/* File Upload */}
              {field.type === "file" && (
                <TextField
                  type="file"
                  multiple
                  {...register(field.label)}
                  variant="outlined"
                  fullWidth
                  size="small"
                  error={!!errors[field.label]}
                  helperText={errors[field.label]?.message}
                  InputProps={{
                    className: "rounded-lg focus:ring-2 focus:ring-purple-400",
                  }}
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="w-full mt-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition"
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  );
};

export default FormViewerPage;