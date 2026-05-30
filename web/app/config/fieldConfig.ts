export const DEFAULT_IGNORED_FIELDS = ["id", "position", "createdAt", "updatedAt"];

const fieldConfig: Record<string, Record<string, Record<string, any>>> = {
  user: {
    accounts: {
      relationType: "child",
    },
    sessions: {
      relationType: "child",
    },
    passwordResets: {
      relationType: "child",
    },
  },
};

export const tableConfig: Record<string, { ignoredFields?: string[] }> = {};

export default fieldConfig;
