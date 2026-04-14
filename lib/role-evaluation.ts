export const evaluatorTargets = {
  student: ["faculty"],
  chairperson: ["faculty"],
  dean: ["chairperson"],
  director: ["dean"],
  campus_director: ["director"],
} as const;

export type EvaluatorRole = keyof typeof evaluatorTargets;

export function isEvaluatorRole(role: string): role is EvaluatorRole {
  return role in evaluatorTargets;
}

export function getAllowedEvaluatedRoles(role: string) {
  if (!isEvaluatorRole(role)) {
    return [];
  }

  return [...evaluatorTargets[role]];
}

export function getEvaluationPortalCopy(role: string) {
  switch (role) {
    case "student":
      return {
        pageTitle: "Evaluate Instructor",
        pageDescription:
          "Share constructive feedback for instructors during the active evaluation period.",
        selectorLabel: "Which instructor would you like to evaluate?",
        emptyMessage: "No instructors are available to evaluate right now.",
        successTitle: "Evaluation Submitted Successfully!",
        successDescription:
          "Your feedback has been recorded and will help improve teaching quality.",
      };
    case "chairperson":
      return {
        pageTitle: "Evaluate Faculty",
        pageDescription: "Review faculty performance for the current academic cycle.",
        selectorLabel: "Which faculty member would you like to evaluate?",
        emptyMessage: "No faculty members are available to evaluate right now.",
        successTitle: "Faculty Evaluation Submitted!",
        successDescription: "Your faculty review has been saved successfully.",
      };
    case "dean":
      return {
        pageTitle: "Evaluate Chairperson",
        pageDescription: "Assess chairperson leadership and program coordination.",
        selectorLabel: "Which chairperson would you like to evaluate?",
        emptyMessage: "No chairpersons are available to evaluate right now.",
        successTitle: "Chairperson Evaluation Submitted!",
        successDescription: "Your chairperson review has been saved successfully.",
      };
    case "director":
      return {
        pageTitle: "Evaluate Dean",
        pageDescription: "Provide feedback on dean performance and academic leadership.",
        selectorLabel: "Which dean would you like to evaluate?",
        emptyMessage: "No deans are available to evaluate right now.",
        successTitle: "Dean Evaluation Submitted!",
        successDescription: "Your dean review has been saved successfully.",
      };
    case "campus_director":
      return {
        pageTitle: "Evaluate DOI",
        pageDescription: "Review the director of instruction's institutional performance and support.",
        selectorLabel: "Which DOI would you like to evaluate?",
        emptyMessage: "No DOI records are available to evaluate right now.",
        successTitle: "DOI Evaluation Submitted!",
        successDescription: "Your DOI review has been saved successfully.",
      };
    default:
      return {
        pageTitle: "Evaluation",
        pageDescription: "Complete an evaluation for the active academic year.",
        selectorLabel: "Select a user to evaluate",
        emptyMessage: "No users are available to evaluate right now.",
        successTitle: "Evaluation Submitted!",
        successDescription: "Your evaluation has been saved successfully.",
      };
  }
}
