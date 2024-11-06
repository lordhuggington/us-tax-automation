import fs from "fs/promises";
import { startOfMonth, format } from "date-fns";
import { readCSV } from "./csvParsing.js";
import { readPDF } from "./pdfParsing.js";
import { appendXLSX, createXLSX, editXLSX, readXLSX, writeXLSX } from "./xlsxParsing.js";
import { convertDateString, dateString, formatArray2Excel, formatJson2Excel, initUploadDir } from "./utilz.js";
import { downloadDir, templateDir, uploadDir } from "../config.js";
import { getCategory } from "./consts.js";

export const mergeFiles = async (index) => {
  try {
    for (let i = 1; i <= index; i++) {
      const csv = await readCSV(`${uploadDir}/0_${i}.csv`, 0);
      if (i === 1) await createXLSX(`${downloadDir}/Merged File ${dateString()}.xlsx`, 0, csv);
      else await appendXLSX(`${downloadDir}/Merged File ${dateString()}.xlsx`, 0, csv);
    }
    await initUploadDir("0_");
  } catch (err) {
    throw err;
  }
};

export const stage1 = async () => {
  try {
    const output = [];

    const pdf = await readPDF(`${uploadDir}/1_T-Mobile.pdf`);
    const pdfExcel = formatArray2Excel(pdf);

    const csv = await readCSV(`${uploadDir}/1_Verizon.csv`);
    const csvExcel = formatJson2Excel(csv);

    const xlsx = await readXLSX(`${uploadDir}/1_AT&T Detail Report.xlsx`, 0);
    const xlsxExcel = formatJson2Excel(xlsx);

    const services = await readCSV(`${uploadDir}/1_ListOfServices.csv`);
    const servicesExcel = await formatJson2Excel(services);

    const month = convertDateString(xlsxExcel[3].B);

    pdfExcel.map((row) => {
      const service = servicesExcel.find((item) => item.F.toString() === row.A.toString());
      if (!service) console.log("No Service", row.A);

      const formattedRow = {
        CustomerNumber: service?.B === "Acteon Group" ? service?.D : service?.B,
        ProdServiceName: row.A,
        TaxType: "Government Taxes and Fees & T-Mobile Fees and Charges",
        TaxAmount: row.J,
        Source: "T-Mobile",
        Month: month,
      };
      output.push(formattedRow);
    });

    csvExcel.map((row, index) => {
      if (row.A.includes("No Cost Center")) {
        const service = servicesExcel.find((item) => item.F.toString() === row.B.replace(/\D/g, ""));
        if (!service) console.log("No Service", row.A);

        const formattedRow1 = {
          CustomerNumber: service?.B === "Acteon Group" ? service?.D : service?.B,
          ProdServiceName: row.B.replace(/\D/g, ""),
          TaxType: "Surcharges",
          TaxAmount: row.G,
          Source: "Verizon",
          Month: month,
        };
        if (row.G != "$0.00") output.push(formattedRow1);

        const formattedRow2 = {
          CustomerNumber: service?.B === "Acteon Group" ? service?.D : service?.B,
          ProdServiceName: row.B.replace(/\D/g, ""),
          TaxType: "Taxes Governmental Surcharges and Fees",
          TaxAmount: row.H,
          Source: "Verizon",
          Month: month,
        };
        if (row.H != "$0.00") output.push(formattedRow2);
      }
    });

    xlsxExcel.map((row, index) => {
      if (typeof row.B === "number") {
        const service = servicesExcel.find((item) => item.F.toString() === row.B.toString());
        if (!service) console.log("No Service", row.A);

        const taxType = () => {
          if (+row.H !== 0) return row.E;
          if (+row.I !== 0) return "City/Local Tax";
          if (+row.J !== 0) return "County Tax";
          if (+row.K !== 0) return "State Tax";
          if (+row.L !== 0) return "Federal Tax";
        };
        const taxAmount = row.H + row.I + row.J + row.K + row.L;

        const formattedRow = {
          CustomerNumber: service?.B === "Acteon Group" ? service?.D : service?.B,
          ProdServiceName: row.B,
          TaxType: taxType(),
          TaxAmount: `$${taxAmount.toFixed(2)}`,
          Source: "AT&T Detail Report",
          Month: month,
        };
        output.push(formattedRow);
      }
    });

    // await fs.writeFile("assets/output.json", JSON.stringify(output, null, 2));
    await writeXLSX(`${templateDir}/Total Taxes.xlsx`, 0, output);
    await initUploadDir("1_");
  } catch (err) {
    throw err;
  }
};

const runZoeyTaxReport = async () => {
  let v2Excel = await readXLSX(`${uploadDir}/2_CallEnquiryV2_Merged.xlsx`, 0);
  v2Excel = await formatJson2Excel(v2Excel);

  let classExcel = await readXLSX(`${templateDir}/Zoey Tax Report.xlsx`, 2);
  classExcel = await formatJson2Excel(classExcel);

  let servicesExcel = await readCSV(`${uploadDir}/2_ListOfServices.csv`);
  servicesExcel = await formatJson2Excel(servicesExcel);

  let data = {};
  v2Excel.map((row) => {
    if (typeof row.A === "number") {
      const classes = classExcel.find((item) => item.A === row.T);

      const name = row.I;
      const type = classes ? classes.F : getCategory(row.U);
      const total = data[name]?.[type]?.total || 0;
      const quantity = data[name]?.[type]?.quantity || 0;

      data[name] = {
        ...data[name],
        [type]: {
          total: total + +row.M,
          quantity: +row.M ? quantity + 1 : quantity,
        },
      };
    }
  });

  let ceretax = [];
  Object.entries(data).map(([name, types], nIndex) => {
    Object.entries(types).map(([type, amount], tIndex) => {
      if (amount.total > 0) {
        const service = servicesExcel.find((item) => item.F === name);
        if (!service) console.log("No Service", name, amount);

        ceretax.push({
          D: service?.B === "Acteon Group" ? service?.D : service?.B,
          K: type,
          M: amount.total,
          N: amount.quantity,
        });
      }
    });
  });
  return { ceretax };
};

const runFixedChargesReport = async () => {
  let unpostedExcel = await readCSV(`${uploadDir}/2_UnpostedFixedCharges.csv`);
  unpostedExcel = await formatJson2Excel(unpostedExcel);

  let fixedCharges = [];
  let data = {};
  unpostedExcel.map((row, rowIndex) => {
    if (+row.A > 0 && row.B !== "Global Telecom Networks" && row.B !== "ConvaTec Canada (1015)") {
      const name = row.B === "Acteon Group" ? row.D : row.B;
      const type = row.O;
      const total = data[name]?.[type]?.total || 0;
      const quantity = data[name]?.[type]?.quantity || 0;

      data[name] = {
        ...data[name],
        [type]: {
          total: total + +row.N,
          quantity: +row.N ? quantity + 1 : quantity,
        },
      };

      fixedCharges.push({ ...row, B: name });
    }
  });

  let ceretax = [];
  Object.entries(data).map(([name, types], nIndex) => {
    Object.entries(types).map(([type, amount], tIndex) => {
      ceretax.push({
        D: name,
        K: type,
        M: amount.total,
        N: amount.quantity,
      });
    });
  });
  return { fixedCharges, ceretax };
};

const runCeretax = async () => {
  let item = await readXLSX(`${uploadDir}/2_Ceretax Item Codes.xlsx`, 0);
  item = await formatJson2Excel(item);

  let address = await readXLSX(`${uploadDir}/2_Ceretax Address List.xlsx`, 0);
  address = await formatJson2Excel(address);

  return { item, address };
};

export const stage2 = async () => {
  try {
    const zoey = await runZoeyTaxReport();
    const fixed = await runFixedChargesReport();
    const ceretax = await runCeretax();

    let upload = [];
    let total = {};
    [...zoey.ceretax, ...fixed.ceretax].map((row) => {
      const fixedCharges = fixed.fixedCharges.find((val) => row.D === val.B);
      const item = ceretax.item.find((val) => row.K === val.B);
      const address = ceretax.address.find((val) => row.D === val.A);

      if (!fixedCharges) console.log("No Fixed Charges", row.D);
      if (!item) console.log("No Item Code", row.K);
      if (!address) console.log("No Address", row.D);

      total[fixedCharges?.H] = total[fixedCharges?.H] || 0;
      total[fixedCharges?.H] = total[fixedCharges?.H] + +row.M;

      upload.push({
        ...row,
        A: fixedCharges?.H,
        B: format(startOfMonth(new Date()), "dd/MM/yyyy"),
        E: 12,
        F: "02",
        G: "01",
        H: 0,
        J: item?.A,
        L: item?.C,
        O: "03",
        P: "S",
        Q: address?.B,
        R: address?.C,
        S: address?.D,
        T: address?.E?.toString()?.startsWith("0") ? address?.E?.toString() : address?.E,
      });
    });

    upload.sort((a, b) => a.A - b.A);

    let counts = {};
    upload = upload.map((row) => {
      counts[row.A] = counts[row.A] || 0;
      counts[row.A] = counts[row.A] + 1;

      return {
        A: row.A,
        B: row.B,
        C: total[row.A],
        D: row.D,
        E: row.E,
        F: row.F,
        G: row.G,
        H: row.H,
        I: counts[row.A],
        J: row.J,
        K: row.K,
        L: row.L,
        M: row.M,
        N: row.N,
        O: row.O,
        P: row.P,
        Q: row.Q,
        R: row.R,
        S: row.S,
        T: row.T,
      };
    });

    await writeXLSX(`${templateDir}/Ceretax Upload.xlsx`, 0, upload);
    await initUploadDir("2_");
  } catch (err) {
    throw err;
  }
};

export const stage3 = async () => {};
