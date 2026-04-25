export const OFFICIAL_QUESTIONNAIRE = [
  {
    category: "A. Commitment",
    questions: [
      "Demonstrate sensitivity to students' ability to attend and absorb content information.",
      "Integrates sensitivity in his/her learning objectives with those of the students in a collaborative process.",
      "Makes self-available to students beyond official time.",
      "Regularly comes to class on time, well-groomed and well-prepared to complete assigned responsibilities.",
      "Keeps accurate records of students' performance and prompt submission of the same.",
    ],
  },
  {
    category: "B. Knowledge of Subject",
    questions: [
      "Demonstrates mastery of the subject matter (explains the subject matter without relying solely on the prescribed textbook).",
      "Draws and shares information on the state-of-the-art theory and practice in his/her discipline.",
      "Integrates subject to practical circumstances and learning intents/purposes of students.",
      "Explains the relevance of present topics to previous lessons, and relates the subject matter to relevant current issues and/or daily life activities.",
      "Demonstrates up-to-date knowledge and/or awareness on current trends and issues of the subject.",
    ],
  },
  {
    category: "C. Teaching for Independent Learning",
    questions: [
      "Creates teaching strategies that allow students to practice using concepts they need to understand (interactive discussion).",
      "Enhances students' self-esteem and/or gives due recognition to students' performance/potentials.",
      "Allows students to create their own course objectives, realistically define the student-professor rules, and make them accountable for their performance.",
      "Allows students to think independently and make their own decisions, while holding them accountable for their performance based largely on their success in executing decisions.",
      "Encourages students to learn beyond what is required and helps guide them on how to apply the concepts learned.",
    ],
  },
  {
    category: "D. Management of Learning",
    questions: [
      "Creates opportunities for intensive and/or extensive contribution of students in class activities (e.g., breaks class into dyads or buzz/task groups).",
      "Assumes roles as facilitator, resource person, coach, inquisitor, integrator, and referee in making students contribute to knowledge and understanding of the concepts at hand.",
      "Designs and implements learning conditions and experiences that promote healthy exchange and/or confrontation.",
      "Structures and restructures the teaching-learning context to enhance attainment of collective learning objectives.",
      "Uses instructional materials (video materials, filmstrips, film showing, computer-aided instruction, etc.) to reinforce the learning process.",
    ],
  },
] as const;

export const PERFORMANCE_RATING_SCALE = [
  { value: 5, label: "Outstanding", description: "Performance almost exceeds the job requirements." },
  { value: 4, label: "Very Satisfactory", description: "Performance meets and often exceeds the job requirements." },
  { value: 3, label: "Satisfactory", description: "Performance meets job requirements." },
  { value: 2, label: "Fair", description: "Performance needs some development to meet job requirements." },
  { value: 1, label: "Poor", description: "Faculty fails to meet job requirements." },
] as const;

export function groupQuestionsByCategory<T extends { category?: string | null }>(questions: T[]) {
  const grouped = new Map<string, T[]>();

  for (const question of questions) {
    const category = question.category?.trim() || "Uncategorized";
    const bucket = grouped.get(category);

    if (bucket) {
      bucket.push(question);
    } else {
      grouped.set(category, [question]);
    }
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}
