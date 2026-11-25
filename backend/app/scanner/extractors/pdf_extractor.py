import re
import zlib
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text content from PDF file bytes using native stream decoding.
    Handles uncompressed and FlateDecode compressed PDF streams.
    """
    try:
        text_chunks = []
        
        # 1. Search for stream ... endstream blocks
        stream_matches = re.finditer(rb'stream[\r\n]+(.*?)[\r\n]+endstream', file_bytes, re.DOTALL)
        
        for match in stream_matches:
            stream_data = match.group(1)
            decompressed = None
            
            # Attempt FlateDecode decompression
            try:
                decompressed = zlib.decompress(stream_data)
            except Exception:
                try:
                    decompressed = zlib.decompress(stream_data, -zlib.MAX_WBITS)
                except Exception:
                    decompressed = stream_data # Uncompressed raw stream

            if decompressed:
                # Extract text strings inside (text) Tj or [(text)] TJ operator blocks
                # 1. Tj operators
                tj_matches = re.findall(rb'\((.*?)\)\s*Tj', decompressed)
                for tj in tj_matches:
                    try:
                        text_chunks.append(tj.decode('utf-8', errors='ignore'))
                    except Exception:
                        pass
                
                # 2. TJ array operators
                array_matches = re.findall(rb'\[(.*?)\]\s*TJ', decompressed, re.DOTALL)
                for arr in array_matches:
                    sub_strings = re.findall(rb'\((.*?)\)', arr)
                    combined = "".join([s.decode('utf-8', errors='ignore') for s in sub_strings])
                    if combined:
                        text_chunks.append(combined)

        if text_chunks:
            return "\n".join(text_chunks)
        
        # Fallback: Plain text regex search for printable ASCII strings in PDF bytes
        ascii_strings = re.findall(rb'[A-Za-z0-9._%+\-:=/@ \t]{4,}', file_bytes)
        decoded = [s.decode('utf-8', errors='ignore') for s in ascii_strings if not s.startswith(rb'/')]
        return "\n".join(decoded)

    except Exception as e:
        logger.error(f"PDF extraction error: {str(e)}")
        # Safe fallback
        return file_bytes.decode('utf-8', errors='ignore')
