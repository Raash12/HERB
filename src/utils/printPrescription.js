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
          
          @page { 
            size: A5 portrait; 
            margin: 0; /* Printer-ka ayaan u deynaynaa margin-ka */
          }
          
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          
          body { 
            width: 148mm; 
            height: 210mm; 
            padding: 8mm; /* Booska gudaha foomka */
            background: #fff; 
            display: flex; 
            flex-direction: column;
            color: #1e3a8a;
            -webkit-print-color-adjust: exact;
          }

          .header { 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 6px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 12px;
          }
          .logo-img { height: 60px; width: auto; object-fit: contain; }
          
          .brand-container { text-align: right; flex: 1; }
          .brand-name { 
            font-size: 28px; 
            font-weight: 900; 
            line-height: 0.9; 
            letter-spacing: -1px;
          }
          .brand-sub { 
            font-size: 10px; 
            font-weight: 800; 
            letter-spacing: 3px; 
            margin-top: 4px;
            text-transform: uppercase;
          }

          .patient-card {
            border: 2px solid #1e3a8a; border-radius: 8px; padding: 10px;
            display: grid; grid-template-columns: 2.2fr 1fr 1fr; gap: 8px;
            background: #f8fafc; margin-bottom: 12px;
          }
          .p-label { font-size: 9px; font-weight: 800; opacity: 0.8; text-transform: uppercase; }
          .p-info { font-size: 14px; font-weight: 900; text-transform: uppercase; }

          .rx-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          .rx-table th { 
            background: #1e3a8a !important; color: white !important; 
            border: 1.5px solid #1e3a8a; padding: 8px; font-size: 11px; font-weight: 900;
          }
          .rx-table td { 
            border: 2px solid #1e3a8a; 
            height: 45px; 
            text-align: center; 
            font-size: 22px; 
            font-weight: 900; 
          }
          .row-title { 
            background: #f1f5f9 !important; 
            font-size: 10px !important; 
            width: 80px; 
          }

          .bottom-container { display: flex; gap: 10px; align-items: stretch; }
          .options-card { flex: 1; border: 2px solid #1e3a8a; border-radius: 8px; padding: 10px; }
          .section-head { 
            font-size: 11px; font-weight: 900; 
            text-transform: uppercase; border-bottom: 2px solid #1e3a8a; margin-bottom: 8px; padding-bottom: 4px;
          }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
          .item { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; }
          .check-box { 
            width: 16px; height: 16px; border: 1.5px solid #1e3a8a; 
            display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
          }

          .ipd-card { 
            width: 120px; background: #1e3a8a !important; color: white !important; 
            border-radius: 8px; text-align: center; padding: 12px;
            display: flex; flex-direction: column; justify-content: center;
          }
          .ipd-number { font-size: 38px; font-weight: 900; line-height: 1; color: white !important; }

          .footer { 
            margin-top: auto; padding-top: 10px; border-top: 4px solid #1e3a8a; 
            display: flex; justify-content: space-between; align-items: flex-end; 
          }
          .contact-footer { font-size: 10px; font-weight: 800; line-height: 1.4; }
          .sig-line { 
            border-top: 2px solid #1e3a8a; width: 160px; text-align: center; 
            padding-top: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase; 
          }
        </style>
      </head>
      <body>

        <div class="header">
          <img src="/logo.png" class="logo-img" onerror="this.style.display='none'">
          <div class="brand-container">
            <div class="brand-name">${branchInfo.name}</div>
            <div class="brand-sub">WATCH & OPTICAL</div>
          </div>
        </div>

        <div class="patient-card">
          <div style="grid-column: span 1;">
            <div class="p-label">Patient Name</div>
            <div class="p-info">${patientName}</div>
          </div>
          <div style="text-align: right;">
            <div class="p-label">Date</div>
            <div class="p-info">${dateStr}</div>
          </div>
          <div style="text-align: right;">
            <div class="p-label">Rx ID</div>
            <div class="p-info">#${order.visitId?.slice(-5).toUpperCase() || '---'}</div>
          </div>
          <div>
            <div class="p-label">Age</div>
            <div class="p-info">${patientExtraInfo.age}</div>
          </div>
          <div>
            <div class="p-label">Gender</div>
            <div class="p-info">${patientExtraInfo.gender}</div>
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
              <td>${(order.values?.RE?.distance?.sph || '')}</td>
              <td>${(order.values?.RE?.distance?.cyl || '')}</td>
              <td>${(order.values?.RE?.distance?.axis || '')}</td>
              <td>${(order.values?.RE?.distance?.va || '')}</td>
              <td>${(order.values?.LE?.distance?.sph || '')}</td>
              <td>${(order.values?.LE?.distance?.cyl || '')}</td>
              <td>${(order.values?.LE?.distance?.axis || '')}</td>
              <td>${(order.values?.LE?.distance?.va || '')}</td>
            </tr>
            <tr>
              <td class="row-title">NEAR / ADD</td>
              <td>${(order.values?.RE?.near?.sph || '')}</td>
              <td>${(order.values?.RE?.near?.cyl || '')}</td>
              <td>${(order.values?.RE?.near?.axis || '')}</td>
              <td>${(order.values?.RE?.near?.va || '')}</td>
              <td>${(order.values?.LE?.near?.sph || '')}</td>
              <td>${(order.values?.LE?.near?.cyl || '')}</td>
              <td>${(order.values?.LE?.near?.axis || '')}</td>
              <td>${(order.values?.LE?.near?.va || '')}</td>
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
            <div style="font-size: 11px; font-weight: 900;">P.D / IPD</div>
            <div class="ipd-number">${order.ipd || '--'}</div>
            <div style="font-size: 8px; font-weight: 800;">MM</div>
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
          window.onload = () => { 
            setTimeout(() => { 
              window.print(); 
              window.close(); 
            }, 800); 
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};