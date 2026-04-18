import { auth, db } from "../firebase"; 
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import logoImg from "../assets/logo.jpeg";

export const handlePrintMedicalInvoice = async (order) => {
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
  if (!printWindow) return alert("Fadlan ogolow Pop-ups (Allow Pop-ups)");

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
            padding: 5mm;
            font-size: 11px;
            color: #1e2a3a;
          }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .header { border-bottom: 2px solid #0b3b5f; padding-bottom: 10px; margin-bottom: 10px; }
          .logo-img { height: 50px; width: auto; margin-bottom: 5px; }
          .logo-text { font-size: 16px; font-weight: 800; color: #0b3b5f; }
          .receipt-title { background: #0b3b5f; color: white; padding: 6px; margin: 10px 0; font-size: 12px; font-weight: 700; text-align: center; border-radius: 4px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
          .info-table td { padding: 3px 0; border-bottom: 1px solid #f1f5f9; }
          .label { font-weight: 700; color: #64748b; width: 30%; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .items-table th { text-align: left; border-bottom: 1px solid #0b3b5f; padding: 5px 0; font-size: 10px; }
          .items-table td { padding: 7px 0; border-bottom: 1px dashed #e2e8f0; }
          .summary-section { margin-top: 15px; border-top: 1px solid #0b3b5f; padding-top: 5px; }
          .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
          .total-box { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-top: 10px; padding: 10px; background: #f1f5f9; 
            border-left: 5px solid #0b3b5f; border-radius: 6px; 
          }
          .amount-big { font-size: 18px; font-weight: 900; color: #0b3b5f; }
          .footer { margin-top: 20px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <img src="${window.location.origin}${logoImg}" class="logo-img" onerror="this.style.display='none'">
          <div class="logo-text uppercase">${branchInfo.name}</div>
          <div style="font-size: 9px;">
            ${branchInfo.location}<br>
            Tel: ${branchInfo.phone} | Email: ${HARDCODED_EMAIL}
          </div>
        </div>

        <div class="receipt-title uppercase">Official Receipt</div>

        <table class="info-table">
          <tr><td class="label">Date:</td><td class="bold">${dateStr}</td></tr>
          <tr><td class="label">Patient:</td><td class="uppercase bold">${order.patientNameReport}</td></tr>
          <tr><td class="label">Phone:</td><td>${patientInfo.phone}</td></tr>
          <tr><td class="label">Age/Sex:</td><td>${patientInfo.age}Y | ${patientInfo.gender}</td></tr>
          <tr><td class="label">Doctor:</td><td class="uppercase">DR. ${patientInfo.doctor}</td></tr>
        </table>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithLivePrices.map(item => `
              <tr>
                <td class="uppercase bold" style="font-size: 9px;">${item.medicineName}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;" class="bold">$${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subTotalSum.toFixed(2)}</span>
          </div>
          <div class="summary-row" style="color: #1e2a3a;">
            <span>Discount:</span>
            <span>$${discountAmount.toFixed(2)}</span>
          </div>
        </div>

        <div class="total-box">
          <span class="bold uppercase">Total Paid</span>
          <span class="amount-big">$${finalGrandTotal.toFixed(2)}</span>
        </div>

        <div class="footer">
          <p class="bold uppercase">Thank you for your visit!</p>
          <div style="margin-top: 15px; border-top: 1px solid #94a3b8; width: 50%; margin:auto;"></div>
          <p>Authorized Signature</p>
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