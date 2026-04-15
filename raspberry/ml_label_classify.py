"""
Map raw ML / YOLO class names to backend /api/hardware/sort waste_type values.
Keep aligned with frontend/src/utils/mlLabelClassify.js and backend/utils/mlLabelClassify.js
"""

VALID = ("Recycle", "Non-Bio", "Biodegradable", "Unsorted")


def classify_raw_label_to_waste_type(raw: str) -> str:
    s = (raw or "").strip()
    if not s:
        return "Unsorted"
    upper = s.upper()
    spaced = " ".join(s.lower().split())
    compact = "".join(c for c in s.lower() if c.isalnum())

    bio_phrases = (
        "FOOD WASTE", "ORGANIC", "COMPOST", "BANANA PEEL", "FRUIT PEEL", "VEGETABLE PEEL",
        "LEAVES", "GRASS", "EGG SHELL", "COFFEE GROUND", "TEA BAG", "RICE", "BREAD", "MEAT",
    )
    if any(p in upper for p in bio_phrases):
        return "Biodegradable"
    for w in ("food", "fruit", "vegetable", "compost", "organic", "peel", "leaf"):
        if w in spaced or w in compact:
            if "PLASTIC" not in upper and "METAL" not in upper and "BATTERY" not in upper:
                return "Biodegradable"

    recycle_phrases = (
        "PLASTIC BOTTLE", "WATER BOTTLE", "PET BOTTLE", "SODA CAN", "METAL CAN", "ALUMINUM CAN",
        "GLASS BOTTLE", "GLASS JAR", "NEWSPAPER", "CARDBOARD", "PAPER CUP", "TETRA PAK",
    )
    if any(p in upper for p in recycle_phrases):
        return "Recycle"
    for t in ("plasticbottle", "bottle", "glass", "metalcan", "aluminum", "paper", "cardboard", "recycl"):
        if t in compact:
            return "Recycle"

    non_bio = (
        "HAIR CLIP", "HAIRCLIP", "DIAPER", "STYROFOAM", "BATTERY", "TOOTHBRUSH", "CD", "DVD",
        "PLASTIC FORK", "PLASTIC SPOON", "FOAM CUP",
    )
    if any(p in upper for p in non_bio):
        return "Non-Bio"
    if "PLASTIC" in upper and "BOTTLE" not in upper and "CUP" not in upper and "CONTAINER" not in upper:
        return "Non-Bio"

    legacy = {
        "recycle": "Recycle", "recyclable": "Recycle", "non-bio": "Non-Bio", "nonbio": "Non-Bio",
        "biodegradable": "Biodegradable", "bio": "Biodegradable", "unsorted": "Unsorted",
    }
    if spaced in legacy:
        return legacy[spaced]
    if compact in legacy:
        return legacy[compact]

    return "Unsorted"


def normalize_waste_type(value: str) -> str:
    v = (value or "").strip()
    if v in VALID:
        return v
    return classify_raw_label_to_waste_type(v)
