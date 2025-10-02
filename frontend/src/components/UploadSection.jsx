import React, {useState, useRef} from "react";

export default function UploadSection({setResult,setLoading,setError,mode,setMode}){
  const [jobDesc,setJobDesc] = useState("");
  const [fileName,setFileName] = useState(null);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if(f){ setFileName(f.name); fileRef.current = f; }
  };

  const analyze = async () => {
    setError(""); setLoading(true); setResult(null);
    try{
      const form = new FormData();
      if(fileRef.current) form.append("resume", fileRef.current);
      form.append("jd", jobDesc);  // Fixed parameter name to match backend
      form.append("mode", mode);
      const res = await fetch("http://127.0.0.1:5000/analyze", { method:"POST", body: form });
      if(!res.ok){
        const txt = await res.text();
        throw new Error(txt || "Server error");
      }
      const data = await res.json();
      setResult(data);
    }catch(err){
      setError(err.message || "Analysis failed");
    }finally{ setLoading(false); }
  };

  return (
    <div>
      <h3 style={{marginBottom:20, color:"#1f2937", fontSize:"1.3rem", fontWeight:"600"}}>Resume Analysis</h3>
      
      <div style={{marginBottom:20}}>
        <label className="small" style={{display:"block", marginBottom:8, fontWeight:"500"}}>Upload Resume</label>
        <label className="drop">
          <input type="file" accept=".pdf,.docx,.doc,.txt" style={{display:"none"}} onChange={handleFile} />
          {fileName ? 
            <div style={{display:"flex", alignItems:"center", gap:12}}>
              <div style={{
                width:40, 
                height:40, 
                borderRadius:"8px", 
                background:"#10b981", 
                display:"flex", 
                alignItems:"center", 
                justifyContent:"center",
                color:"white",
                fontSize:"1.2rem"
              }}>✓</div>
              <div>
                <div style={{fontWeight:"600", color:"#059669"}}>File Selected</div>
                <div style={{fontSize:"0.9rem", color:"#6b7280"}}>{fileName}</div>
              </div>
            </div> : 
            <div style={{textAlign:"center", padding:"20px"}}>
              <div style={{fontSize:"2.5rem", marginBottom:8}}>📄</div>
              <div style={{fontWeight:"600", marginBottom:4}}>Drop your resume here or click to browse</div>
              <div style={{fontSize:"0.9rem", color:"#6b7280"}}>Supports PDF, DOC, DOCX formats</div>
            </div>
          }
        </label>
      </div>

      <div style={{marginBottom:20}}>
        <label className="small" style={{display:"block", marginBottom:8, fontWeight:"500"}}>Analysis Mode</label>
        <div className="mode-toggle">
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer", padding:"8px 12px"}}>
            <input type="radio" checked={mode==="quick"} onChange={()=>setMode("quick")} /> 
            <div>
              <div style={{fontWeight:"500"}}>⚡ Quick Match</div>
              <div style={{fontSize:"0.8rem", color:"#6b7280"}}>Fast keyword-based analysis using TF-IDF</div>
            </div>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer", padding:"8px 12px"}}>
            <input type="radio" checked={mode==="ai"} onChange={()=>setMode("ai")} /> 
            <div>
              <div style={{fontWeight:"500"}}>🤖 AI Semantic</div>
              <div style={{fontSize:"0.8rem", color:"#6b7280"}}>Deep understanding using AI embeddings (if available)</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="small" style={{display:"block",marginBottom:8, fontWeight:"500"}}>Job Description</label>
        <textarea 
          className="job" 
          placeholder="Paste the job description here for analysis..."
          value={jobDesc} 
          onChange={e=>setJobDesc(e.target.value)}
          style={{minHeight:"160px"}}
        />
      </div>

      <div style={{height:16}} />
      <div style={{display:"flex",gap:10}}>
        <button 
          className="btn" 
          onClick={analyze}
          disabled={!fileName || !jobDesc.trim()}
          style={{
            flex:2,
            opacity: (!fileName || !jobDesc.trim()) ? 0.6 : 1,
            cursor: (!fileName || !jobDesc.trim()) ? "not-allowed" : "pointer"
          }}
        >
          Analyze Resume
        </button>
        <button 
          className="btn" 
          style={{background:"#f3f4f6", color:"#374151", flex:1}} 
          onClick={()=>{ setJobDesc(""); setFileName(null); fileRef.current=null; }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}