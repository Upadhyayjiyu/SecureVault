import logging

logger = logging.getLogger(__name__)

def extract_text_from_plain_text(file_bytes: bytes) -> str:
    """
    Safely extract text from TXT, CSV, JSON, YAML, or source code files using encoding fallbacks.
    """
    encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
    for enc in encodings:
        try:
            return file_bytes.decode(enc)
        except UnicodeDecodeError:
            continue
    
    # Force decoding with replacement if all encodings fail
    return file_bytes.decode('utf-8', errors='replace')
