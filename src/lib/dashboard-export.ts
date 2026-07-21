import type { WorkBook, WorkSheet, XLSX$Utils } from "xlsx";
import type { AdminDashboardData } from "@/types/admin.type";

const CURRENCY_FORMAT = '"Rp" #,##0';
const INTEGER_FORMAT = "#,##0";
const PERCENTAGE_FORMAT = "0%";
const DATE_FORMAT = "yyyy-mm-dd";

export async function exportDashboardToExcel(data: AdminDashboardData, exportedAt = new Date()): Promise<void> {
  const { utils, writeFileXLSX } = await import("xlsx");
  const workbook = createDashboardWorkbook(data, exportedAt, utils);

  writeFileXLSX(workbook, `freshmart-dashboard-${formatDateForFilename(exportedAt)}.xlsx`, { compression: true });
}

/** Builds the workbook separately so its sheet structure and cell types can be verified without triggering a download. */
export function createDashboardWorkbook(data: AdminDashboardData, exportedAt: Date, utils: XLSX$Utils): WorkBook {
  const workbook = utils.book_new();

  const metricsSheet = utils.aoa_to_sheet([
    ["Metric", "Value"],
    ["Total Revenue", data.metrics.totalRevenue],
    ["Total Orders", data.metrics.totalOrders],
    ["Average Order Value", data.metrics.averageOrderValue],
    ["Active Customers", data.metrics.activeCustomers],
  ]);
  metricsSheet["!cols"] = [{ wch: 24 }, { wch: 20 }];
  setCellFormat(metricsSheet, "B", [2, 4], CURRENCY_FORMAT);
  setCellFormat(metricsSheet, "B", [3, 5], INTEGER_FORMAT);
  addAutoFilter(metricsSheet);
  utils.book_append_sheet(workbook, metricsSheet, "Metrics");

  const revenueTrendSheet = utils.aoa_to_sheet(
    [
      ["Date", "Revenue", "Orders"],
      ...data.revenueTrend.map((row) => [toLocalDate(row.date), row.revenue, row.orders]),
    ],
    { cellDates: true, dateNF: DATE_FORMAT },
  );
  revenueTrendSheet["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 14 }];
  setColumnFormat(revenueTrendSheet, "A", data.revenueTrend.length, DATE_FORMAT);
  setColumnFormat(revenueTrendSheet, "B", data.revenueTrend.length, CURRENCY_FORMAT);
  setColumnFormat(revenueTrendSheet, "C", data.revenueTrend.length, INTEGER_FORMAT);
  addAutoFilter(revenueTrendSheet);
  utils.book_append_sheet(workbook, revenueTrendSheet, "Revenue Trend");

  const topProductsSheet = utils.aoa_to_sheet([
    ["Product", "Image URL", "Quantity Sold", "Revenue"],
    ...data.topProducts.map((product) => [product.name, product.imageUrl ?? "", product.quantity, product.revenue]),
  ]);
  topProductsSheet["!cols"] = [{ wch: 28 }, { wch: 58 }, { wch: 16 }, { wch: 20 }];
  setColumnFormat(topProductsSheet, "C", data.topProducts.length, INTEGER_FORMAT);
  setColumnFormat(topProductsSheet, "D", data.topProducts.length, CURRENCY_FORMAT);
  addAutoFilter(topProductsSheet);
  utils.book_append_sheet(workbook, topProductsSheet, "Top Products");

  const salesByCategorySheet = utils.aoa_to_sheet([
    ["Category", "Revenue", "Percentage"],
    ...data.salesByCategory.map((category) => [category.name, category.revenue, category.percentage / 100]),
  ]);
  salesByCategorySheet["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 16 }];
  setColumnFormat(salesByCategorySheet, "B", data.salesByCategory.length, CURRENCY_FORMAT);
  setColumnFormat(salesByCategorySheet, "C", data.salesByCategory.length, PERCENTAGE_FORMAT);
  addAutoFilter(salesByCategorySheet);
  utils.book_append_sheet(workbook, salesByCategorySheet, "Sales by Category");

  workbook.Props = {
    Title: "FreshMart Dashboard",
    Subject: "FreshMart analytics dashboard export",
    Author: "FreshMart",
    CreatedDate: exportedAt,
  };

  return workbook;
}

function setColumnFormat(sheet: WorkSheet, column: string, dataRowCount: number, format: string) {
  if (dataRowCount === 0) return;
  setCellFormat(sheet, column, Array.from({ length: dataRowCount }, (_, index) => index + 2), format);
}

function setCellFormat(sheet: WorkSheet, column: string, rows: number[], format: string) {
  rows.forEach((row) => {
    const cell = sheet[`${column}${row}`];
    if (cell) cell.z = format;
  });
}

function addAutoFilter(sheet: WorkSheet) {
  if (sheet["!ref"]) sheet["!autofilter"] = { ref: sheet["!ref"] };
}

function toLocalDate(value: string): Date | string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateForFilename(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
