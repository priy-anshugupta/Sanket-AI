"""Validate an entire observation upload before any database writes."""

import csv
import io


def parse_observation_csv(content: str) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(content.lstrip("\ufeff")), strict=True)
    try:
        headers = reader.fieldnames
        if not headers:
            raise ValueError("CSV is empty. Include a header and at least one observation.")
        headers = [header.strip().lower() for header in headers]
        if len(set(headers)) != len(headers) or "" in headers:
            raise ValueError("CSV column names must be unique and non-empty.")
        reader.fieldnames = headers
        text_columns = [name for name in ("text", "description", "narrative") if name in headers]
        if not text_columns:
            raise ValueError("CSV requires a text, description, or narrative column.")
        rows = []
        for row in reader:
            line = reader.line_num
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f"CSV row at line {line} does not match the header columns.")
            row = {key: value.strip() for key, value in row.items()}
            if not any(row.values()):
                continue
            text = next((row[name] for name in text_columns if row[name]), "")
            if not 3 <= len(text) <= 10000:
                raise ValueError(f"Observation at line {line} must contain 3–10,000 characters.")
            for field in ("location", "asset_id", "equipment", "activity_type", "activity"):
                if len(row.get(field, "")) > 255:
                    raise ValueError(f"{field} at line {line} exceeds 255 characters.")
            if len(row.get("shift", "")) > 50:
                raise ValueError(f"shift at line {line} exceeds 50 characters.")
            row["text"] = text
            rows.append(row)
            if len(rows) > 500:
                raise ValueError("CSV exceeds 500 observations. Split it into smaller files; nothing was imported.")
    except csv.Error as error:
        raise ValueError(f"Malformed CSV near line {reader.line_num}: {error}") from error
    if not rows:
        raise ValueError("CSV contains no observations.")
    return rows
