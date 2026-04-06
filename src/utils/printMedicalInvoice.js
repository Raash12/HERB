// src/utils/printMedicalInvoice.js
import { auth, db } from "../firebase"; 
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import logoImg from "../assets/logo.jpeg";

export const handlePrintMedicalInvoice = async (order) => {
  const HARDCODED_NAME = "HORSEED WATCH AND OPTICAL";
  const HARDCODED_EMAIL = "Daahirx81@gmail.com";

  let branchInfo = {
    name: HARDCODED_NAME,
    location: "Mogadishu, Somalia",
    phone: "615994202",
    email: HARDCODED_EMAIL
  };

  let patientInfo = {
    age: order.patientInfo?.age || "N/A",
    gender: order.patientInfo?.gender || "N/A",
    doctor: order.doctorName || "General"
  };

  let itemsWithLivePrices = [];
  let grandTotal = 0;

  try {
    // 1. Fetch Patient Info
    if (order.patientId) {
      const pDoc = await getDoc(doc(db, "patients", order.patientId));
      if (pDoc.exists()) {
        const pData = pDoc.data();
        patientInfo.age = pData.age || patientInfo.age;
        patientInfo.gender = pData.gender || patientInfo.gender;
        patientInfo.doctor = pData.doctorName || pData.doctor || patientInfo.doctor;
      }
    }

    // 2. Fetch Branch Info
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

    // 3. Fetch Live Prices
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        let livePrice = 0;
        if (item.medicineId) {
          const medRef = doc(db, "branch_medicines", item.medicineId);
          const medSnap = await getDoc(medRef);
          if (medSnap.exists()) {
            const medData = medSnap.data();
            const currentQty = Number(medData.quantity || 1);
            const currentTotalVal = Number(medData.price || 0);
            livePrice = currentTotalVal / (currentQty || 1);
          }
        }
        const qty = Number(item.quantity || 1);
        const subtotal = livePrice * qty;
        grandTotal += subtotal;
        itemsWithLivePrices.push({
          ...item,
          unitPrice: livePrice,
          subtotal: subtotal
        });
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
        <title>Invoice - ${order.patientNameReport}</title>
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
          }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .header { border-bottom: 2.5px solid #0b3b5f; padding-bottom: 12px; margin-bottom: 15px; }
          .logo-img { height: 58px; width: auto; margin-bottom: 6px; }
          .logo-text { font-size: 17px; font-weight: 800; color: #0b3b5f; }
          .contact-info { font-size: 9.5px; color: #475569; margin-top: 5px; }
          .receipt-title { background: #0b3b5f; color: white; padding: 8px 4px; margin: 15px 0; font-size: 13px; font-weight: 700; text-align: center; border-radius: 6px; }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
          .info-table td { padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
          .label { font-weight: 700; color: #64748b; width: 35%; }

          .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .items-table th { text-align: left; border-bottom: 1.5px solid #0b3b5f; padding: 5px 0; font-size: 10px; color: #0b3b5f; }
          .items-table td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          
          .unit-text { font-size: 10px; color: #1e2a3a; font-weight: 600; }

          .total-box { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 12px; background: #f1f5f9; border-left: 5px solid #0b3b5f; border-radius: 12px; }
          .amount-big { font-size: 22px; font-weight: 900; color: #0b3b5f; }
          .footer { margin-top: 25px; text-align: center; border-top: 1.5px dashed #e2e8f0; padding-top: 15px; }
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

        <div class="receipt-title uppercase">Official Medical Receipt</div>

        <table class="info-table">
          <tr><td class="label">Date:</td><td class="bold">${dateStr}</td></tr>
          <tr><td class="label">Patient:</td><td class="uppercase bold" style="color: #0b3b5f;">${order.patientNameReport}</td></tr>
          <tr><td class="label">Age/Sex:</td><td>${patientInfo.age}Y | ${patientInfo.gender}</td></tr>
          <tr><td class="label">Doctor:</td><td class="uppercase">DR. ${patientInfo.doctor}</td></tr>
          <tr><td class="label">Invoice:</td><td>#${order.id?.slice(-6).toUpperCase()}</td></tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>Medicine Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithLivePrices.map(item => {
              const unitPrice = Number(item.unitPrice || 0).toFixed(2);
              const subtotal = Number(item.subtotal || 0).toFixed(2);
              return `
                <tr>
                  <td class="bold uppercase" style="font-size: 9px; padding-top: 10px;">
                    ${item.medicineName}
                  </td>
                  <td style="text-align: center; vertical-align: bottom;">
                    ${item.quantity}
                  </td>
                  <td style="text-align: right; vertical-align: bottom;" class="unit-text">
                    1 x ${unitPrice}
                  </td>
                  <td style="text-align: right; vertical-align: bottom;" class="bold">
                    $${subtotal}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="total-box">
          <span class="bold uppercase">Total Paid</span>
          <span class="amount-big">$${grandTotal.toFixed(2)}</span>
        </div>

        <div class="footer">
          <p class="bold uppercase" style="color: #0b3b5f; font-size: 11px;">Thank you for choosing us!</p>
          <div style="margin-top: 20px; border-top: 1px solid #94a3b8; width: 60%; margin-left: auto; margin-right: auto;"></div>
          <p style="font-size: 9px; color: #64748b; margin-top: 4px; text-transform: uppercase;">Authorized Signature</p>
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