
import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom'

export default function GetStarted({ctx}){
  const [tempName,setTempName] = useState(ctx.name || '')
  const nav = useNavigate()

  const go = ()=>{
    const nm = tempName.trim() || `User-${Math.floor(Math.random()*1000)}`
    ctx.setName(nm)
    localStorage.setItem('name', nm)
    ctx.setRole('student')
    localStorage.setItem('role','student')
    nav('/student')
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="badge">Intervue Poll</div>
      </div>
      <div className="h2">Let's Get Started</div>
      <p className="sub">If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls, and see how your responses compare with your classmates</p>
      <div style={{maxWidth:520}}>
        <label className="small">Enter your Name</label>
        <input className="input" placeholder="Your name" value={tempName} onChange={(e)=>setTempName(e.target.value)} />
      </div>
      <div style={{marginTop:24}}>
        <button className="btn" onClick={go}>Continue</button>
      </div>
    </div>
  )
}
