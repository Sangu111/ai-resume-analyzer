Backend (Flask) for Resume Analyzer
----------------------------------
Run:
1. cd backend
2. python -m venv venv
3. source venv/bin/activate   # (on Windows: venv\Scripts\activate)
4. pip install -r requirements.txt

Optional (for AI semantic mode):
pip install transformers torch sentence-transformers

5. python app.py

The API runs at http://127.0.0.1:5000/analyze