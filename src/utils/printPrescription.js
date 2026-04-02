import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  // 1. STRICT HARDCODED BRANDING
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  // Default values in case the database fetch is still working
  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia", 
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  // 2. DYNAMIC FETCH: Get specific Phone/Location for the current user's branch
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Find which branch the logged-in user belongs to
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      
      if (userDoc.exists()) {
        const userBranchName = userDoc.data().branch;

        // Search the "branches" collection for the Phone and Location of that branch
        const q = query(collection(db, "branches"), where("name", "==", userBranchName));
        const branchSnap = await getDocs(q);

        if (!branchSnap.empty) {
          const actualBranchData = branchSnap.docs[0].data();
          branchInfo = {
            name: HARDCODED_NAME, // Keep strict
            location: actualBranchData.location || "Mogadishu, Somalia", // Dynamic
            phone: actualBranchData.phone || actualBranchData.telephone || "N/A", // Dynamic
            email: HARDCODED_EMAIL // Keep strict
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching branch info:", error);
  }

  // 3. DYNAMIC OPTIONS: Filter map for true values
  const activeOptions = order.options 
    ? Object.keys(order.options)
        .filter(key => order.options[key] === true)
        .map(key => key.replace(/([A-Z])/g, ' $1').trim())
        .join(", ")
    : "None";

  // 4. FORMATTING DATE & NAMES
  const patientName = (order.patientName || "N/A").toUpperCase();
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert("Please allow pop-ups");

  // 5. THE PREMIUM HTML TEMPLATE
  const html = `
    <html>
      <head>
        <title>Prescription - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; color: #000; }
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            background: white; 
          }

          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 15px; }
          .brand-title { font-size: 20px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: -0.5px; }
          .contact-text { font-size: 11px; font-weight: 700; color: #334155; line-height: 1.3; text-align: right; margin-top: 2px; }
          
          .doc-type { 
            text-align: center; font-size: 20px; font-weight: 900; text-decoration: underline; font-style: italic; color: #1e3a8a; margin: 10px 0;
          }
          
          .info-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
          .info-table td { padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
          
          .label { font-weight: 800; color: #64748b; font-size: 10px; text-transform: uppercase; margin-right: 5px; }
          .value { font-weight: 900; font-size: 15px; color: #000; }

          .vision-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2.5px solid #000; }
          .vision-table th { background: #f1f5f9; padding: 8px; font-weight: 900; font-size: 12px; color: #1e3a8a; text-transform: uppercase; border: 2px solid #000; }
          .vision-table td { padding: 12px; border: 2px solid #000; text-align: center; font-size: 18px; font-weight: 700; }
          
          .eye-side { text-align: left !important; font-size: 11px !important; font-weight: 900 !important; color: #475569 !important; padding-left: 10px !important; background: #fafafa; }

          .section-title { font-weight: 800; color: #1e3a8a; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; display: block; }
          .data-box { margin-top: 12px; border: 2px solid #000; padding: 10px; border-radius: 4px; }
          .data-text { font-weight: 700; font-size: 14px; line-height: 1.4; }

          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig { border-top: 2.5px solid #000; width: 40%; text-align: center; padding-top: 6px; font-weight: 900; font-size: 11px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" style="height: 60px;">
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
            <td><span class="label">Patient:</span><span class="value">${patientName}</span></td>
            <td><span class="label">Date:</span><span class="value">${dateStr}</span></td>
          </tr>
          <tr>
            <td><span class="label">Doctor:</span><span class="value">${order.doctorName || 'N/A'}</span></td>
            <td><span class="label">Ref:</span><span class="value">#${order.id?.slice(-5).toUpperCase() || 'OPT'}</span></td>
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
          <span class="section-title">Lens Details</span>
          <p class="data-text">${activeOptions}</p>
        </div>

        <div class="data-box" style="margin-top: 8px;">
          <span class="section-title">Doctor Notes</span>
          <p class="data-text" style="font-weight: 500;">${order.notes || 'No extra notes.'}</p>
        </div>

        <div class="footer">
          <div class="sig">Optometrist Signature</div>
          <div style="text-align: right">
            <p style="font-weight: 900; color: #1e3a8a; font-size: 16px; margin-bottom: 2px;">${branchInfo.name}</p>
            <div class="sig" style="width: 100%; border-top: none;">Pharmacist/Stamp</div>
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