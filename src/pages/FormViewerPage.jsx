// FormViewerPage.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const FormViewerPage = ({ formData = [] }) => {
  const [fields, setFields] = useState(formData || []);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    setFields(formData || []);
  }, [formData]);

  const onSubmit = (data) => {
    const formatted = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof FileList ? Array.from(value).map((f) => f.name) : value,
      ])
    );
    alert(JSON.stringify(formatted, null, 2));
    reset();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧾Form Viewer</h2>

      {fields.length === 0 ? (
        <p className="text-gray-500">No form found. Please build one first.</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col">
              <label className="font-medium mb-2">
                {field.label}{" "}
                {field.required && <span className="text-red-600">*</span>}
              </label>

              {/* Text, Number, Email, Date */}
              {["text", "number", "email", "date"].includes(field.type) && (
                <input
                  type={field.type}
                  {...register(field.label, { required: field.required })}
                  placeholder={`Enter ${field.label}`}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              )}

              {/* Select */}
              {field.type === "select" && (
                <select
                  {...register(field.label, { required: field.required })}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {/* Checkbox Group */}
              {field.type === "checkbox-group" && (
                <div className="flex flex-col gap-2">
                  {field.options.map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={opt}
                        {...register(field.label)}
                        className="accent-purple-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {/* File Upload */}
              {field.type === "file" && (
                <input
                  type="file"
                  multiple
                  {...register(field.label, { required: field.required })}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default FormViewerPage;
