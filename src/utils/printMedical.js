import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export const handlePrintMedical = async (order) => {
  // 1. Soo aqri xogta bukaanka haddii uu leeyahay patientId
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

  // 2. Diyaarinta xogta la daabacayo
  const patientName = patientData.fullName || order.patientName || order.fullName || "N/A";
  const patientAge = patientData.age || order.age || "N/A";
  const patientGender = patientData.gender || order.gender || "N/A";
  const patientAddress = patientData.address || order.address || "N/A";

  const branchName = order.branchName || "HORSEED EYE & E.N.T";
  const branchLocation = order.branchLocation || "Banaadir wadada digfeer";
  const branchPhone = order.branchPhone || "615994202";
  const branchEmail = order.branchEmail || "Daahirx81@gmail.com";

  const currentDate = new Date().toLocaleDateString('en-GB');

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlContent = `
    <html>
      <head>
        <title>Medical - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: #000; } /* Midabka guud waa Madow */
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            background: white; 
          }
          
          .header { 
            display: flex; align-items: center; justify-content: space-between; 
            border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; 
          }
          .logo-box img { height: 75px; width: auto; }
          .header-info { text-align: right; }
          .brand-main { font-size: 24px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
          .contact-text { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.4; }
          
          .doc-type { 
            text-align: center; margin-top: 10px; font-size: 22px; 
            font-weight: 900; text-decoration: underline; font-style: italic; color: #1e3a8a;
          }

          .info-table { width: 100%; margin: 20px 0; font-size: 14px; border-collapse: collapse; }
          .info-table td { padding: 10px 0; border-bottom: 1.5px dashed #cbd5e1; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; width: 100px; display: inline-block; }
          .value { font-weight: 900; color: #000; font-size: 18px; }

          .med-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .med-table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 13px; font-weight: 900; border: 2px solid #000; color: #1e3a8a; }
          .med-table td { padding: 12px; border: 2px solid #000; font-size: 16px; font-weight: 700; }
          
          .policy { margin-top: 30px; text-align: center; font-size: 14px; font-weight: 900; border: 2px solid #000; padding: 10px; border-radius: 6px; }
          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; }
          .sig { border-top: 2px solid #000; width: 42%; text-align: center; padding-top: 8px; font-size: 13px; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <img src="/logo.png" alt="Logo">
          </div>
          <div class="header-info">
            <h1 class="brand-main">${branchName}</h1>
            <div class="contact-text">
              Tel: ${branchPhone} | Somalia <br>
              ${branchEmail} <br>
              ${branchLocation}
            </div>
          </div>
        </div>
        
        <p class="doc-type">Medical Prescription</p>

        <table class="info-table">
          <tr>
            <td><span class="label">Patient:</span> <span class="value">${patientName}</span></td>
            <td><span class="label">Date:</span> <span class="value">${currentDate}</span></td>
          </tr>
          <tr>
            <td><span class="label">Age/Sex:</span> <span class="value">${patientAge} Yrs / ${patientGender}</span></td>
            <td><span class="label">Location:</span> <span class="value">${patientAddress}</span></td>
          </tr>
        </table>

        <table class="med-table">
          <thead>
            <tr><th width="50%">Medicine Name</th><th width="12%">Qty</th><th>Dosage / Instructions</th></tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td style="font-size: 18px; font-weight: 900;">${item.medicineName}</td>
                <td style="text-align: center; font-size: 18px;">x${item.quantity}</td>
                <td><b style="font-size: 17px;">${item.dosage}</b> ${item.notes ? `<br><span style="font-size: 14px; font-weight: 400;">${item.notes}</span>` : ''}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No medicines recorded</td></tr>'}
          </tbody>
        </table>

        <div class="policy">Fadlan: Soo laabashadu waa (7) maalmood gudahood oo kaliya.</div>

        <div class="footer">
          <div class="sig">Doctor Signature</div>
          <div class="sig">Pharmacist/Stamp</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 600);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};