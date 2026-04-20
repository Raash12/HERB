import { auth, db } from "../firebase"; 
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import logoImg from "../assets/logo.jpeg";

export const handlePrintMedicalInvoice = async (order) => {
  // Xogta rasmiga ah (Default)
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "horseedaye@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  let patientInfo = {
    age: order.patientInfo?.age || "N/A",
    gender: order.patientInfo?.gender || "N/A",
    doctor: order.doctorName || "General",
    phone: "N/A" 
  };

  let itemsWithLivePrices = [];
  let subTotalSum = 0;

  try {
    // 1. Soo qaado xogta Patient-ka
    if (order.patientId) {
      const pDoc = await getDoc(doc(db, "patients", order.patientId));
      if (pDoc.exists()) {
        const pData = pDoc.data();
        patientInfo.age = pData.age || patientInfo.age;
        patientInfo.gender = pData.gender || patientInfo.gender;
        patientInfo.doctor = pData.doctorName || pData.doctor || patientInfo.doctor;
        patientInfo.phone = pData.phone || pData.telephone || pData.phoneNo || "N/A";
      }
    }

    // 2. Soo qaado xogta Branch-ka ee isticmaalahan (Email & Location)
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
          // Haddii aad email-ka rabto inuu kasoo baxo database-ka, ka saar comment-ka hoose:
          // branchInfo.email = actualBranchData.email || HARDCODED_EMAIL;
        }
      }
    }

    // 3. Xisaabi alaabta (Items)
    if (order.items && order.items.length > 0) {
      itemsWithLivePrices = order.items.map(item => {
        const unitPrice = Number(item.unitPrice || item.price || 0);
        const qty = Number(item.quantity || 1);
        const subtotal = unitPrice * qty;
        subTotalSum += subtotal;
        return { ...item, unitPrice, subtotal };
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const discountAmount = Number(order.discount || order.discountAmount || 0);
  const finalGrandTotal = subTotalSum - discountAmount;

  const dateStr = new Date().toLocaleString('en-GB', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Fadlan ogolow Pop-ups");

  const htmlContent = `
    <html>
      <head>
        <title>Invoice - ${order.patientNameReport || 'Receipt'}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Arial', sans-serif;
            width: 72mm;
            margin: 0 auto;
            padding: 5mm 2mm;
            font-size: 13px;
            color: #000;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .bold { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          
          .header { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px; }
          .logo-text { font-size: 17px; font-weight: 900; }
          .contact-line { font-size: 11px; font-weight: 700; margin-top: 3px; }
          
          .receipt-title { 
            border: 2px solid #000; 
            padding: 4px; 
            margin: 10px 0; 
            font-size: 14px; 
            font-weight: 900; 
            text-align: center; 
          }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .info-table td { padding: 4px 0; font-size: 12px; vertical-align: top; }
          .label { font-weight: 900; width: 35%; }
          .val { font-weight: 700; }

          .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .items-table th { 
            text-align: left; 
            border-bottom: 2px solid #000; 
            padding: 5px 0; 
            font-size: 12px; 
            font-weight: 900;
          }
          .items-table td { padding: 8px 0; border-bottom: 1px dashed #ccc; font-size: 12px; }
          
          .summary-section { margin-top: 10px; border-top: 2px solid #000; padding-top: 5px; }
          .summary-row { display: flex; justify-content: space-between; padding: 3px 0; font-weight: 700; }
          
          .total-box { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-top: 8px; 
            padding: 10px 5px; 
            border: 2px solid #000;
          }
          .amount-big { font-size: 22px; font-weight: 900; }
          
          .footer { 
            margin-top: 20px; 
            text-align: center; 
            font-size: 11px; 
            font-weight: 700;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          .sig-line { margin-top: 35px; border-top: 1px solid #000; width: 60%; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="logo-text uppercase bold">${branchInfo.name}</div>
          <div class="contact-line">
            ${branchInfo.location.toUpperCase()}<br>
            TEL: ${branchInfo.phone}<br>
            EMAIL: ${branchInfo.email}
          </div>
        </div>

        <div class="receipt-title uppercase bold">Official Receipt</div>

        <table class="info-table">
          <tr><td class="label">DATE:</td><td class="val">${dateStr}</td></tr>
          <tr><td class="label">PATIENT:</td><td class="val uppercase">${order.patientNameReport || "N/A"}</td></tr>
          <tr><td class="label">PHONE:</td><td class="val">${patientInfo.phone}</td></tr>
          <tr><td class="label">AGE/SEX:</td><td class="val">${patientInfo.age}Y | ${patientInfo.gender}</td></tr>
          <tr><td class="label">DOCTOR:</td><td class="val uppercase">DR. ${patientInfo.doctor}</td></tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align:center;">QTY</th>
              <th style="text-align:right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithLivePrices.map(item => `
              <tr>
                <td class="uppercase bold">${item.medicineName || 'Item'}</td>
                <td style="text-align:center;" class="bold">${item.quantity}</td>
                <td style="text-align:right;" class="bold">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row">
            <span>SUBTOTAL:</span>
            <span>$${subTotalSum.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>DISCOUNT:</span>
            <span>$${discountAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="total-box">
          <span class="bold uppercase" style="font-size: 14px;">Total Paid</span>
          <span class="amount-big">$${finalGrandTotal.toFixed(2)}</span>
        </div>

        <div class="footer">
          <p class="uppercase bold">Thank you for your visit!</p>
          <div class="sig-line"></div>
          <p class="uppercase" style="margin-top: 5px;">Authorized Signature</p>
        </div>

        <script>
          window.onload = () => { 
            setTimeout(() => { 
              window.print(); 
              window.close(); 
            }, 600); 
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};