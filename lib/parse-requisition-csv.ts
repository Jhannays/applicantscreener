import type { RequisitionCSVRow } from "@/lib/types";

/**
 * Parse a Workday / HRIS requisition CSV whose header spans TWO lines.
 *
 * Line 1 columns (1-7):
 *   Preferred.Years.Experience, Min.Years.Experience., Requisition.Number,
 *   Job.Qualifications, Certifications/Licenses.Preferred,
 *   Certifications/Licenses.Required., Degree.Type.Preferred
 *
 * Line 2 columns (8-14):
 *   Preferred.Experience.(Dataverse), Experience.Needed, Req.Identifier,
 *   Qualifications, Preferred.Certifications, Certification.needed,
 *   Education.needed
 *
 * Data rows follow from line 3 onward, each with 14 fields.
 * Blank = no posted requirement.
 */

/** Split a CSV line respecting quoted fields */
function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function blank(s: string | undefined): string | undefined {
  if (!s || s.trim() === "") return undefined;
  return s.trim();
}

export function parseRequisitionCSV(csvText: string): RequisitionCSVRow[] {
  // Normalize line endings
  const rawLines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // The header is 2 lines -- skip them
  // Line 1: cols 1-7 header names
  // Line 2: cols 8-14 header names
  // Data starts at line index 2

  if (rawLines.length < 3) return [];

  const rows: RequisitionCSVRow[] = [];

  for (let i = 2; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line.trim()) continue;

    // Each data line may span continuation lines if there are quoted newlines
    // We need to collect until we have 14 fields (or the quotes are balanced)
    let fullLine = line;
    while (countQuotes(fullLine) % 2 !== 0 && i + 1 < rawLines.length) {
      i++;
      fullLine += "\n" + rawLines[i];
    }

    const fields = splitCSVLine(fullLine);

    // We expect 14 fields; some CSVs may have fewer trailing fields
    const reqNum = blank(fields[2]);
    if (!reqNum) continue; // Skip rows without requisition number

    rows.push({
      preferredYearsExperience: blank(fields[0]),
      minYearsExperience: blank(fields[1]),
      requisitionNumber: reqNum,
      jobQualifications: blank(fields[3]),
      certificationsPreferred: blank(fields[4]),
      certificationsRequired: blank(fields[5]),
      degreeTypePreferred: blank(fields[6]),
      experienceDataverse: blank(fields[7]),
      experienceNeeded: blank(fields[8]),
      reqIdentifier: blank(fields[9]),
      qualifications: blank(fields[10]),
      preferredCertifications: blank(fields[11]),
      certificationNeeded: blank(fields[12]),
      educationNeeded: blank(fields[13]),
    });
  }

  return rows;
}

function countQuotes(s: string): number {
  let count = 0;
  for (const ch of s) {
    if (ch === '"') count++;
  }
  return count;
}
