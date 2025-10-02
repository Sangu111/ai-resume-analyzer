
import React from "react";

function Circular({score}){
  const getScoreColor = (score) => {
    if (score >= 80) return "linear-gradient(135deg,#10b981,#059669)"; // Green
    if (score >= 60) return "linear-gradient(135deg,#f59e0b,#d97706)"; // Orange
    return "linear-gradient(135deg,#ef4444,#dc2626)"; // Red
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return "🎉";
    if (score >= 60) return "👍";
    return "⚠️";
  };

  return (
    <div style={{textAlign:"center"}}>
      <div style={{
        width:120,
        height:120,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        borderRadius:999,
        background:getScoreColor(score),
        color:"#fff",
        fontWeight:700,
        fontSize:20,
        margin:"0 auto",
        boxShadow:"0 8px 25px rgba(0,0,0,0.15)"
      }}>
        {score}%
      </div>
      <div style={{marginTop:12,color:"#374151", fontWeight:"500"}}>
        {getScoreEmoji(score)} Match Score
      </div>
    </div>
  );
}

export default function Results({result, loading, error}){
  if(loading) return (
    <div style={{minHeight:240, display:"flex",alignItems:"center",justifyContent:"center", flexDirection:"column", gap:12}}>
      <div style={{fontSize:"2rem"}}>🔄</div>
      <div style={{fontWeight:"500"}}>Analyzing your resume...</div>
      <div style={{fontSize:"0.9rem", color:"#6b7280"}}>This may take a few seconds</div>
    </div>
  );
  
  if(error) return (
    <div style={{minHeight:240, display:"flex",alignItems:"center",justifyContent:"center", flexDirection:"column", gap:12}}>
      <div style={{fontSize:"2rem"}}>❌</div>
      <div style={{color:"#ef4444", fontWeight:"500"}}>Analysis Failed</div>
      <div style={{fontSize:"0.9rem", color:"#6b7280"}}>{error}</div>
    </div>
  );
  
  if(!result) return (
    <div style={{minHeight:240, display:"flex",alignItems:"center",justifyContent:"center", flexDirection:"column", gap:12}}>
      <div style={{fontSize:"2rem"}}>📊</div>
      <div style={{fontWeight:"500"}}>Ready for Analysis</div>
      <div style={{fontSize:"0.9rem", color:"#6b7280", textAlign:"center"}}>Upload your resume and job description to get detailed insights</div>
    </div>
  );

  return (
    <div>
      <h3 style={{color:"#1f2937", fontSize:"1.25rem", fontWeight:"600", marginBottom:16}}>
        📊 Analysis Results 
        <small style={{color:"#6b7280", fontWeight:"400"}}>({result.mode_used} mode)</small>
      </h3>
      
      <Circular score={result.score} />
      
      <div style={{marginTop:20}}>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
            <span>✅</span>
            <strong style={{color:"#059669"}}>Found Keywords ({result.matching_keywords?.length || 0})</strong>
          </div>
          <div className="tags">
            {result.matching_keywords?.length ? 
              result.matching_keywords.slice(0,15).map((t,i)=> 
                <div key={i} className="tag match">{t}</div>
              ) : 
              <div className="small" style={{fontStyle:"italic"}}>No keyword matches found</div>
            }
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
            <span>⚠️</span>
            <strong style={{color:"#dc2626"}}>Missing Keywords ({result.missing_keywords?.length || 0})</strong>
          </div>
          <div className="tags">
            {result.missing_keywords?.length ? 
              result.missing_keywords.slice(0,15).map((t,i)=> 
                <div key={i} className="tag miss">{t}</div>
              ) : 
              <div className="small" style={{fontStyle:"italic"}}>Great! No critical keywords missing</div>
            }
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
            <span>💡</span>
            <strong style={{color:"#1f2937"}}>Professional Recommendations</strong>
          </div>
          <div style={{background:"#f8fafc", padding:12, borderRadius:8, border:"1px solid #e2e8f0"}}>
            {result.recommendations?.length ? 
              <ul style={{margin:0, paddingLeft:20}}>
                {result.recommendations.map((r,i)=> 
                  <li key={i} style={{marginBottom:6, color:"#374151"}}>{r}</li>
                )}
              </ul> : 
              <div className="small">Your resume looks great! Keep highlighting your technical projects and skills.</div>
            }
          </div>
        </div>

        <div style={{
          background: result.mode_used === 'ai' ? "#ecfdf5" : "#fef3c7", 
          border: result.mode_used === 'ai' ? "1px solid #d1fae5" : "1px solid #fde68a",
          borderRadius: 8, 
          padding: 12, 
          marginTop: 16,
          fontSize: "0.9rem"
        }}>
          <div style={{fontWeight:"500", marginBottom:4}}>
            {result.mode_used === 'ai' ? "🤖 AI Semantic Analysis Used" : "⚡ Quick Analysis Used"}
          </div>
          <div style={{fontSize:"0.8rem", color:"#6b7280"}}>
            {result.mode_used === 'ai' ? 
              "Deep semantic understanding was used to analyze meaning and context between your resume and job description." :
              result.semantic_available ?
                "Fast keyword matching was used. Try AI mode for deeper semantic analysis." :
                "Fast keyword matching was used. AI mode requires additional libraries to be installed."
            }
          </div>
        </div>
      </div>
    </div>
  );
}
