import sys
import os

# Add backend folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import run_query
from vector_db import add_legal_qa, add_ipc_sections, get_vector_db_stats

print("="*50)
print("🚀 Loading Legal Data into Vector DB")
print("="*50)

# ============================================================
# LOAD LEGAL Q&A INTO VECTOR DB
# ============================================================
print("\n📚 Loading Legal Q&A...")

try:
    # Get all Q&A from MySQL
    qa_data = run_query("SELECT * FROM legal_qa LIMIT 2000")
    
    if qa_data:
        texts = []
        ids = []
        metadatas = []
        
        for row in qa_data:
            # Combine question + answer for better search
            text = f"Q: {row['question']} A: {row['answer']}"
            texts.append(text[:500])  # limit length
            ids.append(f"qa_{row['id']}")
            metadatas.append({
                "source": str(row['source']),
                "question": str(row['question'])[:100]
            })
        
        # Add in batches of 100
        batch_size = 100
        total_added = 0
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            batch_metadatas = metadatas[i:i+batch_size]
            
            success = add_legal_qa(batch_texts, batch_ids, batch_metadatas)
            if success:
                total_added += len(batch_texts)
                print(f"  ✅ Added batch {i//batch_size + 1}: {total_added} documents")
        
        print(f"✅ Legal Q&A loaded: {total_added} documents!")
    else:
        print("❌ No Q&A data found in MySQL!")

except Exception as e:
    print(f"❌ Error loading Q&A: {e}")

# ============================================================
# LOAD IPC SECTIONS INTO VECTOR DB
# ============================================================
print("\n⚖️ Loading IPC Sections...")

try:
    ipc_data = run_query("SELECT * FROM ipc_sections")
    
    if ipc_data:
        texts = []
        ids = []
        metadatas = []
        
        for row in ipc_data:
            text = f"IPC Section {row['section_number']}: {row['offense']} Punishment: {row['punishment']}"
            texts.append(text[:500])
            ids.append(f"ipc_{row['id']}")
            metadatas.append({
                "section": str(row['section_number']),
                "offense": str(row['offense'])[:100]
            })
        
        success = add_ipc_sections(texts, ids, metadatas)
        if success:
            print(f"✅ IPC Sections loaded: {len(texts)} documents!")
    else:
        print("⚠️ No IPC sections in MySQL, skipping...")

except Exception as e:
    print(f"❌ Error loading IPC: {e}")

# ============================================================
# LOAD CONSTITUTION INTO VECTOR DB
# ============================================================
print("\n🏛️ Loading Constitution...")

try:
    const_data = run_query("SELECT * FROM constitution_articles LIMIT 500")
    
    if const_data:
        texts = []
        ids = []
        metadatas = []
        
        for row in const_data:
            text = f"Constitution {row['article_id']}: {row['article_desc']}"
            texts.append(text[:500])
            ids.append(f"const_{row['id']}")
            metadatas.append({
                "source": "constitution",
                "article": str(row['article_id'])[:50]
            })
        
        success = add_legal_qa(texts, ids, metadatas)
        if success:
            print(f"✅ Constitution loaded: {len(texts)} documents!")

except Exception as e:
    print(f"❌ Error loading Constitution: {e}")

# ============================================================
# FINAL STATS
# ============================================================
print("\n" + "="*50)
print("📊 Vector DB Stats:")
stats = get_vector_db_stats()
for key, value in stats.items():
    print(f"  {key}: {value}")
print("="*50)
print("\n🎉 Vector DB is ready!")
print("Now restart your backend: python main.py")
