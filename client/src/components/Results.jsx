
import React from 'react'

export default function Results({question, options=[], results={counts:[], total:0}, showPercent=true, endNote=''}){
  const counts = results.counts || Array(options.length).fill(0)
  const total = Math.max(1, results.total || 0)
  return (
    <div>
      <div className="option" style={{background:'#333',color:'#fff', borderColor:'#333'}}>
        {question || 'Question preview'}
      </div>
      <div style={{display:'grid', gap:10}}>
        {options.map((opt, idx)=>{
          const pct = Math.round(100 * (counts[idx] || 0) / total)
          return (
            <div key={idx}>
              <div className="progress"><div style={{width: pct+'%'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between', marginTop:6}}>
                <div>{idx+1}. {opt}</div>
                {showPercent && <div className="small">{pct}%</div>}
              </div>
            </div>
          )
        })}
      </div>
      {endNote && <div className="small" style={{marginTop:6}}>{endNote}</div>}
    </div>
  )
}
