import * as XLSX from "xlsx";

export const exportToCSV = (rows, fileName = "data.csv") => {
  if (!rows || !rows.length) return;

  const header = Object.keys(rows[0]).join(",");
  const values = rows
    .map((row) =>
      Object.values(row)
        .map((v) => `"${v !== null && v !== undefined ? v : ""}"`)
        .join(",")
    )
    .join("\n");

  const csv = `${header}\n${values}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  link.click();
};

export const exportToExcel = (rows, fileName = "data.xlsx") => {
  if (!rows || !rows.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
};
