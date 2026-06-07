# AI utilities: use HuggingFace transformers and Tesseract if available.
# If not available, fall back to simple heuristics.
import importlib
import os
import re
PdfReader = None
try:
    module = importlib.import_module('pypdf')
    PdfReader = module.PdfReader
except Exception:
    try:
        module = importlib.import_module('PyPDF2')
        PdfReader = module.PdfReader
    except Exception:
        PdfReader = None
PDF_AVAILABLE = PdfReader is not None
from pathlib import Path

try:
    from transformers import pipeline
    HF_AVAILABLE = True
except Exception:
    HF_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False

def analyze_text(text: str):
    """Return a summary and keywords for given text."""
    if HF_AVAILABLE:
        try:
            summarizer = pipeline('summarization')
            summary = summarizer(text, max_length=120, min_length=30, do_sample=False)[0]['summary_text']
        except Exception as e:
            summary = text[:200] + ('...' if len(text)>200 else '')
    else:
        summary = text[:200] + ('...' if len(text)>200 else '')

    # crude keyword extraction: top words
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())

    stop_words = {
        "this", "that", "with", "from", "have", "will", "your",
        "should", "into", "their", "there", "about", "chapter",
        "page", "project", "report", "guidelines", "follow"
    }

    words = [w for w in words if w not in stop_words]

    freq = {}
    for w in words:
        freq[w] = freq.get(w,0)+1
    keys = sorted(freq.items(), key=lambda x: -x[1])[:5]
    keywords = [k for k,_ in keys]
    return {'summary': summary, 'keywords': keywords}

def analyze_image(path: str):
    """Return tags and extracted text from image."""
    tags = []
    ocr_text = ''
    if TESSERACT_AVAILABLE:
        try:
            ocr_text = pytesseract.image_to_string(Image.open(path))
        except Exception as e:
            ocr_text = ''
    # basic filename-based tag
    tags.append(Path(path).stem.split('_')[0])
    return {'tags': tags, 'ocr': ocr_text}

def extract_pdf_text(path: str):
    """Extract text from PDF file."""
    if not PDF_AVAILABLE:
        return ""

    try:
        reader = PdfReader(path)
        text = ""

        for page in reader.pages:
            text += page.extract_text() or ""

        return text.strip()
    except Exception:
        return ""

