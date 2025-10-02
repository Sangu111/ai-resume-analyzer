from flask import Flask, request, jsonify
from flask_cors import CORS
import re, io, math
import PyPDF2, docx
from werkzeug.utils import secure_filename

# TF-IDF
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Optional transformers
semantic_available = False
try:
    import torch
    from transformers import AutoTokenizer, AutoModel
    # use a compact sentence-transformer-style model
    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME)
    semantic_available = True
except Exception as e:
    semantic_available = False

app = Flask(__name__)
CORS(app)

ALLOWED_EXT = {"pdf","docx","doc","txt"}

COMMON_SKILLS = [
    # Core Programming Languages
    "python","java","c++","c#","javascript","c","php","ruby","go","kotlin","typescript","scala","r",
    # Web Technologies
    "html","css","react","angular","vue","node","express","flask","django","spring","laravel","next.js","nuxt",
    # Database Technologies
    "sql","mysql","postgresql","mongodb","oracle","sqlite","redis","cassandra","elasticsearch","dynamodb",
    # Cloud & DevOps
    "aws","azure","gcp","docker","kubernetes","jenkins","git","github","gitlab","ci/cd","terraform","ansible",
    # Data Science & AI
    "machine learning","deep learning","nlp","pandas","numpy","scikit-learn","tensorflow",
    "pytorch","data analysis","big data","hadoop","spark","tableau","power bi","looker","databricks",
    # Mobile Development
    "android","ios","react native","flutter","swift","kotlin","xamarin",
    # Development Methodologies & Tools
    "rest api","graphql","microservices","agile","scrum","mvc","oop","data structures",
    "algorithms","system design","testing","junit","selenium","cypress","jest",
    # Security & Other Technologies
    "network security","cybersecurity","blockchain","iot","serverless","api design","performance optimization"
]

def allowed_file(fn):
    return "." in fn and fn.rsplit(".",1)[1].lower() in ALLOWED_EXT

def extract_text_from_pdf(stream):
    try:
        reader = PyPDF2.PdfReader(stream)
        text_parts = []
        for page_num, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            except Exception as e:
                print(f"Error extracting text from page {page_num}: {e}")
                continue
        return "\n".join(text_parts)
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(stream):
    try:
        doc = docx.Document(stream)
        return "\\n".join([p.text for p in doc.paragraphs])
    except:
        return ""

def clean(s):
    return re.sub(r'[^a-z0-9\\s]', ' ', (s or "").lower())

def embed_texts(texts):
    """Return embeddings using transformers model (mean pooling)."""
    if not semantic_available:
        raise RuntimeError("Semantic models not available (transformers/torch missing).")
    # tokenize
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        last = outputs.last_hidden_state  # (batch, seq, dim)
        # mean pooling excluding padding
        attention_mask = inputs['attention_mask'].unsqueeze(-1)
        summed = (last * attention_mask).sum(1)
        counts = attention_mask.sum(1)
        embeddings = summed / counts
        return embeddings.cpu().numpy()

@app.route("/analyze", methods=["POST"])
def analyze():
    job_desc = request.form.get("jd","").strip()  # Fixed parameter name
    if not job_desc:  # Fallback for different parameter names
        job_desc = request.form.get("job_desc","").strip()
    mode = request.form.get("mode","quick")  # 'quick' or 'ai'
    file = request.files.get("resume")
    resume_text = ""

    if file and allowed_file(file.filename):
        fname = secure_filename(file.filename)
        ext = fname.rsplit(".",1)[1].lower()
        data = io.BytesIO(file.read())
        data.seek(0)
        if ext == "pdf":
            resume_text = extract_text_from_pdf(data)
        elif ext in ("docx","doc"):
            data.seek(0)
            resume_text = extract_text_from_docx(data)
        else:
            try:
                resume_text = data.read().decode("utf-8",errors="ignore")
            except:
                resume_text = ""
    # fallback: if no resume but job_desc provided, still proceed

    # Clean
    jd_clean = clean(job_desc)
    res_clean = clean(resume_text)

    # Find simple skill matches
    found_skills = [s for s in COMMON_SKILLS if s in jd_clean or s in res_clean]

    # Determine matching and missing keywords (token overlap)
    jd_tokens = set(jd_clean.split())
    res_tokens = set(res_clean.split())
    matching_tokens = sorted(list(jd_tokens & res_tokens))
    missing_skills = [s for s in COMMON_SKILLS if (s in jd_clean and s not in res_clean)]

    score = 0
    used_mode = mode
    try:
        if mode == "ai" and semantic_available and jd_clean.strip() and res_clean.strip():
            # semantic similarity using embeddings
            print("Using AI semantic analysis mode")
            embs = embed_texts([jd_clean, res_clean])
            sim = cosine_similarity(embs[0:1], embs[1:2])[0][0]
            score = int(max(0, min(100, round(float(sim)*100))))
            used_mode = "ai"
        elif mode == "ai" and not semantic_available:
            # AI requested but not available, fall back to enhanced TF-IDF
            print("AI mode requested but not available, using enhanced TF-IDF")
            used_mode = "quick (AI unavailable)"
            corpus = [jd_clean, res_clean]
            if jd_clean.strip() and res_clean.strip():
                vect = TfidfVectorizer(stop_words='english', ngram_range=(1,2)).fit(corpus)
                tfidf = vect.transform(corpus)
                if tfidf.shape[0] >= 2 and tfidf.nnz > 0:
                    sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
                    score = int(max(0, min(100, round(float(sim)*100))))
                else:
                    score = 0
            else:
                score = 0
        else:
            # Standard TF-IDF quick mode
            print("Using standard TF-IDF quick mode")
            used_mode = "quick"
            corpus = [jd_clean, res_clean]
            if jd_clean.strip() and res_clean.strip():
                vect = TfidfVectorizer(stop_words='english').fit(corpus)
                tfidf = vect.transform(corpus)
                if tfidf.shape[0] >= 2 and tfidf.nnz > 0:
                    sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
                    score = int(max(0, min(100, round(float(sim)*100))))
                else:
                    # fallback scoring using keyword overlap
                    if len(jd_tokens) == 0:
                        score = int(min(100, 50 + len(found_skills)*5))
                    else:
                        matched = sum(1 for t in jd_tokens if t in res_tokens)
                        score = int(min(100, (matched/len(jd_tokens))*100))
            else:
                score = 0
    except Exception as e:
        print(f"Error in analysis: {e}")
        # on any failure, fallback to token overlap
        used_mode = "quick (fallback)"
        if len(jd_tokens) == 0:
            score = int(min(100, 50 + len(found_skills)*5))
        else:
            matched = sum(1 for t in jd_tokens if t in res_tokens)
            score = int(min(100, (matched/len(jd_tokens))*100))

    recommendations = []
    
    # General recommendations for all professionals
    if missing_skills:
        recommendations.append(f"🎯 Consider adding these in-demand skills: {', '.join(missing_skills[:6])}")
    
    # Cloud recommendations
    cloud_skills = ["aws", "azure", "gcp", "docker", "kubernetes"]
    if any(skill in jd_clean for skill in cloud_skills) and not any(skill in res_clean for skill in cloud_skills):
        recommendations.append("☁️ Consider gaining cloud computing experience (AWS/Azure/GCP) - highly valued in the industry")
    
    # Data Science recommendations
    ds_skills = ["machine learning", "data analysis", "python", "pandas", "numpy"]
    if any(skill in jd_clean for skill in ds_skills):
        recommendations.append("📊 Highlight your data science projects, statistical analysis, or relevant coursework")
    
    # Web development recommendations
    web_skills = ["react", "angular", "javascript", "node", "html", "css"]
    if any(skill in jd_clean for skill in web_skills):
        recommendations.append("💻 Showcase your web development projects with live demos and GitHub links")
    
    # General advice based on score
    if score < 50:
        recommendations.append("🔄 Major revision needed: Align your resume with job requirements. Focus on relevant projects and experience")
    elif score < 70:
        recommendations.append("📝 Good foundation! Add more specific technical skills and quantify your achievements")
    elif score < 85:
        recommendations.append("✨ Almost there! Fine-tune keywords and emphasize leadership roles and key accomplishments")
    else:
        recommendations.append("🚀 Excellent match! Highlight measurable impacts and specific achievements")
    
    # Experience-based advice
    if "internship" in jd_clean or "entry level" in jd_clean or "junior" in jd_clean:
        recommendations.append("🎓 Emphasize your projects, relevant coursework, and any practical experience")
    
    if not any(skill in res_clean for skill in ["git", "github", "version control"]):
        recommendations.append("🔧 Add version control experience (Git/GitHub) - essential for most technical roles")

    return jsonify({
        "mode_used": used_mode,
        "score": score,
        "matching_keywords": matching_tokens[:100],
        "missing_keywords": missing_skills[:100],
        "recommendations": recommendations,
        "semantic_available": semantic_available
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)