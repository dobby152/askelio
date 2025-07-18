"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Download, FileSpreadsheet, FileText, Calendar, Filter, Settings2 } from "lucide-react"
import { exportToCSV, exportToExcel, type ExportData, type ExportOptions } from "@/lib/export-utils"
import type { DateRange } from "react-day-picker"

interface ExportDialogProps {
  data: ExportData
  trigger?: React.ReactNode
  onExport?: () => void
}

export function ExportDialog({ data, trigger, onExport }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("excel")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selectedSections, setSelectedSections] = useState({
    documents: true,
    statistics: true,
    usage: true,
    accuracy: false,
  })
  const [documentFilters, setDocumentFilters] = useState({
    status: "all",
    type: "all",
    minAccuracy: 0,
  })
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      const options: ExportOptions = {
        format: exportFormat,
        dateRange,
        sections: selectedSections,
        filters: documentFilters,
      }

      // Simulace progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Export dat
      if (exportFormat === "csv") {
        await exportToCSV(data, options)
      } else {
        await exportToExcel(data, options)
      }

      setExportProgress(100)

      setTimeout(() => {
        toast({
          title: "Export dokončen",
          description: `Data byla úspěšně exportována do ${exportFormat.toUpperCase()} souboru.`,
        })
        setOpen(false)
        setIsExporting(false)
        setExportProgress(0)
        onExport?.()
      }, 500)
    } catch (error) {
      toast({
        title: "Chyba při exportu",
        description: "Nepodařilo se exportovat data. Zkuste to prosím znovu.",
        variant: "destructive",
      })
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export dat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export dat</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Formát exportu</span>
            </Label>
            <RadioGroup value={exportFormat} onValueChange={(value: "csv" | "excel") => setExportFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span>Excel (.xlsx) - Doporučeno</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center space-x-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>CSV (.csv)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Časové období</span>
            </Label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <p className="text-sm text-gray-500">Ponechte prázdné pro export všech dat</p>
          </div>

          {/* Sections Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Settings2 className="w-4 h-4" />
              <span>Sekce k exportu</span>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="documents"
                  checked={selectedSections.documents}
                  onCheckedChange={() => toggleSection("documents")}
                />
                <Label htmlFor="documents" className="cursor-pointer">
                  Dokumenty ({data.documents?.length || 0})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="statistics"
                  checked={selectedSections.statistics}
                  onCheckedChange={() => toggleSection("statistics")}
                />
                <Label htmlFor="statistics" className="cursor-pointer">
                  Statistiky
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="usage" checked={selectedSections.usage} onCheckedChange={() => toggleSection("usage")} />
                <Label htmlFor="usage" className="cursor-pointer">
                  Měsíční využití
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accuracy"
                  checked={selectedSections.accuracy}
                  onCheckedChange={() => toggleSection("accuracy")}
                />
                <Label htmlFor="accuracy" className="cursor-pointer">
                  Trend přesnosti
                </Label>
              </div>
            </div>
          </div>

          {/* Document Filters */}
          {selectedSections.documents && (
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtry dokumentů</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm">
                    Status
                  </Label>
                  <Select
                    value={documentFilters.status}
                    onValueChange={(value) => setDocumentFilters((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="completed">Hotovo</SelectItem>
                      <SelectItem value="processing">Zpracovává se</SelectItem>
                      <SelectItem value="error">Chyba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-filter" className="text-sm">
                    Typ
                  </Label>
                  <Select
                    value={documentFilters.type}
                    onValueChange={(value) => setDocumentFilters((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Obrázek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accuracy-filter" className="text-sm">
                    Min. přesnost (%)
                  </Label>
                  <Select
                    value={documentFilters.minAccuracy.toString()}
                    onValueChange={(value) =>
                      setDocumentFilters((prev) => ({ ...prev, minAccuracy: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="accuracy-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Bez omezení</SelectItem>
                      <SelectItem value="90">90%+</SelectItem>
                      <SelectItem value="95">95%+</SelectItem>
                      <SelectItem value="98">98%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Průběh exportu</Label>
              <Progress value={exportProgress} className="h-2" />
              <p className="text-sm text-gray-500">{exportProgress < 100 ? "Exportuji data..." : "Export dokončen!"}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
              Zrušit
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Exportuji...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportovat {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
