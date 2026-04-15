import { auth, db } from "../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const handlePrintPrescription = async (order) => {
  const HARDCODED_NAME = "HORSEED WATCH & OPTICAL";
  const HARDCODED_EMAIL = "horseedaye@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  let patientExtraInfo = {
    age: "N/A",
    gender: "N/A"
  };

  try {
    if (order.patientId) {
      const patientDoc = await getDoc(doc(db, "patients", order.patientId));
      if (patientDoc.exists()) {
        const pData = patientDoc.data();
        patientExtraInfo = {
          age: pData.age || "N/A",
          gender: pData.gender || "N/A"
        };
      }
    }

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
    console.error("Error fetching print data:", error);
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');
          @page { size: A5 portrait; margin: 5mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body { width: 148mm; padding: 6mm; background: #fff; display: flex; flex-direction: column; height: 210mm; }

          .header { 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 6px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px;
          }
          .logo-img { height: 75px; width: auto; object-fit: contain; }
          
          /* Title Big & Bold */
          .brand-container { text-align: right; flex: 1; }
          .brand-name { 
            font-size: 32px; 
            font-weight: 900; 
            color: #1e3a8a; 
            text-transform: uppercase; 
            line-height: 0.9; 
            letter-spacing: -1px;
          }
          .brand-sub { 
            font-size: 11px; 
            font-weight: 800; 
            color: #1e3a8a; 
            letter-spacing: 3px; 
            margin-top: 4px;
            text-transform: uppercase;
          }

          .patient-card {
            border: 2px solid #1e3a8a; border-radius: 8px; padding: 10px;
            display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px;
            background: #f8fafc; margin-bottom: 12px;
          }
          .p-label { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .p-info { font-size: 14px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }

          .rx-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .rx-table th { 
            background: #1e3a8a !important; color: white !important; 
            border: 1px solid #1e3a8a; padding: 10px; font-size: 13px; font-weight: 900;
            -webkit-print-color-adjust: exact;
          }
          .rx-table td { border: 2px solid #1e3a8a; height: 42px; text-align: center; font-size: 24px; font-weight: 900; color: #000; }
          .row-title { background: #f1f5f9 !important; font-size: 11px !important; color: #1e3a8a !important; width: 85px; -webkit-print-color-adjust: exact; }

          .bottom-container { display: flex; gap: 10px; }
          .options-card { flex: 1; border: 3px solid #1e3a8a; border-radius: 8px; padding: 10px; }
          .section-head { font-size: 12px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; border-bottom: 2px solid #1e3a8a; margin-bottom: 8px; }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
          .item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #1e3a8a; }
          .check-box { width: 16px; height: 16px; border: 2px solid #1e3a8a; display: flex; align-items: center; justify-content: center; font-size: 12px; }

          .ipd-card { 
            width: 135px; background: #1e3a8a !important; color: white !important; 
            border-radius: 8px; text-align: center; padding: 12px;
            -webkit-print-color-adjust: exact;
          }
          .ipd-number { font-size: 38px; font-weight: 900; line-height: 1; }

          .footer { margin-top: auto; padding-top: 10px; border-top: 3px solid #1e3a8a; display: flex; justify-content: space-between; align-items: flex-end; }
          .contact-footer { font-size: 11px; font-weight: 800; color: #1e3a8a; line-height: 1.5; }
          .sig-line { border-top: 2px solid #1e3a8a; width: 160px; text-align: center; padding-top: 5px; font-size: 10px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
        </style>
      </head>
      <body>

        <div class="header">
          <img src="/logo.png" class="logo-img" onerror="this.style.opacity='0'">
          <div class="brand-container">
            <div class="brand-name">${branchInfo.name}</div>
            <div class="brand-sub">WATCH & OPTICAL</div>
          </div>
        </div>

        <div class="patient-card">
          <div style="grid-column: span 2;">
            <div class="p-label">Patient Name</div>
            <div class="p-info">${patientName}</div>
          </div>
          <div style="text-align: right;">
            <div class="p-label">Date</div>
            <div class="p-info">${dateStr}</div>
          </div>
          <div>
            <div class="p-label">Age</div>
            <div class="p-info">${patientExtraInfo.age}</div>
          </div>
          <div>
            <div class="p-label">Gender</div>
            <div class="p-info">${patientExtraInfo.gender}</div>
          </div>
          <div style="text-align: right;">
            <div class="p-label">Rx ID</div>
            <div class="p-info">#${order.visitId?.slice(-5).toUpperCase() || '---'}</div>
          </div>
        </div>

        <table class="rx-table">
          <thead>
            <tr>
              <th rowspan="2" class="row-title">VISION</th>
              <th colspan="4">RIGHT EYE (RE)</th>
              <th colspan="4">LEFT EYE (LE)</th>
            </tr>
            <tr>
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
              <td>${order.values?.RE?.read?.sph || ''}</td>
              <td>${order.values?.RE?.read?.cyl || ''}</td>
              <td>${order.values?.RE?.read?.axis || ''}</td>
              <td>${order.values?.RE?.read?.va || ''}</td>
              <td>${order.values?.LE?.read?.sph || ''}</td>
              <td>${order.values?.LE?.read?.cyl || ''}</td>
              <td>${order.values?.LE?.read?.axis || ''}</td>
              <td>${order.values?.LE?.read?.va || ''}</td>
            </tr>
          </tbody>
        </table>

        <div class="bottom-container">
          <div class="options-card">
            <div class="section-head">Lens Options</div>
            <div class="grid">
              ${dynamicOptions.map(key => `
                <div class="item">
                  <div class="check-box">${order.options[key] ? '✓' : ''}</div>
                  <span>${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="ipd-card">
            <div style="font-size: 12px; font-weight: 900;">P.D / IPD</div>
            <div class="ipd-number">${order.ipd || '--'}</div>
            <div style="font-size: 9px; font-weight: 800;">MM</div>
          </div>
        </div>

        <div class="footer">
          <div class="contact-footer">
            📍 LOCATION: ${branchInfo.location.toUpperCase()}<br>
            📞 PHONE: ${branchInfo.phone}<br>
            📧 EMAIL: ${branchInfo.email}
          </div>
          <div class="sig-line">DOCTOR SIGNATURE</div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};