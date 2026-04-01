import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  // 1. Soo aqri xogta bukaanka
  let patientData = {};
  if (order.patientId) {
    try {
      const patientRef = doc(db, "patients", order.patientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        patientData = patientSnap.data();
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  }

  const patientName = patientData.fullName || order.patientName || "N/A";
  const patientAge = patientData.age || order.age || "N/A";
  const patientGender = patientData.gender || order.gender || "N/A";
  const patientAddress = patientData.address || order.address || "N/A";

  const branchName = order.branchName || "HORSEED OPTICAL";
  const branchLocation = order.branchLocation || "Banaadir wadada digfeer";
  const branchPhone = order.branchPhone || "615994202";
  const branchEmail = order.branchEmail || "Daahirx81@gmail.com";
  
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Optical Prescription - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800;900&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: #000; }
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            background: white; 
          }

          .header { 
            display: flex; align-items: center; justify-content: space-between; 
            border-bottom: 4px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; 
          }
          .logo-box img { height: 85px; width: auto; }
          .header-info { text-align: right; }
          .brand-title { font-size: 28px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
          .contact-info { font-size: 13px; font-weight: 700; color: #334155; }

          .doc-type { 
            text-align: center; margin-top: 15px; font-size: 24px; font-weight: 900; 
            text-decoration: underline; font-style: italic; text-transform: uppercase; color: #1e3a8a;
          }

          .info-table { width: 100%; margin-bottom: 25px; font-size: 15px; border-collapse: collapse; }
          .info-table td { padding: 12px 0; border-bottom: 2px dashed #cbd5e1; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; width: 105px; display: inline-block; }
          .value { font-weight: 900; color: #000; font-size: 19px; text-transform: uppercase; }

          .vision-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .vision-table th { background: #f1f5f9; padding: 12px; text-align: center; font-size: 14px; font-weight: 900; border: 2.5px solid #000; color: #1e3a8a; }
          .vision-table td { padding: 18px; border: 2.5px solid #000; text-align: center; font-size: 28px; color: #000; font-weight: 900; }
          .eye-side { text-align: left !important; background: #f8fafc; font-size: 14px !important; color: #1e3a8a !important; padding-left: 15px !important; }

          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { border-top: 2.5px solid #000; width: 42%; text-align: center; padding-top: 10px; font-size: 14px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <img src="/logo.png" alt="Logo">
          </div>
          <div class="header-info">
            <h1 class="brand-title">${branchName}</h1>
            <div class="contact-info">
              TEL: ${branchPhone} <br>
              EMAIL: ${branchEmail.toUpperCase()} <br>
              ${branchLocation.toUpperCase()}
            </div>
          </div>
        </div>

        <p class="doc-type">Optical Prescription</p>

        <table class="info-table">
          <tr>
            <td><span class="label">Patient:</span> <span class="value">${patientName}</span></td>
            <td><span class="label">Date:</span> <span class="value">${dateStr}</span></td>
          </tr>
          <tr>
            <td><span class="label">Age/Sex:</span> <span class="value">${patientAge} YRS / ${patientGender}</span></td>
            <td><span class="label">District:</span> <span class="value">${patientAddress}</span></td>
          </tr>
        </table>

        <table class="vision-table">
          <thead>
            <tr><th width="35%">EYE SEGMENT</th><th>SPH</th><th>CYL</th><th>AXIS</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="eye-side">RIGHT EYE (OD)</td>
              <td>${order.values?.RE?.sph || '0.00'}</td>
              <td>${order.values?.RE?.cyl || '0.00'}</td>
              <td>${order.values?.RE?.axis || '0'}°</td>
            </tr>
            <tr>
              <td class="eye-side">LEFT EYE (OS)</td>
              <td>${order.values?.LE?.sph || '0.00'}</td>
              <td>${order.values?.LE?.cyl || '0.00'}</td>
              <td>${order.values?.LE?.axis || '0'}°</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 30px; border: 2.5px solid #000; padding: 15px; border-radius: 8px;">
          <p style="font-weight: 900; color: #1e3a8a; text-decoration: underline; font-size: 15px;">Notes / Addition:</p>
          <p style="margin-top: 8px; font-weight: 800; color: #000; font-size: 18px;">${order.notes || 'No extra notes provided.'}</p>
        </div>

        <div class="footer">
          <div class="sig-box">Optometrist Signature</div>
          <div style="text-align: right;">
            <p style="font-weight:900; color:#1e3a8a; font-size: 24px; margin:0;">${branchName}</p>
            <p style="font-size: 11px; color:#64748b; font-weight:700;">Professional Eye Care Services</p>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};