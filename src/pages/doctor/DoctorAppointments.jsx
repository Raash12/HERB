// src/pages/dashboard/doctor/DoctorAppointments.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// UI
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Icons
import { Loader2, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export default function DoctorAppointments() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = patients.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const start = (currentPage - 1) * recordsPerPage;
  const current = filtered.slice(start, start + recordsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Patients</h2>

        <Input
          placeholder="Search..."
          className="w-64"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell className="text-center">Action</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {current.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.fullName}</TableCell>
                <TableCell>{p.age}</TableCell>
                <TableCell>{p.gender}</TableCell>

                <TableCell>
                  <Badge className={p.status === "completed" ? "bg-green-500" : "bg-orange-500"}>
                    {p.status}
                  </Badge>
                </TableCell>

                {/* ✅ OPEN BUTTON */}
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/doctor/prescription/${p.id}`)}
                  >
                    <Eye size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <CardFooter className="flex justify-between p-4">
          <Button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} /> Prev
          </Button>

          <span>{currentPage} / {totalPages || 1}</span>

          <Button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight size={16} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}