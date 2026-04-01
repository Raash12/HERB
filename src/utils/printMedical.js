import { db } from "../firebase"; // Hubi in jidkani sax yahay
import { doc, getDoc } from "firebase/firestore";

export const handlePrintMedical = async (order) => {
  // 1. Marka hore soo qaad xogta bukaanka ee collection-ka "patients"
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

  // 2. Diyaarinta xogta la daabacayo (Haddii la waayo collection-ka, u isticmaal wixii order-ka ku jiray)
  const patientName = patientData.fullName || order.patientName || "N/A";
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
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            color: #1e3a8a; background: white; 
          }
          .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
          .brand-name { font-size: 36px; font-weight: 900; text-transform: uppercase; }
          .sub-brand { font-size: 26px; font-weight: 800; margin-top: -5px; }
          .contact-info { font-size: 13px; font-weight: 700; margin-top: 8px; line-height: 1.4; }
          .doc-type { margin-top: 15px; font-size: 20px; font-weight: 900; text-decoration: underline; font-style: italic; }
          
          .info-table { width: 100%; margin-bottom: 20px; font-size: 14px; border-collapse: collapse; }
          .info-table td { padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; width: 95px; display: inline-block; }
          .value { font-weight: 900; color: #000; font-size: 16px; text-transform: uppercase; }

          table.med-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table.med-table th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; font-weight: 900; border: 2px solid #1e3a8a; }
          table.med-table td { padding: 12px; border: 2px solid #1e3a8a; font-size: 15px; color: #000; font-weight: 700; }
          
          .policy { margin-top: 25px; text-align: center; font-size: 12px; font-weight: 900; border: 2px solid #1e3a8a; padding: 8px; background: #f8fafc; }
          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; }
          .sig { border-top: 2px solid #000; width: 45%; text-align: center; padding-top: 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="brand-name">${branchName.split(' ')[0]}</h1>
          <h2 class="sub-brand">${branchName.split(' ').slice(1).join(' ')}</h2>
          <div class="contact-info">
            TEL: ${branchPhone} ${branchLocation.split(' ')[0]} – SOMALIA <br>
            EMAIL: ${branchEmail} <br>
            ${branchLocation.toUpperCase()}
          </div>
          <p class="doc-type">MEDICAL PRESCRIPTION</p>
        </div>

        <table class="info-table">
          <tr>
            <td><span class="label">PATIENT:</span> <span class="value">${patientName}</span></td>
            <td><span class="label">DATE:</span> <span class="value">${currentDate}</span></td>
          </tr>
          <tr>
            <td><span class="label">AGE/SEX:</span> <span class="value">${patientAge} YRS / ${patientGender}</span></td>
            <td><span class="label">DISTRICT:</span> <span class="value">${patientAddress}</span></td>
          </tr>
        </table>

        <table class="med-table">
          <thead>
            <tr><th width="50%">MEDICINE NAME</th><th width="10%">QTY</th><th>DOSAGE / INSTRUCTIONS</th></tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td style="font-size:18px; font-weight:900;">${item.medicineName.toUpperCase()}</td>
                <td style="text-align:center; font-size:18px;">${item.quantity}</td>
                <td style="font-size:16px; font-weight:800;">${item.dosage.toUpperCase()}</td>
              </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center;">NO MEDICINES RECORDED</td></tr>'}
          </tbody>
        </table>

        <div class="policy">FADLAN: SOO LAABASHADU WAA (7) MAALMOOD GUDAHIID OO KALIYA.</div>

        <div class="footer">
          <div class="sig">DOCTOR SIGNATURE</div>
          <div class="sig">PHARMACIST / STAMP</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};