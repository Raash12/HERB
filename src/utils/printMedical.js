import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintMedical = async (order) => {
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userBranchName = userDoc.data().branch;
        const q = query(collection(db, "branches"), where("name", "==", userBranchName));
        const branchSnap = await getDocs(q);
        if (!branchSnap.empty) {
          const actualBranchData = branchSnap.docs[0].data();
          branchInfo = {
            name: HARDCODED_NAME,
            location: actualBranchData.location || "Mogadishu, Somalia",
            phone: actualBranchData.phone || actualBranchData.telephone || "N/A",
            email: HARDCODED_EMAIL
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching branch info:", error);
  }

  let patientData = {};
  if (order.patientId) {
    try {
      const patientRef = doc(db, "patients", order.patientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        patientData = patientSnap.data();
      }
    } catch (error) {}
  }

  const patientName = (patientData.fullName || order.patientName || "N/A").toUpperCase();
  const patientAge = patientData.age || order.age || "N/A";
  const patientGender = (patientData.gender || order.gender || "N/A").toUpperCase();
  const patientAddress = (patientData.address || order.address || "N/A").toUpperCase();
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Please allow pop-ups");

  const htmlContent = `
    <html>
      <head>
        <title>Rx Medical - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          @page { size: A5 portrait; margin: 8mm; }
          
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          body { width: 148mm; height: 210mm; padding: 10mm; background: #fff; color: #000; display: flex; flex-direction: column; }

          /* Premium Header */
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
          .logo-box { display: flex; align-items: center; gap: 12px; }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          .brand-name { font-weight: 900; font-size: 19px; color: #1e3a8a; text-transform: uppercase; line-height: 1.1; }
          .contact-details { font-size: 10px; text-align: right; font-weight: 700; color: #1e293b; line-height: 1.5; }

          .doc-title { text-align: center; font-size: 18px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 2px; }

          /* Patient Info */
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 15px; }
          .info-item { display: flex; flex-direction: column; gap: 2px; }
          .label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; }
          .val { font-size: 14px; font-weight: 700; color: #0f172a; }

          /* Professional 3-Column Table */
          .med-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .med-table th { background: #1e3a8a; color: #fff; padding: 10px; font-size: 10px; text-transform: uppercase; text-align: left; border: 1.5px solid #1e3a8a; }
          .med-table td { padding: 12px 10px; border: 1.5px solid #e2e8f0; vertical-align: middle; }
          
          .med-name { font-size: 15px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
          .qty-text { font-size: 15px; font-weight: 800; color: #000; text-align: center; }
          .dosage-text { font-size: 13px; font-weight: 700; color: #334155; }

          /* Footer */
          .policy-box { background: #f8fafc; border-left: 4px solid #1e3a8a; padding: 12px; border-radius: 4px; margin-top: auto; }
          .policy-text { font-size: 12px; font-weight: 800; color: #1e3a8a; text-align: center; }

          .footer-sigs { display: flex; justify-content: space-between; margin-top: 30px; padding-bottom: 5mm; }
          .sig-box { width: 45%; text-align: center; }
          .sig-line { border-top: 2px solid #0f172a; margin-bottom: 6px; }
          .sig-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <img src="/logo.png" class="logo-img" onerror="this.style.display='none'">
            <div class="brand-name">${branchInfo.name}</div>
          </div>
          <div class="contact-details">
            ${branchInfo.email}<br>
            Tel: ${branchInfo.phone}<br>
            ${branchInfo.location.toUpperCase()}
          </div>
        </div>

        <h2 class="doc-title">Medical Prescription</h2>

        <div class="patient-grid">
          <div class="info-item">
            <span class="label">Patient Name</span>
            <span class="val">${patientName}</span>
          </div>
          <div class="info-item" style="text-align: right;">
            <span class="label">Date</span>
            <span class="val">${dateStr}</span>
          </div>
          <div class="info-item">
            <span class="label">Age / Gender</span>
            <span class="val">${patientAge} Y / ${patientGender}</span>
          </div>
          <div class="info-item" style="text-align: right;">
            <span class="label">Location / District</span>
            <span class="val">${patientAddress}</span>
          </div>
        </div>

        <table class="med-table">
          <thead>
            <tr>
              <th width="50%">Medication</th>
              <th width="15%" style="text-align:center;">Qty</th>
              <th width="35%">Dosage</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map(item => `
              <tr>
                <td class="med-name">${item.medicineName}</td>
                <td class="qty-text" style="text-align:center;">${item.quantity}</td>
                <td class="dosage-text">${item.dosage || 'N/A'}</td>
              </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center;">No medications listed.</td></tr>'}
          </tbody>
        </table>

        <div class="policy-box">
          <div class="policy-text">
            Fadlan: Soo laabashadu waa (7) maalmood gudahood oo kaliya.
          </div>
        </div>

        <div class="footer-sigs">
          <div class="sig-box">
            <div class="sig-line"></div>
            <span class="sig-label">Doctor's Signature</span>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <span class="sig-label">Pharmacist / Stamp</span>
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); window.close(); }, 800);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};