// src/utils/printFunctions.js

export const handlePrintMedical = (order) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const patientGender = order.patientInfo?.gender || order.gender || 'N/A';
  const patientName = order.patientInfo?.name || order.fullName || 'N/A';
  const patientAge = order.patientInfo?.age || order.age || 'N/A';

  const htmlContent = `
    <html>
      <head>
        <title>Medical - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .brand h1 { color: #2563eb; font-size: 24px; font-weight: 800; margin: 0; }
          .patient-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
          .info-item span { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
          .info-item p { font-size: 14px; font-weight: 700; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig { border-top: 2px solid #0f172a; width: 150px; text-align: center; padding-top: 5px; font-size: 10px; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand"><h1>HORSED EYE AND ENT</h1><p>Specialized Medical Services</p></div>
          <div style="text-align: right">
            <p><b>Date:</b> ${currentDate}</p>
          </div>
        </div>
        <div class="patient-card">
          <div class="info-item"><span>Patient Name</span><p>${patientName}</p></div>
          <div class="info-item"><span>Age/Gender</span><p>${patientAge} / ${patientGender}</p></div>
          <div class="info-item"><span>Doctor</span><p>Dr. ${order.doctorName || 'Specialist'}</p></div>
        </div>
        <table>
          <thead><tr><th>Medicine</th><th>Qty</th><th>Instructions</th></tr></thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td><b>${item.medicineName}</b></td>
                <td style="color:#2563eb; font-weight:800">x${item.quantity}</td>
                <td>${item.dosage} ${item.notes ? `<br><small>${item.notes}</small>` : ''}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No medicines</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          <div class="sig">Doctor Signature</div>
          <div class="sig">Pharmacist Signature</div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const handlePrintPrescription = (order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const p = order.patientInfo || order || {};
  const dateStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();

  const htmlContent = `
    <html>
      <head>
        <title>Optical Prescription - ${p.fullName || 'Patient'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 4px solid #2563eb; padding-bottom: 10px; margin-bottom: 30px; }
          .header h1 { color: #2563eb; font-size: 28px; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #2563eb; color: white; padding: 12px; }
          td { border: 1px solid #e2e8f0; padding: 15px; text-align: center; font-size: 20px; font-weight: 800; }
          .eye-label { background: #f1f5f9; font-size: 12px; text-align: left; padding-left: 15px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>HORSED WATCH & OPTICAL</h1><p>Professional Eye Testing</p></div>
        <div class="info-grid">
          <div><small>Name:</small><br><b>${p.fullName || p.name}</b></div>
          <div><small>Date:</small><br><b>${dateStr}</b></div>
        </div>
        <table>
          <thead><tr><th>Eye</th><th>SPH</th><th>CYL</th><th>Axis</th></tr></thead>
          <tbody>
            <tr><td class="eye-label">RIGHT (OD)</td><td>${order.values?.RE?.sph}</td><td>${order.values?.RE?.cyl}</td><td>${order.values?.RE?.axis}°</td></tr>
            <tr><td class="eye-label">LEFT (OS)</td><td>${order.values?.LE?.sph}</td><td>${order.values?.LE?.cyl}</td><td>${order.values?.LE?.axis}°</td></tr>
          </tbody>
        </table>
        <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};