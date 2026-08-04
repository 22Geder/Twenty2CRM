import sqlite3

DB_PATH = r'C:\Users\22ged\OneDrive\קונן C מחשב קטן\Twenty2CRM-Data\database.db'

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get all positions with employers
cur.execute("""
    SELECT p.id, p.title, p.location, p.active, p.keywords, p.employmentType, p.priority, p.openings,
           e.name as employer_name, e.id as employer_id
    FROM Position p
    LEFT JOIN Employer e ON p.employerId = e.id
    ORDER BY p.active DESC, e.name
""")
rows = cur.fetchall()
print(f'Total positions: {len(rows)}')
print(f'{"Status":<8} {"Employer":<25} {"Title":<35} {"Location":<20}')
print("-"*90)
for r in rows:
    status = "ACTIVE" if r['active'] else "inactive"
    employer = (r['employer_name'] or '')[:24]
    title = (r['title'] or '')[:34]
    location = (r['location'] or '')[:19]
    print(f"{status:<8} {employer:<25} {title:<35} {location:<20}")

print("\n=== ACTIVE ONLY ===")
active = [r for r in rows if r['active']]
print(f"Active positions: {len(active)}")
for r in active:
    print(f"  [{r['employer_name']}] {r['title']} | Location: {r['location']} | Type: {r['employmentType']}")

conn.close()
