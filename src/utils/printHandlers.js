import { auth, db } from "../firebase"; 
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
// 1. Soo daji logo-ga
import logoImg from "../assets/logo.jpeg";

export const handleInvoicePrint = async (patient, visit) => {
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  let fetchedDept = visit.department || "Eye";
  let fetchedDoctor = visit.doctorName || "General";

  try {
    const patientId = patient.id || visit.patientId;
    if (patientId) {
      const patientDoc = await getDoc(doc(db, "patients", patientId));
      if (patientDoc.exists()) {
        const pData = patientDoc.data();
        fetchedDept = pData.department || pData.dept || fetchedDept;
        fetchedDoctor = pData.doctorName || pData.doctor || fetchedDoctor;
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
          branchInfo.location = actualBranchData.location || branchInfo.location;
          branchInfo.phone = actualBranchData.phone || actualBranchData.telephone || branchInfo.phone;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
  }

  const dateStr = new Date().toLocaleString('en-GB', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Fadlan ogolow Pop-ups (Allow Pop-ups)");

  const htmlContent = `
    <html>
      <head>
        <title>Invoice - ${patient.fullName}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            width: 74mm;
            margin: 0 auto;
            padding: 4mm 5mm;
            font-size: 11px;
            color: #1e2a3a;
            line-height: 1.5;
            background: white;
          }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          
          .header {
            border-bottom: 2.5px solid #0b3b5f;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          
          .logo-img {
            height: 58px;
            width: auto;
            margin-bottom: 6px;
            object-fit: contain;
          }

          .logo-text {
            font-size: 17px;
            font-weight: 800;
            color: #0b3b5f;
            line-height: 1.2;
            letter-spacing: 0.3px;
          }
          .contact-info {
            font-size: 9.5px;
            color: #475569;
            margin-top: 5px;
            font-weight: 500;
          }

          .receipt-title {
            background: #0b3b5f;
            color: white;
            padding: 8px 4px;
            margin: 15px 0;
            font-size: 13px;
            font-weight: 700;
            text-align: center;
            border-radius: 6px; /* Casri ah */
            letter-spacing: 1.2px; /* Casri ah */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          /* Table Style - Separate + Radius */
          .info-table {
            width: 100%;
            border-collapse: separate; /* Bedelkii collapse */
            border-spacing: 0 6px; /* Masaafo u dhaxaysa rows-ka */
            margin-bottom: 15px;
          }
          .info-table td {
            padding: 8px 10px; /* Padding la kordhiyay */
            background: #ffffff;
            border-top: 1px solid #f1f5f9;
            border-bottom: 1px solid #f1f5f9;
          }
          .info-table td:first-child {
            border-left: 1px solid #f1f5f9;
            border-radius: 8px 0 0 8px; /* Rounded corners bidix */
          }
          .info-table td:last-child {
            border-right: 1px solid #f1f5f9;
            border-radius: 0 8px 8px 0; /* Rounded corners midig */
            box-shadow: 2px 0 4px rgba(0,0,0,0.02);
          }

          .label {
            font-weight: 800; /* Font-weight la kordhiyay */
            color: #0f172a; /* Midab madow ka xiga */
            width: 40%;
            background: #f8fafc !important;
            font-size: 10px;
            text-transform: uppercase;
          }

          /* Total Box Casri ah */
          .total-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0 10px;
            padding: 12px 14px; /* Padding la kordhiyay */
            background: #f1f5f9;
            border-left: 5px solid #0b3b5f; /* Border dhumuc weyn */
            border-radius: 12px; /* Rounded corners weyn */
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
          }
          .total-label {
            font-size: 12px;
            font-weight: 800;
            color: #1e293b;
          }
          .amount-big {
            font-size: 24px;
            font-weight: 900;
            color: #0b3b5f;
          }

          .footer {
            margin-top: 25px;
            text-align: center;
            border-top: 1.5px dashed #e2e8f0;
            padding-top: 15px;
          }
          .thank-you {
            font-size: 11px;
            font-weight: 700;
            color: #0b3b5f;
            margin-bottom: 15px;
          }
          .sig-line {
            margin-top: 30px;
            border-top: 1px solid #94a3b8;
            width: 65%;
            margin-left: auto;
            margin-right: auto;
          }
          .sig-text {
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
            text-transform: uppercase;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <img src="${window.location.origin}${logoImg}" class="logo-img" onerror="this.style.display='none'">
          <div class="logo-text uppercase">${branchInfo.name}</div>
          <div class="contact-info">
            ${branchInfo.location}<br>
            <span class="bold">Email: ${HARDCODED_EMAIL}</span><br>
            <span class="bold">Tel: ${branchInfo.phone}</span>
          </div>
        </div>

        <div class="receipt-title uppercase">
          Official Cash Receipt
        </div>

        <table class="info-table">
          <tr><td class="label">Date:</td><td class="bold">${dateStr}</td></tr>
          <tr><td class="label">Patient:</td><td class="uppercase bold" style="color: #0b3b5f;">${patient.fullName}</td></tr>
          <tr><td class="label">Age/Sex:</td><td>${patient.age || 'N/A'}Y | ${patient.gender || 'N/A'}</td></tr>
          <tr><td class="label">Department:</td><td class="uppercase bold">${fetchedDept}</td></tr>
          <tr><td class="label">Doctor:</td><td class="uppercase">DR. ${fetchedDoctor}</td></tr>
        </table>

        <div class="total-box">
          <span class="total-label uppercase">Total Paid</span>
          <span class="amount-big">$${Number(visit.amount || 0).toFixed(2)}</span>
        </div>

        <div class="footer">
          <p class="thank-you uppercase">Thank you for choosing us!</p>
          <div class="sig-line"></div>
          <p class="sig-text">Authorized Signature</p>
        </div>

        <script>
          window.onload = () => { 
            setTimeout(() => { 
              window.print(); 
              window.close(); 
            }, 500); 
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};