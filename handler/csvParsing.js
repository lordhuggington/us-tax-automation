import fs from "fs";
import csv from "csvtojson";

export const readCSV = async (path) => {
  try {
    const jsonArray = await csv().fromFile(path);

    return jsonArray;
  } catch (error) {
    throw error;
  }
};
