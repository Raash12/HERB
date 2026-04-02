import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  // 1. STRICT HARDCODED BRANDING
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia", 
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  // 2. GET BRANCH DATA
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

  // 3. FETCH PATIENT DATA (Mapping 'age' and 'address' specifically)
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

  // 4. FORMATTING DATA (Using the specific fields you mentioned)
  const patientName = (patientData.fullName || order.patientName || "N/A").toUpperCase();
  const patientAge = patientData.age || order.age || "N/A";
  const patientGender = patientData.gender || order.gender || "N/A";
  const patientAddress = patientData.address || order.address || "N/A"; // This will now catch "Shibis"
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const activeOptions = order.options 
    ? Object.keys(order.options)
        .filter(key => order.options[key] === true)
        .map(key => key.replace(/([A-Z])/g, ' $1').trim())
        .join(", ")
    : "None";

  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert("Please allow pop-ups");

  const html = `
    <html>
      <head>
        <title>Prescription - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: #000; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; width: 148mm; height: 210mm; padding: 12mm; background: white; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
          .brand-title { font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: -0.5px; }
          .contact-text { font-size: 11px; font-weight: 700; color: #334155; line-height: 1.4; text-align: right; }
          .doc-type { text-align: center; font-size: 20px; font-weight: 900; text-decoration: underline; font-style: italic; color: #1e3a8a; margin: 10px 0; }
          .info-table { width: 100%; margin: 15px 0; border-collapse: collapse; }
          .info-table td { padding: 10px 0; border-bottom: 1.5px dashed #cbd5e1; }
          .label { font-weight: 800; color: #64748b; font-size: 11px; text-transform: uppercase; margin-right: 8px; }
          .value { font-weight: 900; font-size: 16px; color: #000; }
          .vision-table { width: 100%; border-collapse: collapse; margin-top: 15px; border: 2.5px solid #000; }
          .vision-table th { background: #f1f5f9; padding: 8px; font-weight: 900; font-size: 12px; color: #1e3a8a; text-transform: uppercase; border: 2.5px solid #000; }
          .vision-table td { padding: 12px; border: 2.5px solid #000; text-align: center; font-size: 18px; font-weight: 700; }
          .eye-side { text-align: left !important; font-size: 11px !important; font-weight: 900 !important; color: #475569 !important; padding-left: 10px !important; background: #fafafa; }
          .section-title { font-weight: 800; color: #1e3a8a; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; display: block; }
          .data-box { margin-top: 20px; border: 2.5px solid #000; padding: 12px; border-radius: 4px; }
          .data-text { font-weight: 800; font-size: 16px; color: #1e3a8a; line-height: 1.4; }
          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig { border-top: 2.5px solid #000; width: 42%; text-align: center; padding-top: 8px; font-weight: 900; font-size: 12px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" style="height: 65px;">
          <div class="header-info">
            <h1 class="brand-title">${branchInfo.name}</h1>
            <div class="contact-text">
              Tel: ${branchInfo.phone} <br>
              ${branchInfo.email} <br>
              ${branchInfo.location}
            </div>
          </div>
        </div>

        <p class="doc-type">Optical Prescription</p>

        <table class="info-table">
          <tr>
            <td><span class="label">PATIENT:</span><span class="value">${patientName}</span></td>
            <td><span class="label">DATE:</span><span class="value">${dateStr}</span></td>
          </tr>
          <tr>
            <td><span class="label">AGE/SEX:</span><span class="value">${patientAge} Y / ${patientGender}</span></td>
            <td><span class="label">LOCATION:</span><span class="value">${patientAddress}</span></td>
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
          <span class="section-title">Lens Treatment & Details</span>
          <p class="data-text">${activeOptions}</p>
        </div>

        <div class="footer">
          <div class="sig">Optometrist Signature</div>
          <div style="text-align: right">
            <p style="font-weight: 900; color: #1e3a8a; font-size: 16px; margin-bottom: 2px;">${branchInfo.name}</p>
            <div class="sig" style="width: 100%; border-top: none; font-size: 11px;">Pharmacist/Stamp</div>
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