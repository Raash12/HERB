import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintMedical = async (order) => {
  // Hardcoded Support Email
  const supportEmail = "Daahirx81@gmail.com";

  // 1. Setup a placeholder for Branch Data
  let branchInfo = {
    name: "Loading...",
    location: "Loading...",
    phone: "Loading...",
    email: supportEmail // Hardcoded
  };

  // 2. GET LOGGED-IN USER'S BRANCH DATA
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Step A: Get the user's document to find out which branch they belong to
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      
      if (userDoc.exists()) {
        const userBranchName = userDoc.data().branch;

        // Step B: Get the specific details (Phone, Location) for THAT branch
        const branchesRef = collection(db, "branches");
        const q = query(branchesRef, where("name", "==", userBranchName));
        const branchSnap = await getDocs(q);

        if (!branchSnap.empty) {
          const actualBranchData = branchSnap.docs[0].data();
          branchInfo = {
            name: actualBranchData.name || userBranchName,
            location: actualBranchData.location || "N/A",
            phone: actualBranchData.phone || actualBranchData.telephone || "N/A",
            email: supportEmail // Keep hardcoded even if DB has another value
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching dynamic branch info:", error);
  }

  // 3. Fetch Patient Data
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

  // 4. Data Formatting
  const patientName = patientData.fullName || order.patientName || order.fullName || "N/A";
  const patientAge = patientData.age || order.age || "N/A";
  const patientGender = patientData.gender || order.gender || "N/A";
  const patientAddress = patientData.address || order.address || "N/A";
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
          * { margin: 0; padding: 0; box-sizing: border-box; color: #000; }
          
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

          .info-table { width: 100%; margin: 20px 0; font-size: 14px; border-collapse: collapse; table-layout: fixed; }
          .info-table td { padding: 12px 0; border-bottom: 1.5px dashed #cbd5e1; vertical-align: bottom; }
          .label { font-weight: 800; color: #64748b; text-transform: uppercase; margin-right: 10px; }
          .value { font-weight: 900; color: #000; font-size: 18px; text-transform: lowercase; }

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
            <h1 class="brand-main">${branchInfo.name}</h1>
            <div class="contact-text">
              Tel: ${branchInfo.phone} | Somalia <br>
              ${branchInfo.email} <br>
              ${branchInfo.location}
            </div>
          </div>
        </div>
        
        <p class="doc-type">Medical Prescription</p>

        <table class="info-table">
          <tr>
            <td><span class="label">PATIENT:</span> <span class="value">${patientName.toLowerCase()}</span></td>
            <td><span class="label">DATE:</span> <span class="value">${currentDate}</span></td>
          </tr>
          <tr>
            <td><span class="label">AGE/SEX:</span> <span class="value">${patientAge} Yrs / ${patientGender}</span></td>
            <td><span class="label">LOCATION:</span> <span class="value">${patientAddress}</span></td>
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