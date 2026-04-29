export type SummaryCommentRecord = {
  id: string;
  anonymous_number: number;
  comment: string;
  instructor_id: number;
  instructor_name: string;
  instructor_role: string | null;
  department_id: string | null;
  college_id: string | null;
  academic_year: string;
  semester: string;
  created_at: string;
};

export type SummaryCommentInstructorGroup = {
  instructor_id: number;
  instructor_name: string;
  academic_year: string;
  semester: string;
  total_comments: number;
};

type EvaluationCommentSource = {
  id: number;
  academicYear: string;
  semester: string;
  createdAt: Date | string;
  generalComment: string | null;
  evaluated: {
    id: number;
    name: string | null;
    email: string;
    role?: string | null;
    department?: string | null;
  };
  answers: Array<{
    id: number;
    comment: string | null;
  }>;
};

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function buildCommentRecord(params: {
  id: string;
  comment: string;
  instructorId: number;
  instructorName: string;
  instructorRole?: string | null;
  departmentId?: string | null;
  collegeId?: string | null;
  academicYear: string;
  semester: string;
  createdAt: Date | string;
}) {
  return {
    id: params.id,
    anonymous_number: 0,
    comment: params.comment,
    instructor_id: params.instructorId,
    instructor_name: params.instructorName,
    instructor_role: params.instructorRole ?? null,
    department_id: params.departmentId ?? null,
    college_id: params.collegeId ?? null,
    academic_year: params.academicYear,
    semester: params.semester,
    created_at:
      params.createdAt instanceof Date ? params.createdAt.toISOString() : params.createdAt,
  };
}

export function buildSummaryCommentRecords(evaluations: EvaluationCommentSource[]) {
  return evaluations
    .flatMap((evaluation) => {
      const instructorName = evaluation.evaluated.name || evaluation.evaluated.email;
      const records: SummaryCommentRecord[] = [];

      if (evaluation.generalComment?.trim()) {
        records.push(
          buildCommentRecord({
            id: `evaluation-${evaluation.id}-general`,
            comment: evaluation.generalComment.trim(),
            instructorId: evaluation.evaluated.id,
            instructorName,
            instructorRole: evaluation.evaluated.role,
            departmentId: evaluation.evaluated.department ?? null,
            collegeId: evaluation.evaluated.department ?? null,
            academicYear: evaluation.academicYear,
            semester: evaluation.semester,
            createdAt: evaluation.createdAt,
          })
        );
      }

      for (const answer of evaluation.answers) {
        if (!answer.comment?.trim()) {
          continue;
        }

        records.push(
          buildCommentRecord({
            id: `answer-${answer.id}`,
            comment: answer.comment.trim(),
            instructorId: evaluation.evaluated.id,
            instructorName,
            instructorRole: evaluation.evaluated.role,
            departmentId: evaluation.evaluated.department ?? null,
            collegeId: evaluation.evaluated.department ?? null,
            academicYear: evaluation.academicYear,
            semester: evaluation.semester,
            createdAt: evaluation.createdAt,
          })
        );
      }

      return records;
    })
    .sort((left, right) => {
      const createdAtDelta =
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

      if (createdAtDelta !== 0) {
        return createdAtDelta;
      }

      const instructorDelta = left.instructor_name.localeCompare(right.instructor_name);
      if (instructorDelta !== 0) {
        return instructorDelta;
      }

      return left.id.localeCompare(right.id);
    });
}

export function filterSummaryCommentRecords(records: SummaryCommentRecord[], searchTerm: string) {
  const normalizedSearch = normalizeSearchValue(searchTerm);

  if (!normalizedSearch) {
    return records;
  }

  return records.filter((record) =>
    normalizeSearchValue(record.instructor_name).includes(normalizedSearch)
  );
}

export function filterInstructorCommentRecords(
  records: SummaryCommentRecord[],
  instructorId: number,
  commentSearchTerm: string
) {
  const normalizedCommentSearch = normalizeSearchValue(commentSearchTerm);

  return records.filter((record) => {
    if (record.instructor_id !== instructorId) {
      return false;
    }

    if (!normalizedCommentSearch) {
      return true;
    }

    return normalizeSearchValue(record.comment).includes(normalizedCommentSearch);
  });
}

export function groupSummaryCommentRecordsByInstructor(records: SummaryCommentRecord[]) {
  const grouped = new Map<number, SummaryCommentInstructorGroup>();
  const academicYearLabel = records[0]?.academic_year || "";
  const semesterSet = new Set(records.map((record) => record.semester));
  const semesterLabel =
    semesterSet.size === 1 ? records[0]?.semester || "" : "All Semesters";

  for (const record of records) {
    const key = record.instructor_id;
    const current = grouped.get(key);

    if (current) {
      current.total_comments += 1;
      continue;
    }

    grouped.set(key, {
      instructor_id: record.instructor_id,
      instructor_name: record.instructor_name,
      academic_year: academicYearLabel,
      semester: semesterLabel,
      total_comments: 1,
    });
  }

  return Array.from(grouped.values()).sort((left, right) => {
    const instructorDelta = left.instructor_name.localeCompare(right.instructor_name);
    if (instructorDelta !== 0) {
      return instructorDelta;
    }

    const yearDelta = right.academic_year.localeCompare(left.academic_year);
    if (yearDelta !== 0) {
      return yearDelta;
    }

    return left.semester.localeCompare(right.semester);
  });
}

export function paginateInstructorGroups(
  instructors: SummaryCommentInstructorGroup[],
  page: number,
  pageSize: number
) {
  const startIndex = Math.max(page - 1, 0) * pageSize;
  return instructors.slice(startIndex, startIndex + pageSize);
}

export function paginateSummaryCommentRecords(
  records: SummaryCommentRecord[],
  page: number,
  pageSize: number
) {
  const startIndex = Math.max(page - 1, 0) * pageSize;

  return records.slice(startIndex, startIndex + pageSize).map((record, index) => ({
    ...record,
    anonymous_number: startIndex + index + 1,
  }));
}
