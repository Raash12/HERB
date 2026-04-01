import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  // 1. SOO QAADASHADA XOGTA BUKAANKA (Collection: patients)
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

  // 2. DIYAARINTA XOGTA
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            color: #1e3a8a; background: white; 
          }

          /* HEADER DESIGN */
          .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
          .brand-name { font-size: 34px; font-weight: 900; text-transform: uppercase; color: #1e3a8a; }
          .sub-brand { font-size: 24px; font-weight: 800; color: #1e3a8a; margin-top: -5px; }
          .contact-info { font-size: 13px; font-weight: 700; margin-top: 8px; line-height: 1.4; color: #1e3a8a; }
          .doc-type { 
            margin-top: 15px; font-size: 20px; font-weight: 900; 
            text-decoration: underline; font-style: italic; text-transform: uppercase;
          }

          /* PATIENT INFO AREA */
          .info-table { width: 100%; margin-bottom: 20px; font-size: 14px; border-collapse: collapse; }
          .info-table td { padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; width: 95px; display: inline-block; }
          .value { font-weight: 900; color: #000; font-size: 16px; text-transform: uppercase; }

          /* VISION DATA TABLE */
          table.vision-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          table.vision-table th { 
            background: #f1f5f9; padding: 12px; text-align: center; 
            font-size: 13px; font-weight: 900; border: 2px solid #1e3a8a; color: #1e3a8a; 
          }
          table.vision-table td { 
            padding: 15px; border: 2px solid #1e3a8a; text-align: center;
            font-size: 22px; color: #000; font-weight: 900; 
          }
          .eye-side { 
            text-align: left !important; background: #f8fafc; 
            font-size: 13px !important; color: #1e3a8a !important; 
            padding-left: 15px !important;
          }

          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { border-top: 2px solid #000; width: 45%; text-align: center; padding-top: 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
          .clinic-stamp { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="brand-name">${branchName.split(' ')[0]}</h1>
          <h2 class="sub-brand">${branchName.split(' ').slice(1).join(' ')}</h2>
          <div class="contact-info">
            TEL: ${branchPhone} ${branchLocation.split(' ')[0].toUpperCase()} – SOMALIA <br>
            EMAIL: ${branchEmail.toUpperCase()} <br>
            ${branchLocation.toUpperCase()}
          </div>
          <p class="doc-type">Optical Prescription</p>
        </div>

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
            <tr>
              <th width="35%">EYE SEGMENT</th>
              <th>SPH</th>
              <th>CYL</th>
              <th>AXIS</th>
            </tr>
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

        <div style="margin-top: 30px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 13px;">
          <p style="font-weight: 800; color: #1e3a8a; text-decoration: underline;">Notes / Addition:</p>
          <p style="margin-top: 5px; font-weight: 700; color: #444;">${order.notes || 'No extra notes provided.'}</p>
        </div>

        <div class="footer">
          <div class="sig-box">Optometrist Signature</div>
          <div class="clinic-stamp">
            <p style="font-weight:900; color:#1e3a8a; font-size: 22px; margin:0;">${branchName.toUpperCase()}</p>
            <p style="font-size: 10px; color:#64748b; font-weight:700;">Professional Eye Care Services</p>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};