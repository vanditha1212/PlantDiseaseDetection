import { jsPDF } from 'jspdf';
import type { DiseaseReport } from '../types/index.ts';

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadReportPdf(report: DiseaseReport): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const maxTextWidth = pageWidth - margin * 2;
  let y = 48;

  const ensureSpace = (needed = 40) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  // Header bar
  doc.setFillColor(27, 107, 58);
  doc.rect(0, 0, pageWidth, 68, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AgriCare AI — Plant Disease Analysis Report', margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `Report #${report.id}  |  Generated: ${new Date(report.createdAt).toLocaleString()}`,
    margin,
    54
  );

  y = 92;
  doc.setTextColor(19, 42, 30);

  // Add plant photo if available
  const imgData = await loadImageAsDataUrl(report.imagePath);
  if (imgData) {
    try {
      const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imgData, format, margin, y, 160, 120);
      const infoX = margin + 178;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(report.detectedDisease || 'Plant Inspection', infoX, y + 18, {
        maxWidth: pageWidth - infoX - margin,
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Crop: ${report.cropName}`, infoX, y + 42);
      if (report.scientificName) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Scientific Name: ${report.scientificName}`, infoX, y + 60);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(`Severity: ${report.severity}`, infoX, y + 78);
      doc.text(`AI Confidence: ${report.confidenceEstimate}%`, infoX, y + 96);
      if (report.locationDistrict) {
        doc.text(`Location: ${report.locationDistrict}`, infoX, y + 114);
      }
      y += 144;
    } catch {
      y += 10;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(`${report.cropName} — ${report.detectedDisease}`, margin, y);
    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(
      `Severity: ${report.severity}   |   Confidence: ${report.confidenceEstimate}%`,
      margin,
      y
    );
    y += 24;
  }

  const addSection = (title: string, items: string[] | string | undefined) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return;
    ensureSpace(54);
    doc.setDrawColor(220, 231, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(27, 107, 58);
    doc.text(title, margin, y);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 45, 36);

    const linesToRender = Array.isArray(items) ? items.map((i) => `• ${i}`) : [items];
    for (const entry of linesToRender) {
      const wrapped = doc.splitTextToSize(entry, maxTextWidth) as string[];
      ensureSpace(wrapped.length * 14 + 6);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 14 + 5;
    }
    y += 6;
  };

  addSection('Symptoms Detected', report.symptoms);
  addSection('Possible Causes', report.possibleCauses);
  addSection('How the Disease Spreads', report.diseaseSpread);
  addSection('A. Immediate Actions', report.treatment?.immediateActions);
  addSection('B. Recommended Treatment', report.treatment?.recommendedTreatment);
  addSection('C. Preventive Measures', report.treatment?.preventiveMeasures);
  addSection('D. Recovery Instructions', report.treatment?.recoveryInstructions);
  addSection('Organic & Biological Options', report.treatment?.organicOptions);
  addSection('Safe Chemical Guidance', report.treatment?.chemicalGuidance);
  addSection('Irrigation Recommendations', report.treatment?.irrigationRecommendations);
  addSection('Soil & Crop Management', report.treatment?.soilCropManagement);

  // Disclaimer footer box
  ensureSpace(64);
  doc.setFillColor(246, 250, 246);
  doc.rect(margin, y, maxTextWidth, 50, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(150, 88, 12);
  doc.text('IMPORTANT NOTICE:', margin + 10, y + 16);
  doc.setFont('helvetica', 'normal');
  const disclaimer =
    report.treatment?.expertDisclaimer ||
    'AI plant disease results are preliminary and should be verified by a local agricultural extension officer or Krishi Vigyan Kendra (KVK) before applying chemical treatments.';
  const wrappedDisclaimer = doc.splitTextToSize(disclaimer, maxTextWidth - 20) as string[];
  doc.text(wrappedDisclaimer, margin + 10, y + 30);

  doc.save(`AgriCare-AI-Report-${report.id}.pdf`);
}
