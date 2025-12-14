import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";

import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";

/* -------------------------------------------------------
   NORMALIZER — convert schema → form fields
-------------------------------------------------------- */
const normalizeField = (f) => ({
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
});

/* -------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------- */
const FormViewerPage = () => {
  const { menuId } = useParams();     // ⭐ Path param
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* Auth / tenantId */
  const { getDecodedToken } = useContext(AuthContext);
  const decoded = getDecodedToken?.();
  const tenantId = decoded?.tenantId;

  /* MENU CONTEXT */
  const { menus } = useContext(MenuContext);

  /* Extract correct menu from menu tree */
  const findMenu = (list) => {
    for (let m of list) {
      if (m.id === menuId) return m;
      const found = findMenu(m.children || []);
      if (found) return found;
    }
    return null;
  };

  const menuObj = findMenu(menus?.tabs || []);

  const tableName = menuObj?.tableName || null;
  const schema = menuObj?.formSchema || [];

  /* Submit API executor */
  const { execute: submitFormApi } = useApi(apiEndpoints.submitForm.submit, {
    immediate: false,
  });

  /* Load and normalize schema */
  useEffect(() => {
    if (Array.isArray(schema)) {
      setFields(schema.map(normalizeField));
    }
  }, [schema,menus]);

  /* -------------------------------------------------------
     YUP VALIDATION BUILDER
  -------------------------------------------------------- */
  const buildValidationSchema = () => {
    const shape = {};

    fields.forEach((field) => {
      let schema;

      if (field.type === "text") schema = Yup.string();
      else if (field.type === "email") schema = Yup.string().email("Invalid email format");
      else if (field.type === "number") schema = Yup.number().typeError("Must be a valid number");
      else if (field.type === "date") schema = Yup.string();
      else if (field.type === "select") schema = Yup.string();
      else if (field.type === "checkbox-group") schema = Yup.array().of(Yup.string());
      else if (field.type === "file")
        schema = Yup.mixed().test("req", "File required", (v) => v && v.length > 0);
      else schema = Yup.string();

      if (field.required)
        schema = schema.required(`${field.label} is required`);

      if (field.minLength)
        schema = schema.min(field.minLength, `Min ${field.minLength} characters`);

      if (field.maxLength)
        schema = schema.max(field.maxLength, `Max ${field.maxLength} characters`);

      if (field.regex) {
        try {
          const regex = new RegExp(field.regex);
          schema = schema.test("regex", "Invalid format", (v) => regex.test(v || ""));
        } catch {}
      }

      shape[field.name] = schema;
    });

    return Yup.object().shape(shape);
  };

  /* -------------------------------------------------------
     REACT HOOK FORM
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
     SUBMIT HANDLER → CALL POST API
  -------------------------------------------------------- */
  const onSubmit = async (data) => {
    const formatted = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [
        key,
        val instanceof FileList ? Array.from(val).map((f) => f.name) : val,
      ])
    );

    const payload = {
      tenantId,
      title:menuObj.title,
      tableName,    // ⭐ REQUIRED (dynamic table name)
      data: formatted,
    };

    try {
      await submitFormApi(payload);
      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  if (!menuObj) {
    return <p className="p-6 text-red-600">Invalid Menu ID: {menuId}</p>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg">

      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧾 {menuObj.title}
      </h2>

      {submitSuccess && (
        <Alert severity="success" className="mb-4">
          Form submitted successfully!
        </Alert>
      )}

      {fields.length === 0 ? (
        <p className="text-gray-500">No fields configured.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field) => {
            const err = errors[field.name]?.message;

            return (
              <div key={field.id}>
                <label className="font-medium mb-2 text-gray-700 block">
                  {field.label}{" "}
                  {field.required && <span className="text-red-600">*</span>}
                </label>

                {/* TEXT / NUMBER / EMAIL / DATE */}
                {["text", "number", "email", "date"].includes(field.type) && (
                  <TextField
                    type={field.type}
                    {...register(field.name)}
                    fullWidth
                    size="small"
                    error={!!err}
                    helperText={err}
                  />
                )}

                {/* SELECT */}
                {field.type === "select" && (
                  <FormControl fullWidth error={!!err}>
                    <Select {...register(field.name)} defaultValue="">
                      <MenuItem disabled value="">
                        Select {field.label}
                      </MenuItem>
                      {field.options.map((opt, i) => (
                        <MenuItem key={i} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{err}</FormHelperText>
                  </FormControl>
                )}

                {/* CHECKBOX GROUP */}
                {field.type === "checkbox-group" && (
                  <FormControl error={!!err}>
                    <FormLabel>{field.label}</FormLabel>
                    <FormGroup>
                      {field.options.map((opt, i) => (
                        <FormControlLabel
                          key={i}
                          control={<Checkbox value={opt} {...register(field.name)} />}
                          label={opt}
                        />
                      ))}
                    </FormGroup>
                    <FormHelperText>{err}</FormHelperText>
                  </FormControl>
                )}

                {/* FILE UPLOAD */}
                {field.type === "file" && (
                  <TextField
                    type="file"
                    multiple
                    {...register(field.name)}
                    error={!!err}
                    helperText={err}
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

      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        className="mt-4"
        fullWidth
      >
        Back
      </Button>
    </div>
  );
};

export default FormViewerPage;
