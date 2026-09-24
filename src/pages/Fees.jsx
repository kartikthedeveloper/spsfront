import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Plus, Receipt, Pencil, Trash2, Eye, X, Search, Filter, RefreshCw,
  University, Banknote, Wallet, TrendingUp, AlertCircle, CheckCircle2,
  Download, Calendar, User, CreditCard
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { PageHeader, Badge, EmptyState } from '../components/ui';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const modes = { cash:'Cash', upi:'UPI', bank_transfer:'Bank Transfer' };
const money = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const initialStudentPayment = { studentId:'', amountPaid:'', paymentMode:'cash', transactionRef:'', remarks:'', installmentLabel:'' };
const initialUniversityPayment = { studentId:'', amountPaid:'', paymentMode:'bank_transfer', transactionRef:'', remarks:'' };

export default function Fees() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState([]);
  const [payments, setPayments] = useState([]);
  const [universityPayments, setUniversityPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [feeDashboard, setFeeDashboard] = useState(null);
  const [filters, setFilters] = useState({search:'',branch:'',course:'',mode:'',from:'',to:''});
  const [studentModal, setStudentModal] = useState({open:false,mode:'create',data:null});
  const [universityModal, setUniversityModal] = useState({open:false,mode:'create',data:null});
  const [detail, setDetail] = useState(null);
  const [studentForm, setStudentForm] = useState(initialStudentPayment);
  const [universityForm, setUniversityForm] = useState(initialUniversityPayment);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p,u,pay,s,c,b,d] = await Promise.all([
        api.get('/fees/pending'),
        api.get('/fees/university-payments'),
        api.get('/fees/payments'),
        api.get('/students',{params:{limit:100}}),
        api.get('/academics/courses'),
        api.get('/branches'),
        api.get('/fees/dashboard')
      ]);
      setPending(p.data.pendingFees || []);
      setUniversityPayments(u.data.payments || []);
      setPayments(pay.data.payments || []);
      setStudents(s.data.students || []);
      setCourses(c.data.courses || []);
      setBranches(b.data.branches || []);
      setFeeDashboard(d.data.dashboard || null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load fee data');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const courseName = c => typeof c === 'object' ? c?.name : courses.find(x=>x._id===c)?.name || '—';
  const branchName = b => typeof b === 'object' ? b?.name : branches.find(x=>x._id===b)?.name || '—';
  const studentName = s => typeof s === 'object' ? s?.name : students.find(x=>x._id===s)?.name || '—';

  const matches = item => {
    const st = item.student || {};
    const name = (st.name || '').toLowerCase();
    const admission = (st.admissionId || '').toLowerCase();
    const q = filters.search.toLowerCase();
    const branch = item.branch?._id || st.branch?._id || item.branch;
    const course = item.course?._id || st.course?._id || item.course;
    return (!q || name.includes(q) || admission.includes(q))
      && (!filters.branch || branch === filters.branch)
      && (!filters.course || course === filters.course)
      && (!filters.mode || item.paymentMode === filters.mode)
      && (!filters.from || new Date(item.paymentDate) >= new Date(filters.from))
      && (!filters.to || new Date(item.paymentDate) <= new Date(`${filters.to}T23:59:59`));
  };

  const filteredPending = useMemo(() => pending.filter(matches), [pending,filters]);
  const filteredPayments = useMemo(() => payments.filter(matches), [payments,filters]);
  const filteredUniversity = useMemo(() => universityPayments.filter(matches), [universityPayments,filters]);

  const studentTotal = filteredPayments.reduce((a,p)=>a+Number(p.amountPaid||0),0);
  const universityTotal = filteredUniversity.reduce((a,p)=>a+Number(p.amountPaid||0),0);

  const resetFilters = () => setFilters({search:'',branch:'',course:'',mode:'',from:'',to:''});

  const openStudentPayment = (mode='create', data=null) => {
    setStudentForm(mode==='create' ? {...initialStudentPayment} : {
      studentId:data.student?._id || data.student || '',
      amountPaid:data.amountPaid || '',
      paymentMode:data.paymentMode || 'cash',
      transactionRef:data.transactionRef || '',
      remarks:data.remarks || '',
      installmentLabel:data.installmentLabel || ''
    });
    setStudentModal({open:true,mode,data});
  };

  const saveStudentPayment = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (studentModal.mode==='create') {
        const r=await api.post('/fees/payments',studentForm);
        toast.success('Student payment recorded');
        if (r.data?.payment) downloadReceipt(r.data.payment);
      } else {
        const payload={remarks:studentForm.remarks,transactionRef:studentForm.transactionRef,installmentLabel:studentForm.installmentLabel};
        if(user.role==='admin'){payload.amountPaid=studentForm.amountPaid;payload.paymentMode=studentForm.paymentMode;}
        await api.patch(`/fees/payments/${studentModal.data._id}`,payload);
        toast.success('Student payment updated');
      }
      setStudentModal({open:false,mode:'create',data:null}); await load();
    } catch(e){toast.error(e.response?.data?.message || 'Could not save student payment');}
    finally{setSaving(false);}
  };

  const openUniversityPayment = (mode='create', data=null) => {
    setUniversityForm(mode==='create' ? {...initialUniversityPayment} : {
      studentId:data.student?._id || data.student || '',
      amountPaid:data.amountPaid || '',
      paymentMode:data.paymentMode || 'bank_transfer',
      transactionRef:data.transactionRef || '',
      remarks:data.remarks || ''
    });
    setUniversityModal({open:true,mode,data});
  };

  const saveUniversityPayment = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if(universityModal.mode==='create'){
        await api.post('/fees/university-payments',universityForm);
        toast.success('University payment recorded');
      } else {
        const payload={transactionRef:universityForm.transactionRef,remarks:universityForm.remarks};
        if(user.role==='admin'){
          payload.amountPaid=universityForm.amountPaid;
          payload.paymentMode=universityForm.paymentMode;
        }
        await api.patch(`/fees/university-payments/${universityModal.data._id}`,payload);
        toast.success('University payment updated');
      }
      setUniversityModal({open:false,mode:'create',data:null}); await load();
    }catch(e){toast.error(e.response?.data?.message || 'Could not save university payment');}
    finally{setSaving(false);}
  };

  const deleteUniversity = async id => {
    if(user.role!=='admin' || !window.confirm('Delete this university payment?')) return;
    try { await api.delete(`/fees/university-payments/${id}`); toast.success('University payment deleted'); load(); }
    catch(e){toast.error(e.response?.data?.message || 'Could not delete payment');}
  };

  const deleteStudentPayment = async id => {
    if(user.role!=='admin' || !window.confirm('Delete this student payment?')) return;
    try { await api.delete(`/fees/payments/${id}`); toast.success('Student payment deleted'); load(); }
    catch(e){toast.error(e.response?.data?.message || 'Could not delete payment');}
  };

  const viewStudent = async student => {
    try {
      const r=await api.get(`/fees/student/${student?._id || student}`);
      setDetail(r.data);
    } catch(e){toast.error(e.response?.data?.message || 'Could not load fee details');}
  };

  const downloadReceipt = payment => {
    try {
      const doc=new jsPDF();
      const st=payment.student || {};
      doc.setFontSize(18); doc.text('SUCCESS POINT SIKAR',105,20,{align:'center'});
      doc.setFontSize(11); doc.text('Student Fee Payment Receipt',105,28,{align:'center'});
      autoTable(doc,{startY:38,head:[['Field','Details']],body:[
        ['Receipt No.',payment.receiptNumber || '—'],
        ['Student',st.name || '—'],
        ['Admission ID',st.admissionId || '—'],
        ['Course',st.course?.name || courseName(st.course)],
        ['Amount',money(payment.amountPaid)],
        ['Payment Mode',modes[payment.paymentMode] || payment.paymentMode],
        ['Date',payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '—'],
        ['Transaction Ref',payment.transactionRef || '—'],
        ['Installment',payment.installmentLabel || '—']
      ]});
      doc.save(`SuccessPoint_Receipt_${payment.receiptNumber || payment._id}.pdf`);
    } catch(e){toast.error('Could not generate receipt');}
  };

  const selectedStudent = id => students.find(s=>s._id===id);
  const selectedForUni = selectedStudent(universityForm.studentId);
  const selectedUniPending = selectedForUni ? Math.max(Number(selectedForUni.universityFee||0) - universityPayments.filter(p=>(p.student?._id||p.student)===selectedForUni._id).reduce((a,p)=>a+Number(p.amountPaid||0),0),0) : null;

  return (
    <AppShell title="Fees">
      <div className="space-y-5">
        <PageHeader title="Fees & Payments" description="Manage student collections, university payments and fee balances." />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Student Collection" value={money(feeDashboard?.totalStudentCollected)} icon={Banknote}/>
          <Metric label="University Paid" value={money(feeDashboard?.totalUniversityPaid)} icon={University}/>
          <Metric label="Student Pending" value={money(feeDashboard?.totalStudentPending)} icon={Wallet} danger/>
          <Metric label="University Pending" value={money(feeDashboard?.totalUniversityPending)} icon={AlertCircle} danger/>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-2 flex flex-wrap gap-1">
          {[
            ['pending','Pending Fees'],['payments','Student Payments'],['university','University Payments']
          ].map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${tab===key?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}
          <button onClick={load} className="ml-auto p-2.5 rounded-xl text-slate-500 hover:bg-slate-50"><RefreshCw size={16} className={loading?'animate-spin':''}/></button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2"><label className="text-xs font-semibold text-slate-500">Search</label><input className="input mt-1 w-full" placeholder="Student / Admission ID" value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})}/></div>
            <Select label="Branch" value={filters.branch} onChange={v=>setFilters({...filters,branch:v})} options={branches}/>
            <Select label="Course" value={filters.course} onChange={v=>setFilters({...filters,course:v})} options={courses}/>
            {(tab==='payments'||tab==='university') && <Select label="Payment Mode" value={filters.mode} onChange={v=>setFilters({...filters,mode:v})} options={Object.entries(modes).map(([value,name])=>({_id:value,name}))}/>}
            <button onClick={resetFilters} className="h-10 self-end rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 flex items-center justify-center gap-2"><X size={14}/>Clear</button>
          </div>
          {(tab==='payments'||tab==='university') && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3"><DateField label="From" value={filters.from} onChange={v=>setFilters({...filters,from:v})}/><DateField label="To" value={filters.to} onChange={v=>setFilters({...filters,to:v})}/></div>}
        </div>

        {tab==='pending' && <PendingTable data={filteredPending} money={money} onView={viewStudent}/>}
        {tab==='payments' && <PaymentTable data={filteredPayments} total={studentTotal} money={money} onAdd={()=>openStudentPayment()} onEdit={p=>openStudentPayment('edit',p)} onDelete={deleteStudentPayment} onReceipt={downloadReceipt}/>}
        {tab==='university' && <UniversityTable data={filteredUniversity} total={universityTotal} money={money} canManage={['admin','branch_manager'].includes(user.role)} onAdd={()=>openUniversityPayment()} onEdit={p=>openUniversityPayment('edit',p)} onDelete={deleteUniversity}/>}
      </div>

      {studentModal.open && <PaymentModal title={studentModal.mode==='create'?'Record Student Payment':'Edit Student Payment'} form={studentForm} setForm={setStudentForm} students={students} saving={saving} onClose={()=>setStudentModal({open:false,mode:'create',data:null})} onSubmit={saveStudentPayment}/>}
      {universityModal.open && <UniversityModal title={universityModal.mode==='create'?'Record University Payment':'Edit University Payment'} form={universityForm} setForm={setUniversityForm} students={students} saving={saving} user={user} pending={selectedUniPending} onClose={()=>setUniversityModal({open:false,mode:'create',data:null})} onSubmit={saveUniversityPayment}/>}
      {detail && <DetailModal data={detail} money={money} onClose={()=>setDetail(null)}/>}
    </AppShell>
  );
}

function Metric({label,value,icon:Icon,danger}){return <div className="rounded-2xl bg-white border border-slate-200 p-4"><div className={`h-9 w-9 rounded-xl flex items-center justify-center ${danger?'bg-rose-50 text-rose-500':'bg-slate-100 text-slate-600'}`}><Icon size={16}/></div><p className="text-xs text-slate-500 mt-3">{label}</p><p className={`text-lg font-bold mt-1 ${danger?'text-rose-600':'text-slate-900'}`}>{value}</p></div>}
function Select({label,value,onChange,options}){return <div><label className="text-xs font-semibold text-slate-500">{label}</label><select className="input mt-1 w-full" value={value} onChange={e=>onChange(e.target.value)}><option value="">All</option>{options.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}</select></div>}
function DateField({label,value,onChange}){return <div><label className="text-xs font-semibold text-slate-500">{label}</label><input type="date" className="input mt-1 w-full" value={value} onChange={e=>onChange(e.target.value)}/></div>}

function PendingTable({data,money,onView}){
 return <TableShell title="Pending Fee & University Liability" count={data.length}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-400 border-b"><th className="p-3">Student</th><th className="p-3">Net Fee</th><th className="p-3">Student Paid</th><th className="p-3">Student Pending</th><th className="p-3">University Fee</th><th className="p-3">University Paid</th><th className="p-3">University Pending</th><th className="p-3"></th></tr></thead><tbody>{data.map(x=><tr key={x.student?._id} className="border-b last:border-0 hover:bg-slate-50"><td className="p-3"><p className="font-semibold">{x.student?.name}</p><p className="text-[11px] text-slate-400">{x.student?.admissionId}</p></td><td className="p-3">{money(x.netFee)}</td><td className="p-3">{money(x.studentPaid)}</td><td className="p-3 text-rose-600 font-semibold">{money(x.studentPending)}</td><td className="p-3">{money(x.universityFee)}</td><td className="p-3">{money(x.universityPaid)}</td><td className="p-3 text-rose-600 font-semibold">{money(x.universityPending)}</td><td className="p-3"><button onClick={()=>onView(x.student)} className="p-2 rounded-lg hover:bg-slate-100"><Eye size={15}/></button></td></tr>)}</tbody></table>{!data.length&&<EmptyState title="No pending fees" description="All current fee balances are clear."/>}</div></TableShell>
}
function PaymentTable({data,total,money,onAdd,onEdit,onDelete,onReceipt}){
 return <TableShell title="Student Payment History" count={`${data.length} • ${money(total)}`}><div className="flex justify-end p-3 border-b"><button className="btn-primary flex items-center gap-2" onClick={onAdd}><Plus size={15}/>Record Payment</button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-400 border-b"><th className="p-3">Receipt</th><th className="p-3">Student</th><th className="p-3">Amount</th><th className="p-3">Mode</th><th className="p-3">Date</th><th className="p-3">Actions</th></tr></thead><tbody>{data.map(p=><tr key={p._id} className="border-b last:border-0"><td className="p-3 font-semibold">{p.receiptNumber||'—'}</td><td className="p-3">{p.student?.name}<div className="text-[11px] text-slate-400">{p.student?.admissionId}</div></td><td className="p-3 font-bold">{money(p.amountPaid)}</td><td className="p-3">{modes[p.paymentMode]||p.paymentMode}</td><td className="p-3">{p.paymentDate?new Date(p.paymentDate).toLocaleDateString('en-IN'):'—'}</td><td className="p-3 flex gap-1"><button onClick={()=>onReceipt(p)} className="p-2 hover:bg-slate-100 rounded-lg"><Download size={14}/></button></td></tr>)}</tbody></table>{!data.length&&<EmptyState title="No payments found" description="Student collections will appear here."/>}</div></TableShell>
}
function UniversityTable({data,total,money,canManage,onAdd,onEdit,onDelete}){
 return <TableShell title="University Payments" count={`${data.length} • ${money(total)}`}><div className="flex justify-end p-3 border-b">{canManage && <button onClick={onAdd} className="btn-primary flex items-center gap-2"><Plus size={15}/>Pay University</button>}</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-400 border-b"><th className="p-3">Payment No.</th><th className="p-3">Student</th><th className="p-3">Amount Paid</th><th className="p-3">Mode</th><th className="p-3">Date</th><th className="p-3">Paid By</th><th className="p-3">Actions</th></tr></thead><tbody>{data.map(p=><tr key={p._id} className="border-b last:border-0"><td className="p-3 font-semibold">{p.paymentNumber||'—'}</td><td className="p-3">{p.student?.name}<div className="text-[11px] text-slate-400">{p.student?.admissionId}</div></td><td className="p-3 font-bold">{money(p.amountPaid)}</td><td className="p-3">{modes[p.paymentMode]||p.paymentMode}</td><td className="p-3">{p.paymentDate?new Date(p.paymentDate).toLocaleDateString('en-IN'):'—'}</td><td className="p-3">{p.paidBy?.name||'—'}</td><td className="p-3 flex gap-1">{canManage && <button onClick={()=>onEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil size={14}/></button>}{canManage && <button onClick={()=>onDelete(p._id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"><Trash2 size={14}/></button>}</td></tr>)}</tbody></table>{!data.length&&<EmptyState title="No university payments" description="Payments made to university will appear here."/>}</div></TableShell>
}
function TableShell({title,count,children}){return <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden"><div className="p-4 border-b flex items-center justify-between"><div><h3 className="font-bold text-slate-900">{title}</h3><p className="text-[11px] text-slate-400 mt-0.5">{count}</p></div></div>{children}</div>}

function PaymentModal({title,form,setForm,students,saving,onClose,onSubmit}){
 return <Modal open={true} title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4">
  <Field label="Student"><select required className="input w-full" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})}><option value="">Select student</option>{students.map(s=><option key={s._id} value={s._id}>{s.name} — {s.admissionId}</option>)}</select></Field>
  <div className="grid grid-cols-2 gap-3"><Field label="Amount (₹)"><input required min="1" type="number" className="input w-full" value={form.amountPaid} onChange={e=>setForm({...form,amountPaid:e.target.value})}/></Field><Field label="Payment Mode"><select className="input w-full" value={form.paymentMode} onChange={e=>setForm({...form,paymentMode:e.target.value})}>{Object.entries(modes).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></div>
  <div className="grid grid-cols-2 gap-3"><Field label="Installment"><input className="input w-full" value={form.installmentLabel} onChange={e=>setForm({...form,installmentLabel:e.target.value})}/></Field><Field label="Transaction Ref"><input className="input w-full" value={form.transactionRef} onChange={e=>setForm({...form,transactionRef:e.target.value})}/></Field></div>
  <Field label="Remarks"><textarea className="input w-full min-h-20" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></Field>
  <ModalButtons onClose={onClose} saving={saving}/>
 </form></Modal>
}
function UniversityModal({title,form,setForm,students,saving,user,pending,onClose,onSubmit}){
 return <Modal open={true} title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4">
  <Field label="Student"><select required disabled={title.startsWith('Edit')} className="input w-full" value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})}><option value="">Select student</option>{students.map(s=><option key={s._id} value={s._id}>{s.name} — {s.admissionId} (University: {money(s.universityFee)})</option>)}</select></Field>
  {pending !== null && <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-sm">University pending for selected student: <b>{money(pending)}</b></div>}
  <div className="grid grid-cols-2 gap-3"><Field label="Amount (₹)"><input required min="1" max={pending||undefined} type="number" className="input w-full" value={form.amountPaid} onChange={e=>setForm({...form,amountPaid:e.target.value})}/></Field><Field label="Payment Mode"><select className="input w-full" value={form.paymentMode} onChange={e=>setForm({...form,paymentMode:e.target.value})}>{Object.entries(modes).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></div>
  <Field label="Transaction Ref"><input className="input w-full" value={form.transactionRef} onChange={e=>setForm({...form,transactionRef:e.target.value})}/></Field>
  <Field label="Remarks"><textarea className="input w-full min-h-20" value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></Field>
  {user.role!=='admin' && title.startsWith('Edit') && <p className="text-xs text-slate-400">Only admin can change the amount or payment mode after recording.</p>}
  <ModalButtons onClose={onClose} saving={saving}/>
 </form></Modal>
}
function Field({label,children}){return <div><label className="text-xs font-semibold text-slate-600">{label}</label><div className="mt-1">{children}</div></div>}
function ModalButtons({onClose,saving}){return <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={onClose} className="btn-outline">Cancel</button><button disabled={saving} className="btn-primary">{saving?'Saving…':'Save'}</button></div>}
function DetailModal({data,money,onClose}){
 const f=data.fee||{}, sp=data.studentPayment||{}, up=data.universityPayment||{}, ins=data.institute||{};
 return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onMouseDown={onClose}><div className="bg-white rounded-2xl w-full max-w-2xl p-5" onMouseDown={e=>e.stopPropagation()}><div className="flex justify-between"><div><h3 className="font-bold text-lg">{data.student?.name}</h3><p className="text-xs text-slate-400">{data.student?.admissionId}</p></div><button onClick={onClose}><X size={18}/></button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">{[['Total Fee',f.totalFee],['Discount',f.discount],['Net Fee',f.netFee],['University Fee',f.universityFee],['Student Paid',sp.paid],['Student Pending',sp.pending],['University Paid',up.paid],['University Pending',up.pending],['Institute Expected',ins.expected],['Institute Received',ins.received]].map(([l,v])=><div key={l} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">{l}</p><p className="font-bold mt-1">{money(v)}</p></div>)}</div></div></div>
}
