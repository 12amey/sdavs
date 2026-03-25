import { AnalysisResult } from '../types/satellite';
import { StoredAnalysis, dataStorage } from '../services/dataStorage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Export map as image using html2canvas
export const exportMapAsImage = async (mapElementId: string = 'satellite-map'): Promise<void> => {
  try {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    if (!mapElement) {
      alert('Map not found. Please make sure you are on the Satellite Map tab.');
      return;
    }

    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      width: mapElement.offsetWidth,
      height: mapElement.offsetHeight
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `satellite-map-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();

    // Log activity
    const user = dataStorage.getCurrentUser();
    if (user) {
      dataStorage.logActivity(user.id, 'map_exported', 'Exported satellite map as PNG image');
    }

    alert('Map exported successfully!');
  } catch (error) {
    console.error('Error exporting map:', error);
    alert('Error exporting map. Please try again.');
  }
};

// Export comprehensive PDF report
export const exportReportAsPDF = async (
  analysisResults: AnalysisResult[],
  regionName: string
): Promise<void> => {
  try {
    const user = dataStorage.getCurrentUser();
    const userAnalyses = user ? dataStorage.getUserAnalyses(user.id) : [];
    const recentActivities = user ? dataStorage.getUserActivities(user.id).slice(0, 10) : [];
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Satellite Data Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    pdf.text(`Region: ${regionName}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Current Analysis Summary
    if (analysisResults.length > 0) {
      const latest = analysisResults[analysisResults.length - 1];
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Current Analysis Summary', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      const summaryData = [
        `Analysis Date: ${new Date(latest.date).toLocaleDateString()}`,
        `Average NDVI: ${latest.avgNDVI.toFixed(3)}`,
        `Total Forest Cover: ${latest.totalForestCover.toFixed(1)}%`,
        `Healthy Vegetation: ${latest.healthyVegetation.toFixed(1)}%`,
        `Moderate Vegetation: ${latest.moderateVegetation.toFixed(1)}%`,
        `Unhealthy Vegetation: ${latest.unhealthyVegetation.toFixed(1)}%`,
        `Water Bodies: ${latest.waterBodies.toFixed(1)}%`,
        `Urban Areas: ${latest.urbanAreas.toFixed(1)}%`
      ];

      summaryData.forEach(line => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }

    // User Analysis History
    if (userAnalyses.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent Analysis History', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      userAnalyses.slice(0, 10).forEach((analysis, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`${index + 1}. ${analysis.regionName}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`   Date: ${new Date(analysis.timestamp).toLocaleDateString()}`, 30, yPosition);
        yPosition += 6;
        pdf.text(`   NDVI: ${analysis.results.avgNDVI.toFixed(3)} | Forest: ${analysis.results.forestCover.toFixed(1)}%`, 30, yPosition);
        yPosition += 6;
        pdf.text(`   Area: ${analysis.results.areaSize.toFixed(2)} km²`, 30, yPosition);
        yPosition += 10;
      });
    }

    // Recent Activities
    if (recentActivities.length > 0) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recent User Activities', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      recentActivities.forEach((activity, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`${index + 1}. ${activity.details}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`   Time: ${new Date(activity.timestamp).toLocaleString()}`, 30, yPosition);
        yPosition += 10;
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generated by Satellite Data Analysis & Visualization System', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save PDF
    const fileName = `satellite-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    // Log activity
    if (user) {
      dataStorage.logActivity(user.id, 'report_exported', `Exported PDF report: ${fileName}`);
    }

    alert('PDF report generated successfully!');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    alert('Error generating report. Please try again.');
  }
};

// Export data as CSV
export const exportDataAsCSV = (data: AnalysisResult[]): void => {
  try {
    const user = dataStorage.getCurrentUser();
    const userAnalyses = user ? dataStorage.getUserAnalyses(user.id) : [];
    
    if (userAnalyses.length === 0) {
      alert('No analysis data to export. Please perform some analyses first.');
      return;
    }

    // Create CSV content
    const headers = [
      'Date',
      'Region Name',
      'Start Latitude',
      'Start Longitude', 
      'End Latitude',
      'End Longitude',
      'Area Size (km²)',
      'Average NDVI',
      'Forest Cover (%)',
      'Healthy Vegetation (%)',
      'Moderate Vegetation (%)',
      'Unhealthy Vegetation (%)',
      'Water Bodies (%)',
      'Urban Areas (%)',
      'Confidence (%)',
      'Analysis Type'
    ];

    const csvContent = [
      headers.join(','),
      ...userAnalyses.map(analysis => [
        new Date(analysis.timestamp).toLocaleDateString(),
        `"${analysis.regionName}"`,
        analysis.coordinates.startLat.toFixed(6),
        analysis.coordinates.startLng.toFixed(6),
        analysis.coordinates.endLat.toFixed(6),
        analysis.coordinates.endLng.toFixed(6),
        analysis.results.areaSize.toFixed(2),
        analysis.results.avgNDVI.toFixed(3),
        analysis.results.forestCover.toFixed(1),
        analysis.results.landCoverBreakdown.healthy.toFixed(1),
        analysis.results.landCoverBreakdown.moderate.toFixed(1),
        analysis.results.landCoverBreakdown.unhealthy.toFixed(1),
        analysis.results.landCoverBreakdown.water.toFixed(1),
        analysis.results.landCoverBreakdown.urban.toFixed(1),
        analysis.results.confidence.toFixed(1),
        `"${analysis.analysisType}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `satellite-analysis-data-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    // Log activity
    if (user) {
      dataStorage.logActivity(user.id, 'data_exported', `Exported CSV data: ${fileName}`, { recordCount: userAnalyses.length });
    }

    alert(`CSV file exported successfully! (${userAnalyses.length} records)`);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Error exporting data. Please try again.');
  }
};

// Export user activities as CSV
export const exportActivitiesAsCSV = (): void => {
  try {
    const user = dataStorage.getCurrentUser();
    if (!user) {
      alert('Please log in to export activities.');
      return;
    }

    const activities = dataStorage.getUserActivities(user.id);
    
    if (activities.length === 0) {
      alert('No activities to export.');
      return;
    }

    const headers = ['Date', 'Time', 'Action', 'Details'];
    const csvContent = [
      headers.join(','),
      ...activities.map(activity => [
        new Date(activity.timestamp).toLocaleDateString(),
        new Date(activity.timestamp).toLocaleTimeString(),
        activity.action.replace(/_/g, ' ').toUpperCase(),
        `"${activity.details}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `user-activities-${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    dataStorage.logActivity(user.id, 'activities_exported', `Exported activities CSV: ${fileName}`);
    alert(`Activities exported successfully! (${activities.length} records)`);
  } catch (error) {
    console.error('Error exporting activities:', error);
    alert('Error exporting activities. Please try again.');
  }
};