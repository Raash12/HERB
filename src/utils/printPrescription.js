// src/utils/printPrescription.js
export const handlePrintPrescription = (order) => {
  const printWindow = window.open('', '_blank');
  const p = order.patientInfo || {};
  const dateStr = order.createdAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString();

  printWindow.document.write(`
    <html>
      <head>
        <title>HORSED PRINT - ${p.fullName || 'Report'}</title>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .header { text-align: center; border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; font-size: 32px; text-transform: uppercase; letter-spacing: 2px; }
          .header p { margin: 5px 0; font-weight: 600; color: #64748b; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; background: #f8fafc; padding: 25px; border-radius: 15px; border: 1px solid #e2e8f0; }
          .info-item { margin-bottom: 10px; font-size: 14px; }
          .label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
          .value { font-weight: 700; color: #0f172a; font-size: 15px; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; border-radius: 10px; overflow: hidden; }
          th { background: #2563eb; color: white; padding: 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          td { border: 1px solid #e2e8f0; padding: 20px; text-align: center; font-weight: 800; font-size: 18px; color: #1e293b; }
          .eye-label { color: #2563eb; font-size: 14px; text-align: left; padding-left: 20px; width: 30%; }

          .specs { margin-top: 40px; padding: 25px; border: 2px dashed #cbd5e1; border-radius: 15px; }
          .tag { display: inline-block; background: #eff6ff; color: #2563eb; padding: 8px 15px; border-radius: 10px; margin: 5px; font-size: 12px; font-weight: 800; border: 1px solid #dbeafe; }
          
          .footer { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { border-top: 2px solid #1e293b; width: 250px; text-align: center; padding-top: 10px; font-weight: 800; font-size: 14px; }
          .stamp { color: #2563eb; font-weight: 900; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HORSED WATCH & OPTICAL</h1>
          <p>Professional Eye Testing & Lens Prescription</p>
        </div>

        <div class="info-grid">
          <div>
            <div class="info-item"><span class="label">Patient Name</span><span class="value">${p.fullName || 'N/A'}</span></div>
            <div class="info-item"><span class="label">Phone / Contact</span><span class="value">${p.phone || 'N/A'}</span></div>
            <div class="info-item"><span class="label">District</span><span class="value">${p.address || 'N/A'}</span></div>
          </div>
          <div>
            <div class="info-item"><span class="label">Age / Gender</span><span class="value">${p.age || 'N/A'} Yrs / ${p.gender || 'N/A'}</span></div>
            <div class="info-item"><span class="label">Doctor Name</span><span class="value">Dr. ${order.doctorName || 'Specialist'}</span></div>
            <div class="info-item"><span class="label">Exam Date</span><span class="value">${dateStr}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Eye Segment</th><th>Sphere (SPH)</th><th>Cylinder (CYL)</th><th>Axis</th></tr>
          </thead>
          <tbody>
            <tr><td class="eye-label">RIGHT EYE (OD)</td><td>${order.values?.RE?.sph || '0.00'}</td><td>${order.values?.RE?.cyl || '0.00'}</td><td>${order.values?.RE?.axis || '0'}°</td></tr>
            <tr><td class="eye-label">LEFT EYE (OS)</td><td>${order.values?.LE?.sph || '0.00'}</td><td>${order.values?.LE?.cyl || '0.00'}</td><td>${order.values?.LE?.axis || '0'}°</td></tr>
          </tbody>
        </table>

        <div class="specs">
          <p style="font-size: 13px; font-weight: 900; margin-bottom: 15px; color: #1e293b; text-transform: uppercase;">Lens Specifications & Options:</p>
          ${Object.entries(order.options || {}).filter(([_,v]) => v).map(([k]) => `<span class="tag">${k.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>`).join('')}
        </div>

        <div class="footer">
          <div class="sig-box">Doctor Signature & Stamp</div>
          <div class="stamp">
            <p style="margin:0; font-size: 16px;">HORSED OPTICAL</p>
            <p style="margin:0; font-size: 10px; color: #94a3b8; font-weight: normal;">System Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};