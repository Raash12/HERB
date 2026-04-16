import { auth, db } from "../firebase"; 
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import logoImg from "../assets/logo.jpeg";

export const handleInvoicePrint = async (patient, visit) => {
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "horseedaye@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "61-8888114", 
    email: HARDCODED_EMAIL
  };

  let fetchedDept = visit.department || "Eye";
  let fetchedDoctor = visit.doctorName || "General";
  let fetchedPhone = patient.phone || "N/A";
  let fetchedState = patient.state || "N/A";
  let fetchedDistrict = patient.address || "N/A"; // District-ka caadiyan 'address' ayaad u isticmaashaa

  try {
    const patientId = patient.id || visit.patientId;
    if (patientId) {
      const patientDoc = await getDoc(doc(db, "patients", patientId));
      if (patientDoc.exists()) {
        const pData = patientDoc.data();
        fetchedDept = pData.lastDept || pData.department || fetchedDept;
        fetchedDoctor = pData.doctorName || fetchedDoctor;
        fetchedPhone = pData.phone || fetchedPhone;
        fetchedState = pData.state || fetchedState;
        fetchedDistrict = pData.address || fetchedDistrict;
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const dateStr = new Date().toLocaleString('en-GB', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit' 
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Fadlan ogolow Pop-ups");

  const htmlContent = `
    <html>
      <head>
        <title>Invoice - ${patient.fullName}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body {
            font-family: 'Arial', sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 8mm 4mm;
            color: #000;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .uppercase { text-transform: uppercase; }
          .bold { font-weight: 900; }
          
          .header {
            margin-bottom: 8px;
            text-align: center;
          }
          .hospital-name {
            font-size: 19px;
            font-weight: 900;
            margin-bottom: 4px;
          }
          .contact-info {
            font-size: 12px;
            font-weight: bold;
          }

          .title-box {
            font-size: 16px;
            font-weight: 900;
            margin: 12px 0;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            display: block;
            width: 100%;
          }

          .main-info {
            font-size: 14px;
            margin-bottom: 15px;
          }
          .info-row {
            margin-bottom: 6px;
            display: flex;
          }
          .label {
            width: 90px;
            font-weight: 900;
          }
          .value {
            flex: 1;
            font-weight: bold;
          }

          .total-section {
            margin-top: 15px;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 15px;
            font-weight: 900;
          }
          .total-amount {
            font-size: 22px;
            font-weight: 900;
          }

          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
          }
          .signature-area {
            text-align: left;
            font-size: 11px;
            font-weight: 900;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
  
        <div class="header">
          <div class="hospital-name uppercase">${branchInfo.name}</div>
          <div class="contact-info uppercase">
            ABU HUREYRA<br>
            TEL: ${branchInfo.phone}<br>
            EMAIL: ${HARDCODED_EMAIL}
          </div>
        </div>

        <div class="title-box uppercase text-center">OFFICIAL CASH RECEIPT</div>

        <div class="main-info">
          <div class="info-row"><span class="label">DATE:</span><span class="value">${dateStr}</span></div>
          <div class="info-row"><span class="label">PATIENT:</span><span class="value uppercase">${patient.fullName}</span></div>
          <div class="info-row"><span class="label">PHONE:</span><span class="value">${fetchedPhone}</span></div>
          <div class="info-row"><span class="label">STATE:</span><span class="value uppercase">${fetchedState}</span></div>
          <div class="info-row"><span class="label">DISTRICT:</span><span class="value uppercase">${fetchedDistrict}</span></div>
          <div class="info-row"><span class="label">DEPT:</span><span class="value uppercase">${fetchedDept}</span></div>
          <div class="info-row"><span class="label">DOCTOR:</span><span class="value uppercase">DR. ${fetchedDoctor}</span></div>
        </div>

        <div class="total-section">
          <span class="total-label uppercase">Total Paid:</span>
          <span class="total-amount">$${Number(visit.amount || 0).toFixed(2)}</span>
        </div>

        <div class="footer uppercase">
          THANK YOU, VISIT AGAIN!
        </div>

        <script>
          window.onload = () => { 
            setTimeout(() => { 
              window.print(); 
              window.close(); 
            }, 300); 
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};