
import React,{useEffect, useState} from 'react'
import Results from '../components/Results.jsx'
import Chat from '../components/Chat.jsx'

export default function Teacher({ctx}){
  const {socket} = ctx
  const [question,setQuestion] = useState('')
  const [opts,setOpts] = useState([{text:'', correct:false},{text:'', correct:false}])
  const [duration,setDuration] = useState(60)
  const [active,setActive] = useState(null)
  const [expiresAt,setExpiresAt] = useState(null)
  const [tick,setTick] = useState(0)
  const [results,setResults] = useState({counts:[], total:0})
  const [participants,setParticipants] = useState([])
  const [history,setHistory] = useState([])

  useEffect(()=>{ const id = setInterval(()=> setTick(t=>t+1), 500); return ()=> clearInterval(id) },[])
  // Ensure we (re)join the room on mount and reconnect
  useEffect(()=>{
    const join = ()=> ctx.socket.emit('join-room',{roomId: ctx.roomId, role: 'teacher', name: ctx.name||'Host'})
    join()
    ctx.socket.on('connect', join)
    return ()=> ctx.socket.off('connect', join)
  },[])


  useEffect(()=>{
    socket.on('state', s=>{
      if(s.current){ setActive(s.current); setExpiresAt(s.expiresAt); }
      setResults(s.results||{counts:[], total:0})
      setParticipants(s.students||[])
    })
    socket.on('question', q=>{ setActive(q); setExpiresAt(q.expiresAt); setResults({counts:Array(q.options.length).fill(0), total:0}); })
    socket.on('results:update', r=> setResults(r))
    socket.on('question:end', data=>{ setActive(null); setExpiresAt(null); setHistory(h=>[data, ...h]); })
    socket.on('participants', list=> setParticipants(list))
    socket.on('history', h=> setHistory(h))
    return ()=>{
      socket.off('state'); socket.off('question'); socket.off('results:update'); socket.off('question:end'); socket.off('participants'); socket.off('history');
    }
  },[socket])

  const canAsk = !active
  const ask = ()=>{
    if(!canAsk) return
    const options = opts.filter(o=>o.text.trim()!=='')
    if(!question.trim() || options.length<2) return
    const correctIndex = options.findIndex(o=>o.correct)
    socket.emit('teacher:ask', {roomId: ctx.roomId, question, options, durationSec: duration, correctIndex: correctIndex>=0?correctIndex:null})
  }
  const endNow = ()=> socket.emit('teacher:end',{roomId: ctx.roomId})
  const addOpt = ()=> setOpts(o=>[...o,{text:'', correct:false}])
  const editOpt = (i,val)=> setOpts(o=> o.map((x,idx)=> idx===i?{...x,text:val}:x))
  const markCorrect = (i,isYes)=> setOpts(o=> o.map((x,idx)=> idx===i?{...x,correct:isYes}: {...x, correct: isYes? false : x.correct}))

  const remaining = expiresAt? Math.max(0, Math.ceil((expiresAt - Date.now())/1000)) : 0

  return (
    <div className="container">
      <div className="topbar">
        <div className="badge">Intervue Poll</div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <a className="btn secondary" href="/history">View Poll history</a>
          <div className="small">Participants: {participants.length}</div>
        </div>
      </div>
      <div className="h2">Let's Get Started</div>
      <p className="sub">Create and manage polls, ask questions, and monitor responses in real-time.</p>

      <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
        <div style={{flex:'1 1 420px'}}>
          <label className="small">Enter your question</label>
          <textarea className="input" rows="4" maxLength={100} placeholder="Type a question..." value={question} onChange={e=>setQuestion(e.target.value)} />
          <div style={{display:'flex', gap:12, alignItems:'center', margin:'8px 0 16px'}}>
            <select className="input" style={{maxWidth:200}} value={duration} onChange={e=>setDuration(parseInt(e.target.value))}>
              {[15,30,45,60,90,120].map(s=> <option key={s} value={s}>{s} seconds</option>)}
            </select>
            <button className="btn" disabled={!canAsk} onClick={ask}>Ask Question</button>
            {active && <><span className="timer">⏱ {remaining}s</span><button className="btn secondary" onClick={endNow}>End Now</button></>}
          </div>

          <div className="options">
            {opts.map((o,i)=>(
              <div className="option" key={i} style={{gap:12}}>
                <div style={{flex:1}}>
                  <input className="input" placeholder={"Option "+(i+1)} value={o.text} onChange={(e)=>editOpt(i,e.target.value)} />
                </div>
                <div className="small" style={{minWidth:130, textAlign:'right'}}>
                  <span style={{marginRight:8}}>Is it Correct?</span>
                  <label style={{marginRight:6}}>
                    <input type="radio" name={"correct-"+i} checked={o.correct===true} onChange={()=>markCorrect(i,true)} /> Yes
                  </label>
                  <label>
                    <input type="radio" name={"correct-no-"+i} checked={o.correct===false} onChange={()=>markCorrect(i,false)} /> No
                  </label>
                </div>
              </div>
            ))}
            <button className="btn secondary" onClick={addOpt}>+ Add More option</button>
          </div>
        </div>

        <div style={{flex:'1 1 360px'}}>
          <Results question={active?active.question:question} options={(active?active.options:opts).map(o=>o.text||'')} results={results} showPercent endNote={active? '': 'Preview'} />
        </div>
      </div>

      {active && (
        <div style={{marginTop:24}}>
          <div className="h2">Question</div>
          <Results question={active.question} options={active.options.map(o=>o.text)} results={results} showPercent />
        </div>
      )}

      <Chat ctx={ctx} />
    </div>
  )
}
