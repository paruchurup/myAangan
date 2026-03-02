package com.myaangan.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.myaangan.dto.PdfReportRequest;
import com.myaangan.entity.Complaint;
import com.myaangan.entity.ComplaintAttachment;
import com.myaangan.enums.AttachmentType;
import com.myaangan.enums.ComplaintStatus;
import com.myaangan.enums.EscalationLevel;
import com.myaangan.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintPdfService {

    private final ComplaintRepository complaintRepo;

    @Value("${app.upload.complaints.dir:/app/uploads/complaints}")
    private String uploadDir;

    private static final DeviceRgb BRAND_BLUE   = new DeviceRgb(15, 52, 96);
    private static final DeviceRgb ACCENT_RED   = new DeviceRgb(233, 69, 96);
    private static final DeviceRgb LIGHT_GREY   = new DeviceRgb(245, 246, 250);
    private static final DeviceRgb DARK         = new DeviceRgb(26, 26, 46);
    private static final DeviceRgb MID_GREY     = new DeviceRgb(150, 150, 150);
    private static final DateTimeFormatter FMT  = DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    public byte[] generateReport(PdfReportRequest req, String generatedByName) throws IOException {

        // Fetch complaints — filter by status if specified
        List<Complaint> complaints = fetchComplaints(req);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);

        // Page numbering handler
        PageNumberHandler pageHandler = new PageNumberHandler();
        pdfDoc.addEventHandler(PdfDocumentEvent.END_PAGE, pageHandler);

        Document doc = new Document(pdfDoc, PageSize.A4);
        doc.setMargins(60, 50, 60, 50);

        PdfFont regular = PdfFontFactory.createFont("Helvetica");
        PdfFont bold    = PdfFontFactory.createFont("Helvetica-Bold");

        // ── Page 1: Cover Page ────────────────────────────────────────────────
        addCoverPage(doc, req, generatedByName, complaints.size(), regular, bold);
        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        // ── Page 2: Covering Letter ───────────────────────────────────────────
        addCoveringLetter(doc, req, generatedByName, regular, bold);
        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        // ── Page 3: Complaint Index ───────────────────────────────────────────
        addComplaintIndex(doc, complaints, regular, bold);
        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        // ── Per-Complaint Detail Pages ────────────────────────────────────────
        // Track which attachment appears on which page for index
        Map<Long, Integer> attachmentPageMap = new LinkedHashMap<>();

        for (int i = 0; i < complaints.size(); i++) {
            addComplaintDetail(doc, complaints.get(i), i + 1, pdfDoc, attachmentPageMap, regular, bold);
            if (i < complaints.size() - 1) {
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }
        }

        doc.close();

        // Inject total page count into handler
        byte[] bytes = baos.toByteArray();
        log.info("Generated complaint PDF: {} pages, {} complaints", pdfDoc.getNumberOfPages(), complaints.size());
        return bytes;
    }

    private void addCoverPage(Document doc, PdfReportRequest req, String generatedBy,
                               int complaintCount, PdfFont regular, PdfFont bold) {
        // Blue header bar
        doc.add(new Paragraph(" ")
            .setMarginBottom(60));

        doc.add(new Paragraph("MyAangan")
            .setFont(bold).setFontSize(36)
            .setFontColor(BRAND_BLUE)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(8));

        doc.add(new Paragraph(req.getReportTitle() != null ? req.getReportTitle()
                : "Complaint Report")
            .setFont(bold).setFontSize(22)
            .setFontColor(DARK)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(6));

        if (req.getSocietyName() != null) {
            doc.add(new Paragraph(req.getSocietyName())
                .setFont(regular).setFontSize(14)
                .setFontColor(MID_GREY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(60));
        }

        // Stats box
        Table stats = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
            .setWidth(UnitValue.createPercentValue(80))
            .setHorizontalAlignment(HorizontalAlignment.CENTER)
            .setMarginBottom(60);

        addStatCell(stats, String.valueOf(complaintCount), "Total Complaints", bold, regular);
        addStatCell(stats, LocalDateTime.now().format(DATE), "Generated On", bold, regular);
        addStatCell(stats, generatedBy, "Prepared By", bold, regular);
        doc.add(stats);

        if (req.getAddressedTo() != null) {
            doc.add(new Paragraph("Addressed To: " + req.getAddressedTo())
                .setFont(regular).setFontSize(12)
                .setFontColor(MID_GREY)
                .setTextAlignment(TextAlignment.CENTER));
        }
    }

    private void addCoveringLetter(Document doc, PdfReportRequest req,
                                    String generatedBy, PdfFont regular, PdfFont bold) {
        doc.add(new Paragraph("COVERING LETTER")
            .setFont(bold).setFontSize(14)
            .setFontColor(BRAND_BLUE)
            .setMarginBottom(20));

        // Letterhead info
        doc.add(new Paragraph(LocalDateTime.now().format(DATE))
            .setFont(regular).setFontSize(11)
            .setFontColor(MID_GREY)
            .setMarginBottom(16));

        if (req.getAddressedTo() != null) {
            doc.add(new Paragraph("To,")
                .setFont(regular).setFontSize(11).setMarginBottom(4));
            doc.add(new Paragraph(req.getAddressedTo())
                .setFont(bold).setFontSize(11).setMarginBottom(20));
        }

        doc.add(new Paragraph("Subject: Complaint Report — Pending Issues Requiring Resolution")
            .setFont(bold).setFontSize(11).setMarginBottom(16));

        if (req.getCoveringLetter() != null && !req.getCoveringLetter().isBlank()) {
            // Render user's letter paragraph by paragraph
            for (String para : req.getCoveringLetter().split("\n")) {
                doc.add(new Paragraph(para.isBlank() ? " " : para)
                    .setFont(regular).setFontSize(11)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(10));
            }
        } else {
            doc.add(new Paragraph(
                "We hereby submit this complaint report documenting unresolved issues reported by "
                + "residents of our society. These complaints have been logged through our society "
                + "management system and require your urgent attention and resolution. "
                + "Kindly review the attached complaint details and take necessary action.")
                .setFont(regular).setFontSize(11)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginBottom(10));
        }

        doc.add(new Paragraph("\n\nYours sincerely,")
            .setFont(regular).setFontSize(11).setMarginBottom(40));

        doc.add(new Paragraph(generatedBy)
            .setFont(bold).setFontSize(11).setMarginBottom(4));
        if (req.getSocietyName() != null) {
            doc.add(new Paragraph(req.getSocietyName())
                .setFont(regular).setFontSize(11));
        }
    }

    private void addComplaintIndex(Document doc, List<Complaint> complaints,
                                    PdfFont regular, PdfFont bold) {
        doc.add(new Paragraph("COMPLAINT INDEX")
            .setFont(bold).setFontSize(16)
            .setFontColor(BRAND_BLUE)
            .setMarginBottom(20));

        Table table = new Table(UnitValue.createPercentArray(new float[]{0.6f, 3f, 1.4f, 1.4f, 1f}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginBottom(20);

        // Header
        for (String h : List.of("#", "Complaint", "Category", "Status", "Attachments")) {
            table.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(10))
                .setBackgroundColor(BRAND_BLUE)
                .setFontColor(ColorConstants.WHITE)
                .setPadding(8));
        }

        for (int i = 0; i < complaints.size(); i++) {
            Complaint c = complaints.get(i);
            boolean even = i % 2 == 0;

            table.addCell(indexCell(String.valueOf(i + 1), even, regular));
            table.addCell(new Cell().add(
                new Paragraph(c.getTitle()).setFont(bold).setFontSize(9).setMarginBottom(2)
                    .add(new Text("\n" + truncate(c.getDescription(), 80))
                        .setFont(regular).setFontSize(8)
                        .setFontColor(MID_GREY)))
                .setBackgroundColor(even ? ColorConstants.WHITE : LIGHT_GREY).setPadding(8));
            table.addCell(indexCell(c.getCategory().getLabel(), even, regular));
            table.addCell(indexCell(statusText(c.getStatus()), even, regular));
            table.addCell(indexCell(String.valueOf(c.getAttachments().size()), even, regular));
        }
        doc.add(table);
    }

    private void addComplaintDetail(Document doc, Complaint c, int num,
                                     PdfDocument pdfDoc,
                                     Map<Long, Integer> attPageMap,
                                     PdfFont regular, PdfFont bold) {
        // Complaint header
        doc.add(new Paragraph("COMPLAINT " + num)
            .setFont(bold).setFontSize(10)
            .setFontColor(MID_GREY)
            .setMarginBottom(4));

        doc.add(new Paragraph(c.getTitle())
            .setFont(bold).setFontSize(16)
            .setFontColor(DARK)
            .setMarginBottom(4));

        // Status / escalation ribbon
        Table ribbon = new Table(UnitValue.createPercentArray(new float[]{1,1,1,1}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginBottom(16);

        ribbonCell(ribbon, "Category", c.getCategory().getLabel(), bold, regular);
        ribbonCell(ribbon, "Status", statusText(c.getStatus()), bold, regular);
        ribbonCell(ribbon, "Escalation", c.getEscalationLevel().name().replace("_", " "), bold, regular);
        ribbonCell(ribbon, "Raised On", c.getCreatedAt().format(FMT), bold, regular);
        doc.add(ribbon);

        // Raised by / location
        doc.add(new Paragraph("Raised by: " + c.getRaisedBy().getFirstName() + " "
            + c.getRaisedBy().getLastName()
            + " (" + c.getRaisedBy().getRole().name().replace("_"," ") + ")"
            + (c.getFlatNumber() != null ? " — Flat " +
               (c.getBlock() != null ? c.getBlock() + "-" : "") + c.getFlatNumber() : ""))
            .setFont(regular).setFontSize(10).setFontColor(MID_GREY).setMarginBottom(12));

        // Description
        doc.add(new Paragraph("Description")
            .setFont(bold).setFontSize(11).setFontColor(BRAND_BLUE).setMarginBottom(6));
        doc.add(new Paragraph(c.getDescription())
            .setFont(regular).setFontSize(10)
            .setTextAlignment(TextAlignment.JUSTIFIED)
            .setMarginBottom(16));

        // Public comments
        List<com.myaangan.entity.ComplaintComment> publicComments = c.getComments().stream()
            .filter(cm -> !cm.isInternal()).toList();
        if (!publicComments.isEmpty()) {
            doc.add(new Paragraph("Comments")
                .setFont(bold).setFontSize(11).setFontColor(BRAND_BLUE).setMarginBottom(8));
            for (var cm : publicComments) {
                doc.add(new Paragraph(
                    cm.getAuthor().getFirstName() + " " + cm.getAuthor().getLastName()
                    + "  ·  " + cm.getCreatedAt().format(FMT))
                    .setFont(bold).setFontSize(9).setFontColor(MID_GREY).setMarginBottom(2));
                doc.add(new Paragraph(cm.getText())
                    .setFont(regular).setFontSize(10).setMarginBottom(10));
            }
        }

        // Resolution note
        if (c.getResolutionNote() != null) {
            doc.add(new Paragraph("Resolution")
                .setFont(bold).setFontSize(11).setFontColor(new DeviceRgb(22, 101, 52))
                .setMarginBottom(6));
            doc.add(new Paragraph(c.getResolutionNote())
                .setFont(regular).setFontSize(10).setMarginBottom(16));
        }

        // Attachments section
        if (!c.getAttachments().isEmpty()) {
            doc.add(new Paragraph("Attachments (" + c.getAttachments().size() + ")")
                .setFont(bold).setFontSize(11).setFontColor(BRAND_BLUE).setMarginBottom(10));

            List<ComplaintAttachment> images = c.getAttachments().stream()
                .filter(a -> a.getType() == AttachmentType.IMAGE).toList();
            List<ComplaintAttachment> others = c.getAttachments().stream()
                .filter(a -> a.getType() != AttachmentType.IMAGE).toList();

            // Embed images inline
            for (ComplaintAttachment att : images) {
                Path imgPath = Paths.get(uploadDir, att.getFilename());
                if (Files.exists(imgPath)) {
                    try {
                        int pageNum = pdfDoc.getNumberOfPages();
                        Image img = new Image(ImageDataFactory.create(imgPath.toString()));
                        img.setMaxWidth(UnitValue.createPercentValue(90));
                        img.setHorizontalAlignment(HorizontalAlignment.CENTER);
                        doc.add(new Paragraph(att.getOriginalName())
                            .setFont(regular).setFontSize(9).setFontColor(MID_GREY)
                            .setMarginBottom(4));
                        doc.add(img);
                        doc.add(new Paragraph(" ").setMarginBottom(10));
                        attPageMap.put(att.getId(), pageNum);
                    } catch (Exception e) {
                        log.warn("Could not embed image {}: {}", att.getFilename(), e.getMessage());
                        addAttachmentListItem(doc, att, regular);
                    }
                } else {
                    addAttachmentListItem(doc, att, regular);
                }
            }

            // List non-image attachments
            if (!others.isEmpty()) {
                for (ComplaintAttachment att : others) {
                    addAttachmentListItem(doc, att, regular);
                }
            }
        }
    }

    private void addAttachmentListItem(Document doc, ComplaintAttachment att, PdfFont regular) {
        String icon = switch (att.getType()) {
            case PDF -> "📄";
            case VIDEO -> "🎥";
            case DOCUMENT -> "📎";
            default -> "📁";
        };
        doc.add(new Paragraph(icon + "  " + att.getOriginalName()
            + "  (" + formatSize(att.getFileSize()) + ")")
            .setFont(regular).setFontSize(10).setFontColor(MID_GREY).setMarginBottom(6));
    }

    // ── Layout helpers ────────────────────────────────────────────────────────
    private void addStatCell(Table t, String value, String label, PdfFont bold, PdfFont regular) {
        t.addCell(new Cell()
            .add(new Paragraph(value).setFont(bold).setFontSize(14)
                .setFontColor(BRAND_BLUE).setTextAlignment(TextAlignment.CENTER).setMarginBottom(4))
            .add(new Paragraph(label).setFont(regular).setFontSize(10)
                .setFontColor(MID_GREY).setTextAlignment(TextAlignment.CENTER))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
            .setPadding(12));
    }

    private Cell indexCell(String text, boolean even, PdfFont regular) {
        return new Cell().add(new Paragraph(text).setFont(regular).setFontSize(9))
            .setBackgroundColor(even ? ColorConstants.WHITE : LIGHT_GREY)
            .setPadding(8);
    }

    private void ribbonCell(Table t, String label, String value, PdfFont bold, PdfFont regular) {
        t.addCell(new Cell()
            .add(new Paragraph(label).setFont(regular).setFontSize(8).setFontColor(MID_GREY).setMarginBottom(2))
            .add(new Paragraph(value).setFont(bold).setFontSize(10).setFontColor(DARK))
            .setBackgroundColor(LIGHT_GREY).setPaddingLeft(10).setPaddingRight(10)
            .setPaddingTop(8).setPaddingBottom(8)
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
    }

    private List<Complaint> fetchComplaints(PdfReportRequest req) {
        List<Complaint> all = complaintRepo.findAll(Sort.by(Sort.Direction.ASC, "createdAt"));
        if (req.getIncludeStatuses() != null && !req.getIncludeStatuses().isEmpty()) {
            return all.stream()
                .filter(c -> req.getIncludeStatuses().contains(c.getStatus()))
                .toList();
        }
        // Default: exclude closed if not explicitly requested
        return all.stream()
            .filter(c -> req.isIncludeClosed() || c.getStatus() != ComplaintStatus.CLOSED)
            .filter(c -> req.isIncludeResolved() || c.getStatus() != ComplaintStatus.RESOLVED)
            .toList();
    }

    private String statusText(ComplaintStatus s) {
        return switch (s) {
            case OPEN         -> "Open";
            case ACKNOWLEDGED -> "Acknowledged";
            case IN_PROGRESS  -> "In Progress";
            case RESOLVED     -> "Resolved";
            case CLOSED       -> "Closed";
            case REJECTED     -> "Rejected";
        };
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }

    private String formatSize(Long bytes) {
        if (bytes == null) return "?";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return String.format("%.1f MB", bytes / (1024.0 * 1024));
    }

    // ── Page number footer handler ────────────────────────────────────────────
    private static class PageNumberHandler implements IEventHandler {
        private int pageCount = 0;

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent e = (PdfDocumentEvent) event;
            PdfPage page = e.getPage();
            pageCount++;
            PdfCanvas canvas = new PdfCanvas(page);
            Rectangle rect = page.getPageSize();
            try {
                PdfFont font = PdfFontFactory.createFont("Helvetica");
                canvas.beginText()
                    .setFontAndSize(font, 9)
                    .moveText(rect.getWidth() / 2 - 40, 30)
                    .showText("Page " + pageCount)
                    .endText();
            } catch (Exception ex) {
                // ignore font error in event handler
            }
            canvas.release();
        }
    }
}
