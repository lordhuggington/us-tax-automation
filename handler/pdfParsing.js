import pdf2table from "pdf2table";
import fs from "fs/promises";

export const readPDF = async (path) => {
  try {
    const buffer = await fs.readFile(path);
    const rows = await new Promise((resolve, reject) => {
      pdf2table.parse(buffer, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    const table = rows
      .map((row) => {
        const regex = /\(\d{3}\)\s\d{3}-\d{4}/g;
        const matches = row[0].match(regex);
        if (matches?.length === 1) {
          return row.map((cell, index) => {
            if (index === 0) return cell.replace(/\D/g, "");
            else return cell;
          });
        }
      })
      .filter((row) => row?.length > 9);

    return table;
  } catch (error) {
    throw error;
  }
};
