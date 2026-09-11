"""Quick audit of SIF scores in the database."""
import sqlite3

conn = sqlite3.connect('sanket.db')
cur = conn.cursor()

# Check the H2S report
cur.execute("SELECT id, sif_score, sif_label, iogp_rule FROM reports WHERE raw_text LIKE '%H2S smell%' OR raw_text LIKE '%h2s smell%' ORDER BY created_at DESC LIMIT 5")
rows = cur.fetchall()
print(f"H2S smell reports: {len(rows)}")
for r in rows:
    print(f"  ID={r[0][:16]}... score={r[1]} label={r[2]} rule={r[3]}")

# Check all reports with score >= 1.0
cur.execute("SELECT COUNT(*) FROM reports WHERE sif_score >= 1.0")
print(f"\nReports with score >= 1.0: {cur.fetchone()[0]}")

# Check score distribution
cur.execute("SELECT MIN(sif_score), MAX(sif_score), AVG(sif_score) FROM reports WHERE sif_score IS NOT NULL")
row = cur.fetchone()
print(f"Score range: min={row[0]}, max={row[1]}, avg={row[2]:.4f}" if row[2] else "No scores")

# Find the specific report from screenshot
cur.execute("SELECT id, sif_score, sif_label, iogp_rule FROM reports WHERE raw_text LIKE '%H2S smell detected near cellar pit%' ORDER BY created_at DESC LIMIT 5")
rows = cur.fetchall()
print(f"\nExact H2S cellar pit reports:")
for r in rows:
    print(f"  ID={r[0]} score={r[1]} label={r[2]} rule={r[3]}")

# Check top 10 highest scores
cur.execute("SELECT id, sif_score, sif_label, substr(raw_text, 1, 60) FROM reports ORDER BY sif_score DESC LIMIT 10")
rows = cur.fetchall()
print(f"\nTop 10 highest SIF scores:")
for r in rows:
    print(f"  score={r[1]} label={r[2]} text='{r[3]}...'")

# Count by label
cur.execute("SELECT sif_label, COUNT(*) FROM reports GROUP BY sif_label")
rows = cur.fetchall()
print(f"\nLabel distribution:")
for r in rows:
    print(f"  {r[0]}: {r[1]}")

conn.close()
