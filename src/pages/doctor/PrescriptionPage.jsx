// src/pages/doctor/PrescriptionPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Sun, Glasses, Activity } from "lucide-react";

export default function PrescriptionPage() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [receptions, setReceptions] = useState([]);
  const [selectedReception, setSelectedReception] = useState("");
  const [loading, setLoading] = useState(false);

  const [values, setValues] = useState({
    RE: { sph: "", cyl: "", axis: "" },
    LE: { sph: "", cyl: "", axis: "" },
  });

  const [options, setOptions] = useState({
    distance: false,
    near: false,
    bifocal: false,
    progressive: false,
    singleVision: false,
    photoBrown: false,
    photoGrey: false,
    white: false,
    sunglasses: false,
    blueCut: false,
    highIndex: false,
    plasticCr39: false,
    crookesB1: false,
    crookesB2: false,
    halfEye: false,
    contactLenses: false,
    kaPto: false,
  });

  // ✅ FETCH PATIENT + RECEPTION USERS (SAME BRANCH)
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "patients", id));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setPatient(data);

        // 🔁 STATUS → doctor
        await updateDoc(doc(db, "patients", id), {
          status: "doctor",
        });

        // ✅ GET RECEPTIONS IN SAME BRANCH
        const q = query(
          collection(db, "users"),
          where("role", "==", "reception"),
          where("branch", "==", data.branch)
        );

        const res = await getDocs(q);
        setReceptions(res.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    };

    fetch();
  }, [id]);

  // ✅ SAVE + SEND TO SELECTED RECEPTION
  const handleSave = async () => {
    if (!selectedReception) {
      alert("Select reception");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "prescriptions"), {
        patientId: patient.id,
        branch: patient.branch,
        doctorId: patient.doctorId,
        doctorName: patient.doctorName,
        sendTo: selectedReception,
        values,
        options,
        createdAt: new Date(),
      });

      await updateDoc(doc(db, "patients", patient.id), {
        status: "completed",
        sendTo: selectedReception,
      });

      alert("Sent to reception ✅");
    } catch (err) {
      console.error(err);
      alert("Error sending prescription");
    }

    setLoading(false);
  };

  if (!patient) return <p className="text-center mt-8">Loading patient info...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <Eye size={24} /> Prescription for {patient.fullName}
      </h1>

      <Card>
        <CardContent className="space-y-6">

          {/* PATIENT INFO */}
          <div className="bg-muted p-4 rounded-lg grid grid-cols-2 gap-2 text-sm">
            <p><strong>Name:</strong> {patient.fullName}</p>
            <p><strong>Age:</strong> {patient.age}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Phone:</strong> {patient.phone}</p>
            <p><strong>District:</strong> {patient.address}</p>
            <p><strong>Doctor:</strong> Dr. {patient.doctorName}</p>
          </div>

          {/* SELECT RECEPTION */}
          <div>
            <label className="text-sm font-bold">Send To Reception</label>
            <select
              className="w-full border p-2 rounded-md mt-1"
              value={selectedReception}
              onChange={(e) => setSelectedReception(e.target.value)}
            >
              <option value="">Select Reception</option>
              {receptions.map((r) => (
                <option key={r.id} value={r.id}>{r.fullName}</option>
              ))}
            </select>
          </div>

          {/* OPTIONS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {[
              { key: "distance", label: "Distance", icon: Activity },
              { key: "near", label: "Near", icon: Activity },
              { key: "bifocal", label: "Bifocal", icon: Glasses },
              { key: "progressive", label: "Progressive", icon: Glasses },
              { key: "singleVision", label: "Single Vision", icon: Eye },
              { key: "photoBrown", label: "Photo Brown", icon: Sun },
              { key: "photoGrey", label: "Photo Grey", icon: Sun },
              { key: "white", label: "White", icon: Eye },
              { key: "sunglasses", label: "Sunglasses", icon: Sun },
              { key: "blueCut", label: "Blue Cut", icon: Eye },
              { key: "highIndex", label: "High Index", icon: Eye },
              { key: "plasticCr39", label: "Plastic CR-39", icon: Eye },
              { key: "crookesB1", label: "Crookes B1", icon: Glasses },
              { key: "crookesB2", label: "Crookes B2", icon: Glasses },
              { key: "halfEye", label: "Half Eye", icon: Eye },
              { key: "contactLenses", label: "Contact Lenses", icon: Eye },
              { key: "kaPto", label: "Ka/Pto", icon: Eye },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-2 border p-2 rounded-lg">
                <Checkbox
                  checked={options[key]}
                  onCheckedChange={() => setOptions({ ...options, [key]: !options[key] })}
                />
                <Icon size={14} />
                {label}
              </label>
            ))}
          </div>

          {/* EYES */}
          <div className="grid md:grid-cols-2 gap-4">
            {["RE", "LE"].map((eye) => (
              <div key={eye} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-center">{eye}</h3>
                <Input
                  placeholder="SPH"
                  value={values[eye].sph}
                  onChange={(e) =>
                    setValues({ ...values, [eye]: { ...values[eye], sph: e.target.value } })
                  }
                />
                <Input
                  placeholder="CYL"
                  value={values[eye].cyl}
                  onChange={(e) =>
                    setValues({ ...values, [eye]: { ...values[eye], cyl: e.target.value } })
                  }
                />
                <Input
                  placeholder="AXIS"
                  value={values[eye].axis}
                  onChange={(e) =>
                    setValues({ ...values, [eye]: { ...values[eye], axis: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>

          {/* SAVE BUTTON */}
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Prescription"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}