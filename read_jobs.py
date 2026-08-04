import sqlite3, json

conn = sqlite3.connect(r'C:\Users\22ged\OneDrive\Desktop\TWENTY2CRM\crm-app\prisma\dev.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# List tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("TABLES:", tables)

# Find positions table
pos_table = next((t for t in tables if 'osition' in t or 'job' in t.lower() or 'Job' in t), None)
print("Positions table:", pos_table)

if pos_table:
    cur.execute(f"PRAGMA table_info({pos_table})")
    cols = [r[1] for r in cur.fetchall()]
    print("COLUMNS:", cols)
    
    # Get active positions
    cur.execute(f"SELECT * FROM {pos_table} LIMIT 200")
    rows = cur.fetchall()
    print(f"\nTotal positions: {len(rows)}\n")
    
    results = []
    for row in rows:
        d = dict(row)
        results.append(d)
    
    # Print key fields
    for r in results:
        title = r.get('title') or r.get('name', '')
        location = r.get('location') or r.get('city') or r.get('area', '')
        status = r.get('status') or r.get('isActive', '')
        employer = r.get('employerId') or r.get('employer', '')
        tags = r.get('tags') or r.get('keywords', '')
        print(f"  [{status}] {title} | מיקום: {location} | מעסיק: {employer}")

conn.close()
