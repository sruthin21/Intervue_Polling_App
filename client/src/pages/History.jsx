
import React,{useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import Results from '../components/Results.jsx'

export default function History({ctx}){
  const {socket} = ctx
  const [history,setHistory] = useState([])
  const nav = useNavigate()

  useEffect(()=>{
    socket.emit('teacher:history', {roomId: ctx.roomId})
    socket.on('history', h=> setHistory(h))
    return ()=> socket.off('history')
  },[socket])

  return (
    <div className="container">
      <div className="topbar">
        <div className="badge">Intervue Poll</div>
        <button className="btn secondary" onClick={()=>nav('/teacher')}>Back</button>
      </div>
      <div className="h2">View Poll History</div>
      <div style={{display:'grid', gap:24, marginTop:12}}>
        {history.length===0 && <div className="small">No past polls yet.</div>}
        {history.map((h,idx)=>(
          <div key={idx}>
            <div style={{fontWeight:700, marginBottom:6}}>Question {history.length-idx}</div>
            <Results question={h.question} options={h.options.map(o=>o.text)} results={h.results} showPercent />
          </div>
        ))}
      </div>
    </div>
  )
}
