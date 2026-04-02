import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  const supportEmail = "Daahirx81@gmail.com";

  // 1. SETUP BRANCH DATA (Defaults first)
  let branchInfo = {
    name: order.branchName || "HORSEED OPTICAL",
    location: order.branchLocation || "Banaadir wadada digfeer",
    phone: order.branchPhone || "615994202",
    email: supportEmail
  };

  // 2. DYNAMIC FETCH: Get Branch details based on logged-in user
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userBranchName = userDoc.data().branch;
        const q = query(collection(db, "branches"), where("name", "==", userBranchName));
        const branchSnap = await getDocs(q);
        
        if (!branchSnap.empty) {
          const data = branchSnap.docs[0].data();
          branchInfo = {
            name: data.name || userBranchName,
            location: data.location || "N/A",
            phone: data.phone || data.telephone || "N/A",
            email: supportEmail // Kept hardcoded per your request
          };
        }
      }
    }
  } catch (e) {
    console.error("Error fetching branch info:", e);
  }

  // 3. DYNAMIC OPTIONS: Filter map for true values
  const activeOptions = order.options 
    ? Object.keys(order.options)
        .filter(key => order.options[key] === true)
        .map(key => key.replace(/([A-Z])/g, ' $1').trim())
        .join(", ")
    : "None";

  // 4. FORMATTING DATE & NAMES
  const patientName = order.patientName || "N/A";
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
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
          @page { size: A5; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            width: 148mm; height: 210mm; padding: 12mm; 
            color: #1e293b; 
          }

          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 15px; }
          .brand-title { font-size: 24px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
          
          .doc-type { 
            text-align: center; font-size: 18px; font-weight: 700; color: #1e3a8a; 
            text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px;
          }
          
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          
          .label { font-weight: 500; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { font-weight: 600; font-size: 15px; color: #0f172a; margin-top: 2px; display: block; }

          .vision-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #e2e8f0; }
          .vision-table th { background: #f8fafc; padding: 10px; font-weight: 700; font-size: 11px; color: #1e3a8a; text-transform: uppercase; border: 1px solid #e2e8f0; }
          .vision-table td { padding: 15px; border: 1px solid #e2e8f0; text-align: center; font-size: 20px; font-weight: 500; color: #0f172a; }
          
          .eye-side { text-align: left !important; font-size: 12px !important; font-weight: 700 !important; color: #64748b !important; padding-left: 12px !important; }

          .section-title { font-weight: 700; color: #1e3a8a; font-size: 12px; text-transform: uppercase; margin-bottom: 6px; display: block; }
          .data-box { margin-top: 15px; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background-color: #ffffff; }
          .data-text { font-weight: 500; font-size: 14px; color: #334155; line-height: 1.5; }

          .footer { position: absolute; bottom: 12mm; left: 12mm; right: 12mm; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig { border-top: 1px solid #94a3b8; width: 40%; text-align: center; padding-top: 8px; font-weight: 500; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" style="height: 60px;">
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
            <td><span class="label">Patient</span><span class="value">${patientName}</span></td>
            <td><span class="label">Date</span><span class="value">${dateStr}</span></td>
          </tr>
          <tr>
            <td><span class="label">Doctor</span><span class="value">${order.doctorName || 'N/A'}</span></td>
            <td><span class="label">Status</span><span class="value" style="color: #059669;">${order.status?.toUpperCase() || 'COMPLETED'}</span></td>
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