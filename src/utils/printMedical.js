export const handlePrintMedical = (order) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const p = order.patientInfo || {};
  const patientName = p.name || p.fullName || order.fullName || order.name || "N/A";
  const patientAge = p.age || order.age || "N/A";
  const patientGender = p.gender || p.sex || order.gender || order.sex || "N/A";
  const patientPhone = p.phone || order.phone || "N/A";
  const patientAddress = p.address || order.address || "N/A";

  const currentDate = new Date().toLocaleDateString('en-GB');

  const htmlContent = `
    <html>
      <head>
        <title>Medical - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #000; background: white; }
          
          /* HEADER - BLACK DESIGN */
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
          .logo-box { display: flex; align-items: center; gap: 15px; }
          .logo-img { height: 60px; width: auto; }
          .brand h1 { color: #000; font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0; }
          
          /* PATIENT INFO */
          .patient-card { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 12px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #000; margin-bottom: 30px; }
          .info-item span { display: block; font-size: 9px; font-weight: 800; color: #555; text-transform: uppercase; }
          .info-item p { font-size: 13px; font-weight: 700; color: #000; margin-top: 2px; }
          
          /* TABLE - BLACK BORDERS */
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #000; font-weight: 800; border: 1px solid #000; }
          td { padding: 15px; border: 1px solid #000; font-size: 14px; color: #000; }
          
          /* POLICY - BLACK TEXT */
          .policy { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 11px; 
            font-weight: 800; 
            color: #000; 
            background: #fff; 
            padding: 10px; 
            border-radius: 8px; 
            border: 1px solid #000; 
          }
          
          .footer { margin-top: 60px; display: flex; justify-content: space-between; }
          .sig { border-top: 2px solid #000; width: 180px; text-align: center; padding-top: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <img src="/logo.png" class="logo-img" onerror="this.style.display='none'" />
            <div class="brand"><h1>HORSED EYE & ENT</h1><p style="font-size:9px; font-weight:700; color:#000;">Specialized Medical Clinic</p></div>
          </div>
          <div style="text-align: right; font-size: 11px; font-weight: 700;">
            <p>Date: ${currentDate}</p>
            <p>Phone: 615994202</p>
          </div>
        </div>

        <div class="patient-card">
          <div class="info-item"><span>Patient Name</span><p>${patientName}</p></div>
          <div class="info-item"><span>Age</span><p>${patientAge} Yrs</p></div>
          <div class="info-item"><span>Gender</span><p>${patientGender}</p></div>
          <div class="info-item"><span>District</span><p>${patientAddress}</p></div>
        </div>

        <table>
          <thead>
            <tr><th width="40%">Medicine</th><th width="10%">Qty</th><th>Instructions / Dosage</th></tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td style="font-weight:800;">${item.medicineName}</td>
                <td style="font-weight:800;">x${item.quantity}</td>
                <td><b>${item.dosage}</b><br><small style="color:#555; font-style:italic;">${item.notes || ''}</small></td>
              </tr>
            `).join('') || '<tr><td colspan="3">No records</td></tr>'}
          </tbody>
        </table>

        <div class="policy">Fadlan: Soo laabashadu waa (7) maalmood gudahood oo kaliya.</div>

        <div class="footer">
          <div class="sig">Doctor Signature</div>
          <div class="sig">Pharmacist Signature</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};