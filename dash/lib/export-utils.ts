import * as XLSX from "xlsx"
import type { DateRange } from "react-day-picker"

export interface Document {
  id: string
  name: string
  type: "pdf" | "image"
  status: "completed" | "processing" | "error"
  accuracy: number
  processedAt: string
  size: string
  pages: number
}

export interface ExportData {
  documents?: Document[]
  statistics?: {
    processedDocuments: number
    timeSaved: number
    accuracy: number
    remainingCredits: number
  }
  monthlyUsage?: Array<{ month: string; documents: number }>
  accuracyTrend?: Array<{ month: string; accuracy: number }>
  documentTypes?: Array<{ name: string; value: number }>
}

export interface ExportOptions {
  format: "csv" | "excel"
  dateRange?: DateRange
  sections: {
    documents: boolean
    statistics: boolean
    usage: boolean
    accuracy: boolean
  }
  filters: {
    status: string
    type: string
    minAccuracy: number
  }
}

export const exportToCSV = async (data: ExportData, options: ExportOptions) => {
  const csvContent: string[] = []

  // Header
  csvContent.push("# Askelio OCR - Export dat")
  csvContent.push(`# Datum exportu: ${new Date().toLocaleDateString("cs-CZ")}`)
  csvContent.push("")

  // Statistics
  if (options.sections.statistics && data.statistics) {
    csvContent.push("## STATISTIKY")
    csvContent.push("Metrika,Hodnota")
    csvContent.push(`Zpracované dokumenty,${data.statistics.processedDocuments}`)
    csvContent.push(`Úspora času (hodiny),${data.statistics.timeSaved}`)
    csvContent.push(`Přesnost OCR (%),${data.statistics.accuracy}`)
    csvContent.push(`Zbývající kredity,${data.statistics.remainingCredits}`)
    csvContent.push("")
  }

  // Documents
  if (options.sections.documents && data.documents) {
    let filteredDocuments = data.documents

    // Apply filters
    if (options.filters.status !== "all") {
      filteredDocuments = filteredDocuments.filter((doc) => doc.status === options.filters.status)
    }
    if (options.filters.type !== "all") {
      filteredDocuments = filteredDocuments.filter((doc) => doc.type === options.filters.type)
    }
    if (options.filters.minAccuracy > 0) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.accuracy >= options.filters.minAccuracy)
    }

    // Apply date range filter
    if (options.dateRange?.from && options.dateRange?.to) {
      filteredDocuments = filteredDocuments.filter((doc) => {
        const docDate = new Date(doc.processedAt)
        return docDate >= options.dateRange!.from! && docDate <= options.dateRange!.to!
      })
    }

    csvContent.push("## DOKUMENTY")
    csvContent.push("Název,Typ,Status,Přesnost (%),Zpracováno,Velikost,Stránky")

    filteredDocuments.forEach((doc) => {
      const statusMap = {
        completed: "Hotovo",
        processing: "Zpracovává se",
        error: "Chyba",
      }
      csvContent.push(
        `"${doc.name}",${doc.type.toUpperCase()},${statusMap[doc.status]},${doc.accuracy},${doc.processedAt},"${doc.size}",${doc.pages}`,
      )
    })
    csvContent.push("")
  }

  // Monthly Usage
  if (options.sections.usage && data.monthlyUsage) {
    csvContent.push("## MĚSÍČNÍ VYUŽITÍ")
    csvContent.push("Měsíc,Počet dokumentů")
    data.monthlyUsage.forEach((item) => {
      csvContent.push(`${item.month},${item.documents}`)
    })
    csvContent.push("")
  }

  // Accuracy Trend
  if (options.sections.accuracy && data.accuracyTrend) {
    csvContent.push("## TREND PŘESNOSTI")
    csvContent.push("Měsíc,Přesnost (%)")
    data.accuracyTrend.forEach((item) => {
      csvContent.push(`${item.month},${item.accuracy}`)
    })
  }

  // Download CSV
  const csvString = csvContent.join("\n")
  const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `askelio-export-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportToExcel = async (data: ExportData, options: ExportOptions) => {
  const workbook = XLSX.utils.book_new()

  // Statistics Sheet
  if (options.sections.statistics && data.statistics) {
    const statsData = [
      ["Metrika", "Hodnota"],
      ["Zpracované dokumenty", data.statistics.processedDocuments],
      ["Úspora času (hodiny)", data.statistics.timeSaved],
      ["Přesnost OCR (%)", data.statistics.accuracy],
      ["Zbývající kredity", data.statistics.remainingCredits],
      [],
      ["Datum exportu", new Date().toLocaleDateString("cs-CZ")],
    ]
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData)

    // Style the header
    statsSheet["A1"] = { v: "Metrika", t: "s", s: { font: { bold: true }, fill: { fgColor: { rgb: "E3F2FD" } } } }
    statsSheet["B1"] = { v: "Hodnota", t: "s", s: { font: { bold: true }, fill: { fgColor: { rgb: "E3F2FD" } } } }

    XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistiky")
  }

  // Documents Sheet
  if (options.sections.documents && data.documents) {
    let filteredDocuments = data.documents

    // Apply filters
    if (options.filters.status !== "all") {
      filteredDocuments = filteredDocuments.filter((doc) => doc.status === options.filters.status)
    }
    if (options.filters.type !== "all") {
      filteredDocuments = filteredDocuments.filter((doc) => doc.type === options.filters.type)
    }
    if (options.filters.minAccuracy > 0) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.accuracy >= options.filters.minAccuracy)
    }

    // Apply date range filter
    if (options.dateRange?.from && options.dateRange?.to) {
      filteredDocuments = filteredDocuments.filter((doc) => {
        const docDate = new Date(doc.processedAt)
        return docDate >= options.dateRange!.from! && docDate <= options.dateRange!.to!
      })
    }

    const statusMap = {
      completed: "Hotovo",
      processing: "Zpracovává se",
      error: "Chyba",
    }

    const documentsData = [
      ["Název", "Typ", "Status", "Přesnost (%)", "Zpracováno", "Velikost", "Stránky"],
      ...filteredDocuments.map((doc) => [
        doc.name,
        doc.type.toUpperCase(),
        statusMap[doc.status],
        doc.accuracy,
        doc.processedAt,
        doc.size,
        doc.pages,
      ]),
    ]

    const documentsSheet = XLSX.utils.aoa_to_sheet(documentsData)

    // Auto-width columns
    const colWidths = [
      { wch: 30 }, // Název
      { wch: 10 }, // Typ
      { wch: 15 }, // Status
      { wch: 12 }, // Přesnost
      { wch: 18 }, // Zpracováno
      { wch: 12 }, // Velikost
      { wch: 10 }, // Stránky
    ]
    documentsSheet["!cols"] = colWidths

    XLSX.utils.book_append_sheet(workbook, documentsSheet, "Dokumenty")
  }

  // Monthly Usage Sheet
  if (options.sections.usage && data.monthlyUsage) {
    const usageData = [["Měsíc", "Počet dokumentů"], ...data.monthlyUsage.map((item) => [item.month, item.documents])]
    const usageSheet = XLSX.utils.aoa_to_sheet(usageData)
    XLSX.utils.book_append_sheet(workbook, usageSheet, "Měsíční využití")
  }

  // Accuracy Trend Sheet
  if (options.sections.accuracy && data.accuracyTrend) {
    const accuracyData = [["Měsíc", "Přesnost (%)"], ...data.accuracyTrend.map((item) => [item.month, item.accuracy])]
    const accuracySheet = XLSX.utils.aoa_to_sheet(accuracyData)
    XLSX.utils.book_append_sheet(workbook, accuracySheet, "Trend přesnosti")
  }

  // Document Types Sheet
  if (data.documentTypes) {
    const typesData = [["Typ dokumentu", "Podíl (%)"], ...data.documentTypes.map((type) => [type.name, type.value])]
    const typesSheet = XLSX.utils.aoa_to_sheet(typesData)
    XLSX.utils.book_append_sheet(workbook, typesSheet, "Typy dokumentů")
  }

  // Download Excel file
  const fileName = `askelio-export-${new Date().toISOString().split("T")[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
