
import React, {useEffect, useMemo, useState} from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import RoleSelect from './pages/RoleSelect.jsx'
import GetStarted from './pages/GetStarted.jsx'
import Teacher from './pages/Teacher.jsx'
import Student from './pages/Student.jsx'
import Kicked from './pages/Kicked.jsx'
import History from './pages/History.jsx'

const backendURL = import.meta.env.VITE_BACKEND_URL || window.location.origin;
const socket = io(backendURL,{autoConnect:false})

export default function App(){
  const [role,setRole] = useState(localStorage.getItem('role') || '')
  const [name,setName] = useState(localStorage.getItem('name') || '')
  const [roomId,setRoomId] = useState('default')
  const navigate = useNavigate()

  useEffect(()=>{
    if(role){
      socket.connect()
      socket.emit('join-room',{roomId, role, name})
    }
    return ()=> socket.disconnect()
  },[role, name, roomId])

  useEffect(()=>{
    socket.on('kicked', ()=>{
      localStorage.setItem('role','kicked')
      navigate('/kicked')
    })
    return ()=> socket.off('kicked')
  },[])

  const ctx = useMemo(()=>({socket, name, setName, role, setRole, roomId, setRoomId, backendURL}),[role,name,roomId])

  return (
    <Routes>
      <Route path="/" element={<RoleSelect ctx={ctx} />} />
      <Route path="/get-started" element={<GetStarted ctx={ctx} />} />
      <Route path="/teacher" element={<Teacher ctx={ctx} />} />
      <Route path="/student" element={<Student ctx={ctx} />} />
      <Route path="/history" element={<History ctx={ctx} />} />
      <Route path="/kicked" element={<Kicked />} />
      <Route path="*" element={<RoleSelect ctx={ctx} />} />
    </Routes>
  )
}
