export const handlePrintPrescription = async (order) => {
  const supportEmail = "Daahirx81@gmail.com";

  let branchInfo = {
    name: order.branchName || "HORSEED OPTICAL",
    location: order.branchLocation || "Banaadir wadada digfeer",
    phone: order.branchPhone || "615994202",
    email: supportEmail
  };

  // ... (Dynamic Fetching Logic remains the same)

  const activeOptions = order.options 
    ? Object.keys(order.options)
        .filter(key => order.options[key] === true)
        .map(key => key.replace(/([A-Z])/g, ' $1').trim())
        .join(", ")
    : "None";

  const patientName = order.patientName || "N/A";
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert("Please allow pop-ups");

  const html = `
    <html>
      <head>
        <title>Prescription - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            color: #1e293b; /* Dark Slate for softer look than pure black */
          }

          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 15px; }
          .brand-title { font-size: 24px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
          
          .doc-type { 
            text-align: center; font-size: 18px; font-weight: 700; color: #1e3a8a; 
            text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px;
          }
          
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          
          /* Labels: Light and Clean */
          .label { font-weight: 500; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          /* Values: Medium weight, not super bold */
          .value { font-weight: 600; font-size: 15px; color: #0f172a; margin-left: 5px; }

          .vision-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0; }
          .vision-table th { background: #f8fafc; padding: 10px; font-weight: 700; font-size: 11px; color: #1e3a8a; text-transform: uppercase; border: 1px solid #e2e8f0; }
          
          /* Numbers in RE/LE: Clean and readable medium weight */
          .vision-table td { padding: 15px; border: 1px solid #e2e8f0; text-align: center; font-size: 20px; font-weight: 500; color: #0f172a; }
          
          .eye-side { text-align: left !important; font-size: 12px !important; font-weight: 700 !important; color: #64748b !important; padding-left: 12px !important; }

          .section-title { font-weight: 700; color: #1e3a8a; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; display: block; }
          
          .data-box { 
            margin-top: 15px; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #ffffff;
          }
          
          .data-text { font-weight: 500; font-size: 14px; color: #334155; line-height: 1.5; }

          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig { border-top: 1px solid #94a3b8; width: 40%; text-align: center; padding-top: 8px; font-weight: 500; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" style="height: 60px; filter: grayscale(10%)">
          <div style="text-align: right">
            <h1 class="brand-title">${branchInfo.name}</h1>
            <p style="font-size: 10px; font-weight: 500; color: #64748b; line-height: 1.4;">
              TEL: ${branchInfo.phone} <br>
              ${branchInfo.email.toLowerCase()} <br>
              ${branchInfo.location}
            </p>
          </div>
        </div>

        <p class="doc-type">Optical Prescription</p>

        <table class="info-table">
          <tr>
            <td><span class="label">Patient</span><br><span class="value">${patientName}</span></td>
            <td><span class="label">Date</span><br><span class="value">${dateStr}</span></td>
          </tr>
          <tr>
            <td><span class="label">Doctor</span><br><span class="value">${order.doctorName || 'N/A'}</span></td>
            <td><span class="label">Status</span><br><span class="value" style="color: #059669;">${order.status.toUpperCase()}</span></td>
          </tr>
        </table>

        <table class="vision-table">
          <thead>
            <tr><th width="35%">Eye Segment</th><th>SPH</th><th>CYL</th><th>AXIS</th></tr>
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

        <div class="data-box">
          <span class="section-title">Lens Options & Type</span>
          <p class="data-text" style="color: #1e3a8a; font-weight: 600;">
            ${activeOptions}
          </p>
        </div>

        <div class="data-box" style="margin-top: 10px;">
          <span class="section-title">Clinical Notes</span>
          <p class="data-text">${order.notes || 'No extra clinical notes provided.'}</p>
        </div>

        <div class="footer">
          <div class="sig">Optometrist Signature</div>
          <div style="text-align: right">
            <p style="font-weight: 800; color: #1e3a8a; font-size: 18px; margin-bottom: 2px;">${branchInfo.name}</p>
            <p style="font-size: 9px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Professional Eye Care</p>
          </div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};