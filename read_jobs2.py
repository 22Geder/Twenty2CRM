import sqlite3, json

conn = sqlite3.connect(r'C:\Twenty2CRM-Data\database.db')
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
print(f"סה\"כ משרות: {len(rows)}\n")
print(f"{'סטטוס':<8} {'מעסיק':<25} {'תפקיד':<35} {'מיקום':<20}")
print("-"*90)
for r in rows:
    status = "פעיל" if r['active'] else "לא פעיל"
    employer = (r['employer_name'] or '')[:24]
    title = (r['title'] or '')[:34]
    location = (r['location'] or '')[:19]
    print(f"{status:<8} {employer:<25} {title:<35} {location:<20}")

print(f"\n--- רק פעילים ---")
active = [r for r in rows if r['active']]
print(f"משרות פעילות: {len(active)}")
for r in active:
    print(f"  [{r['employer_name']}] {r['title']} | מיקום: {r['location']} | סוג: {r['employmentType']}")

conn.close()
