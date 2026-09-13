const PAPER_SUFFIX = /\s+(?:1st|2nd|first|second)\s+paper\s*$/i;
const BANGLA_PAPER_SUFFIX = /\s*[১২][য়য়ম]?\s*পত্র\s*$/u;
const TWO_PAPER_SUBJECTS = new Set([
  "accounting", "bangla", "english", "physics", "chemistry", "biology", "higher mathematics", "statistics",
  "business organization and management", "finance, banking and insurance", "production management and marketing",
  "economics", "civics and good governance", "logic", "sociology", "social work", "history",
  "islamic history and culture", "islamic studies", "geography", "psychology", "agriculture studies", "home science",
  "arabic", "sanskrit", "pali", "quran majid", "hadith and usul al-hadith", "al-fiqh", "urdu", "persian",
]);
const CODE_OVERRIDES = new Map([
  ["accounting", "ACC"], ["bangla", "BAN"], ["english", "ENG"], ["mathematics", "MATH"],
  ["general science", "GSCI"], ["information and communication technology", "ICT"],
  ["bangladesh and global studies", "BGS"], ["physics", "PHY"], ["chemistry", "CHEM"],
  ["biology", "BIO"], ["higher mathematics", "HMATH"], ["statistics", "STAT"],
  ["business organization and management", "BOM"], ["finance, banking and insurance", "FBI"],
  ["production management and marketing", "PMM"], ["economics", "ECO"],
  ["civics and good governance", "CIVG"], ["logic", "LOGIC"], ["sociology", "SOC"],
  ["social work", "SWORK"], ["history", "HIST"], ["islamic history and culture", "ISHIST"],
  ["islamic studies", "ISST"], ["geography", "GEO"], ["psychology", "PSY"],
  ["agriculture studies", "AGRI"], ["home science", "HOME"], ["arabic", "ARAB"],
  ["sanskrit", "SANS"], ["pali", "PALI"], ["quran majid", "QURAN"],
  ["hadith and usul al-hadith", "HADITH"], ["al-fiqh", "FIQH"], ["urdu", "URDU"],
  ["persian", "FARSI"],
]);

const baseName = (value) => String(value || "").replace(PAPER_SUFFIX, "").trim();
const baseNameBn = (value) => String(value || "").replace(BANGLA_PAPER_SUFFIX, "").trim() || null;
const paperNo = (value) => /\s+(?:1st|first)\s+paper\s*$/i.test(String(value || "")) ? 1
  : /\s+(?:2nd|second)\s+paper\s*$/i.test(String(value || "")) ? 2 : 0;

function proposedCode(name) {
  const key = name.toLowerCase();
  if (CODE_OVERRIDES.has(key)) return CODE_OVERRIDES.get(key);
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
  const meaningful = words.filter((word) => !["AND", "OF", "THE", "FOR"].includes(word));
  if (meaningful.length > 1) return meaningful.map((word) => word[0]).join("").slice(0, 10);
  return (meaningful[0] || words[0] || "SUBJECT").slice(0, 12);
}

function uniqueCode(name, used) {
  const base = proposedCode(name);
  let code = base;
  let suffix = 2;
  while (used.has(code)) code = `${base}-${suffix++}`;
  used.add(code);
  return code;
}

export async function consolidateSubjectMaster(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const subjects = (await client.query("SELECT * FROM sms.subjects ORDER BY institution_id,subject_id")).rows;
    const groups = new Map();
    for (const subject of subjects) {
      const name = baseName(subject.subject_name);
      const key = `${subject.institution_id}:${name.toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, { institutionId: subject.institution_id, name, subjects: [] });
      groups.get(key).subjects.push({ ...subject, legacy_paper_no: paperNo(subject.subject_name) });
    }

    const usedByInstitution = new Map();
    for (const group of groups.values()) {
      if (!usedByInstitution.has(String(group.institutionId))) usedByInstitution.set(String(group.institutionId), new Set());
      const used = usedByInstitution.get(String(group.institutionId));
      const ordered = [...group.subjects].sort((a, b) => {
        const aBase = a.legacy_paper_no === 0 ? 0 : 1;
        const bBase = b.legacy_paper_no === 0 ? 0 : 1;
        return aBase - bBase || Number(a.subject_id) - Number(b.subject_id);
      });
      const canonical = ordered[0];
      const mode = TWO_PAPER_SUBJECTS.has(group.name.toLowerCase()) || ordered.some((subject) => subject.legacy_paper_no > 0 || ["TWO_PAPERS", "FLEXIBLE"].includes(subject.paper_mode)) ? "FLEXIBLE" : "SINGLE";
      const bn = ordered.map((subject) => baseNameBn(subject.subject_name_bn)).find(Boolean) || null;
      const curriculum = "ALL";
      const code = uniqueCode(group.name, used);

      for (const variant of ordered.slice(1)) {
        await client.query(
          "UPDATE sms.subjects SET subject_code=$1,subject_name=$2,subject_name_bn=$3,paper_mode=$4,canonical_subject_id=$5,status='INACTIVE' WHERE subject_id=$6",
          [`LEGACY-${variant.subject_id}`, group.name, bn, mode, canonical.subject_id, variant.subject_id]
        );
      }
      await client.query(
        "UPDATE sms.subjects SET subject_code=$1,subject_name=$2,subject_name_bn=$3,paper_mode=$4,canonical_subject_id=NULL,curriculum_type=$5,subject_type='MAIN' WHERE subject_id=$6",
        [code, group.name, bn, mode, curriculum, canonical.subject_id]
      );

      for (const variant of ordered) {
        const targetPaper = variant.legacy_paper_no || 0;
        const sourceId = variant.subject_id;
        for (const table of ["class_subjects", "exam_subjects", "student_result_details", "class_routines", "teacher_subject_assignments"]) {
          await client.query(`UPDATE sms.${table} SET paper_no=$1 WHERE subject_id=$2 AND (paper_no IS NULL OR paper_no=0)`, [targetPaper, sourceId]);
          if (Number(sourceId) !== Number(canonical.subject_id)) {
            await client.query(`UPDATE IGNORE sms.${table} SET subject_id=$1 WHERE subject_id=$2`, [canonical.subject_id, sourceId]);
          }
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
