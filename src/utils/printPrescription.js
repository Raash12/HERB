import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia", 
    phone: "615994202", // Default phone
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
            phone: actualBranchData.phone || actualBranchData.telephone || "615994202",
            email: HARDCODED_EMAIL 
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching branch info:", error);
  }

  const patientName = (order.patientName || "N/A").toUpperCase();
  const dateStr = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString('en-GB') 
    : new Date().toLocaleDateString('en-GB');

  const dynamicOptions = order.options ? Object.keys(order.options) : [];

  const printWindow = window.open('', '_blank');
  if (!printWindow) return alert("Please allow pop-ups");

  const html = `
    <html>
      <head>
        <title>Rx - ${patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          @page { size: A5 portrait; margin: 8mm; }
          
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body { width: 148mm; height: 210mm; padding: 5mm; background: #fff; color: #000; display: flex; flex-direction: column; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
          .logo-box { display: flex; align-items: center; gap: 12px; }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          .brand-name { font-weight: 900; font-size: 18px; color: #1e3a8a; text-transform: uppercase; line-height: 1.1; }
          
          .contact-details { font-size: 10px; text-align: right; font-weight: 700; color: #000; line-height: 1.5; }

          .patient-section { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; }
          .label { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px; display: block; }
          .val { font-size: 13px; font-weight: 700; color: #1e293b; }

          .rx-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
          .rx-table th { background: #1e3a8a; color: #fff; border: 1px solid #1e3a8a; padding: 6px; font-size: 9px; text-transform: uppercase; }
          .rx-table td { border: 1px solid #cbd5e1; height: 42px; text-align: center; font-size: 19px; font-weight: 700; color: #1e293b; }
          .row-title { background: #f1f5f9; font-size: 9px !important; font-weight: 800 !important; color: #1e3a8a !important; width: 65px; }

          .flex-container { display: flex; gap: 10px; margin-top: 10px; }
          .treatment-box { flex: 1; border: 1.5px solid #1e3a8a; border-radius: 6px; padding: 10px; }
          .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #1e3a8a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          
          .options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
          .opt-item { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; color: #334155; }
          .square { width: 16px; height: 16px; border: 2px solid #1e3a8a; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; background: #fff; }

          .ipd-box { width: 105px; background: #1e3a8a; color: #fff; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; }
          .ipd-label { font-size: 9px; font-weight: 700; text-transform: uppercase; opacity: 0.9; }
          .ipd-val { font-size: 24px; font-weight: 900; }

          .guidance-section { margin-top: 15px; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background-color: #fcfcfc; }
          .guidance-title { font-size: 11px; font-weight: 900; color: #1e3a8a; margin-bottom: 10px; text-transform: uppercase; text-decoration: underline; }
          .guidance-text { font-size: 11px; color: #000; line-height: 1.6; font-weight: 600; }

          .footer { margin-top: auto; padding-top: 15px; padding-bottom: 5mm; display: flex; flex-direction: column; gap: 10px; }
          .footer-top { display: flex; justify-content: space-between; align-items: flex-end; }
          .location-tag { font-size: 9px; font-weight: 800; color: #1e3a8a; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; border-left: 3px solid #1e3a8a; }
          .sig-area { text-align: center; width: 150px; }
          .sig-line { border-top: 2px solid #1e3a8a; margin-bottom: 4px; }
          .sig-text { font-size: 9px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; }
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
            ABU HUREYRA<br>
            Tel: ${branchInfo.phone}
          </div>
        </div>

        <div class="patient-section">
          <div>
            <span class="label">Patient Name</span>
            <span class="val">${patientName}</span>
          </div>
          <div style="text-align: right;">
            <span class="label">Exam Date</span>
            <span class="val">${dateStr}</span>
          </div>
        </div>

        <table class="rx-table">
          <thead>
            <tr>
              <th rowspan="2" class="row-title" style="background:#1e3a8a; color:white;">Vision</th>
              <th colspan="4">Right Eye (RE)</th>
              <th colspan="4">Left Eye (LE)</th>
            </tr>
            <tr style="background:#f1f5f9; color:#1e3a8a;">
              <th>SPH</th><th>CYL</th><th>AXIS</th><th>VA</th>
              <th>SPH</th><th>CYL</th><th>AXIS</th><th>VA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-title">DISTANCE</td>
              <td>${order.values?.RE?.distance?.sph || ''}</td>
              <td>${order.values?.RE?.distance?.cyl || ''}</td>
              <td>${order.values?.RE?.distance?.axis || ''}</td>
              <td>${order.values?.RE?.distance?.va || ''}</td>
              <td>${order.values?.LE?.distance?.sph || ''}</td>
              <td>${order.values?.LE?.distance?.cyl || ''}</td>
              <td>${order.values?.LE?.distance?.axis || ''}</td>
              <td>${order.values?.LE?.distance?.va || ''}</td>
            </tr>
            <tr>
              <td class="row-title">NEAR / ADD</td>
              <td>${order.values?.RE?.near?.sph || ''}</td>
              <td>${order.values?.RE?.near?.cyl || ''}</td>
              <td>${order.values?.RE?.near?.axis || ''}</td>
              <td>${order.values?.RE?.near?.va || ''}</td>
              <td>${order.values?.LE?.near?.sph || ''}</td>
              <td>${order.values?.LE?.near?.cyl || ''}</td>
              <td>${order.values?.LE?.near?.axis || ''}</td>
              <td>${order.values?.LE?.near?.va || ''}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex-container">
          <div class="treatment-box">
            <div class="section-title">Lens Treatments</div>
            <div class="options-grid">
              ${dynamicOptions.map(key => {
                const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                const isChecked = order.options[key] === true;
                return `
                  <div class="opt-item">
                    <div class="square">${isChecked ? '✓' : ''}</div>
                    <span>${label}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="ipd-box">
            <span class="ipd-label">P.D / IPD</span>
            <span class="ipd-val">${order.ipd || '---'}</span>
            <span style="font-size:8px; font-weight:700;">MILLIMETERS</span>
          </div>
        </div>

        <div class="guidance-section">
          <div class="guidance-title">Talo bixin muhiim ah:</div>
          <div class="guidance-text">
            Haddii aad aragto calaamadaha soo socda mid ka mid ah cabir indhahaaga:<br>
            <strong>1)</strong> Dadkoo aragga laba noqda ama ceeryaamo ka socota marko.<br>
            <strong>2)</strong> Indhahoo yar-yarada markay arkaan iftiinka ama wajigoo samaysta mannar duudush ah.<br>
            <strong>3)</strong> Akhriska oo ku dhiba sida: fogaantoo sax ah balse dhawaantoo dhib ah, xanuun madaxa xiliga akhriska.<br>
            <strong>4)</strong> In labada indhood aysan simanayn aragooda fogaan iyo dhawaan.<br>
            <strong>5)</strong> Ha dhummin fursadda ee indhahaaga macaan u sheeg.
          </div>
        </div>

        <div class="footer">
          <div class="footer-top">
            <div class="location-tag">
              📍 ${branchInfo.location.toUpperCase()} | HORSEED OPTICAL
            </div>
            <div class="sig-area">
              <div class="sig-line"></div>
              <span class="sig-text">Optometrist Signature</span>
            </div>
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

  printWindow.document.write(html);
  printWindow.document.close();
};