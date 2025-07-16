# ERP export utilities
import xml.etree.ElementTree as ET
from xml.dom import minidom
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger('erp_exports')

class ISDOCExporter:
    """Export documents to ISDOC format (Czech electronic invoice standard)."""

    @staticmethod
    def export_to_isdoc(extracted_data: Dict[str, Any], document_info: Dict[str, Any]) -> str:
        """Convert extracted data to ISDOC XML format."""

        # Create root element
        root = ET.Element("Invoice")
        root.set("xmlns", "http://isdoc.cz/namespace/2013")
        root.set("version", "6.0.1")

        # Document info
        doc_details = ET.SubElement(root, "DocumentDetails")

        # Invoice number
        if extracted_data.get("invoice_number"):
            inv_number = ET.SubElement(doc_details, "ID")
            inv_number.text = str(extracted_data["invoice_number"])

        # Issue date
        if extracted_data.get("date"):
            issue_date = ET.SubElement(doc_details, "IssueDate")
            issue_date.text = ISDOCExporter._format_date(extracted_data["date"])

        # Currency (default to CZK)
        currency = ET.SubElement(doc_details, "LocalCurrencyCode")
        currency.text = "CZK"

        # Supplier info
        if extracted_data.get("supplier_name") or extracted_data.get("supplier_ico"):
            supplier_party = ET.SubElement(root, "AccountingSupplierParty")
            party = ET.SubElement(supplier_party, "Party")

            if extracted_data.get("supplier_name"):
                party_name = ET.SubElement(party, "PartyName")
                name = ET.SubElement(party_name, "Name")
                name.text = extracted_data["supplier_name"]

            if extracted_data.get("supplier_ico"):
                party_id = ET.SubElement(party, "PartyIdentification")
                party_id.set("schemeID", "ICO")
                party_id.text = extracted_data["supplier_ico"]

            if extracted_data.get("supplier_dic"):
                tax_scheme = ET.SubElement(party, "PartyTaxScheme")
                company_id = ET.SubElement(tax_scheme, "CompanyID")
                company_id.text = extracted_data["supplier_dic"]

        # Customer info (if available)
        if extracted_data.get("customer_name"):
            customer_party = ET.SubElement(root, "AccountingCustomerParty")
            party = ET.SubElement(customer_party, "Party")
            party_name = ET.SubElement(party, "PartyName")
            name = ET.SubElement(party_name, "Name")
            name.text = extracted_data["customer_name"]

        # Invoice lines (items)
        if extracted_data.get("items"):
            invoice_lines = ET.SubElement(root, "InvoiceLines")
            for i, item in enumerate(extracted_data["items"], 1):
                line = ET.SubElement(invoice_lines, "InvoiceLine")
                line_id = ET.SubElement(line, "ID")
                line_id.text = str(i)

                # Item description
                if item.get("description"):
                    item_elem = ET.SubElement(line, "Item")
                    description = ET.SubElement(item_elem, "Description")
                    description.text = item["description"]

        # Tax total and totals
        if extracted_data.get("total_amount"):
            tax_total = ET.SubElement(root, "TaxTotal")
            tax_amount = ET.SubElement(tax_total, "TaxAmount")
            tax_amount.text = "0"  # Simplified - would need proper tax calculation

            legal_total = ET.SubElement(root, "LegalMonetaryTotal")
            payable_amount = ET.SubElement(legal_total, "PayableAmount")
            payable_amount.text = str(extracted_data["total_amount"])

        # Convert to pretty XML string
        rough_string = ET.tostring(root, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")

    @staticmethod
    def _format_date(date_str: str) -> str:
        """Format date string to ISDOC format (YYYY-MM-DD)."""
        try:
            # Try to parse various date formats
            for fmt in ["%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
                try:
                    date_obj = datetime.strptime(date_str, fmt)
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    continue

            # If parsing fails, return as-is
            return date_str
        except Exception:
            return date_str

class PohodaExporter:
    """Export documents to Pohoda XML format."""

    @staticmethod
    def export_to_pohoda(extracted_data: Dict[str, Any], document_info: Dict[str, Any]) -> str:
        """Convert extracted data to Pohoda XML format."""

        # Create root element with Pohoda namespace
        root = ET.Element("dataPack")
        root.set("xmlns:inv", "http://www.stormware.cz/schema/version_2/invoice.xsd")
        root.set("xmlns", "http://www.stormware.cz/schema/version_2/data.xsd")
        root.set("version", "2.0")

        # Data pack info
        datapack_info = ET.SubElement(root, "dataPackInfo")
        datapack_id = ET.SubElement(datapack_info, "dataPackId")
        datapack_id.text = f"ASKELIO_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Invoice data
        datapack_item = ET.SubElement(root, "dataPackItem")
        datapack_item.set("version", "2.0")

        invoice = ET.SubElement(datapack_item, "inv:invoice")
        invoice.set("version", "2.0")

        # Invoice header
        inv_header = ET.SubElement(invoice, "inv:invoiceHeader")

        # Invoice type
        inv_type = ET.SubElement(inv_header, "inv:invoiceType")
        inv_type.text = "issuedInvoice"

        # Invoice number
        if extracted_data.get("invoice_number"):
            number = ET.SubElement(inv_header, "inv:number")
            number_requested = ET.SubElement(number, "inv:numberRequested")
            number_requested.text = str(extracted_data["invoice_number"])

        # Date
        if extracted_data.get("date"):
            date_elem = ET.SubElement(inv_header, "inv:date")
            date_elem.text = PohodaExporter._format_date(extracted_data["date"])

        # Partner info (supplier)
        if extracted_data.get("supplier_name") or extracted_data.get("supplier_ico"):
            partner_identity = ET.SubElement(inv_header, "inv:partnerIdentity")
            address = ET.SubElement(partner_identity, "inv:address")

            if extracted_data.get("supplier_name"):
                company = ET.SubElement(address, "inv:company")
                company.text = extracted_data["supplier_name"]

            if extracted_data.get("supplier_ico"):
                ico = ET.SubElement(address, "inv:ico")
                ico.text = extracted_data["supplier_ico"]

            if extracted_data.get("supplier_dic"):
                dic = ET.SubElement(address, "inv:dic")
                dic.text = extracted_data["supplier_dic"]

        # Invoice summary
        inv_summary = ET.SubElement(invoice, "inv:invoiceSummary")

        if extracted_data.get("total_amount"):
            home_currency = ET.SubElement(inv_summary, "inv:homeCurrency")
            price_total = ET.SubElement(home_currency, "inv:priceTotal")
            price_total.text = str(extracted_data["total_amount"])

        # Convert to pretty XML string
        rough_string = ET.tostring(root, encoding='unicode')
        reparsed = minidom.parseString(rough_string)
        return reparsed.toprettyxml(indent="  ")

    @staticmethod
    def _format_date(date_str: str) -> str:
        """Format date string to Pohoda format (YYYY-MM-DD)."""
        try:
            # Try to parse various date formats
            for fmt in ["%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
                try:
                    date_obj = datetime.strptime(date_str, fmt)
                    return date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    continue

            # If parsing fails, return as-is
            return date_str
        except Exception:
            return date_str

class ERPExportService:
    """Main service for ERP exports."""

    @staticmethod
    def export_document(extracted_data: Dict[str, Any], document_info: Dict[str, Any], format_type: str) -> str:
        """Export document to specified ERP format."""

        if format_type.lower() == "isdoc":
            return ISDOCExporter.export_to_isdoc(extracted_data, document_info)
        elif format_type.lower() == "pohoda_xml":
            return PohodaExporter.export_to_pohoda(extracted_data, document_info)
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    @staticmethod
    def get_supported_formats() -> list:
        """Get list of supported export formats."""
        return ["isdoc", "pohoda_xml", "json"]

# Global service instance
erp_export_service = ERPExportService()
