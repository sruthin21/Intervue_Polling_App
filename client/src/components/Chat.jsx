
import React,{useEffect, useRef, useState} from 'react'

export default function Chat({ctx}){
  const {socket, name, role} = ctx
  const [open,setOpen] = useState(false) // closed by default
  const [tab,setTab] = useState('chat')
  const [list,setList] = useState([])
  const [people,setPeople] = useState([])
  const [text,setText] = useState('')
  const bodyRef = useRef(null)

  useEffect(()=>{
    socket.on('chat:new', b=> setList(list=> [...list, b]))
    socket.on('state', s=> { setList(s.chat||[]); setPeople(s.students||[]) })
    socket.on('participants', p=> setPeople(p||[]))
    return ()=>{ socket.off('chat:new'); socket.off('state'); socket.off('participants'); }
  },[socket])

  useEffect(()=>{
    if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  },[list, tab])

  const send = ()=>{
    if(!text.trim()) return
    socket.emit('chat:send', {roomId: ctx.roomId, name, message:text.trim()} )
    setText('')
  }

  const kick = (studentName)=>{
    if(role!=='teacher') return
    socket.emit('teacher:kick', {roomId: ctx.roomId, name: studentName})
  }

  if(!open) return <button className="fab" title="Chat / Participants" onClick={()=>setOpen(true)}>💬</button>

  return (
    <div className="chat">
      <div className="chat-header">
        <div style={{display:'flex', gap:16}}>
          <button className={'tab' + (tab==='chat'?' active':'')} onClick={()=>setTab('chat')}>Chat</button>
          <button className={'tab' + (tab==='participants'?' active':'')} onClick={()=>setTab('participants')}>Participants</button>
        </div>
        <div style={{marginLeft:'auto'}}><button className="btn secondary" onClick={()=>setOpen(false)}>Close</button></div>
      </div>

      {tab==='chat' && (
        <>
          <div ref={bodyRef} className="chat-body">
            {list.map((b,i)=>{
              const me = b.name===name
              return <div key={i} className={'bubble '+(me?'me':'them')}>
                <div className="small" style={{marginBottom:4}}>{b.name}</div>
                <div>{b.message}</div>
              </div>
            })}
          </div>
          <div style={{display:'flex', gap:6, padding:10}}>
            <input className="input" placeholder="Type a message" value={text} onChange={e=>setText(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && send()} />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </>
      )}

      {tab==='participants' && (
        <div className="chat-body">
          <div className="row header">
            <div style={{flex:1, fontWeight:700}}>Name</div>
            <div style={{width:90, textAlign:'right', fontWeight:700}}>Action</div>
          </div>
          {people.map((p,i)=>(
            <div key={i} className="row">
              <div style={{flex:1}}>{p.name}</div>
              <div style={{width:90, textAlign:'right'}}>
                {role==='teacher' ? <button className="link" onClick={()=>kick(p.name)}>Kick out</button> : <span className="small">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
