import { handlePrintMedical } from "./printMedical";

export const executeMedicalPrint = (order, branchData) => {
  if (!order) return alert("Order data is missing!");

  // SAFE MAPPING: Checks multiple possible field names
  const patientInfo = {
    name: order.patientName || order.fullName || order.patientInfo?.name || "Guest Patient",
    age: order.age || order.patientInfo?.age || "N/A",
    gender: order.gender || order.patientInfo?.gender || "N/A",
    address: order.address || order.location || order.patientInfo?.address || "N/A"
  };

  const branchInfo = {
    name: branchData?.name || "HORSEED OPTICAL/MEDICAL",
    phone: branchData?.phone || branchData?.telephone || "N/A",
    location: branchData?.location || "Mogadishu, Somalia"
  };

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Please allow pop-ups!");

  // Pass the data to the HTML generator
  const html = handlePrintMedical(order, branchInfo, patientInfo);
  
  printWindow.document.write(html);
  printWindow.document.close();
};