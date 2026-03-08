package com.myaangan.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.myaangan.entity.MaintenanceBill;
import com.myaangan.entity.MaintenanceConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Locale;

@Slf4j
@Service
public class MaintenanceReceiptService {

    @Value("${app.upload.receipts.dir:/app/uploads/receipts}")
    private String uploadDir;

    private static final DeviceRgb BRAND   = new DeviceRgb(30, 58, 138);   // deep blue
    private static final DeviceRgb GREEN   = new DeviceRgb(6, 78, 59);
    private static final DeviceRgb LIGHT   = new DeviceRgb(239, 246, 255);
    private static final DeviceRgb GREY    = new DeviceRgb(107, 114, 128);
    private static final DeviceRgb DARK    = new DeviceRgb(26, 26, 46);
    private static final DeviceRgb SUCCESS = new DeviceRgb(16, 185, 129);

    public String generateReceipt(MaintenanceBill bill, MaintenanceConfig cfg) throws Exception {
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);

        String fileName = "receipt-" + bill.getId() + "-" + bill.getBillYear() + "-" + bill.getBillMonth() + ".pdf";
        Path filePath = dir.resolve(fileName);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter   writer   = new PdfWriter(baos);
            PdfDocument pdfDoc   = new PdfDocument(writer);
            Document    document = new Document(pdfDoc, PageSize.A4);
            document.setMargins(40, 50, 40, 50);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            String monthYear = Month.of(bill.getBillMonth())
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + bill.getBillYear();

            // ── Header band ──────────────────────────────────────────────
            Table header = new Table(UnitValue.createPercentArray(new float[]{1}))
                .useAllAvailableWidth()
                .setBackgroundColor(BRAND);
            Cell hCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setPadding(20);
            hCell.add(new Paragraph(cfg.getSocietyName() != null ? cfg.getSocietyName() : "MyAangan Society")
                .setFont(bold).setFontSize(20).setFontColor(com.itextpdf.kernel.colors.ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER));
            hCell.add(new Paragraph("MAINTENANCE FEE RECEIPT")
                .setFont(regular).setFontSize(11).setFontColor(new DeviceRgb(191, 219, 254))
                .setTextAlignment(TextAlignment.CENTER));
            header.addCell(hCell);
            document.add(header);

            // ── PAID stamp ───────────────────────────────────────────────
            document.add(new Paragraph("✓ PAYMENT CONFIRMED")
                .setFont(bold).setFontSize(16).setFontColor(SUCCESS)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20).setMarginBottom(4));
            document.add(new Paragraph(bill.getPaidAt() != null
                    ? "Paid on " + bill.getPaidAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                    : "Payment confirmed")
                .setFont(regular).setFontSize(10).setFontColor(GREY)
                .setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));

            // ── Info grid ────────────────────────────────────────────────
            Table info = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth()
                .setBackgroundColor(LIGHT)
                .setBorderRadius(new BorderRadius(6));

            addInfoRow(info, "Flat", bill.getFlatKey(), bold, regular);
            addInfoRow(info, "Billing Period", monthYear, bold, regular);
            addInfoRow(info, "Receipt No.", "RCPT-" + String.format("%06d", bill.getId()), bold, regular);
            if (bill.getRazorpayPaymentId() != null)
                addInfoRow(info, "Transaction ID", bill.getRazorpayPaymentId(), bold, regular);
            if (bill.getResident() != null)
                addInfoRow(info, "Resident", bill.getResident().getFirstName() + " " + bill.getResident().getLastName(), bold, regular);
            document.add(info);

            // ── Amount breakdown ─────────────────────────────────────────
            document.add(new Paragraph("Amount Breakdown")
                .setFont(bold).setFontSize(13).setFontColor(DARK)
                .setMarginTop(20).setMarginBottom(8));

            Table amounts = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth();

            addAmountRow(amounts, "Base Maintenance", bill.getBaseAmount(), regular, bold, false);
            if (bill.getPenaltyAmount().compareTo(BigDecimal.ZERO) > 0)
                addAmountRow(amounts, "Late Penalty", bill.getPenaltyAmount(), regular, bold, false);
            if (bill.getInterestAmount().compareTo(BigDecimal.ZERO) > 0)
                addAmountRow(amounts, "Interest Charges", bill.getInterestAmount(), regular, bold, false);

            // Total row
            Table totalRow = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth()
                .setBackgroundColor(BRAND);
            totalRow.addCell(new Cell().add(new Paragraph("TOTAL PAID")
                .setFont(bold).setFontSize(13).setFontColor(com.itextpdf.kernel.colors.ColorConstants.WHITE))
                .setBorder(Border.NO_BORDER).setPadding(10));
            totalRow.addCell(new Cell().add(new Paragraph("₹ " + bill.getTotalAmount().toPlainString())
                .setFont(bold).setFontSize(13).setFontColor(com.itextpdf.kernel.colors.ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.RIGHT))
                .setBorder(Border.NO_BORDER).setPadding(10));
            document.add(amounts);
            document.add(totalRow);

            // ── Footer ───────────────────────────────────────────────────
            document.add(new Paragraph("\nThis is a system-generated receipt. No signature required.")
                .setFont(regular).setFontSize(9).setFontColor(GREY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(24));

            document.close();
            Files.write(filePath, baos.toByteArray());
        }

        log.info("Receipt generated: {}", filePath);
        return fileName;
    }

    private void addInfoRow(Table t, String label, String value, PdfFont bold, PdfFont regular) {
        t.addCell(new Cell().add(new Paragraph(label).setFont(bold).setFontSize(10).setFontColor(GREY))
            .setBorder(Border.NO_BORDER).setPadding(8).setPaddingLeft(14));
        t.addCell(new Cell().add(new Paragraph(value != null ? value : "-").setFont(regular).setFontSize(10).setFontColor(DARK))
            .setBorder(Border.NO_BORDER).setPadding(8));
    }

    private void addAmountRow(Table t, String label, BigDecimal amount, PdfFont regular, PdfFont bold, boolean isTotal) {
        t.addCell(new Cell().add(new Paragraph(label)
            .setFont(isTotal ? bold : regular).setFontSize(11).setFontColor(DARK))
            .setBorder(Border.NO_BORDER).setPadding(6)
            .setBorderBottom(new SolidBorder(new DeviceRgb(229, 231, 235), 0.5f)));
        t.addCell(new Cell().add(new Paragraph("₹ " + amount.toPlainString())
            .setFont(isTotal ? bold : regular).setFontSize(11).setFontColor(DARK)
            .setTextAlignment(TextAlignment.RIGHT))
            .setBorder(Border.NO_BORDER).setPadding(6)
            .setBorderBottom(new SolidBorder(new DeviceRgb(229, 231, 235), 0.5f)));
    }
}
