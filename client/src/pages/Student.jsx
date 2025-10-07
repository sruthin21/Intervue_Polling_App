
import React,{useEffect, useState} from 'react'
import Results from '../components/Results.jsx'
import Chat from '../components/Chat.jsx'

export default function Student({ctx}){
  const {socket,name} = ctx
  const [active,setActive] = useState(null)
  const [expiresAt,setExpiresAt] = useState(null)
  const [tick,setTick] = useState(0)
  const [choice,setChoice] = useState(null)
  const [results,setResults] = useState({counts:[], total:0})
  const [participants,setParticipants] = useState([])
  const [ended,setEnded] = useState(null)

  useEffect(()=>{ const id = setInterval(()=> setTick(t=>t+1), 500); return ()=> clearInterval(id) },[])
  // Ensure we (re)join the room on mount and reconnect
  useEffect(()=>{
    const join = ()=> ctx.socket.emit('join-room',{roomId: ctx.roomId, role: 'student', name: name||'Anonymous'})
    join()
    ctx.socket.on('connect', join)
    return ()=> ctx.socket.off('connect', join)
  },[name])


  useEffect(()=>{
    socket.on('state', s=>{
      if(s.current){ setActive(s.current); setExpiresAt(s.expiresAt); setResults(s.results) }
      setParticipants(s.students||[])
    })
    socket.on('question', q=>{ setActive(q); setExpiresAt(q.expiresAt); setChoice(null); setEnded(null); setResults({counts:Array(q.options.length).fill(0), total:0}); })
    socket.on('results:update', r=> setResults(r))
    socket.on('question:end', data=>{ setActive(null); setEnded(data); setResults(data.results) })
    socket.on('participants', list=> setParticipants(list))
    return ()=> { socket.off('state'); socket.off('question'); socket.off('results:update'); socket.off('question:end'); socket.off('participants'); }
  },[socket])

  const remaining = expiresAt? Math.max(0, Math.ceil((expiresAt - Date.now())/1000)) : 0

  const submit = ()=>{
    if(choice===null || !active || remaining<=0) return
    socket.emit('student:answer',{roomId: ctx.roomId, optionIndex: choice})
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="badge">Intervue Poll</div>
        <div className="small">{name}</div>
      </div>

      {!active && !ended && (
        <div style={{textAlign:'center', marginTop:60}}>
          <div className="spinner"></div>
          <div className="h2">Wait for the teacher to ask questions..</div>
        </div>
      )}

      {active && (
        <div>
          <div className="h2">Question 1 <span className="timer">⏱ {remaining}s</span></div>
          <div className="option" style={{fontWeight:700}}>{active.question}</div>
          <div className="options" style={{marginTop:10}}>
            {active.options.map((o,idx)=>(
              <button key={idx} className={'option '+(choice===idx?'active':'')} onClick={()=>setChoice(idx)} style={{textAlign:'left'}}>
                <div>{idx+1}. {o.text}</div>
              </button>
            ))}
          </div>
          <div style={{marginTop:16}}>
            <button className="btn" onClick={submit} disabled={remaining<=0}>Submit</button>
          </div>
        </div>
      )}

      {(ended || (!active && results.total>0)) && (
        <div style={{marginTop:24}}>
          <Results question={(ended?.question)||'Results'} options={(ended?.options||active?.options||[]).map(o=>o.text)} results={results} showPercent />
        </div>
      )}

      <div className="participants">Participants: {participants.map(p=>p.name).join(', ')}</div>
      <Chat ctx={ctx} />
    </div>
  )
}
