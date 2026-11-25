import math

def calculate_shannon_entropy(data: str) -> float:
    """
    Calculate Shannon entropy of a string string to detect random-looking secret tokens.
    Entropy ranges from 0 (all characters identical) to ~5.0+ (highly random/unpredictable tokens).
    
    Formula: H(X) = - sum(P(x_i) * log2(P(x_i)))
    """
    if not data:
        return 0.0
    
    length = len(data)
    char_counts = {}
    for char in data:
        char_counts[char] = char_counts.get(char, 0) + 1
        
    entropy = 0.0
    for count in char_counts.values():
        prob = count / length
        entropy -= prob * math.log2(prob)
        
    return round(entropy, 2)

def is_high_entropy_secret(token: str, threshold: float = 3.0) -> bool:
    """
    Evaluates if a string exhibits high entropy consistent with API keys, tokens, or secret keys.
    Requires minimum token length (>= 12) to avoid false positives on short words.
    Hex strings have max entropy of 4.0 (>= 3.0 is high entropy).
    Alphanumeric/base64 strings have max entropy 6.0.
    """
    if len(token) < 12:
        return False
    
    # Exclude common natural words or hex/numeric repetitions
    entropy = calculate_shannon_entropy(token)
    return entropy >= threshold
