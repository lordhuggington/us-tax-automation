import XLSX from "xlsx";
import "xlsx-js-style";
import fs from "fs/promises";
import ExcelJS from "exceljs";
import { dateString } from "./utilz.js";
import { downloadDir, templateDir, uploadDir } from "../config.js";

export const readXLSX = async (path, sheetIndex) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);

    const worksheet = workbook.worksheets[sheetIndex]; // Access the worksheet based on the sheet index
    const json = [];

    // Get the header row (first row)
    const headerRow = worksheet.getRow(1); // Assuming the first row contains headers
    const headers = headerRow.values.slice(1); // Get values, skip the first element (index 0)

    // Read rows starting from the second row to convert to JSON
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip the header row

      const rowData = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const key = headers[colNumber - 1] ? headers[colNumber - 1] : `col${colNumber}`;
        rowData[key] = cell.value; // Use header as key
      });
      json.push(rowData);
    });

    return json;
  } catch (error) {
    throw error;
  }
};

export const writeXLSX = async (path, sheetIndex, json) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path); // Load the existing file

    const worksheet = workbook.worksheets[sheetIndex]; // Get worksheet by index

    const headers = Object.keys(json[0]); // Get headers
    json.map((data, index) => {
      const row = worksheet.getRow(index + 2); // Assuming first row is the header

      headers.map((key, colIndex) => {
        if (data[key] !== null) {
          // Check if the value is a formula
          if (typeof data[key] === "string" && data[key].startsWith("=")) {
            row.getCell(colIndex + 1).value = { formula: data[key] }; // Set as formula
          } else {
            row.getCell(colIndex + 1).value = data[key]; // Set as value
          }
        }
      });

      row.commit(); // Save changes to the row
    });

    // Save the changes
    await workbook.xlsx.writeFile(path.replace(templateDir, downloadDir).replace(".xlsx", ` ${dateString()}.xlsx`));
    return true;
  } catch (error) {
    throw error;
  }
};

export const editXLSX = async (path, sheetIndex, json) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path); // Load the existing file

    const worksheet = workbook.worksheets[sheetIndex]; // Get worksheet by index

    const headers = Object.keys(json[0]); // Get headers
    json.map((data, index) => {
      const row = worksheet.getRow(index + 2); // Assuming first row is the header

      headers.map((key, colIndex) => {
        if (data[key] !== null) {
          // Check if the value is a formula
          if (typeof data[key] === "string" && data[key].startsWith("=")) {
            row.getCell(colIndex + 1).value = { formula: data[key] }; // Set as formula
          } else {
            row.getCell(colIndex + 1).value = data[key]; // Set as value
          }
        }
      });

      row.commit(); // Save changes to the row
    });

    // Save the changes
    await workbook.xlsx.writeFile(path);
    return true;
  } catch (error) {
    throw error;
  }
};

export const appendXLSX = async (path, sheetIndex, json) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path); // Load the existing file

    const worksheet = workbook.worksheets[sheetIndex]; // Get worksheet by index

    const lastRow = worksheet.lastRow.number + 1; // Default to row 2 if no rows exist yet

    const headers = Object.keys(json[0]); // Get headers
    json.map((data, index) => {
      const row = worksheet.getRow(lastRow + index); // Get the new row

      headers.map((key, colIndex) => {
        if (data[key] !== null) {
          // Check if the value is a formula
          if (typeof data[key] === "string" && data[key].startsWith("=")) {
            row.getCell(colIndex + 1).value = { formula: data[key] }; // Set as formula
          } else {
            row.getCell(colIndex + 1).value = data[key]; // Set as value
          }
        }
      });

      row.commit(); // Save changes to the row
    });

    // Save the changes
    await workbook.xlsx.writeFile(path);
    return true;
  } catch (error) {
    throw error;
  }
};

export const createXLSX = async (path, sheetIndex, json) => {
  try {
    const workbook = new ExcelJS.Workbook();
    for (let index = 0; index <= sheetIndex; index++) workbook.addWorksheet(`Sheet${index + 1}`); // Add new worksheet

    const worksheet = workbook.worksheets[sheetIndex]; // Get worksheet by index
    const headers = Object.keys(json[0]);

    // Add the headers to the first row of the worksheet
    worksheet.addRow(headers);

    // Add data to the worksheet
    json.map((data) => {
      const row = headers.map((key) => data[key]);
      worksheet.addRow(row);
    });

    // Save the new Excel file
    await workbook.xlsx.writeFile(path);
    return true;
  } catch (error) {
    throw error;
  }
};
