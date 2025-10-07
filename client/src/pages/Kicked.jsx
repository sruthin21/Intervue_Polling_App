
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Kicked(){
  const nav = useNavigate()
  return (
    <div className="container" style={{textAlign:'center', marginTop:60}}>
      <div className="badge">Intervue Poll</div>
      <h1 className="h1">You've been Kicked out !</h1>
      <p className="sub">Looks like the teacher has removed you from the poll system. Please try again sometime.</p>
      <button className="btn" onClick={()=> nav('/')}>Go Home</button>
    </div>
  )
}
