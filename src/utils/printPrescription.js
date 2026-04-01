export const handlePrintPrescription = (order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // 1. SAXIDDA XOGTA BUKAANKA
  const p = order.patientInfo || order || {};
  const patientName = p.fullName || p.name || order.name || 'N/A';
  const patientAge = p.age || order.age || 'N/A';
  const patientGender = p.gender || p.sex || order.gender || 'N/A';
  const patientPhone = p.phone || order.phone || 'N/A';
  const patientAddress = p.address || order.address || 'N/A';

  const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();

  const html = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 50px; color: #1e293b; }
          .header { display: flex; align-items: center; justify-content: center; gap: 20px; border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 35px; text-align: center; }
          .logo-main { height: 75px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 25px; border-radius: 15px; border: 1px solid #e2e8f0; margin-bottom: 35px; }
          .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 3px; display: block; }
          .value { font-weight: 700; font-size: 15px; color: #0f172a; text-transform: capitalize; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #2563eb; color: white; padding: 15px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          td { border: 1px solid #e2e8f0; padding: 20px; text-align: center; font-weight: 800; font-size: 22px; color: #1e293b; }
          .eye-title { text-align: left; background: #f1f5f9; font-size: 12px; padding-left: 20px; color: #2563eb; }
          .footer { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { border-top: 2px solid #1e293b; width: 220px; text-align: center; padding-top: 10px; font-weight: 800; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" class="logo-main" onerror="this.style.display='none'" />
          <div style="text-align: left;">
            <h1 style="color:#2563eb; margin:0; font-size:30px; font-weight:800;">HORSED OPTICAL</h1>
            <p style="margin:0; font-weight:700; color:#64748b;">Professional Lens Prescription</p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <span class="label">Patient Name</span><span class="value">${patientName}</span>
            <div style="margin-top:15px;">
              <span class="label">Address</span><span class="value">${patientAddress}</span>
            </div>
          </div>
          <div>
            <span class="label">Age / Gender</span><span class="value">${patientAge} Yrs / ${patientGender}</span>
            <div style="margin-top:15px;">
              <span class="label">Exam Date</span><span class="value">${dateStr}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th width="30%">Eye Segment</th><th>SPH</th><th>CYL</th><th>AXIS</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="eye-title">RIGHT EYE (OD)</td>
              <td>${order.values?.RE?.sph || '0.00'}</td>
              <td>${order.values?.RE?.cyl || '0.00'}</td>
              <td>${order.values?.RE?.axis || '0'}°</td>
            </tr>
            <tr>
              <td class="eye-title">LEFT EYE (OS)</td>
              <td>${order.values?.LE?.sph || '0.00'}</td>
              <td>${order.values?.LE?.cyl || '0.00'}</td>
              <td>${order.values?.LE?.axis || '0'}°</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div class="sig-box">Doctor Signature & Stamp</div>
          <div style="text-align: right;">
            <p style="font-weight:900; color:#2563eb; font-size: 20px; margin:0;">HORSED CLINIC</p>
            <p style="font-size: 10px; color:#94a3b8;">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};