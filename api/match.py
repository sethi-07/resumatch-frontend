from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import re

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://resumatch123.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("all-MiniLM-L6-v2")

class InputData(BaseModel):
    resume: str
    job_description: str

@app.post("/api/match")
def match_resume(data: InputData):
    if not data.resume.strip() or not data.job_description.strip():
        raise HTTPException(status_code=400, detail="Inputs cannot be empty")

    resume_text = data.resume.lower()
    jd_text = data.job_description.lower()

    embeddings = model.encode(
        [resume_text, jd_text],
        convert_to_numpy=True
    )

    semantic_score = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    semantic_percentage = float(semantic_score) * 100

    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=20,
        ngram_range=(1, 1)
    )
    vectorizer.fit([jd_text])
    jd_keywords = set(vectorizer.get_feature_names_out())

    matched_skills = [skill for skill in jd_keywords if skill in resume_text]

    if len(jd_keywords) > 0:
        skill_overlap_score = (len(matched_skills) / len(jd_keywords)) * 100
    else:
        skill_overlap_score = 0

    missing_keywords = list(jd_keywords - set(matched_skills))
    
    action_verbs = [
    "built", "developed", "designed", "implemented",
    "deployed", "optimized", "led", "managed",
    "improved", "created", "engineered", "launched",
    "integrated", "architected", "reduced",
    "increased", "automated", "analyzed"
    ]


    impact_hits = sum(1 for word in action_verbs if word in resume_text)
    impact_score = min(impact_hits * 5, 15)  

    final_score = (
        0.6 * semantic_percentage +
        0.3 * skill_overlap_score +
        0.1 * impact_score
    )

    return {
        "final_match_percentage": round(final_score, 2),
        "semantic_score": round(semantic_percentage, 2),
        "skill_overlap_score": round(skill_overlap_score, 2),
        "impact_score": round(impact_score, 2),
        "matched_skills": matched_skills,
        "missing_keywords": missing_keywords
    }