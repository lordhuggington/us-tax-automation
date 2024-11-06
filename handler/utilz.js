import fs from "fs/promises";
import { uploadDir } from "../config.js";

export const initUploadDir = async (prefix) => {
  try {
    const files = await fs.readdir(uploadDir);
    for (const file of files) {
      if (file.startsWith(prefix)) await fs.unlink(uploadDir + "/" + file);
    }
  } catch (error) {
    throw error;
  }
};
export const convertDateString = (dateString) => {
  // Create a Date object from the input string
  const date = new Date(dateString);

  // Check if date parsing was successful
  if (isNaN(date)) {
    throw new Error("Invalid date string");
  }

  // Get the abbreviated month name and the last two digits of the year
  const options = { month: "short" };
  const month = date.toLocaleString("en-US", options);
  const year = date.getFullYear().toString().slice(-2);

  // Format the result as "MMM-YY"
  return `${month}-${year}`;
};

const getColumnLetter = (index) => {
  let letter = "";
  index++; // Make it 1 based index
  while (index > 0) {
    const modulo = (index - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter; // 65 is the ASCII code for 'A'
    index = Math.floor((index - modulo) / 26);
  }
  return letter;
};

export const dateString = () => {
  const date = new Date();

  // Get the abbreviated month name and the last two digits of the year
  const options = { month: "long" };
  const month = date.toLocaleString("en-US", options);
  const year = date.getFullYear().toString().slice(-2);

  // Format the result as "Month YY"
  return `${month} ${year}`;
};

export const formatJson2Excel = (jsonArray) => {
  try {
    // Get the headers from the first row
    const headers = Object.keys(jsonArray[0] || {});

    // Prepare an array to hold the final structured data
    const formattedData = [];

    // Include the header row
    const headerRow = headers.map((header, index) => {
      const colLetter = getColumnLetter(index);
      return { [colLetter]: header };
    });

    formattedData.push(Object.assign({}, ...headerRow)); // Add the header row to formattedData

    // Transform data rows into Excel-style format
    jsonArray.map((row, rowIndex) => {
      const formattedRow = Object.entries(row).map(([key, value], colIndex) => {
        const colLetter = getColumnLetter(colIndex);
        return { [colLetter]: value };
      });
      formattedData.push(Object.assign({}, ...formattedRow)); // Add each formatted row
    });
    return formattedData;
  } catch (error) {
    throw error;
  }
};

export const formatArray2Excel = (array) => {
  try {
    const formattedData = [];
    array.map((row, rowIndex) => {
      const formattedRow = row.map((col, colIndex) => {
        const colLetter = getColumnLetter(colIndex);
        return { [colLetter]: col };
      });
      formattedData.push(Object.assign({}, ...formattedRow));
    });
    return formattedData;
  } catch (error) {
    throw error;
  }
};
