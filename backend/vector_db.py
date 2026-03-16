import chromadb
from sentence_transformers import SentenceTransformer
import sys

# ============================================================
# LOAD EMBEDDING MODEL
# all-MiniLM-L6-v2 = small, fast, free model
# converts text → numbers (embeddings)
# ============================================================
print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Embedding model loaded!")

# ============================================================
# CREATE CHROMADB CLIENT
# Runs locally on your laptop
# Stores in memory (or disk)
# ============================================================
chroma_client = chromadb.PersistentClient(
    path="C:/legal-chatbot/backend/chroma_db"
)


# Create collections (like tables in MySQL)
try:
    legal_qa_collection = chroma_client.create_collection(
        name="legal_qa",
        metadata={"hnsw:space": "cosine"}
    )
except:
    legal_qa_collection = chroma_client.get_collection("legal_qa")

try:
    ipc_collection = chroma_client.create_collection(
        name="ipc_sections",
        metadata={"hnsw:space": "cosine"}
    )
except:
    ipc_collection = chroma_client.get_collection("ipc_sections")

# ============================================================
# ADD DOCUMENTS TO VECTOR DB
# ============================================================
def add_legal_qa(texts, ids, metadatas):
    """Add legal Q&A to vector DB"""
    try:
        # Convert texts to embeddings (numbers)
        embeddings = model.encode(texts).tolist()
        
        legal_qa_collection.add(
            embeddings=embeddings,
            documents=texts,
            ids=ids,
            metadatas=metadatas
        )
        return True
    except Exception as e:
        print(f"Error adding to vector DB: {e}")
        return False

def add_ipc_sections(texts, ids, metadatas):
    """Add IPC sections to vector DB"""
    try:
        embeddings = model.encode(texts).tolist()
        ipc_collection.add(
            embeddings=embeddings,
            documents=texts,
            ids=ids,
            metadatas=metadatas
        )
        return True
    except Exception as e:
        print(f"Error adding IPC to vector DB: {e}")
        return False

# ============================================================
# SEARCH VECTOR DB BY MEANING
# ============================================================
def semantic_search_qa(query: str, n_results: int = 5, source: str = None):
    """
    Search legal Q&A by MEANING not keywords!
    
    Example:
    query = "what happens if someone kills"
    → finds IPC 302 murder section ✅
    
    Even with typos:
    query = "murdur punishment"  
    → still finds murder! ✅
    """
    try:
        # Convert question to numbers
        query_embedding = model.encode([query]).tolist()
        
        # Build filter
        where_filter = None
        if source:
            where_filter = {"source": source}
        
        # Search for similar documents
        results = legal_qa_collection.query(
            query_embeddings=query_embedding,
            n_results=n_results,
            where=where_filter
        )
        
        # Format results
        formatted = []
        for i, doc in enumerate(results['documents'][0]):
            formatted.append({
                "content": doc,
                "source": results['metadatas'][0][i].get('source', ''),
                "relevance_score": round(1 - results['distances'][0][i], 3)
            })
        
        return {
            "results": formatted,
            "search_type": "semantic",
            "query": query,
            "total_found": len(formatted)
        }
    except Exception as e:
        return {"error": str(e), "results": []}

def semantic_search_ipc(query: str, n_results: int = 3):
    """Search IPC sections by meaning"""
    try:
        query_embedding = model.encode([query]).tolist()
        
        results = ipc_collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )
        
        formatted = []
        for i, doc in enumerate(results['documents'][0]):
            formatted.append({
                "content": doc,
                "metadata": results['metadatas'][0][i],
                "relevance_score": round(1 - results['distances'][0][i], 3)
            })
        
        return {
            "results": formatted,
            "search_type": "semantic_ipc",
            "query": query
        }
    except Exception as e:
        return {"error": str(e), "results": []}

# ============================================================
# GET COLLECTION STATS
# ============================================================
def get_vector_db_stats():
    try:
        qa_count = legal_qa_collection.count()
        ipc_count = ipc_collection.count()
        return {
            "legal_qa_documents": qa_count,
            "ipc_documents": ipc_count,
            "total": qa_count + ipc_count,
            "status": "Vector DB Ready! ✅"
        }
    except Exception as e:
        return {"error": str(e)}
