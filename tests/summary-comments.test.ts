import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import {
  buildSummaryCommentRecords,
  filterSummaryCommentRecords,
  filterInstructorCommentRecords,
  groupSummaryCommentRecordsByInstructor,
  paginateInstructorGroups,
  paginateSummaryCommentRecords,
} from "../lib/summary-comments.ts";
import {
  buildAccessibleResultsUserWhere,
  getResultsAccessContext,
} from "../lib/results-access.ts";
import {
  hashPassword,
  looksLikeBcryptHash,
  verifyPassword,
} from "../lib/password-auth.ts";
import {
  getScheduleAvailabilityMessage,
  getScheduleAvailabilityStatus,
  SEMESTER_OPTIONS,
} from "../lib/schedule-config.ts";
import { getErrorMessage } from "../lib/error-message.ts";
import { resolveStaffRoleSelection, staffRoleOptions } from "../lib/staff-roles.ts";

const tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];

function runTest(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function buildFixtureRecords() {
  return buildSummaryCommentRecords([
    {
      id: 11,
      academicYear: "2025-2026",
      semester: "1st Semester",
      createdAt: "2026-04-28T10:00:00.000Z",
      generalComment: "Sanaol Magaling",
      evaluated: {
        id: 7,
        name: "Charny Marie Bayonas",
        email: "charny@bisu.edu.ph",
      },
      answers: [{ id: 101, comment: null }],
    },
    {
      id: 12,
      academicYear: "2025-2026",
      semester: "1st Semester",
      createdAt: "2026-04-28T09:00:00.000Z",
      generalComment: null,
      evaluated: {
        id: 8,
        name: "Arnel John Soriso",
        email: "arnel@bisu.edu.ph",
      },
      answers: [{ id: 102, comment: "ok" }],
    },
    {
      id: 13,
      academicYear: "2024-2025",
      semester: "2nd Semester",
      createdAt: "2025-11-20T09:00:00.000Z",
      generalComment: "Previous year note",
      evaluated: {
        id: 7,
        name: "Charny Marie Bayonas",
        email: "charny@bisu.edu.ph",
      },
      answers: [],
    },
  ]);
}

runTest("staff role options keep readable labels and backend enum values", () => {
  assert.deepEqual(staffRoleOptions, [
    { label: "Faculty", value: "faculty" },
    { label: "Chairperson", value: "chairperson" },
    { label: "Dean", value: "dean" },
    { label: "Director", value: "director" },
    { label: "Campus Director", value: "campus_director" },
    { label: "Secretary", value: "secretary" },
  ]);

  assert.equal(resolveStaffRoleSelection("Faculty"), "faculty");
  assert.equal(resolveStaffRoleSelection("campus_director"), "campus_director");
  assert.equal(resolveStaffRoleSelection("Secretary"), "secretary");
});

runTest("staff login error mapping keeps the role message user-friendly", () => {
  assert.equal(
    getErrorMessage(
      'Invalid option: expected one of "faculty"|"chairperson"|"dean"|"director"|"campus_director"|"secretary"'
    ),
    "Please select a role."
  );
});

runTest("semester options support the configured academic terms", () => {
  assert.deepEqual(SEMESTER_OPTIONS, ["1st Semester", "2nd Semester"]);
});

runTest("schedule availability reports ended periods with a clear message", () => {
  const status = getScheduleAvailabilityStatus({
    isOpen: true,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-01-31T23:59:59.000Z"),
  }, new Date("2026-02-01T00:00:00.000Z"));

  assert.equal(status, "ended");
  assert.equal(
    getScheduleAvailabilityMessage(status),
    "The evaluation period has ended. You can no longer submit an evaluation."
  );
});

runTest("Charny Marie Bayonas comments appear when academic year and semester match", () => {
  const records = buildFixtureRecords().filter(
    (record) =>
      record.academic_year === "2025-2026" && record.semester === "1st Semester"
  );

  assert.equal(records.length, 2);
  assert.ok(
    records.some(
      (record) =>
        record.instructor_name === "Charny Marie Bayonas" &&
        record.comment === "Sanaol Magaling"
    )
  );
});

runTest("search filters comments by instructor name case-insensitively and partially", () => {
  const filtered = filterSummaryCommentRecords(buildFixtureRecords(), "charny marie");

  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((record) => record.instructor_name === "Charny Marie Bayonas"));
});

runTest("empty search returns all instructors with comments and keeps pagination count accurate", () => {
  const filtered = filterSummaryCommentRecords(buildFixtureRecords(), "");
  const pageOne = paginateSummaryCommentRecords(filtered, 1, 2);
  const pageTwo = paginateSummaryCommentRecords(filtered, 2, 2);

  assert.equal(new Set(filtered.map((record) => record.instructor_name)).size, 2);
  assert.deepEqual(
    pageOne.map((record) => record.anonymous_number),
    [1, 2]
  );
  assert.deepEqual(
    pageTwo.map((record) => record.anonymous_number),
    [3]
  );
});

runTest("default view groups comments by instructor for the selected year and semester", () => {
  const records = buildFixtureRecords().filter(
    (record) =>
      record.academic_year === "2025-2026" && record.semester === "1st Semester"
  );
  const groups = groupSummaryCommentRecordsByInstructor(records);

  assert.deepEqual(groups, [
    {
      instructor_id: 8,
      instructor_name: "Arnel John Soriso",
      academic_year: "2025-2026",
      semester: "1st Semester",
      total_comments: 1,
    },
    {
      instructor_id: 7,
      instructor_name: "Charny Marie Bayonas",
      academic_year: "2025-2026",
      semester: "1st Semester",
      total_comments: 1,
    },
  ]);
});

runTest("detail search filters within the selected instructor comments only", () => {
  const records = buildSummaryCommentRecords([
    {
      id: 21,
      academicYear: "2025-2026",
      semester: "1st Semester",
      createdAt: "2026-04-28T10:00:00.000Z",
      generalComment: "Sanaol Magaling",
      evaluated: {
        id: 7,
        name: "Charny Marie Bayonas",
        email: "charny@bisu.edu.ph",
      },
      answers: [{ id: 201, comment: "Needs clearer examples" }],
    },
    {
      id: 22,
      academicYear: "2025-2026",
      semester: "1st Semester",
      createdAt: "2026-04-28T09:00:00.000Z",
      generalComment: "Excellent pacing",
      evaluated: {
        id: 8,
        name: "Arnel John Soriso",
        email: "arnel@bisu.edu.ph",
      },
      answers: [],
    },
  ]);

  const filtered = filterInstructorCommentRecords(records, 7, "clearer");

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.instructor_name, "Charny Marie Bayonas");
  assert.equal(filtered[0]?.comment, "Needs clearer examples");
});

runTest("instructor list pagination stays accurate after grouping", () => {
  const groups = paginateInstructorGroups(
    groupSummaryCommentRecordsByInstructor(buildFixtureRecords()),
    1,
    1
  );

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.instructor_name, "Arnel John Soriso");
});

runTest("grouped targets show All Semesters when comments span multiple semesters", () => {
  const groups = groupSummaryCommentRecordsByInstructor(
    buildSummaryCommentRecords([
      {
        id: 31,
        academicYear: "2025-2026",
        semester: "1st Semester",
        createdAt: "2026-04-28T10:00:00.000Z",
        generalComment: "Great leadership",
        evaluated: {
          id: 15,
          name: "Sample Chairperson",
          email: "chair@bisu.edu.ph",
        },
        answers: [],
      },
      {
        id: 32,
        academicYear: "2025-2026",
        semester: "2nd Semester",
        createdAt: "2026-04-20T10:00:00.000Z",
        generalComment: "Consistent support",
        evaluated: {
          id: 15,
          name: "Sample Chairperson",
          email: "chair@bisu.edu.ph",
        },
        answers: [],
      },
    ])
  );

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.semester, "All Semesters");
  assert.equal(groups[0]?.total_comments, 2);
});

runTest("DOI access allows own results and dean results only", () => {
  const context = getResultsAccessContext({
    user: {
      id: "41",
      role: "director",
      email: "doi@bisu.edu.ph",
      department: "Main Campus",
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(context);
  assert.deepEqual(buildAccessibleResultsUserWhere(context!), {
    deletedAt: null,
    OR: [{ id: 41 }, { role: "dean" }],
  });
});

runTest("dean access allows own results and chairpersons within the same scope", () => {
  const context = getResultsAccessContext({
    user: {
      id: "12",
      role: "dean",
      email: "dean@bisu.edu.ph",
      department: "College of Teacher Education, CTE",
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(context);
  assert.deepEqual(buildAccessibleResultsUserWhere(context!), {
    deletedAt: null,
    OR: [
      { id: 12 },
      {
        role: "chairperson",
        OR: [
          { department: { contains: "College of Teacher Education" } },
          { department: { contains: "CTE" } },
        ],
      },
    ],
  });
});

runTest("chairperson access allows own results and faculty within the same department", () => {
  const context = getResultsAccessContext({
    user: {
      id: "77",
      role: "chairperson",
      email: "chair@bisu.edu.ph",
      department: "BSCS",
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(context);
  assert.deepEqual(buildAccessibleResultsUserWhere(context!), {
    deletedAt: null,
    OR: [{ id: 77 }, { role: "faculty", OR: [{ department: { contains: "BSCS" } }] }],
  });
});

runTest("faculty access allows own results only", () => {
  const context = getResultsAccessContext({
    user: {
      id: "9",
      role: "faculty",
      email: "faculty@bisu.edu.ph",
      department: "BSIT",
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(context);
  assert.deepEqual(buildAccessibleResultsUserWhere(context!), {
    deletedAt: null,
    OR: [{ id: 9 }],
  });
});

runTest("campus director and secretary access can expand to all visible results", () => {
  const campusDirectorContext = getResultsAccessContext({
    user: {
      id: "5",
      role: "campus_director",
      email: "cd@bisu.edu.ph",
      department: null,
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });
  const secretaryContext = getResultsAccessContext({
    user: {
      id: "6",
      role: "secretary",
      email: "sec@bisu.edu.ph",
      department: null,
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(campusDirectorContext);
  assert.ok(secretaryContext);
  assert.deepEqual(buildAccessibleResultsUserWhere(campusDirectorContext!), {
    deletedAt: null,
  });
  assert.deepEqual(buildAccessibleResultsUserWhere(secretaryContext!), {
    deletedAt: null,
  });
  assert.deepEqual(
    buildAccessibleResultsUserWhere(campusDirectorContext!, {
      includeOwn: true,
      includeSubordinate: true,
      restrictToRoles: ["faculty", "dean", "director", "chairperson"],
    }),
    {
      deletedAt: null,
      OR: [{ role: { in: ["faculty", "dean", "director", "chairperson"] } }],
    }
  );
  assert.deepEqual(
    buildAccessibleResultsUserWhere(secretaryContext!, {
      includeOwn: true,
      includeSubordinate: true,
      restrictToRoles: ["faculty", "dean", "director", "chairperson"],
    }),
    {
      deletedAt: null,
      OR: [{ role: { in: ["faculty", "dean", "director", "chairperson"] } }],
    }
  );
});

runTest("secretary full-scope access includes all non-deleted visible users", () => {
  const secretaryContext = getResultsAccessContext({
    user: {
      id: "6",
      role: "secretary",
      email: "sec@bisu.edu.ph",
      department: null,
      mustChangePassword: false,
    },
    expires: "2099-01-01T00:00:00.000Z",
  });

  assert.ok(secretaryContext);
  assert.deepEqual(buildAccessibleResultsUserWhere(secretaryContext!), {
    deletedAt: null,
  });
});

runTest("newly created passwords are stored as bcrypt hashes", async () => {
  const hashedPassword = await hashPassword("Password123");

  assert.equal(looksLikeBcryptHash(hashedPassword), true);
  assert.equal(await bcrypt.compare("Password123", hashedPassword), true);
});

runTest("password verification supports hashed passwords", async () => {
  const hashedPassword = await bcrypt.hash("SecurePass123", 10);
  const result = await verifyPassword("SecurePass123", hashedPassword);

  assert.deepEqual(result, {
    isValid: true,
    shouldRehash: false,
  });
});

runTest("password verification upgrades legacy plain-text passwords", async () => {
  const result = await verifyPassword("LegacyPass123", "LegacyPass123");

  assert.deepEqual(result, {
    isValid: true,
    shouldRehash: true,
  });
});

async function main() {
  for (const test of tests) {
    try {
      await test.fn();
      console.log(`PASS ${test.name}`);
    } catch (error) {
      console.error(`FAIL ${test.name}`);
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
