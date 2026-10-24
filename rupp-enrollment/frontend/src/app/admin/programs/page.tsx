"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, Badge, Card, Field, PageTitle, btnDanger, btnGhost, btnPrimary, inputCls } from "@/components/ui";

const emptyFac = { code: "", name: "", description: "" };
const emptyMajor = { code: "", name: "", facultyId: "", seats: "50", minGrade: "50", requirements: "", active: true };

export default function Programs() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [fac, setFac] = useState<any>(emptyFac);
  const [facId, setFacId] = useState<number | null>(null);
  const [maj, setMaj] = useState<any>(emptyMajor);
  const [majId, setMajId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => Promise.all([api("/admin/faculties"), api("/admin/majors")]).then(([f, m]) => { setFaculties(f); setMajors(m); });
  useEffect(() => { load(); }, []);

  async function act(fn: () => Promise<any>) {
    setError("");
    try { await fn(); await load(); } catch (e: any) { setError(e.message); }
  }
  const saveFac = (e: FormEvent) => { e.preventDefault(); act(async () => { await api(facId ? `/admin/faculties/${facId}` : "/admin/faculties", { method: facId ? "PUT" : "POST", body: fac }); setFac(emptyFac); setFacId(null); }); };
  const saveMaj = (e: FormEvent) => {
    e.preventDefault();
    act(async () => {
      await api(majId ? `/admin/majors/${majId}` : "/admin/majors", {
        method: majId ? "PUT" : "POST",
        body: { ...maj, facultyId: Number(maj.facultyId), seats: Number(maj.seats), minGrade: Number(maj.minGrade) },
      });
      setMaj(emptyMajor); setMajId(null);
    });
  };

  return (
    <>
      <PageTitle title="Faculties & majors" subtitle="Create and update academic programs, requirements and available seats." />
      <Alert>{error}</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={facId ? "Edit faculty" : "New faculty"}>
          <form onSubmit={saveFac} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Code"><input className={inputCls} required value={fac.code} onChange={(e) => setFac({ ...fac, code: e.target.value })} /></Field>
              <div className="col-span-2"><Field label="Name"><input className={inputCls} required value={fac.name} onChange={(e) => setFac({ ...fac, name: e.target.value })} /></Field></div>
            </div>
            <Field label="Description"><input className={inputCls} value={fac.description ?? ""} onChange={(e) => setFac({ ...fac, description: e.target.value })} /></Field>
            <div className="flex gap-2"><button className={btnPrimary}>{facId ? "Update" : "Add faculty"}</button>{facId && <button type="button" className={btnGhost} onClick={() => { setFac(emptyFac); setFacId(null); }}>Cancel</button>}</div>
          </form>
          <ul className="mt-5 divide-y divide-slate-100 text-sm">
            {faculties.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <span><b>{f.code}</b> · {f.name}</span>
                <span className="flex gap-2">
                  <button className={btnGhost} onClick={() => { setFacId(f.id); setFac({ code: f.code, name: f.name, description: f.description }); }}>Edit</button>
                  <button className={btnDanger} onClick={() => confirm("Delete this faculty?") && act(() => api(`/admin/faculties/${f.id}`, { method: "DELETE" }))}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={majId ? "Edit major" : "New major"}>
          <form onSubmit={saveMaj} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Code"><input className={inputCls} required value={maj.code} onChange={(e) => setMaj({ ...maj, code: e.target.value })} /></Field>
              <div className="col-span-2"><Field label="Name"><input className={inputCls} required value={maj.name} onChange={(e) => setMaj({ ...maj, name: e.target.value })} /></Field></div>
            </div>
            <Field label="Faculty">
              <select className={inputCls} required value={maj.facultyId} onChange={(e) => setMaj({ ...maj, facultyId: e.target.value })}>
                <option value="">Select…</option>{faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Available seats"><input className={inputCls} type="number" min={0} value={maj.seats} onChange={(e) => setMaj({ ...maj, seats: e.target.value })} /></Field>
              <Field label="Min. high-school grade (%)"><input className={inputCls} type="number" min={0} max={100} value={maj.minGrade} onChange={(e) => setMaj({ ...maj, minGrade: e.target.value })} /></Field>
            </div>
            <Field label="Requirements"><textarea className={inputCls} rows={2} value={maj.requirements ?? ""} onChange={(e) => setMaj({ ...maj, requirements: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={maj.active} onChange={(e) => setMaj({ ...maj, active: e.target.checked })} /> Open for applications</label>
            <div className="flex gap-2"><button className={btnPrimary}>{majId ? "Update" : "Add major"}</button>{majId && <button type="button" className={btnGhost} onClick={() => { setMaj(emptyMajor); setMajId(null); }}>Cancel</button>}</div>
          </form>
        </Card>
      </div>

      <Card className="mt-6" title="All majors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Code</th><th>Major</th><th>Faculty</th><th>Seats</th><th>Min grade</th><th>State</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {majors.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 font-semibold">{m.code}</td><td>{m.name}</td><td>{m.faculty?.name}</td><td>{m.seats}</td><td>{m.minGrade}%</td>
                  <td><Badge value={m.active ? "ELIGIBLE" : "DRAFT"} /></td>
                  <td className="space-x-2 text-right">
                    <button className={btnGhost} onClick={() => { setMajId(m.id); setMaj({ code: m.code, name: m.name, facultyId: String(m.faculty.id), seats: String(m.seats), minGrade: String(m.minGrade), requirements: m.requirements, active: m.active }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                    <button className={btnDanger} onClick={() => confirm("Delete this major?") && act(() => api(`/admin/majors/${m.id}`, { method: "DELETE" }))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
