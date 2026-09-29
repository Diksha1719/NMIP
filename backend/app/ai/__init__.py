from abc import ABC, abstractmethod
import hashlib
import math
import re
from app.config import settings


class EmbeddingProvider(ABC):
    name: str

    @abstractmethod
    def embed_text(self, text: str) -> list[float]: ...

    def embed_batch(self, texts: list[str]):
        return [self.embed_text(text) for text in texts]


class DeterministicEmbedding(EmbeddingProvider):
    name = "Deterministic token hashing (demo; not semantic AI)"

    def embed_text(self, text):
        vector = [0.0] * 384
        for token in re.findall(r"\w+", text.lower()):
            vector[int(hashlib.sha256(token.encode()).hexdigest()[:8], 16) % 384] += 1
        norm = math.sqrt(sum(v * v for v in vector)) or 1
        return [v / norm for v in vector]


class SentenceTransformerEmbedding(EmbeddingProvider):
    name = "Sentence Transformer"

    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(settings.sentence_transformer_model)
        if self.model.get_sentence_embedding_dimension() != 384:
            raise ValueError("Configured embedding model must have 384 dimensions")

    def embed_text(self, text):
        return self.model.encode(text, normalize_embeddings=True).tolist()


class LLMProvider(ABC):
    @abstractmethod
    def extract_attributes(self, text, category, dictionary=()): ...

    @abstractmethod
    def explain_decision(self, decision, comparisons): ...


class RuleBasedProvider(LLMProvider):
    def extract_attributes(self, text, category, dictionary=()):
        from app.extraction import extract
        return extract(text, category, dictionary)

    def explain_decision(self, decision, comparisons):
        return decision["reason"]


embedding_provider = SentenceTransformerEmbedding() if settings.embedding_provider == "sentence-transformer" else DeterministicEmbedding()
extraction_provider = RuleBasedProvider()
