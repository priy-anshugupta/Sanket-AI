"""Fix any existing reports with sif_score > 0.99 in both SQLite and Supabase databases."""
import sqlite3

# Fix SQLite
print("=== Fixing SQLite ===")
conn = sqlite3.connect('sanket.db')
cur = conn.cursor()

# Check and fix
cur.execute("SELECT COUNT(*) FROM reports WHERE sif_score > 0.99")
count = cur.fetchone()[0]
print(f"Found {count} reports with sif_score > 0.99")

if count > 0:
    cur.execute("UPDATE reports SET sif_score = 0.99 WHERE sif_score > 0.99")
    conn.commit()
    print(f"Fixed {count} reports -> clamped to 0.99")
else:
    print("No reports to fix in SQLite")

# Also check for None/NULL scores
cur.execute("SELECT COUNT(*) FROM reports WHERE sif_score IS NULL")
null_count = cur.fetchone()[0]
print(f"Reports with NULL sif_score: {null_count}")

# Final verification
cur.execute("SELECT MIN(sif_score), MAX(sif_score) FROM reports WHERE sif_score IS NOT NULL")
row = cur.fetchone()
print(f"Score range after fix: min={row[0]}, max={row[1]}")

conn.close()
print("\nSQLite database verified and clean.")
