'use client'
import { useState } from 'react'
import { FranchiseApplicationsAPI } from '@/lib/api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import SiteHeader from '@/app/components/shared/Header'
import SiteFooter from '@/app/components/shared/Footer'

const emptyForm = { applicant_name:'', applicant_email:'', applicant_phone:'', proposed_city:'', proposed_state:'', proposed_country:'India', business_experience:'', notes:'' }

export default function FranchiseApplyPage() {
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.applicant_name.trim() || !form.applicant_email.trim() || !form.proposed_city.trim()) {
      setError('Name, email, and proposed city are required'); return
    }
    setSaving(true); setError('')
    try {
      await FranchiseApplicationsAPI.submit(form)
      setSubmitted(true)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (submitted) {
    return (
      <div>
        <SiteHeader />
        <div style={{minHeight:'60vh',background:'var(--nx-warm-white)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:20,textAlign:'center'}}>
          <div style={{fontSize:48}}><FontAwesomeIcon icon={faCircleCheck} className="text-green"/></div>
          <h1 style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:800,color:'var(--nx-navy)'}}>Application Received</h1>
          <p style={{fontSize:14,color:'#6b7280',maxWidth:400}}>Our team will review your application and reach out at {form.applicant_email} once a decision is made.</p>
          <a href="/" style={{fontSize:13,color:'var(--nx-blue)'}}><FontAwesomeIcon icon={faArrowLeft} className="mr-1"/>Back to NetworkX</a>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div>
      <SiteHeader />
      <div style={{minHeight:'70vh',background:'var(--nx-warm-white)',padding:'40px 20px',display:'flex',justifyContent:'center'}}>
        <div style={{maxWidth:520,width:'100%'}}>
          <div style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:18,marginBottom:8,color:'var(--nx-navy)'}}>
            Network<span style={{color:'var(--nx-orange)'}}>X</span>
          </div>
          <h1 style={{fontSize:24,fontWeight:800,color:'var(--nx-navy)',marginBottom:6}}>Become a City Partner</h1>
          <p style={{fontSize:13,color:'#6b7280',marginBottom:24}}>Bring NetworkX to your city. Tell us a bit about you and where — our team reviews every application personally.</p>

          {error && <div style={{background:'rgba(255,90,90,.1)',color:'#ef4444',padding:'10px 14px',borderRadius:10,fontSize:13,marginBottom:16}}>{error}</div>}

          <div className="card">
            <div className="fg"><label>Full Name *</label><input value={form.applicant_name} onChange={e=>setForm({...form,applicant_name:e.target.value})}/></div>
            <div className="fg"><label>Email *</label><input type="email" value={form.applicant_email} onChange={e=>setForm({...form,applicant_email:e.target.value})}/></div>
            <div className="fg"><label>Phone</label><input value={form.applicant_phone} onChange={e=>setForm({...form,applicant_phone:e.target.value})}/></div>
            <div className="form-grid">
              <div className="fg"><label>Proposed City *</label><input value={form.proposed_city} onChange={e=>setForm({...form,proposed_city:e.target.value})}/></div>
              <div className="fg"><label>State</label><input value={form.proposed_state} onChange={e=>setForm({...form,proposed_state:e.target.value})}/></div>
            </div>
            <div className="fg"><label>Business / Community Experience</label><textarea rows={3} value={form.business_experience} onChange={e=>setForm({...form,business_experience:e.target.value})} placeholder="Relevant experience running a business, community, or events…"/></div>
            <div className="fg"><label>Anything else we should know?</label><textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            <button className="btn btn-p" style={{width:'100%'}} onClick={submit} disabled={saving}>{saving?'Submitting…':'Submit Application'}</button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
