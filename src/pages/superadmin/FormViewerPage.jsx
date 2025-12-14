import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
  FormControl,
  FormLabel,
  FormGroup,
  FormHelperText,
  FormControlLabel,
  Alert,
  Divider,
  Stack,
} from "@mui/material";

import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import useApi from "../../context/useApi";
import { apiEndpoints } from "../../api/endpoints";

/* -------------------------------------------------------
   NORMALIZER
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
  const { menuId } = useParams();
  const navigate = useNavigate();

  const [fields, setFields] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* Auth */
  const { getDecodedToken } = useContext(AuthContext);
  const tenantId = getDecodedToken?.()?.tenantId;

  /* Menu */
  const { menus } = useContext(MenuContext);

  const findMenu = (list) => {
    for (let m of list) {
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

  const tableName = menuObj?.tableName;
  const schema = menuObj?.formSchema || [];

  /* API */
  const { execute: submitFormApi, loading } = useApi(
    apiEndpoints.submitForm.submit,
    { immediate: false }
  );

  /* Normalize schema */
  useEffect(() => {
    if (Array.isArray(schema)) {
      setFields(schema.map(normalizeField));
    }
  }, [schema]);

  /* -------------------------------------------------------
     Validation schema
  -------------------------------------------------------- */
  const validationSchema = useMemo(() => {
    const shape = {};

    fields.forEach((field) => {
      let rule;

      switch (field.type) {
        case "email":
          rule = Yup.string().email("Invalid email");
          break;
        case "number":
          rule = Yup.number().typeError("Must be a number");
          break;
        case "checkbox-group":
          rule = Yup.array().of(Yup.string());
          break;
        case "file":
          rule = Yup.mixed().test(
            "required",
            "File required",
            (v) => !field.required || (v && v.length > 0)
          );
          break;
        default:
          rule = Yup.string();
      }

      if (field.required) {
        rule = rule.required(`${field.label} is required`);
      }

      if (field.minLength) {
        rule = rule.min(field.minLength);
      }

      if (field.maxLength) {
        rule = rule.max(field.maxLength);
      }

      if (field.regex) {
        try {
          const regex = new RegExp(field.regex);
          rule = rule.test("regex", "Invalid format", (v) =>
            regex.test(v || "")
          );
        } catch {}
      }

      shape[field.name] = rule;
    });

    return Yup.object().shape(shape);
  }, [fields]);

  /* Form */
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
  });

  /* Submit */
  const onSubmit = async (data) => {
    const formatted = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        v instanceof FileList ? Array.from(v).map((f) => f.name) : v,
      ])
    );

    try {
      await submitFormApi({
        tenantId,
        title: menuObj.title,
        tableName,
        data: formatted,
      });

      setSubmitSuccess(true);
      reset();
      setTimeout(() => setSubmitSuccess(false), 2500);
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  /* Guard */
  if (!menuObj) {
    return (
      <Alert severity="error">
        Invalid Menu ID: <b>{menuId}</b>
      </Alert>
    );
  }

  /* -------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <Box maxWidth="md" mx="auto" mt={3}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Box mb={2}>
          <Typography variant="h5" fontWeight={600}>
            {menuObj.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please fill the details below
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Form submitted successfully
          </Alert>
        )}

        {fields.length === 0 ? (
          <Typography color="text.secondary">
            No fields configured.
          </Typography>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              {fields.map((field) => {
                const err = errors[field.name]?.message;

                return (
                  <FormControl key={field.id} fullWidth error={!!err}>
                    <FormLabel sx={{ fontWeight: 500 }}>
                      {field.label}
                      {field.required && (
                        <Typography component="span" color="error">
                          {" "}*
                        </Typography>
                      )}
                    </FormLabel>

                    {/* INPUTS */}
                    {["text", "number", "email", "date"].includes(field.type) && (
                      <TextField
                        type={field.type}
                        size="small"
                        {...register(field.name)}
                        error={!!err}
                        helperText={err}
                      />
                    )}

                    {/* SELECT */}
                    {field.type === "select" && (
                      <>
                        <Select
                          size="small"
                          defaultValue=""
                          {...register(field.name)}
                        >
                          <MenuItem value="" disabled>
                            Select {field.label}
                          </MenuItem>
                          {field.options.map((opt, i) => (
                            <MenuItem key={i} value={opt}>
                              {opt}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{err}</FormHelperText>
                      </>
                    )}

                    {/* CHECKBOX GROUP */}
                    {field.type === "checkbox-group" && (
                      <>
                        <FormGroup row>
                          {field.options.map((opt, i) => (
                            <FormControlLabel
                              key={i}
                              control={
                                <Checkbox
                                  value={opt}
                                  {...register(field.name)}
                                />
                              }
                              label={opt}
                            />
                          ))}
                        </FormGroup>
                        <FormHelperText>{err}</FormHelperText>
                      </>
                    )}

                    {/* FILE */}
                    {field.type === "file" && (
                      <>
                        <TextField
                          type="file"
                          inputProps={{ multiple: true }}
                          {...register(field.name)}
                          error={!!err}
                        />
                        <FormHelperText>{err}</FormHelperText>
                      </>
                    )}
                  </FormControl>
                );
              })}
            </Stack>

            {/* ACTIONS */}
            <Box
              display="flex"
              gap={2}
              justifyContent="flex-end"
              mt={4}
            >
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>

              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default FormViewerPage;
