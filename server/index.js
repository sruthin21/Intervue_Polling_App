
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import path from "path";
import { fileURLToPath } from "url";

// resolve __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... keep your existing app/server/socket.io code ...

// --- Serve React build from /client/dist ---
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// SPA fallback so client-side routes work
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// In-memory store
const polls = {}; // {roomId: {history:[], current:null, students:{sid:{name}}, answers:{sid:index}, expiresAt:null, timeout, chat:[]}}

function getResults(roomId){
  const poll = polls[roomId];
  if(!poll || !poll.current) return {counts:[], total:0};
  const counts = Array(poll.current.options.length).fill(0);
  Object.values(poll.answers).forEach(idx=>{ if(typeof idx==='number') counts[idx]++; });
  const total = Object.keys(poll.answers).length;
  return {counts,total};
}

function endQuestion(roomId, reason='timeout'){
  const poll = polls[roomId];
  if(!poll || !poll.current) return;
  const {counts,total} = getResults(roomId);
  const endData = { 
    question: poll.current.question, 
    options: poll.current.options, 
    results:{counts,total}, 
    endedAt: Date.now(), 
    correctIndex: poll.current.correctIndex,
    reason
  };
  poll.history.unshift(endData);
  poll.current = null;
  poll.expiresAt = null;
  if(poll.timeout){ clearTimeout(poll.timeout); poll.timeout=null; }
  io.to(roomId).emit('question:end', endData);
}

io.on('connection', (socket)=>{
  socket.on('join-room', ({roomId, role, name})=>{
    if(!roomId) roomId='default';
    socket.join(roomId);
    polls[roomId] = polls[roomId] || {history:[], current:null, students:{}, answers:{}, expiresAt:null, timeout:null, chat:[]};
    if(role==='student'){
      polls[roomId].students[socket.id] = {name: name || 'Anonymous'};
    }
    const poll = polls[roomId];
    const {counts,total} = getResults(roomId);
    socket.emit('state', { current: poll.current, results:{counts,total}, expiresAt: poll.expiresAt, students: Object.values(poll.students), chat: poll.chat });
    io.to(roomId).emit('participants', Object.values(poll.students));
  });

  socket.on('teacher:ask', ({roomId, question, options, correctIndex, durationSec})=>{
    if(!roomId) roomId='default';
    polls[roomId] = polls[roomId] || {history:[], current:null, students:{}, answers:{}, expiresAt:null, timeout:null, chat:[]};
    const poll = polls[roomId];
    if(poll.current && Date.now() < (poll.expiresAt || 0)) return; // already active
    poll.current = {question, options: options.map(o=>({text:o.text, correct:o.correct ?? false})), correctIndex: typeof correctIndex==='number'?correctIndex:null};
    poll.answers = {};
    poll.expiresAt = Date.now() + (Math.max(5, durationSec||60) * 1000);
    if(poll.timeout){ clearTimeout(poll.timeout); }
    poll.timeout = setTimeout(()=> endQuestion(roomId, 'timeout'), Math.max(0, poll.expiresAt - Date.now()));
    io.to(roomId).emit('question', {question: poll.current.question, options: poll.current.options, expiresAt: poll.expiresAt});
  });

  socket.on('student:answer', ({roomId, optionIndex})=>{
    if(!roomId) roomId='default';
    const poll = polls[roomId];
    if(!poll || !poll.current) return;
    if(Date.now() > (poll.expiresAt||0)) return; // too late
    poll.answers[socket.id] = optionIndex;
    const {counts,total} = getResults(roomId);
    io.to(roomId).emit('results:update', {counts,total});
    const present = Object.keys(poll.students).length;
    const answered = Object.keys(poll.answers).length;
    if(present>0 && answered>=present){ endQuestion(roomId, 'all-answered'); }
  });

  socket.on('teacher:end', ({roomId})=>{
    if(!roomId) roomId='default';
    endQuestion(roomId, 'manual');
  });

  socket.on('teacher:history', ({roomId})=>{
    if(!roomId) roomId='default';
    const poll = polls[roomId] || {history:[]};
    socket.emit('history', poll.history.slice(0,25));
  });

  socket.on('teacher:kick', ({roomId, name})=>{
    if(!roomId) roomId='default';
    const poll = polls[roomId];
    if(!poll) return;
    const targetId = Object.entries(poll.students).find(([sid,info])=>info.name===name)?.[0];
    if(targetId){
      io.sockets.sockets.get(targetId)?.leave(roomId);
      io.to(targetId).emit('kicked'); // notify student
      delete poll.students[targetId];
      delete poll.answers[targetId];
      io.to(roomId).emit('participants', Object.values(poll.students));
      const {counts,total} = getResults(roomId);
      io.to(roomId).emit('results:update', {counts,total});
    }
  });

  socket.on('chat:send', ({roomId, name, message})=>{
    if(!roomId) roomId='default';
    const poll = polls[roomId];
    if(!poll) return;
    const bubble = {name, message, ts: Date.now()};
    poll.chat.push(bubble);
    if(poll.chat.length>100) poll.chat.shift();
    io.to(roomId).emit('chat:new', bubble);
  });

  socket.on('disconnecting', ()=>{
    [...socket.rooms].forEach(roomId=>{
      const poll = polls[roomId];
      if(poll){
        delete poll.students[socket.id];
        delete poll.answers[socket.id];
        io.to(roomId).emit('participants', Object.values(poll.students));
        const {counts,total} = getResults(roomId);
        io.to(roomId).emit('results:update', {counts,total});
      }
    });
  });
});

app.get('/', (_req,res)=> res.json({ok:true, service:'Live Polling System'}));

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log('Server listening on http://localhost:'+PORT));
