
import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelect({ctx}){
  const [sel,setSel] = useState('student')
  const nav = useNavigate()

  const continueNext = ()=>{
    if(sel==='student'){
      nav('/get-started')
    }else{
      ctx.setRole('teacher')
      localStorage.setItem('role','teacher')
      nav('/teacher')
    }
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="badge">Intervue Poll</div>
      </div>
      <h1 className="h1">Welcome to the <span style={{color:'#111'}}>Live Polling System</span></h1>
      <p className="sub">Please select the role that best describes you to begin using the live polling system</p>
      <div className="card-row">
        <div onClick={()=>setSel('student')} className={'card '+(sel==='student'?'active':'')}>
          <div style={{fontWeight:700,fontSize:18}}>I'm a Student</div>
          <div className="small">Submit answers and view results in real-time.</div>
        </div>
        <div onClick={()=>setSel('teacher')} className={'card '+(sel==='teacher'?'active':'')}>
          <div style={{fontWeight:700,fontSize:18}}>I'm a Teacher</div>
          <div className="small">Create questions and monitor responses.</div>
        </div>
      </div>
      <div style={{marginTop:28}}>
        <button className="btn" onClick={continueNext}>Continue</button>
      </div>
    </div>
  )
}
