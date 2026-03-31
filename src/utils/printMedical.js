export const handlePrintMedical = (order) => {
  const printWindow = window.open("", "_blank");
  
  // Format the date
  const date = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString() 
    : new Date().toLocaleDateString();

  const htmlContent = `
    <html>
      <head>
        <title>Medical Prescription - ${order.patientInfo?.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .hospital-name { color: #2563eb; font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; font-size: 14px; }
          .info-item { margin-bottom: 5px; }
          .label { font-weight: 800; text-transform: uppercase; font-size: 10px; color: #666; display: block; }
          .value { font-weight: 700; font-size: 15px; }
          
          .rx-symbol { font-size: 40px; font-weight: 900; color: #2563eb; margin-bottom: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
          th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          td { padding: 15px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 700; }
          .qty { color: #2563eb; }
          .notes { font-weight: 400; color: #64748b; font-style: italic; font-size: 12px; display: block; margin-top: 4px; }

          .footer { margin-top: 100px; border-top: 1px solid #e2e8f0; pt: 20px; display: flex; justify-content: space-between; }
          .signature { text-align: center; width: 200px; }
          .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="hospital-name">Medical Center</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: 600;">Prescription Receipt</p>
          </div>
          <div style="text-align: right font-size: 12px;">
            <div class="label">Date Issued</div>
            <div class="value">${date}</div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="label">Patient Name</span>
              <span class="value">${order.patientInfo?.name}</span>
            </div>
            <div class="info-item">
              <span class="label">Age / Gender</span>
              <span class="value">${order.patientInfo?.age || 'N/A'} Yrs</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="info-item">
              <span class="label">Doctor Assigned</span>
              <span class="value">Dr. ${order.doctorName}</span>
            </div>
             <div class="info-item">
              <span class="label">Phone Number</span>
              <span class="value">${order.patientInfo?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="rx-symbol">℞</div>

        <table>
          <thead>
            <tr>
              <th>Medicine Description</th>
              <th style="text-align: center;">Qty</th>
              <th>Dosage / Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.medicineName}</td>
                <td style="text-align: center;" class="qty">x${item.quantity}</td>
                <td>
                  ${item.dosage}
                  <span class="notes">${item.notes || ''}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature">
            <div class="sig-line">Pharmacist Signature</div>
          </div>
          <div class="signature">
            <div class="sig-line">Doctor Signature</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};