import io
import zipfile
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger(__name__)

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract text content from DOCX file bytes using native OpenXML zip parsing.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            if 'word/document.xml' not in z.namelist():
                return file_bytes.decode('utf-8', errors='ignore')

            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            paragraphs = []
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            for p in tree.iter(f"{{{ns['w']}}}p"):
                texts = [node.text for node in p.iter(f"{{{ns['w']}}}t") if node.text]
                if texts:
                    paragraphs.append("".join(texts))

            return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction fallback triggered: {str(e)}")
        return file_bytes.decode('utf-8', errors='ignore')
